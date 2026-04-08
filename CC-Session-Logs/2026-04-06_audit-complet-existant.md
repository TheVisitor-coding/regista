---
type: session-log
date: 2026-04-06
project: regista
tags: [session, audit, phase-0, infrastructure, tests, database, frontend, backend, design-system]
---

# Session : 2026-04-06 — Audit complet de l'existant (SPEC-P0-01)

## Quick Reference
**Sujets :** Audit exhaustif des 9 modules du jeu + DB + design system + infra technique
**Résultat :** Rapport d'audit généré (`docs/audit/AUDIT-REPORT.md`) — 19 OK, 12 Partiels, 8 Cassés, 5 Fake/Hardcodés, 2 bloquants P0 identifiés

## Ce qui a été fait
- Audit parallèle de 4 axes : infrastructure technique, backend API, frontend web, base de données + shared packages
- Vérification de chaque module contre les critères de SPEC-P0-01 (auth, squad, tactiques, match, transferts, finances, entraînement, compétition, infra)
- Tentative d'exécution de `pnpm test` (boucle infinie confirmée)
- Vérification `pnpm install --frozen-lockfile` (OK)
- Inventaire complet : ~71 fichiers backend, ~90+ fichiers frontend, 29 tables DB, ~60 endpoints API, 23 routes frontend
- Génération du rapport `docs/audit/AUDIT-REPORT.md`

## Décisions prises
- Classification en 4 niveaux de priorité (P0/P1/P2) selon l'impact sur le core loop : parce que la roadmap Phase 0 exige de prioriser les bloquants avant tout
- Socket.io classé P1 et non P0 : parce que le polling HTTP fonctionne (dégradé mais jouable), le match engine tourne
- Redis-only storage classé P1 : parce que ça viole la règle CLAUDE.md et risque une perte de données, mais ne bloque pas le lancement en dev

## Problèmes résolus
Aucun problème résolu dans cette session — l'audit est un inventaire, pas une correction (conformément au scope de SPEC-P0-01).

## Points d'attention
- **Tests Japa** : boucle infinie au bootstrap. Cause probable : preloads `#start/infra` et `#start/routes` tentent de connecter à PostgreSQL/Redis sans fallback en mode test
- **Données critiques en Redis seul** : tactiques courantes (`tactics:{clubId}`) et compositions (`composition:{clubId}`) — un flush Redis perd tout
- **Filtres marché ignorés** : le validator accepte position/overall/age/prix mais le controller ne filtre que par `source` — UX trompeuse
- **Typographie** : Nunito requis par l'identité visuelle mais non chargé, remplacé par Plus Jakarta Sans et Space Grotesk
- **FK manquantes** : `clubs.leagueId` et `clubs.divisionId` sans contrainte FK — intégrité référentielle non garantie
- **`standingPosition = 10` hardcodé** dans match_worker.ts — fausse les revenus billetterie pour tous les clubs
- **Email service** : lance une erreur en production, uniquement fonctionnel en dev (log console)
- **Workers morts** : `cleanup_worker.ts` et `inactivity_worker.ts` existent mais ne sont pas enregistrés

## Tâches en suspens
- [ ] Fixer le bootstrap des tests Japa (P0 bloquant)
- [ ] Écrire les tests unitaires critiques : match engine, finances, progression (P0)
- [ ] Intégrer Socket.io côté frontend pour les matchs live (P1)
- [ ] Migrer tactiques et compositions de Redis vers PostgreSQL (P1)
- [ ] Corriger `standingPosition` hardcodé dans match_worker.ts (P1)
- [ ] Implémenter les filtres marché côté serveur (P1)
- [ ] Créer un seed gameplay complet (clubs, joueurs, leagues) (P1)
- [ ] Corriger la typographie (charger Nunito, remplacer Plus Jakarta Sans) (P1)
- [ ] Ajouter FK manquantes sur clubs.leagueId/divisionId (P1)
- [ ] Implémenter drag & drop pour la composition (P1)
- [ ] Traiter les 15 items P2 (placeholders, code mort, conventions)

## Fichiers impactés
- `docs/audit/AUDIT-REPORT.md` — créé, rapport d'audit complet avec statut de chaque module

---

## Log détaillé

### Contexte
Session démarrée avec la roadmap Phase 0 ("Sauvetage"). Objectif : exécuter SPEC-P0-01, l'audit de l'existant. Le prototype a été construit en mode spec-driven par IA (sessions #1 à #4, mars-avril 2026) sans vérification systématique. L'audit doit produire un inventaire honnête avant toute correction.

### Déroulement

**Étape 1 — Lecture des documents de référence**
- Lu `CLAUDE.md` (racine) pour les conventions et règles du projet
- Lu `docs/specs/phase-0/SPEC-P0-01-audit.md` pour la procédure d'audit (9 modules à vérifier, format de rapport imposé)

**Étape 2 — Lancement de 4 agents d'audit en parallèle**

1. **Agent Infrastructure** : a vérifié tests (`pnpm test` → boucle infinie), seeds (blacklist uniquement), dev scripts (OK via turborepo), migrations (12 fichiers OK), Docker (3 compose OK), dépendances (`pnpm install` OK), env files (symlink API → racine, OK)

2. **Agent Backend** : a exploré les 71 fichiers TS de `apps/api/`. Inventorié ~60 endpoints API répartis sur 21 modules domaine. Trouvé : 0 exceptions custom (toutes les erreurs = `throw new Error()`), `standingPosition = 10` hardcodé, filtres marché ignorés, position history = placeholder, 2 workers non enregistrés (cleanup, inactivity), validators inline pour tactics/training.

3. **Agent Frontend** : a exploré les 23 routes et ~90+ composants de `apps/web/`. Confirmé : auth complète et fonctionnelle, dashboard connecté à l'API, squad sans drag & drop, tactics riche (SVG pitch, presets, cohérence), **zéro Socket.io** (polling HTTP uniquement), transferts sans formulaire de vente, typo non conforme (Plus Jakarta Sans au lieu de Nunito), `#ffffff` dans destructive-foreground.

4. **Agent DB/Shared** : a audité les 12 fichiers de schéma (29 tables), les 12 types partagés, les constantes. Trouvé : aucune `relations()` Drizzle, FK manquantes sur `clubs.leagueId`/`divisionId`, `transferOffers.parentOfferId` sans self-ref, `premium_transactions` mentionnée dans CLAUDE.md mais inexistante.

**Étape 3 — Synthèse et génération du rapport**
- Consolidation des 4 rapports d'agents en un seul `AUDIT-REPORT.md`
- Classification de chaque item en ✅ OK / ⚠️ Partiel / ❌ Cassé / 🔲 Fake
- Priorisation P0/P1/P2 selon l'impact sur le core loop gameplay
- Tableau récapitulatif final : 2 P0, 9 P1, 15 P2

### Commandes exécutées
- `pnpm test` → boucle infinie (boot application en boucle)
- `pnpm install --frozen-lockfile` → OK (728ms)
- Grep extensifs sur socket, relations, exceptions, validators dans toute la codebase

### Pistes non explorées
- Pas de test en conditions réelles (lancer le jeu, créer un compte, jouer un match) car ça nécessite PostgreSQL + Redis up — l'audit s'est fait par exploration de code et tentative d'exécution de l'infra
- Pas de vérification des Dockerfiles en build réel
- Pas de test de performance (temps de création league ~30-60s mentionné dans CLAUDE.md)
