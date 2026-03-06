# Regista - Claude Code Context

## Project Overview
Regista is a web-based football management game inspired by Virtuafoot. Players manage clubs, compete in leagues, and experience real-time match simulation.

## Tech Stack
- **Frontend**: TanStack Start + React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: AdonisJS 6 + TypeScript + Socket.io + BullMQ
- **Database**: PostgreSQL 17 + Drizzle ORM
- **Cache**: Redis 7
- **Monorepo**: Turborepo + pnpm 9.15.4
- **Runtime**: Node.js 22
- **Infra**: Docker Compose (prod + dev modes)

## Project Structure
- `apps/web/` — Frontend (TanStack Start, port 3000)
- `apps/api/` — Backend API (AdonisJS 6, port 3001)
- `packages/shared/` — Shared types, constants, utils (`@regista/shared`)
- `packages/db/` — Drizzle schema, migrations, DB client (`@regista/db`)
- `docs/specs/` — Functional specifications (specs-driven development)

## Development Methodology
- **Specs-Driven**: Every feature is specified in `docs/specs/` before implementation
- **Type-safe end-to-end**: Drizzle → API → Frontend via shared package
- **Test coverage**: Japa (API) for unit/integration tests
- **Conventional Commits**: feat:, fix:, docs:, refactor:, test:

## Commands
- `pnpm dev` — Start all apps in dev mode (local)
- `pnpm build` — Build all apps
- `pnpm test` — Run all tests
- `pnpm db:generate` — Generate Drizzle migrations
- `pnpm db:migrate` — Apply migrations
- `pnpm db:seed` — Seed the database

### Docker
- `pnpm docker:infra:up` — Start PostgreSQL + Redis only (for local dev)
- `pnpm docker:up` — Start full stack (production build)
- `pnpm docker:dev:up` — Start full stack in dev mode (hot-reload, volume mounts)
- `pnpm docker:dev:down` — Stop dev stack

## Code Conventions
- TypeScript strict mode everywhere
- AdonisJS: 1 domain folder in `app/` (e.g., `app/match/`, `app/club/`) with controllers, services, validators
- AdonisJS import aliases: `#controllers/*`, `#services/*`, `#middleware/*`, `#validators/*`, `#exceptions/*`, `#providers/*`, `#config/*`, `#start/*` (Node.js subpath imports)
- AdonisJS dev: `node ace serve --hmr` (hot-hook + @swc/core)
- Frontend: File-based routing with TanStack Router in `src/routes/`
- Shared types go in `packages/shared/src/`
- DB schema in `packages/db/src/schema/`
- Frontend path alias: `~/` → `./src/`
