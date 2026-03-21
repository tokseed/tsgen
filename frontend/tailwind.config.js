/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sber: {
          green: '#21A038',
          light: '#4CAF50',
          dark: '#1B5E20',
        },
        accent: {
          yellow: '#FFD600',
          light: '#FFEA00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
