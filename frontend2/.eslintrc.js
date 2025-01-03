module.exports = {

  'extends': ['react-app', 'react-app/jest'],
  'parser': '@babel/eslint-parser',
  'parserOptions': {
    'babelOptions': {
      'presets': [
        ['babel-preset-react-app', false],
        (process.env.NODE_ENV === 'production')
          ? 'babel-preset-react-app/prod'
          : (process.env.NODE_ENV === 'test')
            ? 'babel-preset-react-app/test'
            : 'babel-preset-react-app/dev',
      ],
    }
  }
}
