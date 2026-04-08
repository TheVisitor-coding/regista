# SPEC-P0-06 — Fix filtres marché des transferts

> **Phase :** 0 — Sauvetage
> **Priorité :** P1
> **Estimation :** 1-2 heures
> **Dépendances :** SPEC-P0-02 (tests)

## Contexte (audit)

Le `marketQueryValidator` accepte les filtres (position, overall, age, prix) et le frontend les affiche. **Mais le controller n'utilise que le filtre `source`**, ignorant tous les autres. Résultat : l'utilisateur applique des filtres, l'UI semble répondre, mais les résultats ne sont pas filtrés. C'est une UX trompeuse.

## Problème identifié

**Fichier probable :** `MarketController.ts` ou `MarketService.ts`

Le validator parse correctement :
```typescript
// marketQueryValidator (fonctionne)
position?: string     // GK, DEF, MID, ATT
minOverall?: number
maxOverall?: number
minAge?: number
maxAge?: number
minPrice?: number
maxPrice?: number
source?: string       // ← seul filtre réellement appliqué
```

Mais le service/controller fait :
```typescript
// Pseudo-code actuel
const listings = await db.query.marketListings.findMany({
  where: source ? eq(listings.source, source) : undefined,
  // position, overall, age, price → IGNORÉS
});
```

## Correction attendue

Le service doit construire la query avec TOUS les filtres :

```typescript
const conditions = [];
if (source) conditions.push(eq(listings.source, source));
if (position) conditions.push(eq(players.position, position));
if (minOverall) conditions.push(gte(players.overall, minOverall));
if (maxOverall) conditions.push(lte(players.overall, maxOverall));
if (minAge) conditions.push(gte(players.age, minAge));
if (maxAge) conditions.push(lte(players.age, maxAge));
if (minPrice) conditions.push(gte(listings.price, minPrice));
if (maxPrice) conditions.push(lte(listings.price, maxPrice));

const results = await db.query... where: and(...conditions) ...
```

## Critères d'acceptation

- [ ] Filtre par position fonctionne (ex: "GK" → uniquement des gardiens)
- [ ] Filtre par overall min/max fonctionne
- [ ] Filtre par âge min/max fonctionne
- [ ] Filtre par prix min/max fonctionne
- [ ] Les filtres se combinent (position=DEF + minOverall=60 → défenseurs 60+)
- [ ] Aucun filtre → tous les résultats (comportement actuel préservé)
- [ ] Test unitaire : chaque filtre individuellement + combinaison
- [ ] Pas de breaking change sur l'API (mêmes query params)

## Prompt Claude Code suggéré

```
Lis CLAUDE.md puis docs/specs/phase-0/SPEC-P0-06-fix-market-filters.md.

Le marché des transferts a un bug : les filtres (position, overall, age, prix) sont validés 
par le validator mais ignorés par le controller/service. Seul le filtre "source" est appliqué.

1. Trouve le controller et le service qui gèrent GET /market
2. Montre-moi le code actuel du query builder
3. Propose la correction pour appliquer TOUS les filtres
4. Écris les tests unitaires

Montre-moi le code AVANT et APRÈS.
```

## Hors scope

- Pagination (déjà fonctionnelle)
- Tri des résultats (nice-to-have, pas critique)
- UI des filtres (déjà en place côté frontend)