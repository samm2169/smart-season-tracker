# SmartSeason Field Monitoring System

## Overview

A full-stack web application for tracking crop progress across multiple fields during a growing season. Supports two roles: Admin (Coordinator) and Field Agent.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/smartseason)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (managed auth)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Auth & Roles
- Authentication via Clerk
- On first login, users are auto-created in the DB with `agent` role
- Admins must manually promote users via the `/users` page
- Demo credentials managed via Clerk Auth pane

### Field Status Logic
Status is computed server-side on each field write based on:
- **completed** — if stage is `harvested`
- **at_risk** — if:
  - stage is `growing` and planting date > 90 days ago (overdue)
  - stage is `ready` and last update > 7 days ago (delayed harvest)
  - stage is `planted` and last update > 14 days ago (no progress)
- **active** — all other cases

### Database Schema
- `users` — clerk_id, email, name, role (admin|agent)
- `fields` — name, crop_type, planting_date, current_stage, status, assigned_agent_id, location, area_hectares, last_updated_at
- `field_updates` — field_id, agent_id, stage, note

### API Routes
All routes under `/api`. Auth via Clerk session cookies.

## Demo Data
Seeded with 3 users (1 admin, 2 agents) and 6 sample fields in various stages.
To promote yourself to admin: sign up, then go to the database and update your user's role to 'admin'.
