---
type: session-log
date: 2026-04-03
project: regista
tags: [session, adonisjs, tanstack-start, drizzle, match-engine, transfers, training, bug-fix, cors, auth, devops]
---

# Session : 2026-04-03 — Implémentation Phases 2-11 MVP + Fix testabilité locale

## Quick Reference
**Sujets :** Implémentation massive Phases 2-11 (club dashboard, competition, match engine, transfers, training, finances, tactics), debugging auth/env/CORS/config AdonisJS
**Résultat :** MVP gameplay complet implémenté (~140 fichiers, 8 migrations), bugs de testabilité locale identifiés et corrigés

## Ce qui a été fait

### Phase 2 — Club Dashboard + Squad (SPEC-02, SPEC-04)
- Types partagés (club, notification, finance, player, dashboard) + constantes
- Schema DB players (players, player_stats, goalkeeper_stats) + migration
- Squad generation service (22 joueurs calibrés par position)
- App shell complet (header avec balance/notifs, sidebar desktop, bottom bar mobile)
- Onboarding wizard 4 étapes (nom, couleurs, logo, confirmation)
- Système notifications CRUD (backend + frontend, welcome notifications)
- Finances (summary, transactions paginées, balance card)
- Squad list/detail (groupé par ligne, fiche joueur avec stat bars)

### Phase 3 — Championship Calendar (SPEC-05)
- Schema competition (leagues, divisions, seasons, standings, matches, season_results, notification_preferences)
- Modification clubs : ajout isAi, aiProfile, divisionId + userId rendu nullable
- AI Club Service : génère 59 clubs IA avec noms combinatoires, squads calibrés par division
- Calendar Service : algorithme round-robin, 38 journées × 10 matchs
- Standings Service : initialisation + lecture avec zones (champion/promotion/relegation)
- Season Service : CRUD saison
- League Service : orchestre création complète (60 clubs, 3 divisions, calendrier)
- Frontend : standings table, matchday page, matches list, match detail
- Intégration : création club → génération league automatique

### Phases 4+5 — AI Behavior + Match Engine (SPEC-03, SPEC-07)
- Schema match detail (match_events, match_lineups, match_stats, match_player_stats, match_tactical_changes) + 9 enums
- AutoLineup Service : sélection formation/XI/banc par position compatibility
- AI Tactics Service : décisions par profil (offensive/balanced/defensive), mentality changes
- Match Engine : simulation minute par minute (possession → zone → tir/faute, probabilités)
- Match probability engine (fonctions pures)
- BullMQ match worker (pre-match, simulate, post-process, scheduler cron 5min)
- Socket.io rooms pour match live
- API : events, lineups, stats, tactical changes
- Frontend : match detail enrichi (event timeline, stats bars, auto-refresh live)

### Phase 6 — Game Loop Orchestration (+ SPEC-09, SPEC-12)
- Training system : table training_programs, service applyTraining, controller GET/PUT
- Progression service : passive post-match +0.1-0.3 stats avec role modifiers
- Post-match pipeline complet (10 étapes : stats, standings, fatigue, injuries, suspensions, recovery, progression, training, finances, notifications)
- Season lifecycle : finishSeason, runIntersaison (promotions/relégations), checkMatchdayComplete

### Phase 7 — Transfer System (SPEC-06)
- Schema transfers (transfer_listings, transfer_offers, transfer_history, free_agents) + 6 enums
- Valuation Service : formule ((OVR-40)/10)^2.5 × 100K × modifiers
- Market Service : list/buy/withdraw, génération IA (~50 joueurs)
- Offer Service : make/accept/reject/counter/cancel, release clause auto-transfer, fund blocking
- Free Agent Service : sign (0 G$), release (indemnité), pool management
- Transfer Executor : transfert atomique
- Transfer Worker BullMQ : refresh AI market, expire offers/free agents
- Frontend : 3 tabs (Market, Free Agents, My Transfers)

### Phases 9-11 — Finances, Tactics, Stats
- Finance Service enrichi : formules revenue par division, salary processing, health checks
- Finance Worker : salary deduction hebdomadaire + health check
- Salary breakdown endpoint + frontend
- Tactics controller + page (formation selector, 6 paramètres tactiques)
- Stats page (position, points, W-D-L, goal diff, squad size, avg overall/age)

### Fix testabilité locale
- vine.accepted() → vine.literal(true) (accepte boolean JSON)
- formatUser() hasClub/clubId : requête DB réelle au lieu de hardcoded false
- Register auto-login en dev (retourne accessToken quand EMAIL_VERIFICATION_REQUIRED=false)
- Frontend : gère erreurs 422 + redirect dashboard au lieu de verify-email
- .env : symlink apps/api/.env → ../../.env, fichier dédié apps/web/.env
- config/app.ts : ajout config qs (query string parser) manquante

## Décisions prises
- Match engine MVP à 1 seconde par minute de jeu (pas 60s temps réel) : pour accélérer les tests, configurable via constante
- AI clubs générés synchroniquement à la création du club humain : simple pour le MVP, pourra être déplacé dans un job BullMQ plus tard
- userId nullable sur la table clubs : nécessaire pour les clubs IA qui n'ont pas d'utilisateur humain
- Training et progression intégrés dans le pipeline post-match : s'appliquent automatiquement après chaque journée
- Pas de table club_sponsorship séparée pour le MVP : les revenus sont calculés à la volée avec des formules par division
- Routes placeholder créées pour toutes les pages (matches, tactics, competition, etc.) : évite les erreurs de type TanStack Router

## Problèmes résolus
- **Problème** : vine.accepted() rejette les booléens JSON envoyés par le frontend
- **Cause** : vine.accepted() attend des strings ("on", "yes", "true"), pas des boolean true
- **Solution** : Remplacé par vine.literal(true)

- **Problème** : hasClub toujours false dans les réponses API
- **Cause** : formatUser() dans auth_controller.ts et user_controller.ts hardcodait hasClub: false, clubId: null
- **Solution** : Ajouté findUserClub() qui requête la table clubs, passé en paramètre à formatUser()

- **Problème** : Register redirige toujours vers /verify-email même en dev
- **Cause** : Le frontend ne checkait pas needsVerification et le backend ne retournait pas d'accessToken au register
- **Solution** : Backend retourne accessToken quand EMAIL_VERIFICATION_REQUIRED=false, frontend redirige vers /dashboard

- **Problème** : API crash avec "Missing environment variable" au démarrage
- **Cause** : AdonisJS cherche .env dans son propre dossier (apps/api/), pas à la racine du monorepo
- **Solution** : Symlink apps/api/.env → ../../.env

- **Problème** : Web prend le port 3001 au lieu de 3000
- **Cause** : Le symlink .env dans apps/web/ importait PORT=3001 qui était lu par le process
- **Solution** : Fichier .env dédié pour le web avec uniquement VITE_API_URL et VITE_WS_URL

- **Problème** : API crash avec "Cannot read properties of undefined (reading 'parse')" dans Qs parser
- **Cause** : config/app.ts manquait la propriété qs dans la config http, requise par @adonisjs/http-server@7.8.0
- **Solution** : Ajout de la config qs complète (parse + stringify) dans config/app.ts

## Points d'attention
- La création de club déclenche la génération de 59 clubs IA + 1140 matchs (peut prendre ~30-60s)
- Le username "regista" est réservé dans RESERVED_USERNAMES
- Les tests Japa écrits en Session #2 n'ont toujours pas été exécutés (problème bootstrap)
- Le seed.ts est vide (pas de données de test)
- Rate limiting sur register : 3 tentatives par heure

## Tâches en suspens
- [ ] Tester le flow complet E2E (register → onboarding → dashboard → navigation)
- [ ] Phase 12 : Modération (SPEC-13)
- [ ] Phase 13 : Polish & Integration
- [ ] Implémenter seed.ts avec données de test
- [ ] Vérifier que le match engine produit des résultats réalistes (distribution de buts)
- [ ] Ajouter loading indicator pendant la création de league (onboarding)
- [ ] Production email (Resend/SMTP) — actuellement console.log en dev

## Fichiers impactés

### Packages partagés
- `packages/shared/src/types/club.ts` — Types Club enrichi (isAi, divisionId)
- `packages/shared/src/types/notification.ts` — Types notifications
- `packages/shared/src/types/finance.ts` — Types finances
- `packages/shared/src/types/player.ts` — Types joueurs + position weights
- `packages/shared/src/types/dashboard.ts` — Types dashboard
- `packages/shared/src/types/competition.ts` — Types competition (league, season, standing, match)
- `packages/shared/src/types/match.ts` — Types match engine (events, tactics, live state)
- `packages/shared/src/types/training.ts` — Types training
- `packages/shared/src/types/transfer.ts` — Types transferts
- `packages/shared/src/types/index.ts` — Re-exports tous les types
- `packages/shared/src/constants.ts` — Constantes étendues (morale, finance, squad, competition, AI, formations, training, transfers)

### Database (packages/db)
- `packages/db/src/schema/players.ts` — Tables players, player_stats, goalkeeper_stats
- `packages/db/src/schema/competition.ts` — Tables leagues, divisions, seasons, standings, matches, season_results, notification_preferences
- `packages/db/src/schema/match_detail.ts` — Tables match_events, match_lineups, match_stats, match_player_stats, match_tactical_changes
- `packages/db/src/schema/training.ts` — Table training_programs
- `packages/db/src/schema/transfers.ts` — Tables transfer_listings, transfer_offers, transfer_history, free_agents
- `packages/db/src/schema/clubs.ts` — Ajout isAi, aiProfile, divisionId, userId nullable
- `packages/db/src/schema/index.ts` — Exports
- `packages/db/drizzle.config.ts` — Fix: dotenv pour charger DATABASE_URL
- `packages/db/drizzle/0002-0007` — 6 migrations générées

### Backend API (apps/api)
- `apps/api/config/app.ts` — Fix: ajout config qs parser
- `apps/api/start/routes.ts` — Toutes les routes (notifications, finances, squad, competition, matches, settings, training, market, offers, tactics)
- `apps/api/start/workers.ts` — Workers email, match, transfer, finance
- `apps/api/start/ws.ts` — Socket.io rooms match
- `apps/api/app/auth/auth_controller.ts` — Fix: hasClub réel, register auto-login dev
- `apps/api/app/auth/auth_validator.ts` — Fix: vine.literal(true)
- `apps/api/app/users/user_controller.ts` — Fix: hasClub réel via findUserClub
- `apps/api/app/clubs/club_controller.ts` — Intégration squad gen, notifications, league creation, checkName
- `apps/api/app/clubs/squad_generation_service.ts` — Génération 22 joueurs + params overallMin/Max
- `apps/api/app/dashboard/dashboard_controller.ts` — Enrichi (squad réel, next match, standings excerpt, notifications)
- `apps/api/app/notifications/` — Controller, service, validator
- `apps/api/app/finances/` — Controller enrichi (salary breakdown), service enrichi (formules revenue, health checks), validator
- `apps/api/app/squad/` — Controller, validator
- `apps/api/app/competition/` — league_service, ai_club_service, calendar_service, standings_service, season_service, season_lifecycle_service, competition_controller, match_controller, validators
- `apps/api/app/match/` — match_engine, match_minute_simulator, match_probability, match_state, match_events_repo, auto_lineup_service, ai_tactics_service, lineup_service, progression_service, match_detail_controller
- `apps/api/app/training/` — training_service, training_controller
- `apps/api/app/transfers/` — valuation_service, market_service, offer_service, free_agent_service, transfer_executor, market_controller, offer_controller, transfer_validator
- `apps/api/app/tactics/` — tactics_controller
- `apps/api/app/settings/` — settings_controller, settings_validator
- `apps/api/app/workers/` — match_worker, transfer_worker, finance_worker

### Frontend (apps/web)
- `apps/web/.env` — Fichier dédié (VITE_API_URL, VITE_WS_URL)
- `apps/web/src/routes/` — dashboard, onboarding, squad, squad.$playerId, matches, matches.$matchId, competition, competition.matchday.$number, finances, transfers, training, tactics, stats, notifications, settings (modifié)
- `apps/web/src/components/layout/` — app-layout (rewrite), app-header, sidebar, mobile-bottom-bar, notification-panel
- `apps/web/src/components/onboarding/` — step-indicator, club-name-step, club-colors-step, club-logo-step, club-confirmation-step
- `apps/web/src/components/dashboard/` — Existants enrichis
- `apps/web/src/components/notifications/` — notification-item
- `apps/web/src/components/finances/` — balance-card, transaction-list
- `apps/web/src/components/squad/` — player-row
- `apps/web/src/components/competition/` — standings-table, form-indicator
- `apps/web/src/components/matches/` — match-card
- `apps/web/src/components/match/` — event-timeline, match-stats-bar
- `apps/web/src/components/transfers/` — market-player-card
- `apps/web/src/components/settings/` — notification-preferences
- `apps/web/src/components/ui/` — dropdown-menu, avatar, badge, sheet, tooltip, scroll-area (shadcn ajoutés)
- `apps/web/src/hooks/` — use-club
- `apps/web/src/lib/` — club, dashboard (modifié), squad, competition, matches, match-detail, finances (enrichi), notifications, settings, training, transfers, tactics
- `apps/web/src/context/auth-context.tsx` — Existant (utilisé tel quel)

### Config
- `.env` — Ajout CORS_ORIGIN, EMAIL_VERIFICATION_REQUIRED=false
- `apps/api/.env` — Symlink vers ../../.env

---

## Log détaillé

### Chargement contexte et planification
Session démarrée avec /ctx. État : SPEC-01 Auth implémenté, reste des specs non démarrées. Plan d'implémentation MVP existant (13 phases). Décision : enchaîner Phase 2 (Club Dashboard + Squad basics).

### Phase 2 — Implémentation step by step
7 étapes exécutées séquentiellement :
1. Types partagés (club, notification, finance, player, dashboard) dans packages/shared
2. Schema players + squad generation service avec algorithme de distribution stats par position
3. App shell (shadcn components installés : dropdown-menu, avatar, badge, sheet, tooltip, scroll-area). Routes placeholder créées pour toutes les pages manquantes pour satisfaire le typage TanStack Router
4. Onboarding wizard 4 étapes. Endpoint checkName ajouté. Redirect dashboard→onboarding quand pas de club
5. Notifications CRUD complet + welcome notifications à la création du club
6. Finances endpoints + frontend
7. Squad list/detail + dashboard polish avec données réelles

Build vérifié clean après chaque étape.

### Phase 3 — Competition infrastructure
4 étapes : schema (7 tables + modification clubs pour AI), services backend (5 services dont round-robin calendar), API endpoints (competition, matches, settings), frontend (standings table, matchday, matches list).

Problème rencontré : dépendance circulaire entre clubs.ts et competition.ts pour aiProfileEnum → résolu en définissant l'enum dans clubs.ts.

userId rendu nullable dans la table clubs pour supporter les clubs IA (pas de user associé).

### Phases 4+5 — Match Engine
5 étapes combinées : schema match detail (5 tables, 9 enums), AI pre-match services, match simulation engine (core avec probabilités), BullMQ jobs + Socket.io + API, frontend live match.

Simplification MVP : 1s par minute de jeu au lieu de 60s. 17 types d'événements au lieu de 27. Pas de passing chains détaillés.

### Phase 6 — Game Loop
5 étapes : training schema + service, progression service, post-match pipeline complet (10 étapes), matchday orchestration + season lifecycle (promotions/relégations), frontend training page.

### Phase 7 — Transfers
4 étapes : schema (4 tables, 6 enums), services backend (valuation, market, offers, free agents, executor), API endpoints (16 endpoints), frontend 3 tabs.

### Phases 9-11 — Cleanup phases
Phase 9 : Finance service enrichi avec formules par division, salary processing weekly cron, health checks avec notifications.
Phase 10 : Tactics page avec formation selector et paramètres tactiques stockés en Redis.
Phase 11 : Stats page avec données standings et squad.

### Fix testabilité locale
Série de bugs découverts en tentant de tester :
1. vine.accepted() → vine.literal(true) : VineJS attendait des strings pour les checkboxes
2. hasClub hardcodé false dans formatUser() de auth_controller.ts et user_controller.ts
3. Register ne faisait pas auto-login en dev (pas d'accessToken retourné)
4. .env non trouvé par AdonisJS (cherche dans son propre dossier, pas la racine monorepo) → symlink
5. Web prenait port 3001 car le .env symlinké contenait PORT=3001 → .env dédié pour web
6. Config qs manquante dans config/app.ts → crash du Qs parser d'AdonisJS http-server@7.8.0
7. drizzle.config.ts ne trouvait pas DATABASE_URL → ajout dotenv avec path vers .env racine
