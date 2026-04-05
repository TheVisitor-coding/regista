# SPEC-18 : Match Experience v2

> **Statut** : Draft
> **Lot** : 2 (Post-MVP)
> **Dépendances** : SPEC-03 (Match), SPEC-16 (Tactiques v2)
> **Dernière mise à jour** : 2026-04-03

---

## 1. Objectif

Transformer l'expérience de match d'un tableau de texte en une **expérience immersive et émotionnelle**. Le joueur doit ressentir la tension d'un match, célébrer les buts, et pouvoir intervenir tactiquement.

---

## 2. Match Live — Page `/matches/:id`

### 2.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│  SCORE HEADER                                            │
│  [Logo] Mon Club  2 - 1  FC Rival [Logo]                │
│              ● LIVE — 67'                                │
├────────────────────────────┬─────────────────────────────┤
│  TIMELINE ÉVÉNEMENTS       │  PANNEAU LATÉRAL            │
│                            │                             │
│  67' ⚽ R. Santos          │  [Onglet: Tactiques]        │
│  54' 🟨 J. Müller         │  Mentalité: [●●●○○]        │
│  45' ⏸ Mi-temps           │  Instructions: [sliders]    │
│  32' ⚽ M. Eriksen         │  Cooldown: 3:22            │
│  28' 💨 Tir cadré         │                             │
│  15' ⚽ L. Martin (Rival)  │  [Onglet: Remplacements]   │
│  1'  🏁 Coup d'envoi      │  ⚡ R. Santos 87%          │
│                            │  ⚡ J. Müller 82%          │
│                            │  Subs: 2/5                  │
│                            │  [Remplacer →]              │
├────────────────────────────┤                             │
│  STATS COMPARÉES           │  [Onglet: Composition]     │
│  Possession ██████░░ 63%   │  [Mini terrain 2D]         │
│  Tirs       ████░░░░ 8-4  │                             │
│  Cadrés     ███░░░░░ 5-2  │                             │
│  Corners    ██░░░░░░ 4-1  │                             │
│  Fautes     ░░░████ 3-6   │                             │
└────────────────────────────┴─────────────────────────────┘
```

### 2.2 Score Header

- **Animation but** : Flash doré, scale up du score (1.0 → 1.5 → 1.0), particules
- **Indicateur live** : Point rouge pulsant + minutage
- **Logos clubs** : Cercles colorés (couleur primaire) ou SVG blasons
- **Half-time** : Affiche "MI-TEMPS" avec le score
- **Finished** : Affiche "TERMINÉ" avec résultat (Victoire/Nul/Défaite en couleur)

### 2.3 Timeline d'événements

Liste chronologique inversée (plus récent en haut) :

| Type | Icône | Couleur | Exemple |
|---|---|---|---|
| But | ⚽ | Or | "R. Santos 67'" |
| Tir cadré | 🎯 | Bleu | "Tir cadré de M. Eriksen" |
| Tir non cadré | 💨 | Gris | "Tir à côté" |
| Faute | ⚠️ | Orange | "Faute de J. Müller" |
| Carton jaune | 🟨 | Jaune | "Carton jaune J. Müller" |
| Carton rouge | 🟥 | Rouge | "Expulsion !" |
| Blessure | 🏥 | Rouge | "Blessure de L. Martin" |
| Remplacement | 🔄 | Bleu | "↓ Santos ↑ Garcia" |
| Mi-temps | ⏸️ | Gris | "Mi-temps 1-1" |
| Coup d'envoi | 🏁 | Vert | "Coup d'envoi" |
| Fin du match | 🏁 | Vert | "Fin du match 2-1" |

Événements "but" mis en valeur (fond doré semi-transparent, texte plus grand).

### 2.4 Stats comparées

Barres horizontales face-à-face :
```
Mon Club                     FC Rival
   63% ██████████░░░░░░░░ 37%    Possession
     8 ████████░░░░░░░░ 4        Tirs
     5 ██████░░░░░░░░░░ 2        Cadrés
```

Couleur : couleur primaire de chaque club.

### 2.5 Panneau tactique (match en cours)

3 onglets :

**Onglet Tactiques** :
- Sélecteur de mentalité (5 boutons)
- 5 instructions (3 niveaux chacune)
- Timer de cooldown (5 min entre changements, pause à la mi-temps)
- Bouton "Appliquer" (grisé pendant le cooldown)

**Onglet Remplacements** :
- Liste des joueurs fatigués (>70%) triés par fatigue
- Pour chaque : nom, position, fatigue, [Remplacer]
- Au clic : dropdown des remplaçants disponibles sur le banc
- Compteur : "2/5 remplacements utilisés"

**Onglet Composition** :
- Mini terrain 2D en lecture seule montrant le XI actuel
- Joueurs remplacés grisés, entrants en couleur

---

## 3. Post-Match Summary

### 3.1 Accès

Affiché automatiquement quand le match est terminé (remplace la vue live).

### 3.2 Layout

```
┌──────────────────────────────────────────────────────────┐
│  RÉSULTAT                                                │
│  Mon Club  2 - 1  FC Rival                               │
│  VICTOIRE ! 🏆                                           │
│                                                          │
│  ⭐ HOMME DU MATCH : R. Santos (8.9)                    │
│                                                          │
│  FAITS MARQUANTS                                         │
│  ⚽ 32' M. Eriksen (assist: L. Martin)                   │
│  ⚽ 15' L. Martin (FC Rival)                             │
│  ⚽ 67' R. Santos                                        │
│  🟨 54' J. Müller                                        │
│                                                          │
│  NOTES DES JOUEURS                                       │
│  R. Santos  ⭐ 8.9  │  M. Eriksen  ⭐ 7.2              │
│  L. Martin  ⭐ 7.8  │  J. Müller   ⭐ 5.8              │
│  ...                                                     │
│                                                          │
│  STATS MATCH                                             │
│  [Mêmes barres comparées que le live]                    │
│                                                          │
│  💬 ASSISTANT                                            │
│  "Belle victoire ! R. Santos a été exceptionnel          │
│   avec son doublé. Attention à J. Müller qui a           │
│   pris un carton jaune."                                 │
│                                                          │
│  [📊 Voir détails complets]  [🏠 Retour dashboard]      │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Homme du match (MOTM)

Joueur avec la meilleure note du match (des deux équipes). Affiché avec mise en avant.

### 3.4 Commentaire assistant

Généré automatiquement basé sur :
- Résultat (victoire/nul/défaite)
- Écart de score
- Joueur clé (meilleure note de l'équipe)
- Événements notables (cartons, blessures)

---

## 4. Endpoints additionnels

| Méthode | Route | Description |
|---|---|---|
| GET | `/matches/:id/summary` | Post-match summary (MOTM, faits marquants, notes, commentaire) |
| GET | `/matches/:id/player-stats` | Stats individuelles de chaque joueur du match |

### 4.1 GET `/matches/:id/summary`

```json
{
  "result": "win",
  "homeScore": 2,
  "awayScore": 1,
  "motm": { "playerId": "...", "name": "R. Santos", "rating": 8.9, "goals": 1, "assists": 0 },
  "highlights": [
    { "minute": 15, "type": "goal", "team": "away", "player": "L. Martin" },
    { "minute": 32, "type": "goal", "team": "home", "player": "M. Eriksen", "assist": "L. Martin" },
    { "minute": 54, "type": "yellow_card", "team": "home", "player": "J. Müller" },
    { "minute": 67, "type": "goal", "team": "home", "player": "R. Santos" }
  ],
  "playerRatings": [
    { "playerId": "...", "name": "R. Santos", "position": "ST", "rating": 8.9, "minutesPlayed": 90 },
    ...
  ],
  "assistantComment": "Belle victoire ! R. Santos a été exceptionnel...",
  "stats": { "home": { ... }, "away": { ... } }
}
```

---

## 5. Décisions de design

| Question | Décision | Raison |
|---|---|---|
| Temps réel | **Socket.io** (pas polling) | Réactivité, moins de requêtes |
| Animation but | **CSS animation + confetti léger** | Impact sans lourdeur |
| Panneau tactique en match | **Latéral desktop, bottom sheet mobile** | Accessible sans quitter le match |
| Post-match auto-affiché | **Oui** | Feedback immédiat sur le résultat |
| Commentaire assistant | **Template-based** (pas IA) | Simple et prévisible |
