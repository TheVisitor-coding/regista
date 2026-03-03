# SPEC-03 : Système de Match en Temps Réel

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-01 (Auth), SPEC-02 (Club & Effectif)
> **Dernière mise à jour** : 2026-03-02

---

## 1. Objectif

Permettre à chaque joueur de vivre un **match de football simulé en temps réel** (90 minutes réelles), joué à une **heure fixe planifiée**, avec visualisation dynamique des événements, statistiques détaillées, et interactions tactiques en direct.

Le match se joue **même si le joueur n'est pas connecté**. Le joueur peut se connecter à tout moment pour suivre le match et interagir.

---

## 2. Règles métier fondamentales

| Règle | Valeur |
|---|---|
| Durée d'une mi-temps | 45 minutes réelles |
| Pause mi-temps | 5 minutes réelles |
| Temps additionnel | 1-5 min par mi-temps (calculé par le moteur) |
| Durée totale estimée | ~97-105 minutes réelles |
| Remplacements max | 5 par match |
| Cooldown changement tactique | 5 minutes (réelles) |
| Densité d'événements notables | ~40-50% des minutes |
| Commentaires narratifs | Oui, via templates (~50-100 templates) |
| Passes décisives (assists) | Trackées dès le MVP |
| Coups de pied arrêtés | Sous-routines de simulation dédiées |
| Stats gardien | Spécifiques (reflexes, diving, handling, positioning, kicking, communication) |
| Spectateurs (MVP) | Non — uniquement les 2 managers du match |
| Prolongations / Tirs au but | Post-MVP |

---

## 3. Cycle de vie d'un match (State Machine)

```
SCHEDULED → PRE_MATCH → FIRST_HALF → HALF_TIME → SECOND_HALF → FINISHED
                                                                    ↓
                                                               POST_MATCH
```

### États détaillés

| État | Description | Durée |
|---|---|---|
| `SCHEDULED` | Match planifié dans le calendrier, pas encore démarré | Jusqu'à T-15min |
| `PRE_MATCH` | Validation des compositions, préparation | T-15min → T |
| `FIRST_HALF` | Première mi-temps en cours | ~47-50 min (45 + temps additionnel) |
| `HALF_TIME` | Pause mi-temps, ajustements tactiques | 5 min |
| `SECOND_HALF` | Deuxième mi-temps en cours | ~47-50 min (45 + temps additionnel) |
| `FINISHED` | Match terminé, score final figé | Instantané |
| `POST_MATCH` | Résultats calculés, stats agrégées, classements mis à jour | Asynchrone |

### Transitions

- `SCHEDULED → PRE_MATCH` : Déclenché par un cron job 15 min avant le match.
- `PRE_MATCH → FIRST_HALF` : À l'heure exacte du match (T+0).
- `FIRST_HALF → HALF_TIME` : Minute 45 + temps additionnel première mi-temps.
- `HALF_TIME → SECOND_HALF` : Après 5 minutes réelles de pause.
- `SECOND_HALF → FINISHED` : Minute 90 + temps additionnel seconde mi-temps.
- `FINISHED → POST_MATCH` : Immédiat, traitement asynchrone.

---

## 4. Planification & Déclenchement

### 4.1 Planification

- Chaque match a une **heure fixe** définie par le calendrier de la compétition.
- Le créneau horaire est **configurable par ligue** (ex : Ligue Alpha à 21h, Ligue Beta à 18h).
- Les matchs d'une même journée de championnat se jouent **tous au même créneau** (effet multiplex).

### 4.2 Pré-match (T-15 min)

Un job BullMQ `match:pre-match` est déclenché 15 minutes avant le coup d'envoi.

**Actions du pré-match :**

1. **Valider la composition de chaque équipe** :
   - Le XI titulaire est-il complet (11 joueurs) ?
   - Tous les joueurs sont-ils aptes (pas blessés, pas suspendus) ?
   - La formation est-elle valide (postes couverts) ?
   - Le banc contient-il au moins les remplaçants déclarés ?

2. **Si composition invalide** :
   - Remplacer automatiquement les joueurs inaptes par les meilleurs remplaçants disponibles au même poste.
   - Si aucun remplaçant disponible au poste → décaler un joueur polyvalent.
   - Si l'équipe ne peut pas aligner 11 joueurs aptes → le match est joué avec les joueurs disponibles (minimum 7, en dessous → forfait 3-0).

3. **Si le joueur n'a pas configuré son équipe** :
   - Reconduire la dernière composition validée.
   - Appliquer les corrections automatiques ci-dessus si nécessaire.

4. **Notifier les joueurs** :
   - Notification in-app "Votre match contre [adversaire] commence dans 15 minutes".
   - Rappel à T-5 min si le joueur n'est pas connecté.

### 4.3 Coup d'envoi (T+0)

- Le job BullMQ `match:simulate` démarre.
- L'état passe à `FIRST_HALF`.
- La simulation minute par minute commence.

---

## 5. Moteur de Simulation

### 5.1 Architecture du moteur

Le moteur est un **job BullMQ persistant** qui s'exécute pendant toute la durée du match (~100 min).

```
┌──────────────────────────────────────────────┐
│                 Match Job                     │
│                                               │
│  ┌─────────┐   ┌──────────┐   ┌───────────┐ │
│  │ Minute   │──▶│ Simuler  │──▶│ Broadcast │ │
│  │ Timer    │   │ Événement│   │ Socket.io │ │
│  └─────────┘   └──────────┘   └───────────┘ │
│       │              │              │         │
│       │              ▼              │         │
│       │        ┌──────────┐         │         │
│       │        │  Sauver  │         │         │
│       └───────▶│  État DB │◀────────┘         │
│                └──────────┘                   │
└──────────────────────────────────────────────┘
```

**Boucle principale (pseudo-code) :**

```
pour chaque minute de 1 à 45 + added_time_1:
  événements = simulerMinute(état_match, minute)
  sauvegarder(événements)
  broadcaster(événements)
  attendre ~60 secondes

pause mi-temps (5 min)

pour chaque minute de 46 à 90 + added_time_2:
  événements = simulerMinute(état_match, minute)
  sauvegarder(événements)
  broadcaster(événements)
  attendre ~60 secondes

finaliser match
```

### 5.2 Cycle d'une minute simulée

Chaque minute suit ce cycle :

```
1. Déterminer l'équipe en possession
2. Déterminer la zone du terrain (défense / milieu / attaque)
3. Choisir le type d'action (passe, dribble, tir, centre, tacle...)
4. Résoudre l'action (succès/échec via probabilités pondérées)
5. Appliquer les conséquences (changement de possession, but, faute...)
6. Mettre à jour les stats minute (possession, tirs, etc.)
7. Appliquer la fatigue aux joueurs impliqués
8. Logger l'événement
```

### 5.3 Détermination de la possession

À chaque minute, la possession est déterminée par :

```
score_possession_A = (milieu_A.passing + milieu_A.vision + milieu_A.workRate) * fatigue_modifier
                   + bonus_tactique_A
                   - pression_defensive_B

probabilité_A = score_possession_A / (score_possession_A + score_possession_B)
```

**Facteurs influents :**
- Stats des milieux de terrain (passing, vision, workRate)
- Mentalité tactique (offensive = plus de possession en zone haute, défensive = moins de possession globale mais plus solide)
- Pressing adverse (pressing haut réduit la possession propre)
- Fatigue des joueurs
- Score actuel (une équipe menée tend à avoir plus de possession stérile)

### 5.4 Types d'actions et résolution

Chaque minute, le moteur choisit un type d'action basé sur la zone de terrain et la tactique :

#### Actions par zone

| Zone | Actions possibles | Poids relatif |
|---|---|---|
| **Défense** | Relance, dégagement, passe longue, interception | Construction du jeu |
| **Milieu** | Passe courte, passe longue, dribble, tacle, pressing | Transition |
| **Attaque** | Centre, tir, dribble, une-deux, frappe lointaine | Finalisation |

#### Résolution d'une action (probabilités pondérées)

Chaque action est résolue par une **fonction de probabilité** :

```typescript
interface ActionContext {
  attacker: PlayerStats;       // Joueur qui initie l'action
  defender: PlayerStats | null; // Joueur adverse (si duel)
  zone: 'defense' | 'midfield' | 'attack';
  teamTactic: TacticConfig;
  opponentTactic: TacticConfig;
  minute: number;              // Les fins de mi-temps sont plus intenses
  fatigue: number;             // 0-100, impacte la précision
  scoreDiff: number;           // Différence au score (impact mental)
}

function resolveAction(action: ActionType, ctx: ActionContext): ActionOutcome {
  const baseChance = ACTION_BASE_CHANCES[action]; // ex: tir au but = 0.12

  let modifier = 1.0;

  // Stats du joueur
  modifier *= getStatModifier(action, ctx.attacker);

  // Fatigue (réduit la performance)
  modifier *= 1 - (ctx.fatigue / 200); // fatigue 100 = -50% perf

  // Tactique
  modifier *= getTacticModifier(action, ctx.teamTactic);

  // Opposition
  if (ctx.defender) {
    modifier *= getDefenseModifier(action, ctx.defender, ctx.opponentTactic);
  }

  // Pression du score (équipe menée = boost léger en attaque)
  if (ctx.scoreDiff < 0) {
    modifier *= 1 + (Math.abs(ctx.scoreDiff) * 0.05);
  }

  // Fin de match = plus d'intensité
  if (ctx.minute > 80) {
    modifier *= 1.1;
  }

  const chance = Math.min(baseChance * modifier, 0.95); // Cap à 95%
  return Math.random() < chance ? 'success' : 'failure';
}
```

#### Tableau de résolution des actions

| Action | Stat principale | Stat opposée | Base chance succès | Conséquence succès | Conséquence échec |
|---|---|---|---|---|---|
| **Passe courte** | passing | interception | 75% | Maintien possession, avance zone | Perte possession |
| **Passe longue** | passing + vision | positioning | 55% | Avance 2 zones | Perte possession |
| **Dribble** | dribbling | tackling | 45% | Avance zone, création espace | Perte possession |
| **Centre** | crossing | heading (def) | 40% | Occasion de tir | Dégagement |
| **Tir cadré** | shooting + composure | reflexes (GK) | 35% | Occasion de but | Arrêt / à côté |
| **But** (si tir cadré) | finishing | GK overall | 30% | BUT ! | Arrêt GK |
| **Tacle** | tackling | dribbling | 50% | Récupération | Faute possible |
| **Pressing** | workRate + stamina | passing | 40% | Récupération haute | Dépassé |
| **Frappe lointaine** | longShots | reflexes | 20% | Occasion de but | À côté / arrêt |
| **Coup franc** | freeKick | reflexes | 15% | Occasion de but | Mur / à côté |

### 5.5 Calcul du temps additionnel

À la fin de chaque mi-temps, le moteur calcule le temps additionnel :

```
temps_additionnel = base (1 min)
  + nombre de buts marqués dans la mi-temps * 0.5
  + nombre de cartons * 0.5
  + nombre de remplacements * 0.3
  + nombre de blessures * 1
  + random(-0.5, +1)

// Arrondi à l'entier, min 1, max 5
```

### 5.6 Événements spéciaux

#### Blessures
- Probabilité par minute : ~0.5% (ajustée par fatigue et agressivité du tacle)
- Si blessure → joueur sort du match, remplacement forcé si slots disponibles
- Gravité : légère (joueur diminué) ou sortie (doit être remplacé)

#### Cartons
- **Carton jaune** : déclenché par un tacle raté avec agressivité élevée (~3% par tacle raté)
- **Deuxième jaune → rouge** : le joueur est expulsé
- **Carton rouge direct** : très rare (~0.3% sur tacle très agressif)
- Un joueur expulsé → l'équipe joue à 10 (ou moins) pour le reste du match

#### Impact d'un joueur en moins
- Équipe à 10 : malus de -15% sur possession et actions offensives
- Équipe à 9 : malus de -30%
- En dessous de 7 joueurs : forfait (match arrêté)

### 5.7 Coups de pied arrêtés (sous-routines)

Les coups de pied arrêtés ont leur propre logique de simulation, déclenchée quand l'action principale les provoque.

#### Corner

Déclenché quand un tir/centre est dévié par la défense en corner.

```
1. Choisir le tireur (meilleur stat crossing de l'équipe)
2. Type de centre : 1er poteau (40%) / 2ème poteau (35%) / retrait court (25%)
3. Si 1er/2ème poteau :
   a. Duel heading (attaquant) vs heading (défenseur)
   b. Si gagné → tir de la tête → résoudre vs gardien
4. Si retrait court :
   a. Passe courte → tir depuis l'extérieur de la surface
   b. Résoudre comme une frappe lointaine
```

#### Coup franc direct (à portée de tir)

Déclenché après une faute dans les 30 derniers mètres.

```
1. Choisir le tireur (meilleur stat freeKick)
2. Options : frappe directe (60%) / centre (40%)
3. Si frappe directe :
   a. Chance de base : 8% (but direct)
   b. Modifié par freeKick stat et distance
   c. Mur : bloque 35% des tentatives
   d. Gardien : résolution si le mur est passé
4. Si centre :
   a. Résoudre comme un corner
```

#### Penalty

Déclenché par une faute dans la surface (probabilité ~2% quand un attaquant est taclé en zone d'attaque).

```
1. Choisir le tireur (meilleur stat penalties ou shooting)
2. Chance de marquer : 75% (base)
3. Modifiée par : penalties stat du tireur vs reflexes du gardien
4. Résultats : but (75%) / arrêt gardien (15%) / à côté (10%)
```

### 5.8 Système de commentaires narratifs

Chaque événement visible est accompagné d'un **commentaire narratif** généré à partir de templates.

#### Architecture des templates

```typescript
interface CommentTemplate {
  eventType: MatchEventType;
  outcome: 'success' | 'failure' | 'neutral';
  templates: string[];  // Plusieurs variantes pour éviter la répétition
}

// Exemples
const TEMPLATES: CommentTemplate[] = [
  {
    eventType: 'goal',
    outcome: 'success',
    templates: [
      "{player} déclenche une frappe imparable, c'est le but !",
      "BUUUT ! {player} trompe le gardien d'un tir puissant !",
      "{player} conclut une belle action collective, le ballon finit au fond des filets !",
      "Quelle frappe de {player} ! Le gardien ne peut rien faire !",
    ]
  },
  {
    eventType: 'shot_on_target',
    outcome: 'failure',
    templates: [
      "{player} tente sa chance mais {goalkeeper} repousse du poing !",
      "Belle frappe de {player}, mais le gardien {goalkeeper} est impérial !",
      "{player} décoche un tir cadré, {goalkeeper} plonge et détourne !",
    ]
  },
  {
    eventType: 'yellow_card',
    outcome: 'neutral',
    templates: [
      "Carton jaune pour {player}, tacle trop appuyé.",
      "L'arbitre sort le carton jaune ! {player} est averti.",
      "{player} écope d'un avertissement pour son intervention.",
    ]
  },
  // ... ~50-100 templates au total couvrant tous les types d'événements
];
```

#### Variables disponibles dans les templates

| Variable | Description |
|---|---|
| `{player}` | Nom du joueur principal |
| `{player2}` | Joueur secondaire (passeur, remplacé, etc.) |
| `{goalkeeper}` | Nom du gardien adverse |
| `{team}` | Nom de l'équipe |
| `{opponent}` | Nom de l'équipe adverse |
| `{minute}` | Minute du match |
| `{score}` | Score actuel après l'événement |

#### Sélection des templates

- Un template est choisi **aléatoirement** parmi les variantes disponibles pour le type d'événement.
- **Anti-répétition** : les 3 derniers templates utilisés sont exclus de la sélection.
- Le commentaire est stocké dans le champ `metadata.comment` de l'événement.

### 5.9 Système de passes décisives (Assists)

Le moteur maintient en mémoire le **dernier passeur** pour chaque séquence offensive.

```
Règle d'attribution d'une passe décisive :
1. Si un but est marqué, le joueur qui a effectué la dernière passe réussie
   dans la même séquence offensive est crédité d'une assist.
2. Une séquence offensive se réinitialise quand :
   - L'équipe perd la possession
   - Un coup de pied arrêté est tiré (corner, coup franc, penalty)
   - Plus de 3 minutes se sont écoulées depuis la dernière passe
3. Un joueur ne peut pas se faire une passe décisive à lui-même.
4. Le tireur de corner/coup franc qui mène à un but de la tête est crédité d'une assist.
```

### 5.10 Stats spécifiques du gardien

Le gardien utilise un jeu de stats dédié, différent des joueurs de champ :

| Stat gardien | Plage | Utilisée pour |
|---|---|---|
| `reflexes` | 1-99 | Arrêts réflexes, tirs de près |
| `diving` | 1-99 | Plongeons latéraux, frappes puissantes |
| `handling` | 1-99 | Maîtrise du ballon, sorties aériennes (capter vs repousser) |
| `positioning` | 1-99 | Placement sur la ligne, réduction d'angle |
| `kicking` | 1-99 | Relances longues, précision de distribution |
| `communication` | 1-99 | Organisation de la défense (bonus défensif pour l'équipe) |

**Impact en simulation :**

- **Tir cadré** → résolution : `(shooting + finishing) / 2` vs `(reflexes + diving + positioning) / 3`
- **Centre/corner** → sortie aérienne : `handling` vs `heading` de l'attaquant
- **Penalty** → résolution : `penalties` du tireur vs `(reflexes + diving) / 2`
- **Communication** → bonus passif : `communication / 200` ajouté au score défensif global de l'équipe

---

## 6. Système tactique en match

### 6.1 Mentalité

Le joueur choisit une mentalité qui influence les probabilités du moteur :

| Mentalité | Effet possession | Effet offensif | Effet défensif | Description |
|---|---|---|---|---|
| `ULTRA_DEFENSIVE` | -15% | -25% | +25% | Bloc bas, tout le monde défend |
| `DEFENSIVE` | -5% | -10% | +15% | Jeu prudent, contres |
| `BALANCED` | 0% | 0% | 0% | Équilibre standard |
| `OFFENSIVE` | +5% | +15% | -10% | Pressing haut, jeu vers l'avant |
| `ULTRA_OFFENSIVE` | +10% | +25% | -20% | Tout offensif, risques max |

### 6.2 Consignes tactiques

En plus de la mentalité, le joueur configure des consignes :

| Consigne | Options | Impact simulation |
|---|---|---|
| **Pressing** | `low` / `medium` / `high` | Fréquence d'interceptions hautes. High = +récupérations mais +fatigue |
| **Style de passe** | `short` / `mixed` / `long` | Ratio passes courtes/longues. Long = plus de traversées mais moins précis |
| **Largeur** | `narrow` / `normal` / `wide` | Narrow = jeu axial. Wide = plus de centres |
| **Tempo** | `slow` / `normal` / `fast` | Fast = plus d'actions par minute mais plus d'erreurs |
| **Ligne défensive** | `deep` / `normal` / `high` | High = pressing + offside trap. Deep = moins d'espace pour l'adversaire |

### 6.3 Contraintes d'interaction en match

- **Changement de mentalité** : cooldown de **5 minutes réelles** entre chaque changement.
- **Changement de consignes** : même cooldown, mais les consignes peuvent être modifiées en lot (toutes en même temps = 1 seul cooldown).
- **Remplacements** : max **5 par match**, pas de cooldown entre eux, mais un remplacement prend effet à la **minute suivante**.
- **Pendant la mi-temps** : pas de cooldown, le joueur peut tout ajuster librement.

---

## 7. Gestion de la mi-temps

### 7.1 Déclenchement

- La mi-temps commence à la minute 45 + temps additionnel de la 1ère mi-temps.
- Durée : **5 minutes réelles**.

### 7.2 Actions possibles pendant la mi-temps

- Modifier la mentalité (sans cooldown)
- Modifier toutes les consignes (sans cooldown)
- Effectuer des remplacements (décomptés du total de 5)
- Consulter les stats détaillées de la première mi-temps

### 7.3 Événement Socket.io

Un événement `match:half-time` est envoyé avec :
- Stats de la 1ère mi-temps
- Temps restant avant la reprise

---

## 8. Post-match

### 8.1 Fin du match

À la minute 90 + temps additionnel :
1. L'état passe à `FINISHED`
2. Le score final est figé
3. Un événement `match:finished` est broadcast

### 8.2 Traitement post-match (asynchrone)

Un job BullMQ `match:post-process` est déclenché :

1. **Calcul des stats agrégées** : possession, tirs, tirs cadrés, corners, fautes, cartons, hors-jeu par équipe
2. **Stats individuelles** : note de match (1-10), minutes jouées, buts, passes décisives, tirs, tacles, interceptions, km parcourus (simulé)
3. **Calcul des notes joueurs** (rating) : basé sur les actions réussies/ratées pendant le match
4. **Mise à jour de la fatigue** : chaque joueur ayant joué voit sa fatigue augmenter proportionnellement aux minutes jouées et à l'intensité
5. **Mise à jour du classement** : victoire = 3pts, nul = 1pt, défaite = 0pt
6. **Détection des suspensions** : joueur avec 2ème jaune ou rouge direct → suspendu pour le prochain match
7. **Blessures** : joueurs blessés en match → indisponibles pour X matchs (selon gravité)

### 8.3 Résumé du match

Le résumé est accessible dans l'historique et contient :

- Score final
- Chronologie des événements clés (buts, cartons, remplacements, blessures)
- Statistiques d'équipe (tableau comparatif)
- Statistiques individuelles avec note de match
- Composition des deux équipes
- Changements tactiques effectués

---

## 9. Résilience & Reprise

### 9.1 État persistant

L'état complet du match est sauvegardé **en Redis** à chaque minute :

```typescript
interface MatchLiveState {
  matchId: string;
  status: MatchStatus;
  currentMinute: number;
  score: { home: number; away: number };
  possession: { home: number; away: number };
  events: MatchEvent[];          // Tous les événements jusqu'ici
  lineups: MatchLineup;          // Compos actuelles (après remplacements)
  tactics: { home: TacticConfig; away: TacticConfig };
  fatigue: Record<string, number>; // playerId → fatigue actuelle
  substitutionsUsed: { home: number; away: number };
  cards: Record<string, CardInfo>; // playerId → cartons reçus
  injuries: string[];             // playerIds blessés
  addedTime: { firstHalf: number; secondHalf: number };
}
```

### 9.2 Reprise après crash

Si le serveur redémarre pendant un match :

1. Le job `match:recovery` scanne les matchs en état `FIRST_HALF`, `HALF_TIME`, ou `SECOND_HALF`.
2. Pour chaque match, il récupère le `MatchLiveState` depuis Redis.
3. Il calcule le nombre de minutes manquées (temps réel écoulé depuis la dernière minute simulée).
4. **Si retard < 3 min** : rattrapage rapide (simulation des minutes manquées en accéléré, ~1s entre chaque).
5. **Si retard > 3 min** : simulation accélérée de toutes les minutes manquées, puis reprise en temps réel.
6. Les événements générés pendant le rattrapage sont envoyés en lot au frontend.

### 9.3 Sauvegarde DB

En plus de Redis (état live), les événements sont écrits en base PostgreSQL au fil de l'eau. Si Redis est perdu, on peut reconstruire l'état depuis la DB.

---

## 10. Modèle de données

### 10.1 Table `matches`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | Identifiant unique |
| `competition_id` | `uuid` FK | Compétition (championnat) |
| `matchday` | `integer` | Numéro de journée |
| `home_club_id` | `uuid` FK | Club à domicile |
| `away_club_id` | `uuid` FK | Club à l'extérieur |
| `scheduled_at` | `timestamp` | Heure de coup d'envoi planifiée |
| `started_at` | `timestamp` | Heure réelle de début (null si pas encore) |
| `finished_at` | `timestamp` | Heure de fin (null si pas encore) |
| `status` | `enum` | `scheduled`, `pre_match`, `first_half`, `half_time`, `second_half`, `finished`, `post_match`, `cancelled`, `forfeit` |
| `home_score` | `integer` | Score domicile |
| `away_score` | `integer` | Score extérieur |
| `added_time_first_half` | `integer` | Minutes additionnelles 1ère mi-temps |
| `added_time_second_half` | `integer` | Minutes additionnelles 2ème mi-temps |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

### 10.2 Table `match_events`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `match_id` | `uuid` FK | Match associé |
| `minute` | `integer` | Minute du match (1-90+) |
| `type` | `enum` | Voir liste ci-dessous |
| `team_id` | `uuid` FK | Équipe concernée |
| `player_id` | `uuid` FK | Joueur principal (nullable) |
| `secondary_player_id` | `uuid` FK | Joueur secondaire (passeur, remplacé, etc.) |
| `zone` | `enum` | `defense`, `midfield`, `attack` |
| `outcome` | `enum` | `success`, `failure`, `neutral` |
| `metadata` | `jsonb` | Données additionnelles (commentaire, détails) |
| `created_at` | `timestamp` | |

**Types d'événements (`match_event_type`)** :

| Type | Description | Visible joueur |
|---|---|---|
| `goal` | But marqué | Oui (majeur) |
| `shot_on_target` | Tir cadré (arrêt gardien) | Oui |
| `shot_off_target` | Tir non cadré | Oui |
| `shot_blocked` | Tir contré | Oui |
| `pass_completed` | Passe réussie | Non (stat uniquement) |
| `pass_intercepted` | Passe interceptée | Selon contexte |
| `cross` | Centre | Oui (si occasion) |
| `dribble_success` | Dribble réussi | Oui |
| `dribble_fail` | Dribble raté | Non |
| `tackle_success` | Tacle réussi | Oui (si récupération clé) |
| `tackle_fail` | Tacle raté | Selon contexte |
| `foul` | Faute commise | Oui |
| `yellow_card` | Carton jaune | Oui (majeur) |
| `red_card` | Carton rouge | Oui (majeur) |
| `injury` | Blessure | Oui (majeur) |
| `substitution` | Remplacement | Oui |
| `tactical_change` | Changement tactique | Oui |
| `free_kick` | Coup franc | Oui |
| `corner` | Corner | Oui |
| `offside` | Hors-jeu | Oui |
| `penalty` | Penalty | Oui (majeur) |
| `save` | Arrêt du gardien | Oui |
| `clearance` | Dégagement | Non |
| `possession_change` | Changement de possession | Non (stat) |
| `half_time_start` | Début mi-temps | Oui (système) |
| `half_time_end` | Fin mi-temps | Oui (système) |
| `kick_off` | Coup d'envoi | Oui (système) |
| `full_time` | Coup de sifflet final | Oui (système) |

### 10.3 Table `match_lineups`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `match_id` | `uuid` FK | |
| `club_id` | `uuid` FK | |
| `player_id` | `uuid` FK | |
| `position` | `enum` | GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, CF |
| `is_starter` | `boolean` | Titulaire ou remplaçant |
| `minute_in` | `integer` | Minute d'entrée (0 pour titulaires) |
| `minute_out` | `integer` | Minute de sortie (null si a joué jusqu'au bout) |
| `rating` | `decimal(3,1)` | Note de match (1.0 - 10.0) |
| `created_at` | `timestamp` | |

### 10.4 Table `match_stats`

Stats agrégées par équipe par match.

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `match_id` | `uuid` FK | |
| `club_id` | `uuid` FK | |
| `possession` | `decimal(4,1)` | % de possession |
| `shots` | `integer` | Tirs totaux |
| `shots_on_target` | `integer` | Tirs cadrés |
| `passes` | `integer` | Passes totales |
| `pass_accuracy` | `decimal(4,1)` | % précision passes |
| `fouls` | `integer` | Fautes commises |
| `corners` | `integer` | Corners obtenus |
| `offsides` | `integer` | Hors-jeu |
| `yellow_cards` | `integer` | Cartons jaunes |
| `red_cards` | `integer` | Cartons rouges |
| `saves` | `integer` | Arrêts du gardien |
| `tackles` | `integer` | Tacles réussis |
| `interceptions` | `integer` | Interceptions |
| `created_at` | `timestamp` | |

### 10.5 Table `match_player_stats`

Stats individuelles par joueur par match.

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `match_id` | `uuid` FK | |
| `player_id` | `uuid` FK | |
| `club_id` | `uuid` FK | |
| `minutes_played` | `integer` | Minutes jouées |
| `goals` | `integer` | Buts marqués |
| `assists` | `integer` | Passes décisives |
| `shots` | `integer` | Tirs |
| `shots_on_target` | `integer` | Tirs cadrés |
| `passes` | `integer` | Passes |
| `pass_accuracy` | `decimal(4,1)` | % précision passes |
| `tackles` | `integer` | Tacles |
| `interceptions` | `integer` | Interceptions |
| `fouls_committed` | `integer` | Fautes commises |
| `fouls_suffered` | `integer` | Fautes subies |
| `yellow_cards` | `integer` | Cartons jaunes (0 ou 1) |
| `red_card` | `boolean` | Carton rouge |
| `rating` | `decimal(3,1)` | Note de match (1.0 - 10.0) |
| `distance_km` | `decimal(4,1)` | Distance parcourue (simulée) |
| `fatigue_start` | `integer` | Fatigue en début de match |
| `fatigue_end` | `integer` | Fatigue en fin de match |
| `created_at` | `timestamp` | |

### 10.6 Table `match_tactical_changes`

Historique des changements tactiques en match.

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `match_id` | `uuid` FK | |
| `club_id` | `uuid` FK | |
| `minute` | `integer` | Minute du changement |
| `mentality` | `enum` | Nouvelle mentalité |
| `pressing` | `enum` | `low`, `medium`, `high` |
| `passing_style` | `enum` | `short`, `mixed`, `long` |
| `width` | `enum` | `narrow`, `normal`, `wide` |
| `tempo` | `enum` | `slow`, `normal`, `fast` |
| `defensive_line` | `enum` | `deep`, `normal`, `high` |
| `created_at` | `timestamp` | |

---

## 11. API Endpoints

### 11.1 Consultation

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/matches` | Liste des matchs (filtres : compétition, club, statut, date) |
| `GET` | `/matches/:id` | Détails d'un match (état, score, stats) |
| `GET` | `/matches/:id/events` | Liste des événements d'un match |
| `GET` | `/matches/:id/lineups` | Compositions des deux équipes |
| `GET` | `/matches/:id/stats` | Stats agrégées du match |
| `GET` | `/matches/:id/player-stats` | Stats individuelles des joueurs |
| `GET` | `/matches/:id/summary` | Résumé complet post-match |
| `GET` | `/matches/live` | Liste des matchs en cours pour le joueur connecté |
| `GET` | `/matches/upcoming` | Prochains matchs du joueur |

### 11.2 Interactions en match

| Méthode | Route | Description | Contraintes |
|---|---|---|---|
| `POST` | `/matches/:id/tactics` | Modifier la tactique | Cooldown 5 min, match en cours, propre équipe |
| `POST` | `/matches/:id/substitution` | Effectuer un remplacement | Max 5/match, joueur doit être sur le banc |

#### `POST /matches/:id/tactics`

**Request :**
```json
{
  "mentality": "offensive",
  "pressing": "high",
  "passingStyle": "short",
  "width": "wide",
  "tempo": "fast",
  "defensiveLine": "high"
}
```

**Réponses :**
- `200` : Tactique mise à jour, appliquée à la prochaine minute simulée.
- `400` : Paramètres invalides.
- `403` : Ce n'est pas votre équipe / match pas en cours.
- `429` : Cooldown actif (retourne `retryAfter` en secondes).

#### `POST /matches/:id/substitution`

**Request :**
```json
{
  "playerOutId": "uuid",
  "playerInId": "uuid",
  "position": "CM"
}
```

**Réponses :**
- `200` : Remplacement enregistré, effectif à la prochaine minute.
- `400` : Joueur pas dans le match / pas sur le banc / position invalide.
- `403` : Ce n'est pas votre équipe / match pas en cours.
- `409` : Nombre max de remplacements atteint.

---

## 12. Événements Socket.io

### 12.1 Rooms

- `match:{matchId}` — Room du match. Les clients rejoignent cette room quand ils ouvrent la page d'un match.

### 12.2 Événements serveur → client

| Événement | Payload | Description |
|---|---|---|
| `match:status` | `{ matchId, status, minute }` | Changement d'état du match |
| `match:event` | `MatchEvent` | Nouvel événement de match (chaque minute qui a un événement visible) |
| `match:score` | `{ matchId, home, away }` | Mise à jour du score |
| `match:stats` | `MatchStats` | Stats temps réel mises à jour (toutes les 5 min ou après événement majeur) |
| `match:minute` | `{ matchId, minute }` | Tick de minute (même sans événement notable, pour le chrono) |
| `match:half-time` | `{ matchId, stats }` | Début de la mi-temps avec stats 1ère mi-temps |
| `match:finished` | `{ matchId, finalScore, summary }` | Fin du match |
| `match:tactical-change` | `{ matchId, clubId, changes }` | Confirmation d'un changement tactique |
| `match:substitution` | `{ matchId, clubId, playerIn, playerOut, minute }` | Confirmation d'un remplacement |

### 12.3 Événements client → serveur

| Événement | Payload | Description |
|---|---|---|
| `match:join` | `{ matchId }` | Rejoindre la room d'un match |
| `match:leave` | `{ matchId }` | Quitter la room |

> Note : Les actions tactiques et remplacements passent par l'API REST (pas par Socket.io) pour garantir la validation et l'authentification.

---

## 13. Affichage Frontend (UX)

### 13.1 Vue match en direct

**Layout principal :**
```
┌──────────────────────────────────────────────────┐
│  [Club A]  2 - 1  [Club B]         45'+2  ●LIVE  │
├──────────────────────────────────────────────────┤
│                                                   │
│  TIMELINE DES ÉVÉNEMENTS (scroll vertical)        │
│                                                   │
│  65' ⚽ But ! Dupont (passe de Martin)            │
│  63' 🟨 Carton jaune - Rodriguez                  │
│  58' 🔄 Remplacement : Silva → Dupont            │
│  52' 🥅 Tir cadré de Lefebvre, arrêt du gardien  │
│  46' 🟢 Coup d'envoi 2ème mi-temps               │
│  --- MI-TEMPS (2-1) ---                           │
│  43' ⚽ But ! Martin (coup franc)                 │
│  ...                                              │
│                                                   │
├──────────────────────────────────────────────────┤
│  STATS EN DIRECT                                  │
│  Possession  58% ████████░░ 42%                   │
│  Tirs         8  ████░░░░░░  4                    │
│  Tirs cadrés  4  ████░░░░░░  2                    │
│  Fautes       3  ███░░░░░░░  5                    │
│  Corners      4  ████░░░░░░  1                    │
├──────────────────────────────────────────────────┤
│  [PANNEAU TACTIQUE]          [REMPLACEMENTS]      │
│  Mentalité: Offensif ▼       Silva → Dupont  58'  │
│  Pressing: Haut ▼            [Faire un remplact.] │
│  Tempo: Rapide ▼             Restants: 4/5        │
│  [Appliquer] (cooldown 4:32)                      │
└──────────────────────────────────────────────────┘
```

### 13.2 Vue résumé post-match

- Score final en grand
- Chronologie visuelle des événements clés (buts, cartons, remplacements)
- Tableau de stats comparatif (comme FlashScore)
- Notes individuelles des joueurs (meilleur joueur mis en avant)
- Compositions des deux équipes

---

## 14. User Stories complètes

### Planification & Déclenchement

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| MATCH-01 | Joueur | Voir le planning de mes prochains matchs avec date, heure et adversaire | Me préparer aux prochaines rencontres | Liste triée par date, statut visible, lien vers détail |
| MATCH-02 | Système | Déclencher automatiquement le pré-match 15 min avant le coup d'envoi | Valider les compositions et préparer le match | Job BullMQ fiable, compositions validées et corrigées |
| MATCH-03 | Système | Reconduire automatiquement la dernière composition si le joueur n'a rien modifié | Que le match puisse toujours se jouer | Composition reconduite, corrections automatiques appliquées |
| MATCH-04 | Joueur | Recevoir une notification 15 min et 5 min avant mon match | Ne pas rater le coup d'envoi | Notifications in-app envoyées aux bonnes heures |

### Simulation & Suivi en direct

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| MATCH-05 | Joueur | Suivre mon match en temps réel avec un chrono, le score et les événements | Vivre le match comme un vrai supporter | Timeline mise à jour en temps réel, chrono synchronisé |
| MATCH-06 | Joueur | Voir les stats en direct (possession, tirs, etc.) pendant le match | Évaluer la performance de mon équipe | Stats rafraîchies toutes les 5 min ou après événement majeur |
| MATCH-07 | Système | Simuler chaque minute du match avec des événements basés sur les stats des joueurs | Produire un match réaliste et engageant | ~40-50% des minutes ont un événement visible |
| MATCH-08 | Système | Calculer le temps additionnel en fin de mi-temps | Ajouter du réalisme | 1-5 min calculées selon les événements |
| MATCH-09 | Joueur | Que le match se joue même si je ne suis pas connecté | Jouer sans contrainte de présence | Match simulé intégralement côté serveur |

### Interactions tactiques

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| MATCH-10 | Joueur | Modifier la mentalité de mon équipe en match | Adapter ma stratégie en direct | Cooldown 5 min, effet à la minute suivante |
| MATCH-11 | Joueur | Modifier les consignes tactiques (pressing, tempo, etc.) en match | Affiner ma stratégie | Modifiable en lot, même cooldown que mentalité |
| MATCH-12 | Joueur | Effectuer un remplacement pendant le match | Optimiser mon équipe | Max 5, joueur doit être sur le banc, effet minute +1 |
| MATCH-13 | Joueur | Ajuster librement ma tactique et mes remplacements à la mi-temps | Corriger le tir à la pause | Aucun cooldown pendant la mi-temps (5 min) |
| MATCH-14 | Joueur | Voir clairement le cooldown restant avant de pouvoir modifier ma tactique | Savoir quand je peux agir | Timer visible dans le panneau tactique |

### Post-match

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| MATCH-15 | Joueur | Voir le résumé complet du match une fois terminé | Analyser mes performances | Score, chronologie, stats équipe, stats joueurs |
| MATCH-16 | Joueur | Voir la note de chaque joueur après le match | Identifier mes meilleurs/pires joueurs | Note 1-10, basée sur les actions en match |
| MATCH-17 | Joueur | Accéder à l'historique de tous mes matchs passés | Suivre ma progression | Liste filtrable, accès aux résumés |
| MATCH-18 | Système | Mettre à jour le classement après chaque match | Maintenir la compétition à jour | 3pts victoire, 1pt nul, 0pt défaite |
| MATCH-19 | Système | Appliquer les suspensions (cartons) et blessures post-match | Impacter la gestion d'effectif | Joueurs indisponibles correctement marqués |

### Résilience

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| MATCH-20 | Système | Reprendre un match en cours après un redémarrage serveur | Ne jamais perdre un match | État Redis restauré, rattrapage des minutes manquées |
| MATCH-21 | Joueur | Pouvoir me reconnecter à un match en cours et retrouver tout l'historique | Ne rien rater si je me déconnecte | Tous les événements passés chargés, chrono synchronisé |

---

## 15. Stratégie de tests

### Tests unitaires (Vitest)

- **Moteur de simulation** : tester chaque type d'action (passe, tir, dribble...) avec des stats joueurs fixées et vérifier que les probabilités sont cohérentes.
- **Calcul de possession** : vérifier que les facteurs (tactique, fatigue, pressing) influencent correctement la possession.
- **Temps additionnel** : vérifier le calcul selon les événements.
- **Validation de composition** : tester les cas de correction automatique (joueur blessé, effectif incomplet, forfait).
- **Cooldown tactique** : vérifier le respect du cooldown de 5 min.
- **Résolution des cartons/blessures** : vérifier les probabilités et les impacts.

### Tests d'intégration

- **Cycle complet d'un match** : simuler un match de bout en bout (pré-match → 1ère mi-temps → mi-temps → 2ème mi-temps → fin) et vérifier la cohérence des données.
- **Interactions en match** : vérifier que les changements tactiques et remplacements sont correctement appliqués via l'API.
- **Socket.io** : vérifier que les événements sont correctement broadcast aux clients connectés.
- **Reprise après crash** : simuler un redémarrage et vérifier le rattrapage.

### Tests de charge (post-MVP)

- Simuler N matchs en parallèle pour valider la capacité du serveur.
- Mesurer la consommation mémoire/CPU par match.

---

## 16. Décisions de design prises

| Question | Décision | Section |
|---|---|---|
| Commentaires narratifs | Oui, via templates (~50-100) dès le MVP | 5.8 |
| Passes décisives (assists) | Trackées dès le MVP | 5.9 |
| Coups de pied arrêtés | Sous-routines dédiées (corner, coup franc, penalty) | 5.7 |
| Stats gardien | Stats spécifiques (reflexes, diving, handling, positioning, kicking, communication) | 5.10 |
| Durée match | 90 minutes réelles (1 min simulée = 1 min réelle) | 2 |
| Mi-temps | 5 minutes réelles de pause | 7 |
| Scheduling | Créneau unique configurable par ligue | 4.1 |
| Prolongations | Post-MVP | 2 |
| Spectateurs | Post-MVP | 2 |

---

*Spec rédigée le 2026-03-02. À valider avant implémentation.*
