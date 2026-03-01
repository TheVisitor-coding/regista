# Regista

A modern web-based football management game. Build your club, set your tactics, compete in leagues — matches play out in real-time.

Inspired by [Virtuafoot](https://www.virtuafoot.com/), reimagined for 2025+.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# Copy environment variables
cp .env.example .env

# Run in development
pnpm dev
```

## Stack

**Frontend** — TanStack Start + React 19 + Tailwind CSS + shadcn/ui
**Backend** — NestJS + Socket.io + BullMQ
**Database** — PostgreSQL + Drizzle ORM
**Infra** — Docker Compose + Turborepo

## Documentation

See [`docs/`](./docs/) for project documentation and functional specifications.
