# SPEC-06 : Transferts & Marché des joueurs

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-01 (Auth), SPEC-02 (Club), SPEC-04 (Effectif), SPEC-05 (Championnat)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03

---

## 1. Objectif

Permettre aux clubs d'**acheter, vendre et libérer** des joueurs via un système de marché dynamique. Le système doit créer un écosystème économique engageant où chaque transaction est un choix stratégique : renforcer son effectif tout en gérant un budget limité.

**Philosophie** : le marché des transferts est le principal levier d'amélioration du club hors matchs. Il doit être suffisamment riche pour créer des moments "waouh" (trouver une pépite, vendre cher, recevoir une offre inattendue) tout en restant simple à utiliser.

---

## 2. Règles métier fondamentales

| Règle | Valeur |
|---|---|
| Marché | Ouvert en permanence (pas de fenêtre de transfert) |
| Scope | Global (toutes les ligues) |
| Joueurs IA sur le marché | ~50, refresh quotidien |
| Effectif max par club | **25 joueurs** |
| Effectif min par club | **16 joueurs** (sécurité — ne peut pas vendre/libérer en dessous) |
| Offres entre clubs humains | Oui (offre + 1 contre-offre max) |
| Délai de réponse aux offres | 48 heures |
| Offres sortantes simultanées max | 3 par club |
| Clause libératoire | Déclenche un achat automatique |
| Agents libres | Pool visible, recrutement gratuit (pas de frais de transfert) |
| Contrat à l'achat | Standard (20 matchs, salaire basé sur l'overall) |
| Durée min de mise en vente | 24 heures (pas d'annulation avant) |

---

## 3. Structure du marché

Le marché des transferts est divisé en **3 onglets** :

```
┌──────────────────────────────────────────────────────────────┐
│  MARCHÉ DES TRANSFERTS                                        │
│                                                                │
│  [Joueurs disponibles]  [Agents libres]  [Mes transferts]     │
│  ─────────────────────────────────────────────────────────    │
│                                                                │
│  ... contenu de l'onglet actif ...                             │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

| Onglet | Contenu |
|---|---|
| **Joueurs disponibles** | Joueurs IA du marché + joueurs mis en vente par des clubs humains |
| **Agents libres** | Joueurs sans club (libérés ou fin de contrat) — recrutement gratuit |
| **Mes transferts** | Historique des transactions du club + offres en cours (envoyées/reçues) |

---

## 4. Marché IA

### 4.1 Génération des joueurs IA

Chaque jour à **04:00 UTC**, le système rafraîchit le marché IA :

1. Retirer les joueurs IA invendus depuis **7 jours** (ils disparaissent)
2. Compléter le marché jusqu'à **~50 joueurs IA** avec de nouvelles générations

**Paramètres de génération :**

| Paramètre | Valeur |
|---|---|
| Nombre cible | 50 joueurs IA sur le marché |
| Répartition par poste | Proportionnelle : 4 GK, 14 DEF, 16 MID, 16 ATT |
| Répartition par niveau | Voir tableau ci-dessous |
| Âge | 18-33 ans, distribution réaliste (courbe en cloche centrée sur 25) |
| Noms | Générés aléatoirement (même base que SPEC-02 §4.2) |
| Stats | Générées selon l'overall cible + variance par stat (±5) |
| Potentiel | Généré selon l'âge (jeunes = potentiel plus élevé) |

**Répartition par niveau (sur 50 joueurs) :**

| Tranche d'overall | Nombre | Label marché | Probabilité |
|---|---|---|---|
| 50-59 | ~20 | Joueur moyen | 40% |
| 60-69 | ~18 | Bon joueur | 36% |
| 70-79 | ~10 | Très bon joueur | 20% |
| 80-89 | ~2 | Joueur d'élite | 4% |
| 90+ | 0 | — | 0% (pas en marché IA) |

**Remarque** : les joueurs d'élite (80+) sont rares et chers, créant un moment de découverte quand ils apparaissent sur le marché.

### 4.2 Pricing des joueurs IA

Le prix d'un joueur IA est calculé selon la formule suivante :

```
valeur_base = ((overall - 40) / 10) ^ 2.5 × 100 000

// Modificateur âge
age_modifier =
  si âge ≤ 21 → × 1.5   (jeune à fort potentiel)
  si âge 22-24 → × 1.3   (jeune prometteur)
  si âge 25-29 → × 1.0   (pic de carrière)
  si âge 30-31 → × 0.7   (déclin proche)
  si âge 32-33 → × 0.5   (fin de carrière)

// Modificateur potentiel
potential_modifier =
  si potential - overall ≥ 15 → × 1.4  (pépite)
  si potential - overall ≥ 10 → × 1.2  (bon potentiel)
  si potential - overall ≥ 5  → × 1.1  (potentiel correct)
  sinon → × 1.0

// Modificateur poste (rareté)
position_modifier =
  ST, CF → × 1.15  (attaquants recherchés)
  GK     → × 0.85  (gardiens moins chers)
  autres → × 1.0

prix_final = arrondi(valeur_base × age_modifier × potential_modifier × position_modifier, -4)
// Arrondi aux 10 000 G$ les plus proches
```

**Exemples de prix :**

| Overall | Âge | Potentiel | Poste | Prix estimé |
|---|---|---|---|---|
| 55 | 20 | 72 | CM | ~410 000 G$ |
| 60 | 26 | 64 | CB | ~570 000 G$ |
| 65 | 24 | 70 | LW | ~1 290 000 G$ |
| 70 | 28 | 72 | ST | ~1 790 000 G$ |
| 75 | 22 | 85 | CAM | ~4 170 000 G$ |
| 80 | 25 | 83 | ST | ~3 680 000 G$ |
| 85 | 30 | 86 | CM | ~3 010 000 G$ |

### 4.3 Variation de prix

Pour éviter un marché trop prévisible, un **facteur aléatoire** de ±15% est appliqué au prix final :

```
prix_affiché = prix_final × (1 + random(-0.15, 0.15))
```

Cela crée des bonnes affaires et des joueurs surcotés, incitant le joueur à évaluer les opportunités.

---

## 5. Mise en vente par un club humain

### 5.1 Lister un joueur

Un joueur peut mettre en vente n'importe quel joueur de son effectif, à condition que :

| Condition | Détail |
|---|---|
| Effectif suffisant | L'effectif ne doit pas descendre sous 16 joueurs après la vente |
| Pas dans la composition | Le joueur ne doit pas être titulaire ou remplaçant pour le prochain match (avertissement, pas bloquant) |
| Prix minimum | 10 000 G$ (éviter les transferts à 0 entre clubs humains) |
| Prix maximum | Pas de limite (le marché régule naturellement) |
| Durée min de listing | 24 heures (impossible de retirer avant) |
| Listings simultanés | Max **5 joueurs** en vente par club |

### 5.2 Prix suggéré

Quand le joueur met un joueur en vente, le système affiche un **prix suggéré** calculé avec la même formule que le pricing IA (§4.2). Le joueur est libre de fixer un prix différent.

### 5.3 Visibilité

Les joueurs mis en vente par des humains apparaissent dans l'onglet "Joueurs disponibles" avec un badge distinctif :

| Badge | Signification |
|---|---|
| 🤖 IA | Joueur généré par le marché IA |
| 👤 Club | Joueur mis en vente par un club humain |

### 5.4 Retrait de la vente

Après la période minimum de 24h, le propriétaire peut retirer son joueur de la vente. Si une offre est en cours sur ce joueur, le retrait est bloqué jusqu'à résolution de l'offre.

### 5.5 Achat par l'IA

Les clubs IA peuvent acheter des joueurs mis en vente par des humains. Cela crée de la demande et évite que les listings stagnent.

**Mécanique** : chaque jour lors du refresh marché (04:00 UTC), pour chaque joueur listé par un humain depuis **plus de 3 jours** :
- Probabilité de 15% qu'un club IA l'achète au prix affiché
- L'IA n'achète que si le prix est ≤ 120% de la valeur calculée (§4.2)
- Le joueur disparaît de l'effectif du vendeur, l'argent est crédité

---

## 6. Achat direct (marché)

### 6.1 Achat d'un joueur IA

1. Le joueur consulte la fiche du joueur IA sur le marché
2. Clic "Acheter" → modale de confirmation avec :
   - Prix de transfert
   - Salaire hebdomadaire du contrat
   - Durée du contrat (20 matchs)
   - Solde actuel → solde après achat
3. Validation :
   - Solde suffisant ? (sinon erreur "Fonds insuffisants")
   - Effectif < 25 ? (sinon erreur "Effectif complet")
4. Transaction :
   - Prix déduit du solde
   - Joueur ajouté à l'effectif avec contrat standard
   - Transaction financière enregistrée
   - Notification : Directeur sportif → "Bienvenue à {Joueur} ! Transfert bouclé pour {prix}."
   - Le joueur IA est retiré du marché

### 6.2 Achat d'un joueur listé par un humain

Même flux que l'achat IA, mais :
- Le prix est celui fixé par le vendeur
- L'argent est crédité au club vendeur
- Le vendeur reçoit une notification : Directeur sportif → "{Joueur} a été vendu à {Club acheteur} pour {prix}."

### 6.3 Contrat standard à l'achat

| Paramètre | Valeur |
|---|---|
| Durée | 20 matchs |
| Salaire hebdomadaire | `overall × 500 + random(0, 2000)` (même formule SPEC-02 §6.3) |
| Clause libératoire | `prix_achat × 1.5` (150% du prix payé) |

---

## 7. Système d'offres (entre clubs humains)

### 7.1 Principe

Un joueur peut faire une offre d'achat sur **n'importe quel joueur d'un club humain**, qu'il soit listé en vente ou non. C'est le mécanisme principal d'échange entre joueurs.

### 7.2 Flux d'offre

```
Club A veut acheter le joueur X du Club B
    │
    ▼
Club A soumet une offre (montant en G$)
    │
    ├── Le joueur X a une clause libératoire
    │   ET l'offre ≥ clause libératoire ?
    │   ──► OUI → Transfert automatique (§8)
    │
    ▼  NON
Notification envoyée à Club B
(Dir. sportif → "{Club A} propose {montant} pour {Joueur}.")
    │
    ▼
Club B a 48h pour répondre :
    │
    ├── ✅ ACCEPTER → Transfert exécuté
    │   (prix déduit A, crédité B, joueur transféré, contrat standard)
    │
    ├── ❌ REFUSER → Offre annulée
    │   (Notification à A : "Votre offre pour {Joueur} a été refusée.")
    │
    ├── 💰 CONTRE-OFFRE → Club B propose un nouveau montant
    │   │
    │   ▼
    │   Club A a 48h pour répondre à la contre-offre :
    │   │
    │   ├── ✅ ACCEPTER → Transfert exécuté au montant de la contre-offre
    │   ├── ❌ REFUSER → Négociation terminée
    │   └── ⏰ EXPIRÉE → Négociation terminée
    │
    └── ⏰ EXPIRÉE (48h sans réponse) → Offre annulée
        (Notification à A : "Votre offre pour {Joueur} a expiré sans réponse.")
```

### 7.3 Règles des offres

| Règle | Valeur |
|---|---|
| Offres sortantes simultanées | Max **3** par club |
| Offre minimum | 10 000 G$ |
| Offre sur joueur en vente | Autorisée (peut offrir en dessous du prix affiché) |
| Offre sur joueur non listé | Autorisée |
| Offre sur joueur de club IA | **Non** (acheter via le marché uniquement) |
| Même joueur, même offrant | 1 offre active à la fois par joueur ciblé |
| Cooldown après refus | 24h avant de pouvoir refaire une offre sur le même joueur |
| Vérification de fonds | Le montant est **bloqué** (réservé) au moment de l'offre |
| Contre-offre | 1 seule autorisée, montant obligatoirement **supérieur** à l'offre initiale |

### 7.4 Blocage de fonds

Quand un club soumet une offre, le montant est **réservé** sur son solde :

```
Solde disponible = solde_total - somme(offres_en_cours)
```

Cela empêche un club de faire 3 offres à 5M alors qu'il n'a que 8M. Si les 3 sont acceptées, il ne pourrait pas payer.

Le montant est débloqué en cas de refus, expiration ou annulation de l'offre.

### 7.5 Notifications d'offre

| Événement | Destinataire | Staff | Message |
|---|---|---|---|
| Offre reçue | Club B | Dir. sportif | "{Club A} propose {montant} pour {Joueur}. Vous avez 48h pour répondre." |
| Offre acceptée | Club A | Dir. sportif | "Offre acceptée ! {Joueur} rejoint votre effectif pour {montant}." |
| Offre refusée | Club A | Dir. sportif | "Votre offre pour {Joueur} a été refusée par {Club B}." |
| Contre-offre reçue | Club A | Dir. sportif | "{Club B} propose une contre-offre de {montant} pour {Joueur}." |
| Contre-offre acceptée | Club B | Dir. sportif | "Contre-offre acceptée ! {Joueur} part vers {Club A} pour {montant}." |
| Contre-offre refusée | Club B | Dir. sportif | "Votre contre-offre pour {Joueur} a été refusée par {Club A}." |
| Offre expirée | Club A | Dir. sportif | "Votre offre pour {Joueur} a expiré sans réponse de {Club B}." |

---

## 8. Clause libératoire

### 8.1 Mécanique

Chaque joueur possède une clause libératoire (`release_clause` dans SPEC-04). Si un club fait une offre **supérieure ou égale** à la clause libératoire, le transfert est **automatique** :

- Pas besoin de l'accord du propriétaire
- Le montant de la clause est déduit de l'acheteur et crédité au vendeur
- Le joueur est transféré immédiatement
- Le propriétaire reçoit une notification : Dir. sportif → "La clause libératoire de {Joueur} a été activée par {Club}. Transfert automatique pour {montant}."

### 8.2 Affichage

La clause libératoire est **visible par tous les clubs** sur la fiche d'un joueur. C'est une information publique (comme dans le football réel pour la Liga par exemple).

### 8.3 Clause par défaut

| Contexte | Formule clause |
|---|---|
| Joueur généré (création club) | `valeur_calculée × 2.0` |
| Joueur acheté sur le marché | `prix_achat × 1.5` |
| Joueur recruté comme agent libre | `valeur_calculée × 1.5` |
| Après prolongation de contrat | `valeur_calculée × 2.0` (recalculée) |

La valeur calculée utilise la formule de pricing §4.2.

---

## 9. Pool d'agents libres

### 9.1 Alimentation du pool

Un joueur devient agent libre dans les cas suivants :

| Cas | Détail |
|---|---|
| Fin de contrat | `matches_remaining` atteint 0 → le joueur quitte le club à la fin du matchday |
| Libération par le club | Action volontaire du manager (voir §10) |
| Suppression de club | Quand un club est retiré (abandon SPEC-05), tous ses joueurs humains vont dans le pool |

### 9.2 Caractéristiques des agents libres

| Paramètre | Valeur |
|---|---|
| Frais de transfert | **0 G$** (gratuit) |
| Malus d'inactivité | -2 sur l'overall après **7 jours** sans club (manque de compétition) |
| Durée max dans le pool | **14 jours** (après, le joueur disparaît du jeu) |
| Contrat proposé | Standard (20 matchs, salaire basé sur l'overall actuel) |
| Disponibilité | Immédiate (pas de délai d'intégration) |

### 9.3 Affichage

Les agents libres sont affichés dans l'onglet dédié du marché avec :
- Un badge "Agent libre"
- Le nombre de jours restants dans le pool (urgence)
- L'ancien club (pour contexte)
- Un indicateur si le malus d'inactivité a été appliqué

### 9.4 Recrutement d'un agent libre

1. Clic "Recruter" → modale de confirmation avec :
   - Pas de frais de transfert
   - Salaire hebdomadaire proposé
   - Durée du contrat (20 matchs)
2. Validation : effectif < 25
3. Le joueur rejoint l'effectif immédiatement

---

## 10. Libération d'un joueur

### 10.1 Conditions

| Condition | Détail |
|---|---|
| Effectif suffisant | Ne doit pas descendre sous 16 joueurs |
| Pas de listing actif | Le joueur ne doit pas être en vente |
| Pas d'offre en cours | Aucune offre active sur ce joueur |

### 10.2 Coût de libération

Libérer un joueur sous contrat entraîne une **indemnité de rupture** :

```
indemnité = salaire_hebdo × (matches_remaining / 3)
// Arrondi à l'entier supérieur

// Exemple : joueur à 32 000 G$/semaine avec 15 matchs restants
// indemnité = 32 000 × (15 / 3) = 160 000 G$
```

**Si `matches_remaining ≤ 3`** : pas d'indemnité (contrat presque terminé).

### 10.3 Flux de libération

```
Clic "Libérer" sur la fiche joueur
    │
    ▼
Modale de confirmation :
    "Êtes-vous sûr de vouloir libérer {Joueur} ?"
    "Indemnité de rupture : {montant} G$"
    "Le joueur sera placé dans le pool d'agents libres."
    │
    ▼
Validation : solde suffisant pour l'indemnité
    │
    ▼
Indemnité déduite du solde
    │
    ▼
Joueur retiré de l'effectif → ajouté au pool d'agents libres
    │
    ▼
Notification : Dir. sportif → "{Joueur} a été libéré de son contrat. Indemnité versée : {montant}."
```

---

## 11. Fin de contrat

### 11.1 Mécanique

À la fin de chaque matchday, le système vérifie les contrats de tous les joueurs :

```
Pour chaque joueur avec matches_remaining = 0 :
    │
    ▼
Le joueur quitte le club → ajouté au pool d'agents libres
    │
    ▼
Notification au club : Dir. sportif → "Le contrat de {Joueur} est arrivé à terme. Il quitte le club."
```

### 11.2 Alertes de fin de contrat

| Seuil | Notification |
|---|---|
| 10 matchs restants | Dir. sportif → "Le contrat de {Joueur} arrive en fin dans 10 matchs. Pensez à prolonger." (priorité : info) |
| 5 matchs restants | Dir. sportif → "Contrat de {Joueur} : plus que 5 matchs ! Prolongez maintenant." (priorité : warning) |
| 2 matchs restants | Dir. sportif → "URGENT : {Joueur} part dans 2 matchs si vous ne prolongez pas !" (priorité : critical) |

### 11.3 Prolongation

La prolongation de contrat est gérée dans SPEC-04 §12.2. Pour rappel :
- Prolongation : +20 matchs
- Coût : bonus de signature = `overall × 10 000 G$`
- Clause libératoire recalculée

---

## 12. Valorisation des joueurs

### 12.1 Formule de valeur marchande

Chaque joueur a une **valeur marchande estimée** (affichée sur sa fiche). Cette valeur est indicative et sert de référence pour les prix de vente et les offres.

```
valeur_base = ((overall - 40) / 10) ^ 2.5 × 100 000

age_modifier :
  ≤ 21 → × 1.5
  22-24 → × 1.3
  25-29 → × 1.0
  30-31 → × 0.7
  32-33 → × 0.5
  ≥ 34 → × 0.3

potential_modifier :
  potential - overall ≥ 15 → × 1.4
  potential - overall ≥ 10 → × 1.2
  potential - overall ≥ 5  → × 1.1
  sinon → × 1.0

position_modifier :
  ST, CF → × 1.15
  GK     → × 0.85
  autres → × 1.0

contract_modifier :
  matches_remaining ≤ 3  → × 0.3  (presque libre)
  matches_remaining ≤ 10 → × 0.6  (contrat court)
  matches_remaining ≤ 15 → × 0.8  (contrat moyen)
  sinon → × 1.0

valeur_marchande = arrondi(valeur_base × age_modifier × potential_modifier × position_modifier × contract_modifier, -4)
```

**Exemples :**

| Joueur | Overall | Âge | Pot. | Poste | Contrat | Valeur marchande |
|---|---|---|---|---|---|---|
| Jeune pépite | 58 | 19 | 78 | CAM | 18 matchs | ~560 000 G$ |
| Milieu solide | 67 | 26 | 70 | CM | 12 matchs | ~1 070 000 G$ |
| Attaquant star | 78 | 27 | 80 | ST | 20 matchs | ~2 990 000 G$ |
| Vétéran | 72 | 32 | 72 | CB | 5 matchs | ~490 000 G$ |

### 12.2 Recalcul

La valeur marchande est **recalculée** :
- À chaque fin de matchday (les stats/overall peuvent changer via la progression SPEC-04 §11)
- Lors de l'affichage sur le marché (toujours à jour)

---

## 13. Mesures anti-inflation

L'économie du jeu est conçue pour être déficitaire par nature (les salaires dépassent les revenus courants). Les transferts sont le principal moyen de rééquilibrer les finances. Plusieurs mécaniques limitent l'inflation :

| Mécanisme | Effet |
|---|---|
| **Masse salariale** | Drain continu : les gros clubs paient plus de salaires, limitant leur capacité d'achat |
| **Effectif max 25** | Empêche le stockage de joueurs pour revente |
| **Clause libératoire** | Un club rival peut toujours "voler" un joueur star en payant la clause |
| **Contrats courts (20 matchs)** | Les joueurs partent régulièrement en fin de contrat, obligeant à investir |
| **Indemnité de libération** | Coût pour se débarrasser des joueurs inutiles |
| **Marché IA borné** | Max overall 89 sur le marché IA, pas de joueurs 90+ achetables |
| **Refresh quotidien** | Les bonnes affaires expirent, pas de stockage de marché |
| **Pas de joueurs 90+ IA** | Les meilleurs joueurs ne viennent que de la progression interne ou des transferts humains |

### 13.1 Plafond de salaire implicite

Le salaire étant basé sur l'overall (`overall × 500 + random`), un effectif très fort coûte proportionnellement très cher. Un joueur 80 overall coûte ~40K/semaine contre ~30K pour un 60 overall. Un effectif d'élite (25 joueurs, moy. 75 overall) coûterait ~940K/semaine vs ~750K pour un effectif normal (moy. 60).

---

## 14. Filtres & Recherche

### 14.1 Filtres disponibles (marché + agents libres)

| Filtre | Type | Options |
|---|---|---|
| Poste | Multi-select | GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, CF |
| Ligne | Multi-select | Gardien, Défense, Milieu, Attaque |
| Overall (min-max) | Range slider | 40-99 |
| Âge (min-max) | Range slider | 16-40 |
| Prix (min-max) | Range slider | 0 - max |
| Source | Single select | Tous, IA, Club humain |
| Nationalité | Text search | Cosmétique mais filtrable |

### 14.2 Tri

| Critère | Direction par défaut |
|---|---|
| Overall | Décroissant |
| Prix | Croissant |
| Âge | Croissant |
| Potentiel | Décroissant |
| Valeur marchande | Décroissant |
| Ajouté récemment | Plus récent d'abord |

---

## 15. Interface utilisateur

### 15.1 Liste du marché

```
┌──────────────────────────────────────────────────────────────┐
│  MARCHÉ DES TRANSFERTS                                        │
│                                                                │
│  [Joueurs disponibles]  [Agents libres]  [Mes transferts]     │
│                                                                │
│  Filtres : [Poste ▼] [Overall 50-80] [Âge 18-30] [Prix ▼]    │
│  Tri : [Overall ▼]                           50 joueurs        │
│  ─────────────────────────────────────────────────────────    │
│                                                                │
│  🤖 R. Santos        ST    74 OVR   22 ans   ⬆ Pot. 82      │
│     1 580 000 G$                              [Voir] [Acheter]│
│                                                                │
│  👤 M. Eriksen       CM    68 OVR   27 ans   → Pot. 70      │
│     Club : FC Rival   950 000 G$              [Voir] [Acheter]│
│                                                                │
│  🤖 L. Diallo        CB    61 OVR   20 ans   ⬆ Pot. 75      │
│     420 000 G$                                [Voir] [Acheter]│
│                                                                │
│  🤖 T. Wagner        GK    58 OVR   31 ans   → Pot. 59      │
│     180 000 G$                                [Voir] [Acheter]│
│                                                                │
│  ...                                                           │
└──────────────────────────────────────────────────────────────┘
```

### 15.2 Fiche joueur (marché)

```
┌──────────────────────────────────────────────────────────────┐
│  R. SANTOS · Attaquant (ST)                         🤖 IA     │
│                                                                │
│  Overall : 74        Potentiel : 82 ⬆                         │
│  Âge : 22 ans        Nationalité : Brésil 🇧🇷                 │
│                                                                │
│  ── STATS PRINCIPALES ────────────────────────────────────    │
│  Vitesse     78 ████████░░  │  Tir        72 ███████░░░      │
│  Dribble     76 ████████░░  │  Passe      65 ██████░░░░      │
│  Physique    70 ███████░░░  │  Défense    42 ████░░░░░░      │
│                                                                │
│  ── DÉTAILS CONTRAT (après achat) ────────────────────────    │
│  Durée : 20 matchs                                             │
│  Salaire : ~37 500 G$/semaine                                  │
│  Clause libératoire : 2 370 000 G$                             │
│                                                                │
│  ── PRIX ─────────────────────────────────────────────────    │
│  💰 1 580 000 G$                                               │
│                                                                │
│  Votre solde : 4 250 000 G$  →  Après achat : 2 670 000 G$   │
│                                                                │
│  [ ─────── Acheter ─────── ]                                   │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 15.3 Fiche joueur (autre club — offre)

```
┌──────────────────────────────────────────────────────────────┐
│  M. ERIKSEN · Milieu (CM)                       👤 FC Rival   │
│                                                                │
│  Overall : 68        Potentiel : 70                            │
│  Âge : 27 ans        Nationalité : Danemark 🇩🇰                │
│                                                                │
│  ── STATS ────────────────────────────────────────────────    │
│  (stats visibles)                                              │
│                                                                │
│  ── CONTRAT ACTUEL ───────────────────────────────────────    │
│  Club : FC Rival                                               │
│  Matchs restants : 14                                          │
│  Clause libératoire : 1 900 000 G$                             │
│                                                                │
│  Valeur marchande estimée : ~1 070 000 G$                      │
│  En vente : OUI · Prix demandé : 950 000 G$                   │
│                                                                │
│  [ ─── Acheter (950 000 G$) ─── ]                              │
│  [ ─── Faire une offre ─── ]                                   │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 15.4 Onglet "Mes transferts"

```
┌──────────────────────────────────────────────────────────────┐
│  MES TRANSFERTS                                                │
│                                                                │
│  ── OFFRES EN COURS ──────────────────────────────────────    │
│                                                                │
│  📤 Offre envoyée : M. Eriksen (CM, 68)                       │
│     → FC Rival · 850 000 G$ · En attente (36h restantes)      │
│     [Annuler l'offre]                                          │
│                                                                │
│  📥 Offre reçue : L. Garcia (ST, 71)                          │
│     ← AS Monaco · 1 200 000 G$ · En attente (12h restantes)   │
│     [Accepter] [Refuser] [Contre-offre]                        │
│                                                                │
│  ── EN VENTE ─────────────────────────────────────────────    │
│                                                                │
│  T. Bernard (GK, 64) · 300 000 G$ · En vente depuis 2j       │
│     [Retirer de la vente]                                      │
│                                                                │
│  ── HISTORIQUE ───────────────────────────────────────────    │
│                                                                │
│  ✅ R. Santos (ST, 74) acheté · 1 580 000 G$ · il y a 3j     │
│  ✅ P. Müller (CB, 62) vendu à FC Alpha · 500 000 G$ · 5j    │
│  ❌ Offre refusée : J. Kim (CAM, 70) · 2 000 000 G$ · 7j    │
│  ...                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 16. Historique des transferts (fiche joueur)

Chaque joueur possède un **historique de transferts** visible sur sa fiche :

```
── HISTORIQUE ──────────────────────────────
Club actuel : Mon Club (depuis 5 matchs)
  ← Acheté pour 1 580 000 G$ (marché)

Ancien club : Agent libre (2 jours)

Ancien club : FC Omega (18 matchs)
  ← Généré à la création du club
```

Cet historique renforce l'attachement au joueur et permet de tracer sa carrière.

---

## 17. Modèle de données

### 17.1 Table `transfer_listings`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK | Joueur mis en vente |
| `seller_club_id` | `uuid` FK NULLABLE | Club vendeur (null = joueur IA généré) |
| `source` | `enum` | `ai_market`, `human_listing` |
| `price` | `bigint` | Prix demandé en centimes G$ |
| `status` | `enum` | `active`, `sold`, `expired`, `withdrawn` |
| `listed_at` | `timestamp` | Date de mise en vente |
| `sold_at` | `timestamp` | Nullable, date de vente |
| `buyer_club_id` | `uuid` FK NULLABLE | Club acheteur (rempli à la vente) |
| `expires_at` | `timestamp` | Expiration (7j pour IA, null pour humain) |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `status` (filtrer les listings actifs)
- `INDEX` sur `source` + `status` (listing IA vs humain)
- `INDEX` sur `seller_club_id` (listings d'un club)
- `INDEX` sur `expires_at` (cleanup cron)

### 17.2 Table `transfer_offers`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK | Joueur ciblé |
| `from_club_id` | `uuid` FK | Club qui fait l'offre |
| `to_club_id` | `uuid` FK | Club propriétaire du joueur |
| `amount` | `bigint` | Montant offert (centimes G$) |
| `status` | `enum` | `pending`, `accepted`, `rejected`, `counter_offered`, `expired`, `cancelled` |
| `parent_offer_id` | `uuid` FK NULLABLE | Référence vers l'offre initiale (pour les contre-offres) |
| `counter_amount` | `bigint` NULLABLE | Montant de la contre-offre |
| `counter_status` | `enum` NULLABLE | `pending`, `accepted`, `rejected`, `expired` |
| `responded_at` | `timestamp` | Nullable, date de réponse |
| `expires_at` | `timestamp` | Date d'expiration (48h après création) |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `from_club_id` + `status` (offres sortantes actives)
- `INDEX` sur `to_club_id` + `status` (offres reçues actives)
- `INDEX` sur `player_id` + `status` (offres sur un joueur)
- `INDEX` sur `expires_at` (expiration cron)

### 17.3 Table `transfer_history`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK | |
| `from_club_id` | `uuid` FK NULLABLE | Club précédent (null = marché IA ou agent libre) |
| `to_club_id` | `uuid` FK NULLABLE | Club acquéreur (null = libéré / fin de contrat) |
| `type` | `enum` | `market_purchase`, `human_transfer`, `release_clause`, `free_agent`, `released`, `contract_expired`, `club_deleted` |
| `fee` | `bigint` | Montant du transfert (0 pour agent libre/libération) |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `player_id` (historique d'un joueur)
- `INDEX` sur `from_club_id` (historique de ventes)
- `INDEX` sur `to_club_id` (historique d'achats)

### 17.4 Table `free_agents`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK UNIQUE | |
| `previous_club_id` | `uuid` FK NULLABLE | Dernier club |
| `reason` | `enum` | `released`, `contract_expired`, `club_deleted` |
| `penalty_applied` | `boolean` | Malus d'inactivité appliqué (-2 overall) |
| `expires_at` | `timestamp` | Date de disparition (14j) |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `expires_at` (cleanup cron)

---

## 18. API Endpoints

### 18.1 Marché

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/market` | Liste des joueurs disponibles (IA + humains) — paginé, filtrable |
| `GET` | `/market/:listingId` | Détail d'un listing |
| `POST` | `/market/buy/:listingId` | Acheter un joueur listé (direct) |
| `GET` | `/market/free-agents` | Liste des agents libres — paginé, filtrable |
| `POST` | `/market/free-agents/:freeAgentId/sign` | Recruter un agent libre |

### 18.2 Ventes

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/market/sell` | Mettre un joueur en vente |
| `DELETE` | `/market/listings/:listingId` | Retirer un joueur de la vente (après 24h) |
| `GET` | `/market/my-listings` | Mes joueurs en vente |

### 18.3 Offres

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/offers` | Faire une offre sur un joueur |
| `GET` | `/offers/sent` | Mes offres envoyées |
| `GET` | `/offers/received` | Offres reçues |
| `POST` | `/offers/:offerId/accept` | Accepter une offre |
| `POST` | `/offers/:offerId/reject` | Refuser une offre |
| `POST` | `/offers/:offerId/counter` | Faire une contre-offre |
| `POST` | `/offers/:offerId/counter/accept` | Accepter la contre-offre |
| `POST` | `/offers/:offerId/counter/reject` | Refuser la contre-offre |
| `DELETE` | `/offers/:offerId` | Annuler une offre envoyée |

### 18.4 Libération

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/squad/:playerId/release` | Libérer un joueur |

### 18.5 Historique & Valorisation

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/transfers/history` | Historique des transferts du club (paginé) |
| `GET` | `/players/:playerId/transfers` | Historique des transferts d'un joueur |
| `GET` | `/players/:playerId/valuation` | Valeur marchande estimée d'un joueur |

### 18.6 Contrats API détaillés

#### `POST /market/buy/:listingId`

**Response `200`** :
```json
{
  "transfer": {
    "id": "uuid",
    "player": {
      "id": "uuid",
      "name": "R. Santos",
      "position": "ST",
      "overall": 74
    },
    "fee": 1580000,
    "contract": {
      "matchesRemaining": 20,
      "weeklySalary": 37500,
      "releaseClause": 2370000
    }
  },
  "club": {
    "balanceAfter": 2670000,
    "squadSize": 23
  }
}
```

**Erreurs** :
| Code | Cas | Body |
|---|---|---|
| `400` | Effectif complet (25) | `{ "error": "SQUAD_FULL" }` |
| `400` | Fonds insuffisants | `{ "error": "INSUFFICIENT_FUNDS", "required": 1580000, "available": 500000 }` |
| `404` | Listing inexistant ou expiré | `{ "error": "LISTING_NOT_FOUND" }` |
| `409` | Joueur déjà vendu | `{ "error": "ALREADY_SOLD" }` |

#### `POST /offers`

**Request** :
```json
{
  "playerId": "uuid",
  "amount": 850000
}
```

**Response `201`** :
```json
{
  "offer": {
    "id": "uuid",
    "player": { "id": "uuid", "name": "M. Eriksen", "overall": 68 },
    "amount": 850000,
    "toClub": { "id": "uuid", "name": "FC Rival" },
    "status": "pending",
    "expiresAt": "2026-03-05T14:00:00Z"
  },
  "fundsReserved": 850000,
  "availableBalance": 3400000
}
```

**Erreurs** :
| Code | Cas | Body |
|---|---|---|
| `400` | Fonds insuffisants (incl. réservations) | `{ "error": "INSUFFICIENT_FUNDS" }` |
| `400` | Max 3 offres actives | `{ "error": "MAX_OFFERS_REACHED" }` |
| `400` | Cooldown 24h sur ce joueur | `{ "error": "OFFER_COOLDOWN", "retryAfter": "2026-03-04T10:00:00Z" }` |
| `400` | Effectif complet | `{ "error": "SQUAD_FULL" }` |
| `400` | Joueur de son propre club | `{ "error": "OWN_PLAYER" }` |
| `400` | Joueur de club IA | `{ "error": "AI_CLUB_PLAYER" }` |

#### `POST /offers/:offerId/counter`

**Request** :
```json
{
  "amount": 1100000
}
```

**Response `200`** :
```json
{
  "offer": {
    "id": "uuid",
    "counterAmount": 1100000,
    "counterStatus": "pending",
    "expiresAt": "2026-03-07T14:00:00Z"
  }
}
```

**Erreurs** :
| Code | Cas |
|---|---|
| `400` | Contre-offre ≤ offre initiale |
| `400` | Offre déjà contre-offerte |
| `403` | Pas le propriétaire du joueur |

---

## 19. Jobs BullMQ

| Job | Déclencheur | Description |
|---|---|---|
| `refresh-ai-market` | Cron quotidien (04:00 UTC) | Retire les joueurs IA expirés, génère de nouveaux joueurs, achats IA des listings humains |
| `expire-offers` | Cron toutes les heures | Expire les offres et contre-offres dépassant 48h |
| `expire-free-agents` | Cron quotidien (04:00 UTC) | Supprime les agents libres > 14 jours, applique malus -2 overall à J+7 |
| `check-expired-contracts` | Après chaque matchday | Vérifie les `matches_remaining = 0`, libère les joueurs en fin de contrat |
| `recalculate-valuations` | Après chaque matchday | Recalcule les valeurs marchandes de tous les joueurs |
| `process-transfer` | À chaque achat/offre acceptée | Exécute la transaction (transfert joueur, débit/crédit, contrat, notifications) |

---

## 20. User Stories

### Marché & Achat

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRANS-01 | Joueur | Voir la liste des joueurs disponibles sur le marché | Trouver des renforts | Liste paginée, joueurs IA + humains, badge source |
| TRANS-02 | Joueur | Filtrer les joueurs par poste, âge, overall, prix | Cibler mes besoins précis | Tous les filtres fonctionnels, résultats mis à jour en temps réel |
| TRANS-03 | Joueur | Voir la fiche détaillée d'un joueur sur le marché | Évaluer son potentiel avant achat | Stats, contrat proposé, prix, impact sur mon solde |
| TRANS-04 | Joueur | Acheter un joueur du marché (IA ou listing humain) | Renforcer mon effectif | Transaction instantanée, joueur dans l'effectif, solde déduit |
| TRANS-05 | Joueur | Voir mon solde et le nombre de places restantes | Planifier mes achats | Solde affiché, compteur effectif (ex: 22/25) |

### Agents libres

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRANS-06 | Joueur | Voir la liste des agents libres | Recruter gratuitement | Liste avec jours restants, ancien club, malus visible |
| TRANS-07 | Joueur | Recruter un agent libre | Compléter mon effectif sans frais de transfert | Recrutement gratuit, contrat standard, joueur disponible immédiatement |

### Vente & Libération

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRANS-08 | Joueur | Mettre un joueur en vente avec un prix | Générer des revenus | Listing créé, prix suggéré affiché, joueur visible sur le marché |
| TRANS-09 | Joueur | Retirer un joueur de la vente (après 24h) | Changer d'avis | Retrait possible après 24h, joueur retiré du marché |
| TRANS-10 | Joueur | Libérer un joueur de son contrat | Faire de la place ou réduire la masse salariale | Indemnité calculée et affichée, joueur dans le pool agents libres |
| TRANS-11 | Joueur | Voir l'indemnité de rupture avant de libérer | Prendre une décision éclairée | Montant affiché dans la modale de confirmation |

### Offres

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRANS-12 | Joueur | Faire une offre sur un joueur d'un autre club humain | Recruter un joueur ciblé | Offre créée, fonds réservés, notification envoyée au propriétaire |
| TRANS-13 | Joueur | Recevoir et consulter les offres reçues | Décider de vendre ou non | Liste des offres dans "Mes transferts", montant et délai visibles |
| TRANS-14 | Joueur | Accepter une offre | Conclure une vente avantageuse | Transfert exécuté, argent crédité, notification confirmée |
| TRANS-15 | Joueur | Refuser une offre | Garder mon joueur | Offre annulée, notification à l'acheteur |
| TRANS-16 | Joueur | Faire une contre-offre (1 seule) | Négocier un meilleur prix | Contre-offre envoyée, 48h de délai pour l'acheteur |
| TRANS-17 | Joueur | Annuler une offre que j'ai envoyée | Changer de stratégie | Offre annulée, fonds débloqués |
| TRANS-18 | Joueur | Activer la clause libératoire d'un joueur | Acheter sans l'accord du propriétaire | Transfert automatique si offre ≥ clause, notification au vendeur |

### Contrats & Automatismes

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| TRANS-19 | Système | Expirer les offres après 48h sans réponse | Débloquer les fonds et le marché | Offre expirée, fonds débloqués, notifications envoyées |
| TRANS-20 | Système | Retirer un joueur en fin de contrat de l'effectif | Simuler la fin de contrat réaliste | Joueur dans le pool agents libres, notification au club |
| TRANS-21 | Système | Rafraîchir le marché IA quotidiennement | Maintenir un marché dynamique | ~50 joueurs, répartition équilibrée, prix variés |
| TRANS-22 | Système | Supprimer les agents libres après 14 jours | Éviter l'accumulation de joueurs inactifs | Joueurs retirés du pool, pas de notification |
| TRANS-23 | Joueur | Être alerté quand un contrat approche de sa fin (10, 5, 2 matchs) | Anticiper les départs | Notifications à chaque seuil, priorité croissante |
| TRANS-24 | Joueur | Voir l'historique complet de mes transferts | Analyser mes choix passés | Liste paginée avec achats, ventes, libérations |
| TRANS-25 | Joueur | Voir l'historique des transferts d'un joueur | Retracer sa carrière | Liste chronologique des clubs précédents |

---

## 21. Stratégie de tests

### Tests unitaires

- **Formule de valorisation** : vérifier les prix pour différentes combinaisons (overall, âge, potentiel, poste, contrat)
- **Formule d'indemnité de libération** : vérifier pour différents salaires et matchs restants
- **Validation d'offre** : max 3 offres actives, cooldown 24h, fonds suffisants, pas de joueur IA
- **Blocage de fonds** : vérifier le calcul du solde disponible avec offres en cours
- **Pricing IA** : vérifier que le facteur aléatoire reste dans ±15%
- **Marché IA** : vérifier la répartition par niveau et par poste

### Tests d'intégration

- **Achat marché IA** : browse → achat → joueur dans effectif → solde déduit → listing supprimé → transaction financière créée → historique transfert créé
- **Mise en vente + achat** : listing → achat par autre joueur → argent crédité vendeur → joueur transféré
- **Flux d'offre complet** : offre → fonds bloqués → contre-offre → acceptation → transfert → fonds débloqués/transférés
- **Clause libératoire** : offre ≥ clause → transfert automatique sans accord
- **Fin de contrat** : matches_remaining = 0 → joueur retiré → pool agents libres → recrutement par autre club
- **Libération** : libérer → indemnité payée → joueur dans pool → malus à J+7 → expiration à J+14
- **Effectif limites** : vérifier blocage à 25 (achat) et 16 (vente/libération)
- **Expiration offre** : 48h écoulées → offre expirée → fonds débloqués

### Tests E2E (post-MVP)

- Flux complet : rechercher sur le marché → filtrer → acheter → vérifier dans l'effectif → mettre en vente → vendre → vérifier les finances

---

## 22. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Budget séparé vs solde unique | Solde unique (G$, cohérent avec SPEC-02) | 2 |
| Fenêtres de transfert | Marché toujours ouvert (fenêtres post-MVP) | 2 |
| Scope du marché | Global (toutes les ligues) | 2 |
| Taille du marché IA | ~50 joueurs, refresh quotidien | 4.1 |
| Transferts entre humains | Offre + 1 contre-offre max, 48h | 7 |
| Clause libératoire | Achat automatique | 8 |
| Agents libres | Pool avec malus -2 à J+7, expiration J+14 | 9 |
| Taille max effectif | 25 joueurs | 2 |
| Taille min effectif | 16 joueurs (sécurité) | 2 |
| Contrat à l'achat | Standard 20 matchs (pas de négociation salariale MVP) | 6.3 |
| Durée min listing | 24h (pas d'annulation immédiate) | 5.1 |
| Impact moral transferts | Non (morale basée sur résultats uniquement, post-MVP) | — |
| Négociation salariale | Non (salaire fixe basé sur overall, post-MVP) | — |
| Achat IA de listings humains | Oui (15%/jour après 3j, si prix raisonnable) | 5.5 |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
