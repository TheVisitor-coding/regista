# Regista - Claude Code Context

## Project Overview
Regista is a web-based football management game inspired by Virtuafoot. Players manage clubs, compete in leagues, and experience real-time match simulation.

## Tech Stack
- **Frontend**: TanStack Start + React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: NestJS + TypeScript + Socket.io + BullMQ
- **Database**: PostgreSQL 17 + Drizzle ORM
- **Cache**: Redis 7
- **Monorepo**: Turborepo + pnpm
- **Infra**: Docker Compose

## Project Structure
- `apps/web/` — Frontend (TanStack Start, port 3000)
- `apps/api/` — Backend API (NestJS, port 3001)
- `packages/shared/` — Shared types, constants, utils (`@regista/shared`)
- `packages/db/` — Drizzle schema, migrations, DB client (`@regista/db`)
- `docs/specs/` — Functional specifications (specs-driven development)

## Development Methodology
- **Specs-Driven**: Every feature is specified in `docs/specs/` before implementation
- **Type-safe end-to-end**: Drizzle → API → Frontend via shared package
- **Test coverage**: Vitest for unit/integration tests
- **Conventional Commits**: feat:, fix:, docs:, refactor:, test:

## Commands
- `pnpm dev` — Start all apps in dev mode
- `pnpm build` — Build all apps
- `pnpm test` — Run all tests
- `docker compose up -d` — Start PostgreSQL + Redis
- `pnpm db:generate` — Generate Drizzle migrations
- `pnpm db:migrate` — Apply migrations

## Code Conventions
- TypeScript strict mode everywhere
- NestJS: 1 module per domain (e.g., `modules/match/`, `modules/club/`)
- Frontend: File-based routing with TanStack Router in `src/routes/`
- Shared types go in `packages/shared/src/`
- DB schema in `packages/db/src/schema/`
- API path alias: `~/` → `./src/`
- Frontend path alias: `~/` → `./src/`
