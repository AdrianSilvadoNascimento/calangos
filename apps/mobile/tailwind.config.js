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
        // ── Fundos (forest) ──────────────────────────────
        bg: {
          0: '#07120D',
          1: '#0C1B14',
          2: '#122820',
          3: '#18372C',
          4: '#1F4A3A',
        },
        // ── Linhas / Bordas ──────────────────────────────
        line: {
          1: '#1B3326',
          2: '#294A39',
          3: '#3A6A53',
        },
        // ── Texto (ink) ──────────────────────────────────
        ink: {
          1: '#F2F6EF',
          2: '#C2D0C5',
          3: '#8AA194',
          4: '#5F786A',
        },
        // ── Verde de marca (brand) ────────────────────────
        brand: {
          100: '#DDF5E4',
          300: '#9AE3B6',
          400: '#5FCB8B',
          500: '#34B26C',
          700: '#155434',
          900: '#0A2A1A',
        },
        // ── Acentos ──────────────────────────────────────
        coral:   '#E89784',
        amber:   '#D9B370',
        rose:    '#D98A99',
        sky:     '#7FB6D9',
        danger:  '#E0746A',

        // ── Compat aliases (remover gradualmente) ────────
        // Mantidos temporariamente para não quebrar imports
        // que ainda referenciam surface-* e primary-*
        surface: {
          300: '#8AA194',
          400: '#5F786A',
          500: '#3A6A53',
          600: '#294A39',
          700: '#1B3326',
          800: '#18372C',
          900: '#0C1B14',
        },
        primary: {
          300: '#9AE3B6',
          400: '#5FCB8B',
          500: '#34B26C',
          600: '#34B26C',
          700: '#155434',
          900: '#0A2A1A',
        },
      },
      fontFamily: {
        sans:     ['Geist_400Regular', 'System'],
        medium:   ['Geist_500Medium', 'System'],
        semibold: ['Geist_600SemiBold', 'System'],
        bold:     ['Geist_700Bold', 'System'],
        mono:     ['Geist_400Regular', 'System'],  // GeistMono não disponível no pacote
        display:  ['Fraunces_400Regular_Italic', 'System'],
      },
    },
  },
  plugins: [],
};
