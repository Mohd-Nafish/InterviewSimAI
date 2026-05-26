export * from './navigation';

export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type CategoryId = 'react-native' | 'hr' | 'dsa' | 'system-design';

export interface InterviewCategory {
  id: CategoryId;
  label: string;
  description: string;
  icon: string;
}

export interface InterviewQuestion {
  id: string;
  prompt: string;
  difficulty: QuestionDifficulty;
}

export type TranscriptRole = 'interviewer' | 'candidate';

export interface TranscriptEntry {
  id: string;
  questionId: string;
  role: TranscriptRole;
  text: string;
  createdAt: number;
}

export interface InterviewAnswer {
  questionId: string;
  text: string;
  durationMs: number;
}

export interface InterviewSubscores {
  technical: number;
  communication: number;
  confidence: number;
}

export interface InterviewFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  subscores?: InterviewSubscores;
}

export interface InterviewSession {
  id: string;
  categoryId: CategoryId;
  categoryLabel: string;
  difficulty: QuestionDifficulty;
  startedAt: number;
  endedAt?: number;
  durationMs: number;
  score?: number;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  transcript: TranscriptEntry[];
  feedback?: InterviewFeedback;
}
