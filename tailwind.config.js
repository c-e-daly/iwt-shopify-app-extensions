module.exports = {
    content: [
     './routes/**/*.{html,js,jsx}',
    './components/**/*.{html,js,jsx}'

  ],
  future: {
    // removeDeprecatedGapUtilities: true,
    // purgeLayersByDefault: true,
  },
  purge: [],
  theme: {
     colors: {
      'iwtblue': '#0442bf',
      'iwtlightblue': '#0656bf',
      'iwtgreen': '#80bf9b',
      'iwtlightgreen': '#bd59b4',
      'iwttext': '#0d0d0d',
    },
    extend: {},
  },
  variants: {},
  plugins: [],
}
