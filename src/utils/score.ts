export type ScoreTone = 'good' | 'okay' | 'poor';

export const getScoreTone = (score: number): ScoreTone => {
  if (score >= 80) return 'good';
  if (score >= 60) return 'okay';
  return 'poor';
};

export const SCORE_TAGLINE: Record<ScoreTone, string> = {
  good: 'Great performance!',
  okay: 'Solid effort — room to grow.',
  poor: "Keep practising — you've got this.",
};

export const SCORE_RING: Record<ScoreTone, string> = {
  good: '#10B981',
  okay: '#F59E0B',
  poor: '#EF4444',
};

export const SCORE_RING_GLOW: Record<ScoreTone, string> = {
  good: 'rgba(16,185,129,0.32)',
  okay: 'rgba(245,158,11,0.32)',
  poor: 'rgba(239,68,68,0.32)',
};

export const SCORE_TEXT: Record<ScoreTone, string> = {
  good: '#34D399',
  okay: '#FBBF24',
  poor: '#FCA5A5',
};

export const SCORE_GRADIENT: Record<ScoreTone, readonly [string, string, string]> = {
  good: ['#34D399', '#10B981', '#059669'] as const,
  okay: ['#FBBF24', '#F59E0B', '#D97706'] as const,
  poor: ['#FCA5A5', '#EF4444', '#B91C1C'] as const,
};

export const SCORE_LABEL: Record<ScoreTone, string> = {
  good: 'Great',
  okay: 'Solid',
  poor: 'Needs work',
};
