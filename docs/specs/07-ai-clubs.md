# SPEC-07 : Intelligence Artificielle des Clubs (PvE)

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-02 (Club), SPEC-03 (Match), SPEC-04 (Effectif), SPEC-05 (Championnat), SPEC-06 (Transferts)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03

---

## 1. Objectif

Fournir une **opposition crédible, variée et cohérente** pour les matchs contre des clubs non contrôlés par un joueur humain. L'IA doit être suffisamment intelligente pour proposer un challenge progressif tout en restant implémentable avec un système de règles simple (rule-based, pas de machine learning).

**Philosophie** : un club IA doit être indistinguable d'un club humain du point de vue de l'expérience de jeu. Même données, même affichage, même post-match. Le joueur ne doit pas savoir (ni pouvoir facilement deviner) s'il joue contre un humain ou une IA.

---

## 2. Règles métier fondamentales

| Règle | Valeur |
|---|---|
| Stockage | Même tables que les clubs humains (`clubs`, `players`, etc.) |
| Distinction | Colonne `is_ai` sur la table `clubs` (non exposée au client) |
| Profils en match | 3 profils : Offensif, Équilibré, Défensif |
| Moments de décision | Mi-temps, 60e minute, 75e minute |
| Gestion intersaison | Régénération silencieuse (pas de vrais transferts) |
| Overall calibré par division | Div 1 : 70-80, Div 2 : 60-70, Div 3 : 50-65 |
| Finances IA | Non simulées (pas de budget, salaires, transactions) |
| Matchs amicaux | 3 niveaux de difficulté (facile, normal, difficile) |

---

## 3. Génération d'un club IA

### 3.1 Identité du club

Lors de la création d'une ligue (SPEC-05 §3.2), le système génère les clubs IA nécessaires pour compléter les 60 places (3 divisions × 20).

**Nom du club** :

Généré à partir d'une banque de patterns combinatoires :

```
Patterns :
  "{Préfixe} {Ville}"          → FC Bordeaux, AS Nantes, SC Lyon
  "{Ville} {Suffixe}"          → Marseille United, Toulouse City, Lille Athletic
  "{Adjectif} {Ville}"         → Real Valencia, Dynamo Praha, Sporting Braga

Préfixes : FC, AS, SC, RC, OGC, AJ, EA, US, Stade, Olympique, Racing
Suffixes : United, City, Athletic, Rovers, Wanderers, Sport, Club
Adjectifs : Real, Dynamo, Sporting, Atletico, Inter

Villes : banque de ~200 noms de villes internationales
```

**Vérification d'unicité** : pas de doublon de nom dans la même ligue. Si collision, regénérer.

**Couleurs** : 2 couleurs aléatoires parmi une palette de ~30 couleurs (même palette que les joueurs humains, SPEC-02 §4.1).

**Logo** : blason aléatoire parmi la bibliothèque (même catalogue que les joueurs humains).

### 3.2 Staff IA

Même génération que pour les clubs humains (SPEC-02 §7.1) : 4 personnages (adjoint, médecin, directeur sportif, secrétaire) avec noms et avatars aléatoires. Le staff IA est purement cosmétique (utilisé uniquement pour les notifications dans le cas de remplacement d'un club humain par un club IA).

### 3.3 Profil IA

Chaque club IA se voit attribuer un **profil de jeu** qui détermine son comportement tactique en match.

| Profil | Distribution | Description |
|---|---|---|
| **Offensif** | 30% des clubs IA | Préfère attaquer, prend des risques |
| **Équilibré** | 45% des clubs IA | Jeu pragmatique, s'adapte au contexte |
| **Défensif** | 25% des clubs IA | Privilégie la solidité, contre-attaque |

Le profil est assigné aléatoirement à la création du club et ne change pas au cours de la saison.

---

## 4. Génération de l'effectif IA

### 4.1 Paramètres par division

| Paramètre | Division 1 | Division 2 | Division 3 |
|---|---|---|---|
| Overall moyen | 75 | 65 | 57 |
| Plage d'overall | 70-80 | 60-70 | 50-65 |
| Joueurs par club | 22 | 22 | 22 |
| Répartition | 2 GK, 6 DEF, 6 MID, 4 ATT, 4 polyvalents | idem | idem |
| Âge moyen | 27 | 26 | 24 |
| Plage d'âge | 20-33 | 19-32 | 18-31 |
| Variance overall | ±5 sur l'overall moyen | ±5 | ±7 (plus hétérogène) |

### 4.2 Algorithme de génération

Pour chaque club IA :

```
1. Définir l'overall_cible selon la division
2. Pour chaque joueur (22 au total) :
   a. Assigner un poste selon la répartition
   b. Tirer un overall = overall_cible + random(-variance, +variance)
   c. Borner l'overall dans la plage de la division
   d. Générer les stats individuelles :
      - Pour chaque stat, calculer : stat = overall ± random(0, 5)
      - Pondérer selon le poste (un ST aura plus de tir, moins de tackling)
      - Borner chaque stat dans [1, 99]
   e. Générer un potentiel :
      - Si âge ≤ 23 : potentiel = overall + random(5, 20)
      - Si âge 24-29 : potentiel = overall + random(0, 5)
      - Si âge ≥ 30 : potentiel = overall
   f. Générer nom, prénom, nationalité (aléatoires)
   g. Générer un contrat : matches_remaining = random(10, 30)
   h. Générer un salaire : overall × 500 + random(0, 2000)
```

### 4.3 Cohérence d'effectif

L'effectif doit être jouable :
- Au moins 2 gardiens
- Au moins 4 défenseurs centraux (CB)
- Au moins 2 latéraux (LB + RB)
- Au moins 4 milieux (CDM, CM, CAM)
- Au moins 3 attaquants (LW, RW, ST, CF)
- Chaque joueur a au moins 1 position naturelle

### 4.4 Positions secondaires IA

Pour ajouter de la diversité, chaque joueur IA a une probabilité d'avoir des positions secondaires :
- 40% chance d'avoir 1 position secondaire "accomplished"
- 15% chance d'avoir 2 positions secondaires

Positions secondaires logiques (exemples) :
- CB → CDM (accompli), LB (familier)
- CM → CDM (accompli), CAM (accompli)
- LW → LB (familier), ST (familier)
- ST → CF (accompli), CAM (familier)

---

## 5. Décisions pré-match de l'IA

### 5.1 Sélection de la formation

Chaque profil a des formations préférées :

| Profil | Formations (par ordre de préférence) |
|---|---|
| **Offensif** | 4-3-3, 4-2-3-1, 3-4-3 |
| **Équilibré** | 4-4-2, 4-2-3-1, 4-5-1 |
| **Défensif** | 5-4-1, 5-3-2, 4-5-1 |

L'IA choisit la première formation de sa liste de préférence pour laquelle elle dispose de suffisamment de joueurs aptes aux postes requis.

### 5.2 Sélection du XI titulaire

L'IA utilise l'algorithme AutoLineup (SPEC-04 §6.2), identique à celui proposé aux joueurs humains :

```
Pour chaque poste de la formation choisie :
1. Filtrer les joueurs APTES (non blessés, non suspendus)
2. Trier par :
   a. Compatibilité au poste (Natural > Accomplished > Unfamiliar > Unsuited)
   b. Overall effectif au poste (avec malus de compatibilité)
   c. Fatigue la plus basse
3. Sélectionner le meilleur joueur disponible
4. Le retirer du pool pour les postes suivants
```

### 5.3 Sélection des remplaçants

L'IA sélectionne **7 remplaçants** (SPEC-04 §5.1) en priorisant :
1. 1 gardien remplaçant (obligatoire)
2. Les joueurs avec le meilleur overall parmi les non-sélectionnés
3. Diversité de postes (au moins 1 DEF, 1 MID, 1 ATT sur le banc)

### 5.4 Paramètres tactiques

Chaque profil définit des instructions tactiques par défaut (SPEC-03 §9) :

| Instruction | Offensif | Équilibré | Défensif |
|---|---|---|---|
| **Mentalité** | Attacking | Balanced | Defensive |
| **Pressing** | Haut | Moyen | Bas |
| **Style de passe** | Direct | Mixte | Court |
| **Largeur** | Large | Moyenne | Étroite |
| **Tempo** | Rapide | Moyen | Lent |
| **Ligne défensive** | Haute | Moyenne | Basse |

### 5.5 Tireurs de coups de pied arrêtés

L'IA assigne les tireurs automatiquement :

| Coup de pied arrêté | Critère de sélection |
|---|---|
| Pénalty | Joueur de champ avec le meilleur score `penalties` |
| Coup franc | Joueur de champ avec le meilleur score `freeKick` |
| Corner gauche | Joueur de champ avec le meilleur score `crossing` parmi les droitiers |
| Corner droit | Joueur de champ avec le meilleur score `crossing` parmi les gauchers (ou meilleur crossing si pas de gaucher) |

---

## 6. Décisions en match de l'IA

### 6.1 Points de décision

L'IA évalue la situation et prend des décisions à **3 moments clés** du match :

| Moment | Minute | Actions possibles |
|---|---|---|
| **Mi-temps** | 45+HT | Substitutions, changement de mentalité, changement de formation |
| **60e minute** | 60 | Substitutions, changement de mentalité |
| **75e minute** | 75 | Substitutions, changement de mentalité, mode "fin de match" |

### 6.2 Arbre de décision

À chaque point de décision, l'IA évalue le **contexte** :

```typescript
interface AIDecisionContext {
  scoreDiff: number;         // score_equipe_IA - score_adversaire
  minute: number;            // minute actuelle
  substitutionsUsed: number; // remplacements effectués (max 5)
  fatigueAvg: number;        // fatigue moyenne des titulaires
  yellowCards: number;       // nombre de cartons jaunes dans l'équipe
  redCards: number;          // nombre de cartons rouges
  currentMentality: string;  // mentalité actuelle
}
```

### 6.3 Règles de décision

#### Changement de mentalité

```
SI scoreDiff ≤ -2 ET minute ≥ 60 :
    → Mentalité "Ultra-attacking" (Ultra-offensif)

SI scoreDiff = -1 ET minute ≥ 75 :
    → Mentalité "Attacking" (Offensif)

SI scoreDiff = -1 ET minute < 75 :
    → Mentalité un cran plus offensive que le profil par défaut

SI scoreDiff = 0 :
    → Garder la mentalité par défaut du profil

SI scoreDiff = 1 ET minute ≥ 75 :
    → Mentalité un cran plus défensive que le profil par défaut

SI scoreDiff ≥ 2 :
    → Mentalité "Defensive" (Défensif)

SI redCards ≥ 1 :
    → Mentalité un cran plus défensive (sauf si mené de 2+)
```

#### Changement de formation (mi-temps uniquement)

```
SI scoreDiff ≤ -2 :
    → Passer à une formation plus offensive (4-3-3, 3-4-3)

SI redCards ≥ 1 ET formation actuelle a 3 défenseurs :
    → Passer à une formation à 4 défenseurs

SI fatigueAvg > 70 ET profil = Offensif :
    → Passer à une formation plus équilibrée (réduire l'effort)
```

### 6.4 Logique de substitution

L'IA effectue des remplacements selon cette priorité :

```
Priorité 1 : Joueur avec carton rouge (sortie obligatoire — géré par le moteur)

Priorité 2 : Joueur blessé en match (sortie obligatoire — géré par le moteur)

Priorité 3 : Joueur avec fatigue ≥ 85%
    → Remplacer par le meilleur joueur disponible au même poste
    → Si pas de joueur au même poste, chercher un joueur en position accomplie

Priorité 4 : Joueur avec carton jaune ET fatigue ≥ 70% (risque d'expulsion)
    → Remplacer par le meilleur joueur disponible au même poste

Priorité 5 : Remplacement tactique (si changement de formation)
    → Remplacer le joueur le moins adapté à la nouvelle formation

Priorité 6 : Fraîcheur offensive (si minute ≥ 75 ET mené)
    → Remplacer un attaquant/milieu fatigué par un joueur frais
```

**Nombre de remplacements par point de décision :**

| Moment | Max remplacements |
|---|---|
| Mi-temps | 2 |
| 60e minute | 1 |
| 75e minute | 2 (utilise les remplacements restants) |

L'IA utilise au maximum **4 de ses 5 substitutions** (en garde 1 de réserve pour les blessures/expulsions), sauf si elle est menée après la 75e minute (utilise les 5).

### 6.5 Pas de décision hors points clés

Entre les points de décision, l'IA ne modifie **rien**. Les substitutions forcées (blessure en match, carton rouge) sont gérées par le moteur de match (SPEC-03) qui utilise la logique de substitution de l'IA pour choisir le remplaçant.

---

## 7. Matchs amicaux contre l'IA

### 7.1 Niveaux de difficulté

Comme défini dans SPEC-05 §7, les matchs amicaux sont jouables uniquement contre l'IA. Le joueur choisit un niveau de difficulté qui détermine l'overall de l'adversaire IA :

| Niveau | Overall de l'IA | Description |
|---|---|---|
| **Facile** | Moy. overall joueur × 0.85 | Opposition faible pour tester des tactiques |
| **Normal** | Moy. overall joueur × 1.0 | Opposition équivalente, match équilibré |
| **Difficile** | Moy. overall joueur × 1.15 | Opposition supérieure, challenge élevé |

**Calcul** : la moyenne d'overall du joueur est calculée sur les 11 titulaires de sa dernière composition validée (ou AutoLineup si pas de composition).

### 7.2 Génération du club IA amical

Le club IA pour un amical est **généré à la volée** (pas stocké en base de façon permanente) :

1. Générer un nom, couleurs, logo aléatoires
2. Générer un effectif de 18 joueurs (11 + 7) calibré au niveau choisi
3. Assigner un profil aléatoire (Offensif/Équilibré/Défensif)
4. Le club IA amical est supprimé après le post-match processing

### 7.3 Limites

| Paramètre | Valeur |
|---|---|
| Max amicaux par jour | 1 (SPEC-05 §7) |
| Jours autorisés | Pas de match officiel programmé dans les prochaines 24h |
| Récompenses | Aucune (pas de G$, pas de points) |
| Impact | Fatigue et blessures s'appliquent normalement |

---

## 8. Gestion intersaison de l'IA

### 8.1 Régénération silencieuse

À chaque intersaison (SPEC-05 §6), les effectifs IA sont ajustés :

```
Pour chaque club IA :

1. VIEILLISSEMENT
   - Appliquer la progression/régression naturelle (SPEC-04 §11)
   - Retirer les joueurs ayant atteint 35 ans (retraite)

2. DÉPARTS (3-5 joueurs)
   - Retirer les joueurs dont le contrat a expiré (matches_remaining = 0)
   - Si moins de 3 départs naturels : retirer les joueurs les plus faibles
     (overall le plus bas parmi les non-titulaires)
   - Maximum 5 départs au total

3. ARRIVÉES (compléter à 22 joueurs)
   - Générer de nouveaux joueurs calibrés à la division ACTUELLE
   - Favoriser les postes manquants
   - Âge des recrues : 18-25 (renouvellement de l'effectif)

4. RECALIBRAGE (si changement de division)
   - SI promu (ex: Div 3 → Div 2) :
     Pour chaque joueur, overall += random(2, 5)
     Borner dans la plage de la nouvelle division
   - SI relégué (ex: Div 1 → Div 2) :
     Pour chaque joueur, overall -= random(2, 5)
     Borner dans la plage de la nouvelle division

5. RENOUVELLEMENT DES CONTRATS
   - Tous les joueurs restants : matches_remaining = random(15, 30)
   - Recalculer les salaires selon le nouvel overall

6. PROFIL
   - 20% de chance de changer de profil de jeu (évolution du "coach IA")
```

### 8.2 Remplacement d'un club humain par l'IA

Quand un joueur humain abandonne (SPEC-05 §3.4, 21 jours d'inactivité) :

```
1. Le club existant est conservé (nom, couleurs, logo, palmarès)
2. Le flag is_ai est passé à true
3. Le user_id est mis à null
4. L'effectif existant est conservé tel quel
5. Un profil IA est assigné aléatoirement
6. Le club continue sa saison normalement
```

L'avantage : la ligue n'est pas perturbée, le club garde son identité et ses résultats.

### 8.3 Remplacement d'un club IA par un humain

Quand un nouveau joueur rejoint une ligue qui a un emplacement IA en Division 3 :

```
1. Le club IA est retiré (ou converti)
2. Le nouveau joueur crée son propre club (SPEC-02 §4.1)
3. Le nouveau club prend la place du club IA dans le calendrier
4. Les résultats du club IA sont conservés dans le classement
   (le nouveau club hérite de la position mais repart de 0 points)
```

**Remarque** : cette situation est rare — normalement un nouveau joueur crée un club et est assigné à une place libre. Le remplacement IA → humain n'arrive que si le système crée une nouvelle ligue et un humain rejoint rapidement.

**Correction** : en pratique, le nouveau joueur crée son club et il est simplement assigné à une division. Le club IA qui était en "trop" est retiré pour libérer la place. Le nouveau club humain démarre avec 0 points et rattrape le calendrier en cours.

---

## 9. Indistinguabilité IA/Humain

### 9.1 Principe fondamental

Du point de vue du joueur humain, un club IA doit apparaître exactement comme un club humain :

| Aspect | Traitement |
|---|---|
| Page profil club | Identique (nom, logo, couleurs, effectif, stats, palmarès) |
| Classement | Aucune distinction |
| Fiche joueur adversaire | Mêmes stats, mêmes infos |
| Post-match | Même résumé, mêmes événements, mêmes stats |
| Marché des transferts | Les joueurs IA **des clubs IA** ne sont pas sur le marché (seuls les joueurs IA **générés pour le marché** sont disponibles) |

### 9.2 Ce qui n'est PAS exposé au client

| Information | Raison |
|---|---|
| `is_ai` flag | Le joueur ne doit pas savoir s'il joue contre une IA |
| `ai_profile` | Détail d'implémentation |
| Dernière connexion du "manager" | Les clubs IA n'ont pas de user_id, donc pas de last_active_at |
| Actions de transfert IA | L'IA ne fait pas de transferts visibles |

### 9.3 Comportements révélateurs à éviter

Pour maintenir l'illusion :
- L'IA doit utiliser des formations variées (pas toujours la même)
- Les compositions doivent varier d'un match à l'autre (rotations)
- Les décisions en match ne doivent pas être trop prévisibles
- Le profil de jeu ne change pas en cours de saison (cohérent avec un "coach" qui a un style)

---

## 10. Modèle de données

### 10.1 Modifications sur la table `clubs`

| Colonne ajoutée | Type | Description |
|---|---|---|
| `is_ai` | `boolean` | `true` si club IA, `false` si club humain (défaut: false) |
| `ai_profile` | `enum` NULLABLE | `offensive`, `balanced`, `defensive` (null si club humain) |

**Index** :
- `INDEX` sur `is_ai` (requêtes de filtrage)

### 10.2 Pas de tables supplémentaires

Les clubs IA utilisent les mêmes tables que les clubs humains :
- `clubs` (avec `user_id = null` et `is_ai = true`)
- `players`, `player_stats`, `goalkeeper_stats` (effectif IA)
- `club_tactics`, `club_lineup` (composition et tactique IA)
- `matches`, `match_events`, etc. (résultats)
- `standings` (classement)

C'est un choix architectural fondamental : **un seul modèle de données** pour humains et IA. Cela simplifie toutes les requêtes (classement, matchs, stats) et garantit la cohérence.

---

## 11. Architecture technique

### 11.1 Service AIManager

```typescript
class AIManagerService {
  // Pré-match (appelé par le scheduler T-15min — SPEC-03 §4.2)
  async prepareMatchLineup(clubId: string): Promise<void>

  // En match (appelé par le match engine à 45+HT, 60, 75)
  async makeInMatchDecision(matchId: string, clubId: string, context: AIDecisionContext): Promise<AIDecision>

  // Intersaison (appelé par le job d'intersaison — SPEC-05 §6)
  async regenerateSquad(clubId: string, newDivision: number): Promise<void>

  // Génération (appelé à la création de ligue — SPEC-05 §3.2)
  async generateAIClub(leagueId: string, divisionLevel: number): Promise<Club>

  // Amicaux (appelé quand un joueur lance un amical — SPEC-05 §7)
  async generateFriendlyOpponent(playerAvgOverall: number, difficulty: string): Promise<Club>
}
```

### 11.2 Intégration avec le moteur de match

Le moteur de match (SPEC-03) doit appeler l'AIManager :

```
Moteur de match (chaque minute simulée) :
    │
    ├── Minute 45 (mi-temps) :
    │   SI club_home.is_ai → AIManager.makeInMatchDecision(...)
    │   SI club_away.is_ai → AIManager.makeInMatchDecision(...)
    │
    ├── Minute 60 :
    │   (idem)
    │
    ├── Minute 75 :
    │   (idem)
    │
    └── Blessure/Expulsion en match :
        SI club.is_ai → AIManager.selectSubstitute(...)
```

### 11.3 Type AIDecision

```typescript
interface AIDecision {
  substitutions: Array<{
    playerOut: string; // player_id
    playerIn: string;  // player_id
  }>;
  newMentality?: Mentality;     // changement de mentalité (nullable)
  newFormation?: Formation;     // changement de formation (nullable, mi-temps uniquement)
  tacticalChanges?: {           // changements d'instructions (nullable)
    pressing?: PressingLevel;
    passingStyle?: PassingStyle;
    width?: Width;
    tempo?: Tempo;
    defensiveLine?: DefensiveLine;
  };
}
```

---

## 12. Jobs BullMQ

| Job | Déclencheur | Description |
|---|---|---|
| `generate-ai-clubs` | Création de ligue (SPEC-05) | Génère les 59 clubs IA d'une nouvelle ligue |
| `prepare-ai-lineup` | T-30min avant match | Prépare la composition et la tactique de chaque club IA jouant dans le créneau |
| `ai-intersaison` | Intersaison (SPEC-05 §6) | Régénère les effectifs IA (départs, arrivées, recalibrage) |
| `generate-friendly-opponent` | Demande d'amical par un joueur | Génère un club IA éphémère pour le match amical |

**Note** : les décisions en match (`makeInMatchDecision`) ne sont pas des jobs séparés — elles sont appelées inline par le job du moteur de match (SPEC-03) aux minutes 45, 60 et 75.

---

## 13. User Stories

### Génération & Identité

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AI-01 | Système | Générer des clubs IA avec nom, logo, couleurs et staff crédibles | Peupler les ligues avec des clubs variés | Noms uniques par ligue, couleurs variées, staff généré |
| AI-02 | Système | Générer un effectif IA complet et cohérent par division | Garantir des matchs équilibrés | 22 joueurs, répartition logique, overall calibré |
| AI-03 | Système | Assigner un profil de jeu à chaque club IA | Créer de la variété tactique | 3 profils distribués (30% OFF, 45% BAL, 25% DEF) |

### Comportement en match

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AI-04 | Moteur de match | Que l'IA prépare une composition valide avant chaque match | Garantir des matchs jouables | XI titulaire + 7 remplaçants, formation cohérente |
| AI-05 | Moteur de match | Que l'IA ajuste sa tactique à la mi-temps | Simuler un coach réactif | Changement de mentalité/formation si contexte le justifie |
| AI-06 | Moteur de match | Que l'IA fasse des substitutions intelligentes | Gérer la fatigue et les cartons | Remplacements par priorité (blessure > fatigue > tactique) |
| AI-07 | Moteur de match | Que l'IA passe en mode offensif si menée en fin de match | Créer de la tension et du suspense | Mentalité offensive à 75e si scoreDiff < 0 |
| AI-08 | Moteur de match | Que l'IA gère les substitutions forcées (blessure, rouge) | Ne pas jouer à 10 sans raison | Remplacement immédiat si substitutions disponibles |

### Expérience joueur

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AI-09 | Joueur | Ne pas pouvoir distinguer un club IA d'un club humain | Être immergé dans le jeu | Même affichage, pas de badge IA, même post-match |
| AI-10 | Joueur | Affronter des IA de styles variés | Avoir des matchs différents | 3 profils avec des tactiques distinctement différentes |
| AI-11 | Joueur | Jouer des matchs amicaux contre une IA calibrée | M'entraîner et tester des tactiques | 3 niveaux de difficulté, calibrage sur mon overall |
| AI-12 | Joueur | Que la difficulté augmente quand je monte en division | Ressentir une progression | Div 3 < Div 2 < Div 1 en terme de challenge |

### Intersaison & Évolution

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AI-13 | Système | Régénérer les effectifs IA en intersaison | Renouveler le challenge chaque saison | 3-5 départs, recrues jeunes, recalibrage si promo/relégation |
| AI-14 | Système | Remplacer un club humain abandonné par l'IA | Maintenir la ligue complète | Même club, même effectif, flag is_ai activé |
| AI-15 | Système | Recalibrer les overalls IA après promotion/relégation | Adapter le niveau à la division | +2/+5 si promu, -2/-5 si relégué |

---

## 14. Stratégie de tests

### Tests unitaires

- **Sélection de formation** : pour chaque profil, vérifier que la formation choisie est cohérente avec les joueurs disponibles
- **AutoLineup IA** : vérifier que les 11 titulaires sont les meilleurs pour chaque poste, pas de blessé/suspendu
- **Arbre de décision** : tester chaque branche (mené de 2, à égalité, en tête, carton rouge, fatigue élevée)
- **Logique de substitution** : vérifier l'ordre de priorité (blessure > fatigue > tactique)
- **Génération d'effectif** : vérifier la répartition par poste, la plage d'overall, l'âge, les positions secondaires
- **Formule de calibrage** : vérifier que les overalls après promotion/relégation restent dans les plages

### Tests d'intégration

- **Match complet IA vs IA** : simuler un match entier entre 2 clubs IA, vérifier que les décisions sont prises aux bons moments et que le match se termine normalement
- **Match humain vs IA** : vérifier que l'IA prend des décisions pendant que le joueur humain joue
- **Intersaison** : vérifier le cycle complet (départs → arrivées → recalibrage → renouvellement contrats)
- **Remplacement club humain → IA** : vérifier la conversion et la continuité en championnat
- **Amical** : génération du club IA éphémère, match, suppression post-match

### Tests de charge

- **Génération massive** : générer 59 clubs IA (1 ligue complète) en temps raisonnable (< 30s)
- **Décisions parallèles** : 10 matchs simultanés avec des clubs IA qui prennent des décisions aux mêmes minutes

---

## 15. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Profils IA | 3 profils simples (Offensif, Équilibré, Défensif) | 3.3 |
| Points de décision en match | 3 moments clés (mi-temps, 60e, 75e) | 6.1 |
| Gestion intersaison | Régénération silencieuse (pas de vrais transferts) | 8 |
| Finances IA | Non simulées (pas de budget, pas de transactions) | 2 |
| Palmarès IA | Accumulé naturellement (pas de fake history) | 3.1 |
| Stockage | Même tables que les clubs humains | 10 |
| Distinguabilité | Non distinguable côté client | 9 |
| Transferts IA | L'IA ne fait pas de transferts sur le marché (sauf achat de listings humains SPEC-06 §5.5) | 2 |
| Matchs amicaux | Club IA éphémère, 3 niveaux calibrés sur le joueur | 7 |
| Machine learning | Non, rule-based AI suffisant pour le MVP | 6 |
| Substitution intelligente vs basique | Intelligente avec priorités | 6.4 |
| Nombre max de subs IA utilisées | 4 (garde 1 en réserve), 5 si mené après 75e | 6.4 |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
