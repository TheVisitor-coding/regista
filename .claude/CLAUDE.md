# CLAUDE.md — Regista

## Projet
- **Nom** : regista
- **Chemin** : /Users/mat/dev/regista
- **Type** : Jeu web de gestion de football (Football Management Game)
- **Stack** : TanStack Start + React 19 + Tailwind CSS 4 + shadcn/ui · AdonisJS 6 + Socket.io + BullMQ · PostgreSQL 17 + Drizzle ORM · Redis 7 · Turborepo + pnpm 9.15.4 · Node.js 22
- **Repo** : local uniquement (pas de remote configuré)
- **Vault miroir** : ~/Personal_Vault/02 - Projects/regista/Session-Logs/

## État actuel
- **Phase** : MVP Gameplay implémenté (Phases 2-11) — Phase 0 Sauvetage en cours (6/7 specs P0 complétées)
- **Branche principale** : main
- **Implémenté** : Auth, Club+Squad, Dashboard, Notifications, Finances, Competition (leagues/divisions/standings/calendar), AI Clubs (59/league), Match Engine (simulation minute par minute), Game Loop (post-match pipeline, season lifecycle), Training, Progression, Transfers, Tactics, Stats
- **Non implémenté** : Modération (SPEC-13), Polish (SPEC-14), Seed data
- **Tests** : 89/89 passent (unit: 62, functional: 26, integration: 1) — 13s

## Décisions techniques
<!-- /mem ajoute ici — chaque entrée préfixée par [YYYY-MM-DD] -->
- [2026-03-03] Architecture monorepo : apps/web (port 3000) + apps/api (port 3001) + packages/shared + packages/db
- [2026-03-03] Pas de fenêtre de transfert — marché toujours ouvert
- [2026-03-03] Économie délibérément déficitaire (~6.3M G$/saison) pour forcer la gestion active
- [2026-03-03] G$ (Game Dollars) = monnaie in-game stockée en bigint (centimes), non achetable avec de l'argent réel
- [2026-03-03] Matchs simulés minute par minute via BullMQ (job persistant), durée réelle 90 min
- [2026-03-03] Clubs IA stockés dans les mêmes tables que les humains (`is_ai` boolean non exposé au client)
- [2026-03-03] Progression : pas de système XP — gains directs sur les stats, plafond `potential + 5`
- [2026-03-03] 14 specs rédigées : SPEC-01 Auth, 02 Club, 03 Match, 04 Effectif, 05 Championnat, 06 Transferts, 07 IA Clubs, 08 Onboarding, 09 Entraînement, 10 Finances, 11 Tactiques, 12 Progression, 13 Modération, 14 Cosmétiques (Lot 2)
- [2026-03-03] Changement backend : NestJS → AdonisJS 6. Auth intégrée, VineJS validation, conventions fortes. Socket.io conservé (intégration manuelle). BullMQ + Drizzle conservés.
- [2026-03-06] Tests API : Japa (pas Vitest) — @japa/runner + @japa/assert + @japa/api-client + @japa/plugin-adonisjs
- [2026-03-06] AdonisJS imports : subpath imports Node.js avec préfixe `#` (#controllers/*, #services/*, etc.) — pas d'alias `~/` côté API
- [2026-03-06] AdonisJS dev : `node ace serve --hmr` via hot-hook + @swc/core (HMR natif)
- [2026-03-06] Docker : 3 modes — `docker:infra:up` (postgres+redis seuls), `docker:up` (prod build), `docker:dev:up` (dev mode avec volumes nommés, hot-reload)
- [2026-04-03] Match engine MVP : 1 seconde réelle par minute de jeu (constante SECONDS_PER_SIMULATED_MINUTE). Configurable pour passer à 60s en production.
- [2026-04-03] Clubs IA : générés synchroniquement à la création du club humain. 59 clubs par league (3 divisions × ~20 clubs). Overall calibré par division (Div1: 70-80, Div2: 60-70, Div3: 50-65).
- [2026-04-03] Tactics stockées en Redis (pas en DB) pour le MVP — clé `tactics:{clubId}`.
- [2026-04-03] Post-match pipeline : 10 étapes séquentielles dans match_worker.ts (stats, standings, fatigue, injuries, suspensions, recovery, progression, training, finances, notifications + matchday advancement).
- [2026-04-03] BullMQ workers : email, match (scheduler cron 5min + pre-match/simulate/post-process), transfer (AI market refresh 4h UTC, expire offers hourly, expire free agents daily), finance (salary weekly lundi 00:00 UTC).
- [2026-03-03] Modération : aucun blocage automatique de compte — toutes les alertes remontent à un admin humain (évite faux positifs, scoring ML = post-MVP)
- [2026-03-03] Modération : validation noms = unicité exacte case-insensitive + blacklist Redis (~500 termes seedés). Pas de Levenshtein au MVP.
- [2026-03-03] Cosmétiques (Lot 2) : table `premium_transactions` créée mais vide — paiement réel (Stripe) est Lot 3. Uniquement G$ au lancement.
- [2026-04-07] Tests : Redis connecté dans bootstrap.ts (setup) et flushé entre chaque test fonctionnel (redis.flushdb dans group.each.setup). 3 suites Japa : unit, functional, integration. Ne jamais appeler redis.connect/quit dans les tests individuels.
- [2026-04-07] Tests : .env.test a EMAIL_VERIFICATION_REQUIRED=true pour tester le flow complet avec vérification email. Queries de test sur club_staff/clubs doivent filtrer par clubId/userId (la table contient les 59 AI clubs).

## Bugs connus / Points d'attention
<!-- /mem ajoute ici -->
- [2026-04-03] AdonisJS config/app.ts : la propriété `qs` (query string parser) est requise dans `http` pour @adonisjs/http-server@7.8.0
- [2026-04-03] .env monorepo : AdonisJS lit .env dans apps/api/ (symlink vers racine), le web a son propre .env avec VITE_* uniquement
- [2026-04-03] vine.literal(true) au lieu de vine.accepted() pour valider les booléens JSON (pas les strings HTML form)
- [2026-04-03] userId nullable sur la table clubs (nécessaire pour les clubs IA)
- [2026-04-03] Création de league (~59 clubs + 1140 matchs) = ~30-60s — pas de loading indicator adapté sur le frontend onboarding
- [2026-04-03] drizzle.config.ts utilise dotenv pour charger DATABASE_URL depuis le .env racine (devDependency dans packages/db)
- [2026-04-07] .env.test utilise Redis DB 0 (même que dev) — `redis.flushdb()` en test efface les données dev Redis. Envisager DB 1 pour les tests.

## Conventions de code
- TypeScript strict everywhere
- AdonisJS 6 : 1 dossier domaine dans `app/` (ex: `app/match/`, `app/club/`) avec controllers, services, validators
- Frontend : routing fichiers TanStack Router dans `src/routes/`
- Types partagés → `packages/shared/src/`
- Schéma DB → `packages/db/src/schema/`
- Alias `~/` → `./src/` (api et web)
- Commits conventionnels : feat:, fix:, docs:, refactor:, test:
- Specs-driven : toute feature doit avoir une spec dans `docs/specs/` avant implémentation
- Tests fonctionnels : chaque `group.each.setup` doit appeler `redis.flushdb()` + cleanup DB des tables utilisées
- Logique testable : extraire les fonctions pures du controller (ex: `buildMarketFilters`) pour permettre les tests unitaires sans HTTP/auth

## Historique récent
<!-- /mem ajoute ici — archivage auto après 30 jours -->
- [2026-03-03] Session #1 : Setup projet + rédaction SPEC-01 à SPEC-14 (corpus complet)
- [2026-03-06] Session #2 : Mise à jour stack technique + config Docker (Node 22, Japa, docker-compose.dev.yml, scripts docker:*)
- [2026-03-06] Session #3 : Implémentation SPEC-01 Auth (backend + frontend, ~30 fichiers)
- [2026-04-03] Session #4 : Implémentation Phases 2-11 (~140 fichiers, 8 migrations). MVP gameplay complet. Fix bugs testabilité (auth, env, CORS, qs config).
- [2026-04-07] Session #5 : SPEC-P0-06 (filtres marché), SPEC-P0-07 (tests critiques match engine + finances + integration). Fix 15 tests fonctionnels (Redis bootstrap, rate limiters, email verification, club staff query). 89/89 tests passent. Workflow testing formalisé dans CLAUDE.md.
