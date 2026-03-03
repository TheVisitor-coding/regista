# SPEC-04 : Gestion d'Effectif & Joueurs

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-01 (Auth), SPEC-02 (Club & Dashboard)
> **Dépendants** : SPEC-03 (Match), SPEC-06 (Transferts)
> **Dernière mise à jour** : 2026-03-02

---

## 1. Objectif

Permettre au joueur de **gérer efficacement son effectif** : consulter les fiches joueurs, composer son équipe, choisir une formation et une tactique, désigner les tireurs spéciaux, et suivre la condition physique de ses joueurs.

Ce système est le socle de l'expérience de gestion. Il alimente directement le moteur de simulation (SPEC-03) et le système de transferts (SPEC-06).

---

## 2. Système de stats des joueurs

### 2.1 Stats des joueurs de champ (15 stats)

Chaque joueur de champ possède 15 statistiques réparties en 4 catégories, chacune notée de **1 à 99** :

#### Physique (4)

| Stat | ID | Description | Impact moteur principal |
|---|---|---|---|
| Vitesse | `pace` | Rapidité de course, sprint | Courses, contre-attaques, duels de vitesse |
| Endurance | `stamina` | Capacité à maintenir l'effort | Résistance à la fatigue, pressing, activité |
| Puissance | `strength` | Force physique, duels corporels | Duels aériens/au sol, résistance aux tacles |
| Agilité | `agility` | Changements de direction, réactivité | Dribbles, esquives, premières touches |

#### Technique (5)

| Stat | ID | Description | Impact moteur principal |
|---|---|---|---|
| Passe | `passing` | Précision et qualité des passes | Passes courtes/longues, conservation |
| Tir | `shooting` | Puissance et précision de frappe | Tirs, frappes lointaines |
| Dribble | `dribbling` | Contrôle de balle, dribble | Dribbles, élimination, conservation sous pression |
| Centre | `crossing` | Précision des centres | Centres depuis les ailes, corners |
| Jeu de tête | `heading` | Jeu aérien offensif et défensif | Duels aériens, buts de la tête, dégagements |

#### Mental (4)

| Stat | ID | Description | Impact moteur principal |
|---|---|---|---|
| Vision | `vision` | Lecture du jeu, anticipation | Passes décisives, ouvertures, choix tactiques |
| Sang-froid | `composure` | Calme sous pression | Finition en situation de but, penalties |
| Activité | `workRate` | Volume de jeu, engagement | Pressing, replis défensifs, courses totales |
| Placement | `positioning` | Sens du placement sans ballon | Appels de balle, démarquages, couverture défensive |

#### Défense (2)

| Stat | ID | Description | Impact moteur principal |
|---|---|---|---|
| Tacle | `tackling` | Qualité des interventions défensives | Tacles, récupérations, duels défensifs |
| Marquage | `marking` | Couverture et suivi de l'adversaire | Positionnement défensif, marquage en zone/individuel |

### 2.2 Stats des gardiens (6 stats spécifiques)

Les gardiens n'utilisent **pas** les stats de champ. Ils ont un jeu de stats dédié (défini en SPEC-03 §5.10) :

| Stat | ID | Plage | Description |
|---|---|---|---|
| Réflexes | `reflexes` | 1-99 | Arrêts réflexes, tirs de près |
| Plongeon | `diving` | 1-99 | Plongeons latéraux, frappes puissantes |
| Maîtrise | `handling` | 1-99 | Prise de balle, sorties aériennes |
| Placement | `positioning` | 1-99 | Position sur la ligne, réduction d'angle |
| Relance | `kicking` | 1-99 | Relances longues, distribution |
| Communication | `communication` | 1-99 | Organisation de la défense |

### 2.3 Stats spéciales (tous les joueurs)

En plus des stats de base, chaque joueur possède :

| Stat | ID | Plage | Description |
|---|---|---|---|
| Penalties | `penalties` | 1-99 | Capacité à tirer les penalties |
| Coup franc | `freeKick` | 1-99 | Capacité à tirer les coups francs |

### 2.4 Calcul de l'Overall

L'overall (note globale) est une **moyenne pondérée** des stats selon le poste du joueur :

```typescript
const POSITION_WEIGHTS: Record<Position, Record<string, number>> = {
  GK: { reflexes: 20, diving: 20, handling: 20, positioning: 20, kicking: 10, communication: 10 },
  CB: { tackling: 20, marking: 20, heading: 15, strength: 15, positioning: 15, composure: 10, pace: 5 },
  LB: { pace: 15, tackling: 15, marking: 10, crossing: 15, stamina: 15, passing: 10, positioning: 10, workRate: 10 },
  RB: { pace: 15, tackling: 15, marking: 10, crossing: 15, stamina: 15, passing: 10, positioning: 10, workRate: 10 },
  CDM: { tackling: 20, marking: 15, passing: 15, positioning: 15, stamina: 10, strength: 10, workRate: 10, vision: 5 },
  CM: { passing: 20, vision: 15, stamina: 15, workRate: 10, tackling: 10, shooting: 10, positioning: 10, composure: 10 },
  CAM: { vision: 20, passing: 20, shooting: 15, dribbling: 15, composure: 15, agility: 10, positioning: 5 },
  LW: { pace: 20, dribbling: 20, crossing: 15, shooting: 10, agility: 15, stamina: 10, workRate: 10 },
  RW: { pace: 20, dribbling: 20, crossing: 15, shooting: 10, agility: 15, stamina: 10, workRate: 10 },
  ST: { shooting: 25, composure: 15, positioning: 15, heading: 10, pace: 10, dribbling: 10, strength: 10, agility: 5 },
  CF: { shooting: 20, passing: 15, vision: 15, composure: 15, dribbling: 10, positioning: 15, heading: 10 },
};

function calculateOverall(player: Player): number {
  const weights = POSITION_WEIGHTS[player.position];
  let total = 0;
  for (const [stat, weight] of Object.entries(weights)) {
    total += player.stats[stat] * weight;
  }
  return Math.round(total / 100);
}
```

---

## 3. Positions & Polyvalence

### 3.1 Positions disponibles

12 positions dans le jeu (défini en SPEC-03) :

| Position | Code | Ligne | Description |
|---|---|---|---|
| Gardien | `GK` | GK | Gardien de but |
| Défenseur central | `CB` | DEF | Axe de la défense |
| Arrière gauche | `LB` | DEF | Couloir gauche défensif |
| Arrière droit | `RB` | DEF | Couloir droit défensif |
| Milieu défensif | `CDM` | MID | Sentinelle, récupérateur |
| Milieu central | `CM` | MID | Box-to-box, organisateur |
| Milieu offensif | `CAM` | MID | Meneur de jeu, créateur |
| Ailier gauche | `LW` | ATT | Couloir gauche offensif |
| Ailier droit | `RW` | ATT | Couloir droit offensif |
| Avant-centre | `ST` | ATT | Buteur, pointe de l'attaque |
| Attaquant de soutien | `CF` | ATT | Faux 9, attaquant reculé |

> Note : `GK` est exclusif. Un gardien ne peut pas jouer à un autre poste et inversement.

### 3.2 Système de polyvalence

Chaque joueur a :
- **1 poste principal** (naturel) → 100% de ses stats
- **1-2 postes secondaires** (accompli) → 90% de ses stats
- Tout autre poste de la même ligne → 75% de ses stats
- Poste d'une ligne différente → 60% de ses stats

| Niveau de compatibilité | Label | Modificateur stats | Couleur UI |
|---|---|---|---|
| Naturel | Poste principal | 100% | 🟢 Vert |
| Accompli | Poste secondaire | 90% | 🟡 Jaune-vert |
| Dépaysé | Même ligne, autre poste | 75% | 🟠 Orange |
| Inadapté | Ligne différente | 60% | 🔴 Rouge |

**Exemple** : Un joueur `CM` avec poste secondaire `CDM` :
- En `CM` : 100% → overall affiché normal
- En `CDM` : 90% → overall effectif réduit
- En `CAM` (même ligne MID) : 75%
- En `CB` (ligne différente DEF) : 60%

**Affichage** : l'overall affiché sur la fiche joueur est celui du poste naturel. Quand le joueur est placé hors poste dans la composition, l'overall effectif est affiché avec un indicateur de malus.

### 3.3 Règles GK

- Un joueur de champ ne peut **jamais** être placé en GK (modificateur 0%).
- Un GK ne peut **jamais** être placé en joueur de champ (modificateur 0%).
- Si le GK est expulsé et qu'il n'y a plus de GK sur le banc, un joueur de champ prend sa place avec un overall GK fixé à 20 (très mauvais).

---

## 4. Formations

### 4.1 Formations disponibles (MVP)

8 formations avec leur mapping de positions :

| Formation | Postes | Style |
|---|---|---|
| **4-4-2** | GK, LB, CB, CB, RB, LW, CM, CM, RW, ST, ST | Classique équilibré |
| **4-3-3** | GK, LB, CB, CB, RB, CM, CM, CM, LW, ST, RW | Offensif ailiers |
| **4-2-3-1** | GK, LB, CB, CB, RB, CDM, CDM, LW, CAM, RW, ST | Meneur + ailiers |
| **3-5-2** | GK, CB, CB, CB, LW, CDM, CM, CM, RW, ST, ST | Milieu dense |
| **3-4-3** | GK, CB, CB, CB, LW, CM, CM, RW, LW, ST, RW | Très offensif |
| **4-5-1** | GK, LB, CB, CB, RB, LW, CM, CDM, CM, RW, ST | Défensif + contres |
| **5-3-2** | GK, LB, CB, CB, CB, RB, CM, CM, CM, ST, ST | Défensif 3 centraux |
| **5-4-1** | GK, LB, CB, CB, CB, RB, LW, CM, CM, RW, ST | Ultra défensif |

> Note : dans les formations à 3 défenseurs centraux, les LW/RW en milieu font office de pistons (wingbacks). Le moteur adapte leur comportement en conséquence (plus de courses, plus de centres, plus de fatigue).

### 4.2 Changement de formation

- Le joueur peut changer de formation **avant un match** sans restriction.
- En match (SPEC-03), le changement de formation n'est **pas disponible dans le MVP**. Seules la mentalité et les consignes tactiques sont modifiables.
- Le changement de formation en match sera ajouté post-MVP.

---

## 5. Composition d'équipe

### 5.1 Règles de composition

| Règle | Valeur |
|---|---|
| Titulaires | 11 joueurs obligatoires |
| Banc | 7 joueurs maximum |
| Convoqués total | 18 joueurs max par match |
| GK requis | Au moins 1 GK titulaire, 1 GK sur le banc recommandé |
| Joueurs inaptes | Blessés et suspendus ne peuvent pas être convoqués |
| Poste obligatoire | Chaque poste de la formation doit être occupé |

### 5.2 Validation de la composition

La composition est validée selon ces critères :

```
1. Exactement 11 titulaires
2. Entre 0 et 7 remplaçants
3. 1 GK titulaire obligatoire
4. Chaque poste de la formation est occupé par un joueur
5. Aucun joueur blessé ou suspendu dans la sélection
6. Aucun joueur en doublon (pas 2 fois le même joueur)
7. Tous les joueurs appartiennent au club
```

**Warnings (non bloquants)** :
- Pas de GK sur le banc → avertissement
- Joueur avec fatigue > 80% titulaire → avertissement
- Joueur hors poste (compatibilité < 75%) → avertissement avec malus affiché

### 5.3 Composition automatique

Le bouton "Auto" génère une composition optimisée :

```
Algorithme AutoLineup :
1. Charger la formation sélectionnée → liste des postes requis
2. Pour chaque poste, classer les joueurs aptes par :
   a. Compatibilité au poste (naturel > accompli > dépaysé)
   b. Overall effectif (après modificateur de poste)
   c. Fatigue (préférer les joueurs reposés, < 60%)
3. Assigner le meilleur joueur disponible à chaque poste (sans doublon)
4. Remplir le banc avec les meilleurs joueurs restants (variété de postes)
5. Toujours inclure 1 GK sur le banc si disponible
```

### 5.4 Interface de composition

```
┌──────────────────────────────────────────────────────────────┐
│  COMPOSITION          Formation: [4-3-3 ▼]    [Auto] [Sauver]│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                     ┌─────────┐                               │
│                     │ ST  78  │                               │
│                     │ Dupont  │                               │
│                     └─────────┘                               │
│           ┌─────────┐           ┌─────────┐                  │
│           │ LW  72  │           │ RW  75  │                  │
│           │ Silva   │           │ Martin  │                  │
│           └─────────┘           └─────────┘                  │
│      ┌─────────┐  ┌─────────┐  ┌─────────┐                  │
│      │ CM  70  │  │ CM  74  │  │ CM  68  │                  │
│      │ Garcia  │  │ Rodriguez│  │ Petit   │                  │
│      └─────────┘  └─────────┘  └─────────┘                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ LB  66  │ │ CB  71  │ │ CB  69  │ │ RB  65  │           │
│  │ Lefebvre│ │ Bernard │ │ Morel  │ │ Durand  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                     ┌─────────┐                               │
│                     │ GK  72  │                               │
│                     │ Laurent │                               │
│                     └─────────┘                               │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  BANC (7 places)                                              │
│  🟢 GK Thomas 64  │ 🟢 CB Faure 63  │ 🟡 CM Blanc 66      │
│  🟢 LW Roux 61    │ 🟢 ST Henri 60  │ 🟢 RB Costa 62      │
│  🟢 CDM Leclerc 65│                                          │
├──────────────────────────────────────────────────────────────┤
│  NON CONVOQUÉS                                                │
│  🔴 A. Ndiaye (CB) — Blessé (2 matchs)                      │
│  🔴 P. Weber (CM) — Suspendu (1 match)                      │
│  🟢 L. Girard (LW) 58 — Disponible                          │
│  🟢 K. Mendy (ST) 56 — Disponible                           │
└──────────────────────────────────────────────────────────────┘
```

**Interactions** :
- Clic sur un joueur du terrain → ouvrir un menu pour le remplacer (liste des joueurs disponibles au poste) ou voir sa fiche
- Clic sur un joueur du banc → options : monter titulaire (choisir le poste), retirer du banc
- Clic sur un joueur non convoqué → option : ajouter au banc
- Drag & drop : permuter deux joueurs (titulaire ↔ titulaire, titulaire ↔ banc)
- Clic "Sauver" → valide et sauvegarde la composition

---

## 6. Tireurs spéciaux

### 6.1 Configuration

Le joueur désigne les tireurs pour chaque situation :

| Rôle | Joueurs | Par défaut (auto) |
|---|---|---|
| Tireur de penalty | 1 joueur | Meilleur `penalties` du XI |
| Tireur de coup franc | 1 joueur | Meilleur `freeKick` du XI |
| Tireur de corner gauche | 1 joueur | Meilleur `crossing` du XI |
| Tireur de corner droit | 1 joueur | Meilleur `crossing` du XI |

### 6.2 Règles

- Si le tireur désigné est sorti (remplacement, expulsion, blessure), le moteur choisit automatiquement le meilleur joueur disponible sur le terrain.
- La configuration est **liée à la composition**, pas au match. Elle persiste entre les matchs tant que la composition n'est pas modifiée.
- Interface intégrée dans la page composition (section dédiée sous le terrain).

---

## 7. Capitaine

### 7.1 Mécanique

- Le joueur désigne **1 capitaine** parmi les titulaires.
- Le capitaine reçoit un **badge (C)** affiché sur le terrain et dans les compositions.

**Impact MVP** : cosmétique uniquement. Le capitaine n'a pas d'impact mécanique sur le moteur de match dans le MVP.

**Post-MVP** : le capitaine pourra avoir un léger bonus de morale pour l'équipe (+2 morale si capitaine expérimenté), et des événements narratifs ("Le capitaine harangue ses coéquipiers").

### 7.2 Règles

- Si le capitaine est sorti ou indisponible, le joueur avec le plus de matchs joués sur le terrain hérite du brassard automatiquement.
- Le capitaine est défini indépendamment de la formation (persiste si le joueur change de formation).

---

## 8. Fiche joueur détaillée

### 8.1 Contenu de la fiche

```
┌──────────────────────────────────────────────────────────────┐
│  ← Retour effectif                                            │
│                                                               │
│  ┌────────┐  LUCAS DUPONT                                    │
│  │ Avatar │  Avant-centre (ST)  │  🇫🇷 France  │  23 ans    │
│  │  🟢    │  Overall: 78  │  Potentiel: 86                   │
│  └────────┘  Contrat: 18 matchs restants  │  32 000 G$/sem   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  CONDITION                                                    │
│  Fatigue: ████████░░ 35%     Forme: ██████████ 92%           │
│  Morale équipe: Bonne ↗     Statut: 🟢 Apte                 │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  STATISTIQUES                                                 │
│                                                               │
│  Physique          Technique          Mental       Défense    │
│  Vitesse    82     Passe      65      Vision  60   Tacle  42 │
│  Endurance  75     Tir        84      Sang-fr 78   Marq.  38 │
│  Puissance  70     Dribble    72      Activité 68            │
│  Agilité    77     Centre     55      Placem. 80             │
│                    Tête       71                              │
│                                                               │
│  Spécial: Penalty 75  │  Coup franc 58                       │
│                                                               │
│  [Radar chart hexagonal des 4 catégories]                    │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  POLYVALENCE                                                  │
│  🟢 ST (naturel)   🟡 CF (accompli)                          │
│  🟠 CAM (dépaysé)  🟠 RW (dépaysé)                          │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  PROGRESSION                                                  │
│  Overall: 78 / 86 (potentiel)                                │
│  ████████████████████░░░░░░ 78/86                            │
│  Tendance: ↗ +0.4 depuis 5 matchs                           │
│  Pic estimé: 24-28 ans (dans 1-5 ans)                        │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  PERFORMANCES RÉCENTES                                        │
│  J12 vs FC Rival     90' ⚽×1 🅰️×0  Note: 7.8  Fatigue: +12 │
│  J11 vs AS Monaco    90' ⚽×2 🅰️×1  Note: 9.1  Fatigue: +15 │
│  J10 vs OL           73' ⚽×0 🅰️×0  Note: 5.2  Fatigue: +9  │
│  [Voir tout l'historique →]                                   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  CONTRAT                                                      │
│  Durée restante: 18 matchs (~36 jours)                       │
│  Salaire: 32 000 G$ / semaine                                │
│  Clause de résiliation: 2 500 000 G$                         │
│  [Prolonger ▸]                                                │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  HISTORIQUE DE SAISON                                         │
│  Matchs: 10  │  Buts: 7  │  Passes D.: 3  │  Note moy: 7.4 │
│  Min. jouées: 847  │  Cartons J: 1  │  Cartons R: 0         │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Comparaison de joueurs

Le joueur peut comparer 2 joueurs côte à côte depuis la vue effectif :

- Sélectionner 2 joueurs (case à cocher ou bouton "Comparer")
- Vue split : les 2 fiches côte à côte, stats alignées
- Chaque stat est colorée en vert pour le meilleur, rouge pour le plus faible
- Overall effectif calculé pour un poste choisi (utile pour comparer un titulaire avec un remplaçant au même poste)

---

## 9. Système de fatigue

### 9.1 Mécanique

La fatigue est une valeur de **0 à 100** par joueur.

| Plage | Label | Impact en match |
|---|---|---|
| 0-30 | Frais | Aucun malus |
| 31-50 | Normal | -2% performance |
| 51-70 | Fatigué | -5% performance |
| 71-85 | Très fatigué | -10% performance, +risque blessure |
| 86-100 | Épuisé | -20% performance, +risque blessure élevé |

### 9.2 Gain de fatigue

Après chaque match joué :

```
fatigue_gain = base (10)
  + minutes_jouées / 10           // 90 min → +9
  + bonus_pressing_haut (3)       // Si consigne pressing high
  + bonus_workRate_élevé (2)      // Si workRate > 75
  + bonus_prolongation (5)        // Post-MVP

// Exemple : match complet pressing haut = 10 + 9 + 3 = +22 de fatigue
```

### 9.3 Récupération

La fatigue diminue **automatiquement** entre les matchs :

```
récupération_par_jour = base (8)
  + bonus_stamina (stamina / 20)  // Joueur avec 80 stamina → +4/jour
  + bonus_non_convoqué (3)        // Si le joueur n'était pas sur la feuille de match

// Joueur stamina 80, non convoqué : 8 + 4 + 3 = -15 fatigue/jour
// Joueur stamina 60, convoqué :     8 + 3 + 0 = -11 fatigue/jour
```

Avec un match tous les 2 jours, un joueur à 80 de stamina récupère ~22-30 de fatigue entre deux matchs. Un joueur qui joue tous les matchs à haute intensité accumulera progressivement de la fatigue → rotation nécessaire.

---

## 10. Système de blessures

### 10.1 Types de blessures

| Gravité | Indisponibilité | Probabilité (si blessure) | Exemples |
|---|---|---|---|
| Légère | 1 match | 50% | Contusion, crampe sévère |
| Modérée | 2-3 matchs | 35% | Élongation, entorse légère |
| Grave | 4-5 matchs | 15% | Déchirure, entorse sérieuse |

### 10.2 Déclenchement

Les blessures surviennent :
- **En match** (SPEC-03) : probabilité ~0.5% par minute, ajustée par fatigue et agressivité des tacles
- Les joueurs très fatigués (>80%) ont un risque de blessure **doublé**

### 10.3 Guérison

- La guérison est **automatique** : le joueur redevient apte après X matchs de la compétition (pas de jours réels, pour ne pas pénaliser les joueurs inactifs).
- Le compteur de matchs restants est décrémenté après chaque journée de championnat, que le joueur ait joué ou non.
- Le médecin du staff envoie une notification à la blessure et au retour (SPEC-02 §7).

### 10.4 Affichage

- Joueur blessé : badge rouge 🔴 + label "Blessé (X matchs)" sur la liste effectif
- Joueur blessé non sélectionnable pour la composition
- Fiche joueur : section condition avec détail de la blessure et temps restant

---

## 11. Système de progression

### 11.1 Potentiel

Chaque joueur a un **potentiel** (overall maximum atteignable) :

```
overall: 62    potential: 82    age: 19
→ Ce joueur peut progresser jusqu'à 82 d'overall
```

| Âge | Potentiel typique vs overall |
|---|---|
| 18-20 | Écart important (potentiel >> overall) |
| 21-24 | Progression rapide vers le potentiel |
| 25-28 | Pic de performance, potentiel presque atteint |
| 29-32 | Plateau, légère régression |
| 33+ | Régression progressive |

### 11.2 Progression passive (post-match)

Après chaque match joué (le joueur doit avoir des minutes), les stats évoluent :

```typescript
function applyProgression(player: Player): StatChange[] {
  const changes: StatChange[] = [];
  const age = player.age;
  const gap = player.potential - player.overall;

  if (age < 24 && gap > 0) {
    // Jeune joueur : progression forte
    const nbStats = randomInt(1, 2);
    for (let i = 0; i < nbStats; i++) {
      const stat = pickRandomStat(player.position); // Stats liées au poste
      const gain = randomFloat(0.1, 0.3);
      changes.push({ stat, change: +gain });
    }
  } else if (age >= 24 && age <= 29 && gap > 0) {
    // Joueur mature : progression lente
    if (Math.random() < 0.5) { // 50% de chance de progresser
      const stat = pickRandomStat(player.position);
      const gain = randomFloat(0.05, 0.15);
      changes.push({ stat, change: +gain });
    }
  } else if (age >= 30) {
    // Joueur vieillissant : régression
    if (Math.random() < 0.3) { // 30% de chance de régresser
      const stat = pickPhysicalStat(); // Les stats physiques déclinent en premier
      const loss = randomFloat(0.05, 0.15);
      changes.push({ stat, change: -loss });
    }
  }

  return changes;
}
```

**Règles** :
- Les stats ne peuvent pas dépasser 99.
- Les stats ne peuvent pas descendre en dessous de 1.
- L'overall est recalculé après chaque changement de stat.
- L'overall ne peut pas dépasser le potentiel (les stats peuvent évoluer mais le plafond est respecté).
- La progression est **invisible** au joueur minute par minute. Il voit la tendance sur la fiche joueur ("↗ +0.4 depuis 5 matchs").
- Les joueurs qui ne jouent pas ne progressent pas (et ne régressent pas non plus, sauf si > 33 ans où la régression est liée à l'âge et non au temps de jeu).

### 11.3 Vieillissement

- L'âge augmente de 1 à chaque **fin de saison** (pas en temps réel).
- Un joueur qui atteint 35 ans prend sa retraite à la fin de la saison en cours.
- La retraite est notifiée au joueur en début de dernière saison ("Dernière saison pour {Joueur}").

---

## 12. Contrats

### 12.1 Mécanique

Chaque joueur a un contrat défini par :

| Attribut | Description |
|---|---|
| `matchesRemaining` | Nombre de matchs de championnat restants au contrat |
| `weeklySalary` | Salaire hebdomadaire en G$ |
| `releaseClause` | Clause de résiliation (montant auquel le joueur peut être acheté sans négociation) |

### 12.2 Durée

- Contrat initial (joueurs générés) : **20-40 matchs** (soit ~1-2 saisons).
- Prolongation possible : **+10 à +40 matchs** selon la négociation.
- Le compteur de matchs restants diminue de 1 par journée de championnat.

### 12.3 Fin de contrat

- À **5 matchs restants** : notification du Directeur sportif ("Le contrat de {Joueur} expire bientôt").
- À **0 matchs restants** : le joueur devient **agent libre**. Il quitte le club automatiquement à la fin de la saison.
- Le joueur peut prolonger à tout moment tant que le contrat n'est pas à 0.

### 12.4 Prolongation

```
POST /squad/:playerId/extend-contract

Coût : bonus à la signature = overall * 10 000 G$ (ex : joueur 75 OVR = 750 000 G$)
Nouveau salaire : recalculé selon l'overall actuel
Durée : +20 matchs (fixe dans le MVP)
```

**Contraintes** :
- Solde suffisant pour le bonus à la signature.
- Le joueur ne peut pas être prolongé s'il est en fin de contrat (0 matchs restants) — il est déjà agent libre.

---

## 13. Suspensions

### 13.1 Cartons jaunes

- **Accumulation** : un joueur qui cumule **5 cartons jaunes** en championnat est suspendu **1 match**.
- Le compteur se remet à 0 après la suspension.
- Notification de la Secrétaire à chaque palier (3ème carton : "Attention, {Joueur} a 3 cartons. 2 de plus et il sera suspendu.").

### 13.2 Carton rouge

- **Rouge direct** : suspension de **2 matchs**.
- **Double jaune** : suspension de **1 match**.

### 13.3 Affichage

- Joueur suspendu : badge rouge 🔴 + label "Suspendu (X matchs)" sur la liste effectif.
- Joueur suspendu non sélectionnable.
- Compteur de cartons jaunes visible sur la fiche joueur.

---

## 14. Système tactique (pré-match)

> Note : Le système tactique en match (changements de mentalité et consignes pendant le jeu) est défini en SPEC-03 §6. Cette section couvre uniquement la **configuration tactique d'avant-match**.

### 14.1 Configuration disponible

Avant un match, le joueur configure :

1. **Formation** (section 4 de cette spec)
2. **Composition** (section 5)
3. **Mentalité initiale** : `ultra_defensive`, `defensive`, `balanced`, `offensive`, `ultra_offensive`
4. **Consignes initiales** :
   - Pressing : `low` / `medium` / `high`
   - Style de passe : `short` / `mixed` / `long`
   - Largeur : `narrow` / `normal` / `wide`
   - Tempo : `slow` / `normal` / `fast`
   - Ligne défensive : `deep` / `normal` / `high`
5. **Tireurs spéciaux** (section 6)
6. **Capitaine** (section 7)

### 14.2 Profils tactiques par défaut

Le joueur a un **profil tactique par défaut** qui est appliqué automatiquement s'il ne configure rien :

```
Profil par défaut :
- Mentalité : balanced
- Pressing : medium
- Style de passe : mixed
- Largeur : normal
- Tempo : normal
- Ligne défensive : normal
```

Ce profil est modifiable dans les réglages du club et persiste entre les matchs.

### 14.3 Page tactique (`/tactics`)

Interface combinant formation, composition et consignes tactiques sur une seule page. Le terrain au centre avec la composition, les consignes tactiques sur le côté, et le banc + non convoqués en dessous.

---

## 15. Modèle de données

### 15.1 Table `players`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | Club actuel (nullable si agent libre) |
| `first_name` | `varchar(30)` | Prénom |
| `last_name` | `varchar(30)` | Nom |
| `nationality` | `varchar(3)` | Code pays ISO (cosmétique) |
| `age` | `integer` | Âge actuel |
| `position` | `enum` | Poste principal |
| `secondary_positions` | `enum[]` | Postes secondaires (0-2) |
| `overall` | `integer` | Note globale calculée (1-99) |
| `potential` | `integer` | Potentiel maximum (1-99) |
| `fatigue` | `integer` | Fatigue actuelle (0-100) |
| `is_injured` | `boolean` | Blessé ou non |
| `injury_matches_remaining` | `integer` | Matchs d'indisponibilité restants |
| `injury_type` | `varchar(50)` | Type de blessure (nullable) |
| `is_suspended` | `boolean` | Suspendu ou non |
| `suspension_matches_remaining` | `integer` | Matchs de suspension restants |
| `yellow_cards_season` | `integer` | Cartons jaunes cumulés cette saison |
| `contract_matches_remaining` | `integer` | Matchs restants au contrat |
| `weekly_salary` | `integer` | Salaire hebdomadaire en G$ |
| `release_clause` | `integer` | Clause de résiliation en G$ |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

### 15.2 Table `player_stats`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK UNIQUE | |
| — **Physique** | | |
| `pace` | `decimal(4,1)` | 1.0 - 99.0 |
| `stamina` | `decimal(4,1)` | |
| `strength` | `decimal(4,1)` | |
| `agility` | `decimal(4,1)` | |
| — **Technique** | | |
| `passing` | `decimal(4,1)` | |
| `shooting` | `decimal(4,1)` | |
| `dribbling` | `decimal(4,1)` | |
| `crossing` | `decimal(4,1)` | |
| `heading` | `decimal(4,1)` | |
| — **Mental** | | |
| `vision` | `decimal(4,1)` | |
| `composure` | `decimal(4,1)` | |
| `work_rate` | `decimal(4,1)` | |
| `positioning` | `decimal(4,1)` | |
| — **Défense** | | |
| `tackling` | `decimal(4,1)` | |
| `marking` | `decimal(4,1)` | |
| — **Spécial** | | |
| `penalties` | `decimal(4,1)` | |
| `free_kick` | `decimal(4,1)` | |

> Note : Les stats sont en `decimal(4,1)` pour permettre la progression par incréments de 0.1. L'overall affiché est arrondi à l'entier.

### 15.3 Table `goalkeeper_stats`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK UNIQUE | |
| `reflexes` | `decimal(4,1)` | |
| `diving` | `decimal(4,1)` | |
| `handling` | `decimal(4,1)` | |
| `positioning` | `decimal(4,1)` | |
| `kicking` | `decimal(4,1)` | |
| `communication` | `decimal(4,1)` | |
| `penalties` | `decimal(4,1)` | |
| `free_kick` | `decimal(4,1)` | |

### 15.4 Table `club_tactics`

Configuration tactique par défaut du club.

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK UNIQUE | |
| `formation` | `enum` | Formation choisie |
| `mentality` | `enum` | Mentalité par défaut |
| `pressing` | `enum` | `low`, `medium`, `high` |
| `passing_style` | `enum` | `short`, `mixed`, `long` |
| `width` | `enum` | `narrow`, `normal`, `wide` |
| `tempo` | `enum` | `slow`, `normal`, `fast` |
| `defensive_line` | `enum` | `deep`, `normal`, `high` |
| `captain_id` | `uuid` FK | Capitaine désigné |
| `penalty_taker_id` | `uuid` FK | Tireur de penalty |
| `free_kick_taker_id` | `uuid` FK | Tireur de coup franc |
| `corner_left_taker_id` | `uuid` FK | Tireur de corner gauche |
| `corner_right_taker_id` | `uuid` FK | Tireur de corner droit |
| `updated_at` | `timestamp` | |

### 15.5 Table `club_lineup`

Composition actuelle sauvegardée.

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | |
| `player_id` | `uuid` FK | |
| `position` | `enum` | Poste assigné dans la formation |
| `role` | `enum` | `starter`, `substitute` |
| `order` | `integer` | Ordre d'affichage sur le banc |

### 15.6 Table `player_season_stats`

Stats agrégées par joueur par saison (pour l'historique).

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK | |
| `season_id` | `uuid` FK | |
| `club_id` | `uuid` FK | Club pendant cette saison |
| `matches_played` | `integer` | |
| `minutes_played` | `integer` | |
| `goals` | `integer` | |
| `assists` | `integer` | |
| `yellow_cards` | `integer` | |
| `red_cards` | `integer` | |
| `average_rating` | `decimal(3,1)` | |
| `clean_sheets` | `integer` | Uniquement pour GK |

---

## 16. API Endpoints

### 16.1 Effectif

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/squad` | Liste des joueurs du club (résumé) |
| `GET` | `/squad/:playerId` | Fiche complète d'un joueur |
| `GET` | `/squad/:playerId/history` | Historique des performances (matchs joués) |
| `GET` | `/squad/compare?players=id1,id2` | Comparaison de 2 joueurs |

### 16.2 Composition & Tactique

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/tactics` | Configuration tactique actuelle (formation, composition, consignes) |
| `PUT` | `/tactics/lineup` | Sauvegarder la composition (titulaires + banc) |
| `PUT` | `/tactics/settings` | Sauvegarder les consignes tactiques |
| `POST` | `/tactics/auto-lineup` | Générer une composition automatique |
| `PUT` | `/tactics/set-pieces` | Configurer les tireurs spéciaux + capitaine |

### 16.3 Contrats

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/squad/:playerId/extend-contract` | Prolonger un contrat |

#### `PUT /tactics/lineup`

**Request** :
```json
{
  "formation": "4-3-3",
  "starters": [
    { "playerId": "uuid-gk", "position": "GK" },
    { "playerId": "uuid-lb", "position": "LB" },
    { "playerId": "uuid-cb1", "position": "CB" },
    { "playerId": "uuid-cb2", "position": "CB" },
    { "playerId": "uuid-rb", "position": "RB" },
    { "playerId": "uuid-cm1", "position": "CM" },
    { "playerId": "uuid-cm2", "position": "CM" },
    { "playerId": "uuid-cm3", "position": "CM" },
    { "playerId": "uuid-lw", "position": "LW" },
    { "playerId": "uuid-st", "position": "ST" },
    { "playerId": "uuid-rw", "position": "RW" }
  ],
  "substitutes": [
    "uuid-gk2", "uuid-cb3", "uuid-cm4", "uuid-lw2",
    "uuid-st2", "uuid-rb2", "uuid-cdm1"
  ]
}
```

**Réponses** :
- `200` : Composition sauvegardée.
- `400` : Validation échouée (détails des erreurs).
- `422` : Warnings non bloquants retournés avec la réponse (fatigue, hors poste).

---

## 17. User Stories complètes

### Effectif & Fiches joueurs

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| SQUAD-01 | Joueur | Voir la liste de mes joueurs avec poste, overall, fatigue, forme et statut | Évaluer rapidement mon effectif | Liste triable et filtrable, indicateurs couleur |
| SQUAD-02 | Joueur | Accéder à la fiche détaillée d'un joueur (stats, potentiel, contrat, historique) | Analyser ses forces et faiblesses | Toutes les sections de la fiche (§8) affichées |
| SQUAD-03 | Joueur | Voir la polyvalence d'un joueur (postes compatibles avec indicateur de malus) | Décider où le positionner | Postes listés avec niveau de compatibilité |
| SQUAD-04 | Joueur | Comparer 2 joueurs côte à côte | Choisir entre eux pour la compo | Stats alignées, meilleur en vert, pire en rouge |
| SQUAD-05 | Joueur | Voir la progression d'un joueur (tendance, potentiel restant) | Évaluer son avenir au club | Barre de progression, tendance, pic estimé |

### Composition & Formation

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| SQUAD-06 | Joueur | Choisir une formation parmi 8 options | Adapter mon style de jeu | Sélection dans un dropdown, terrain mis à jour |
| SQUAD-07 | Joueur | Placer mes 11 titulaires sur le terrain | Préparer mon équipe pour le match | Drag & drop ou sélection, validation en temps réel |
| SQUAD-08 | Joueur | Sélectionner jusqu'à 7 remplaçants | Avoir des options de changement en match | Banc visible sous le terrain, 7 slots |
| SQUAD-09 | Joueur | Utiliser la composition automatique | Gagner du temps | Un clic → composition optimisée selon la formation |
| SQUAD-10 | Joueur | Voir les warnings (fatigue, hors poste) sans être bloqué | Prendre des risques si je le souhaite | Warnings affichés mais non bloquants |
| SQUAD-11 | Joueur | Sauvegarder ma composition pour le prochain match | Qu'elle soit prête le jour J | Bouton sauver, composition persistée |

### Tactique

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| SQUAD-12 | Joueur | Choisir la mentalité initiale de mon équipe | Définir mon style de jeu pour le prochain match | 5 options, effet décrit |
| SQUAD-13 | Joueur | Configurer les consignes (pressing, tempo, etc.) | Affiner ma stratégie | 5 consignes × 3 options chacune |
| SQUAD-14 | Joueur | Désigner les tireurs spéciaux (penalty, coup franc, corner) | Contrôler qui tire | Sélection parmi les titulaires |
| SQUAD-15 | Joueur | Désigner un capitaine | Donner un rôle symbolique | Badge (C) affiché, 1 joueur parmi les titulaires |

### Condition & Gestion

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| SQUAD-16 | Joueur | Voir la fatigue de chaque joueur | Décider de la rotation | Barre de fatigue colorée, pourcentage |
| SQUAD-17 | Joueur | Être alerté si un titulaire est trop fatigué (>80%) | Éviter les blessures | Warning visuel + quick action dashboard |
| SQUAD-18 | Système | Appliquer la récupération automatique de fatigue entre les matchs | Simuler le repos | Fatigue réduite selon formule §9.3 |
| SQUAD-19 | Joueur | Voir quels joueurs sont blessés et pour combien de matchs | Planifier mes compositions | Badge + durée, non sélectionnables |
| SQUAD-20 | Joueur | Voir quels joueurs sont suspendus et pour combien de matchs | Planifier mes compositions | Badge + durée, non sélectionnables |
| SQUAD-21 | Système | Guérir automatiquement les joueurs après X matchs | Simplifier la gestion des blessures | Compteur décrémenté par journée |

### Contrats & Progression

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| SQUAD-22 | Joueur | Voir le contrat de chaque joueur (durée, salaire, clause) | Gérer mes finances et planifier | Affiché sur la fiche joueur |
| SQUAD-23 | Joueur | Prolonger un joueur | Le garder au club | Coût + nouveau salaire affichés avant validation |
| SQUAD-24 | Joueur | Être notifié quand un contrat arrive à terme (< 5 matchs) | Anticiper les départs | Notification du Dir. sportif |
| SQUAD-25 | Système | Retirer les joueurs en fin de contrat automatiquement | Simuler le marché | Joueur retiré du club en fin de saison |
| SQUAD-26 | Système | Faire progresser les joueurs après chaque match joué | Créer de l'attachement | Stats évoluent selon âge/potentiel |
| SQUAD-27 | Joueur | Voir la retraite annoncée d'un joueur de 34+ ans | Planifier le remplacement | Notification en début de dernière saison |

---

## 18. Stratégie de tests

### Tests unitaires

- **Overall calculation** : vérifier le calcul pour chaque poste avec des stats connues
- **Position compatibility** : vérifier les modificateurs (naturel 100%, accompli 90%, etc.)
- **Auto-lineup** : tester avec différentes formations et effectifs (joueurs blessés, fatigués, hors poste)
- **Fatigue gain/recovery** : vérifier les formules avec différents scénarios
- **Progression** : tester par tranche d'âge, vérifier le plafond (potential)
- **Suspension** : vérifier l'accumulation de cartons → suspension
- **Contrat** : vérifier la prolongation (coût, durée), la fin de contrat

### Tests d'intégration

- **Cycle complet compo** : créer une composition → sauvegarder → charger → vérifier la cohérence
- **Validation de composition** : tester tous les cas d'erreur (11 joueurs, GK requis, joueur blessé, doublon)
- **Progression post-match** : simuler un match → vérifier que les stats évoluent correctement
- **Blessures** : blessure en match → indisponibilité → guérison → retour disponible

---

## 19. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Nombre de stats joueur de champ | 15 stats (4 physique, 5 technique, 4 mental, 2 défense) | 2.1 |
| Stats gardien | 6 stats spécifiques | 2.2 |
| Taille du banc | 7 remplaçants (18 convoqués) | 5.1 |
| Formations MVP | 8 formations classiques | 4.1 |
| Polyvalence | 1 poste principal + 1-2 secondaires, 4 niveaux de compatibilité | 3.2 |
| Progression | Passive post-match, basée sur âge/potentiel | 11 |
| Blessures | Simples (1-5 matchs), guérison automatique | 10 |
| Tireurs spéciaux | Configurables (1 par type), auto si non configuré | 6 |
| Capitaine | Cosmétique dans le MVP | 7 |
| Contrats | Durée en matchs, prolongation fixe +20 matchs | 12 |
| Retraite | 35 ans, fin de saison | 11.3 |
| Changement de formation en match | Post-MVP | 4.2 |

---

*Spec rédigée le 2026-03-02. À valider avant implémentation.*
