import type { InterviewSession } from '../types';
import { createStorage, type TypedStorage } from './storage';

export const HISTORY_STORAGE_KEY = 'interview-history';
export const HISTORY_STORAGE_VERSION = 1;
export const MAX_HISTORY_ENTRIES = 50;

export interface HistoryServiceOptions {
  storage?: TypedStorage<InterviewSession[]>;
  maxEntries?: number;
}

export interface HistoryService {
  loadAll(): Promise<InterviewSession[]>;
  saveAll(sessions: InterviewSession[]): Promise<InterviewSession[]>;
  append(session: InterviewSession): Promise<InterviewSession[]>;
  upsert(session: InterviewSession): Promise<InterviewSession[]>;
  remove(id: string): Promise<InterviewSession[]>;
  clear(): Promise<void>;
  find(id: string): Promise<InterviewSession | null>;
}

const defaultStorage = createStorage<InterviewSession[]>(HISTORY_STORAGE_KEY, {
  version: HISTORY_STORAGE_VERSION,
});

export const createHistoryService = (
  options: HistoryServiceOptions = {},
): HistoryService => {
  const storage = options.storage ?? defaultStorage;
  const max = options.maxEntries ?? MAX_HISTORY_ENTRIES;

  const cap = (sessions: InterviewSession[]): InterviewSession[] =>
    sessions.slice(0, max);

  const sortByRecency = (sessions: InterviewSession[]): InterviewSession[] =>
    [...sessions].sort(
      (a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt),
    );

  const loadAll = async (): Promise<InterviewSession[]> => {
    const stored = await storage.get();
    if (!Array.isArray(stored)) return [];
    return sortByRecency(stored);
  };

  const saveAll = async (
    sessions: InterviewSession[],
  ): Promise<InterviewSession[]> => {
    const next = cap(sortByRecency(sessions));
    await storage.set(next);
    return next;
  };

  const upsert = async (
    session: InterviewSession,
  ): Promise<InterviewSession[]> => {
    return storage.update((current) => {
      const existing = Array.isArray(current) ? current : [];
      const without = existing.filter((s) => s.id !== session.id);
      return cap(sortByRecency([session, ...without]));
    });
  };

  const append = upsert;

  const remove = async (id: string): Promise<InterviewSession[]> => {
    return storage.update((current) => {
      const existing = Array.isArray(current) ? current : [];
      return existing.filter((s) => s.id !== id);
    });
  };

  const clear = async (): Promise<void> => {
    await storage.remove();
  };

  const find = async (id: string): Promise<InterviewSession | null> => {
    const all = await loadAll();
    return all.find((s) => s.id === id) ?? null;
  };

  return { loadAll, saveAll, append, upsert, remove, clear, find };
};

export const historyService: HistoryService = createHistoryService();
