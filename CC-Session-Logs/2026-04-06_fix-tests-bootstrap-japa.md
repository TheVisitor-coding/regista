---
type: session-log
date: 2026-04-06
project: regista
tags: [session, japa, tests, adonisjs, bug-fix, phase-0, drizzle]
---

# Session : 2026-04-06 — Fix bootstrap tests Japa (SPEC-P0-02)

## Quick Reference
**Sujets :** Fix boucle infinie `pnpm test`, réécriture bin/test.ts, isolation env test, config suites Japa
**Résultat :** `pnpm test` fonctionne — 1 test unitaire passe, 6/20 tests passent au total, process termine proprement

## Ce qui a été fait
- Diagnostiqué la cause racine de la boucle infinie : `bin/test.ts` utilisait `.ace().handle(['test'])` au lieu de `.testRunner()`, causant une récursion infinie (ace spawne bin/test.js qui relance ace)
- Identifié un second bloquant : preload `#start/infra` chargeait Redis/BullMQ inconditionnellement (bloquait en env test sans Redis)
- Réécrit `bin/test.ts` avec le pattern AdonisJS standard (`.testRunner().configure().run()`)
- Gaté `#start/infra` sur `environment: ['web']` dans `adonisrc.ts`
- Ajouté la config `tests.suites` dans `adonisrc.ts` (unit + functional)
- Créé `.env.test` avec DB `regista_test` isolée
- Enrichi `tests/bootstrap.ts` : migrations Drizzle en setup, fermeture sqlClient en teardown
- Créé `tests/unit/sanity.spec.ts` (test trivial 2+2=4)
- Créé la DB `regista_test` via Docker

## Décisions prises
- `bin/test.ts` réécrit avec `.testRunner()` : parce que `.ace().handle(['test'])` crée une récursion infinie (ace command spawne bin/test.js qui est le même fichier compilé)
- `#start/infra` gaté sur `['web']` : parce que Redis/BullMQ n'ont pas de sens en env test au boot. Les tests qui en ont besoin les importeront manuellement
- Migrations via `execSync('pnpm --filter @regista/db db:migrate')` : parce que `testUtils.db().migrate()` est conçu pour Lucid, pas Drizzle
- Fermeture sqlClient dans le teardown : parce que postgres.js maintient une connexion ouverte qui empêche le process de terminer

## Problèmes résolus

- **Problème** : `pnpm test` boucle infiniment avec "booting application to run tests..."
- **Cause** : Double cause racine — (1) `bin/test.ts` utilisait `.ace().handle(['test'])` qui lance la commande ace `test`, qui via l'assembler spawne `bin/test.js` comme child process, qui est le même fichier compilé, créant une récursion infinie. (2) Le preload `#start/infra` était inconditionnel et tentait de connecter Redis au boot.
- **Solution** : Réécrit `bin/test.ts` avec `.testRunner().configure().run()` (pattern standard AdonisJS) + gaté `#start/infra` sur `environment: ['web']`

- **Problème** : "NO TESTS EXECUTED" après fix de la boucle
- **Cause** : Aucune section `tests.suites` dans `adonisrc.ts` — Japa ne savait pas où chercher les fichiers de test
- **Solution** : Ajouté `tests: { suites: [{ name: 'unit', files: [...] }, { name: 'functional', files: [...] }], timeout: 30_000 }`

- **Problème** : Process test ne termine pas (hang après exécution)
- **Cause** : `@regista/db` crée une connexion postgres.js qui reste ouverte indéfiniment
- **Solution** : Ajouté `sqlClient.end()` dans `runnerHooks.teardown` de bootstrap.ts

## Points d'attention
- **14 tests fonctionnels échouent** — principalement des 429 (rate limiter) et des données non nettoyées entre runs (ex: 240 club_staff au lieu de 4). Nécessite : désactiver rate limiter en test + truncate tables entre chaque test group
- **Migrations drizzle-kit lisent `.env` racine** — mais `dotenv` ne override pas les variables déjà définies dans process.env, donc `DATABASE_URL` du `.env.test` est respectée. Fonctionnel mais fragile.
- **`.env.test` contient des credentials de test en clair** — acceptable pour du dev local, à ne pas committer si le repo devient public

## Tâches en suspens
- [ ] Fixer les 14 tests fonctionnels échoués (rate limiter 429 + cleanup entre tests)
- [ ] Écrire les tests unitaires critiques : match engine, finances, progression (SPEC-P0-02 critère étendu)
- [ ] Implémenter les fixes P1 de l'audit (Socket.io, Redis->PG, standingPosition, filtres marché, seed, typo, FK, drag & drop)

## Fichiers impactés
- `apps/api/bin/test.ts` — réécrit : `.ace()` -> `.testRunner().configure().run()`
- `apps/api/adonisrc.ts` — gaté `#start/infra` sur `['web']` + ajouté `tests.suites` config
- `apps/api/.env.test` — créé, DB `regista_test` isolée
- `apps/api/tests/bootstrap.ts` — ajouté migration Drizzle en setup + sqlClient.end() en teardown
- `apps/api/tests/unit/sanity.spec.ts` — créé, test trivial

---

## Log détaillé

### Phase 1 — Exploration (plan mode)

Lancé un agent Explore pour lire tous les fichiers pertinents :
- `adonisrc.ts` : 3 preloads dont `#start/infra` inconditionnel, `ws` et `workers` gatés sur `['web']`
- `start/infra.ts` : importe `redis`, `bullmqRedis`, `queueService` et enregistre un terminating hook
- `app/services/redis.ts` : ioredis avec `lazyConnect: true`, `enableReadyCheck: true`, `maxRetriesPerRequest: null`
- `tests/bootstrap.ts` : plugins Japa (assert, apiClient, pluginAdonisJS), hooks vides, configureSuite gate httpServer pour functional/browser/e2e
- `bin/test.ts` : utilise `.ace().handle(['test', ...])` — identifié comme suspect
- `start/env.ts` : valide `REDIS_URL` comme required string
- Pas de `.env.test` existant
- Pas de `tests/unit/` existant

### Phase 2 — Plan

Plan initial : gater `#start/infra` sur `['web']` + créer `.env.test` + enrichir bootstrap + test trivial. Approuvé.

### Phase 3 — Implémentation et premier test

Appliqué le gate sur `#start/infra`. Créé `.env.test`. Modifié bootstrap. Créé sanity.spec.ts.

Premier test : `node ace test` → **toujours la boucle infinie**. Le gate n'a pas suffi.

### Phase 4 — Investigation approfondie

Lu le code source de l'assembler AdonisJS :
- `commands/test.js` : la commande ace `test` crée un `assembler.TestRunner`
- `TestRunner` (build/index.js:827) : `#scriptFile = "bin/test.js"` — spawne `bin/test.js` comme child process via execa
- `DEFAULT_NODE_ARGS` : ajoute `--loader=ts-node/esm` ou `--import=ts-node-maintained/register/esm`
- Le child process `bin/test.js` = `bin/test.ts` compilé à la volée

**Trouvé la cause racine** : `bin/test.ts` utilise `.ace().handle(['test'])` → lance la commande ace `test` → assembler spawne `bin/test.js` → qui est le même fichier → relance ace `test` → **récursion infinie**.

Le fichier standard AdonisJS devrait utiliser `.testRunner()` pas `.ace()`.

Vérifié via `ignitor/test.js` : `TestRunnerProcess.run()` fait `createApp('test')` → boot → start → callback. Pas de spawn de child process.

### Phase 5 — Correction et succès

Réécrit `bin/test.ts` avec `.testRunner().configure().run()`. Ajouté la config `tests.suites` dans `adonisrc.ts` (manquante).

Test direct : `NODE_ENV=test node --import=ts-node-maintained/register/esm bin/test.ts` → **migrations OK, sanity test passe, plus de boucle**. Mais le process ne terminait pas → ajouté `sqlClient.end()` dans teardown.

Test final : `node ace test` et `pnpm test` → **6 passent, 14 échouent, process termine en 11s**. Les échecs sont attendus (rate limiter 429, données non nettoyées).

### Commandes clés
```bash
# Diagnostic
docker exec regista-postgres psql -U regista -c "CREATE DATABASE regista_test;"
NODE_ENV=test node --import=ts-node-maintained/register/esm bin/test.ts  # test direct

# Vérification finale
node ace test                    # OK, 6 pass / 14 fail, terminates
pnpm test                       # OK, delegates via turbo
node ace test --suite=unit       # OK, 1 pass
```

### Pistes explorées sans succès
- Hypothèse initiale : Redis bloquant le boot → partiellement vrai mais pas la cause principale
- `--loader=ts-node/esm` vs `ts-node-maintained` → red herring, le vrai loader fonctionne
- `hot-hook` comme cause du re-run → non, c'était la récursion ace
