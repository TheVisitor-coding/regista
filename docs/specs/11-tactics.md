# SPEC-11 : Système Tactique (Consolidation)

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-03 (Match), SPEC-04 (Effectif)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03
> **Note** : cette spec **consolide** les mécaniques tactiques déjà définies dans SPEC-03 §9-10 et SPEC-04 §5-6, et ajoute les éléments manquants : presets, auto-ajustement et analyse pré-match.

---

## 1. Objectif

Offrir au joueur un système tactique **complet mais accessible** pour préparer ses matchs et réagir en direct. Le système doit permettre des choix stratégiques significatifs sans nécessiter les connaissances d'un vrai entraîneur de football.

**Philosophie** : "easy to use, hard to master". Choisir une formation et une mentalité suffit pour jouer. Affiner les instructions et les changements live différencie les bons managers.

---

## 2. Rappel des mécaniques existantes

### 2.1 Formations (SPEC-04 §5.2)

8 formations disponibles : **4-4-2**, **4-3-3**, **4-2-3-1**, **3-5-2**, **3-4-3**, **4-5-1**, **5-3-2**, **5-4-1**.

Chaque formation définit les 11 postes avec les positions exactes (GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, CF).

### 2.2 Composition (SPEC-04 §5)

- 11 titulaires + 7 remplaçants (18 joueurs au total)
- Compatibilité de poste en 4 niveaux (Natural 100%, Accomplished 90%, Unfamiliar 75%, Unsuited 60%)
- 7 règles bloquantes + 3 avertissements (SPEC-04 §5.3)
- AutoLineup disponible (SPEC-04 §6.2)

### 2.3 Paramètres tactiques (SPEC-03 §9)

**5 mentalités** : Ultra-defensive, Defensive, Balanced, Attacking, Ultra-attacking
Chacune modifie les probabilités d'action en match (bonus/malus offensif et défensif).

**5 instructions** avec chacune 3 niveaux :

| Instruction | Niveaux | Impact |
|---|---|---|
| Pressing | Bas / Moyen / Haut | Récupération de balle vs fatigue |
| Style de passe | Court / Mixte / Direct | Conservation vs transition rapide |
| Largeur | Étroite / Moyenne / Large | Jeu dans l'axe vs débordements |
| Tempo | Lent / Moyen / Rapide | Contrôle vs intensité |
| Ligne défensive | Basse / Moyenne / Haute | Profondeur vs pressing |

### 2.4 Changements live (SPEC-03 §10)

- Substitutions : max 5 par match
- Changements tactiques : mentalité + instructions modifiables à tout moment
- Cooldown : 5 minutes réelles entre chaque changement tactique (pas de cooldown à la mi-temps)
- Pas de changement de formation en cours de match (MVP)

### 2.5 Tireurs de CPA (SPEC-04 §7)

4 rôles configurables : penalty, coup franc, corner gauche, corner droit.
Auto-fallback si le tireur désigné n'est pas sur le terrain.

---

## 3. Nouveautés : Presets tactiques

### 3.1 Concept

Le joueur peut **sauvegarder** ses configurations tactiques sous forme de presets nommés, et les **charger** rapidement avant un match ou en live.

### 3.2 Contenu d'un preset

Un preset sauvegarde :
- Formation
- Mentalité
- 5 instructions (pressing, passes, largeur, tempo, ligne défensive)
- Tireurs de CPA

Un preset **ne sauvegarde pas** la composition (les 18 joueurs), car celle-ci dépend de la disponibilité des joueurs à chaque match.

### 3.3 Presets par défaut

À la création du club, 3 presets sont pré-configurés :

| Preset | Formation | Mentalité | Pressing | Passes | Largeur | Tempo | Ligne |
|---|---|---|---|---|---|---|---|
| **Offensif** | 4-3-3 | Attacking | Haut | Direct | Large | Rapide | Haute |
| **Équilibré** | 4-4-2 | Balanced | Moyen | Mixte | Moyenne | Moyen | Moyenne |
| **Défensif** | 5-4-1 | Defensive | Bas | Court | Étroite | Lent | Basse |

### 3.4 Gestion des presets

| Action | Détail |
|---|---|
| Sauvegarder | Nom libre (max 20 caractères), max **5 presets** par club |
| Charger | Applique la formation + instructions, la composition est recalculée via AutoLineup |
| Modifier | Modifier un preset existant |
| Supprimer | Supprimer un preset (sauf si c'est le dernier) |
| Charger en match | Charge la mentalité + instructions (pas la formation — non changeable en live) |

---

## 4. Nouveautés : Auto-ajustement

### 4.1 Concept

Quand un joueur n'est pas connecté pendant un match (jeu web — le joueur n'a pas besoin d'être là), le système peut gérer automatiquement les blessures et expulsions.

### 4.2 Toggle

Le joueur peut activer/désactiver l'auto-ajustement depuis la page tactique :

| Option | Comportement |
|---|---|
| **Auto ON** (défaut) | En cas de blessure/expulsion, le système effectue automatiquement un remplacement (meilleur joueur dispo au poste). Si plus de remplacements disponibles, l'équipe joue à N-1. |
| **Auto OFF** | Aucun remplacement automatique. Le joueur doit être connecté pour gérer manuellement. Si absent, l'équipe joue à N-1 après blessure/expulsion. |

**Recommandation** : auto ON par défaut. Seuls les joueurs qui veulent un contrôle total désactivent l'option.

### 4.3 Logique d'auto-remplacement

La logique est identique à celle de l'IA (SPEC-07 §6.4), appliquée aux clubs humains quand le manager n'est pas connecté :

```
Événement : blessure ou carton rouge
    │
    ▼
Le joueur est-il connecté et a-t-il réagi dans les 2 minutes ?
    │
    ├── OUI → le joueur gère manuellement
    │
    ├── NON et auto = ON → remplacement automatique
    │   Logique : meilleur joueur disponible au même poste sur le banc
    │   Si pas de joueur au même poste → meilleur joueur en position "accomplished"
    │   Si aucun remplaçant compatible → pas de remplacement
    │
    └── NON et auto = OFF → pas de remplacement, joue à N-1
```

---

## 5. Nouveautés : Analyse pré-match

### 5.1 Concept

Avant chaque match officiel, le joueur peut consulter un **résumé de l'adversaire** pour préparer sa tactique.

### 5.2 Données affichées

```
┌──────────────────────────────────────────────────────────────┐
│  ANALYSE ADVERSAIRE — FC Rival                                 │
│  (par votre adjoint J. Durand)                                 │
│                                                                │
│  ── DERNIÈRE FORMATION ───────────────────────────────────    │
│  4-3-3 (utilisée 3 des 5 derniers matchs)                      │
│                                                                │
│  ── DERNIÈRE MENTALITÉ ───────────────────────────────────    │
│  Balanced                                                      │
│                                                                │
│  ── FORME RÉCENTE ────────────────────────────────────────    │
│  5 derniers matchs : V V D N V (10 pts / 15)                   │
│  Buts marqués : 8 │ Buts encaissés : 5                         │
│                                                                │
│  ── FORCES & FAIBLESSES ──────────────────────────────────    │
│  💪 Attaque solide (moy. 72 OVR en attaque)                   │
│  💪 Milieu technique (moy. 70 OVR au milieu)                  │
│  ⚠️ Défense fragile (moy. 63 OVR en défense)                 │
│                                                                │
│  ── SUGGESTION ───────────────────────────────────────────    │
│  "Leur défense est leur point faible. Un pressing haut         │
│   et un jeu direct pourraient exploiter leurs lacunes          │
│   sur les côtés."                                              │
│                                                                │
│  [Appliquer preset Offensif →]                                 │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Données récupérées

| Donnée | Source |
|---|---|
| Dernière formation utilisée | `club_tactics` de l'adversaire |
| Dernière mentalité | `club_tactics` de l'adversaire |
| 5 derniers résultats | `matches` filtrés |
| Buts marqués/encaissés (5 derniers matchs) | `matches` agrégés |
| Moyenne overall par ligne | `players` + `player_stats` du club adverse |

### 5.4 Suggestion tactique

Le système génère une suggestion simple basée sur des règles :

```
SI adversaire.defenseAvgOverall < adversaire.attackAvgOverall - 10 :
    suggestion = "Leur défense est leur point faible. Privilégiez l'attaque."

SI adversaire.lastMentality = "Defensive" :
    suggestion = "Ils jouent défensif. Patience et possession."

SI adversaire.recentForm < 5 pts / 15 :
    suggestion = "Ils sont en méforme. Profitez-en avec un pressing haut."

SINON :
    suggestion = "Adversaire équilibré. Jouez votre jeu."
```

La suggestion est affichée comme un message de l'adjoint (immersion staff).

### 5.5 Disponibilité

| Quand | Accès |
|---|---|
| T-24h avant le match | Notification d'analyse (Adjoint) avec lien vers la page |
| Page pré-match | Toujours accessible pour le prochain match |
| Page match en cours | Accessible en parallèle pendant le match |

---

## 6. Interface tactique complète (`/tactics`)

### 6.1 Page tactique (pré-match)

```
┌──────────────────────────────────────────────────────────────┐
│  TACTIQUE                    [Preset: Équilibré ▼] [Sauver]   │
│                                                                │
│  ── FORMATION ────────────────────────────────────────────    │
│  [4-4-2 ▼]                                                     │
│                                                                │
│  ┌────────────────────────────────────────┐                   │
│  │            ST          ST              │                   │
│  │                                        │                   │
│  │   LW                         RW        │ ← Terrain         │
│  │                                        │    (drag & drop)  │
│  │            CM          CM              │                   │
│  │                                        │                   │
│  │   LB      CB          CB      RB      │                   │
│  │                                        │                   │
│  │                GK                      │                   │
│  └────────────────────────────────────────┘                   │
│                                                                │
│  BANC : [GK] [CB] [CM] [CAM] [LW] [ST] [CF]                  │
│                                                                │
│  ── MENTALITÉ ────────────────────────────────────────────    │
│  [Ultra-def] [Défensif] [●Équilibré] [Offensif] [Ultra-off]  │
│                                                                │
│  ── INSTRUCTIONS ─────────────────────────────────────────    │
│  Pressing       [Bas] [●Moyen] [Haut]                         │
│  Style passe    [Court] [●Mixte] [Direct]                      │
│  Largeur        [Étroite] [●Moyenne] [Large]                   │
│  Tempo          [Lent] [●Moyen] [Rapide]                       │
│  Ligne déf.     [Basse] [●Moyenne] [Haute]                     │
│                                                                │
│  ── COUPS DE PIED ARRÊTÉS ───────────────────────────────    │
│  Penalty : R. Santos (ST)                      [Modifier ▼]   │
│  Coup franc : M. Eriksen (CM)                  [Modifier ▼]   │
│  Corner G : M. Eriksen (CM)                    [Modifier ▼]   │
│  Corner D : A. Silva (RW)                      [Modifier ▼]   │
│                                                                │
│  ── OPTIONS ──────────────────────────────────────────────    │
│  Auto-ajustement : [● ON] [OFF]                                │
│                                                                │
│  ── ANALYSE ADVERSAIRE ───────────────────────────────────    │
│  Prochain match : vs FC Rival (dom.) dans 18h                  │
│  [Voir l'analyse →]                                            │
│                                                                │
│  Cohérence : ████████░░ 80%                                    │
│  ⚠️ M. Silva (LB) est fatigué (fatigue 78%)                   │
│                                                                │
│  [──── Valider la composition ────]                            │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Indicateur de cohérence

Un score de cohérence (0-100%) est affiché pour aider le joueur :

```
cohérence = moyenne_pondérée(
  compatibilité_postes × 40%,    // tous les joueurs à leur poste naturel ?
  fatigue_moyenne × 30%,          // joueurs en forme ?
  diversité_banc × 15%,           // banc couvre tous les postes ?
  warnings × 15%                  // pas d'avertissements ?
)
```

Couleurs : 🟢 > 70%, 🟡 40-70%, 🔴 < 40%.

### 6.3 Drag & drop

L'interface terrain permet le **glisser-déposer** de joueurs :
- Du banc vers un poste du terrain (titulariser)
- D'un poste à un autre (échanger)
- Du terrain vers le banc (mettre sur le banc)
- Indicateur visuel de compatibilité au survol (vert = naturel, jaune = accompli, rouge = inadapté)

### 6.4 Panel match en cours

Pendant un match live, le panneau tactique est simplifié (SPEC-03 §10) :

```
┌──────────────────────────────────────────────────────────────┐
│  TACTIQUE EN DIRECT                    72' │ Mon Club 1-1     │
│                                                                │
│  ── MENTALITÉ ────────────────────────────────────────────    │
│  [Ultra-def] [Défensif] [●Équilibré] [Offensif] [Ultra-off]  │
│                                                                │
│  ── INSTRUCTIONS ─────────────────────────────────────────    │
│  (mêmes sliders que pré-match)                                 │
│                                                                │
│  ── SUBSTITUTIONS (2/5 utilisées) ────────────────────────    │
│  [Faire un remplacement]                                       │
│                                                                │
│  Joueurs fatigués :                                            │
│  🟡 A. Dupont (CB) 78%  │  🟡 R. Santos (ST) 72%             │
│                                                                │
│  ⏱️ Prochain changement possible dans 2:34                    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Modèle de données

### 7.1 Table `tactical_presets`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | |
| `name` | `varchar(20)` | Nom du preset |
| `formation` | `varchar(10)` | Ex: `4-4-2` |
| `mentality` | `enum` | `ultra_defensive`, `defensive`, `balanced`, `attacking`, `ultra_attacking` |
| `pressing` | `enum` | `low`, `medium`, `high` |
| `passing_style` | `enum` | `short`, `mixed`, `direct` |
| `width` | `enum` | `narrow`, `medium`, `wide` |
| `tempo` | `enum` | `slow`, `medium`, `fast` |
| `defensive_line` | `enum` | `low`, `medium`, `high` |
| `is_default` | `boolean` | Preset pré-généré (non supprimable) |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

**Index** :
- `INDEX` sur `club_id` (max 5 presets par club)

### 7.2 Modification sur la table `clubs`

| Colonne ajoutée | Type | Description |
|---|---|---|
| `auto_adjustment` | `boolean` | Auto-ajustement en match (défaut: `true`) |

---

## 8. API Endpoints (nouveaux)

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/tactics/presets` | Liste des presets tactiques | Oui |
| `POST` | `/tactics/presets` | Créer un preset | Oui |
| `PUT` | `/tactics/presets/:id` | Modifier un preset | Oui |
| `DELETE` | `/tactics/presets/:id` | Supprimer un preset | Oui |
| `POST` | `/tactics/presets/:id/apply` | Appliquer un preset (charge formation + instructions) | Oui |
| `GET` | `/tactics/analysis/:matchId` | Analyse pré-match de l'adversaire | Oui |
| `PATCH` | `/tactics/auto-adjustment` | Toggle auto-ajustement (on/off) | Oui |

### 8.1 `GET /tactics/analysis/:matchId`

**Response `200`** :
```json
{
  "opponent": {
    "id": "uuid",
    "name": "FC Rival",
    "lastFormation": "4-3-3",
    "lastMentality": "balanced",
    "recentForm": ["W", "W", "L", "D", "W"],
    "recentGoalsScored": 8,
    "recentGoalsConceded": 5,
    "lineOveralls": {
      "defense": 63,
      "midfield": 70,
      "attack": 72
    }
  },
  "suggestion": {
    "text": "Leur défense est leur point faible. Un pressing haut et un jeu direct pourraient exploiter leurs lacunes.",
    "staff": "assistant",
    "suggestedPreset": "offensive"
  }
}
```

---

## 9. User Stories (nouvelles uniquement)

### Presets

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TAC-01 | Joueur | Sauvegarder ma configuration tactique comme preset | La réutiliser rapidement | Preset sauvegardé avec nom, max 5 |
| TAC-02 | Joueur | Charger un preset en un clic | Préparer un match rapidement | Formation + instructions appliquées, AutoLineup recalculé |
| TAC-03 | Joueur | Charger un preset pendant un match | Adapter ma tactique rapidement en live | Mentalité + instructions appliquées (pas la formation) |
| TAC-04 | Joueur | Avoir 3 presets par défaut | Commencer sans configuration | Offensif, Équilibré, Défensif pré-configurés |

### Auto-ajustement

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TAC-05 | Joueur | Activer/désactiver l'auto-ajustement | Contrôler la gestion des incidents en match | Toggle ON/OFF, persisté, défaut ON |
| TAC-06 | Joueur | Que le système remplace automatiquement un joueur blessé si je ne suis pas connecté | Ne pas jouer à 10 sans raison | Remplacement auto dans les 2 min si non connecté |

### Analyse pré-match

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TAC-07 | Joueur | Voir la dernière formation et mentalité de mon adversaire | Adapter ma tactique | Données issues du dernier match de l'adversaire |
| TAC-08 | Joueur | Voir les forces et faiblesses de l'adversaire | Identifier les opportunités | Overall moyen par ligne affiché |
| TAC-09 | Joueur | Recevoir une suggestion tactique de mon adjoint | Être guidé si je ne sais pas quoi choisir | Suggestion textuelle + lien vers preset |

### Interface

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TAC-10 | Joueur | Placer mes joueurs via drag & drop sur le terrain | Configurer ma composition intuitivement | Glisser-déposer fonctionnel, indicateur de compatibilité |
| TAC-11 | Joueur | Voir un score de cohérence de ma composition | Évaluer la qualité de mon choix | Score 0-100% avec couleur et détail des warnings |

---

## 10. Stratégie de tests

### Tests unitaires

- **Presets** : création, modification, suppression, limite de 5, protection des presets par défaut
- **Auto-ajustement** : logique de remplacement (meilleur joueur au poste, délai 2 min)
- **Analyse pré-match** : calcul des moyennes par ligne, sélection de la suggestion
- **Cohérence** : calcul du score avec différentes configurations (postes naturels vs inadaptés)

### Tests d'intégration

- **Preset → Match** : charger un preset → vérifier que la formation et les instructions sont appliquées → match joue correctement
- **Auto-ajustement en match** : blessure à la 30e min, joueur non connecté, auto ON → remplacement automatique vérifié
- **Analyse** : données adversaires correctes, suggestion cohérente

---

## 11. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Changement de formation en match | Non en MVP (mentalité + instructions uniquement) | 2.4 |
| Instructions individuelles par joueur | Post-MVP (programme trop complexe) | — |
| Presets tactiques | 5 max, 3 par défaut, rechargeable en match (sans formation) | 3 |
| Auto-ajustement | ON par défaut, toggle dans les réglages tactiques | 4 |
| Analyse pré-match | Données factuelles + suggestion textuelle de l'adjoint | 5 |
| Heatmap / zones d'influence | Post-MVP | — |
| Contre-tactique automatique | Post-MVP (via SPEC-07 IA) | — |
| Drag & drop | Oui, avec indicateurs de compatibilité | 6.3 |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
