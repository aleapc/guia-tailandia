/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      colors: {
        // Paleta Tailândia: marrom-templo, jade, ouro, laranja-açafrão e creme.
        deep: '#3A2A21',
        teal: '#127C71',
        glacier: '#F3C969',
        ember: '#E4572E',
        forest: '#2E7D5B',
        sand: '#FBF5E9',
        gold: '#D4A017',
        crimson: '#A31621'
      }
    }
  },
  plugins: []
};
