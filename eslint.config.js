const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier/flat');
const jestPlugin = require('eslint-plugin-jest');
const importPlugin = require('eslint-plugin-import');

module.exports = tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/*.js'],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      curly: ['error', 'all'],
    },
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    extends: [eslint.configs.recommended],
  },
  {
    // enable jest rules on test files
    files: ['test/**'],
    extends: [jestPlugin.configs['flat/recommended']],
  },
);
