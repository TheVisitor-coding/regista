# SPEC-09 : Système d'Entraînement

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-02 (Club), SPEC-04 (Effectif), SPEC-05 (Championnat)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03

---

## 1. Objectif

Permettre au joueur de **faire progresser activement** son effectif entre les matchs via un système d'entraînement ciblé. L'entraînement est un levier stratégique complémentaire à la progression passive (SPEC-04 §11) : le joueur choisit quels aspects développer, avec des compromis (fatigue vs progression).

**Philosophie** : l'entraînement doit être impactant sans être chronophage. Le joueur configure un programme, le système l'applique automatiquement. Résultat visible à chaque session — la "dopamine quotidienne" des +0.2 en vitesse.

---

## 2. Règles métier fondamentales

| Règle | Valeur |
|---|---|
| Cycle | 1 session d'entraînement entre chaque match (tous les 3 jours) |
| Application | Automatique (job BullMQ post-match) |
| Mode | Programme par ligne (GK/DEF/MID/ATT) avec surcharge individuelle |
| Focus disponibles (outfield) | 5 + Repos : Physique, Technique, Mental, Défensif, Coups de pied arrêtés, Repos |
| Focus disponibles (GK) | 3 + Repos : Réflexes, Distribution, Placement, Repos |
| Plafond de stat | `potential + 5` (hard cap, aucune stat ne peut dépasser) |
| Impact fatigue | Oui (chaque session ajoute de la fatigue) |
| Risque de blessure | Non en MVP (uniquement fatigue) |
| Intersaison | Pas d'entraînement pendant l'intersaison (5 jours — SPEC-05 §6) |

---

## 3. Programme d'entraînement

### 3.1 Structure du programme

Le programme d'entraînement est une configuration par **ligne de jeu** :

```
Programme d'entraînement du club :
├── Gardiens    → [Réflexes / Distribution / Placement / Repos]
├── Défenseurs  → [Physique / Technique / Mental / Défensif / CPA / Repos]
├── Milieux     → [Physique / Technique / Mental / Défensif / CPA / Repos]
└── Attaquants  → [Physique / Technique / Mental / Défensif / CPA / Repos]

Surcharges individuelles (optionnel) :
├── R. Santos (ST) → Mental (au lieu de Technique pour les ATT)
└── M. Silva (LB)  → Repos (blessé récemment, repos forcé)
```

### 3.2 Focus d'entraînement (outfield)

Chaque focus cible un groupe de stats (SPEC-04 §2.1) :

| Focus | Stats ciblées | Nb stats | Fatigue ajoutée |
|---|---|---|---|
| **Physique** | pace, stamina, strength, agility | 4 | +7 |
| **Technique** | passing, shooting, dribbling, crossing, heading | 5 | +5 |
| **Mental** | vision, composure, workRate, positioning | 4 | +3 |
| **Défensif** | tackling, marking | 2 | +5 |
| **Coups de pied arrêtés (CPA)** | penalties, freeKick | 2 | +4 |
| **Repos** | — (aucun entraînement) | 0 | **-10** (récupération bonus) |

**Compromis** :
- Physique = gains bien répartis mais très fatigant
- Technique = gains plus dilués (5 stats) mais fatigue modérée
- Mental = moins fatigant, adapté aux joueurs à haute fatigue
- Défensif = gains concentrés sur 2 stats (progression rapide mais niche)
- CPA = spécialisé, utile pour les tireurs désignés
- Repos = aucune progression mais récupération accélérée

### 3.3 Focus d'entraînement (gardiens)

| Focus | Stats ciblées | Nb stats | Fatigue ajoutée |
|---|---|---|---|
| **Réflexes** | reflexes, diving | 2 | +5 |
| **Distribution** | kicking, communication | 2 | +4 |
| **Placement** | handling, positioning | 2 | +4 |
| **Repos** | — | 0 | **-10** |

### 3.4 Programme par défaut

À la création du club, le programme par défaut est :

| Ligne | Focus par défaut |
|---|---|
| Gardiens | Réflexes |
| Défenseurs | Défensif |
| Milieux | Technique |
| Attaquants | Technique |

Le joueur peut modifier le programme à tout moment. Les changements prennent effet à la **prochaine session**.

---

## 4. Formule de progression

### 4.1 Gain par session

À chaque session d'entraînement, les stats du focus sont améliorées selon la formule :

```
budget_session = 0.5

// Modificateur d'âge
age_mod =
  ≤ 21  → × 1.5  (jeune, forte absorption)
  22-24 → × 1.2  (progression rapide)
  25-29 → × 1.0  (stabilité)
  30-32 → × 0.5  (déclin de la capacité d'apprentissage)
  ≥ 33  → × 0.2  (progression quasi nulle)

// Modificateur de niveau (rendements décroissants)
level_mod = max(0.1, (100 - stat_actuelle) / 100)
  // stat 50 → × 0.50
  // stat 70 → × 0.30
  // stat 85 → × 0.15

// Modificateur de fatigue (entraînement moins efficace si fatigué)
fatigue_mod = max(0.2, (100 - fatigue) / 100)
  // fatigue 20 → × 0.80
  // fatigue 50 → × 0.50
  // fatigue 80 → × 0.20

// Budget distribué entre les stats du focus
budget_effectif = budget_session × age_mod × fatigue_mod
gain_par_stat = (budget_effectif / nb_stats_du_focus) × level_mod

// Plafond : aucune stat ne dépasse potential + 5
si stat_actuelle + gain_par_stat > potential + 5 :
    gain_par_stat = max(0, (potential + 5) - stat_actuelle)
```

### 4.2 Exemples de gains par session

| Profil | Âge | Overall | Focus | Stat ciblée | Fatigue | Gain/session | Gain/saison (×38) |
|---|---|---|---|---|---|---|---|
| Jeune pépite | 19 | 55 | Physique (4 stats) | pace: 52 | 25% | +0.071 | +2.7 |
| Jeune pépite | 19 | 55 | Défensif (2 stats) | tackling: 48 | 25% | +0.146 | +5.6 |
| Milieu confirmé | 26 | 68 | Technique (5 stats) | passing: 72 | 40% | +0.018 | +0.7 |
| Milieu confirmé | 26 | 68 | Mental (4 stats) | vision: 65 | 40% | +0.026 | +1.0 |
| Vétéran | 32 | 74 | Physique (4 stats) | pace: 70 | 30% | +0.013 | +0.5 |
| Vétéran | 32 | 74 | Mental (4 stats) | composure: 78 | 30% | +0.010 | +0.4 |

### 4.3 Interaction avec la progression passive

L'entraînement s'ajoute à la progression passive définie dans SPEC-04 §11 :

| Source | Fréquence | Impact |
|---|---|---|
| **Progression passive** | Après chaque match | +0.1-0.3 sur 1-2 stats (aléatoire, basé sur l'âge) |
| **Entraînement** | Entre chaque match | +gain ciblé sur les stats du focus choisi |

**Progression totale estimée par saison (jeune joueur 20 ans, stat 55) :**
- Passive : ~3-5 points répartis aléatoirement
- Entraînement (focus Physique) : ~2-3 points sur chaque stat physique
- **Total sur stats ciblées : ~5-8 points/saison** — progression visible et motivante

### 4.4 Variation aléatoire

Pour éviter une progression mécanique et prévisible, un facteur aléatoire de ±30% est appliqué au gain par stat :

```
gain_final = gain_par_stat × (1 + random(-0.3, 0.3))
```

Cela crée des sessions "bonnes" et "mauvaises", renforçant l'engagement.

---

## 5. Impact sur la fatigue

### 5.1 Fatigue d'entraînement

Chaque session ajoute de la fatigue (voir tableau §3.2). Cette fatigue se cumule avec la fatigue de match.

**Cycle type sur 3 jours :**

```
Jour 0 : Match (fatigue +10-15 selon minutes jouées — SPEC-04 §8.2)
Jour 1 : Repos (récupération naturelle — SPEC-04 §8.3)
Jour 2 : Entraînement appliqué (fatigue +3 à +7 selon focus)
Jour 3 : Match suivant
```

**Récupération naturelle** (SPEC-04 §8.3, rappel) :

```
récup_quotidienne = 8 + stamina/20 + bonus_non_convoqué(5)
// Joueur moyen (stamina 60) : ~11/jour
// Sur 3 jours : ~33 de récupération
```

**Bilan type (joueur titulaire, stamina 60, focus Physique) :**
- Match : fatigue +12 (90 min)
- Récupération (3 jours) : -33
- Entraînement Physique : +7
- **Net sur le cycle : -14 de fatigue** → la fatigue diminue progressivement

**Bilan type (joueur titulaire, stamina 40, focus Physique) :**
- Match : fatigue +14
- Récupération (3 jours) : -30
- Entraînement Physique : +7
- **Net sur le cycle : -9** → récupération plus lente

### 5.2 Option Repos

Choisir "Repos" comme focus :
- Aucune progression de stats
- **-10 de fatigue bonus** (en plus de la récupération naturelle)
- Utile pour les joueurs très fatigués ou en retour de blessure

### 5.3 Joueurs exclus de l'entraînement

| Cas | Entraînement |
|---|---|
| Joueur blessé | **Aucun** (automatiquement en repos) |
| Joueur suspendu | Entraînement normal (la suspension n'empêche pas l'entraînement) |
| Joueur en fin de contrat (≤ 2 matchs) | Entraînement normal |

---

## 6. Interface utilisateur

### 6.1 Page entraînement (`/training`)

```
┌──────────────────────────────────────────────────────────────┐
│  ENTRAÎNEMENT                                                  │
│                                                                │
│  ── PROGRAMME ACTUEL ─────────────────────────────────────    │
│                                                                │
│  🧤 Gardiens      [Réflexes ▼]                                │
│  🛡️ Défenseurs    [Défensif ▼]                                │
│  🎯 Milieux       [Technique ▼]                               │
│  ⚡ Attaquants    [Technique ▼]                               │
│                                                                │
│  Prochaine session : dans 1j 14h (après le match)             │
│  [Sauvegarder les changements]                                 │
│                                                                │
│  ── SURCHARGES INDIVIDUELLES ─────────────────────────────    │
│                                                                │
│  R. Santos (ST)  [Mental ▼]  (au lieu de Technique)           │
│  M. Silva (LB)   [Repos ▼]   (au lieu de Défensif)           │
│  [+ Ajouter une surcharge]                                     │
│                                                                │
│  ── DERNIER RAPPORT D'ENTRAÎNEMENT ──────────────────────    │
│  Session du 02/03 (il y a 1 jour)                              │
│                                                                │
│  📈 R. Santos (ST) — Mental                                   │
│     vision +0.2 │ composure +0.1 │ workRate +0.3 │ pos. +0.1  │
│     Fatigue : 42% (+3)                                         │
│                                                                │
│  📈 A. Dupont (CB) — Défensif                                 │
│     tackling +0.4 │ marking +0.3                               │
│     Fatigue : 55% (+5)                                         │
│                                                                │
│  🔴 L. Garcia (ST) — Blessé, pas d'entraînement               │
│                                                                │
│  📈 M. Eriksen (CM) — Technique                               │
│     passing +0.1 │ dribbling +0.2 │ shooting +0.1              │
│     crossing +0.0 │ heading +0.1                               │
│     Fatigue : 38% (+5)                                         │
│                                                                │
│  ... (22-25 joueurs)                                           │
│  [Voir tout le rapport →]                                      │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Rapport d'entraînement complet

```
┌──────────────────────────────────────────────────────────────┐
│  RAPPORT D'ENTRAÎNEMENT — 02/03/2026                          │
│                                                                │
│  ── RÉSUMÉ ───────────────────────────────────────────────    │
│  Joueurs entraînés : 20/22                                     │
│  Joueurs au repos : 1 (M. Silva)                               │
│  Joueurs blessés : 1 (L. Garcia)                               │
│  Fatigue moyenne après session : 45% (+4.2 moy.)              │
│                                                                │
│  ── TOP PROGRESSIONS ─────────────────────────────────────    │
│  🥇 K. Mensah (LW, 19 ans) — workRate +0.4                   │
│  🥈 R. Santos (ST, 22 ans) — vision +0.3                     │
│  🥉 A. Dupont (CB, 24 ans) — tackling +0.4                   │
│                                                                │
│  ── DÉTAIL PAR JOUEUR ────────────────────────────────────    │
│                                                                │
│  [Liste complète avec gains par stat, fatigue, focus]          │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Indicateurs sur la fiche joueur

Sur la fiche joueur (SPEC-04), les stats affichent un **indicateur de tendance** basé sur les dernières sessions :

| Indicateur | Condition | Affichage |
|---|---|---|
| ⬆ En progression | Gain cumulé > 0.5 sur les 5 dernières sessions | Flèche verte |
| → Stable | Gain cumulé entre 0 et 0.5 | Tiret gris |
| ⬇ En régression | Gain négatif (régression liée à l'âge) | Flèche rouge |
| 🔒 Plafond | Stat à `potential + 5` | Cadenas |

---

## 7. Notifications d'entraînement

| Événement | Staff | Message | Priorité |
|---|---|---|---|
| Session terminée | Adjoint | "Entraînement terminé. {Top joueur} a montré de belles progressions aujourd'hui." | Info |
| Joueur atteint le plafond d'une stat | Adjoint | "{Joueur} a atteint son plafond en {stat}. Envisagez de changer son focus." | Info |
| Fatigue excessive (>80% après session) | Médecin | "Attention, {N} joueurs sont très fatigués après l'entraînement. Pensez au repos." | Warning |
| Aucun programme configuré | Adjoint | "Aucun programme d'entraînement défini. Vos joueurs ne progressent pas !" | Important |

---

## 8. Entraînement des clubs IA

### 8.1 Programme IA

Les clubs IA ont un programme d'entraînement automatique basé sur leur profil (SPEC-07 §3.3) :

| Profil IA | GK | DEF | MID | ATT |
|---|---|---|---|---|
| Offensif | Réflexes | Physique | Technique | Technique |
| Équilibré | Placement | Défensif | Technique | Physique |
| Défensif | Réflexes | Défensif | Mental | Physique |

L'IA ne fait pas de surcharges individuelles. Le programme ne change pas en cours de saison.

### 8.2 Application

L'entraînement IA suit exactement les mêmes formules que les joueurs humains. Cela garantit un équilibre entre les clubs IA et humains — un joueur qui optimise son entraînement a un avantage sur l'IA (qui applique un programme basique).

---

## 9. Modèle de données

### 9.1 Table `club_training_program`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK UNIQUE | 1 programme par club |
| `gk_focus` | `enum` | `reflexes`, `distribution`, `placement`, `rest` |
| `def_focus` | `enum` | `physical`, `technical`, `mental`, `defensive`, `set_pieces`, `rest` |
| `mid_focus` | `enum` | idem |
| `att_focus` | `enum` | idem |
| `updated_at` | `timestamp` | |

### 9.2 Table `player_training_override`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | |
| `player_id` | `uuid` FK | |
| `focus` | `enum` | Focus spécifique pour ce joueur (outfield ou GK) |
| `created_at` | `timestamp` | |

**Index** :
- `UNIQUE` sur `club_id` + `player_id` (1 surcharge max par joueur)

### 9.3 Table `training_sessions`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | |
| `matchday_number` | `integer` | Numéro de journée associée |
| `applied_at` | `timestamp` | Date d'application |
| `summary` | `jsonb` | Résumé global (joueurs entraînés, fatigue moyenne, etc.) |
| `created_at` | `timestamp` | |

### 9.4 Table `training_results`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `session_id` | `uuid` FK | |
| `player_id` | `uuid` FK | |
| `focus` | `enum` | Focus appliqué |
| `gains` | `jsonb` | `{ "pace": 0.2, "stamina": 0.1, ... }` |
| `fatigue_before` | `decimal(4,1)` | Fatigue avant la session |
| `fatigue_after` | `decimal(4,1)` | Fatigue après la session |
| `skipped` | `boolean` | `true` si joueur blessé (pas d'entraînement) |
| `skip_reason` | `varchar(20)` NULLABLE | `injured`, `null` |

**Index** :
- `INDEX` sur `session_id` (tous les résultats d'une session)
- `INDEX` sur `player_id` + `session_id` (historique d'un joueur)

---

## 10. API Endpoints

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/training/program` | Programme d'entraînement actuel | Oui |
| `PUT` | `/training/program` | Modifier le programme (focus par ligne) | Oui |
| `GET` | `/training/overrides` | Liste des surcharges individuelles | Oui |
| `PUT` | `/training/overrides/:playerId` | Ajouter/modifier une surcharge | Oui |
| `DELETE` | `/training/overrides/:playerId` | Supprimer une surcharge (retour au programme par ligne) | Oui |
| `GET` | `/training/sessions` | Historique des sessions (paginé) | Oui |
| `GET` | `/training/sessions/:sessionId` | Détail d'une session (résultats par joueur) | Oui |
| `GET` | `/training/sessions/latest` | Dernière session (pour le widget dashboard) | Oui |

### 10.1 `PUT /training/program`

**Request** :
```json
{
  "gkFocus": "reflexes",
  "defFocus": "defensive",
  "midFocus": "technical",
  "attFocus": "physical"
}
```

**Response `200`** :
```json
{
  "program": {
    "gkFocus": "reflexes",
    "defFocus": "defensive",
    "midFocus": "technical",
    "attFocus": "physical",
    "updatedAt": "2026-03-03T10:00:00Z"
  },
  "nextSession": "2026-03-05T04:00:00Z"
}
```

### 10.2 `GET /training/sessions/latest`

**Response `200`** :
```json
{
  "session": {
    "id": "uuid",
    "appliedAt": "2026-03-02T04:00:00Z",
    "matchdayNumber": 12,
    "summary": {
      "playersTrained": 20,
      "playersResting": 1,
      "playersInjured": 1,
      "avgFatigueAfter": 45.2,
      "avgFatigueChange": 4.2
    },
    "topProgressions": [
      { "playerId": "uuid", "playerName": "K. Mensah", "stat": "workRate", "gain": 0.4 },
      { "playerId": "uuid", "playerName": "R. Santos", "stat": "vision", "gain": 0.3 }
    ],
    "results": [
      {
        "playerId": "uuid",
        "playerName": "R. Santos",
        "focus": "mental",
        "gains": { "vision": 0.3, "composure": 0.1, "workRate": 0.2, "positioning": 0.1 },
        "fatigueBefore": 39,
        "fatigueAfter": 42,
        "skipped": false
      }
    ]
  }
}
```

---

## 11. Job BullMQ

| Job | Déclencheur | Description |
|---|---|---|
| `apply-training` | Post-match processing terminé (SPEC-03 §12) | Applique l'entraînement à tous les clubs de la division pour la journée |

### 11.1 Déroulement du job

```
Pour chaque club de la division ayant joué :

1. Charger le programme d'entraînement
2. Charger les surcharges individuelles
3. Pour chaque joueur de l'effectif :
   a. Déterminer le focus (surcharge > programme par ligne)
   b. Si blessé → skip (log "injured")
   c. Si focus = repos → appliquer -10 fatigue bonus, pas de gain
   d. Sinon :
      - Calculer le gain par stat (formule §4.1)
      - Appliquer la variation aléatoire (±30%)
      - Borner au plafond (potential + 5)
      - Mettre à jour les stats en base
      - Appliquer la fatigue d'entraînement
4. Sauvegarder la session et les résultats
5. Envoyer la notification de session terminée
```

---

## 12. User Stories

### Configuration

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRAIN-01 | Joueur | Configurer un programme d'entraînement par ligne | Cibler les axes de progression de mon effectif | 4 lignes configurables, sauvegarde instantanée |
| TRAIN-02 | Joueur | Ajouter une surcharge individuelle sur un joueur | Personnaliser le développement d'un joueur précis | Surcharge visible, priorité sur le programme par ligne |
| TRAIN-03 | Joueur | Mettre un joueur au repos | Accélérer sa récupération | Option "Repos" dans le focus, fatigue -10 bonus |
| TRAIN-04 | Joueur | Voir le programme par défaut à la création du club | Commencer sans configuration | Programme auto-généré (DEF=Défensif, MID=Technique, ATT=Technique) |

### Progression

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRAIN-05 | Joueur | Voir le rapport d'entraînement après chaque session | Suivre la progression de mes joueurs | Gains par stat, fatigue, top progressions |
| TRAIN-06 | Joueur | Voir un indicateur de tendance sur chaque stat | Évaluer la dynamique de progression | Flèches ⬆/→/⬇ basées sur les 5 dernières sessions |
| TRAIN-07 | Joueur | Que les jeunes joueurs progressent plus vite | Investir dans les pépites | Modificateur d'âge visible dans les gains |
| TRAIN-08 | Joueur | Que les stats proches du plafond progressent lentement | Sentir les rendements décroissants | Gains réduits quand stat → potential + 5 |
| TRAIN-09 | Joueur | Voir quand une stat atteint son plafond | Changer de focus | Icône 🔒 + notification du staff |

### Fatigue & Gestion

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRAIN-10 | Joueur | Que l'entraînement physique fatigue plus que le mental | Choisir stratégiquement le focus | Fatigue +7 (physique) vs +3 (mental) |
| TRAIN-11 | Joueur | Être alerté si mes joueurs sont trop fatigués | Éviter les contre-performances en match | Notification médecin si fatigue > 80% après session |
| TRAIN-12 | Joueur | Que les joueurs blessés ne s'entraînent pas | Ne pas aggraver les blessures | Joueurs blessés auto-skip, affichés comme tels |

### Historique

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRAIN-13 | Joueur | Voir l'historique des sessions d'entraînement | Analyser la progression sur le long terme | Liste paginée, détail par session |
| TRAIN-14 | Joueur | Voir le top des progressions de chaque session | Identifier les joueurs qui se développent le mieux | Top 3 affiché dans le résumé de session |

---

## 13. Stratégie de tests

### Tests unitaires

- **Formule de gain** : vérifier les gains pour toutes les combinaisons (âge × stat × fatigue × focus)
- **Plafond** : vérifier qu'aucune stat ne dépasse `potential + 5`
- **Fatigue** : vérifier l'ajout de fatigue par type de focus
- **Repos** : vérifier le bonus de -10 fatigue, aucun gain de stat
- **Blessés** : vérifier le skip automatique
- **Surcharge** : vérifier que la surcharge individuelle prend la priorité sur le programme

### Tests d'intégration

- **Session complète** : configurer un programme → match terminé → session appliquée → stats mises à jour → rapport généré → notification envoyée
- **Surcharge + programme** : vérifier qu'un joueur avec surcharge a un focus différent de sa ligne
- **Multi-sessions** : simuler 10 sessions consécutives et vérifier la progression cumulative
- **Interaction avec progression passive** : vérifier que les gains d'entraînement s'ajoutent à la progression post-match

### Tests d'équilibrage

- **Progression sur une saison** : simuler 38 sessions pour un jeune joueur (20 ans, overall 55) et vérifier que la progression totale est dans la fourchette attendue (+2-5 par stat ciblé)
- **Pas de power creep** : simuler 3 saisons et vérifier que les joueurs ne deviennent pas surpuissants
- **IA vs Humain** : comparer la progression d'un joueur IA (programme basique) vs humain (programme optimisé) sur une saison

---

## 14. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Cycle d'entraînement | Programme hebdo, appliqué entre chaque match (tous les 3 jours) | 2 |
| Granularité | Par ligne (GK/DEF/MID/ATT) avec surcharge individuelle | 3 |
| Potentiel | Potentiel global comme plafond (stat ≤ potential + 5) | 4.1 |
| Risque de blessure | Non en MVP (fatigue uniquement) | 2 |
| Sessions quotidiennes | Non, 1 session entre chaque match | 2 |
| Entraînement manuel par joueur | Via surcharges individuelles (pas de micro-management) | 3.1 |
| Repos | Focus dédié, -10 fatigue bonus, pas de progression | 3.2 |
| Progression passive | Conservée (SPEC-04 §11), l'entraînement est complémentaire | 4.3 |
| Entraînement IA | Même formules, programme basique non optimisé | 8 |
| Coût d'entraînement | Gratuit en MVP (infrastructures payantes post-MVP) | — |
| Entraînement pendant l'intersaison | Non (repos complet pendant les 5 jours) | 2 |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
