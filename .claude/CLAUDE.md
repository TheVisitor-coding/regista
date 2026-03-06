# CLAUDE.md — Regista

## Projet
- **Nom** : regista
- **Chemin** : /Users/mat/dev/regista
- **Type** : Jeu web de gestion de football (Football Management Game)
- **Stack** : TanStack Start + React 19 + Tailwind CSS 4 + shadcn/ui · AdonisJS 6 + Socket.io + BullMQ · PostgreSQL 17 + Drizzle ORM · Redis 7 · Turborepo + pnpm 9.15.4 · Node.js 22
- **Repo** : local uniquement (pas de remote configuré)
- **Vault miroir** : ~/Personal_Vault/02 - Projects/regista/Session-Logs/

## État actuel
- **Phase** : Specs MVP complètes (SPEC-01 à SPEC-14) — Implémentation non démarrée
- **Branche principale** : main

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
- [2026-03-03] Modération : aucun blocage automatique de compte — toutes les alertes remontent à un admin humain (évite faux positifs, scoring ML = post-MVP)
- [2026-03-03] Modération : validation noms = unicité exacte case-insensitive + blacklist Redis (~500 termes seedés). Pas de Levenshtein au MVP.
- [2026-03-03] Cosmétiques (Lot 2) : table `premium_transactions` créée mais vide — paiement réel (Stripe) est Lot 3. Uniquement G$ au lancement.

## Bugs connus / Points d'attention
<!-- /mem ajoute ici -->
- [2026-03-03] `packages/shared/src/constants.ts` : vérifier que SECONDS_PER_SIMULATED_MINUTE=60, TACTICAL_CHANGE_COOLDOWN_MINUTES=5, MATCH_FREQUENCY_DAYS=3

## Conventions de code
- TypeScript strict everywhere
- AdonisJS 6 : 1 dossier domaine dans `app/` (ex: `app/match/`, `app/club/`) avec controllers, services, validators
- Frontend : routing fichiers TanStack Router dans `src/routes/`
- Types partagés → `packages/shared/src/`
- Schéma DB → `packages/db/src/schema/`
- Alias `~/` → `./src/` (api et web)
- Commits conventionnels : feat:, fix:, docs:, refactor:, test:
- Specs-driven : toute feature doit avoir une spec dans `docs/specs/` avant implémentation

## Historique récent
<!-- /mem ajoute ici — archivage auto après 30 jours -->
- [2026-03-03] Session #1 : Setup projet + rédaction SPEC-01 à SPEC-14 (corpus complet)
- [2026-03-06] Session #2 : Mise à jour stack technique + config Docker (Node 22, Japa, docker-compose.dev.yml, scripts docker:*)
