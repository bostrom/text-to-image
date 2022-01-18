module.exports = {
  env: {
    node: true,
    jest: true,
  },
  extends: [
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    curly: ['error', 'all'],
  },
};
