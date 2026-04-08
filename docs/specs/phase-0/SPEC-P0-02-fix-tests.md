# SPEC-P0-02 — Fixer le bootstrap des tests Japa (RÉVISÉ post-audit)

> **Phase :** 0 — Sauvetage
> **Priorité :** P0 (BLOQUANT)
> **Estimation :** 2-4 heures
> **Dépendances :** aucune

## Contexte (audit)

`pnpm test` provoque une **boucle infinie** : le message `[ info ] booting application to run tests...` se répète indéfiniment. Cause identifiée : les preloads (`#start/infra`, `#start/routes`) tentent de se connecter à PostgreSQL/Redis au démarrage. Sans connexion DB/Redis de test, le boot ne termine jamais.

**État actuel :**
- 4 tests fonctionnels existent (`auth/login.spec.ts`, `auth/refresh.spec.ts`, `auth/register.spec.ts`, `clubs/club.spec.ts`) mais ne tournent jamais
- 0 tests unitaires
- Aucun dossier `tests/unit/`

## Problèmes à résoudre

### 1. Boucle infinie au bootstrap

Les fichiers `start/*.ts` (notamment `start/infra.ts` qui init Redis/BullMQ et `start/routes.ts`) sont chargés via les preloads de `adonisrc.ts`. En environnement de test, ces connexions échouent silencieusement ou bloquent.

**Solution :** Configurer un environnement de test isolé :
- DB de test dédiée (`regista_test`) créée automatiquement
- Redis : soit connexion test, soit mock pour les tests unitaires
- Preloads conditionnés par `NODE_ENV=test` si nécessaire
- `tests/bootstrap.ts` doit gérer : migration fresh → seed minimal → cleanup après chaque suite

### 2. Aucune structure de tests unitaires

Créer la structure :
```
apps/api/tests/
├── bootstrap.ts          # Setup/teardown DB test
├── unit/
│   └── placeholder.spec.ts   # 1 test trivial pour valider le pipeline
└── functional/
    ├── auth/             # (existants)
    └── clubs/            # (existants)
```

### 3. Configuration `.env.test`

```env
NODE_ENV=test
DB_DATABASE=regista_test
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Comportement attendu

1. `pnpm test` démarre Japa sans boucle infinie
2. La DB `regista_test` est créée si elle n'existe pas
3. Les migrations tournent (fresh) avant les tests
4. Au moins 1 test passe :
   ```typescript
   test('sanity check', async ({ assert }) => {
     assert.equal(2 + 2, 4)
   })
   ```
5. Les tests fonctionnels existants (auth) tournent aussi

## Critères d'acceptation

- [ ] `pnpm test` s'exécute et se termine (pas de boucle infinie)
- [ ] DB de test `regista_test` utilisée (pas la DB de dev)
- [ ] Migrations appliquées automatiquement avant les tests
- [ ] 1 test unitaire trivial passe
- [ ] Les 4 tests fonctionnels existants passent (ou sont identifiés comme nécessitant des fixes)
- [ ] `pnpm test` ajouté aux scripts package.json si pas déjà fait
- [ ] Temps d'exécution < 30 secondes pour la suite triviale

## Prompt Claude Code suggéré

```
Lis CLAUDE.md puis docs/specs/phase-0/SPEC-P0-02-fix-tests.md.

Le problème : `pnpm test` boucle infiniment avec "booting application to run tests..."

Analyse :
1. Regarde `adonisrc.ts` — quels preloads sont chargés ?
2. Regarde `start/infra.ts` — comment Redis/BullMQ sont initialisés ?
3. Regarde `tests/bootstrap.ts` — existe-t-il ? Que fait-il ?
4. Regarde la config Japa dans le projet

Propose un plan pour :
- Isoler l'env de test (DB regista_test, Redis conditionnel)
- Faire passer 1 test trivial
- Ne pas casser les preloads en dev/prod

Montre-moi le plan AVANT de modifier quoi que ce soit.
```

## Hors scope

- Écrire les vrais tests métier (SPEC séparée — Étape 6)
- Configurer GitHub Actions CI
- Mocker entièrement Redis (les tests d'intégration en auront besoin)