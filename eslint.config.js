import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import noCommentsInHelmet from './eslint-rules/no-comments-in-helmet.js'

export default tseslint.config(
  { ignores: ['dist', 'backend', 'test-results', 'coverage', 'node_modules', 'e2e/**', 'playwright.config.ts', 'tailwind.config.ts', 'vitest.config.ts', 'vite.config.ts', 'postcss.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'custom': {
        rules: {
          'no-comments-in-helmet': noCommentsInHelmet,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Disable overly strict React Compiler rules that flag standard patterns
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'custom/no-comments-in-helmet': 'warn',
    },
  },
)
