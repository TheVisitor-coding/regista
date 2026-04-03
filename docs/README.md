# Regista - Documentation

## Contexte du projet

**Regista** est un jeu web de management de football inspiré de [Virtuafoot](https://www.virtuafoot.com/), modernisé pour offrir une expérience accessible, stratégique et sans pay-to-win.

Chaque joueur gère son propre club de football : effectif, tactique, entraînements, transferts. Les matchs se déroulent **en temps réel à heures fixes** (90 minutes simulées en accéléré), avec des événements dynamiques générés par un moteur de simulation. Le joueur peut intervenir pendant le match (changements tactiques, remplacements) ou laisser le match se jouer automatiquement.

### Vision

> *"Un jeu de management de football web moderne, accessible et stratégique, où les matchs se jouent en temps réel à heures fixes, même en l'absence du joueur. Une expérience addictive, inspirée du réel mais pensée pour un usage quotidien rapide, sans micro-management étouffant, ni logique pay-to-win."*

### Persona cible

**Thomas, 26 ans** — Passionné de foot, vie active. Se connecte souvent mais brièvement (métro, pause déj, soir). Veut optimiser son club par la stratégie, pas par son portefeuille.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | TanStack Start + React 19 + Tailwind CSS 4 + shadcn/ui |
| Backend | AdonisJS 6 + TypeScript |
| Database | PostgreSQL 17 + Drizzle ORM |
| Real-time | Socket.io |
| Cache / Queue | Redis 7 + BullMQ |
| Monorepo | Turborepo + pnpm |
| Infra | Docker Compose |

---

## Structure du projet

```
regista/
├── apps/
│   ├── web/              # Frontend (TanStack Start + React)
│   └── api/              # Backend (AdonisJS)
├── packages/
│   ├── shared/           # Types, constantes, utils partagés
│   └── db/               # Drizzle schema + migrations + client
├── docs/                 # Documentation & specs fonctionnelles
│   ├── README.md         # Ce fichier
│   └── specs/            # Spécifications fonctionnelles par feature
├── docker/               # Dockerfiles
├── docker-compose.yml    # Stack Docker complète (web + api + postgres + redis)
├── turbo.json            # Config Turborepo
└── pnpm-workspace.yaml   # Config workspaces pnpm
```

---

## Méthodologie de développement

### Specs-Driven Development

Le développement de Regista suit une approche **Specs-Driven** :

1. **Spécification** — Chaque fonctionnalité est d'abord spécifiée en détail dans `docs/specs/` avant toute implémentation. La spec décrit le comportement attendu, les règles métier, les modèles de données, les endpoints API, et les critères d'acceptation.

2. **Implémentation** — Le code est écrit en suivant strictement la spec. Les décisions d'implémentation non couvertes par la spec sont documentées et validées.

3. **Tests** — Chaque fonctionnalité est couverte par des tests (unitaires, intégration, e2e selon le cas). Les tests sont écrits en parallèle ou avant l'implémentation quand c'est pertinent.

4. **Review** — Le code est revu par rapport à la spec. Toute divergence est soit justifiée soit corrigée.

### Format des specs

Chaque spec fonctionnelle suit cette structure :

```
docs/specs/
├── 01-auth.md
├── 02-club-management.md
├── 03-match-engine.md
├── ...
```

Chaque fichier de spec contient :
- **Objectif** — Ce que la fonctionnalité apporte au joueur
- **User Stories** — Les cas d'usage principaux
- **Règles métier** — La logique de jeu détaillée
- **Modèle de données** — Les entités et relations (Drizzle schema)
- **API Endpoints** — Les routes et leur contrat (request/response)
- **Real-time Events** — Les événements Socket.io si applicable
- **UI/UX** — Description des écrans et interactions
- **Critères d'acceptation** — Conditions de validation
- **Tests** — Stratégie de test pour la fonctionnalité

### Conventions de code

- **TypeScript strict** partout (frontend + backend)
- **Type-safety end-to-end** : Drizzle schema → API types → Frontend types via `@regista/shared`
- **AdonisJS domains** : 1 dossier domaine dans `app/` (ex: `app/match/`, `app/club/`)
- **File-based routing** TanStack Router
- **Tests** : Vitest pour les tests unitaires/intégration
- **Commits** : Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

---

## Lots de développement

### Lot 1 — MVP jouable (Sprints 1-3)
Core gameplay : matchs temps réel, gestion d'équipe, championnat, IA PVE, dashboard.

### Lot 2 — Profondeur & Monétisation (Sprints 4-6)
Entraînement, transferts, cosmétiques, shop, modération.

### Lot 3 — Long terme & Fidélisation
Tournois, météo, IA évolutive, événements live, éditeur maillots, social.

---

## Démarrage rapide

```bash
# Cloner et installer
git clone <repo-url>
cd regista
pnpm install

# Lancer l'infra (PostgreSQL + Redis)
pnpm docker:infra:up

# Copier les variables d'environnement
cp .env.example .env

# Lancer le dev
pnpm dev
```

## Démarrage Docker: fonctionnement

- `docker-compose.yml` contient la stack de base: `postgres`, `redis`, `api`, `web`
- `docker-compose.dev.yml` est un override pour `api` et `web` (mode dev/hot-reload)
- Le mode dev Docker doit être lancé avec les deux fichiers: `pnpm docker:dev:up`

## Authentification frontend (persistance)

- L'application utilise un modèle hybride pour la session côté client :
	- `refresh_token` en cookie httpOnly (rotation via `/auth/refresh`)
	- `accessToken` persisté côté client pour conserver la session au refresh de page
- Au chargement de l'app, le frontend :
	1. hydrate l'état auth depuis le stockage local
	2. tente une resynchronisation via `/users/me`
	3. fallback sur `/auth/refresh` si nécessaire

### Vérification email en développement

- Par défaut, en environnement `development` et `test`, la vérification email peut être bypassée pour éviter de bloquer le login tant que l'envoi d'emails n'est pas branché.
- Le backend expose le flag d'environnement `EMAIL_VERIFICATION_REQUIRED` :
	- `false` (ou absent en dev/test) : inscription active immédiatement, `needsVerification=false`
	- `true` : comportement strict avec confirmation email
- En production, la vérification email reste strictement requise par défaut.
