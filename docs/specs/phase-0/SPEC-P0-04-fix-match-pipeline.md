# SPEC-P0-04 — Fix match pipeline (RÉVISÉ post-audit)

> **Phase :** 0 — Sauvetage
> **Priorité :** P0
> **Estimation :** 3-5 heures
> **Dépendances :** SPEC-P0-02 (tests), SPEC-P0-03 (composition en PostgreSQL)

## Contexte (audit)

**Bonne nouvelle :** le match engine fonctionne bien mieux qu'attendu. La simulation tourne, le post-match pipeline a 10 étapes qui marchent, les blessures/fatigue/classement sont traités. 

**Mauvaise nouvelle :** deux problèmes concrets faussent le gameplay :

1. **`standingPosition = 10` hardcodé** dans `match_worker.ts:72` — tous les clubs reçoivent le même bonus de billetterie. L'économie est faussée.
2. **FK manquantes** sur `clubs.leagueId` et `clubs.divisionId` — l'intégrité référentielle n'est pas garantie.

**Socket.io frontend :** le polling HTTP (refetch 3-5s) fonctionne pour l'instant. Le câblage Socket.io est reporté à Phase 1 — c'est une amélioration de perf/UX, pas un bloquant fonctionnel.

## Corrections à apporter

### Fix 1 : standingPosition hardcodé

**Fichier :** `match_worker.ts` (ou le service appelé à la ligne ~72)

**Actuel :**
```typescript
const standingPosition = 10; // hardcodé
```

**Attendu :**
```typescript
const standingPosition = await StandingsService.getClubPosition(clubId, divisionId);
```

Le service `StandingsService` (ou équivalent) doit requêter la position réelle du club dans sa division. Si le service n'existe pas, le créer — c'est une query simple sur la table `standings` triée par points/goal diff.

**Impact :** les clubs bien classés gagnent plus en billetterie (bonus top 5), les clubs mal classés gagnent moins. L'économie devient réaliste.

### Fix 2 : FK manquantes sur clubs

**Migration Drizzle :**
```sql
ALTER TABLE clubs 
  ADD CONSTRAINT fk_clubs_league FOREIGN KEY (league_id) REFERENCES leagues(id),
  ADD CONSTRAINT fk_clubs_division FOREIGN KEY (division_id) REFERENCES divisions(id);
```

**Vérification préalable :** s'assurer que toutes les valeurs existantes en base sont valides (pas de `leagueId` orphelin). Sinon le `ALTER TABLE` échouera.

### Fix 3 (bonus) : Vérification E2E du pipeline

Même si le pipeline fonctionne, il n'a jamais été testé formellement. Écrire un test d'intégration qui :

1. Crée un contexte (2 clubs, 1 match planifié)
2. Lance la simulation
3. Vérifie : score en base, classement mis à jour, fatigue appliquée, revenus calculés avec la position réelle

## Critères d'acceptation

- [ ] `standingPosition` est requêté dynamiquement depuis la DB (plus hardcodé)
- [ ] Les revenus de billetterie varient selon la position au classement (vérifiable en comparant un club 1er vs 20e)
- [ ] FK ajoutées sur `clubs.leagueId` et `clubs.divisionId` (migration Drizzle)
- [ ] La migration passe sans erreur sur les données existantes
- [ ] Test unitaire : calcul de billetterie avec position 1 vs position 20 → montants différents
- [ ] Test intégration : match complet simulé → score + classement + finances cohérents

## Prompt Claude Code suggéré

```
Lis CLAUDE.md puis docs/specs/phase-0/SPEC-P0-04-fix-match-pipeline.md.

Deux fixes ciblés :

1. Dans match_worker.ts ligne ~72, `standingPosition = 10` est hardcodé. 
   Remplace par une vraie requête de la position du club dans sa division.
   Montre-moi le fichier concerné et ta correction.

2. Ajoute les FK manquantes sur clubs.leagueId → leagues.id et clubs.divisionId → divisions.id.
   Vérifie d'abord que les données existantes sont cohérentes.

3. Écris un test d'intégration qui simule un match complet et vérifie que le classement 
   et les finances sont corrects après le post-match.

Montre-moi le plan AVANT de modifier.
```

## Hors scope

- Socket.io côté frontend (Phase 1)
- Penalties / corners / coups francs (Phase 1)
- Fatigue non-linéaire (Phase 1)
- Animation terrain 2D (Phase 2)