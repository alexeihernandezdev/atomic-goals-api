// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'shared', pattern: 'src/shared/**' },
        { type: 'common', pattern: 'src/common/**' },
        { type: 'config', pattern: 'src/config/**' },
        { type: 'database', pattern: 'src/database/**' },
        { type: 'domain', pattern: 'src/modules/**/domain/**' },
        { type: 'application', pattern: 'src/modules/**/application/**' },
        { type: 'infrastructure', pattern: 'src/modules/**/infrastructure/**' },
        { type: 'presentation', pattern: 'src/modules/**/presentation/**' },
        { type: 'module-root', pattern: 'src/modules/**/*.module.ts' },
      ],
      'boundaries/ignore': ['**/*.spec.ts'],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: ['shared'], allow: ['shared'] },
            { from: ['common'], allow: ['shared', 'common'] },
            { from: ['config'], allow: [] },
            { from: ['database'], allow: ['shared', 'config'] },
            { from: ['domain'], allow: ['shared'] },
            { from: ['application'], allow: ['domain', 'shared'] },
            {
              from: ['infrastructure'],
              allow: ['domain', 'application', 'shared', 'config'],
            },
            {
              from: ['presentation'],
              allow: ['application', 'domain', 'shared', 'common'],
            },
            {
              from: ['module-root'],
              allow: [
                'domain',
                'application',
                'infrastructure',
                'presentation',
                'shared',
                'common',
                'config',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
