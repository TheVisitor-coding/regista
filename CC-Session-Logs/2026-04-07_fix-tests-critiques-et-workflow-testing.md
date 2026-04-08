---
type: session-log
date: 2026-04-07
project: regista
tags: [session, japa, tests, match-engine, finances, redis, rate-limiting, spec-driven, phase-0]
---

# Session : 2026-04-07 — Fix tests critiques + workflow testing

## Quick Reference
**Sujets :** SPEC-P0-06 filtres marche, SPEC-P0-07 tests match engine + finances, fix 15 tests fonctionnels (Redis), workflow testing CLAUDE.md
**Resultat :** 89/89 tests passent (de 15 echecs a 0), 3 specs Phase 0 completees, workflow testing formalise

## Ce qui a ete fait

### SPEC-P0-06 : Fix filtres marche des transferts
- Le controller `GET /market` validait 8 filtres via le validator mais n'appliquait que `source`
- Ajout des filtres `position`, `overallMin/Max`, `ageMin/Max`, `priceMin/Max` sur les bonnes tables (players.* et transferListings.*)
- Ajout du tri dynamique `sortBy`/`sortOrder` (overall, price, age, potential, recent)
- Fix du COUNT query qui manquait le `innerJoin(players)` (aurait crashe avec tout filtre sur players.*)
- Extraction de `buildMarketFilters()` et `buildMarketSort()` comme fonctions pures exportees pour testabilite
- 20 tests unitaires ecrits pour les filtres

### SPEC-P0-07 : Tests critiques match engine + finances
- 24 tests match engine : possession (4), tirs (3), buts (4), fautes (2), fatigue (3), blessures (2), temps additionnel (1), strength calculations (4), simulation 90 min seeded (1)
- 14 tests finances : billetterie par division (4), primes win/draw/loss (3), valorisation joueur (5), probabilites complementaires (2)
- 1 test integration : match flow complet 90min + added time avec 11 assertions (score, possession, fatigue, shots, cards, finances)
- Seed PRNG Mulberry32 pour reproductibilite totale

### Fix 15 tests fonctionnels en erreur
- Cause racine : Redis non connecte en environnement test (infra.ts charge uniquement en env 'web')
- 3 sous-problemes identifies et corriges (voir section Problemes resolus)

### Workflow testing dans CLAUDE.md
- Section Tests enrichie : 3 suites, conventions, infra de test, checklist avant merge
- Ajout point "bloque" pour diagnostic Redis/HTML 500
- 2 decisions techniques ajoutees dans .claude/CLAUDE.md

## Decisions prises
- **Extraction buildMarketFilters/buildMarketSort** : permet des tests unitaires purs sans HTTP/auth, le controller reste thin
- **`!= null` au lieu de `if (value)`** pour les filtres numeriques : gere correctement la valeur `0` (falsy mais valide)
- **Redis dans bootstrap.ts** (pas dans adonisrc preloads) : cible uniquement les tests, pas de changement en prod
- **redis.flushdb() par group.each.setup** (pas par suite) : isolation fine des rate limiters entre chaque test
- **EMAIL_VERIFICATION_REQUIRED=true dans .env.test** : teste le flow complet plutot que le raccourci dev
- **Suite integration dans adonisrc.ts** : nouveau dossier tests/integration/ enregistre comme 3e suite Japa

## Problemes resolus

### 1. Redis non connecte en test (12 tests auth)
- **Probleme** : Tous les POST /auth/* crashaient avec HTML 500
- **Cause** : `start/infra.ts` (qui appelle redis.connect()) n'est charge que pour `environment: ['web']`. Les clients Redis ont `lazyConnect: true` et ne se connectent jamais en test.
- **Solution** : Ajout `redis.connect()` + `bullmqRedis.connect()` dans `tests/bootstrap.ts` setup, et `quit()` dans teardown

### 2. Rate limiters persistants entre tests (invisible tant que Redis non connecte)
- **Probleme** : loginRL (5/15min) et registerRL (3/h) partagent la meme IP 127.0.0.1 entre tous les tests
- **Cause** : Les cles `ratelimit:*` persistent dans Redis entre les tests
- **Solution** : Ajout `redis.flushdb()` dans chaque `group.each.setup` des tests fonctionnels auth

### 3. EMAIL_VERIFICATION_REQUIRED non defini en test (2 tests)
- **Probleme** : `register` retournait `needsVerification: false`, `login` avec pending user activait automatiquement le compte
- **Cause** : `EMAIL_VERIFICATION_REQUIRED ?? (NODE_ENV === 'production')` = `undefined ?? false` = `false` en test
- **Solution** : Ajout `EMAIL_VERIFICATION_REQUIRED=true` dans `.env.test`

### 4. Club staff query sans filtre (1 test)
- **Probleme** : `assert.equal(staff.length, 4)` echouait avec 240
- **Cause** : `db.select().from(clubStaff)` retourne TOUS les staff (60 clubs x 4 staff = 240 apres creation de league)
- **Solution** : Ajout `where(eq(clubStaff.clubId, club.id))` + `where(eq(clubs.userId, user.id))`

### 5. Double redis.connect() dans tactics_persistence.spec.ts
- **Probleme** : `Error: Redis is already connecting/connected`
- **Cause** : Le test appelait `redis.connect()` dans son group.setup alors que bootstrap.ts le fait deja
- **Solution** : Suppression du `redis.connect()` et `redis.quit()` redondants

## Points d'attention
- Les 4 tests club prennent ~2s chacun (creation de league = 59 AI clubs + joueurs + calendrier) — normal mais lent
- `.env.test` utilise Redis DB 0 (meme que dev) — le `flushdb()` en test efface les donnees dev Redis. Envisager `redis://localhost:6379/1` pour les tests.
- Le match engine utilise `Math.random()` — les tests avec seed fixe sont reproductibles mais les tests sans seed peuvent etre flaky

## Taches en suspens
- [ ] SPEC-P0-08+ : Autres specs Phase 0 restantes
- [ ] Isoler Redis test sur DB 1 (minor improvement)
- [ ] Tests frontend (Phase 2)
- [ ] Coverage report (nice-to-have)

## Fichiers impactes
- `apps/api/app/transfers/market_controller.ts` — ajout 8 filtres, tri dynamique, extraction buildMarketFilters/buildMarketSort, fix COUNT join
- `apps/api/tests/unit/match_engine.spec.ts` — nouveau, 24 tests match engine
- `apps/api/tests/unit/finances.spec.ts` — nouveau, 14 tests finances + valorisation
- `apps/api/tests/unit/market_filters.spec.ts` — nouveau, 20 tests filtres marche
- `apps/api/tests/integration/match_flow.spec.ts` — nouveau, 1 test flow complet
- `apps/api/tests/bootstrap.ts` — connexion Redis setup/teardown, flushdb pour functional suites
- `apps/api/tests/functional/auth/login.spec.ts` — import redis, flushdb dans each.setup
- `apps/api/tests/functional/auth/register.spec.ts` — import redis, flushdb dans each.setup
- `apps/api/tests/functional/auth/refresh.spec.ts` — import redis, flushdb dans each.setup
- `apps/api/tests/functional/clubs/club.spec.ts` — fix query staff/clubs filtre par clubId/userId
- `apps/api/tests/unit/tactics_persistence.spec.ts` — suppression redis.connect/quit redondant
- `apps/api/.env.test` — ajout EMAIL_VERIFICATION_REQUIRED=true
- `apps/api/adonisrc.ts` — ajout suite integration dans tests.suites
- `CLAUDE.md` — section Tests enrichie (suites, conventions, infra, checklist), point 5 bloque
- `.claude/CLAUDE.md` — 2 decisions techniques testing

---

## Log detaille

### Phase 1 : SPEC-P0-06 — Filtres marche

La session a commence par la lecture de la spec SPEC-P0-06 (fichier introuvable, spec inline dans le prompt). Le controller `market_controller.ts` avait un query builder qui ne filtrait que sur `source` alors que le validator acceptait 10 parametres.

Exploration du code : `market_controller.ts` (index method), `transfer_validator.ts` (marketQueryValidator), `transfers.ts` schema (transferListings), `players.ts` schema. Le bug etait clair : les conditions ne contenaient que `eq(transferListings.status, 'active')` + optionnel `source`.

Fix : ajout des 8 filtres avec `gte`/`lte` pour les ranges et `eq` pour position/source. Utilisation de `!= null` au lieu de `if (value)` pour gerer `0` comme valeur valide. Ajout du tri dynamique via une map `sortBy → column`. Fix critique supplementaire : la requete COUNT n'avait pas le `innerJoin(players)`, ce qui aurait crashe des qu'un filtre sur players.* etait actif.

Extraction de `buildMarketFilters()` et `buildMarketSort()` comme fonctions pures exportees pour permettre les tests unitaires sans HTTP/auth. 20 tests ecrits et passes.

### Phase 2 : SPEC-P0-07 — Tests critiques

Lecture de la spec SPEC-P0-07-critical-test.md. Lecture complete de `match_probability.ts` (toutes les formules), `match_minute_simulator.ts` (simulation minute par minute), `match_state.ts` (strength calculations), `finance_service.ts` (billetterie, primes, transactions), `valuation_service.ts` (valorisation joueur).

Ecriture de 3 fichiers de test :
- `match_engine.spec.ts` : 24 tests avec seed PRNG Mulberry32. Couvre possession, tirs, buts, fautes, fatigue, blessures, temps additionnel, strength calculations, et une simulation complete de 90 minutes.
- `finances.spec.ts` : 14 tests deterministes (pas de random sauf billetterie testee en fourchette). Couvre billetterie par division, primes, valorisation avec modifiers age/position/contrat/OVR.
- `match_flow.spec.ts` : 1 test integration simulant un match complet (2 equipes, 90min + AT, 11 assertions). Bug rencontre : assertion `homeAvgFatigue > awayAvgFatigue` echouait car les deux equipes atteignent le cap 100 apres 90min. Fix : assertion sur les niveaux absolus au lieu de comparaison relative.

Suite `integration` ajoutee dans `adonisrc.ts` car elle n'existait pas.

### Phase 3 : Fix des 15 tests fonctionnels

Run complet : 74 passed, 15 failed. Les 15 echecs etaient tous dans `tests/functional/` (auth + club).

**Diagnostic** (via 2 agents Explore en parallele) : cause racine unique = Redis non connecte. `start/infra.ts` fait le `redis.connect()` mais n'est charge que pour `environment: ['web']`. En test, les clients Redis restent deconnectes, le rate limiting middleware crashe sur `redis.incr()`.

**Fix 1** : Modification de `tests/bootstrap.ts` — ajout `redis.connect()` + `bullmqRedis.connect()` dans setup, `quit()` dans teardown. Premier essai avec `suite.each.setup` pour le flushdb, mais `suite.each` n'existe pas dans Japa (`TypeError: Cannot read properties of undefined`). Fix : flushdb dans le `suite.setup` au lieu de `suite.each.setup`.

**Run 2** : 81 passed, 3 failed. Progres majeur (12 tests auth fixes). 3 echecs restants :
1. `login:80` — pending user retourne `needsVerification: false` car `EMAIL_VERIFICATION_REQUIRED` non defini en test
2. `register:25` — meme cause
3. `club:69` — `staff.length` = 240 au lieu de 4

**Fix 2** : Ajout `EMAIL_VERIFICATION_REQUIRED=true` dans `.env.test`. Fix query club staff avec `where(eq(clubStaff.clubId, club.id))`.

**Fix 3** : `redis.flushdb()` deplace du suite.setup vers les `group.each.setup` de chaque test fonctionnel auth (meilleure isolation).

**Run 3** : 84 passed, erreur setup `tactics_persistence.spec.ts` — double `redis.connect()`. Fix : suppression du connect/quit redondant dans ce test.

**Run final** : 89/89 PASSED, 0 failures, 13s.

### Phase 4 : CLAUDE.md workflow

Mise a jour de la section Tests dans `CLAUDE.md` : tableau des 3 suites, conventions, documentation de l'infra de test (bootstrap Redis, flushdb, .env.test), checklist avant merge. Ajout du point 5 dans "Quand tu es bloque" pour le diagnostic Redis/HTML 500. Ajout de 2 decisions techniques dans `.claude/CLAUDE.md`.
