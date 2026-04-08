---
type: session-log
date: 2026-04-06
project: regista
tags: [session, drizzle, postgresql, redis, migration, tactics, composition, tests, japa]
---

# Session : 2026-04-06 — Migration Redis → PostgreSQL (Tactics & Composition)

## Quick Reference
**Sujets :** Migration persistance tactiques/compositions de Redis vers PostgreSQL
**Résultat :** 2 tables PG créées, TacticsController migré (0 dépendance Redis), 5 tests verts

## Ce qui a été fait
- Créé 2 tables Drizzle : `club_tactics` et `club_compositions` avec unique index sur `club_id` (1 row par club, upsert pattern)
- Généré et appliqué la migration `0012_conscious_mantis.sql`
- Remplacé les 5 appels `redis.get/set` dans `TacticsController` par des queries PostgreSQL (`onConflictDoUpdate`)
- Supprimé l'import `redis` du controller — plus aucune dépendance Redis
- Écrit 5 tests unitaires Japa validant la persistance PG (dont survie au FLUSHALL)

## Décisions prises
- **1 row par club avec upsert** : parce que les tactiques/compositions sont un état courant unique par club, pas un historique. L'unique index sur `club_id` + `onConflictDoUpdate` simplifie le code.
- **JSONB pour startingXI/bench** : stocke uniquement `{playerId, position}` (données brutes). Les données enrichies (nom, overall, fatigue, compatibilité) sont recalculées à la lecture depuis la table `players`. Parce que ces données changent fréquemment et stocker un snapshot serait vite obsolète.
- **Redis complètement retiré** (pas gardé comme cache) : parce que c'est un read peu fréquent (chargement page tactiques), pas besoin de cache. Simplifie le code et élimine le risque de désync.
- **Validator cast `as Record<string, any>`** : parce que VineJS retourne `string` pour les enums mais Drizzle attend les types littéraux. Cast nécessaire pour l'upsert partiel dans `update()`.

## Problèmes résolus
- **Problème** : Erreur TypeScript TS2769 sur l'upsert — VineJS valide vers `string`, Drizzle attend les enum literals (`'balanced' | 'offensive' | ...`)
- **Cause** : Le validator `updateTacticsValidator` retourne des types `string | undefined` pour les champs enum
- **Solution** : Cast du résultat validé en `Record<string, any>` — acceptable car la validation VineJS garantit déjà les valeurs correctes

## Points d'attention
- Le match engine (flow humain pre-match) pourrait avoir besoin de lire les tactiques depuis PG — à vérifier dans le worker `match_worker.ts`
- Si des clubs ont déjà des tactiques sauvegardées en Redis (données existantes), elles ne sont pas migrées automatiquement vers PG
- La table `club_compositions` référence des `player_id` en FK — si un joueur est transféré/supprimé, les FK `set null` s'appliquent mais la composition JSONB gardera l'ancien `playerId` (orphelin). Le code de lecture gère déjà ce cas (fallback "Unknown").

## Tâches en suspens
- [ ] Vérifier que le match engine lit bien les tactiques depuis PG pour les clubs humains (flow pre-match dans `match_worker.ts`)
- [ ] Migrer les données Redis existantes vers PG si des clubs ont déjà des tactiques sauvegardées
- [ ] Ajouter un cache Redis optionnel si les performances le nécessitent (peu probable au MVP)

## Fichiers impactés
- `packages/db/src/schema/tactics.ts` — ajout tables `clubTactics` et `clubCompositions` (imports `integer`, `jsonb`, `uniqueIndex` ajoutés)
- `packages/db/drizzle/0012_conscious_mantis.sql` — migration auto-générée (CREATE TABLE x2, FK, unique indexes)
- `apps/api/app/tactics/tactics_controller.ts` — 5 méthodes modifiées (`show`, `update`, `applyPreset`, `getComposition`, `saveComposition`), import `redis` supprimé, import `clubTactics`/`clubCompositions` ajouté
- `apps/api/tests/unit/tactics_persistence.spec.ts` — nouveau fichier, 5 tests

---

## Log détaillé

### Contexte
Les tactiques (`tactics:{clubId}`) et compositions (`composition:{clubId}`) étaient stockées uniquement en Redis sans TTL. Un crash ou FLUSHALL Redis = perte de toutes les données tactiques. Objectif : PostgreSQL comme source de vérité.

### Exploration initiale
- Grep confirmé que seul `tactics_controller.ts` utilise les clés Redis `tactics:*` et `composition:*` (4 reads, 3 writes)
- `ai_tactics_service.ts` génère les tactiques IA à la volée sans Redis — pas impacté
- Aucun autre fichier dans `apps/api/app/match/` ne lit ces clés Redis
- Schema existant : seule la table `tactical_presets` existait (presets sauvegardés, pas les tactiques courantes)

### Phase 1 : Schema Drizzle
Ajouté dans `packages/db/src/schema/tactics.ts` :
- `clubTactics` : 10 colonnes, réutilise les enums existants (`mentalityEnum`, `tacticLevelEnum`, etc.), unique index sur `clubId`
- `clubCompositions` : 13 colonnes, JSONB pour `startingXI`/`bench`/`warnings`, FK vers `players` pour captain/penalty/freekick/corners

Commande : `pnpm db:generate` → migration `0012_conscious_mantis.sql` générée proprement.
Commande : `pnpm db:migrate` → tables créées sans erreur.

### Phase 2 : Refactor du controller
5 méthodes modifiées :
1. `show()` : `redis.get` → `db.select().from(clubTactics)` avec fallback `DEFAULT_TACTICS`
2. `update()` : `redis.get` + merge + `redis.set` → `db.insert().onConflictDoUpdate()` (upsert)
3. `applyPreset()` : `redis.set` → même upsert
4. `getComposition()` : `redis.get` → `db.select().from(clubCompositions)` + enrichissement player data à la lecture. Fallback : lecture formation depuis `clubTactics` puis auto-lineup
5. `saveComposition()` : `redis.set` → `db.insert().onConflictDoUpdate()` avec toutes les colonnes

Erreur TypeScript rencontrée : TS2769 sur l'upsert dans `update()` — les types VineJS (`string | undefined`) ne matchent pas les enum literals Drizzle. Résolu avec `as Record<string, any>` sur le résultat du validator.

### Phase 3 : Tests
5 tests Japa dans `tests/unit/tactics_persistence.spec.ts` :
1. Upsert tactics → relecture identique
2. Upsert composition → startingXI/bench intacts
3. FLUSHALL Redis → données PG survivent
4. Club sans tactiques → row undefined (controller retourne DEFAULT_TACTICS)
5. Update partiel (mentality seul) → autres champs inchangés

Tous passent en 83ms.
