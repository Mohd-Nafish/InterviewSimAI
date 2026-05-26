import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { historyService } from '../services/historyService';
import type {
  CategoryId,
  InterviewAnswer,
  InterviewFeedback,
  InterviewQuestion,
  InterviewSession,
  QuestionDifficulty,
  TranscriptEntry,
} from '../types';

export type LoadingKey = 'questions' | 'transcription' | 'feedback';

export interface TimerState {
  isRunning: boolean;
  elapsedMs: number;
  startedAt: number | null;
}

export interface InterviewState {
  selectedCategoryId: CategoryId | null;
  selectedDifficulty: QuestionDifficulty;

  currentSessionId: string | null;
  currentCategoryLabel: string | null;
  currentQuestions: InterviewQuestion[];
  currentQuestionIndex: number;
  currentAnswers: InterviewAnswer[];

  transcript: TranscriptEntry[];

  currentScore: number | null;

  history: InterviewSession[];
  historyHydrated: boolean;

  loading: Record<LoadingKey, boolean>;

  timer: TimerState;

  selectCategory: (id: CategoryId) => void;
  setDifficulty: (difficulty: QuestionDifficulty) => void;

  startSession: (input: {
    categoryId: CategoryId;
    categoryLabel: string;
    difficulty: QuestionDifficulty;
    questions: InterviewQuestion[];
  }) => string;
  endSession: (feedback?: InterviewFeedback) => InterviewSession | null;
  abortSession: () => void;

  setCurrentQuestionIndex: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;

  appendTranscript: (entry: Omit<TranscriptEntry, 'id' | 'createdAt'>) => void;
  updateTranscriptEntry: (id: string, patch: Partial<TranscriptEntry>) => void;
  clearTranscript: () => void;

  addAnswer: (answer: InterviewAnswer) => void;

  setScore: (score: number | null) => void;

  setLoading: (key: LoadingKey, value: boolean) => void;

  removeHistoryEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  hydrateHistory: () => Promise<void>;

  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
}

const INITIAL_TIMER: TimerState = {
  isRunning: false,
  elapsedMs: 0,
  startedAt: null,
};

const INITIAL_LOADING: Record<LoadingKey, boolean> = {
  questions: false,
  transcription: false,
  feedback: false,
};

const createId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type PersistedSlice = Pick<
  InterviewState,
  'selectedCategoryId' | 'selectedDifficulty'
>;

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      selectedCategoryId: null,
      selectedDifficulty: 'intermediate',

      currentSessionId: null,
      currentCategoryLabel: null,
      currentQuestions: [],
      currentQuestionIndex: 0,
      currentAnswers: [],

      transcript: [],

      currentScore: null,

      history: [],
      historyHydrated: false,

      loading: INITIAL_LOADING,

      timer: INITIAL_TIMER,

      selectCategory: (id) => set({ selectedCategoryId: id }),

      setDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

      startSession: ({ categoryId, categoryLabel, difficulty, questions }) => {
        const id = createId('session');
        set({
          currentSessionId: id,
          selectedCategoryId: categoryId,
          currentCategoryLabel: categoryLabel,
          selectedDifficulty: difficulty,
          currentQuestions: questions,
          currentQuestionIndex: 0,
          currentAnswers: [],
          transcript: [],
          currentScore: null,
          timer: { isRunning: true, elapsedMs: 0, startedAt: Date.now() },
        });
        return id;
      },

      endSession: (feedback) => {
        const state = get();
        if (
          !state.currentSessionId ||
          !state.selectedCategoryId ||
          !state.currentCategoryLabel
        ) {
          return null;
        }

        const now = Date.now();
        const ongoing =
          state.timer.isRunning && state.timer.startedAt != null
            ? state.timer.elapsedMs + (now - state.timer.startedAt)
            : state.timer.elapsedMs;

        const session: InterviewSession = {
          id: state.currentSessionId,
          categoryId: state.selectedCategoryId,
          categoryLabel: state.currentCategoryLabel,
          difficulty: state.selectedDifficulty,
          startedAt: now - ongoing,
          endedAt: now,
          durationMs: ongoing,
          score: feedback?.score ?? state.currentScore ?? undefined,
          questions: state.currentQuestions,
          answers: state.currentAnswers,
          transcript: state.transcript,
          feedback,
        };

        const nextHistory = [
          session,
          ...state.history.filter((s) => s.id !== session.id),
        ].slice(0, 50);

        set({
          history: nextHistory,
          currentSessionId: null,
          currentCategoryLabel: null,
          currentQuestions: [],
          currentQuestionIndex: 0,
          currentAnswers: [],
          transcript: [],
          currentScore: feedback?.score ?? state.currentScore,
          timer: { isRunning: false, elapsedMs: ongoing, startedAt: null },
        });

        historyService.upsert(session).catch((err) => {
          console.warn('[historyService] failed to persist session', err);
        });

        return session;
      },

      abortSession: () =>
        set({
          currentSessionId: null,
          currentCategoryLabel: null,
          currentQuestions: [],
          currentQuestionIndex: 0,
          currentAnswers: [],
          transcript: [],
          currentScore: null,
          timer: INITIAL_TIMER,
        }),

      setCurrentQuestionIndex: (index) =>
        set((state) => ({
          currentQuestionIndex: Math.max(
            0,
            Math.min(index, Math.max(state.currentQuestions.length - 1, 0)),
          ),
        })),

      nextQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.min(
            state.currentQuestionIndex + 1,
            Math.max(state.currentQuestions.length - 1, 0),
          ),
        })),

      previousQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
        })),

      appendTranscript: (entry) =>
        set((state) => ({
          transcript: [
            ...state.transcript,
            { ...entry, id: createId('msg'), createdAt: Date.now() },
          ],
        })),

      updateTranscriptEntry: (id, patch) =>
        set((state) => ({
          transcript: state.transcript.map((entry) =>
            entry.id === id ? { ...entry, ...patch } : entry,
          ),
        })),

      clearTranscript: () => set({ transcript: [] }),

      addAnswer: (answer) =>
        set((state) => ({
          currentAnswers: [
            ...state.currentAnswers.filter(
              (a) => a.questionId !== answer.questionId,
            ),
            answer,
          ],
        })),

      setScore: (score) => set({ currentScore: score }),

      setLoading: (key, value) =>
        set((state) => ({ loading: { ...state.loading, [key]: value } })),

      removeHistoryEntry: async (id) => {
        set((state) => ({
          history: state.history.filter((s) => s.id !== id),
        }));
        try {
          await historyService.remove(id);
        } catch (err) {
          console.warn('[historyService] failed to remove session', err);
        }
      },

      clearHistory: async () => {
        set({ history: [] });
        try {
          await historyService.clear();
        } catch (err) {
          console.warn('[historyService] failed to clear history', err);
        }
      },

      hydrateHistory: async () => {
        try {
          const sessions = await historyService.loadAll();
          set({ history: sessions, historyHydrated: true });
        } catch (err) {
          console.warn('[historyService] failed to load history', err);
          set({ historyHydrated: true });
        }
      },

      startTimer: () =>
        set((state) => ({
          timer: {
            isRunning: true,
            elapsedMs: state.timer.elapsedMs,
            startedAt: Date.now(),
          },
        })),

      pauseTimer: () =>
        set((state) => {
          if (!state.timer.isRunning || state.timer.startedAt == null) {
            return state;
          }
          const delta = Date.now() - state.timer.startedAt;
          return {
            timer: {
              isRunning: false,
              elapsedMs: state.timer.elapsedMs + delta,
              startedAt: null,
            },
          };
        }),

      resetTimer: () => set({ timer: INITIAL_TIMER }),

      tickTimer: () =>
        set((state) => {
          if (!state.timer.isRunning || state.timer.startedAt == null) {
            return state;
          }
          const now = Date.now();
          return {
            timer: {
              isRunning: true,
              elapsedMs: state.timer.elapsedMs + (now - state.timer.startedAt),
              startedAt: now,
            },
          };
        }),
    }),
    {
      name: 'interview-store/v2',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      partialize: (state): PersistedSlice => ({
        selectedCategoryId: state.selectedCategoryId,
        selectedDifficulty: state.selectedDifficulty,
      }),
    },
  ),
);

export const selectCurrentQuestion = (
  state: InterviewState,
): InterviewQuestion | null =>
  state.currentQuestions[state.currentQuestionIndex] ?? null;

export const selectProgress = (
  state: InterviewState,
): { current: number; total: number; ratio: number } => {
  const total = state.currentQuestions.length;
  const current = total === 0 ? 0 : state.currentQuestionIndex + 1;
  return { current, total, ratio: total === 0 ? 0 : current / total };
};

export const selectElapsedMs = (state: InterviewState): number => {
  const { isRunning, elapsedMs, startedAt } = state.timer;
  if (!isRunning || startedAt == null) return elapsedMs;
  return elapsedMs + (Date.now() - startedAt);
};

export const selectAverageScore = (state: InterviewState): number | null => {
  const scored = state.history.filter(
    (s): s is InterviewSession & { score: number } => typeof s.score === 'number',
  );
  if (scored.length === 0) return null;
  const total = scored.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / scored.length);
};

export const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};
