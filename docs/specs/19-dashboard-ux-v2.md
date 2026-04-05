# SPEC-19 : Dashboard & Game Loop UX v2

> **Statut** : Draft
> **Lot** : 2 (Post-MVP)
> **Dépendances** : SPEC-02 (Club Dashboard), SPEC-08 (Onboarding)
> **Dernière mise à jour** : 2026-04-03

---

## 1. Objectif

Le dashboard doit être le **hub quotidien** du manager : en un coup d'oeil, il sait ce qui s'est passé, ce qui va se passer, et ce qui nécessite son attention. Il doit donner envie de jouer et guider vers les actions pertinentes.

**Bugs actuels à corriger** :
- `recentResults` retourne `[]` (jamais rempli)
- `moraleTrend` hardcodé `"stable"` (jamais calculé)
- Quick actions hardcodées au lieu de dynamiques

---

## 2. Dashboard Refonte

### 2.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│  Bonjour, [Username] !  🏟️ [Club Name]                  │
│  Division 3 · Ligue Alpha · Journée 24/38                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │ 📅 PROCHAIN MATCH   │  │ 📊 CLASSEMENT       │       │
│  │ vs FC Rival (ext)   │  │ #3  28 pts          │       │
│  │ dans 2j 14h         │  │ ↗ Gagné 2 places    │       │
│  │ Forme adv: 🟢🟢🔴  │  │ #2 FC Leader  30pts │       │
│  │ [Préparer →]        │  │ #3 Mon Club   28pts │       │
│  └─────────────────────┘  │ #4 FC Rival   27pts │       │
│                            └─────────────────────┘       │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │ 💪 ÉTAT D'ÉQUIPE    │  │ 📈 RÉSULTATS RÉCENTS│       │
│  │ Morale: Bon (68) ↗  │  │ 🟢 2-1 vs Monaco   │       │
│  │ Dispo: 19/22        │  │ 🔴 0-3 vs Lyon      │       │
│  │ Blessés: 2          │  │ 🟢 1-0 vs Nantes    │       │
│  │ Fatigue moy: 35%    │  │ Forme: 🟢🔴🟢⚪🟢 │       │
│  └─────────────────────┘  └─────────────────────┘       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ ⚡ ACTIONS REQUISES                               │    │
│  │ 🔴 Match demain sans compo validée → Tactiques   │    │
│  │ 🟠 R. Santos en fin de contrat (5 matchs) → Fiche│    │
│  │ 🟡 3 joueurs très fatigués → Entraînement        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 📬 MESSAGES DU STAFF (3 non lus)                 │    │
│  │ [Avatar] Adjoint: "Analyse de FC Rival prête"    │    │
│  │ [Avatar] Médecin: "L. Martin de retour demain"   │    │
│  │ [Avatar] Dir. sportif: "Offre reçue pour Santos" │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Widgets détaillés

**Widget Prochain Match** :
- Adversaire (nom + couleur)
- Lieu (domicile/extérieur)
- Countdown (jours + heures)
- Forme adversaire (5 derniers résultats)
- Bouton "Préparer →" → `/tactics`

**Widget Classement** :
- Position actuelle + tendance (↗/→/↘ par rapport à il y a 5 matchs)
- 3 lignes : une au-dessus, la sienne (highlighted), une en-dessous
- Lien vers `/competition`

**Widget État d'Équipe** :
- Morale : valeur + label + tendance réelle
- Disponibles / Total
- Blessés (nombre)
- Fatigue moyenne

**Widget Résultats Récents** :
- 3 derniers matchs terminés avec score et adversaire
- Indicateur de forme (5 cercles colorés W/D/L)

**Widget Actions Requises** :
Générées dynamiquement par ordre de priorité :

| Priorité | Condition | Message | Lien |
|---|---|---|---|
| 🔴 Critique | Match < 24h sans compo | "Validez votre composition !" | /tactics |
| 🔴 Critique | Balance négative | "Finances critiques !" | /finances |
| 🟠 Important | Joueur blessé, pas de backup | "Pas de remplaçant pour [poste]" | /squad |
| 🟠 Important | Contrat < 5 matchs | "[Joueur] en fin de contrat" | /squad/:id |
| 🟡 Info | Fatigue > 70% (3+ joueurs) | "Joueurs fatigués, considérez le repos" | /training |
| 🟡 Info | Offre reçue | "Offre reçue pour [joueur]" | /transfers |
| 🟢 Positif | Série de 3 victoires | "3 victoires d'affilée !" | — |

**Widget Messages Staff** :
- 3 dernières notifications non lues
- Avatar + rôle du staff + message court
- Clic → `/notifications`

---

## 3. Fix des données dashboard

### 3.1 Résultats récents

Le dashboard controller doit requêter les 3 derniers matchs terminés du club :

```sql
SELECT m.*, 
  home.name as home_name, away.name as away_name
FROM matches m
JOIN clubs home ON m.home_club_id = home.id
JOIN clubs away ON m.away_club_id = away.id
WHERE (m.home_club_id = :clubId OR m.away_club_id = :clubId)
  AND m.status = 'finished'
ORDER BY m.finished_at DESC
LIMIT 3
```

### 3.2 Morale trend

Comparer le morale actuel avec celui d'il y a 5 matchs (stocké dans un historique ou calculé) :
- `morale_current > morale_5_ago + 5` → `"up"`
- `morale_current < morale_5_ago - 5` → `"down"`
- Sinon → `"stable"`

Pour le MVP, stocker le morale dans `player_overall_history` (réutiliser la table) ou simplement comparer avec le morale initial (60).

### 3.3 Quick Actions dynamiques

Remplacer les actions hardcodées par des checks réels :

```typescript
// 1. Prochain match sans compo
const nextMatch = await getNextMatch(clubId)
if (nextMatch && !hasComposition(nextMatch.id, clubId)) {
  actions.push({ priority: 'critical', message: '...', url: '/tactics' })
}

// 2. Contrats expirant
const expiringContracts = await getExpiringContracts(clubId, 5)
for (const player of expiringContracts) {
  actions.push({ priority: 'important', message: '...', url: `/squad/${player.id}` })
}

// 3. Offres reçues
const pendingOffers = await getPendingOffers(clubId)
// ...
```

---

## 4. Guided Tour (Onboarding)

### 4.1 Déclenchement

Après la création du club, au premier chargement du dashboard, le tour se lance automatiquement.

### 4.2 Steps (6 tooltips)

| # | Cible | Contenu |
|---|---|---|
| 1 | Widget "Prochain Match" | "Voici votre prochain match. Préparez-vous en configurant vos tactiques." |
| 2 | Sidebar "Squad" | "Gérez votre effectif ici. Consultez vos joueurs et leur condition." |
| 3 | Sidebar "Tactics" | "C'est ici que vous positionnez vos joueurs et choisissez votre stratégie." |
| 4 | Header "Balance" | "Surveillez vos finances. Les salaires sont déduits chaque semaine." |
| 5 | Widget "Actions" | "Les actions requises vous alertent sur les décisions à prendre." |
| 6 | Sidebar "Training" | "L'entraînement améliore vos joueurs entre les matchs." |

### 4.3 UI

- Tooltip avec flèche pointant vers l'élément
- Fond overlay semi-transparent (élément cible mis en avant)
- Boutons : "Suivant" / "Passer le tour"
- Progression : "3/6"
- Persisté : `has_completed_tour` dans user ou Redis

---

## 5. Calendar visuel saison

### 5.1 Accès

Widget compact sur le dashboard + page dédiée accessible depuis `/matches`.

### 5.2 Format compact (dashboard)

```
Saison 1 — Journée 24/38
████████████████████░░░░░░░░░░░░░░░░░░ 63%
          ↑ vous êtes ici
```

### 5.3 Format étendu (/matches ou /competition)

Timeline horizontale scrollable :
```
J1  J2  J3  J4  ...  J23  [J24]  J25  ...  J38
🟢  🟢  🔴  ⚪       🟢   ⏳     ○    ...   ○
2-1 1-0 0-3 1-1      3-0
```

Couleurs : 🟢 victoire, 🔴 défaite, ⚪ nul, ⏳ prochain, ○ à venir.

---

## 6. Endpoints modifiés

### 6.1 GET `/dashboard` (enrichi)

Ajouts au retour actuel :

```json
{
  "recentResults": [
    { "matchId": "...", "opponent": "AS Monaco", "score": "2-1", "result": "win", "date": "..." },
    { "matchId": "...", "opponent": "OL", "score": "0-3", "result": "loss", "date": "..." },
    { "matchId": "...", "opponent": "FC Nantes", "score": "1-0", "result": "win", "date": "..." }
  ],
  "club": {
    "moraleTrend": "up"  // Calculé dynamiquement
  },
  "quickActions": [
    // Générées dynamiquement au lieu de hardcodées
  ],
  "seasonProgress": {
    "currentMatchday": 24,
    "totalMatchdays": 38,
    "percentComplete": 63
  }
}
```

---

## 7. Décisions

| Question | Décision | Raison |
|---|---|---|
| Guided tour library | **@reactour/tour** ou custom avec Radix Popover | Léger, accessible |
| Tour déclenchement | **Auto au 1er dashboard** | Pas d'action manuelle requise |
| Actions dynamiques | **Server-side** (calculées dans le controller) | Cohérent, pas de logique client |
| Calendar compact | **Progress bar + pourcentage** | Simple et lisible |
