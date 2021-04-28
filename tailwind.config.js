module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'twitter-blue': {
          DEFAULT: '#1da1f2',
          hover: '#188acf',
        }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
