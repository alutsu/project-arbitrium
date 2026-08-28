import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const MAX_FUNCTION_PARAMS = 3;
const MAX_NESTING_DEPTH = 2;

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['src/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked, prettier],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // CLAUDE.md 2.1: escape hatches that hide type errors are banned outright.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      // CLAUDE.md 4.1/4.2: no magic numbers, small signatures, shallow nesting.
      '@typescript-eslint/no-magic-numbers': [
        'error',
        { ignore: [0, 1, -1], ignoreArrayIndexes: true, enforceConst: true },
      ],
      'max-params': ['error', MAX_FUNCTION_PARAMS],
      'max-depth': ['error', MAX_NESTING_DEPTH],
      'no-console': 'error',
    },
  },
  {
    files: ['src/**/*.test.ts'],
    rules: { '@typescript-eslint/no-magic-numbers': 'off' },
  },
);
