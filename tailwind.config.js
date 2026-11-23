/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'] },
      colors: {
        navy: { 50: '#eef3fb', 100: '#d9e4f5', 600: '#1e4a8a', 700: '#173a6e', 800: '#102a52', 900: '#0b1f3d' },
      },
    },
  },
  plugins: [],
};
