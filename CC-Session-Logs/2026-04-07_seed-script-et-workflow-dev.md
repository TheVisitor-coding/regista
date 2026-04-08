---
type: session-log
date: 2026-04-07
project: regista
tags: [session, seed, workflow, bullmq, match-engine, drizzle, tsx, refactor, bug-fix]
---

# Session : 2026-04-07 — Seed script et workflow de dev (SPEC-P0-05)

## Quick Reference
**Sujets :** Script de seed complet, seed minimal, avancement de journees, preflight checks, refactor post-match, fix bug RM/LM enum
**Resultat :** 3 commandes seed fonctionnelles (full en 10.8s, minimal en 0.2s, advance en 4.6s) + preflight.sh + refactor post-match service

## Ce qui a ete fait
- Cree `post_match_service.ts` extrait de `match_worker.ts` (updateStandings, applyFatigue, processInjuries, processSuspensions, applyFatigueRecovery)
- Cree `seed-utils.ts` avec fonctions partagees : truncateAll, seedBlacklist, createDevUser, createHumanClub, simulateMatchdays
- Cree `seed.ts` : seed complet (1 user, 60 clubs, 1320 joueurs, 3 divisions, 4 journees simulees) en ~10.8s
- Cree `seed-minimal.ts` : seed leger pour tests (1 user, 1 club, 22 joueurs) en ~0.2s
- Cree `seed-advance.ts` : avancer de N journees sur une DB seedee
- Cree `scripts/preflight.sh` : verifie PostgreSQL, Redis, .env avant `pnpm dev`
- Mis a jour package.json (root + api), turbo.json avec les scripts seed
- Fix bug RM/LM dans lineup_service.ts (positions invalides en DB)

## Decisions prises
- **Scripts tsx standalone** plutot que ace commands : parce que le seed n'a pas besoin du boot AdonisJS complet, et c'est le meme pattern que le seed existant dans packages/db
- **Vrai MatchEngine pour simuler les 4 journees** : parce que c'est du CPU pur (pas d'I/O par minute), et ca garantit des standings/events/stats coherents sans fake data
- **TRUNCATE CASCADE** pour l'idempotence : parce que c'est le plus simple et le plus rapide (pas de logique "check if exists")
- **Extraction post_match_service.ts** : parce que le worker et le seed ont besoin de la meme logique (standings, fatigue, etc.)
- **Preload env.ts avec --import** : parce que les imports ESM sont hoistes avant l'execution de `dotenv.config()`, donc il faut charger l'env avant le module principal
- **Post-match simplifie dans le seed** : skip finances, progression, training, notifications — seuls standings/fatigue/injuries/suspensions sont appliques

## Problemes resolus
- **Probleme** : `Cannot find package 'dotenv'` au lancement du seed
- **Cause** : dotenv n'etait pas une dependance de `@regista/api`
- **Solution** : Ajout de dotenv en devDependency

- **Probleme** : `DATABASE_URL is required to initialize @regista/db` malgre dotenv.config()
- **Cause** : Les imports ESM sont hoistes — `import { db } from '@regista/db'` s'execute avant `config()`, donc DATABASE_URL n'est pas encore defini
- **Solution** : Cree un fichier `env.ts` separe charge via `tsx --import ./scripts/env.ts` qui s'execute avant tout import

- **Probleme** : `invalid input value for enum player_position: "RM"` pendant la simulation
- **Cause** : Les formations (FORMATIONS constant) utilisent "RM" et "LM" comme positions tactiques, mais l'enum DB `player_position` ne les inclut pas (seulement GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, CF)
- **Solution** : Ajout d'un mapping `POSITION_DB_MAP` dans `lineup_service.ts` : RM->RW, LM->LW. Ce bug aurait aussi plante la simulation en production.

- **Probleme** : Output TRUNCATE CASCADE tres bruyant (33 notices PostgreSQL)
- **Cause** : PostgreSQL affiche un NOTICE pour chaque table en cascade
- **Solution** : `SET client_min_messages TO WARNING` avant le TRUNCATE, puis retablir a NOTICE apres

## Points d'attention
- Le bug RM/LM etait pre-existant — il aurait plante toute simulation de match en production aussi (pas seulement le seed). Le fix dans `lineup_service.ts` corrige les deux cas.
- Le seed utilise `LeagueService.createLeague()` tel quel — si cette function change, le seed suivra automatiquement
- Le preflight.sh affiche des warnings si pg_isready/redis-cli ne sont pas installes (pas bloquant)
- Les TRUNCATE notices sont desormais supprimes via `SET client_min_messages`

## Taches en suspens
- [ ] CI/CD GitHub Actions (hors scope SPEC-P0-05)
- [ ] Docker compose pour le dev (nice-to-have)
- [ ] Tests E2E avec le seed comme base
- [ ] `pnpm db:reset` (migration:fresh + seed) — a ajouter si besoin
- [ ] Verifier que `pnpm dev` lance bien les workers BullMQ (preloads environment: ['web'] dans adonisrc.ts)

## Fichiers impactes
- `apps/api/app/match/post_match_service.ts` — CREE : logique post-match extraite du worker
- `apps/api/app/workers/match_worker.ts` — MODIFIE : imports depuis post_match_service au lieu de fonctions inline
- `apps/api/app/match/lineup_service.ts` — MODIFIE : fix mapping RM/LM -> RW/LW pour l'enum DB
- `apps/api/scripts/env.ts` — CREE : preload dotenv pour les scripts seed
- `apps/api/scripts/seed-utils.ts` — CREE : fonctions partagees (truncate, seed, simulate)
- `apps/api/scripts/seed.ts` — CREE : seed complet
- `apps/api/scripts/seed-minimal.ts` — CREE : seed minimal
- `apps/api/scripts/seed-advance.ts` — CREE : avancer N journees
- `scripts/preflight.sh` — CREE : verifications pre-dev
- `apps/api/package.json` — MODIFIE : scripts seed + devDeps (tsx, dotenv)
- `package.json` (root) — MODIFIE : scripts seed + preflight dans dev
- `turbo.json` — MODIFIE : tasks seed (no cache)

---

## Log detaille

### Contexte
Session dediee a l'implementation de SPEC-P0-05 (seed script + workflow de dev). La spec demande un seed complet creant un environnement de jeu (60 clubs, 3 divisions, calendrier, 4 journees simulees) en <30s, plus un workflow dev avec pre-flight checks.

### Phase de planification
Exploration du codebase avec 3 agents en parallele :
1. Schema DB (35 tables, 14 migrations, schema dans packages/db/src/schema/)
2. Services et workers (LeagueService, MatchEngine, post-match pipeline dans match_worker.ts)
3. Config dev (turbo, docker-compose, package.json scripts)

Lecture approfondie de : league_service.ts, match_worker.ts, match_engine.ts, season_lifecycle_service.ts, squad_generation_service.ts, ai_club_service.ts, lineup_service.ts.

### Decisions d'architecture
- Scripts tsx standalone : le seed importe directement les services sans passer par le boot AdonisJS. Avantage : rapide, simple, meme pattern que packages/db/src/seed.ts existant.
- Extraction post_match_service.ts : les fonctions updateStandings, applyFatigue, etc. etaient des fonctions privees dans match_worker.ts. Les extraire permet de les reutiliser dans le seed sans dupliquer ~150 lignes de code.
- Simulation avec le vrai MatchEngine : la spec demande des resultats "realistes". Plutot que generer des scores aleatoires, on utilise le vrai engine (simulateMinute est du CPU pur). 120 matchs simules en parallele par batch de 10.

### Implementation
1. Cree post_match_service.ts — copie exacte des fonctions du worker, ajout des exports
2. Modifie match_worker.ts — remplace les fonctions inline par des imports
3. Cree seed-utils.ts — truncateAll (TRUNCATE CASCADE), seedBlacklist, createDevUser (bcrypt hash), createHumanClub (SquadGenerationService), simulateMatchdays (boucle prepare+simulate+post-process)
4. Cree seed.ts, seed-minimal.ts, seed-advance.ts
5. Cree preflight.sh — checks pg_isready, redis-cli, .env
6. Mis a jour package.json, turbo.json

### Bugs rencontres et resolus

**Bug 1 : dotenv not found**
Le premier `pnpm seed` a plante car `dotenv` n'etait pas dans les deps de @regista/api. Ajout en devDependency.

**Bug 2 : DATABASE_URL undefined**
Meme apres l'ajout de dotenv, `config()` s'executait apres les imports ESM (hoisting). Solution : fichier env.ts separe charge via `tsx --import ./scripts/env.ts` qui s'execute en amont de tout import.

**Bug 3 : invalid enum value "RM"**
Le plus interessant. Les FORMATIONS dans shared/constants.ts utilisent "RM" et "LM" comme positions tactiques (right midfielder, left midfielder). Mais l'enum DB `player_position` n'a que : GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, CF. `AutoLineupService.selectStartingXI()` retourne la position de la formation ("RM"), et `LineupService.saveLineup()` l'insere telle quelle en DB -> crash PostgreSQL.

Fix : ajout d'un mapping `POSITION_DB_MAP` dans lineup_service.ts qui convertit RM->RW et LM->LW a l'insertion. Ce bug est pre-existant et aurait aussi plante la simulation en production.

**Bug 4 : TRUNCATE notices**
PostgreSQL affiche un NOTICE pour chaque table cascadee (~33 lignes). Fix : `SET client_min_messages TO WARNING` temporairement.

### Resultats finaux
- `pnpm seed` : 60 clubs, 1320 joueurs, 3 saisons a matchday 5, standings coherents — **10.8s**
- `pnpm seed` (idempotent) : meme resultat, aucune erreur — **10.8s**
- `pnpm seed:minimal` : 1 user, 1 club, 22 joueurs — **0.2s**
- `pnpm seed:advance 2` : 2 journees supplementaires simulees — **4.6s**
- `bash scripts/preflight.sh` : checks PostgreSQL, Redis, .env — fonctionne (warnings si CLI tools absents)
