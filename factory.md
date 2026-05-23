# Factory Configuration

## Goal

Fantasy football league homepage for Greybushes & Chili Dogs: live standings, matchups, draft analytics, record book, mini games, and league history powered by Yahoo Fantasy API.

## Scope

### Modifiable

- src/**/*.ts
- src/**/*.tsx
- src/**/*.css
- src/**/*.json
- src/content/**/*.mdx
- scripts/**/*
- package.json
- tsconfig.json
- next.config.mjs
- postcss.config.mjs
- tailwind.config.*
- factory.md
- eval/**/*

### Read-only

- README.md
- .env.example
- vercel.json
- .gitignore

## Guards

- Do not delete or overwrite existing tests
- Do not modify files outside the declared scope
- Do not introduce secrets or credentials into the repository
- Do not break Yahoo OAuth authentication flow
- Do not remove existing pages or API routes

## Eval

### Command

```bash
python3 eval/score.py
```

### Threshold

0.40

## Target Branch

main

## Smoke Test

```bash
npx tsc --noEmit
```

## Constraints

- Prefer small, incremental changes over large rewrites
- Follow the existing code style and conventions (Next.js App Router, Tailwind CSS 4)
- Sanitize for edge cases: Infinity, NaN, null, division by zero in frontend code
- Never use emdashes or double-dashes in UI text
