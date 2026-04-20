# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Supermarket POS Features

- **Authentication**: Clerk (VITE_CLERK_PUBLISHABLE_KEY injected via vite.config.ts `define` block)
- **Multi-language i18n**: Arabic (RTL default), English, Hindi, Bengali via react-i18next
  - Language stored in localStorage key `pos-language`
  - Direction set on `document.documentElement.dir` via `DirectionSync` component in App.tsx
  - Locale files: `artifacts/supermarket-pos/src/i18n/locales/{ar,en,hi,bn}.json`
  - Config: `artifacts/supermarket-pos/src/i18n/index.ts`
  - `LANGUAGES` array + `DATE_LOCALES` map exported from i18n/index.ts
- **Pages**: Home (POS checkout), Products, Inventory (stock adjust), Receive (goods), Sales, SaleDetail, Analytics, Dashboard
- **Receipt printing**: `id="receipt-print"` div used for thermal printer 80mm
- **API codegen note**: After `pnpm codegen`, overwrite `lib/api-zod/src/index.ts` with only `export * from "./generated/api";` if duplicate export errors occur
