---
type: session-log
date: 2026-04-03
project: regista
tags: [session, moderation, onboarding, seed, adonisjs, bug-fix, polish]
---

# Session : 2026-04-03 — Phases 12-13 (Moderation, Onboarding, Polish) + fix config

## Quick Reference
**Sujets :** Implémentation Phases 12-13 (moderation, onboarding missions, seed, polish), fix config AdonisJS qs parser et .env web
**Résultat :** MVP complet (Phases 1-13 terminées), ~150+ fichiers, 10 migrations Drizzle, prêt pour test E2E

## Ce qui a été fait

### Phase 12 — Moderation
- Schema : 3 tables (moderation_reports, moderation_actions, name_blacklist) + 3 enums
- NameValidationService : blacklist Redis avec cache 1h, normalisation leet speak (@→a, 3→e, 1→i, 0→o, $→s)
- ModerationController : POST /names/validate, POST /reports (rate limit 3/24h)
- Migration 0008 générée

### Phase 11 — Onboarding Missions
- Schema : table onboarding_missions (userId, missionKey, completedAt, rewardClaimed, rewardAmount)
- OnboardingService : initializeMissions (5 missions), getMissions, completeMission, claimReward
- OnboardingController : GET /onboarding/status, POST complete/claim
- Missions : create_club (auto), view_squad (50K), set_tactics (100K), play_match (200K), view_standings (50K) = 400K G$ total
- Intégration : missions initialisées à la création du club
- Migration 0009 générée

### Phase 13 — Polish
- Seed script : insère ~60 termes blacklist multilingues (FR/EN/ES/DE), dotenv pour charger DATABASE_URL
- Loading state onboarding : message "Generating 59 opponent clubs and scheduling 38 matchdays... may take up to a minute"

### Fix config AdonisJS
- config/app.ts : ajout propriété `qs` (parse + stringify) manquante pour @adonisjs/http-server@7.8.0
- apps/web/.env : fichier dédié avec VITE_API_URL et VITE_WS_URL (suppression symlink qui importait PORT=3001)

## Décisions prises
- Modération MVP sans admin dashboard : reports stockés en DB, pas d'interface admin pour l'instant
- Onboarding missions auto-détectées côté serveur : le frontend appelle /complete puis /claim
- Seed limité aux blacklist terms : pas de seed de données de jeu (users, clubs) pour l'instant

## Problèmes résolus
- **Problème** : API crash "Cannot read properties of undefined (reading 'parse')" au démarrage
- **Cause** : config/app.ts manquait la propriété `qs` dans l'objet `http`, requise par @adonisjs/http-server@7.8.0
- **Solution** : Ajout config qs complète (parse: depth/parameterLimit/comma, stringify: encode/arrayFormat)

- **Problème** : Web prenait le port 3001, conflit avec l'API
- **Cause** : Symlink .env dans apps/web/ importait PORT=3001 lu par le process node
- **Solution** : Fichier .env dédié pour le web avec uniquement VITE_API_URL et VITE_WS_URL

## Points d'attention
- La création de league (~59 clubs + 1140 matchs) prend ~30-60s — loading indicator ajouté mais UX à valider
- Seed de données de jeu non implémenté (pas de user/club/match pré-existants pour test rapide)
- Tests Japa toujours non exécutés (problème bootstrap depuis Session #3)

## Tâches en suspens
- [ ] Tester le flow complet E2E (register → onboarding → dashboard → navigation)
- [ ] Production email (Resend/SMTP)
- [ ] Tests Japa
- [ ] Admin dashboard modération (pour reviewer les reports)
- [ ] Seed de données de jeu complètes pour dev rapide

## Fichiers impactés
- `packages/db/src/schema/moderation.ts` — Créé (3 tables moderation)
- `packages/db/src/schema/onboarding.ts` — Créé (table onboarding_missions)
- `packages/db/src/schema/index.ts` — Ajout exports moderation + onboarding
- `packages/db/src/seed.ts` — Réécrit (seed blacklist terms avec dotenv)
- `packages/db/drizzle/0008_lonely_silk_fever.sql` — Migration moderation
- `packages/db/drizzle/0009_overjoyed_penance.sql` — Migration onboarding
- `apps/api/config/app.ts` — Fix ajout config qs parser
- `apps/api/start/routes.ts` — Ajout routes moderation + onboarding
- `apps/api/app/moderation/name_validation_service.ts` — Créé
- `apps/api/app/moderation/moderation_controller.ts` — Créé
- `apps/api/app/onboarding/onboarding_service.ts` — Créé
- `apps/api/app/onboarding/onboarding_controller.ts` — Créé
- `apps/api/app/clubs/club_controller.ts` — Intégration OnboardingService.initializeMissions
- `apps/web/.env` — Fichier dédié (plus de symlink)
- `apps/web/src/components/onboarding/club-confirmation-step.tsx` — Loading state amélioré

---

## Log détaillé

### Continuation après premier /save
Le premier /save couvrait Phases 2-11 + fix testabilité. Cette session continue avec les dernières phases.

### Phase 12 — Moderation
Création du schema moderation.ts avec 3 tables et 3 enums. Service de validation de noms avec blacklist Redis (cache 1h, normalisation leet speak). Controller minimaliste avec 2 endpoints : validation de nom (public) et signalement (authentifié, rate limited 3/24h). Pas d'admin dashboard — les reports sont stockés en DB pour traitement futur.

### Phase 11 — Onboarding Missions
Table onboarding_missions avec 5 missions. Service avec init (à la création du club, mission "create_club" auto-complétée), get status, complete, et claim (crédite le reward via FinanceService). Intégré dans club_controller.ts après LeagueService.createLeague.

### Phase 13 — Polish
Seed script réécrit avec dotenv pour charger DATABASE_URL depuis le .env racine. Insère ~60 termes blacklist multilingues. Loading state de l'onboarding amélioré avec message explicite sur la durée (~1 minute).

### Fix config AdonisJS qs parser
L'API crashait au premier request HTTP avec "Cannot read properties of undefined (reading 'parse')". Investigué via agent Explore qui a tracé le code source de @adonisjs/http-server@7.8.0 : la classe Qs attend une config avec parse et stringify. La propriété `qs` manquait dans config/app.ts. Ajouté avec les valeurs par défaut du framework.

### Fix .env web
Le symlink apps/web/.env → ../../.env causait un conflit de port car PORT=3001 était lu par le process web. Remplacé par un fichier .env dédié avec uniquement VITE_API_URL et VITE_WS_URL.

### Build final
Full monorepo build clean : 4 tasks successfull (shared, db, api, web), 0 erreur TS. 10 migrations Drizzle prêtes (0000-0009).
