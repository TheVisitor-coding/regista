# CLAUDE.md — Regista

## Projet

Regista est un jeu web multijoueur de football management. Le joueur gère un club (effectif, tactique, transferts, finances, infrastructures) dans une league de 20 clubs (mix humains + IA). Les matchs sont simulés en temps réel (90 min) à heures fixes (2x/semaine).

**Stack :** TanStack Start + React 19 + shadcn/ui | AdonisJS 6 + BullMQ + Socket.io | PostgreSQL 17 + Drizzle ORM | Redis 7

## Documents de référence

Avant de coder quoi que ce soit, lis les documents pertinents :

- `docs/roadmap.md` — Roadmap stratégique et phases du projet
- `docs/identity/regista_identity_document.html` — Identité visuelle (couleurs, typo, règles design)
- `docs/specs/` — Specs des features (TOUJOURS lire la spec avant de coder une feature)

## Workflow obligatoire

### Règle d'or : SPEC → TESTS → CODE → REVIEW

1. **Lis la spec** — Chaque tâche est rattachée à une spec dans `docs/specs/`. Ne code jamais sans spec.
2. **Écris les tests d'abord** — Tests unitaires pour la logique métier, tests d'intégration pour les flows E2E.
3. **Implémente** — Code la feature en respectant la spec et en faisant passer les tests.
4. **Vérifie** — Exécute `pnpm test` et `pnpm lint` avant de considérer la tâche terminée.
5. **Update Claude** - Après chaque tâche, update ce fichier si nécessaire avec les décisions d'implémentation, les règles spécifiques à la feature, et les leçons apprises

### Ce que tu ne dois JAMAIS faire

- **Ne jamais modifier plusieurs features en même temps.** Une tâche = une feature = une branche.
- **Ne jamais hardcoder des données pour "faire marcher".** Si une donnée manque, dis-le, ne la simule pas.
- **Ne jamais supprimer un test qui échoue.** Corrige le code ou la spec, pas le test.
- **Ne jamais stocker de donnée critique dans Redis seul.** Redis = cache et queues. PostgreSQL = source de vérité.
- **Ne jamais créer de fichier sans export clair.** Chaque module a une interface explicite.

## Conventions de code

### Backend (AdonisJS 6)

```
apps/api/
├── app/
│   ├── controllers/       # HTTP controllers (thin — délègue aux services)
│   ├── services/          # Logique métier (toute la logique ici)
│   ├── models/            # Drizzle schemas
│   ├── validators/        # VineJS validators
│   ├── jobs/              # BullMQ jobs (match simulation, intersaison, etc.)
│   └── events/            # Socket.io event handlers
├── database/
│   ├── migrations/        # Drizzle migrations
│   └── seeders/           # Seeds de test et dev
├── tests/
│   ├── unit/              # Tests unitaires (services, match engine, calculs)
│   └── integration/       # Tests d'intégration (API endpoints, flows)
└── config/
```

**Règles backend :**
- Controllers = validation + appel service + réponse. Zéro logique métier dans un controller.
- Services = toute la logique. Testables unitairement sans HTTP.
- Nommage : `MatchService`, `TransferService`, `FinanceService` — PascalCase, suffixe `Service`.
- Jobs BullMQ : un fichier par job dans `app/jobs/`, nommé `SimulateMatch.job.ts`, `ProcessSalaries.job.ts`.
- Toute modification financière passe par `FinanceService.transaction()` avec un motif (reason) loggé.
- Les erreurs métier utilisent des exceptions custom : `InsufficientFundsError`, `SquadFullError`, etc.

### Frontend (TanStack Start + React 19)

```
apps/web/
├── app/
│   ├── routes/            # TanStack Router file-based routes
│   ├── components/
│   │   ├── ui/            # shadcn/ui components (ne pas modifier)
│   │   ├── layout/        # Header, Sidebar, Navigation
│   │   ├── match/         # Composants liés aux matchs
│   │   ├── squad/         # Composants liés à l'effectif
│   │   ├── tactics/       # Composants liés aux tactiques
│   │   └── shared/        # Composants réutilisables (PlayerCard, StatBar, etc.)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitaires, API client, types partagés
│   └── styles/            # Global CSS, design tokens
```

**Règles frontend :**
- Composants : fonctionnels uniquement, hooks pour le state.
- Un composant = un fichier. Pas de composants multiples dans un même fichier sauf sous-composants privés.
- API calls via TanStack Query (useQuery, useMutation). Pas de fetch brut dans les composants.
- Pas de `any` TypeScript. Typer tout. Les types partagés sont dans `packages/shared/types/`.

### Design system Regista

**Chaque composant UI doit respecter ces règles (cf. identity document) :**

```
Couleurs :
  --regista-nuit:        #0D1F14   (fond principal)
  --regista-vert:        #2E9E5B   (couleur principale, CTA, statuts positifs)
  --regista-pelouse:     #3FCE7A   (accent, CTA secondaire)
  --regista-orange:      #FF6B35   (énergie, alertes, actions urgentes uniquement)
  --regista-jaune:       #F5E642   (récompense, succès)
  --regista-blanc:       #EAE8E1   (texte, surfaces claires — JAMAIS #FFFFFF)
  --regista-gradient:    linear-gradient(135deg, #0D1F14 0%, #1B6F3E 50%, #3FCE7A 100%)

Typographie :
  Titres / Scores / Labels UI → Barlow Condensed (font-weight: 600-700)
  Body / Navigation / Boutons  → Nunito (font-weight: 400-700)

Règles absolues :
  - border-radius minimum 10px sur TOUS les composants. Pas d'angles droits.
  - Gradients sur les fonds de cards/headers UNIQUEMENT. Jamais sur les textes.
  - Orange réservé aux urgences (blessure, suspension, alerte). Pas pour les CTA normaux.
  - Pas de texte blanc pur (#FFF) — utiliser #EAE8E1.
  - Padding minimum 16px dans chaque card.
```

### Tests

**Règle absolue : `pnpm test` doit passer avec 0 failures AVANT de considérer une tâche terminée.**

- Framework : Japa (backend), 3 suites : `unit`, `functional`, `integration`
- Nommage des tests : `test('description du comportement attendu', ...)`
- Écrire les tests AVANT l'implémentation (TDD). Les tests sont les critères d'acceptation de la spec.

#### Suites de test

| Suite | Cible | Fichiers | Commande |
|-------|-------|----------|----------|
| `unit` | Formules, calculs, services isolés (pas de HTTP) | `tests/unit/*.spec.ts` | `pnpm test -- --suite unit` |
| `functional` | Endpoints HTTP (requête → réponse, avec auth) | `tests/functional/**/*.spec.ts` | `pnpm test -- --suite functional` |
| `integration` | Flows complets multi-services | `tests/integration/*.spec.ts` | `pnpm test -- --suite integration` |

#### Conventions

- Chaque service a son fichier de test : `tests/unit/match_engine.spec.ts`
- Chaque endpoint a son fichier de test : `tests/functional/auth/login.spec.ts`
- Tests du match engine : OBLIGATOIRES pour chaque modification de formule ou probabilité
- Tests des finances : OBLIGATOIRES pour chaque modification de calcul financier
- Tests fonctionnels : chaque `group.each.setup` doit appeler `redis.flushdb()` pour isoler les rate limiters

#### Infra de test (`tests/bootstrap.ts`)

- Redis est connecté automatiquement au setup (`redis.connect()` + `bullmqRedis.connect()`)
- Redis est déconnecté au teardown. **Ne jamais appeler `redis.connect()` ou `redis.quit()` dans les tests individuels.**
- Les migrations Drizzle sont exécutées automatiquement avant les tests
- Les workers BullMQ ne tournent PAS en test — les jobs sont juste enqueués (no-op)
- `.env.test` : `EMAIL_VERIFICATION_REQUIRED=true` (teste le flow complet avec vérification)

#### Checklist avant merge

- [ ] `pnpm test` → 0 failures
- [ ] `pnpm lint` → 0 errors
- [ ] Nouveaux endpoints → tests fonctionnels ajoutés
- [ ] Nouvelles formules/calculs → tests unitaires ajoutés
- [ ] Aucun test supprimé (corriger le code, pas le test)

### Git

- Branches : `feature/SPEC-XX-nom-court` (ex: `feature/SPEC-00-fix-match-launch`)
- Commits : `[SPEC-XX] Description courte` (ex: `[SPEC-00] Fix match simulation pipeline`)
- Pas de commit direct sur `main`. Feature branch → tests verts → merge.

## Contexte métier — Résumé des mécaniques de jeu

### Match
- 90 minutes réelles, simulation minute par minute
- 5 niveaux de mentalité (ultra_defensive → ultra_offensive)
- 6 paramètres tactiques : mentalité, pressing, style de passe, largeur, tempo, ligne défensive
- Max 5 remplacements par match
- Le manager intervient en live OU ses presets jouent automatiquement

### Transferts
- Marché ouvert permanent (pas de fenêtre)
- Types : vente directe, offres club-à-club (48h), agents libres (14j)
- Squad : 16-25 joueurs, max 5 listings simultanés, max 3 offres sortantes
- Les clubs IA participent au marché (achètent et vendent)

### Finances
- Sources : billetterie, droits TV, primes, transferts
- Dépenses : salaires (hebdomadaires), transferts, infrastructures
- Économie volontairement déficitaire pour forcer la gestion active
- Seuil alerte : 5M G$ | Seuil critique : 0 G$ (bloque transferts)

### Compétition
- 3 divisions × 20 clubs, 38 journées round-robin
- 2 matchs/semaine (mardi + samedi, heures fixes configurables par league)
- Promotion/relégation : top 3 monte, bottom 3 descend
- Intersaison : 3-5 jours (classement final, primes, vieillissement, nouveau calendrier)

## Quand tu es bloqué

1. Relis la spec. La réponse est souvent dedans.
2. Si la spec ne couvre pas le cas, dis-le explicitement : "La spec ne couvre pas [cas X]. Voici ma proposition : [...]"
3. Si un test échoue et que tu ne comprends pas pourquoi, montre le test + l'output + le code concerné. Ne supprime pas le test.
4. Si tu dois choisir entre deux approches, décris les deux avec les tradeoffs et laisse le développeur trancher.
5. Si les tests fonctionnels échouent avec des erreurs HTML 500, vérifie que `tests/bootstrap.ts` connecte bien Redis et que `redis.flushdb()` est appelé dans le `group.each.setup`.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **regista** (3045 symbols, 5144 relationships, 186 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/regista/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/regista/context` | Codebase overview, check index freshness |
| `gitnexus://repo/regista/clusters` | All functional areas |
| `gitnexus://repo/regista/processes` | All execution flows |
| `gitnexus://repo/regista/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
