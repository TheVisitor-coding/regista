# Workflow Claude Code — Guide pratique

## Comment utiliser les specs avec Claude Code

### Principe

Chaque session de travail avec Claude Code suit le même schéma :

```
1. Tu choisis UNE spec (ex: SPEC-P0-03)
2. Tu donnes la spec à Claude Code
3. Claude Code lit, implémente, teste
4. Tu vérifies le résultat
5. Tu commit sur une branche dédiée
6. Tu passes à la spec suivante
```

### Prompt type pour démarrer une tâche

```
Lis la spec docs/specs/phase-0/SPEC-P0-03-fix-squad-composition.md

Avant de coder :
1. Lis CLAUDE.md pour le contexte du projet
2. Identifie les fichiers existants concernés par cette spec
3. Explique-moi ton plan d'implémentation (fichiers à modifier/créer, tests à écrire)
4. Attends ma validation avant de commencer

Ne modifie RIEN tant que je n'ai pas validé le plan.
```

### Prompt type pour corriger un problème

```
Le test `match_engine.spec.ts > devrait calculer la possession correctement` échoue.

Output :
[coller l'output du test]

Fichier concerné : apps/api/app/services/MatchEngine.ts

Analyse le problème et propose une correction. Ne modifie pas le test sauf si la spec est incorrecte — dans ce cas, explique pourquoi.
```

### Prompt type pour un audit

```
Fais un audit de la fonctionnalité "composition d'équipe" en suivant la procédure de SPEC-P0-01.

Pour chaque point :
1. Lis le code concerné
2. Teste-le (lance l'app si possible, sinon analyse statique)
3. Donne un statut : ✅ OK | ⚠️ Partiel | ❌ Cassé | 🔲 Fake/Hardcodé
4. Détaille le problème si ≠ OK
```

## Règles d'or

### 1. Une tâche = un prompt

**Mauvais :**
> "Implémente le match engine, les penalties, les corners, la fatigue progressive et les transferts IA"

**Bon :**
> "Implémente les penalties dans le match engine en suivant SPEC-P1-XX"

Claude Code produit du bien meilleur code quand la tâche est ciblée.

### 2. Demande le plan AVANT le code

Claude Code a tendance à foncer dans l'implémentation. Force-le à expliquer son approche d'abord. Ça te permet de :
- Vérifier qu'il a compris la spec
- Corriger les malentendus avant qu'ils deviennent du code
- Comprendre ce qui va être modifié

### 3. Vérifie le code critique toi-même

Tu es dev fullstack. Ces modules DOIVENT être compris par toi, pas juste par Claude Code :
- **Match engine** — les formules de probabilité, la boucle de simulation
- **Finances** — les calculs de revenus/dépenses, la boucle économique
- **Transferts** — la valorisation des joueurs, les contraintes
- **Auth/Sécurité** — validation des inputs, permissions

Si tu lis le code et tu ne comprends pas un calcul → c'est un red flag. Demande à Claude Code d'expliquer, puis simplifie si nécessaire.

### 4. Teste après chaque changement

```bash
pnpm test           # Après chaque modification
pnpm lint           # Avant chaque commit
```

Si un test casse → corrige AVANT de passer à autre chose. La dette de tests accumulée est le cancer des projets pilotés par IA.

### 5. Git discipliné

```bash
# Avant de commencer une spec
git checkout -b feature/SPEC-P0-03-fix-squad

# Pendant le travail (commits fréquents)
git add . && git commit -m "[SPEC-P0-03] Fix player selection in squad composition"
git add . && git commit -m "[SPEC-P0-03] Add validation for GK requirement"
git add . && git commit -m "[SPEC-P0-03] Add unit tests for squad validation"

# Quand c'est fini
git push origin feature/SPEC-P0-03-fix-squad
# Merge dans main après vérification
```

## Ordre d'exécution — Phase 0

```
SPEC-P0-01  Audit                   ← COMMENCE ICI
    │
    ▼
SPEC-P0-02  Fix tests Japa          ← Sans ça, tout le reste est fragile
    │
    ├──▶ SPEC-P0-05  Seed + Workflow  ← En parallèle, tu en as besoin pour tester
    │
    ▼
SPEC-P0-03  Fix composition         ← Premier geste du joueur
    │
    ▼
SPEC-P0-04  Fix match pipeline      ← Le plus complexe, le plus critique
    │
    ▼
[Phase 0 terminée] → Tu peux jouer un match complet
```

## Quand Claude Code fait n'importe quoi

Ça va arriver. Signes d'alerte :

- **Il supprime des tests qui échouent** → "Ne supprime pas ce test. Corrige le code pour que le test passe."
- **Il hardcode des valeurs** → "Pourquoi cette valeur est en dur ? Elle devrait venir de [la config / la base / un calcul]."
- **Il modifie trop de fichiers d'un coup** → "Stop. Liste-moi les fichiers que tu as modifiés et pourquoi."
- **Il ne comprend pas la spec** → "Résume la spec en 3 phrases. Si ton résumé est faux, on reclarifie avant de coder."
- **Il propose une refonte massive** → "On ne refactorise pas. On fixe le bug décrit dans la spec, point."

## Estimation de temps réaliste

Avec Claude Code sur un projet existant cassé :

| Tâche | Optimiste | Réaliste | Pessimiste |
|-------|-----------|----------|------------|
| SPEC-P0-01 Audit | 2h | 3h | 5h |
| SPEC-P0-02 Fix tests | 2h | 4h | 8h |
| SPEC-P0-03 Fix composition | 3h | 5h | 10h |
| SPEC-P0-04 Fix match pipeline | 5h | 10h | 20h |
| SPEC-P0-05 Seed + workflow | 2h | 4h | 6h |
| **Total Phase 0** | **14h** | **26h** | **49h** |

Le "pessimiste" est plus probable que l'"optimiste" sur un code existant généré par IA.