# SPEC-02 : Interface Club & Dashboard Joueur

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-01 (Auth)
> **Dépendants** : SPEC-03 (Match), SPEC-05 (Championnat), SPEC-06 (Transferts)
> **Dernière mise à jour** : 2026-03-02

---

## 1. Objectif

Proposer une **vue centralisée, claire et actionnable** de l'état du club du joueur. Le dashboard est la **page d'accueil par défaut** après connexion. Il doit permettre en un coup d'oeil de :

- Connaître l'état de son club (forme, finances, effectif)
- Voir son prochain match et ses derniers résultats
- Être alerté des problèmes nécessitant une action (blessures, suspensions, finances)
- Naviguer rapidement vers tous les modules du jeu

**Philosophie UX** : sessions courtes mais engageantes. Le joueur se connecte, voit ce qui a changé, prend 2-3 décisions, et repart. L'interface doit favoriser ce cycle "daily login".

---

## 2. App Shell & Navigation globale

### 2.1 Layout de l'application

L'app shell est le cadre global de l'application, partagé par toutes les pages.

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER                                                       │
│  [Logo Regista]  [Nom du club]  💰 1.2M  🔔 3   [Avatar ▼]  │
├────────────┬─────────────────────────────────────────────────┤
│  SIDEBAR   │  CONTENU PRINCIPAL                               │
│            │                                                   │
│  🏠 Dashboard │                                               │
│  👥 Effectif  │                                               │
│  ⚽ Matchs    │                                               │
│  📋 Tactique  │                                               │
│  🏆 Compétition│                                              │
│  💰 Finances  │                                               │
│  🔄 Transferts│                                               │
│  🏋️ Entraîn.  │                                               │
│  📊 Stats     │                                               │
│            │                                                   │
│  ─────────── │                                               │
│  ⚙️ Réglages │                                               │
└────────────┴─────────────────────────────────────────────────┘
```

### 2.2 Header

Toujours visible, contient :

| Élément | Description | Comportement |
|---|---|---|
| Logo Regista | Logo du jeu (lien vers dashboard) | Clic → retour dashboard |
| Nom du club | Nom + logo miniature du club | Clic → page identité club |
| Solde | Montant actuel en format court (1.2M, 850K) | Couleur verte/orange/rouge selon seuil |
| Notifications | Icône cloche + badge compteur | Clic → panneau notifications |
| Avatar joueur | Photo/avatar du manager | Clic → menu déroulant (profil, réglages, déconnexion) |

**Responsive mobile** : le header se simplifie (logo + cloche + menu hamburger). La sidebar devient un drawer latéral.

### 2.3 Sidebar

Navigation principale de l'application.

| Entrée | Route | Icône | Description |
|---|---|---|---|
| Dashboard | `/` | 🏠 | Page d'accueil, vue synthétique |
| Effectif | `/squad` | 👥 | Liste des joueurs, gestion effectif |
| Matchs | `/matches` | ⚽ | Calendrier, matchs à venir, historique |
| Tactique | `/tactics` | 📋 | Formation, consignes, composition |
| Compétition | `/competition` | 🏆 | Classement, journées, résultats |
| Finances | `/finances` | 💰 | Solde, revenus, dépenses |
| Transferts | `/transfers` | 🔄 | Marché, offres, négociations |
| Entraînement | `/training` | 🏋️ | Programme d'entraînement |
| Statistiques | `/stats` | 📊 | Stats club, joueurs, historique |
| Réglages | `/settings` | ⚙️ | Paramètres du compte et du club |

**État actif** : l'entrée correspondant à la page courante est mise en surbrillance.

**Badge** : certaines entrées affichent un badge si une action est requise (ex : 🔴 sur Effectif si un joueur est blessé sans remplaçant).

**Responsive mobile** : sidebar masquée par défaut, accessible via hamburger menu. Navigation bottom-bar avec les 5 entrées principales (Dashboard, Effectif, Matchs, Tactique, Compétition).

---

## 3. Dashboard (Page d'accueil)

### 3.1 Structure

Le dashboard est composé de **widgets modulaires** organisés en grille responsive :

```
Desktop (3 colonnes) :
┌──────────────────────────────────────────────────────────────┐
│  PROCHAIN MATCH                    │  FORME DE L'ÉQUIPE       │
│  vs FC Rival — Dim 21h             │  ████████░░ 78%          │
│  Championnat J12                   │  Fatigue moy: 35%        │
│  [Préparer le match →]            │  Morale: Bonne ↗         │
├────────────────────────────────────┼──────────────────────────┤
│  DERNIERS RÉSULTATS                │  ACTIONS RECOMMANDÉES     │
│  ✅ 2-1 vs AS Monaco              │  ⚠️ Vérifier compo (2    │
│  ❌ 0-3 vs OL                     │     joueurs fatigués)     │
│  ✅ 1-0 vs FC Nantes              │  🏥 Dupont blessé 2 matchs│
│  [Voir historique →]              │  💰 Masse salariale élevée│
├────────────────────────────────────┴──────────────────────────┤
│  NOTIFICATIONS RÉCENTES                                       │
│  🩺 Dr. Martin : "Dupont souffre d'une élongation, 2 semaines│
│     d'absence."                                               │
│  📋 J. Durand (Adjoint) : "J'ai analysé notre prochain       │
│     adversaire, ils sont faibles sur les ailes."              │
│  💰 S. Lopez (Dir. sportif) : "Le budget est serré, il       │
│     faudra vendre avant d'acheter."                           │
│  [Voir toutes les notifications →]                            │
├──────────────────────────────────────────────────────────────┤
│  CLASSEMENT (extrait)                                         │
│  #3  Mon Club       28 pts  (+12)                             │
│  #4  FC Rival       27 pts  (+10)    ← prochain adversaire   │
│  #5  AS Monaco      25 pts  (+8)                              │
│  [Voir classement complet →]                                  │
└──────────────────────────────────────────────────────────────┘

Mobile (1 colonne) : widgets empilés verticalement dans l'ordre de priorité.
```

### 3.2 Widget : Prochain match

| Donnée | Source |
|---|---|
| Adversaire (nom + logo) | `matches` table, prochain match `scheduled` |
| Date et heure | `matches.scheduled_at` |
| Compétition + journée | `matches.competition_id` + `matches.matchday` |
| Forme adverse (W/D/L derniers 5 matchs) | Calculé depuis les derniers résultats de l'adversaire |

**Actions** :
- "Préparer le match" → lien vers `/tactics` pré-rempli pour ce match
- "Voir détails" → lien vers `/matches/:id`

**Cas particulier** : si aucun match à venir (hors saison / fin de championnat), afficher "Aucun match prévu" + suggestion d'amical.

### 3.3 Widget : Forme de l'équipe

| Donnée | Calcul |
|---|---|
| Forme physique moyenne | Moyenne de `(100 - fatigue)` de tous les titulaires |
| Fatigue moyenne | Moyenne de `fatigue` des titulaires |
| Morale d'équipe | Voir section 5 (Système de morale) |
| Joueurs inaptes | Nombre de joueurs blessés + suspendus |

**Indicateurs visuels** :
- Barre de forme avec couleur (vert > 70%, orange 40-70%, rouge < 40%)
- Morale avec flèche de tendance (↗ en hausse, → stable, ↘ en baisse)
- Badge rouge si joueurs inaptes

### 3.4 Widget : Derniers résultats

Affiche les **3 derniers matchs terminés** :
- Résultat (victoire ✅, nul ➖, défaite ❌)
- Score
- Adversaire
- Compétition

Clic sur un résultat → page résumé du match (`/matches/:id/summary`).

### 3.5 Widget : Actions recommandées (Quick Actions)

Système intelligent qui analyse l'état du club et propose des actions prioritaires.

#### Règles de déclenchement

| Priorité | Condition | Message | Action |
|---|---|---|---|
| 🔴 Critique | Match dans < 24h et compo non validée | "Match demain ! Vérifiez votre composition." | → `/tactics` |
| 🔴 Critique | Joueur titulaire blessé/suspendu sans remplaçant | "{Joueur} indisponible, aucun remplaçant au poste." | → `/squad` |
| 🔴 Critique | Solde négatif | "Votre club est en déficit !" | → `/finances` |
| 🟠 Important | Fatigue moyenne > 70% | "Votre équipe est fatiguée, pensez aux rotations." | → `/tactics` |
| 🟠 Important | Joueur en fin de contrat (< 5 matchs) | "{Joueur} arrive en fin de contrat." | → `/transfers` |
| 🟡 Info | Entraînement non configuré | "Aucun programme d'entraînement défini." | → `/training` |
| 🟡 Info | 3+ joueurs avec fatigue > 80% | "Plusieurs joueurs très fatigués." | → `/squad` |
| 🟢 Positif | Série de 3+ victoires | "Votre équipe est en forme ! 🔥" | — |
| 🟢 Positif | Joueur avec note > 8 au dernier match | "Excellente performance de {Joueur} !" | → `/matches/:id` |

**Affichage** : liste triée par priorité (critique en premier), maximum **5 actions affichées** simultanément. Les actions positives sont affichées en dernier et uniquement s'il y a de la place.

### 3.6 Widget : Classement (extrait)

Affiche un **extrait du classement** centré sur la position du club du joueur :
- 1 ligne au-dessus, position du club, 1 ligne en dessous
- Si le joueur est 1er, afficher les 3 premières lignes
- Si le prochain adversaire est visible, le mettre en surbrillance

Clic → `/competition` pour le classement complet.

---

## 4. Création & Identité du club

### 4.1 Flux de création (onboarding)

Après inscription (SPEC-01), le joueur est redirigé vers le flux de création de club :

```
Étape 1 : Nom du club
  → Input texte, validation (2-30 caractères, pas de caractères spéciaux interdits)
  → Vérification d'unicité (pas de doublon exact dans la même ligue)

Étape 2 : Couleurs du club
  → Choix de 2 couleurs (principale + secondaire)
  → Palette prédéfinie de ~20 couleurs + color picker libre
  → Preview en temps réel sur un maillot simplifié

Étape 3 : Logo / Blason
  → Bibliothèque de ~30-50 blasons/icônes préconfigurés
  → Le joueur choisit un blason + la couleur principale est appliquée
  → Upload custom post-MVP

Étape 4 : Confirmation
  → Résumé (nom, couleurs, blason, ligue assignée)
  → "Créer mon club" → génération de l'effectif + assignation à une ligue
```

### 4.2 Génération de l'effectif initial

À la création du club, un effectif est **généré automatiquement** :

| Paramètre | Valeur MVP |
|---|---|
| Nombre de joueurs | 22 (11 titulaires + 11 remplaçants) |
| Répartition | 2 GK, 6 DEF, 6 MID, 4 ATT + 4 polyvalents |
| Niveau moyen | Tous les clubs démarrent avec un overall similaire (~55-65) |
| Variance | ±10 sur l'overall pour créer de la diversité |
| Noms | Générés aléatoirement (base de données de noms/prénoms) |
| Âge | 18-33 ans, distribution réaliste |
| Nationalité | Aléatoire (purement cosmétique dans le MVP) |

### 4.3 Page identité club

Accessible via `/club` ou clic sur le nom du club dans le header.

| Section | Contenu |
|---|---|
| **En-tête** | Logo + nom du club + couleurs |
| **Infos générales** | Date de création, ligue actuelle, position au classement |
| **Palmarès** | Trophées gagnés (vide au début, se remplit avec le temps) |
| **Stats club** | Matchs joués, victoires, nuls, défaites, buts marqués/encaissés |
| **Stade** | Nom du stade (généré ou choisi), capacité (cosmétique MVP) |

**Modification** : le joueur peut modifier le nom du club et les couleurs (pas le blason pour le MVP). Modification limitée à 1 fois par saison pour éviter les abus.

---

## 5. Système de morale d'équipe

### 5.1 Mécanique

La morale est une **valeur globale d'équipe** (pas individuelle), comprise entre **0 et 100**.

| Plage | Label | Effet en match |
|---|---|---|
| 80-100 | Excellente | +5% sur toutes les actions offensives et défensives |
| 60-79 | Bonne | +2% sur toutes les actions |
| 40-59 | Neutre | Aucun bonus/malus |
| 20-39 | Mauvaise | -3% sur toutes les actions |
| 0-19 | Catastrophique | -7% sur toutes les actions |

### 5.2 Évolution de la morale

La morale est recalculée **après chaque match** :

| Événement | Impact morale |
|---|---|
| Victoire | +8 |
| Victoire large (3+ buts d'écart) | +12 |
| Match nul | +1 (domicile) / +3 (extérieur) |
| Défaite | -6 |
| Défaite lourde (3+ buts d'écart) | -10 |
| Série de 3 victoires | +5 bonus |
| Série de 3 défaites | -5 malus |

**Décroissance naturelle** : la morale tend vers 50 (neutre) de 1 point par jour sans match. Cela évite qu'une morale excellente ou catastrophique persiste indéfiniment.

**Valeur initiale** : 60 (Bonne) à la création du club.

### 5.3 Affichage

- Dashboard : widget "Forme de l'équipe" avec label + barre colorée + tendance
- Effet en match : non affiché explicitement au joueur (le joueur sait que la morale impacte les performances, mais ne voit pas le modificateur exact)

---

## 6. Finances (MVP)

### 6.1 Modèle économique simplifié

Chaque club a un **solde unique** en monnaie du jeu (G$ — Game Dollars).

| Paramètre | Valeur MVP |
|---|---|
| Solde initial | 5 000 000 G$ |
| Seuil d'alerte | 500 000 G$ (notification orange) |
| Seuil critique | 0 G$ (notification rouge, blocage achats) |

### 6.2 Sources de revenus

| Source | Montant | Fréquence |
|---|---|---|
| Match à domicile (billetterie) | 100 000 - 200 000 G$ | Par match domicile |
| Match à l'extérieur | 30 000 G$ | Par match extérieur |
| Droits TV (championnat) | 500 000 G$ | Par saison (versé en début) |
| Vente de joueur | Variable | À chaque transfert sortant |
| Récompense fin de saison | Variable selon classement | Fin de saison |

**Revenus de billetterie** : varient selon le classement et les résultats récents (un club qui gagne attire plus de monde). Formule simplifiée :

```
billetterie = base (100K) + bonus_classement (top 5 = +50K) + bonus_forme (série victoires = +50K)
```

### 6.3 Sources de dépenses

| Source | Montant | Fréquence |
|---|---|---|
| Masse salariale | Somme des salaires joueurs | Hebdomadaire (tous les 7 jours de jeu) |
| Achat de joueur | Variable | À chaque transfert entrant |

**Salaires** : chaque joueur a un salaire défini à la création ou au recrutement, proportionnel à son overall :

```
salaire_hebdo = overall * 500 + random(0, 2000)
// Joueur 60 overall ≈ 30 000 - 32 000 G$/semaine
// Joueur 80 overall ≈ 40 000 - 42 000 G$/semaine
```

### 6.4 Page finances (`/finances`)

```
┌──────────────────────────────────────────────────────────────┐
│  SOLDE ACTUEL                                                 │
│  💰 4 250 000 G$                                    🟢        │
├──────────────────────────────────────────────────────────────┤
│  REVENUS / DÉPENSES (7 derniers jours)                        │
│                                                               │
│  ↗ Revenus       +580 000 G$                                  │
│    Billetterie (x2 matchs)      +350 000                      │
│    Droits TV (versement)        +200 000                      │
│    Divers                        +30 000                      │
│                                                               │
│  ↘ Dépenses      -420 000 G$                                  │
│    Salaires (semaine)           -380 000                      │
│    Achat joueur (Silva)          -40 000                      │
│                                                               │
│  ─────────────────────────────────────────                    │
│  Balance nette : +160 000 G$                                  │
├──────────────────────────────────────────────────────────────┤
│  MASSE SALARIALE                                              │
│  Total hebdo : 380 000 G$ / semaine                           │
│  Joueur le + cher : Rodriguez (42 000 G$/sem)                 │
│  [Voir détail par joueur →]                                   │
├──────────────────────────────────────────────────────────────┤
│  HISTORIQUE (graphique simple)                                │
│  ▁▂▃▅▆▇█▇▆▅ (évolution du solde sur 30 jours)               │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Système de notifications & Staff immersif

### 7.1 Personnages du staff

Le club possède un staff fictif composé de **4 personnages fixes** qui "envoient" les notifications. Cela renforce l'immersion et donne une identité au club.

| Personnage | Rôle | Types de messages |
|---|---|---|
| **Adjoint** (ex : J. Durand) | Analyse tactique et sportive | Analyse adversaire, suggestions tactiques, recap match |
| **Médecin** (ex : Dr. Martin) | Santé des joueurs | Blessures, retours de blessure, fatigue excessive |
| **Directeur sportif** (ex : S. Lopez) | Finances et transferts | Alertes budget, propositions de transfert, fin de contrat |
| **Secrétaire** (ex : M. Petit) | Administratif et système | Calendrier, notifications de match, résultats de ligue |

**Personnalisation** : les noms et avatars du staff sont **générés aléatoirement** à la création du club (à partir d'une banque de noms + avatars génériques). Non modifiables dans le MVP.

### 7.2 Types de notifications

| Catégorie | Déclencheur | Personnage | Priorité | Exemple |
|---|---|---|---|---|
| **Match à venir** | T-24h, T-1h | Secrétaire | Info | "Votre match contre {adversaire} est prévu demain à {heure}." |
| **Résultat de match** | Post-match | Adjoint | Info | "Victoire 2-1, bonne performance collective. {Joueur} élu homme du match." |
| **Blessure** | Post-match ou entraînement | Médecin | Important | "{Joueur} souffre d'une élongation aux ischio-jambiers. Indisponible {durée}." |
| **Retour de blessure** | Joueur guéri | Médecin | Info | "Bonne nouvelle, {Joueur} est de retour à l'entraînement !" |
| **Fatigue élevée** | Fatigue > 80% | Médecin | Avertissement | "Attention, {N} joueurs sont très fatigués. Je recommande du repos." |
| **Suspension** | Post-match (cartons) | Secrétaire | Important | "{Joueur} est suspendu pour le prochain match (accumulation de cartons)." |
| **Fin de contrat** | < 5 matchs restants | Dir. sportif | Avertissement | "Le contrat de {Joueur} arrive à terme. Souhaitez-vous prolonger ?" |
| **Alerte finances** | Solde < seuil | Dir. sportif | Critique | "Attention, nos finances sont préoccupantes. Solde actuel : {montant}." |
| **Analyse adversaire** | T-12h avant match | Adjoint | Info | "J'ai étudié {adversaire}. Ils sont faibles sur les côtés mais solides dans l'axe." |
| **Résultat concurrent** | Post-match concurrent | Secrétaire | Info | "{Club} a perdu contre {adversaire}. Nous pouvons prendre la {position}ème place." |
| **Nouveau joueur dispo** | Marché des transferts | Dir. sportif | Info | "Un attaquant intéressant est sur le marché : {Joueur}, overall {note}." |

### 7.3 Centre de notifications (`/notifications`)

```
┌──────────────────────────────────────────────────────────────┐
│  NOTIFICATIONS                           [Tout marquer lu]    │
│                                                               │
│  ─── Aujourd'hui ──────────────────────────────────────────   │
│                                                               │
│  🩺 Dr. Martin                                    14:32       │
│  "Dupont souffre d'une élongation aux ischio-jambiers.        │
│   Indisponible 2 matchs."                           [!]      │
│                                                               │
│  📋 J. Durand                                      10:15      │
│  "J'ai analysé notre prochain adversaire. Ils jouent en       │
│   4-3-3 avec un pressing haut. Nos ailiers rapides            │
│   pourraient faire la différence."                            │
│                                                               │
│  ─── Hier ─────────────────────────────────────────────────   │
│                                                               │
│  📋 J. Durand                                      22:45      │
│  "Victoire 2-1 ! Belle réaction en deuxième mi-temps.         │
│   Rodriguez élu homme du match (note 8.2)."                   │
│                                                               │
│  💰 S. Lopez                                       18:00      │
│  "Le versement des droits TV a été effectué :                  │
│   +200 000 G$."                                               │
│  ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

**Fonctionnalités** :
- Liste chronologique inversée (plus récent en haut)
- Groupé par jour
- Notifications non lues en gras avec indicateur visuel
- "Tout marquer lu" en un clic
- Filtrage par personnage du staff
- Les notifications critiques (🔴) restent épinglées en haut tant qu'elles ne sont pas résolues

### 7.4 Panneau de notifications (header)

Clic sur la cloche dans le header → panneau déroulant affichant les **5 dernières notifications non lues** avec un lien "Voir tout" vers `/notifications`.

---

## 8. Effectif résumé (widget dashboard + page)

> Note : La gestion complète de l'effectif (fiche joueur, stats individuelles, gestion des contrats) sera détaillée dans SPEC-04 (Gestion d'effectif & Joueurs).

### 8.1 Widget dashboard

Affiche un résumé rapide :
- Nombre de joueurs total / aptes / blessés / suspendus
- 3 joueurs en forme (meilleure note récente)
- 3 joueurs à surveiller (haute fatigue, basse forme)

### 8.2 Vue liste effectif (`/squad`)

```
┌────────────────────────────────────────────────────────────────┐
│  EFFECTIF (22 joueurs)            [Trier par ▼] [Filtrer ▼]   │
│                                                                 │
│  ── GARDIENS ──────────────────────────────────────────────     │
│  🟢 L. Martin       GK    72 OVR   Forme: 85%   Fatigue: 20%  │
│  🟢 T. Bernard      GK    64 OVR   Forme: 78%   Fatigue: 15%  │
│                                                                 │
│  ── DÉFENSEURS ─────────────────────────────────────────────    │
│  🟢 R. Rodriguez    CB    71 OVR   Forme: 82%   Fatigue: 45%  │
│  🔴 A. Dupont       CB    68 OVR   BLESSÉ (2 matchs)          │
│  🟢 M. Silva        LB    66 OVR   Forme: 70%   Fatigue: 55%  │
│  🟡 J. Lefebvre     RB    65 OVR   Forme: 60%   Fatigue: 78%  │
│  ...                                                            │
│                                                                 │
│  ── MILIEUX ────────────────────────────────────────────────    │
│  ...                                                            │
│                                                                 │
│  ── ATTAQUANTS ─────────────────────────────────────────────    │
│  ...                                                            │
└────────────────────────────────────────────────────────────────┘
```

**Tri disponible** : par poste (défaut), overall, forme, fatigue, nom, âge, salaire.
**Filtres** : par ligne (GK/DEF/MID/ATT), par statut (apte/blessé/suspendu), par fatigue (> seuil).
**Indicateur couleur** : 🟢 apte, 🟡 fatigué (>70%), 🔴 blessé/suspendu.
**Clic sur un joueur** → fiche individuelle (SPEC-04).

---

## 9. Modèle de données

### 9.1 Table `clubs`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK UNIQUE | Propriétaire (1 club par joueur) |
| `name` | `varchar(30)` | Nom du club |
| `primary_color` | `varchar(7)` | Couleur principale (hex) |
| `secondary_color` | `varchar(7)` | Couleur secondaire (hex) |
| `logo_id` | `varchar(50)` | Identifiant du blason choisi |
| `stadium_name` | `varchar(50)` | Nom du stade |
| `balance` | `bigint` | Solde actuel en G$ (centimes pour éviter les flottants) |
| `morale` | `integer` | Morale d'équipe (0-100) |
| `league_id` | `uuid` FK | Ligue actuelle |
| `name_changes_remaining` | `integer` | Changements de nom restants pour la saison (défaut: 1) |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

### 9.2 Table `club_staff`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | |
| `role` | `enum` | `assistant`, `doctor`, `sporting_director`, `secretary` |
| `first_name` | `varchar(30)` | Prénom généré |
| `last_name` | `varchar(30)` | Nom généré |
| `avatar_id` | `varchar(50)` | Identifiant de l'avatar |
| `created_at` | `timestamp` | |

### 9.3 Table `notifications`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | Club destinataire |
| `staff_role` | `enum` | Rôle du personnage émetteur |
| `category` | `enum` | `match`, `injury`, `finance`, `transfer`, `tactic`, `system` |
| `priority` | `enum` | `critical`, `important`, `warning`, `info`, `positive` |
| `title` | `varchar(100)` | Titre court |
| `message` | `text` | Message complet |
| `action_url` | `varchar(200)` | Lien d'action (nullable) |
| `is_read` | `boolean` | Lu ou non (défaut: false) |
| `is_pinned` | `boolean` | Épinglé (notifications critiques) |
| `metadata` | `jsonb` | Données additionnelles (playerId, matchId, etc.) |
| `created_at` | `timestamp` | |

### 9.4 Table `financial_transactions`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | |
| `type` | `enum` | `ticket_revenue`, `tv_rights`, `player_sale`, `salary`, `player_purchase`, `prize`, `other` |
| `amount` | `bigint` | Montant en centimes (positif = revenu, négatif = dépense) |
| `description` | `varchar(200)` | Description lisible |
| `reference_id` | `uuid` | Référence optionnelle (match_id, player_id, etc.) |
| `balance_after` | `bigint` | Solde après transaction |
| `created_at` | `timestamp` | |

---

## 10. API Endpoints

### 10.1 Dashboard

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/dashboard` | Données agrégées du dashboard (prochain match, forme, résultats, actions, classement extrait). Un seul appel pour charger toute la page. |

**Response `GET /dashboard`** :
```json
{
  "club": {
    "id": "uuid",
    "name": "Mon Club",
    "logoId": "shield-01",
    "primaryColor": "#1a5f2a",
    "balance": 4250000,
    "morale": 72,
    "moraleLabel": "good",
    "moraleTrend": "up"
  },
  "nextMatch": {
    "id": "uuid",
    "opponent": { "id": "uuid", "name": "FC Rival", "logoId": "..." },
    "scheduledAt": "2026-03-05T21:00:00Z",
    "competition": "Ligue Alpha",
    "matchday": 12,
    "isHome": true,
    "opponentForm": ["W", "L", "W", "D", "W"]
  },
  "recentResults": [
    { "matchId": "uuid", "opponent": "AS Monaco", "score": "2-1", "result": "win", "date": "..." },
    { "matchId": "uuid", "opponent": "OL", "score": "0-3", "result": "loss", "date": "..." },
    { "matchId": "uuid", "opponent": "FC Nantes", "score": "1-0", "result": "win", "date": "..." }
  ],
  "squadStatus": {
    "totalPlayers": 22,
    "available": 19,
    "injured": 2,
    "suspended": 1,
    "averageFatigue": 35,
    "averageFitness": 78
  },
  "quickActions": [
    { "priority": "critical", "message": "Match demain ! Vérifiez votre composition.", "actionUrl": "/tactics" },
    { "priority": "important", "message": "Dupont blessé 2 matchs, pas de remplaçant CB.", "actionUrl": "/squad" }
  ],
  "standingExcerpt": [
    { "position": 2, "club": "FC Leader", "points": 30, "goalDiff": 15 },
    { "position": 3, "club": "Mon Club", "points": 28, "goalDiff": 12, "isCurrentClub": true },
    { "position": 4, "club": "FC Rival", "points": 27, "goalDiff": 10, "isNextOpponent": true }
  ],
  "unreadNotifications": 3
}
```

### 10.2 Club

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/clubs/mine` | Infos complètes du club du joueur |
| `PATCH` | `/clubs/mine` | Modifier le club (nom, couleurs) |
| `POST` | `/clubs` | Créer un club (onboarding) |
| `GET` | `/clubs/:id` | Infos publiques d'un autre club |

#### `POST /clubs` (création)

**Request** :
```json
{
  "name": "FC Regista",
  "primaryColor": "#1a5f2a",
  "secondaryColor": "#ffffff",
  "logoId": "shield-eagle-01"
}
```

**Response** `201` :
```json
{
  "club": { "id": "uuid", "name": "FC Regista", "...": "..." },
  "squad": [ "... 22 joueurs générés ..." ],
  "league": { "id": "uuid", "name": "Ligue Alpha", "matchTime": "21:00" },
  "staff": [
    { "role": "assistant", "name": "J. Durand" },
    { "role": "doctor", "name": "Dr. Martin" },
    { "role": "sporting_director", "name": "S. Lopez" },
    { "role": "secretary", "name": "M. Petit" }
  ]
}
```

### 10.3 Finances

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/finances` | Résumé financier (solde, revenus/dépenses récents, masse salariale) |
| `GET` | `/finances/transactions` | Historique des transactions (paginé, filtrable par type) |

### 10.4 Notifications

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/notifications` | Liste des notifications (paginée, filtrée par catégorie/statut lu) |
| `PATCH` | `/notifications/:id/read` | Marquer une notification comme lue |
| `PATCH` | `/notifications/read-all` | Marquer toutes les notifications comme lues |
| `GET` | `/notifications/unread-count` | Nombre de notifications non lues (pour le badge header) |

### 10.5 Effectif (résumé)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/squad` | Liste des joueurs du club avec stats résumées |
| `GET` | `/squad/:playerId` | Fiche complète d'un joueur (détail SPEC-04) |

---

## 11. User Stories complètes

### Dashboard

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| DASH-01 | Joueur | Voir un dashboard synthétique à la connexion | Avoir une vue rapide de l'état de mon club | Dashboard chargé en < 2s, tous les widgets visibles |
| DASH-02 | Joueur | Voir mon prochain match (adversaire, date, heure, compétition) | Me préparer à la rencontre | Infos correctes, lien vers préparation tactique |
| DASH-03 | Joueur | Voir la forme moyenne et la fatigue de mon équipe | Évaluer ma préparation | Barre colorée, pourcentage, indicateur morale |
| DASH-04 | Joueur | Voir mes 3 derniers résultats | Analyser ma dynamique | Score, résultat (W/D/L), adversaire, lien vers résumé |
| DASH-05 | Joueur | Recevoir des recommandations d'action contextuelles | Être guidé dans ma gestion | Actions triées par priorité, max 5, liens cliquables |
| DASH-06 | Joueur | Voir un extrait du classement centré sur ma position | Situer mon club dans la compétition | Ma ligne + 1 au-dessus + 1 en dessous |
| DASH-07 | Joueur | Que le dashboard soit responsive (desktop + mobile) | Jouer depuis n'importe quel appareil | Layout adaptatif, widgets empilés sur mobile |

### Club & Identité

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| CLUB-01 | Nouveau joueur | Créer mon club en choisissant nom, couleurs et blason | Personnaliser mon expérience | Flux en 4 étapes, validation en temps réel |
| CLUB-02 | Nouveau joueur | Recevoir un effectif de 22 joueurs à la création | Commencer à jouer immédiatement | 22 joueurs générés, répartition équilibrée, overall ~55-65 |
| CLUB-03 | Nouveau joueur | Être assigné automatiquement à une ligue | Jouer contre d'autres clubs | Ligue assignée avec places disponibles |
| CLUB-04 | Joueur | Voir la page identité de mon club (nom, logo, stats, palmarès) | Ressentir un sentiment d'appartenance | Toutes les infos club affichées |
| CLUB-05 | Joueur | Modifier le nom de mon club (1 fois par saison) | Corriger ou changer de nom | Validation d'unicité, compteur de changements |

### Finances

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| FIN-01 | Joueur | Voir mon solde actuel en permanence (header) | Suivre mes finances en continu | Affiché dans le header, format court |
| FIN-02 | Joueur | Voir le détail revenus/dépenses des 7 derniers jours | Comprendre mes flux financiers | Catégorisé par type, total calculé |
| FIN-03 | Joueur | Voir l'historique de mes transactions | Analyser mes finances sur le long terme | Liste paginée, filtrable par type |
| FIN-04 | Joueur | Voir ma masse salariale détaillée | Identifier les coûts à optimiser | Total + détail par joueur |
| FIN-05 | Joueur | Être alerté quand mon solde est bas | Anticiper les problèmes financiers | Notification orange < 500K, rouge < 0 |
| FIN-06 | Système | Verser automatiquement les revenus (billetterie, droits TV) | Simuler l'économie du club | Transactions créées aux bons moments |
| FIN-07 | Système | Prélever les salaires hebdomadairement | Simuler les charges du club | Transaction automatique chaque semaine |

### Notifications & Staff

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| NOTIF-01 | Joueur | Voir mes notifications non lues via un badge dans le header | Savoir qu'il y a du nouveau | Badge avec compteur, mis à jour en temps réel |
| NOTIF-02 | Joueur | Ouvrir un panneau rapide de notifications | Consulter les dernières nouvelles sans quitter la page | Panneau avec 5 dernières notifs + lien "Voir tout" |
| NOTIF-03 | Joueur | Lire mes notifications comme des messages du staff | Être immergé dans la vie du club | Avatar + nom + rôle du personnage, ton adapté |
| NOTIF-04 | Joueur | Marquer une ou toutes les notifications comme lues | Gérer mes notifications | Actions individuelles + "Tout marquer lu" |
| NOTIF-05 | Joueur | Filtrer mes notifications par catégorie | Retrouver une info précise | Filtres par catégorie (match, injury, finance...) |
| NOTIF-06 | Système | Envoyer automatiquement des notifications via le bon personnage du staff | Maintenir l'immersion | Chaque type de notif assigné au bon rôle |
| NOTIF-07 | Système | Épingler les notifications critiques | Que le joueur ne rate pas une info urgente | Notif critique visible tant que non résolue |

### Navigation

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| NAV-01 | Joueur | Naviguer rapidement vers tous les modules via une sidebar | Accéder à tout en 1 clic | Sidebar fixe desktop, drawer mobile |
| NAV-02 | Joueur | Voir des badges sur les entrées de navigation quand une action est requise | Savoir où agir | Badges rouges sur les modules concernés |
| NAV-03 | Joueur | Avoir une navigation mobile adaptée (bottom bar) | Jouer confortablement sur mobile | Bottom bar avec 5 entrées principales |

---

## 12. Stratégie de tests

### Tests unitaires

- **Quick Actions engine** : tester chaque règle de déclenchement (fatigue haute → action recommandée, joueur blessé → alerte, etc.)
- **Morale calculation** : tester l'évolution après victoire, défaite, nul, séries
- **Finances calculation** : tester les revenus de billetterie, prélèvement salaires, seuils d'alerte
- **Notification assignment** : vérifier que chaque type de notification est envoyé par le bon personnage du staff

### Tests d'intégration

- **Dashboard API** : vérifier que `/dashboard` agrège correctement toutes les données (prochain match, résultats, squad status, actions, classement)
- **Création de club** : flux complet (création club → génération effectif → assignation ligue → staff généré)
- **Notifications** : vérifier le cycle complet (déclencheur → notification créée → affichée → marquée lue)
- **Transactions financières** : vérifier que les revenus/dépenses mettent à jour le solde correctement

### Tests E2E (post-MVP)

- Flux complet : inscription → création club → dashboard → navigation → préparation match

---

## 13. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Création de club | Personnalisée (nom, 2 couleurs, blason) | 4.1 |
| Effectif initial | 22 joueurs auto-générés, overall ~55-65 | 4.2 |
| Finances MVP | Basique : solde + revenus/dépenses fixes | 6 |
| Morale | Globale d'équipe (0-100), basée sur résultats | 5 |
| Notifications immersives | Staff simulé (4 personnages fixes) | 7 |
| Navigation | Sidebar desktop + bottom bar mobile | 2 |
| Modification club | Nom modifiable 1x/saison, couleurs modifiables | 4.3 |
| Dashboard | Widget-based, 1 appel API agrégé | 3, 10.1 |

---

*Spec rédigée le 2026-03-02. À valider avant implémentation.*
