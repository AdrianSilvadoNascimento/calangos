/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        surface: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#5c8a65',
          500: '#3d6645',
          600: '#2a4c31',
          700: '#1f3825',
          800: '#152618',
          900: '#0c1a0d',
        },
        accent: {
          shimmer: '#a3e635',
          amber: '#fbbf24',
          teal: '#2dd4bf',
          rose: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter'],
        heading: ['Inter'],
      },
    },
  },
  plugins: [],
};
