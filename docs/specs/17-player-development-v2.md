# SPEC-17 : Player Development & Comparison v2

> **Statut** : Draft
> **Lot** : 2 (Post-MVP)
> **Dépendances** : SPEC-04 (Effectif), SPEC-12 (Progression)
> **Réf. implémentation** : Implements SPEC-04 §8 (fiche joueur), §9 (comparaison), §12 (renouvellement contrat)
> **Dernière mise à jour** : 2026-04-03

---

## 1. Objectif

Transformer la fiche joueur d'une liste de stat bars en une **vue complète et engageante** qui donne au manager toutes les informations pour prendre des décisions stratégiques : progression, forme, polyvalence, valeur marchande, contrat. Ajouter la comparaison de joueurs et le renouvellement de contrat.

**État actuel** : Stat bars (4 catégories), info basique (âge, nationalité, poste, OVR, potential), condition (fatigue, blessure).

**État cible** : Radar chart, historique de progression, performances récentes, polyvalence visuelle, actions (renouveler, vendre, libérer), comparaison side-by-side.

---

## 2. Fiche Joueur Refonte

### 2.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│  ← Retour                                                │
│                                                          │
│  [Avatar]  NOM PRÉNOM                                    │
│            Position · Nationalité · Age ans               │
│            OVR [72] → Potential [85]                      │
│            Valeur marchande: 1.2M G$ (↗ +15%)            │
│                                                          │
│  [📊 Comparer]  [📝 Renouveler]  [💰 Vendre]  [🚪 Libérer] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌──────────────────────────────┐      │
│  │ RADAR CHART │  │ CONDITION                     │      │
│  │ (araignée)  │  │ Fatigue: ████░░░░░░ 42%      │      │
│  │ 4 catégories│  │ Forme:   ████████░░ 82%      │      │
│  │             │  │ Statut: 🟢 Disponible         │      │
│  └─────────────┘  └──────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ POLYVALENCE                                       │    │
│  │ [Mini-terrain avec positions colorées]            │    │
│  │ 🟢 ST (naturel) 🟡 CF (accompli)                │    │
│  │ 🟠 RW (dépaysé) 🔴 CM (inadapté)               │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ PROGRESSION (graphe d'évolution OVR)              │    │
│  │ 72 ─────────╱─────────                            │    │
│  │ 70 ────╱────                                      │    │
│  │ 68 ──╱─                        Tendance: ↗ +0.4  │    │
│  │    Match 1  5  10  15  20                         │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ PERFORMANCES RÉCENTES (5 derniers matchs)         │    │
│  │ J24 vs FC Rival    │ 90' │ ⚽1 │ 🅰️0 │ ⭐7.8   │    │
│  │ J23 vs AS Monaco   │ 78' │ ⚽0 │ 🅰️1 │ ⭐6.5   │    │
│  │ J22 vs SC Berlin   │ 90' │ ⚽2 │ 🅰️0 │ ⭐8.9   │    │
│  │ ...                                               │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ CONTRAT                                           │    │
│  │ Durée: 15 matchs restants (~45 jours)            │    │
│  │ Salaire: 32,000 G$/semaine                       │    │
│  │ Clause libératoire: 1,800,000 G$                 │    │
│  │ [📝 Renouveler le contrat]                        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ STATISTIQUES DÉTAILLÉES                           │    │
│  │ [Onglets: Physique | Technique | Mental | Défense]│    │
│  │ pace:     ████████░░ 72                           │    │
│  │ stamina:  ██████░░░░ 58                           │    │
│  │ ...                                               │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Radar Chart

Graphe en araignée avec 4 axes représentant les moyennes par catégorie :

| Axe | Stats composantes |
|---|---|
| Physique | pace, stamina, strength, agility |
| Technique | passing, shooting, dribbling, crossing, heading |
| Mental | vision, composure, workRate, positioning |
| Défense | tackling, marking |

Pour les GK, 3 axes : Réflexes (reflexes, diving), Distribution (kicking, communication), Placement (handling, positioning).

**Visuel** : Polygone rempli semi-transparent aux couleurs du club, grille en arrière-plan.

### 2.3 Polyvalence

Mini-terrain (même composant que le terrain tactique, version compacte) avec les 11 positions coloriées selon la compatibilité du joueur :

- 🟢 Naturel (100%) — position principale
- 🟡 Accompli (90%) — positions secondaires
- 🟠 Dépaysé (75%) — même ligne
- 🔴 Inadapté (60%) — ligne différente
- ⚫ Interdit (0%) — GK ↔ joueur de champ

### 2.4 Historique de progression

Line chart montrant l'évolution de l'overall sur les 20 derniers matchs joués.

- Axe X : numéro de match (1 → 20)
- Axe Y : overall (min: OVR - 5, max: potential + 5)
- Ligne pointillée : potential
- Flèche tendance : ↗ +X.X si progression, ↘ -X.X si régression, → stable

### 2.5 Performances récentes

Tableau des 5 derniers matchs joués par ce joueur :

| Journée | Adversaire | Min | ⚽ | 🅰️ | Note |
|---|---|---|---|---|---|
| J24 | FC Rival | 90' | 1 | 0 | ⭐ 7.8 |

Note colorée : 🔴 <5.0, 🟠 5.0-5.9, 🟡 6.0-6.9, 🟢 7.0-7.9, 💚 8.0+

---

## 3. Comparaison de joueurs

### 3.1 Accès

Bouton "📊 Comparer" sur la fiche joueur → ouvre un panel de sélection du second joueur.

### 3.2 Interface

```
┌──────────────────────┬──────────────────────┐
│  R. Santos (ST, 72)  │  M. Eriksen (CF, 68) │
├──────────────────────┼──────────────────────┤
│  Age: 24             │  Age: 21             │
│  Potential: 85       │  Potential: 82       │
│  Fatigue: 35%        │  Fatigue: 20%        │
│  Salaire: 32K/sem    │  Salaire: 28K/sem    │
│  Contrat: 15 matchs  │  Contrat: 30 matchs  │
├──────────────────────┼──────────────────────┤
│  PHYSIQUE            │                      │
│  pace:     72 ████░  │  ░███ 65             │
│  stamina:  58 ███░░  │  ░████ 70            │
│  strength: 68 ████░  │  ░██ 52              │
│  ...                 │  ...                 │
├──────────────────────┼──────────────────────┤
│  [Radar superposé]                          │
│  (2 polygones sur le même graphe)           │
└─────────────────────────────────────────────┘
```

Couleurs : vert pour le meilleur, rouge pour l'inférieur, gris si égal.

### 3.3 Route

`/squad/compare?player1=uuid&player2=uuid`

### 3.4 Endpoint

```
GET /squad/compare?players=uuid1,uuid2
Response: {
  players: [
    { ...fullPlayerData, stats, goalkeeperStats, recentPerformances },
    { ...fullPlayerData, stats, goalkeeperStats, recentPerformances }
  ]
}
```

---

## 4. Renouvellement de contrat

### 4.1 Accès

Bouton "📝 Renouveler" sur la fiche joueur. Grisé si `contractMatchesRemaining === 0` (déjà agent libre).

### 4.2 Modal de renouvellement

```
┌────────────────────────────────────────┐
│  Renouveler le contrat de R. Santos    │
│                                        │
│  Contrat actuel:                       │
│  • Durée restante: 15 matchs          │
│  • Salaire: 32,000 G$/semaine         │
│                                        │
│  Nouveau contrat:                      │
│  • Extension: +20 matchs              │
│  • Nouveau salaire: 36,000 G$/semaine │
│  • Prime de signature: 720,000 G$     │
│    (OVR 72 × 10,000)                  │
│                                        │
│  Balance après: 4,280,000 G$          │
│                                        │
│  [Annuler]  [Renouveler]              │
└────────────────────────────────────────┘
```

### 4.3 Formules

| Paramètre | Formule |
|---|---|
| Extension | +20 matchs (fixe MVP) |
| Nouveau salaire | `overall × 500 + random(0, 2000)` (recalculé) |
| Prime de signature | `overall × 10,000` G$ (en centimes) |
| Clause libératoire | Recalculée : `market_value × 2.0` |

### 4.4 Validations

- Balance suffisante pour la prime de signature
- `contractMatchesRemaining > 0` (pas déjà agent libre)
- Joueur appartient au club

### 4.5 Endpoint

```
POST /squad/:playerId/extend-contract
Response: {
  player: { contractMatchesRemaining, weeklySalary, releaseClause },
  signingBonus: 720000,
  club: { balanceAfter }
}
```

---

## 5. Historique de performances (endpoint)

### 5.1 Données

Récupère les N dernières performances du joueur depuis `match_player_stats` + `matches`.

### 5.2 Endpoint

```
GET /squad/:playerId/history?limit=20
Response: {
  performances: [
    {
      matchId: "uuid",
      matchday: 24,
      opponent: { name: "FC Rival", logoId: "..." },
      minutesPlayed: 90,
      goals: 1,
      assists: 0,
      rating: 7.8,
      date: "2026-04-01T21:00:00Z"
    },
    ...
  ],
  overallHistory: [
    { matchday: 20, overall: 70 },
    { matchday: 21, overall: 70 },
    { matchday: 22, overall: 71 },
    ...
  ]
}
```

---

## 6. Valeur marchande

### 6.1 Affichage

Sur la fiche joueur, en-dessous du potential :
```
Valeur marchande: 1,200,000 G$ (↗ +15% ce mois)
```

### 6.2 Calcul

Réutilise `ValuationService.calculateMarketValue()` déjà implémenté (SPEC-06 §12).

### 6.3 Tendance

Comparer la valeur actuelle avec celle d'il y a 10 matchs :
- ↗ si augmentation > 5%
- → si variation < 5%
- ↘ si diminution > 5%

---

## 7. Data Model

### 7.1 Table `player_overall_history`

| Colonne | Type | Description |
|---|---|---|
| id | uuid PK | |
| player_id | uuid FK | |
| matchday | integer | Numéro de journée |
| season_id | uuid FK | |
| overall | integer | Overall à ce moment |
| created_at | timestamp | |

Index: `(player_id, season_id, matchday)` unique

**Remplissage** : Ajouté dans le pipeline post-match (après la progression).

### 7.2 Pas de nouvelle table pour les performances

Les performances sont déjà dans `match_player_stats` — il suffit de joindre avec `matches` pour les données de contexte.

---

## 8. API Endpoints (nouveaux)

| Méthode | Route | Description |
|---|---|---|
| GET | `/squad/:playerId/history` | Historique performances + évolution overall |
| GET | `/squad/compare` | Comparaison 2 joueurs (query: `players=id1,id2`) |
| POST | `/squad/:playerId/extend-contract` | Renouveler contrat |
| GET | `/squad/:playerId/valuation` | Valeur marchande + tendance |

---

## 9. User Stories

| ID | Story |
|---|---|
| PLR-01 | Je vois un radar chart des stats de mon joueur |
| PLR-02 | Je vois la polyvalence de mon joueur sur un mini-terrain |
| PLR-03 | Je vois l'historique de progression (graphe overall) |
| PLR-04 | Je vois les 5 dernières performances (note, buts, assists) |
| PLR-05 | Je peux comparer 2 joueurs côte à côte |
| PLR-06 | Je peux renouveler le contrat d'un joueur |
| PLR-07 | Je vois la valeur marchande et sa tendance |
| PLR-08 | Je peux vendre ou libérer un joueur depuis sa fiche |

---

## 10. Décisions de design

| Question | Décision | Raison |
|---|---|---|
| Chart library ? | **Recharts** | React-natif, léger, bon pour radar + line charts |
| Avatar joueur ? | **Silhouette SVG générée** (par position) | Pas de photos réalistes nécessaires, silhouettes distinctives |
| Comparaison max joueurs ? | **2** | Side-by-side simple et clair |
| Historique max matchs ? | **20** | Une saison complète de données |
| Extension contrat fixe ? | **+20 matchs** | Simple pour le MVP, variable post-MVP |
