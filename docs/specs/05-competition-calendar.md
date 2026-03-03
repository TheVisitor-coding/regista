# SPEC-05 : Championnat, Compétitions & Calendrier

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-01 (Auth), SPEC-02 (Club), SPEC-03 (Match), SPEC-04 (Effectif)
> **Dernière mise à jour** : 2026-03-02

---

## 1. Objectif

Structurer le gameplay autour d'un **championnat par division** avec calendrier, classement, promotion/relégation, et récompenses de fin de saison. Le système génère un cycle de jeu régulier et motivant : chaque match compte, chaque saison renouvelle les objectifs.

---

## 2. Règles métier fondamentales

| Règle | Valeur |
|---|---|
| Clubs par division | 20 |
| Divisions par ligue | 3 (Div 1, Div 2, Div 3) |
| Clubs par ligue | 60 (20 × 3) |
| Format | Aller-retour (38 journées) |
| Fréquence des matchs | 1 match tous les 3 jours |
| Durée d'une saison | 38 × 3 = **114 jours (~16 semaines)** |
| Intersaison | **5 jours** |
| Cycle complet | ~119 jours (~4 mois) → ~3 saisons/an |
| Créneau horaire | Configurable par ligue (défaut : 21h) |
| Promus par saison | 3 (top 3 de chaque division monte) |
| Relégués par saison | 3 (bottom 3 de chaque division descend) |
| Nouveau joueur | Division 3 d'une ligue avec de la place |
| Points victoire | 3 |
| Points nul | 1 |
| Points défaite | 0 |

---

## 3. Structure des ligues

### 3.1 Modèle de ligue

Chaque ligue est un **univers autonome** et indépendant :

```
Ligue Alpha
├── Division 1 (20 clubs) — Élite, titre en jeu
├── Division 2 (20 clubs) — Montée vers Div 1
└── Division 3 (20 clubs) — Découverte, nouveaux joueurs

Ligue Beta
├── Division 1 (20 clubs)
├── Division 2 (20 clubs)
└── Division 3 (20 clubs)

... Ligues créées dynamiquement selon le besoin
```

**Caractéristiques :**
- Promotion/relégation interne à la ligue.
- Pas de compétition inter-ligues dans le MVP.
- Chaque ligue a un **nom généré** (Ligue Alpha, Ligue Beta, Ligue Gamma... ou noms thématiques : Ligue Atlantique, Ligue Méditerranée, etc.).
- Le créneau horaire est configurable par ligue (permet d'adapter aux fuseaux horaires post-MVP).

### 3.2 Création de ligue

Une nouvelle ligue est créée quand aucune ligue existante n'a de place en Division 3.

```
Algorithme :
1. Un nouveau joueur crée son club
2. Chercher une ligue avec une place libre en Division 3 (< 20 clubs humains + IA)
3. Si trouvée → assigner le club à cette Division 3
4. Si aucune place → créer une nouvelle ligue :
   a. Générer un nom
   b. Créer 3 divisions de 20 clubs chacune (59 clubs IA + le nouveau club en Div 3)
   c. Générer le calendrier pour la saison en cours
   d. Le nouveau club commence au prochain matchday non joué
```

### 3.3 Clubs IA

Les clubs non contrôlés par un humain sont gérés par l'IA (détaillée dans SPEC-07) :
- L'IA définit une composition et une tactique cohérentes.
- Les clubs IA ont un niveau calibré par division :
  - Division 1 : overall moyen 70-80
  - Division 2 : overall moyen 60-70
  - Division 3 : overall moyen 50-65

### 3.4 Gestion de l'abandon

Quand un joueur humain est inactif (ne se connecte plus) :

| Délai d'inactivité | Action |
|---|---|
| 7 jours | Notification email/push : "Votre club vous attend !" |
| 14 jours | Notification : "Votre club sera retiré de la ligue dans 7 jours." |
| **21 jours** | **Le club est retiré de la ligue** et remplacé par un club IA de niveau équivalent. |

**Si le joueur revient après suppression :**
- Il doit recréer un club (nouveau nom, nouvelles couleurs, nouvel effectif).
- Il est placé en Division 3 d'une ligue avec de la place.
- Pas de récupération de l'ancien club.

**Remarque** : ce délai de 21 jours est un filet de sécurité (vacances, etc.). Le message à 14 jours est crucial pour la rétention.

---

## 4. Calendrier & Journées

### 4.1 Génération du calendrier

Le calendrier est généré automatiquement à la **création de la ligue** et en **début de chaque saison** via l'algorithme round-robin (méthode du cercle).

**Algorithme round-robin pour 20 équipes :**

```typescript
function generateCalendar(clubs: Club[], matchTime: string): Matchday[] {
  const n = clubs.length; // 20
  const rounds: Matchday[] = [];

  // Fixer le premier club, faire tourner les autres
  const fixed = clubs[0];
  const rotating = clubs.slice(1); // 19 clubs

  for (let round = 0; round < n - 1; round++) {
    const matchday: Match[] = [];

    // Premier match : fixed vs rotating[0]
    matchday.push({
      home: round % 2 === 0 ? fixed : rotating[0],
      away: round % 2 === 0 ? rotating[0] : fixed,
    });

    // Apparier les autres par symétrie
    for (let i = 1; i < n / 2; i++) {
      const home = rotating[i];
      const away = rotating[n - 1 - i - 1]; // Correction d'index
      matchday.push({ home, away });
    }

    rounds.push(matchday);

    // Rotation circulaire
    rotating.push(rotating.shift()!);
  }

  // Phase retour : inverser domicile/extérieur
  const returnRounds = rounds.map(matchday =>
    matchday.map(match => ({ home: match.away, away: match.home }))
  );

  return [...rounds, ...returnRounds]; // 38 journées
}
```

**Dates des matchs :**
```
Journée 1 : Jour 1 de la saison, à l'heure de la ligue
Journée 2 : Jour 4 (J1 + 3 jours)
Journée 3 : Jour 7 (J2 + 3 jours)
...
Journée N : Jour 1 + (N-1) * 3
```

### 4.2 Matchday (journée de championnat)

Une journée de championnat = **10 matchs simultanés** (20 clubs / 2).

Tous les matchs d'une journée se jouent au **même créneau horaire** (effet multiplex, défini en SPEC-03).

### 4.3 Déroulement d'une journée

```
T-24h : Notification "Journée X demain à 21h"
T-15min : Pré-match — validation compositions (SPEC-03 §4.2)
T+0 :    Coup d'envoi des 10 matchs simultanés
T+~100min : Fin des matchs (90 min + added time + mi-temps)
T+100min : Post-match processing :
  1. Résultats enregistrés
  2. Classement recalculé
  3. Stats joueurs mises à jour
  4. Fatigue appliquée
  5. Blessures / suspensions activées
  6. Progression joueurs calculée
  7. Finances (billetterie) versées
  8. Notifications envoyées (résultats, classement, faits marquants)
T+2 jours : Récupération, préparation
T+3 jours : Prochaine journée
```

---

## 5. Classement

### 5.1 Calcul

Le classement est mis à jour **immédiatement** après chaque journée (traitement post-match).

**Critères de classement (dans l'ordre de priorité) :**

| Priorité | Critère | Description |
|---|---|---|
| 1 | Points | 3V, 1N, 0D |
| 2 | Différence de buts | Buts marqués - buts encaissés |
| 3 | Buts marqués | Plus de buts marqués = avantage |
| 4 | Confrontations directes | Résultats entre les ex-aequo |
| 5 | Fair-play | Moins de cartons = avantage |

### 5.2 Zones du classement

Le classement est divisé en zones visuelles :

| Zone | Positions | Couleur | Signification |
|---|---|---|---|
| Champion | 1 | 🟡 Or | Titre de champion |
| Promotion | 2-3 | 🟢 Vert | Montée en division supérieure |
| Milieu de tableau | 4-17 | ⚪ Neutre | Maintien |
| Relégation | 18-20 | 🔴 Rouge | Descente en division inférieure |

**Exception Division 1** : pas de promotion (déjà au sommet). La zone or (1ère place) = champion.
**Exception Division 3** : pas de relégation (déjà au fond). La zone rouge reste pour l'affichage mais sans conséquence.

### 5.3 Vues du classement

| Vue | Description |
|---|---|
| **Général** | Classement standard (défaut) |
| **Domicile** | Uniquement les matchs à domicile |
| **Extérieur** | Uniquement les matchs à l'extérieur |
| **Forme** | Classement sur les 5 derniers matchs |
| **Buteurs** | Top buteurs de la division |

### 5.4 Interface classement

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLASSEMENT — Division 2 — Ligue Alpha          Journée 24/38       │
│  [Général ▼]  [Domicile]  [Extérieur]  [Forme]  [Buteurs]          │
├──────────────────────────────────────────────────────────────────────┤
│  #   Club              MJ   V  N  D   BP  BC  Diff   Pts           │
│  ───────────────────────────────────────────────────────────────     │
│  🟡 1  FC Leader       24  16  5  3   45  18  +27    53            │
│  🟢 2  AS Montagne     24  15  4  5   38  22  +16    49            │
│  🟢 3  Mon Club ◄      24  14  5  5   42  25  +17    47            │
│       ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─               │
│     4  FC Riviera      24  13  6  5   35  23  +12    45            │
│     5  SC Atlantique   24  12  5  7   30  25  +5     41            │
│     ...                                                              │
│       ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─               │
│  🔴 18 US Plaine      24   4  5 15   18  40  -22    17            │
│  🔴 19 FC Marais      24   3  4 17   14  45  -31    13            │
│  🔴 20 Racing Colline 24   2  3 19   10  52  -42     9            │
└──────────────────────────────────────────────────────────────────────┘
```

- `◄` : indicateur du club du joueur
- Clic sur un club → page publique du club (SPEC-02 §10.2)
- Clic sur la ligne du joueur → mise en surbrillance

---

## 6. Saison

### 6.1 Cycle de vie d'une saison

```
CREATED → IN_PROGRESS → FINISHING → INTERSAISON → ARCHIVED
```

| État | Description | Durée |
|---|---|---|
| `CREATED` | Calendrier généré, prête à démarrer | Instantané |
| `IN_PROGRESS` | Journées se jouent au rythme prévu | ~114 jours |
| `FINISHING` | Dernière journée jouée, calcul final | Instantané |
| `INTERSAISON` | Récompenses, transferts, promotions | 5 jours |
| `ARCHIVED` | Saison terminée, historisée | Permanent |

### 6.2 Fin de saison

Quand la journée 38 est terminée :

```
1. Figer le classement final
2. Déterminer le champion (1er de Div 1)
3. Déterminer les promus (top 3 de Div 2 et Div 3)
4. Déterminer les relégués (bottom 3 de Div 1 et Div 2)
5. Calculer et distribuer les récompenses financières
6. Envoyer les notifications de fin de saison
7. Passer en état INTERSAISON
```

### 6.3 Récompenses de fin de saison

#### Par division

| Position | Division 1 | Division 2 | Division 3 |
|---|---|---|---|
| 1er (champion) | 5 000 000 G$ | 2 500 000 G$ | 1 000 000 G$ |
| 2ème | 3 500 000 G$ | 1 750 000 G$ | 700 000 G$ |
| 3ème | 2 500 000 G$ | 1 250 000 G$ | 500 000 G$ |
| 4ème-6ème | 1 500 000 G$ | 750 000 G$ | 300 000 G$ |
| 7ème-10ème | 1 000 000 G$ | 500 000 G$ | 200 000 G$ |
| 11ème-17ème | 750 000 G$ | 350 000 G$ | 150 000 G$ |
| 18ème-20ème | 500 000 G$ | 250 000 G$ | 100 000 G$ |

#### Trophées

| Trophée | Condition | Affiché dans |
|---|---|---|
| Champion de Div X | 1er du classement final | Page identité club (palmarès) |
| Promu | Top 3, montée de division | Page identité club |
| Meilleur buteur | Plus de buts marqués dans la division | Fiche joueur + page club |

### 6.4 Intersaison (5 jours)

| Jour | Événement |
|---|---|
| **Jour 1** | Classement final publié. Récompenses versées. Trophées attribués. |
| **Jour 2** | Promotions/relégations appliquées. Joueurs vieillis de +1 an. Retraites traitées. Joueurs en fin de contrat libérés. |
| **Jour 3** | Fenêtre de transferts ouverte. Compteurs de cartons jaunes remis à 0. |
| **Jour 4** | Nouveau calendrier généré pour la prochaine saison. |
| **Jour 5** | Début de la nouvelle saison. Premier match à J+3. |

### 6.5 Promotion / Relégation

```
Fin de saison :

Division 1 :
  - Top 3 : restent en Div 1 (dont champion)
  - 4-17 : restent en Div 1
  - 18-20 : ⬇️ relégués en Div 2

Division 2 :
  - Top 3 : ⬆️ promus en Div 1
  - 4-17 : restent en Div 2
  - 18-20 : ⬇️ relégués en Div 3

Division 3 :
  - Top 3 : ⬆️ promus en Div 2
  - 4-20 : restent en Div 3
```

**Notification** :
- "Félicitations ! Votre club est promu en Division {X} !" (Directeur sportif)
- "Malheureusement, votre club est relégué en Division {X}." (Directeur sportif)

---

## 7. Calendrier (vue joueur)

### 7.1 Page calendrier (`/matches`)

Deux modes d'affichage :

#### Vue liste (défaut)

```
┌──────────────────────────────────────────────────────────────┐
│  MATCHS                           [Liste ▼]  [Calendrier]    │
│  [À venir]  [Résultats]  [Tous]                              │
│                                                               │
│  ─── JOURNÉE 25 — dans 2 jours ───────────────────────────   │
│  📅 Mer 12 mars — 21h00                                      │
│  🏠 Mon Club  vs  AS Montagne     Div 2 — Ligue Alpha       │
│  Forme adverse: W W D L W                                     │
│  [Préparer →]                                                 │
│                                                               │
│  ─── JOURNÉE 24 — hier ───────────────────────────────────   │
│  ✅ Mon Club  2-1  FC Riviera     [Voir résumé →]           │
│                                                               │
│  ─── Autres matchs J24 ───────────────────────────────────   │
│  FC Leader 3-0 Racing Colline                                 │
│  AS Montagne 1-1 SC Atlantique                                │
│  ...                                                          │
│                                                               │
│  ─── JOURNÉE 23 ──────────────────────────────────────────   │
│  ✅ Mon Club  0-0  US Plaine      [Voir résumé →]           │
│  ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

#### Vue calendrier (grille mensuelle)

```
┌──────────────────────────────────────────────────────────────┐
│  ◄ Mars 2026 ►                                                │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┤             │
│  Lun │  Mar │  Mer │  Jeu │  Ven │  Sam │  Dim │             │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤             │
│      │      │      │      │      │      │  1   │             │
│      │      │      │      │      │      │      │             │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤             │
│  2   │  3   │  4   │  5   │  6   │  7   │  8   │             │
│      │      │      │ ⚽J25│      │      │      │             │
│      │      │      │ 21h  │      │      │      │             │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤             │
│  9   │  10  │  11  │  12  │  13  │  14  │  15  │             │
│      │      │⚽J26 │      │      │      │⚽J27 │             │
│      │      │ 21h  │      │      │      │ 21h  │             │
│ ...                                                           │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Fiche de journée

Clic sur une journée → affiche tous les matchs de la journée avec résultats (si jouée) ou horaires (si à venir).

```
┌──────────────────────────────────────────────────────────────┐
│  JOURNÉE 24 — Ligue Alpha — Division 2      10 mars 21h00   │
├──────────────────────────────────────────────────────────────┤
│  Mon Club       2 - 1    FC Riviera          [Résumé →]     │
│  FC Leader      3 - 0    Racing Colline      [Résumé →]     │
│  AS Montagne    1 - 1    SC Atlantique       [Résumé →]     │
│  US Plaine      0 - 2    FC Vallée           [Résumé →]     │
│  ...                                                          │
│                                                               │
│  🔝 Fait marquant : FC Leader creuse l'écart en tête (+4pts)│
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Matchs amicaux

### 8.1 Mécanique MVP

Les matchs amicaux permettent de tester son équipe sans enjeu.

| Paramètre | Valeur |
|---|---|
| Adversaire | Club IA uniquement (MVP) |
| Niveau | Choix parmi 3 niveaux (faible, moyen, fort) |
| Fréquence | 1 amical par jour maximum |
| Jours disponibles | Jours sans match de championnat |
| Impact | Pas de points, pas de classement. Fatigue et blessures appliquées normalement. Progression joueurs active. |
| Durée | 90 minutes réelles (comme un match officiel) |

### 8.2 Planification

```
POST /matches/friendly

{
  "difficulty": "medium",    // "easy" | "medium" | "hard"
  "scheduledAt": "2026-03-06T21:00:00Z"  // Doit être un jour sans match officiel
}
```

**Contraintes** :
- Pas de match amical le jour d'un match de championnat.
- Pas de match amical pendant l'intersaison (les joueurs se reposent).
- Maximum 1 amical en attente (pas d'empilement).

### 8.3 Utilité

- Tester une nouvelle formation ou tactique.
- Faire jouer les remplaçants (progression + baisse fatigue relative par rapport aux titulaires).
- Préparer la saison.

---

## 9. Notifications liées au calendrier & compétition

> Le système de notifications et le staff immersif sont définis en SPEC-02 §7. Cette section liste les notifications spécifiques au calendrier et à la compétition.

### 9.1 Notifications automatiques

| Déclencheur | Délai | Personnage | Message type |
|---|---|---|---|
| Match de championnat | T-24h | Secrétaire | "Journée {X} demain à {heure}. Vous affrontez {adversaire} ({domicile/extérieur})." |
| Match de championnat | T-1h | Secrétaire | "Match dans 1 heure ! Vérifiez votre composition." |
| Match amical planifié | T-1h | Adjoint | "Match amical dans 1 heure contre {adversaire}." |
| Résultat de journée | Post-matchday | Adjoint | "Journée {X} terminée. Résumé : {résultats clés}. Vous êtes {position}ème." |
| Résultat concurrent direct | Post-match | Secrétaire | "{Club rival} a {gagné/perdu} contre {adversaire}. Vous {gagnez/perdez} une place au classement." |
| Changement de zone | Post-matchday | Dir. sportif | "Attention, vous êtes passé en zone de relégation." / "Vous êtes en position de promotion !" |
| 5 journées avant la fin | J33 | Dir. sportif | "Plus que 5 journées ! La course au titre/maintien est lancée." |
| Fin de saison | Dernière journée | Secrétaire | "Saison terminée ! Vous terminez {position}ème. {Promu/Relégué/Maintenu}." |
| Récompense | Intersaison J1 | Dir. sportif | "Récompense de fin de saison : +{montant} G$." |
| Promotion | Intersaison J2 | Dir. sportif | "Félicitations ! Votre club est promu en Division {X} !" |
| Relégation | Intersaison J2 | Dir. sportif | "Votre club est relégué en Division {X}. On se relèvera." |
| Nouveau calendrier | Intersaison J4 | Secrétaire | "Le calendrier de la nouvelle saison est disponible." |
| Inactivité (J7) | 7 jours sans connexion | Système | Email : "Votre club vous attend !" |
| Inactivité (J14) | 14 jours sans connexion | Système | Email : "Votre club sera retiré dans 7 jours." |

### 9.2 Préférences de notification

Page de réglages (`/settings/notifications`) :

| Catégorie | Options | Défaut |
|---|---|---|
| **Matchs** | Rappels de match (24h, 1h) | ✅ Activé |
| **Résultats** | Résumés de journée, résultats adverses | ✅ Activé |
| **Classement** | Changements de zone, fin de saison | ✅ Activé |
| **Effectif** | Blessures, suspensions, fatigue, contrats | ✅ Activé |
| **Finances** | Alertes budget, récompenses | ✅ Activé |
| **Transferts** | Offres, résultats (post-MVP) | ✅ Activé |

Chaque catégorie peut être activée/désactivée. Pas de canal push/email dans le MVP (in-app uniquement). Le support PWA/push sera ajouté post-MVP.

---

## 10. Modèle de données

### 10.1 Table `leagues`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `varchar(50)` | Nom de la ligue ("Ligue Alpha") |
| `match_time` | `time` | Heure des matchs (défaut : 21:00) |
| `created_at` | `timestamp` | |

### 10.2 Table `divisions`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `league_id` | `uuid` FK | |
| `level` | `integer` | 1, 2 ou 3 |
| `name` | `varchar(50)` | "Division 1", "Division 2", "Division 3" |
| `created_at` | `timestamp` | |

### 10.3 Table `seasons`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `division_id` | `uuid` FK | |
| `number` | `integer` | Numéro de saison (1, 2, 3...) |
| `status` | `enum` | `created`, `in_progress`, `finishing`, `intersaison`, `archived` |
| `started_at` | `timestamp` | Date de début |
| `finished_at` | `timestamp` | Date de fin (nullable) |
| `total_matchdays` | `integer` | 38 |
| `current_matchday` | `integer` | Journée en cours |
| `created_at` | `timestamp` | |

### 10.4 Table `standings`

Classement en cours. Mis à jour après chaque journée.

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `season_id` | `uuid` FK | |
| `club_id` | `uuid` FK | |
| `position` | `integer` | Position au classement (1-20) |
| `played` | `integer` | Matchs joués |
| `won` | `integer` | Victoires |
| `drawn` | `integer` | Nuls |
| `lost` | `integer` | Défaites |
| `goals_for` | `integer` | Buts marqués |
| `goals_against` | `integer` | Buts encaissés |
| `goal_difference` | `integer` | Différence de buts |
| `points` | `integer` | Points |
| `home_won` | `integer` | Victoires à domicile |
| `home_drawn` | `integer` | Nuls à domicile |
| `home_lost` | `integer` | Défaites à domicile |
| `away_won` | `integer` | Victoires à l'extérieur |
| `away_drawn` | `integer` | Nuls à l'extérieur |
| `away_lost` | `integer` | Défaites à l'extérieur |
| `form` | `varchar(5)` | Derniers 5 résultats ("WWDLW") |
| `updated_at` | `timestamp` | |

**Index unique** : `(season_id, club_id)` — un club a une seule entrée par saison.

### 10.5 Table `season_results`

Résultats archivés en fin de saison (historique).

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `season_id` | `uuid` FK | |
| `club_id` | `uuid` FK | |
| `final_position` | `integer` | Position finale |
| `points` | `integer` | Points totaux |
| `promoted` | `boolean` | A été promu |
| `relegated` | `boolean` | A été relégué |
| `champion` | `boolean` | A été champion |
| `prize_money` | `integer` | Récompense en G$ |
| `created_at` | `timestamp` | |

### 10.6 Table `notification_preferences`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK UNIQUE | |
| `match_reminders` | `boolean` | Rappels de match |
| `match_results` | `boolean` | Résumés de journée |
| `standing_changes` | `boolean` | Changements de classement |
| `squad_alerts` | `boolean` | Alertes effectif |
| `finance_alerts` | `boolean` | Alertes finances |
| `transfer_alerts` | `boolean` | Alertes transferts |
| `updated_at` | `timestamp` | |

---

## 11. API Endpoints

### 11.1 Compétition & Classement

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/competition` | Infos de la division du joueur (division, ligue, saison en cours) |
| `GET` | `/competition/standings` | Classement de la division (filtrable : general, home, away, form) |
| `GET` | `/competition/standings/scorers` | Top buteurs de la division |
| `GET` | `/competition/matchday/:number` | Résultats d'une journée |
| `GET` | `/competition/seasons` | Historique des saisons |
| `GET` | `/competition/seasons/:id` | Détail d'une saison archivée |

### 11.2 Calendrier & Matchs

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/matches` | Liste des matchs du joueur (filtrable : upcoming, past, all) |
| `GET` | `/matches/calendar` | Données pour la vue calendrier (mois par mois) |
| `GET` | `/matches/:id` | Détail d'un match |
| `POST` | `/matches/friendly` | Planifier un match amical |
| `DELETE` | `/matches/friendly/:id` | Annuler un match amical planifié |

### 11.3 Notifications (préférences)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/settings/notifications` | Préférences de notification du joueur |
| `PUT` | `/settings/notifications` | Modifier les préférences |

#### `GET /competition/standings`

**Query params** : `?view=general|home|away|form`

**Response** :
```json
{
  "division": { "id": "uuid", "name": "Division 2", "level": 2 },
  "league": { "id": "uuid", "name": "Ligue Alpha" },
  "season": { "id": "uuid", "number": 3, "currentMatchday": 24, "totalMatchdays": 38 },
  "standings": [
    {
      "position": 1,
      "club": { "id": "uuid", "name": "FC Leader", "logoId": "...", "primaryColor": "#..." },
      "played": 24, "won": 16, "drawn": 5, "lost": 3,
      "goalsFor": 45, "goalsAgainst": 18, "goalDifference": 27,
      "points": 53,
      "form": "WWWDW",
      "zone": "champion",
      "isCurrentClub": false
    },
    {
      "position": 3,
      "club": { "id": "uuid", "name": "Mon Club", "...": "..." },
      "points": 47,
      "zone": "promotion",
      "isCurrentClub": true
    }
  ]
}
```

---

## 12. Architecture technique

### 12.1 Jobs BullMQ

| Job | Déclencheur | Description |
|---|---|---|
| `season:create` | Intersaison J4 | Génère le calendrier de la nouvelle saison |
| `matchday:pre-match` | T-15min (cron) | Valide les compositions pour tous les matchs de la journée |
| `matchday:start` | T+0 (cron) | Lance les 10 jobs `match:simulate` de la journée |
| `matchday:post-process` | Tous les matchs terminés | Calcule classement, notifications, finances |
| `season:finish` | Dernière journée terminée | Déclenche le processus de fin de saison |
| `season:intersaison` | Cron quotidien pendant 5 jours | Exécute chaque étape de l'intersaison |
| `league:check-abandons` | Cron quotidien | Vérifie les joueurs inactifs, envoie les rappels, retire les abandons |
| `friendly:schedule` | À la demande | Planifie un match amical |

### 12.2 Cron schedule

```
Quotidien :
  - 00:00 : league:check-abandons
  - match_time - 15min : matchday:pre-match (jours de match)
  - match_time : matchday:start (jours de match)
```

---

## 13. User Stories complètes

### Championnat

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| COMP-01 | Système | Générer une ligue de 60 clubs (3 divisions × 20) avec calendrier | Structurer la compétition | Ligue créée, calendrier 38 journées valide |
| COMP-02 | Nouveau joueur | Être placé en Division 3 d'une ligue avec de la place | Commencer à jouer immédiatement | Assignation automatique, match dans ≤3 jours |
| COMP-03 | Système | Créer une nouvelle ligue si aucune place disponible | Accueillir tous les joueurs | Ligue avec 59 clubs IA + 1 humain |
| COMP-04 | Système | Lancer tous les matchs d'une journée au créneau horaire prévu | Garantir le rythme de la compétition | 10 matchs simultanés lancés à l'heure |
| COMP-05 | Système | Calculer le classement après chaque journée | Maintenir la compétition à jour | Classement trié par points, goal diff, etc. |

### Classement

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| COMP-06 | Joueur | Voir le classement complet de ma division | Savoir où je me situe | Tableau avec toutes les stats, zones colorées |
| COMP-07 | Joueur | Filtrer le classement (domicile, extérieur, forme, buteurs) | Analyser mes forces et faiblesses | 5 vues disponibles, données correctes |
| COMP-08 | Joueur | Cliquer sur un club du classement pour voir ses infos | Étudier mes adversaires | Lien vers page publique du club |
| COMP-09 | Joueur | Voir ma zone (promotion, relégation, milieu) | Connaître les enjeux | Couleurs distinctes par zone |

### Saison & Récompenses

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| COMP-10 | Joueur | Recevoir une prime financière en fin de saison | Être récompensé pour mes performances | Prime versée, transaction visible |
| COMP-11 | Joueur | Voir mes trophées dans le palmarès du club | Valoriser mes accomplissements | Trophées affichés sur la page identité |
| COMP-12 | Système | Promouvoir les top 3 et reléguer les bottom 3 | Renouveler l'expérience à chaque saison | Clubs déplacés entre divisions |
| COMP-13 | Joueur | Être notifié de ma promotion ou relégation | Comprendre ce qui se passe | Notification du Dir. sportif |
| COMP-14 | Système | Gérer l'intersaison en 5 jours | Laisser le temps aux joueurs de s'adapter | Chaque étape exécutée au bon jour |

### Calendrier

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| CAL-01 | Joueur | Voir mes matchs à venir avec date, heure et adversaire | Planifier mes sessions de jeu | Vue liste triée par date |
| CAL-02 | Joueur | Voir une vue calendrier mensuelle | Avoir une vision d'ensemble | Grille avec pastilles de match |
| CAL-03 | Joueur | Voir les résultats de toute la journée (pas que mon match) | Suivre la compétition | Page journée avec 10 résultats |
| CAL-04 | Joueur | Accéder à l'historique de mes matchs avec score et résumé | Suivre ma progression | Liste filtrable, lien vers résumé |
| CAL-05 | Joueur | Planifier un match amical contre l'IA | Tester mon équipe | Choix de difficulté, jour sans match officiel |
| CAL-06 | Joueur | Annuler un match amical planifié | Changer d'avis | Suppression possible avant T-1h |

### Notifications & Préférences

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| NOTIF-10 | Joueur | Être notifié 24h et 1h avant un match | Ne pas rater un match | Notifications envoyées aux bons horaires |
| NOTIF-11 | Joueur | Recevoir un résumé après chaque journée | Suivre la compétition sans me connecter pendant le match | Résumé avec résultats clés et classement |
| NOTIF-12 | Joueur | Être alerté d'un changement de zone (relégation, promotion) | Réagir aux enjeux | Notification immédiate post-journée |
| NOTIF-13 | Joueur | Configurer quelles notifications je reçois | Ne recevoir que ce qui m'intéresse | Page réglages avec toggles par catégorie |
| NOTIF-14 | Système | Envoyer des emails de rappel aux joueurs inactifs | Améliorer la rétention | Emails à J+7 et J+14 d'inactivité |

### Abandon

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| ABAND-01 | Système | Détecter les joueurs inactifs depuis 7 jours | Gérer les abandons | Cron quotidien, email envoyé |
| ABAND-02 | Système | Avertir un joueur à 14 jours d'inactivité | Lui donner une chance de revenir | Notification claire avec deadline |
| ABAND-03 | Système | Retirer un club à 21 jours d'inactivité et le remplacer par IA | Maintenir la compétition | Club remplacé, classement recalculé |

---

## 14. Stratégie de tests

### Tests unitaires

- **Génération de calendrier** : vérifier que l'algorithme round-robin produit 38 journées valides (chaque équipe joue chaque adversaire 2 fois, 1 dom + 1 ext)
- **Classement** : vérifier le tri par points, goal diff, buts marqués, tiebreakers
- **Promotion/relégation** : vérifier que les top 3 montent et bottom 3 descendent
- **Récompenses** : vérifier les montants par position et division
- **Intersaison** : vérifier chaque étape (vieillissement, libération contrats, etc.)

### Tests d'intégration

- **Cycle saison complet** : simuler une saison de 38 journées en accéléré → vérifier classement, promo/relégation, récompenses
- **Création de ligue** : nouveau joueur → ligue trouvée ou créée → club en Div 3
- **Matchs amicaux** : planifier, jouer, vérifier pas d'impact classement
- **Notifications** : vérifier le bon envoi aux bons moments avec les bons personnages
- **Abandon** : simuler inactivité → vérifier les emails à J7, J14, suppression à J21

---

## 15. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Format championnat | Aller-retour, 38 journées | 2 |
| Fréquence matchs | 1 tous les 3 jours | 2 |
| Durée saison | ~114 jours (~16 semaines) | 2 |
| Structure ligues | Parallèles indépendantes (3 div × 20 clubs) | 3 |
| Divisions | 3 | 3.1 |
| Intersaison | 5 jours | 6.4 |
| Nouveau joueur | Division 3 | 3.2 |
| Abandon | Retrait à 21 jours, grâce 7+14 jours | 3.4 |
| Promotion/relégation | Top 3 montent, bottom 3 descendent | 6.5 |
| Matchs amicaux | vs IA, 3 niveaux, 1/jour max, jours sans match officiel | 8 |
| Notifications | In-app uniquement (MVP), préférences configurables | 9 |
| Compétitions inter-ligues | Post-MVP | — |
| Coupes à élimination | Post-MVP | — |

---

*Spec rédigée le 2026-03-02. À valider avant implémentation.*
