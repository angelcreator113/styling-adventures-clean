/* eslint-env node */
module.exports = {
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src']], // matches Vite alias
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
