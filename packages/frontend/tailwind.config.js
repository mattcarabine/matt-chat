/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FAF8F5',
          dark: '#F2EDE6',
        },
        forest: {
          DEFAULT: '#1D3D2D',
          light: '#2A5A3F',
        },
        terracotta: {
          DEFAULT: '#C67B5C',
          light: '#D4967D',
        },
        charcoal: '#2C2C2C',
        stone: {
          DEFAULT: '#6B6B6B',
          300: '#D4D4D4',
          400: '#A3A3A3',
        },
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shake': 'shake 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
