import type { Theme } from '@react-navigation/native';

export const palette = {
  brand: '#10B981',
  brandDark: '#059669',
  brandLight: '#34D399',
  accent: '#22D3EE',
  emeraldGlow: '#34D399',
  emeraldDeep: '#047857',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
} as const;

export const gradients = {
  background: ['#06080F', '#0A0E1A', '#0E1320'] as const,
  primaryButton: ['#059669', '#10B981', '#34D399'] as const,
  card: ['rgba(16,185,129,0.08)', 'rgba(15,23,42,0.45)'] as const,
  cardActive: ['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.06)'] as const,
  recent: ['rgba(16,185,129,0.16)', 'rgba(34,211,238,0.08)'] as const,
};

export const lightColors = {
  background: '#FFFFFF',
  card: '#F4F4F5',
  text: '#0B0F19',
  textMuted: '#52525B',
  border: '#E4E4E7',
  primary: palette.brand,
  notification: palette.danger,
} as const;

export const darkColors = {
  background: '#0A0E1A',
  card: '#111827',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#1F2937',
  primary: palette.brandLight,
  notification: palette.danger,
} as const;

export const lightNavigationTheme: Theme = {
  dark: false,
  colors: {
    background: lightColors.background,
    card: lightColors.card,
    text: lightColors.text,
    border: lightColors.border,
    primary: lightColors.primary,
    notification: lightColors.notification,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

export const darkNavigationTheme: Theme = {
  dark: true,
  colors: {
    background: darkColors.background,
    card: darkColors.card,
    text: darkColors.text,
    border: darkColors.border,
    primary: darkColors.primary,
    notification: darkColors.notification,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

export type AppColors = typeof lightColors;
