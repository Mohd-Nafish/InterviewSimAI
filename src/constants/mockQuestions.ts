import type { CategoryId, InterviewQuestion, QuestionDifficulty } from '../types';

export const MOCK_QUESTIONS: Record<CategoryId, InterviewQuestion[]> = {
  'react-native': [
    {
      id: 'rn-1',
      prompt:
        'Explain the React Native bridge architecture and how the new architecture (Fabric + TurboModules) changes it.',
      difficulty: 'intermediate',
    },
    {
      id: 'rn-2',
      prompt:
        'How does React Native reconciliation differ from web React, and what causes excessive re-renders?',
      difficulty: 'intermediate',
    },
    {
      id: 'rn-3',
      prompt:
        'Walk through how you would debug a memory leak in a long-running Expo app.',
      difficulty: 'advanced',
    },
  ],
  hr: [
    {
      id: 'hr-1',
      prompt:
        'Tell me about a time you disagreed with a teammate. How did you resolve it?',
      difficulty: 'beginner',
    },
    {
      id: 'hr-2',
      prompt:
        'Describe a project you owned end-to-end. What trade-offs did you make and why?',
      difficulty: 'intermediate',
    },
    {
      id: 'hr-3',
      prompt: 'Where do you want to be in three years and why this role?',
      difficulty: 'beginner',
    },
  ],
  dsa: [
    {
      id: 'dsa-1',
      prompt:
        'Given an array of integers, return the indices of the two numbers that add up to a target. Discuss time and space trade-offs.',
      difficulty: 'beginner',
    },
    {
      id: 'dsa-2',
      prompt:
        'Design an LRU cache with O(1) get and put. Walk me through your data structures.',
      difficulty: 'intermediate',
    },
    {
      id: 'dsa-3',
      prompt:
        'Given a directed graph, detect a cycle and return one cycle if it exists.',
      difficulty: 'advanced',
    },
  ],
  'system-design': [
    {
      id: 'sd-1',
      prompt:
        'Design a URL shortener that handles 100M reads and 1M writes per day. Cover the data model and caching strategy.',
      difficulty: 'intermediate',
    },
    {
      id: 'sd-2',
      prompt:
        'How would you design a typing-indicator and presence system for a chat app at scale?',
      difficulty: 'advanced',
    },
    {
      id: 'sd-3',
      prompt:
        'Walk through how you would add full-text search to an existing Postgres-backed product.',
      difficulty: 'intermediate',
    },
  ],
};

export const isCategoryId = (id: string): id is CategoryId =>
  id === 'react-native' || id === 'hr' || id === 'dsa' || id === 'system-design';

export const getQuestionsForCategory = (
  id: CategoryId,
  difficulty?: QuestionDifficulty,
): InterviewQuestion[] => {
  const all = MOCK_QUESTIONS[id];
  if (!difficulty) return all;
  const filtered = all.filter((q) => q.difficulty === difficulty);
  return filtered.length > 0 ? filtered : all;
};
