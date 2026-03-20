/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ecu-dark':    '#0c0a08',
        'ecu-panel':   '#151210',
        'ecu-surface': '#1e1a16',
        'ecu-hover':   '#272220',
        'ecu-active':  '#302a25',
        'ecu-border':  'rgba(200,170,120,0.14)',
        'ecu-gold':    '#c9a24e',
        'ecu-gold-hover': '#d4b263',
        'ecu-green':   '#4caf50',
        'ecu-red':     '#ef5350',
        'ecu-blue':    '#42a5f5',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
