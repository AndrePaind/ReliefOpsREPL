# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Main application: **ReliefOps** — Sudan crisis logistics command center for NGO coordinators.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Auth**: Clerk (via `@clerk/react`)
- **Email**: Resend (graceful fallback if `RESEND_API_KEY` not set)
- **Build**: esbuild (ESM bundle for API)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite libs (run after schema changes)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run push-force` — force push (drops conflicting data)
- `pnpm --filter @workspace/scripts run seed:reliefops` — seed Sudan demo data
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Multi-Tenancy
- Custom `organizations` + `org_members` tables (Clerk managed-tier does not support orgs)
- Every user must belong to an org; `requireOrg` middleware enforces this server-side
- First sign-in → Onboarding wizard (create or join via 6-char invite code)
- Org-scoped: hubs, volunteers, requests, transfers, tasks, activity_log, board_posts
- Items catalog is global (shared across all orgs)

### Database Schema (`lib/db/src/schema/`)
- `organizations` — NGO orgs with invite codes
- `org_members` — user ↔ org mapping with roles (Admin / Coordinator / Viewer)
- `board_posts` — inter-NGO shared board posts
- `hubs` — relief distribution hubs (org-scoped)
- `items` — supply item catalog (global)
- `hub_stock` — stock per hub/item
- `requests` — supply requests (org-scoped)
- `transfers` — stock transfers between hubs (org-scoped)
- `volunteers` — field volunteers with email/phone (org-scoped)
- `tasks` — assignments for transfers (org-scoped)
- `activity_log` — audit trail (org-scoped)

### API Routes (`artifacts/api-server/src/routes/`)
All routes under `/api/`. Protected by `requireAuth` (Clerk JWT) + `requireOrg` (org lookup).
- `orgs` — create, join, manage members, invite by email
- `board` — shared inter-NGO board posts (visible to all orgs)
- `hubs` — hub CRUD + stock management
- `items` — item catalog
- `requests` — supply requests + matching hub finder
- `transfers` — transfers + stock deduction on dispatch
- `volunteers` — volunteer management
- `tasks` — task assignment + Resend email on assignment
- `activity` — org-scoped audit log
- `dashboard` — summary stats + low-stock alerts
- `stock` — CSV import endpoint

### Frontend Pages (`artifacts/reliefops/src/pages/`)
- `Landing` — public marketing page
- `Onboarding` — create/join org wizard (shown when user has no org)
- `Dashboard` — KPI summary + charts
- `HubList` / `HubDetail` — hub management + stock view
- `RequestList` / `RequestCreate` / `RequestDetail` — supply requests
- `TransferList` / `TransferDetail` — logistics transfers
- `VolunteerList` — volunteer management
- `ActivityLog` — org audit log
- `SharedBoard` — inter-NGO shared board (all orgs)
- `TeamManagement` — invite/manage org members + invite code display

### Key Context
- `OrgContext` (`src/context/OrgContext.tsx`) — fetches current user's org from `/api/orgs/me`; gates all protected routes

## Sudan Demo Data
Seed creates `UNICEF Sudan` org (invite code: `SUDAN1`) with:
- 4 hubs: Khartoum Central Hub, Port Sudan Depot, El Fasher Field Base, Kassala Relief Point
- 17 item types (medicines, food, hygiene, first aid — Sudan-relevant)
- 8 volunteers with Sudanese names + emails
- 3 requests (Critical cholera, Urgent hygiene, Urgent food)
- 1 active transfer (Khartoum → Kassala, Dispatched)
- 3 board posts (surplus rice, cholera kit need, convoy route info)

## Secrets / Environment Variables
- `SESSION_SECRET` — Express session secret
- `RESEND_API_KEY` — optional; if absent, email sends are silently skipped
- `DATABASE_URL` — PostgreSQL connection (auto-provisioned by Replit)
- `VITE_CLERK_PUBLISHABLE_KEY` + `VITE_CLERK_PROXY_URL` — Clerk auth
