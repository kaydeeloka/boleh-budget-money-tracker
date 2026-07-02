/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'stone-850': '#221f1d',
        'stone-150': '#edebe9',
        'stone-450': '#938e89',
        brand: '#22C55E',
        navy: '#0F172A',
        expense: '#EF4444',
        income: '#16A34A',
        accent: '#14B8A6',
      },
      fontFamily: {
        sans: ['System'],
        display: ['System'],
        mono: ['Courier New'],
      },
    },
  },
  plugins: [],
};
