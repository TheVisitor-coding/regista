# SPEC-P0-07 — Tests critiques (Match Engine + Finances)

> **Phase :** 0 — Sauvetage
> **Priorité :** P0 (sécurisation avant Phase 1)
> **Estimation :** 4-6 heures
> **Dépendances :** SPEC-P0-02 (bootstrap tests), SPEC-P0-04 (fix pipeline)

## Contexte

Le bootstrap des tests fonctionne (SPEC-P0-02 terminée). Le pipeline match est corrigé (SPEC-P0-04 terminée). Maintenant il faut écrire les tests qui protégeront ces modules critiques de toute régression.

**Rappel audit :** 0 tests unitaires existent. Le match engine et les finances n'ont aucun filet de sécurité.

## Tests à écrire

### Groupe 1 : Match Engine — `tests/unit/match_engine.spec.ts`

```typescript
// Possession
test('possession favorable si midfield strength supérieur', ...)
test('possession à 50/50 si midfield strength égal', ...)
test('mentalité offensive augmente la possession', ...)
test('mentalité défensive réduit la possession', ...)

// Tirs
test('plus de tirs quand attaque forte vs défense faible', ...)
test('probabilité de tir plafonnée à 0.35', ...)
test('mentalité ultra_offensive maximise les tirs', ...)

// Buts
test('probabilité de but augmente avec shooting + composure', ...)
test('probabilité de but diminue avec GK OVR élevé', ...)
test('probabilité de but plancher à 0.05', ...)
test('probabilité de but plafond à 0.45', ...)

// Fautes
test('pressing high génère plus de fautes', ...)
test('pressing low génère moins de fautes', ...)

// Fatigue
test('fatigue augmente chaque minute', ...)
test('pressing high accélère la fatigue', ...)
test('tempo élevé accélère la fatigue', ...)

// Blessures
test('probabilité de blessure augmente avec la fatigue', ...)
test('blessure génère un événement injury', ...)

// Temps additionnel
test('temps additionnel augmente avec les buts et cartons', ...)

// Simulation complète
test('un match complet produit entre 90 et 100 events minimum', ...)
test('un match complet a exactement 1 half_time et 1 full_time', ...)
test('le score final est cohérent avec les events goal', ...)
```

### Groupe 2 : Finances — `tests/unit/finances.spec.ts`

```typescript
// Billetterie
test('revenus billetterie Div1 domicile ≈ 15M ± 10%', ...)
test('revenus billetterie Div3 domicile ≈ 7M ± 10%', ...)
test('revenus extérieur inférieurs aux revenus domicile', ...)
test('bonus position top-5 augmente les revenus', ...)

// Primes
test('victoire = 5M, nul = 2M, défaite = 0', ...)

// Salaires
test('salaire = OVR × 500 + random(0, 2000) centimes/semaine', ...)
test('les salaires sont déduits pour tous les clubs', ...)
test('alerte financière à 5M', ...)
test('transferts bloqués à 0', ...)

// Transferts
test('valorisation augmente avec OVR', ...)
test('valorisation diminue avec âge > 30', ...)
test('clause libératoire = 150% du prix d achat', ...)
test('achat débite le budget, vente crédite le budget', ...)

// Cohérence
test('budget initial = 50M', ...)
test('après 1 cycle complet (match + salaires), le solde est cohérent', ...)
```

### Groupe 3 : Intégration — `tests/integration/match_flow.spec.ts`

```typescript
test('flow complet : seed → composition → match → post-match → classement', async () => {
  // 1. Seed minimal : 2 clubs, 1 match planifié
  // 2. Vérifier composition (auto-lineup si nécessaire)
  // 3. Simuler le match
  // 4. Vérifier : score en base
  // 5. Vérifier : classement mis à jour (points, goal diff)
  // 6. Vérifier : fatigue appliquée aux joueurs
  // 7. Vérifier : revenus financiers calculés avec position réelle
  // 8. Vérifier : solde = ancien solde + revenus - 0 (pas de salaires pendant le match)
})
```

## Règles pour les tests

1. **Pas de mocks du match engine.** Les tests unitaires du match engine testent les vraies formules avec des stats connues.
2. **Tolérance statistique.** Les probabilités produisent des résultats variables. Utiliser des fourchettes (ex: "entre 0 et 5 buts") ou un seed random fixe pour la reproductibilité.
3. **Seed random fixe.** Pour les tests du match engine, fixer `Math.random` à un seed connu pour que les résultats soient déterministes.
4. **Tests des finances = déterministes.** Les calculs financiers ne doivent pas dépendre du hasard (sauf le composant random des salaires — tester la fourchette).

## Critères d'acceptation

- [ ] `tests/unit/match_engine.spec.ts` : ≥15 tests, tous passent
- [ ] `tests/unit/finances.spec.ts` : ≥10 tests, tous passent
- [ ] `tests/integration/match_flow.spec.ts` : 1 test E2E, passe
- [ ] `pnpm test` exécute tous les tests en < 60 secondes
- [ ] Aucun test n'est flaky (résultat identique à chaque run grâce au seed fixe)
- [ ] Les tests documentent implicitement le comportement attendu du moteur

## Prompt Claude Code suggéré

```
Lis CLAUDE.md puis docs/specs/phase-0/SPEC-P0-07-critical-tests.md.

Écris les tests unitaires pour :
1. Le match engine (tests/unit/match_engine.spec.ts) — teste les formules de possession, 
   tir, but, faute, fatigue, blessure. Utilise un seed random fixe pour la reproductibilité.
2. Les finances (tests/unit/finances.spec.ts) — teste billetterie, primes, salaires, 
   transferts, cohérence du solde.
3. Un test d'intégration (tests/integration/match_flow.spec.ts) — simule un match complet 
   et vérifie tout le post-processing.

Règle : le match engine est testé avec les VRAIES formules, pas des mocks.
Règle : les tests financiers sont déterministes.
Règle : utilise un seed fixe pour Math.random dans les tests du match engine.

Montre-moi la liste des tests que tu comptes écrire AVANT de commencer.
```

## Hors scope

- Tests frontend (Phase 2)
- Tests des transferts (écrire après les fixes Phase 0)
- Tests de performance / load
- Coverage report (nice-to-have)