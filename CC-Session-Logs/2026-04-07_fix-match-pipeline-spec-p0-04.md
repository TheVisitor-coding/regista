---
type: session-log
date: 2026-04-07
project: regista
tags: [session, match-engine, finance, drizzle, migration, unit-test, bug-fix, spec-p0-04]
---

# Session : 2026-04-07 — Fix match pipeline (SPEC-P0-04)

## Quick Reference
**Sujets :** standingPosition hardcode, FK manquantes clubs, tests ticket revenue
**Resultat :** 3 fixes appliques — position dynamique, FK + index, 4 tests unitaires. Migration 0013 generee et appliquee.

## Ce qui a ete fait
- Remplace `standingPosition = 10` hardcode dans `match_worker.ts:73` par une requete sur `standings` (seasonId + clubId)
- Ajoute FK `clubs.leagueId -> leagues.id` et `clubs.divisionId -> divisions.id` dans le schema Drizzle
- Ajoute index `clubs_division_id_idx` sur `divisionId` (manquait, contrairement a `leagueId`)
- Genere et applique la migration `0013_puzzling_black_crow.sql`
- Ecrit 4 tests unitaires pour `FinanceService.calculateTicketRevenue`

## Decisions prises
- FK via `.references()` Drizzle plutot que migration SQL manuelle : les imports circulaires clubs <-> competition sont geres par les callbacks `() => table.id`, c'est le pattern standard Drizzle
- `onDelete: NO ACTION` (defaut) sur les FK clubs : un club a une valeur intrinseque, on ne veut pas les supprimer en cascade si une league/division est supprimee
- Tests unitaires cibles plutot que test E2E pipeline complet : `calculateTicketRevenue` est une methode pure, testable sans DB ni BullMQ. Plus rapide, plus robuste, plus maintenable
- `handlePostProcess` non exportee : pas de refacto pour l'exporter, les sous-fonctions individuelles sont suffisantes pour les tests

## Problemes resolus
- **Probleme** : `standingPosition = 10` hardcode — tous les clubs recevaient le meme bonus de billetterie, l'economie etait faussee
- **Cause** : Simplification volontaire lors du MVP (commentaire "keeping simple for now")
- **Solution** : Query `standings.position` avec `(seasonId, clubId)` — les standings sont deja recalcules a l'etape 1 du pipeline avant l'etape 3 (finances), donc les positions sont fraiches

- **Probleme** : FK manquantes sur `clubs.leagueId` et `clubs.divisionId` — pas d'integrite referentielle
- **Cause** : Oubli lors de la creation initiale du schema (migration 0001 pour leagueId, 0003 pour divisionId)
- **Solution** : Ajout `.references()` dans le schema Drizzle + generation migration automatique

## Points d'attention
- Les tests fonctionnels (auth) echouent deja avant nos changements — probleme pre-existant (HTML error page au lieu de JSON, probablement config auth/middleware en mode test)
- L'import circulaire `clubs.ts <-> competition.ts` fonctionne grace aux callbacks Drizzle mais pourrait poser probleme si le bundler change
- La migration 0013 suppose que les donnees existantes sont coherentes (pas de leagueId/divisionId orphelin). En prod, verifier avant d'appliquer

## Taches en suspens
- [ ] Fixer les tests fonctionnels auth (register, login, refresh) — probleme pre-existant
- [ ] SPEC-P0-04 Fix 3 bonus : test d'integration E2E du pipeline complet (optionnel, les unit tests couvrent le calcul)
- [ ] Verifier coherence des donnees avant migration en prod (`SELECT` orphelins)
- [ ] Socket.io frontend pour le match live (reporte a Phase 1)

## Fichiers impactes
- `apps/api/app/workers/match_worker.ts` — query position reelle au lieu de `= 10`
- `packages/db/src/schema/clubs.ts` — import leagues/divisions, FK `.references()`, index divisionId
- `packages/db/drizzle/0013_puzzling_black_crow.sql` — migration auto-generee (2 FK + 1 index)
- `packages/db/drizzle/meta/_journal.json` — mise a jour journal migrations
- `packages/db/drizzle/meta/0013_snapshot.json` — snapshot schema post-migration
- `apps/api/tests/unit/match_pipeline.spec.ts` — 4 tests unitaires calculateTicketRevenue

---

## Log detaille

### Contexte
Session dediee a SPEC-P0-04, spec de la phase 0 "sauvetage" qui identifie deux problemes concrets faussant le gameplay du MVP.

### Exploration (mode plan)
Lancement de 2 agents Explore en parallele :
1. **Match worker** : localise `match_worker.ts`, identifie les 10 etapes du pipeline post-match, trouve le hardcode ligne 73, comprend le flow `updateStandings()` -> `applyFatigue()` -> `processMatchRevenue()`. Point cle : les standings sont recalcules (etape 1) AVANT le calcul financier (etape 3), donc la position est fraiche quand on la lit.
2. **Schema clubs** : confirme que `leagueId` et `divisionId` sont des `uuid()` sans `.references()`, identifie le pattern FK utilise partout dans le projet (`.references(() => table.id, { onDelete: 'cascade' })`), note que `divisionId` n'a meme pas d'index contrairement a `leagueId`.

Lecture directe de `finance_service.ts:63-67` : `calculateTicketRevenue()` applique un bonus de 5M si `standingPosition <= 5`. Avec la valeur hardcodee a 10, aucun club ne recevait jamais ce bonus.

### Plan et validation
Plan propose avec 3 fixes. Deux questions posees a l'utilisateur :
1. FK approach : `.references()` Drizzle vs migration SQL manuelle -> choix Drizzle (recommande)
2. Test style : unit tests cibles vs E2E pipeline -> choix unit tests (recommande)

### Implementation

**Fix 1** : Remplacement simple de la ligne 73. La query reutilise les imports `standings`, `and`, `eq` deja presents dans le fichier. Fallback a `10` si le standing n'est pas trouve (securite).

**Fix 2** : Ajout de `import { leagues, divisions } from './competition.js'` dans `clubs.ts`. Import circulaire confirme (competition.ts importe clubs ligne 13) mais Drizzle gere ca via les callbacks lazy. `pnpm --filter @regista/db db:generate` produit la migration 0013 avec 2 ALTER TABLE + 1 CREATE INDEX. Migration appliquee sans erreur (les donnees existantes sont coherentes).

**Fix 3** : 4 tests dans `match_pipeline.spec.ts` :
- Position top 5 donne bonus (revenue entre 17M et 23M pour div 1)
- Position > 5 pas de bonus (revenue entre 12M et 18M pour div 1)
- Sur 100 iterations, la moyenne top 5 est > 3M au-dessus de la moyenne hors top 5
- Division 1 rapporte plus que division 3

Execution `node ace test unit` : 10/10 tests passent (4 nouveaux + 6 existants). Les tests fonctionnels auth echouent mais c'est pre-existant (HTML error page retournee au lieu de JSON).
