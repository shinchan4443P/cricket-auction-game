/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Clash Display', 'system-ui', 'sans-serif'],
        body: ['Satoshi', 'system-ui', 'sans-serif'],
      },
      colors: {
        cricket: {
          green: '#1B5E20',
          gold: '#FFD700',
          pitch: '#2E7D32',
          cream: '#FFF8E7',
          dark: '#0D1F0D',
        },
      },
    },
  },
  plugins: [],
};
