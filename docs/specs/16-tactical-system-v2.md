# SPEC-16 : Tactical System v2 — Lineup Editor & Presets

> **Statut** : Draft
> **Lot** : 2 (Post-MVP)
> **Dépendances** : SPEC-03 (Match), SPEC-04 (Effectif), SPEC-11 (Tactiques)
> **Réf. implémentation** : Implements SPEC-11 §3-5, SPEC-04 §5-7
> **Dernière mise à jour** : 2026-04-03
> **Note** : Cette spec **implémente** les fonctionnalités définies dans SPEC-11 (presets, auto-ajustement, analyse pré-match) et SPEC-04 (composition, drag&drop, set-pieces) qui sont absentes du MVP actuel. Elle ajoute également les spécifications UI/UX détaillées.

---

## 1. Objectif

Transformer la page tactique d'un panneau de boutons en une **interface de composition immersive** avec un terrain 2D interactif, la gestion des presets, l'analyse adversaire, et le score de cohésion. Le joueur doit pouvoir préparer ses matchs visuellement et stratégiquement.

**État actuel** : Formation selector (boutons texte) + 6 paramètres tactiques (boutons radio). Pas de terrain, pas de joueurs, pas de presets.

**État cible** : Terrain 2D avec drag & drop, banc, presets sauvegardables, analyse pré-match, auto-lineup, score de cohésion.

---

## 2. Interface — Page `/tactics`

### 2.1 Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER : Preset selector [Offensif ▼] [💾 Save] [📋 Load] │
│  Auto-adjustment: [ON/OFF toggle]  Cohésion: [██████ 78%]   │
├────────────────────────────────┬─────────────────────────────┤
│                                │                             │
│      ⚽ TERRAIN 2D             │    PARAMÈTRES TACTIQUES     │
│      (Formation + 11 joueurs)  │                             │
│                                │    Formation: [4-4-2 ▼]    │
│      [Joueur]   [Joueur]       │    Mentalité: [●●●○○]      │
│         [Joueur]               │    Pressing:  [bas|moy|haut]│
│      [Joueur][Joueur]          │    Passes:    [court|mix|dir]│
│   [Joueur]         [Joueur]    │    Largeur:   [étr|moy|lrg]│
│      [Joueur][Joueur]          │    Tempo:     [lent|moy|rap]│
│         [Joueur]               │    Ligne déf: [bas|moy|haut]│
│            [GK]                │                             │
│                                │    TIREURS CPA             │
├────────────────────────────────┤    Penalty: [Joueur ▼]     │
│  BANC (7 remplaçants)          │    Coup franc: [Joueur ▼]  │
│  [J1] [J2] [J3] [J4] [J5]... │    Corner G: [Joueur ▼]    │
├────────────────────────────────┤    Corner D: [Joueur ▼]    │
│  NON CONVOQUÉS                 │                             │
│  🔴 Blessé  🟡 Suspendu       │    Capitaine: [Joueur ▼]   │
│  ⚪ Disponible (non sélect.)   │                             │
│                                │    [🤖 Auto-Lineup]        │
└────────────────────────────────┴─────────────────────────────┘
```

### 2.2 Layout (Mobile)

En mobile, le layout passe en vertical :
1. **Onglet "Compo"** : Terrain + banc + non-convoqués
2. **Onglet "Tactique"** : Formation + mentalité + instructions + CPA

Les onglets sont accessibles via des tabs en haut de la page.

### 2.3 Terrain 2D

Le terrain est un composant SVG ou Canvas représentant un terrain de football vu de dessus (orientation verticale, mon but en bas).

**Éléments visuels :**
- Fond : dégradé vert foncé avec lignes blanches (surface de réparation, rond central, lignes)
- Joueurs : cercles positionnés selon la formation, contenant le numéro/nom court
- Couleur du cercle : couleur primaire du club
- Badge d'état sous le cercle : vert (ok), jaune (fatigué >70%), orange (fatigué >80%)

**Positions par formation :**
```
4-4-2:
  Row 5 (att):   ST ────── ST
  Row 4 (mil):   LM ── CM ── CM ── RM
  Row 3 (def):   LB ── CB ── CB ── RB
  Row 1 (gk):    GK

4-3-3:
  Row 5 (att):   LW ──── ST ──── RW
  Row 4 (mil):   ── CDM ── CM ── CM ──
  Row 3 (def):   LB ── CB ── CB ── RB
  Row 1 (gk):    GK
```

Chaque formation a une grille de positions prédéfinies (coordonnées x,y relatives sur le terrain).

### 2.4 Slots joueur sur le terrain

Chaque slot affiche :
```
┌─────────────┐
│  [Cercle]   │  ← Couleur club, initiale position (CB, ST...)
│  Nom court  │  ← "R. Santos"
│  OVR  ⚡FAT │  ← "72  ⚡15%"
│  [compat]   │  ← 🟢 natural / 🟡 accomplished / 🟠 unfamiliar
└─────────────┘
```

**Slot vide** (position non assignée) : cercle pointillé avec "+" et le nom de la position.

### 2.5 Interactions Drag & Drop

| Action | Geste | Résultat |
|---|---|---|
| Assigner joueur | Drag du banc → slot terrain | Joueur prend la position |
| Échanger joueurs | Drag slot terrain → autre slot terrain | Les 2 joueurs échangent |
| Retirer joueur | Drag slot terrain → banc | Joueur retourne au banc |
| Clic sur slot | Ouvre une dropdown des joueurs compatibles | Sélection rapide |

**Feedback visuel pendant le drag :**
- Zone d'atterrissage compatible : bordure verte + glow
- Zone incompatible (GK ↔ joueur de champ) : bordure rouge
- Indicateur de compatibilité sur la zone cible (🟢/🟡/🟠/🔴)

**Alternative clic** (pour mobile ou accessibilité) :
- Cliquer sur un slot vide → dropdown triée par compatibilité
- Cliquer sur un joueur assigné → options : "Échanger", "Retirer", "Détails"

### 2.6 Banc des remplaçants

Bande horizontale sous le terrain avec 7 slots :
- Chaque slot montre : nom, position, OVR, fatigue
- Slot 1 : toujours un GK (recommandé, pas forcé)
- Drag depuis le banc vers le terrain pour assigner
- Badges d'état identiques au terrain

### 2.7 Non-convoqués

Liste scrollable sous le banc :
- Joueurs non sélectionnés dans les 18
- Groupés par statut : 🔴 Blessés | 🟡 Suspendus | ⚪ Disponibles
- Drag vers le banc ou le terrain pour convoquer

---

## 3. Presets Tactiques

### 3.1 Selector de preset (header)

Dropdown en haut de la page :
```
[Offensif ▼]  [💾 Sauvegarder]  [📋 Nouveau]
```

- Le preset actif est affiché
- "Sauvegarder" écrase le preset actuel avec la config courante
- "Nouveau" ouvre un dialog pour nommer le nouveau preset

### 3.2 Dialog de sauvegarde

```
┌─────────────────────────────┐
│  Sauvegarder le preset      │
│                              │
│  Nom: [________________]    │
│  (max 20 caractères)        │
│                              │
│  Contenu sauvegardé :       │
│  • Formation: 4-3-3         │
│  • Mentalité: Offensive     │
│  • Pressing: Haut           │
│  • Passes: Direct           │
│  • ...                      │
│                              │
│  [Annuler]  [Sauvegarder]   │
└─────────────────────────────┘
```

### 3.3 Gestion des presets

| Action | Détail |
|---|---|
| Charger | Applique formation + instructions. AutoLineup recalcule la compo |
| Sauvegarder | Sauvegarde config courante sous le nom du preset actif |
| Créer | Nouveau preset avec nom libre (max 5, 3 par défaut non supprimables) |
| Supprimer | Supprime un preset custom (les 3 défauts sont protégés) |
| Charger en match | Charge mentalité + instructions seulement (formation non modifiable en match) |

### 3.4 Données du preset

```typescript
interface TacticalPreset {
  id: string
  clubId: string
  name: string
  formation: string
  mentality: Mentality
  pressing: 'low' | 'medium' | 'high'
  passingStyle: 'short' | 'mixed' | 'long'
  width: 'narrow' | 'normal' | 'wide'
  tempo: 'slow' | 'normal' | 'fast'
  defensiveLine: 'low' | 'medium' | 'high'
  isDefault: boolean
  createdAt: string
  updatedAt: string
}
```

---

## 4. Auto-Lineup

### 4.1 Bouton

Bouton "🤖 Auto-Lineup" dans le panneau de droite ou sous le terrain.

### 4.2 Comportement

Au clic :
1. Prend la formation actuelle
2. Exécute l'algorithme AutoLineup (SPEC-04 §6.2) côté serveur
3. Met à jour le terrain avec les 11 meilleurs joueurs + 7 meilleurs remplaçants
4. Animation : joueurs "glissent" vers leurs positions

### 4.3 Endpoint

```
POST /tactics/auto-lineup
Body: { formation: "4-4-2" }
Response: {
  startingXI: [{ playerId, position, playerName, overall, fatigue, compatibility }],
  bench: [{ playerId, position, playerName, overall, fatigue }],
  coherence: 82
}
```

---

## 5. Score de Cohésion

### 5.1 Affichage

Barre de progression dans le header de la page :
```
Cohésion: [████████░░] 78%  🟡
```

Couleurs : 🟢 >70%, 🟡 40-70%, 🔴 <40%

### 5.2 Calcul

```
coherence = (
  position_compatibility_avg × 0.40 +
  (100 - fatigue_avg) × 0.30 +
  bench_diversity_score × 0.15 +
  (100 - warnings_penalty) × 0.15
)
```

**position_compatibility_avg** : Moyenne des scores de compatibilité des 11 titulaires (0-100)
**fatigue_avg** : Fatigue moyenne des titulaires
**bench_diversity_score** : 100 si ≥1 GK + ≥1 DEF + ≥1 MID + ≥1 ATT sur le banc, sinon proportionnel
**warnings_penalty** : 10 par warning (pas de GK remplaçant, joueur fatigué >80%, joueur hors position)

### 5.3 Détail au survol

Au survol de la barre, tooltip avec le détail :
```
Compatibilité positions: 85%
Fraîcheur physique: 78%
Diversité banc: 100%
Avertissements: 0 (-0%)
```

---

## 6. Analyse Pré-Match

### 6.1 Accès

- Panneau latéral ou modal accessible depuis le bouton "📊 Analyser adversaire"
- Disponible à partir de T-24h avant le match

### 6.2 Contenu

```
┌──────────────────────────────────────┐
│  📊 ANALYSE : FC Rival              │
│                                      │
│  Dernière formation : 4-3-3         │
│  Dernière mentalité : Offensive     │
│                                      │
│  Forme récente : 🟢🟢🔴⚪🟢 (10/15 pts) │
│  Buts marqués (5 matchs): 8        │
│  Buts encaissés (5 matchs): 5      │
│                                      │
│  Force par ligne :                   │
│  DEF: ████████░░ 63                  │
│  MIL: █████████░ 70                  │
│  ATT: █████████░ 72                  │
│                                      │
│  💡 SUGGESTION (Adjoint)             │
│  "Leur défense est leur point faible │
│   (63 vs 72 en attaque). Privilégiez│
│   un jeu offensif avec pressing haut"│
│                                      │
│  [Appliquer preset "Offensif"]       │
└──────────────────────────────────────┘
```

### 6.3 Logique de suggestion

```
IF opponent.defense_avg < opponent.attack_avg - 10:
  "Leur défense est faible ({def}). Attaquez avec insistance."
  → Suggère preset "Offensif"

ELIF opponent.recent_form_points < 5 (sur 15):
  "Adversaire en méforme ({form}). Pressing haut pour profiter."
  → Suggère preset "Offensif"

ELIF opponent.last_mentality IN ['defensive', 'ultra_defensive']:
  "Ils jouent défensif. Patience et possession."
  → Suggère preset "Équilibré"

ELIF opponent.attack_avg > opponent.defense_avg + 10:
  "Attaque dangereuse ({att}). Solidité défensive recommandée."
  → Suggère preset "Défensif"

ELSE:
  "Adversaire équilibré. Jouez votre jeu."
  → Suggère preset "Équilibré"
```

---

## 7. Tireurs de CPA (Coups de Pied Arrêtés)

### 7.1 Interface

4 dropdowns dans le panneau de droite :

```
TIREURS CPA
  Penalty:      [R. Santos (85) ▼]
  Coup franc:   [L. Martin (72) ▼]
  Corner gauche:[M. Silva (68) ▼]
  Corner droit: [A. Chen (70) ▼]
```

Chaque dropdown liste les titulaires actuels triés par la stat pertinente :
- Penalty → stat `penalties`
- Coup franc → stat `freeKick`
- Corner gauche/droit → stat `crossing`

### 7.2 Auto-attribution

Si aucun tireur n'est défini ou si le tireur est retiré du terrain, auto-attribution au meilleur joueur sur le terrain pour la stat concernée.

---

## 8. Capitaine

### 8.1 Sélection

Dropdown "Capitaine" dans le panneau de droite. Liste les titulaires actuels.

### 8.2 Badge

Sur le terrain, le capitaine a un badge "C" jaune sur son cercle.

### 8.3 Persistance

Le capitaine est indépendant de la formation. Si le capitaine est retiré du terrain, auto-succession au joueur avec le plus de matchs joués.

---

## 9. Auto-Ajustement

### 9.1 Toggle

Switch ON/OFF en haut de la page, à côté du preset selector.

```
Auto-ajustement : [ON ●──]
```

### 9.2 Comportement

- **ON** (défaut) : En match, si blessure ou expulsion et que le joueur n'est pas connecté, le système fait un remplacement automatique dans les 2 minutes.
- **OFF** : Aucun remplacement automatique. L'équipe joue à N-1 si le manager n'est pas connecté.

---

## 10. Composition en match (panneau simplifié)

Quand un match est en cours, la page `/tactics` affiche un panneau simplifié :

```
┌──────────────────────────────────────────┐
│  ⚽ MATCH EN COURS — Min 67'            │
│                                          │
│  Mentalité: [○○●○○] Balanced            │
│  Instructions: [boutons 5 × 3 niveaux]  │
│                                          │
│  Remplacements: 2/5 utilisés            │
│  [Joueur fatigué 1] ⚡87% → [Remplacer] │
│  [Joueur fatigué 2] ⚡82% → [Remplacer] │
│                                          │
│  ⏱️ Prochain changement possible: 3:22  │
│  (cooldown 5 min)                        │
└──────────────────────────────────────────┘
```

Formation non modifiable en match (MVP).

---

## 11. Data Model

### 11.1 Table `tactical_presets`

| Colonne | Type | Description |
|---|---|---|
| id | uuid PK | |
| club_id | uuid FK | Club propriétaire |
| name | varchar(20) | Nom du preset |
| formation | varchar(10) | Ex: "4-4-2" |
| mentality | enum | ultra_defensive...ultra_offensive |
| pressing | enum | low/medium/high |
| passing_style | enum | short/mixed/long |
| width | enum | narrow/normal/wide |
| tempo | enum | slow/normal/fast |
| defensive_line | enum | low/medium/high |
| penalty_taker_id | uuid FK nullable | |
| free_kick_taker_id | uuid FK nullable | |
| corner_left_taker_id | uuid FK nullable | |
| corner_right_taker_id | uuid FK nullable | |
| captain_id | uuid FK nullable | |
| is_default | boolean | Preset par défaut (non supprimable) |
| created_at | timestamp | |
| updated_at | timestamp | |

Index: `(club_id)`, Contrainte: max 8 presets par club (3 défauts + 5 custom)

### 11.2 Table `match_compositions`

| Colonne | Type | Description |
|---|---|---|
| id | uuid PK | |
| match_id | uuid FK | |
| club_id | uuid FK | |
| preset_id | uuid FK nullable | Preset utilisé |
| formation | varchar(10) | Formation appliquée |
| coherence_score | integer | Score 0-100 |
| created_at | timestamp | |

Les joueurs de la composition sont déjà dans `match_lineups`.

### 11.3 Ajout à `clubs`

| Colonne | Type | Description |
|---|---|---|
| auto_adjustment | boolean | Auto-remplacement (default true) |
| active_preset_id | uuid FK nullable | Preset actuellement actif |

---

## 12. API Endpoints

| Méthode | Route | Description |
|---|---|---|
| GET | `/tactics/presets` | Liste les presets du club |
| POST | `/tactics/presets` | Créer un preset |
| PUT | `/tactics/presets/:id` | Modifier un preset |
| DELETE | `/tactics/presets/:id` | Supprimer un preset (pas les défauts) |
| POST | `/tactics/presets/:id/apply` | Appliquer un preset (recalcule compo) |
| POST | `/tactics/auto-lineup` | Auto-lineup pour la formation courante |
| GET | `/tactics/analysis/:matchId` | Analyse pré-match de l'adversaire |
| PATCH | `/tactics/auto-adjustment` | Toggle auto-ajustement ON/OFF |
| PUT | `/tactics/composition` | Sauvegarder la composition (11 + 7) |
| GET | `/tactics/composition` | Récupérer la composition actuelle |

### 12.1 PUT `/tactics/composition`

```json
// Request
{
  "formation": "4-4-2",
  "startingXI": [
    { "playerId": "uuid", "position": "GK" },
    { "playerId": "uuid", "position": "RB" },
    ...
  ],
  "bench": [
    { "playerId": "uuid", "position": "GK" },
    ...
  ],
  "captainId": "uuid",
  "penaltyTakerId": "uuid",
  "freeKickTakerId": "uuid",
  "cornerLeftTakerId": "uuid",
  "cornerRightTakerId": "uuid"
}

// Response 200
{
  "coherence": 78,
  "warnings": [
    "No backup GK on bench",
    "R. Santos fatigue > 80%"
  ]
}
```

### 12.2 GET `/tactics/analysis/:matchId`

```json
// Response 200
{
  "opponent": {
    "id": "uuid",
    "name": "FC Rival",
    "lastFormation": "4-3-3",
    "lastMentality": "balanced",
    "recentForm": ["W", "W", "L", "D", "W"],
    "recentGoalsScored": 8,
    "recentGoalsConceded": 5,
    "lineOveralls": { "defense": 63, "midfield": 70, "attack": 72 }
  },
  "suggestion": {
    "text": "Leur défense est leur point faible (63). Attaquez avec insistance.",
    "staffRole": "assistant",
    "suggestedPreset": "offensive"
  }
}
```

---

## 13. User Stories

| ID | Story | Critères d'acceptation |
|---|---|---|
| TAC-01 | En tant que manager, je peux positionner mes joueurs sur un terrain 2D | Terrain SVG, 11 slots, drag & drop fonctionnel |
| TAC-02 | Je peux assigner un joueur du banc au terrain par drag & drop | Le joueur apparaît à la position, l'ancien va au banc |
| TAC-03 | Je vois l'indicateur de compatibilité de chaque joueur | 🟢🟡🟠🔴 visibles sur chaque slot |
| TAC-04 | Je peux sauvegarder ma config comme preset | Dialog de nom, max 5 custom, sauvegarde OK |
| TAC-05 | Je peux charger un preset en 1 clic | Formation + instructions appliquées, compo recalculée |
| TAC-06 | J'ai 3 presets par défaut à la création du club | Offensif, Équilibré, Défensif pré-configurés |
| TAC-07 | Je peux utiliser Auto-Lineup | Bouton → meilleure compo calculée automatiquement |
| TAC-08 | Je vois le score de cohésion | Barre 0-100% avec couleur, détail au survol |
| TAC-09 | Je peux analyser mon prochain adversaire | Panel avec forme, forces/faiblesses, suggestion |
| TAC-10 | Je peux configurer les tireurs de CPA | 4 dropdowns, auto-attribution |
| TAC-11 | Je peux désigner un capitaine | Dropdown, badge C sur le terrain |
| TAC-12 | L'auto-ajustement est configurable | Toggle ON/OFF, persiste |

---

## 14. Testing Strategy

### Unit Tests
- Calcul de cohésion (formule, edge cases)
- Logique de suggestion pré-match (4 scénarios)
- AutoLineup (couverture positions, exclusion blessés/suspendus)
- Validation de composition (11 joueurs, pas de doublons, GK requis)

### Integration Tests
- Flux complet : créer preset → charger → sauvegarder compo → jouer match → compo récupérée
- Auto-ajustement : simuler déconnexion + blessure → remplacement automatique
- Analyse pré-match : données adversaire correctes

### E2E Tests
- Drag & drop sur le terrain (mobile + desktop)
- Charger preset → vérifier que le terrain se met à jour
- Auto-lineup → vérifier que les joueurs apparaissent

---

## 15. Décisions de design

| Question | Décision | Raison |
|---|---|---|
| Terrain : SVG ou Canvas ? | **SVG** | Accessibility, CSS styling, événements DOM natifs pour drag&drop |
| Drag & drop : natif ou librairie ? | **@dnd-kit/core** | Léger, React-friendly, touch support, accessible |
| Changement de formation en match ? | **Non (MVP)** | Simplifie le moteur, cohérent avec SPEC-11 |
| Instructions individuelles par joueur ? | **Non (post-MVP)** | Complexité UI trop élevée pour le moment |
| Max presets ? | **8 (3 défauts + 5 custom)** | Assez pour la variété, pas trop pour l'UI |
| Composition sauvegardée où ? | **Table `match_compositions` + `match_lineups`** | Persisté en DB, historique possible |
| Tactiques courantes (hors match) ? | **Redis pour le cache + DB pour la persistance** | Rapide et durable |
