# SPEC-20 : Competition & Stats v2

> **Statut** : Draft
> **Lot** : 2 (Post-MVP)
> **Dépendances** : SPEC-05 (Competition)
> **Dernière mise à jour** : 2026-04-03

---

## 1. Objectif

Enrichir les pages competition et statistiques pour donner de la **profondeur et du contexte** à la saison. Le joueur doit pouvoir analyser sa progression, suivre les performances individuelles et collectives, et comprendre sa position dans le championnat.

---

## 2. Standings enrichis

### 2.1 Graphe d'évolution de position

Line chart montrant la position du club au classement au fil des journées :

```
Position
1  ─────────────────────╲
5  ──────╱──────╲───────╱─────
10 ─╱────                      
   J1  J5  J10  J15  J20  J24
```

- Axe X : journées (1 → current)
- Axe Y : position (1 en haut, 20 en bas — inversé)
- Ligne couleur du club
- Zone de promotion (1-3) en vert semi-transparent
- Zone de relégation (18-20) en rouge semi-transparent

### 2.2 Filtres standings

3 vues via tabs :
- **Général** (défaut) : W/D/L total
- **Domicile** : Home W/D/L uniquement
- **Extérieur** : Away W/D/L uniquement

Les données existent déjà dans la table `standings` (homeWon/homeDrawn/homeLost, awayWon/etc.).

---

## 3. Top Scorers

### 3.1 Endpoint

```
GET /competition/scorers?limit=20
Response: {
  scorers: [
    { playerId: "...", playerName: "R. Santos", clubName: "Mon Club", goals: 12, assists: 4, matches: 22, avgRating: 7.4 },
    ...
  ]
}
```

### 3.2 Interface

Tableau trié par buts (desc), avec nom, club, buts, assists, matchs, note moyenne.

Mon joueur(s) highlighted en couleur.

---

## 4. Historique des saisons

### 4.1 Endpoint

```
GET /competition/seasons
Response: {
  seasons: [
    { id: "...", number: 1, divisionName: "Division 3", finalPosition: 3, points: 68, promoted: true, champion: false },
    ...
  ]
}
```

### 4.2 Interface

Liste des saisons passées avec résultat final, badges (🏆 champion, ↗ promu, ↘ relégué).

---

## 5. Stats avancées du club

### 5.1 Page `/stats` enrichie

**Stats de saison** :
- Matchs joués / gagnés / nuls / perdus
- Buts marqués / encaissés / différence
- Possession moyenne
- Clean sheets (matchs sans encaisser)
- Plus grosse victoire / plus grosse défaite

**Stats individuelles** :
- Meilleur buteur du club
- Meilleur passeur
- Meilleure note moyenne
- Plus de minutes jouées
- Plus de cartons jaunes

### 5.2 Endpoint

```
GET /stats/club
Response: {
  season: {
    played: 24, won: 14, drawn: 5, lost: 5,
    goalsFor: 38, goalsAgainst: 22,
    avgPossession: 54.2,
    cleanSheets: 8,
    biggestWin: { opponent: "SC Berlin", score: "4-0" },
    biggestLoss: { opponent: "OL", score: "0-3" }
  },
  topPlayers: {
    topScorer: { name: "R. Santos", goals: 12 },
    topAssists: { name: "M. Eriksen", assists: 8 },
    topRating: { name: "R. Santos", avgRating: 7.4 },
    mostMinutes: { name: "J. Müller", minutes: 2100 },
    mostYellows: { name: "A. Chen", yellowCards: 6 }
  }
}
```

---

## 6. Calendrier journée

### 6.1 Amélioration `/competition/matchday/:number`

Ajouter :
- Indication de la journée courante
- Navigation ← → entre les journées
- Résultats en gras pour les matchs terminés
- "À VENIR" pour les matchs programmés
- Match du joueur mis en avant (fond coloré)

---

## 7. Endpoints additionnels

| Méthode | Route | Description |
|---|---|---|
| GET | `/competition/scorers` | Top buteurs de la division |
| GET | `/competition/seasons` | Historique des saisons |
| GET | `/competition/position-history` | Évolution position au classement |
| GET | `/stats/club` | Stats détaillées du club |

---

## 8. Décisions

| Question | Décision | Raison |
|---|---|---|
| Chart library | **Recharts** (même que SPEC-17) | Cohérence |
| Position history | **Calculé à la volée** (pas de table dédiée) | Les données sont dans standings |
| Top scorers | **Agrégé depuis match_player_stats** | Données existantes |
| Stats par saison | **Agrégé depuis standings + matches** | Pas de table supplémentaire |
