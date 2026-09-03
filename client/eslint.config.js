import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // This rule (new in eslint-plugin-react-hooks v7) flags the standard
      // "fetch on mount + track a loading flag" pattern used throughout this
      // app's data hooks (useTastings, useWines). That pattern is guarded
      // against setting state after unmount and is the normal way to do this
      // without a data-fetching library, so we keep it as a nudge (warn)
      // rather than a hard error.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
