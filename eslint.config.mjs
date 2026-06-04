import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'max-lines': [
        'warn',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ['**/__tests__/**', 'scripts/**', 'supabase/functions/**'],
    rules: {
      'max-lines': 'off',
    },
  },
]

export default eslintConfig
