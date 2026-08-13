import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Backend lint config — mirrors the root frontend config's style (eslint 9+
// flat config, typescript-eslint recommended, relaxed unused-vars / any rules)
// but targets the Node/Express runtime instead of the browser.
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'prisma/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
)
