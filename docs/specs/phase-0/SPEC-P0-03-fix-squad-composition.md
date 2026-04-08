# SPEC-P0-03 — Migration Redis → PostgreSQL (Composition + Tactiques) (RÉVISÉ post-audit)

> **Phase :** 0 — Sauvetage
> **Priorité :** P0 (BLOQUANT — données critiques volatiles)
> **Estimation :** 3-5 heures
> **Dépendances :** SPEC-P0-02 (tests fonctionnels)

## Contexte (audit)

Deux données critiques du gameplay sont stockées **uniquement en Redis** :
- `composition:{clubId}` — la composition d'équipe (titulaires + remplaçants)
- `tactics:{clubId}` — les paramètres tactiques courants (mentalité, pressing, etc.)

Un flush Redis = perte totale de ces données. C'est une violation directe de la règle projet : "Redis = cache et queues. PostgreSQL = source de vérité."

**Ce qui fonctionne déjà :**
- Les **presets tactiques** sont en PostgreSQL (table `tacticalPresets`) ✅
- L'**auto-lineup** fonctionne (`POST /tactics/auto-lineup`) ✅
- Les endpoints `PUT /tactics/composition` et `PUT /tactics` existent ✅

**Ce qu'on NE fait PAS ici :**
- Drag & drop pour la composition (l'auto-lineup suffit, le drag & drop = Phase 1)
- Interface de changement de capitaine (Phase 1)

## Règles métier

1. La composition DOIT être persistée en PostgreSQL
2. Les tactiques courantes DOIVENT être persistées en PostgreSQL
3. Redis PEUT servir de cache (lecture rapide) mais PostgreSQL est la source de vérité
4. Si Redis ne contient pas la donnée → lire depuis PostgreSQL
5. Si PostgreSQL ne contient pas la donnée → utiliser les valeurs par défaut du preset actif

## Plan d'implémentation

### Étape 1 : Nouvelle table `club_tactics` (ou extension de `tacticalPresets`)

```sql
-- Option A : table séparée pour les tactiques "actives"
CREATE TABLE club_active_tactics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id),
  formation VARCHAR(10) NOT NULL DEFAULT '4-4-2',
  mentality VARCHAR(20) NOT NULL DEFAULT 'balanced',
  pressing VARCHAR(10) NOT NULL DEFAULT 'medium',
  passing_style VARCHAR(10) NOT NULL DEFAULT 'mixed',
  width VARCHAR(10) NOT NULL DEFAULT 'normal',
  tempo VARCHAR(10) NOT NULL DEFAULT 'normal',
  defensive_line VARCHAR(10) NOT NULL DEFAULT 'medium',
  captain_id UUID REFERENCES players(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id)
);

-- Option B : ajouter un flag "active" sur tacticalPresets
-- (moins propre car un preset est un template, pas un état courant)
```

### Étape 2 : Nouvelle table `club_compositions`

```sql
CREATE TABLE club_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id),
  starters JSONB NOT NULL,  -- [{ playerId, position, slot }]
  bench JSONB NOT NULL DEFAULT '[]',  -- [playerId]
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id)
);
```

### Étape 3 : Modifier les services

- `TacticsService.save()` → écrire en PostgreSQL (et optionnellement cacher en Redis)
- `TacticsService.get()` → lire PostgreSQL (ou Redis si cache hit)
- `CompositionService.save()` → écrire en PostgreSQL
- `CompositionService.get()` → lire PostgreSQL
- Supprimer les clés Redis `tactics:{clubId}` et `composition:{clubId}` comme source de vérité

### Étape 4 : Migration des données existantes

- Script de migration one-shot : lire Redis → écrire PostgreSQL pour tous les clubs existants
- Si Redis est vide → pas grave, les clubs utiliseront le preset par défaut au prochain accès

## Edge cases

| Cas | Comportement attendu |
|-----|---------------------|
| Club sans composition en DB | Auto-lineup avec le preset par défaut |
| Club sans tactiques en DB | Créer une entrée avec les valeurs par défaut |
| Redis et PostgreSQL désynchronisés | PostgreSQL fait foi, Redis est invalidé |
| Joueur dans la composition mais transféré/blessé depuis | La composition est invalide → auto-lineup au prochain match |

## Critères d'acceptation

- [ ] Tables `club_active_tactics` et `club_compositions` créées (migration Drizzle)
- [ ] `PUT /tactics` écrit en PostgreSQL (plus uniquement Redis)
- [ ] `GET /tactics` lit depuis PostgreSQL
- [ ] `PUT /tactics/composition` écrit en PostgreSQL
- [ ] `GET /tactics/composition` lit depuis PostgreSQL
- [ ] Flush Redis → les données sont toujours là
- [ ] Test unitaire : sauvegarder une tactique, flush Redis, relire → données intactes
- [ ] Test unitaire : sauvegarder une composition, flush Redis, relire → données intactes
- [ ] Les endpoints existants ne changent pas de signature (pas de breaking change frontend)

## Prompt Claude Code suggéré

```
Lis CLAUDE.md puis docs/specs/phase-0/SPEC-P0-03-redis-to-postgresql.md.

Actuellement la composition (composition:{clubId}) et les tactiques courantes (tactics:{clubId}) sont stockées UNIQUEMENT en Redis. C'est un problème critique.

Plan :
1. Crée 2 nouvelles tables PostgreSQL (migration Drizzle)
2. Modifie TacticsService pour écrire/lire PostgreSQL au lieu de Redis
3. Modifie CompositionService pareil
4. Redis peut rester comme cache optionnel mais PostgreSQL = source de vérité
5. Écris les tests qui prouvent que les données survivent à un flush Redis

Montre-moi le plan (fichiers à créer/modifier) AVANT de commencer.
```

## Hors scope

- Drag & drop de joueurs (Phase 1)
- Interface changement capitaine (Phase 1)
- Refonte UI de la page tactiques
- Optimisation cache Redis (juste s'assurer que PostgreSQL est la source de vérité)