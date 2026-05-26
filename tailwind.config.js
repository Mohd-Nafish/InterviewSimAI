/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        accent: {
          400: '#22D3EE',
          500: '#06B6D4',
        },
        ink: {
          50: '#F8FAFC',
          200: '#CBD5E1',
          300: '#AAB7C8',
          400: '#94A3B8',
          500: '#64748B',
          700: '#1F2937',
          800: '#111827',
          900: '#0A0E1A',
          950: '#06080F',
        },
        emerald: {
          glow: '#34D399',
          deep: '#047857',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
