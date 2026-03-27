import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E8EDFF',
          100: '#D7E3FF',
          200: '#B9CCFF',
          300: '#8FAFFF',
          400: '#5F87E6',
          500: '#1E4DB7',
          600: '#1E4DB7',
          700: '#163A91',
          800: '#122F75',
          900: '#0F255C',
        },
        'primary-dark': '#163A91',
        accent: '#E53935',
        'accent-dark': '#C62828',
        sidebar: '#1E2F5A',
        'light-bg': '#F5F7FB',
        border: '#E3E8F0',
        'text-primary': '#1A1A1A',
        'text-secondary': '#5F6B7A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};

export default config;
