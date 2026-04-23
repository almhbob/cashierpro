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
- `POST /api/superadmin/stores/:id/extend-trial` — extend trial period
- `DELETE /api/superadmin/stores/:id` — delete store permanently
- `GET /api/superadmin/isolation-check` — data isolation health check
- `GET /api/superadmin/licenses` — all desktop licenses
- `POST /api/superadmin/licenses/generate` — generate EXE license key
- `POST /api/superadmin/licenses/activate` — activate license (Electron first run)
- `POST /api/superadmin/licenses/verify-token` — verify offline machine token
- `PATCH /api/superadmin/licenses/:id/revoke|restore` — revoke/restore license
- `DELETE /api/superadmin/licenses/:id` — delete license
- `GET|PUT /api/admin/settings` — per-tenant settings (via tenantSettingsTable)

### Demo Mode
- Activated via code `DEMO2025` on sign-in page
- Intercepts all `/api/` fetch calls with mock data from `src/demo/demoData.ts`
- Shows DemoBanner (amber) + demo user in Sidebar
- Hides SuperAdmin link in demo mode
- Files: `src/demo/DemoContext.tsx`, `src/demo/DemoBanner.tsx`, `src/demo/demoData.ts`

### Desktop App (EXE) — `desktop-app/`
- Electron 29 + Better-SQLite3 + Express local server (port 7777)
- License system: machine-bound, online activation, offline operation after first use
- License types: trial (30d), annual (365d), lifetime
- Generated from SuperAdmin → Licenses tab
- Build: `npm run build:win` → `dist-exe/CashierPro-Setup-1.0.0.exe`
- `src/license-validator.js` — HMAC-based machine token verification
- `src/local-server.js` — full offline API (products, sales, inventory, settings)
- `renderer/license.html` — activation UI (no React, pure HTML/JS)

### DB Schema additions (licenses.ts)
- `desktop_licenses` — id, key (unique), machineId, storeName, storePhone, type (trial/annual/lifetime), expiresAt, activatedAt, notes, isRevoked, createdAt

### Employee Management (v2)
- **Schema**: `lib/db/src/schema/employees.ts` — `employees` table with: name, nameEn, role (owner/manager/cashier/accountant/warehouse), pin (SHA256-hashed), phone, email, salary, salaryType, startDate, nationalId, notes, status, permissions (canManageProducts, canManageSales, canViewReports, canManageEmployees, canManageSettings, canApplyDiscount, maxDiscountPercent)
- **API**: `artifacts/api-server/src/routes/employees.ts` — full CRUD + supervisor PIN verify + stats
  - `GET /api/employees` — list all (pin sanitized as ****)
  - `POST /api/employees` — create
  - `PUT /api/employees/:id` — update
  - `DELETE /api/employees/:id?permanent=true|false` — deactivate or permanently delete
  - `POST /api/employees/verify-supervisor` — verify supervisor PIN
  - `GET /api/employees/stats` — aggregate stats by role and status
- **Frontend**: `artifacts/supermarket-pos/src/pages/Employees.tsx` — protected by supervisor PIN lock
- **Sidebar**: "الموظفون" link with Shield icon indicating supervisor-only access

### Settings Enhancements (v2)
- Internet connectivity indicator in header
- System activation tracking (first run requires internet)
- 6 tabs: المتجر, الأمان, الطابعة, الاشتراك, الخادم, النظام
- "النظام" tab: activation status, activation ID, security checklist, supervisor PIN management
- Supervisor PIN verification gate for accessing sensitive settings

### SuperAdmin Tabs
1. **نظرة عامة** — KPI cards (total stores, MRR, active, paid), plan breakdown, revenue projection
2. **المتاجر** — Store rows with expand/collapse, plan change, trial extend, suspend, delete
3. **عزل البيانات** — Isolation health check per tenant (orphan products/sales detector)
4. **التراخيص** — Desktop license management, generate/revoke/restore, copy key to clipboard

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
