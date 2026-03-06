# Regista

A modern web-based football management game. Build your club, set your tactics, compete in leagues — matches play out in real-time.

Inspired by [Virtuafoot](https://www.virtuafoot.com/), reimagined for 2025+.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure only (PostgreSQL + Redis)
pnpm docker:infra:up

# Run in development
pnpm dev
```

## Docker (stack complète)

Lancement complet sans Node installé sur la machine hôte (web + api + postgres + redis) :

```bash
cp .env.example .env
pnpm docker:up
```

Services exposés :
- Web: http://localhost:3000
- API: http://localhost:3001
- Health API: http://localhost:3001/health

Arrêt :

```bash
pnpm docker:down
```

## Docker (développement)

Mode dev conteneurisé avec hot-reload API + Web (aucun Node requis sur l'hôte) :

```bash
cp .env.example .env
pnpm docker:dev:up
```

Logs en temps réel :

```bash
pnpm docker:dev:logs
```

Arrêt :

```bash
pnpm docker:dev:down
```

Si vous avez des conteneurs orphelins après des changements de compose :

```bash
pnpm docker:dev:down
pnpm docker:dev:up
```

## Stack

**Frontend** — TanStack Start + React 19 + Tailwind CSS + shadcn/ui
**Backend** — AdonisJS 6 + Socket.io + BullMQ
**Database** — PostgreSQL + Drizzle ORM
**Infra** — Docker Compose + Turborepo

## Documentation

See [`docs/`](./docs/) for project documentation and functional specifications.
