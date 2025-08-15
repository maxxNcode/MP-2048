/****** Tailwind Config ******/
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        board: '#bbada0',
        tileEmpty: '#cdc1b4',
        tile2: '#eee4da',
        tile4: '#ede0c8',
        tile8: '#f2b179',
        tile16: '#f59563',
        tile32: '#f67c5f',
        tile64: '#f65e3b',
        tile128: '#edcf72',
        tile256: '#edcc61',
        tile512: '#edc850',
        tile1024: '#edc53f',
        tile2048: '#edc22e',
      },
    },
  },
  plugins: [],
}
