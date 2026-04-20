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

## Supermarket POS — Multi-Tenant SaaS (Foodics-style)

### Authentication & Multi-tenancy
- **Auth**: Clerk (VITE_CLERK_PUBLISHABLE_KEY injected via vite.config.ts `define`)
- **Multi-tenancy**: Auto-provisioned on first API call via `attachTenant` middleware
  - File: `artifacts/api-server/src/middleware/tenant.ts`
  - Creates tenant + owner membership row automatically; sets `needsOnboarding: true`
  - 14-day free trial on signup; `PLAN_LIMITS = { starter, professional, enterprise }`
  - Every API route receives `req.tenantId` and `req.tenant` for data isolation

### DB Schema (lib/db/src/schema/)
- `tenants` — id (uuid), name, nameEn, slug, ownerClerkId, plan, status, needsOnboarding, trialEndsAt
- `tenant_members` — tenantId, clerkUserId, role (owner/cashier/viewer)
- `tenant_settings` — tenantId, key, value (replaces old `store_settings`)
- `products` — tenantId (nullable, filters per-store)
- `sales` — tenantId (nullable, filters per-store)

### Subscription Plans
| Plan | Cashiers | Products | Price |
|------|----------|----------|-------|
| starter | 1 | 500 | Free |
| professional | 5 | ∞ | 99 SAR/mo |
| enterprise | ∞ | ∞ | 299 SAR/mo |

### Frontend Architecture
- **TenantContext**: `artifacts/supermarket-pos/src/context/TenantContext.tsx` — useTenant() hook
- **Onboarding**: `artifacts/supermarket-pos/src/pages/Onboarding.tsx` — 3-step wizard (name → type → contact)
- **SuperAdmin**: `artifacts/supermarket-pos/src/pages/SuperAdmin.tsx` — platform dashboard (MRR, stores, upgrade/suspend)
- **App.tsx**: `TenantProvider` wraps all; redirects to Onboarding if `tenant.needsOnboarding`
- **Sidebar**: Shows store name + plan badge + trial countdown

### API Routes
- `GET|PUT /api/tenants/me` — tenant info + update
- `POST /api/tenants/me/complete-onboarding` — finalize setup + seed settings
- `GET|PUT /api/tenants/me/settings` — store settings
- `GET /api/tenants/me/members` — cashier list
- `POST /api/tenants/me/upgrade` — change plan
- `GET /api/superadmin/overview` — platform MRR + all stores
- `PUT /api/superadmin/stores/:id/plan` — upgrade/suspend any store
- `GET|PUT /api/admin/settings` — per-tenant settings (via tenantSettingsTable)

### Multi-language i18n
- Arabic (RTL default), English, Hindi, Bengali via react-i18next
- Locale files: `artifacts/supermarket-pos/src/i18n/locales/{ar,en,hi,bn}.json`
- Direction set on `document.documentElement.dir` via `DirectionSync` in App.tsx

### Pages
Home (POS checkout), Products, Inventory, Receive (goods), Sales, SaleDetail, Analytics, Dashboard, Settings (4-tab), Onboarding, SuperAdmin

### Settings Tabs
- Tab 1 Subscription: Real plan data from TenantContext; plan upgrade mutations
- Tab 2 Server: Live stats (memory/latency/uptime) via `GET /api/admin/server-stats`
- Tab 3 Store: Store info persisted to `tenant_settings` via `GET|PUT /api/admin/settings`
- Tab 4 Security: Session display, API info, security checklist
