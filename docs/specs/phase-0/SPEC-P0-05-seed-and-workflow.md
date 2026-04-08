# SPEC-P0-05 — Script de seed et workflow de développement

> **Phase :** 0 — Sauvetage
> **Priorité :** P0
> **Estimation :** 3-4 heures
> **Dépendances :** SPEC-P0-02 (tests fonctionnels)

## Contexte

Impossible de tester le jeu rapidement sans un jeu de données complet. Chaque fois qu'on reset la DB, il faut recréer tout à la main. Il faut un script de seed qui plante un environnement de jeu complet en une commande, et un workflow de dev qui lance tout le stack local sans friction.

## Partie 1 — Script de seed

### Données à générer

```
1 user (compte développeur)
└── 1 club humain (en Division 3)
    └── 22 joueurs (OVR 55-65, mix de postes)

1 league
├── Division 1 : 20 clubs IA (OVR 70-80)
├── Division 2 : 20 clubs IA (OVR 60-70)
└── Division 3 : 19 clubs IA (OVR 50-65) + 1 club humain

Calendrier généré pour les 3 divisions (38 journées)
Avancement automatique à la journée 5 :
├── 4 journées simulées avec résultats
├── Classement à jour
├── Fatigue/blessures appliquées
├── Finances mises à jour
└── Journée 5 = prochaine journée à jouer
```

### Règles du seed

1. Les noms de clubs sont crédibles (pas "Club IA 1", "Club IA 2" — utiliser des noms de villes/clubs fictifs)
2. Les joueurs ont des noms réalistes (prénom + nom, nationalités variées)
3. Chaque club IA a une formation préférée et des paramètres tactiques définis
4. Les 4 premières journées sont simulées avec des résultats réalistes (pas tous 0-0 ou 10-0)
5. Le seed est idempotent : peut tourner sur une DB vide ou existante (truncate + reseed)
6. Le seed prend moins de 30 secondes

### Commande

```bash
pnpm seed              # Seed complet (full reset + 5 journées)
pnpm seed:minimal      # Seed minimal (1 user + 1 club + league vide — pour les tests)
pnpm seed:advance N    # Avancer de N journées (simule les matchs)
```

## Partie 2 — Workflow de développement

### Commande unique

```bash
pnpm dev
```

Doit lancer en parallèle :
- PostgreSQL (vérifier qu'il tourne, sinon erreur claire)
- Redis (vérifier qu'il tourne, sinon erreur claire)
- AdonisJS API (avec hot reload)
- BullMQ workers
- TanStack Start frontend (avec hot reload)

### Scripts package.json

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm dev:api\" \"pnpm dev:web\" \"pnpm dev:workers\"",
    "dev:api": "cd apps/api && node ace serve --watch",
    "dev:web": "cd apps/web && vinxi dev",
    "dev:workers": "cd apps/api && node ace jobs:listen",
    "test": "cd apps/api && node ace test",
    "seed": "cd apps/api && node ace db:seed --files=database/seeders/FullSeeder.ts",
    "seed:minimal": "cd apps/api && node ace db:seed --files=database/seeders/MinimalSeeder.ts",
    "lint": "biome check .",
    "build": "pnpm build:api && pnpm build:web",
    "db:migrate": "cd apps/api && node ace migration:run",
    "db:reset": "cd apps/api && node ace migration:fresh && pnpm seed"
  }
}
```

### Vérifications au démarrage

Le script `dev` doit vérifier avant de lancer :
1. PostgreSQL tourne → sinon message : "PostgreSQL n'est pas démarré. Lancez `brew services start postgresql` ou `docker compose up -d`"
2. Redis tourne → sinon message similaire
3. Les migrations sont à jour → sinon message : "Migrations en attente. Lancez `pnpm db:migrate`"
4. Le fichier `.env` existe avec les variables requises

## Critères d'acceptation

### Seed
- [ ] `pnpm seed` crée un environnement complet en <30s
- [ ] 60 clubs avec des noms crédibles, 3 divisions
- [ ] Calendrier de 38 journées pour chaque division
- [ ] 4 journées pré-simulées avec résultats cohérents
- [ ] Classement à jour après les 4 journées
- [ ] Le club humain a 22 joueurs avec des stats variées
- [ ] Idempotent (peut tourner 2 fois sans erreur)

### Workflow
- [ ] `pnpm dev` lance tout en une commande
- [ ] Hot reload fonctionne (API + frontend)
- [ ] Erreurs claires si PostgreSQL/Redis ne tourne pas
- [ ] `pnpm test` exécute les tests et affiche le résultat

## Hors scope

- CI/CD GitHub Actions (spec séparée si besoin)
- Docker compose (nice-to-have mais pas bloquant)
- Déploiement production