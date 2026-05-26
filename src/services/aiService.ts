import axios, { AxiosError, type AxiosInstance } from 'axios';
import { File } from 'expo-file-system';

import type {
  CategoryId,
  InterviewFeedback,
  InterviewQuestion,
  QuestionDifficulty,
} from '../types';

const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_MODEL = 'gemini-2.5-flash';

const DEFAULT_TIMEOUT_MS = 30_000;

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 800;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const CATEGORY_TOPIC: Record<CategoryId, string> = {
  'react-native': 'React Native and the React ecosystem',
  hr: 'behavioral and HR competency',
  dsa: 'data structures and algorithms',
  'system-design': 'system design and software architecture',
};

export class GeminiServiceError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, options?: { status?: number; details?: unknown }) {
    super(message);
    this.name = 'GeminiServiceError';
    this.status = options?.status;
    this.details = options?.details;
  }
}

interface GeminiSchema {
  type: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  items?: GeminiSchema;
  minimum?: number;
  maximum?: number;
}

interface GeminiInlineData {
  mimeType: string;
  data: string;
}

interface GeminiContentPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

interface GeminiContent {
  role?: 'user' | 'model';
  parts: GeminiContentPart[];
}

interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'application/json' | 'text/plain';
  responseSchema?: GeminiSchema;
}

interface GeminiRequestBody {
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
  systemInstruction?: GeminiContent;
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: unknown;
  };
}

interface GeminiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export interface GenerateQuestionsInput {
  categoryId: CategoryId;
  difficulty: QuestionDifficulty;
  count?: number;
  focusAreas?: string[];
}

export interface EvaluateAnswerInput {
  categoryId: CategoryId;
  question: InterviewQuestion;
  answer: string;
}

export interface SessionQA {
  question: string;
  answer: string;
}

export interface EvaluateSessionInput {
  categoryId: CategoryId;
  difficulty: QuestionDifficulty;
  qa: SessionQA[];
  durationMs?: number;
}

export interface TranscribeAudioInput {
  uri: string;
  mimeType?: string;
  questionPrompt?: string;
}

const QUESTIONS_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Stable kebab-case id' },
          prompt: { type: 'string', description: 'The interview question' },
          difficulty: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
          },
        },
        required: ['id', 'prompt', 'difficulty'],
      },
    },
  },
  required: ['questions'],
};

const FEEDBACK_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } },
    subscores: {
      type: 'object',
      properties: {
        technical: { type: 'integer', minimum: 0, maximum: 100 },
        communication: { type: 'integer', minimum: 0, maximum: 100 },
        confidence: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['technical', 'communication', 'confidence'],
    },
  },
  required: ['score', 'summary', 'strengths', 'improvements', 'subscores'],
};

const MAX_INLINE_AUDIO_BYTES = 14 * 1024 * 1024;

const getApiKey = (): string => {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new GeminiServiceError(
      'Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to your .env and restart Expo.',
    );
  }
  return key;
};

const getModel = (): string =>
  process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || DEFAULT_MODEL;

let cachedClient: AxiosInstance | null = null;

const getClient = (): AxiosInstance => {
  if (cachedClient) return cachedClient;
  cachedClient = axios.create({
    baseURL: GEMINI_BASE_URL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });
  return cachedClient;
};

const extractJson = (response: GeminiResponse): unknown => {
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new GeminiServiceError(
      `Gemini blocked the response: ${blockReason}`,
      { details: response.promptFeedback },
    );
  }

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new GeminiServiceError('Gemini returned an empty response', {
      details: response,
    });
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new GeminiServiceError('Failed to parse Gemini JSON output', {
      details: { text, parseError: (err as Error).message },
    });
  }
};

const extractText = (response: GeminiResponse): string => {
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new GeminiServiceError(
      `Gemini blocked the response: ${blockReason}`,
      { details: response.promptFeedback },
    );
  }

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new GeminiServiceError('Gemini returned an empty transcription', {
      details: response,
    });
  }
  return text;
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new GeminiServiceError('Gemini request was cancelled'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new GeminiServiceError('Gemini request was cancelled'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

const callGemini = async <T,>(
  body: GeminiRequestBody,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await callGeminiResponse(body, signal);
  return extractJson(response) as T;
};

const callGeminiText = async (
  body: GeminiRequestBody,
  signal?: AbortSignal,
): Promise<string> => {
  const response = await callGeminiResponse(body, signal);
  return extractText(response);
};

const callGeminiResponse = async (
  body: GeminiRequestBody,
  signal?: AbortSignal,
): Promise<GeminiResponse> => {
  const apiKey = getApiKey();
  const model = getModel();
  const path = `/${encodeURIComponent(model)}:generateContent`;

  let lastError: GeminiServiceError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const { data } = await getClient().post<GeminiResponse>(path, body, {
        params: { key: apiKey },
        signal,
      });
      return data;
    } catch (err) {
      if (err instanceof GeminiServiceError) throw err;
      if (axios.isCancel(err)) {
        throw new GeminiServiceError('Gemini request was cancelled');
      }
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const errBody = err.response?.data as GeminiErrorBody | undefined;
        const message =
          errBody?.error?.message ?? err.message ?? 'Gemini request failed';
        lastError = new GeminiServiceError(message, {
          status,
          details: errBody,
        });

        const retryable =
          status != null && RETRYABLE_STATUSES.has(status) && attempt < MAX_RETRIES;
        if (retryable) {
          const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
          await sleep(delay, signal);
          continue;
        }
        throw lastError;
      }
      throw new GeminiServiceError('Unexpected error talking to Gemini', {
        details: err,
      });
    }
  }

  throw lastError ?? new GeminiServiceError('Gemini request failed');
};

const guessAudioMimeType = (uri: string): string => {
  const cleanUri = uri.split('?')[0]?.toLowerCase() ?? '';
  if (cleanUri.endsWith('.mp3')) return 'audio/mpeg';
  if (cleanUri.endsWith('.wav')) return 'audio/wav';
  if (cleanUri.endsWith('.webm')) return 'audio/webm';
  if (cleanUri.endsWith('.aac')) return 'audio/aac';
  if (cleanUri.endsWith('.m4a') || cleanUri.endsWith('.mp4')) {
    return 'audio/mp4';
  }
  return 'audio/mp4';
};

interface GeneratedQuestionsPayload {
  questions: InterviewQuestion[];
}

export const generateInterviewQuestions = async (
  input: GenerateQuestionsInput,
  options?: { signal?: AbortSignal },
): Promise<InterviewQuestion[]> => {
  const count = Math.max(1, Math.min(input.count ?? 5, 10));
  const topic = CATEGORY_TOPIC[input.categoryId];
  const focus =
    input.focusAreas && input.focusAreas.length > 0
      ? `Focus on: ${input.focusAreas.join(', ')}.`
      : '';

  const userPrompt = [
    `Generate ${count} interview questions on ${topic}.`,
    `Difficulty level: ${input.difficulty}.`,
    focus,
    'Questions must be specific, single-prompt, and answerable verbally in 2-3 minutes.',
    'Use lowercase kebab-case ids prefixed with the category.',
  ]
    .filter(Boolean)
    .join(' ');

  const body: GeminiRequestBody = {
    systemInstruction: {
      parts: [
        {
          text:
            'You are a senior technical interviewer creating high-signal interview questions. ' +
            'Return STRICT JSON matching the provided schema. No prose, no markdown.',
        },
      ],
    },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: QUESTIONS_SCHEMA,
    },
  };

  const payload = await callGemini<GeneratedQuestionsPayload>(
    body,
    options?.signal,
  );

  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    throw new GeminiServiceError('Gemini returned no questions');
  }

  return payload.questions.map((q, index) => ({
    id: typeof q.id === 'string' && q.id.length > 0
      ? q.id
      : `${input.categoryId}-${Date.now()}-${index}`,
    prompt: q.prompt,
    difficulty: q.difficulty,
  }));
};

export const transcribeAudioRecording = async (
  input: TranscribeAudioInput,
  options?: { signal?: AbortSignal },
): Promise<string> => {
  const file = new File(input.uri);
  const info = file.info();
  if (!info.exists) {
    throw new GeminiServiceError('Recording file could not be found.');
  }
  if (typeof info.size === 'number' && info.size > MAX_INLINE_AUDIO_BYTES) {
    throw new GeminiServiceError(
      'Recording is too large to transcribe inline. Try a shorter answer.',
    );
  }

  const data = await file.base64();
  const questionLine = input.questionPrompt
    ? `Interview question: ${input.questionPrompt}`
    : '';

  const body: GeminiRequestBody = {
    systemInstruction: {
      parts: [
        {
          text:
            'You transcribe interview answer audio accurately. ' +
            'Return only the spoken words. No commentary, no markdown.',
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'Generate a clean transcript of the candidate speech in this audio.',
              questionLine,
              'Preserve technical terms and filler only when it changes meaning.',
              'If there is no speech, return an empty string.',
            ]
              .filter(Boolean)
              .join('\n'),
          },
          {
            inlineData: {
              mimeType: input.mimeType ?? guessAudioMimeType(input.uri),
              data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 1024,
      responseMimeType: 'text/plain',
    },
  };

  const transcript = await callGeminiText(body, options?.signal);
  return transcript.replace(/^["“]|["”]$/g, '').trim();
};

const clampScore = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const normalizeFeedback = (payload: InterviewFeedback): InterviewFeedback => {
  const score = clampScore(payload.score);
  const subscores = payload.subscores
    ? {
        technical: clampScore(payload.subscores.technical),
        communication: clampScore(payload.subscores.communication),
        confidence: clampScore(payload.subscores.confidence),
      }
    : undefined;

  return {
    score,
    summary: typeof payload.summary === 'string' ? payload.summary : '',
    strengths: Array.isArray(payload.strengths) ? payload.strengths : [],
    improvements: Array.isArray(payload.improvements) ? payload.improvements : [],
    subscores,
  };
};

export const evaluateAnswer = async (
  input: EvaluateAnswerInput,
  options?: { signal?: AbortSignal },
): Promise<InterviewFeedback> => {
  const topic = CATEGORY_TOPIC[input.categoryId];

  const userPrompt = [
    `Topic: ${topic}.`,
    `Question: ${input.question.prompt}`,
    `Candidate answer: ${input.answer}`,
    'Score 0-100 on correctness, depth, structure, and communication.',
    'Also score subscores 0-100 for technical accuracy, communication clarity, and confidence.',
    'Provide a 1-2 sentence summary, 2-4 concrete strengths, and 2-4 specific improvements.',
  ].join('\n');

  const body: GeminiRequestBody = {
    systemInstruction: {
      parts: [
        {
          text:
            'You are a senior interviewer giving fair, concrete, and actionable feedback. ' +
            'Return STRICT JSON matching the provided schema. No prose, no markdown.',
        },
      ],
    },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: FEEDBACK_SCHEMA,
    },
  };

  const payload = await callGemini<InterviewFeedback>(body, options?.signal);
  return normalizeFeedback(payload);
};

export const evaluateSession = async (
  input: EvaluateSessionInput,
  options?: { signal?: AbortSignal },
): Promise<InterviewFeedback> => {
  if (input.qa.length === 0) {
    throw new GeminiServiceError('Cannot evaluate an empty session');
  }

  const topic = CATEGORY_TOPIC[input.categoryId];
  const formattedQa = input.qa
    .map(
      (entry, index) =>
        `Q${index + 1}: ${entry.question}\nA${index + 1}: ${entry.answer}`,
    )
    .join('\n\n');

  const durationLine =
    typeof input.durationMs === 'number'
      ? `Session duration: ${Math.round(input.durationMs / 1000)}s.`
      : '';

  const userPrompt = [
    `Topic: ${topic}.`,
    `Target difficulty: ${input.difficulty}.`,
    durationLine,
    'Below is the full interview transcript. Evaluate it holistically.',
    'Return an OVERALL score 0-100 and subscores for technical, communication, and confidence.',
    'Summary should be 1-3 sentences. Provide 3-5 strengths and 3-5 improvements grounded in the actual answers.',
    '',
    formattedQa,
  ]
    .filter(Boolean)
    .join('\n');

  const body: GeminiRequestBody = {
    systemInstruction: {
      parts: [
        {
          text:
            'You are a senior interviewer producing a fair, evidence-based interview report. ' +
            'Quote details from the candidate answers when relevant. ' +
            'Return STRICT JSON matching the provided schema. No prose, no markdown.',
        },
      ],
    },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: FEEDBACK_SCHEMA,
    },
  };

  const payload = await callGemini<InterviewFeedback>(body, options?.signal);
  return normalizeFeedback(payload);
};

export const isGeminiConfigured = (): boolean =>
  typeof process.env.EXPO_PUBLIC_GEMINI_API_KEY === 'string' &&
  process.env.EXPO_PUBLIC_GEMINI_API_KEY.trim().length > 0;
