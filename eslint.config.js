import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier/flat';
import betterTailwind from 'eslint-plugin-better-tailwindcss';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

const paletteColors =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const colorUtilities =
  'bg|text|border|border-[trblxyse]|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|divide|accent|caret|shadow|placeholder';

export default tsEslint.config(
  {
    ignores: ['dist/', 'dev-dist/', 'node_modules/', 'public/', '.yarn/', 'playwright-report/'],
  },
  ...tsEslint.configs.recommended,
  ...tsEslint.configs.stylistic,
  js.configs.recommended,
  sonarjs.configs.recommended,
  unicorn.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
      parser: tsEslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', 'scripts/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'prefer-spread': 'off',
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'comma-dangle': ['error', 'only-multiline'],

      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-invalid-void-type': 'warn',

      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],

      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/expiring-todo-comments': 'off',
      'unicorn/import-style': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prefer-structured-clone': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/no-useless-undefined': ['error', { checkArrowFunctionBody: false }],

      'sonarjs/max-switch-cases': 'off',
      'sonarjs/no-small-switch': 'off',
      'sonarjs/prefer-while': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/redundant-type-aliases': 'off',
      'sonarjs/no-selector-parameter': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/todo-tag': 'warn',
      'sonarjs/fixme-tag': 'warn',
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/function-return-type': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/null-dereference': 'off',
      'sonarjs/argument-type': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'separate-type-imports',
          prefer: 'type-imports',
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            'type',
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'unknown',
          ],
          pathGroups: [
            {
              pattern: '**/{hooks,hooks/**}',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '**/**/*.{png,webp}',
              group: 'object',
              position: 'before',
            },
            {
              pattern: '**/**/*.svg',
              group: 'object',
              position: 'after',
            },
            {
              pattern: '@/**',
              group: 'unknown',
              position: 'before',
            },
            {
              pattern: './*.css',
              group: 'unknown',
              position: 'after',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroupsExcludedImportTypes: ['type'],
          warnOnUnassignedImports: true,
        },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'better-tailwindcss': betterTailwind,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/app/styles/index.css',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...betterTailwind.configs.correctness.rules,
      'better-tailwindcss/no-restricted-classes': [
        'error',
        {
          restrict: [
            {
              pattern: String.raw`^(.*:)?-?[a-z-]+-\[.+\]$`,
              message: 'Произвольные значения запрещены: используйте токены темы',
            },
            {
              pattern: String.raw`^(.*:)?(${colorUtilities})-(${paletteColors})-\d+(\/\d+)?$`,
              message: 'Цвета палитры Tailwind запрещены: используйте токены HeroUI',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'sonarjs/no-hardcoded-passwords': 'off',
    },
  },
  prettierConfig,
);
