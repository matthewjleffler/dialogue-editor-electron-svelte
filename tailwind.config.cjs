module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    fontSize: {
      'xs': ['12px', '12px'],
    },
    extend: {
      colors: {
        'left-grey': '#383c44',
        'right-grey': '#282c34',
        'menu-grey': '#484c54',
        'search-grey': '#646464',
        'search-close-grey': '#aaaaaa',
        'page-back': '#383c44',
      },
      placeholderColor: {
        'search': '#ffffff80',
      },
      fontSize: {
        'xxs': ['10px', '10px'],
      }
    }
  },
  plugins: []
};
