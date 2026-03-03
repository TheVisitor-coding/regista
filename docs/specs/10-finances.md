# SPEC-10 : Système Financier

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-02 (Club), SPEC-05 (Championnat), SPEC-06 (Transferts)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03
> **Consolidation** : cette spec remplace et étend SPEC-02 §6 (Finances MVP) en une spec dédiée.

---

## 1. Objectif

Mettre en place un système économique **cohérent, contraint et stratégique** qui simule la gestion budgétaire d'un club de football. Les finances sont un levier de décision permanent : le joueur doit arbitrer entre investir (transferts, prolongations) et préserver sa trésorerie.

**Philosophie** : l'économie est volontairement **déficitaire par défaut** — les salaires dépassent les revenus courants. Cela force le joueur à être actif (vendre des joueurs, monter en division, gagner des primes). Un club qui stagne financièrement est un club qui ne survivra pas.

**Modèle économique du jeu** : pas de pay-to-win. La monnaie de jeu (G$) n'est pas achetable avec de l'argent réel. Les éventuelles monétisations futures (cosmétiques, pub) n'impactent pas l'équilibre sportif.

---

## 2. Règles métier fondamentales

| Règle | Valeur |
|---|---|
| Monnaie | G$ (Game Dollars), stocké en centimes (bigint) |
| Solde initial | 5 000 000 G$ |
| Seuil d'alerte orange | 500 000 G$ |
| Seuil critique rouge | 0 G$ |
| Solde négatif | Autorisé temporairement (découvert) |
| Blocage transferts | Si solde < 0 G$ → aucun achat/recrutement possible |
| Fréquence salaires | Hebdomadaire (tous les 7 jours calendaires) |
| Prélèvement salaires | Automatique (même si solde insuffisant → découvert) |

---

## 3. Sources de revenus

### 3.1 Vue d'ensemble

| Source | Montant | Fréquence | Déclencheur |
|---|---|---|---|
| Billetterie (domicile) | Variable (100K-250K) | Par match domicile | Post-match processing |
| Billetterie (extérieur) | Fixe (30K-50K) | Par match extérieur | Post-match processing |
| Droits TV | Fixe par division | Par saison (début) | Début de saison |
| Sponsoring | Fixe par division | Par saison (mensuel) | Chaque 30 jours de jeu |
| Primes de match | Variable selon résultat | Par match officiel | Post-match processing |
| Primes de classement | Variable selon position | Fin de saison | Intersaison (SPEC-05 §6.2) |
| Vente de joueur | Variable | Par transfert | Transfert finalisé (SPEC-06) |

### 3.2 Billetterie

Revenu par match à **domicile**, variable selon la division et les performances :

```
billetterie = base_division + bonus_classement + bonus_forme + random(-10%, +10%)
```

| Paramètre | Div 1 | Div 2 | Div 3 |
|---|---|---|---|
| Base | 150 000 G$ | 120 000 G$ | 100 000 G$ |
| Bonus top 5 | +50 000 G$ | +40 000 G$ | +30 000 G$ |
| Bonus série 3+ victoires | +50 000 G$ | +40 000 G$ | +30 000 G$ |
| **Plage totale** | **150K - 250K** | **120K - 200K** | **100K - 160K** |

Revenu par match à **l'extérieur** (part visiteur) :

| Division | Montant fixe |
|---|---|
| Div 1 | 50 000 G$ |
| Div 2 | 40 000 G$ |
| Div 3 | 30 000 G$ |

### 3.3 Droits TV

Versés en **une seule fois** au début de chaque saison :

| Division | Montant |
|---|---|
| Div 1 | 2 000 000 G$ |
| Div 2 | 1 000 000 G$ |
| Div 3 | 500 000 G$ |

### 3.4 Sponsoring

Contrats de sponsoring automatiques basés sur la division. Versés en **4 mensualités** au cours de la saison (1 tous les ~30 jours de jeu, soit ~4 versements par saison de 114 jours) :

| Division | Total saison | Par versement |
|---|---|---|
| Div 1 | 1 200 000 G$ | 300 000 G$ |
| Div 2 | 600 000 G$ | 150 000 G$ |
| Div 3 | 240 000 G$ | 60 000 G$ |

Le sponsoring est ajusté à la division **en cours**. En cas de promotion/relégation, le nouveau contrat s'applique à la saison suivante.

### 3.5 Primes de match

Versées après chaque match officiel (championnat uniquement, pas les amicaux) :

| Résultat | Prime |
|---|---|
| Victoire | 50 000 G$ |
| Match nul | 20 000 G$ |
| Défaite | 0 G$ |

### 3.6 Primes de classement (fin de saison)

Reprises de SPEC-05 §6.2 :

| Position | Div 1 | Div 2 | Div 3 |
|---|---|---|---|
| 1er (champion) | 5 000 000 G$ | 3 000 000 G$ | 1 000 000 G$ |
| 2e | 3 500 000 G$ | 2 000 000 G$ | 700 000 G$ |
| 3e | 2 500 000 G$ | 1 500 000 G$ | 500 000 G$ |
| 4e-6e | 1 500 000 G$ | 800 000 G$ | 300 000 G$ |
| 7e-10e | 800 000 G$ | 400 000 G$ | 200 000 G$ |
| 11e-15e | 500 000 G$ | 200 000 G$ | 100 000 G$ |
| 16e-20e | 300 000 G$ | 100 000 G$ | 50 000 G$ |

---

## 4. Sources de dépenses

### 4.1 Vue d'ensemble

| Source | Montant | Fréquence | Déclencheur |
|---|---|---|---|
| Masse salariale | Somme des salaires joueurs | Hebdomadaire (7 jours) | Cron automatique |
| Achat de joueur | Variable | Par transfert | Achat finalisé (SPEC-06) |
| Indemnité de libération | Variable | Par libération | Libération de joueur (SPEC-06 §10) |
| Prolongation de contrat | Bonus de signature | Par prolongation | Extension de contrat (SPEC-04 §12.2) |

### 4.2 Masse salariale

Chaque joueur a un salaire hebdomadaire défini à la création ou au transfert :

```
salaire_hebdo = overall × 500 + random(0, 2000)

// Exemples :
// Joueur 55 overall : 27 500 - 29 500 G$/semaine
// Joueur 65 overall : 32 500 - 34 500 G$/semaine
// Joueur 75 overall : 37 500 - 39 500 G$/semaine
// Joueur 85 overall : 42 500 - 44 500 G$/semaine
```

**Prélèvement** : chaque 7 jours calendaires, le système prélève la somme de tous les salaires du club.

**Si solde insuffisant** : le prélèvement passe quand même (le solde devient négatif). C'est le seul cas où le découvert est possible.

### 4.3 Impact du découvert

| Condition | Conséquence |
|---|---|
| Solde < 500K G$ | Notification orange (Dir. sportif) |
| Solde < 0 G$ | Notification rouge + **blocage des transferts entrants** |
| Solde < 0 G$ pendant 2 semaines | Notification critique : "Vendez des joueurs !" |
| Solde < -2 000 000 G$ | **Vente forcée** : le joueur le moins bien noté de l'effectif est automatiquement mis en vente au prix marché (système anti-banqueroute) |

---

## 5. Bilan économique par division

### 5.1 Division 3 (nouveau club)

| Poste | Montant estimé / saison |
|---|---|
| **Revenus** | |
| Billetterie domicile (19 matchs × ~115K) | +2 185 000 |
| Billetterie extérieur (19 matchs × 30K) | +570 000 |
| Droits TV | +500 000 |
| Sponsoring | +240 000 |
| Primes de match (~8V, 6N, 5D) | +520 000 |
| Prime classement (milieu de tableau) | +200 000 |
| **Total revenus** | **~4 215 000 G$** |
| | |
| **Dépenses** | |
| Salaires (22 joueurs × ~30K × 16 sem.) | -10 560 000 |
| **Total dépenses (hors transferts)** | **~-10 560 000 G$** |
| | |
| **Déficit structurel** | **~-6 345 000 G$** |

**Interprétation** : un club de Div 3 avec 22 joueurs perd environ **6.3M par saison** avant transferts. Avec un solde initial de 5M + bonus onboarding (400K), le club a un buffer d'environ **1 saison** avant de devoir vendre.

### 5.2 Stratégies de survie financière

| Stratégie | Impact |
|---|---|
| Vendre 2-3 joueurs/saison à bon prix | +1.5M à +3M |
| Monter en division (plus de revenus) | +2-3M de revenus/saison |
| Remplacer les gros salaires par des jeunes | -2-4M de masse salariale/saison |
| Recruter des agents libres (pas de frais) | Économie sur les transferts |
| Gagner des matchs (primes) | +50K par victoire |
| Finir champion | +1M à 5M selon division |

### 5.3 Division 1 (club établi)

| Poste | Montant estimé / saison |
|---|---|
| Revenus totaux | ~9 300 000 G$ |
| Salaires (22 joueurs, avg 75) | ~13 500 000 G$ |
| **Déficit structurel** | **~-4 200 000 G$** |

Le déficit reste mais est compensé par les primes de classement élevées (5M pour le champion) et les ventes de joueurs à forte valeur.

---

## 6. Interface finances (`/finances`)

### 6.1 Page principale

```
┌──────────────────────────────────────────────────────────────┐
│  FINANCES                                                      │
│                                                                │
│  ── SOLDE ACTUEL ─────────────────────────────────────────    │
│  💰 4 250 000 G$                                    🟢        │
│  Tendance : +160 000 G$ / 7 derniers jours                    │
│                                                                │
│  ── ÉVOLUTION DU SOLDE (30 derniers jours) ───────────────    │
│  5.0M │    ╭──╮                                                │
│       │ ╭──╯  ╰──╮     ╭──╮                                   │
│  4.5M │─╯        ╰──╮──╯  ╰──╮                                │
│       │              ╰──╮     ╰──╭──                           │
│  4.0M │                 ╰────────╯                             │
│       └───────────────────────────────── jours                 │
│                                                                │
│  ── RÉSUMÉ (7 derniers jours) ────────────────────────────    │
│                                                                │
│  ↗ Revenus        +580 000 G$                                  │
│    Billetterie (×2 matchs domicile)       +260 000             │
│    Part visiteur (×1 match extérieur)      +30 000             │
│    Primes de match (2V, 1N)               +120 000             │
│    Sponsoring (versement mensuel)          +60 000             │
│    Droits TV                               +0 (versé en début)│
│    Vente joueur : P. Müller                +110 000            │
│                                                                │
│  ↘ Dépenses       -420 000 G$                                  │
│    Salaires (semaine)                     -380 000             │
│    Achat joueur : R. Santos               -0 (pas d'achat)    │
│    Prolongation : M. Eriksen (bonus)       -40 000             │
│                                                                │
│  ─────────────────────────────────────────────────────────    │
│  Balance nette : +160 000 G$                                   │
│                                                                │
│  ── MASSE SALARIALE ──────────────────────────────────────    │
│  Total hebdo : 380 000 G$ / semaine                            │
│  Joueur le + cher : Rodriguez (42 000 G$/sem)                  │
│  Joueur le - cher : K. Mensah (28 000 G$/sem)                 │
│  [Voir détail par joueur →]                                    │
│                                                                │
│  ── HISTORIQUE DES TRANSACTIONS ──────────────────────────    │
│  [Voir tout l'historique →]                                    │
│                                                                │
│  Filtres : [Tout ▼] [Revenus ▼] [Dépenses ▼] [Transferts ▼]  │
│                                                                │
│  ✅ 02/03 Billetterie (vs FC Rival, dom.)     +145 000 G$     │
│  ✅ 02/03 Prime de victoire                    +50 000 G$     │
│  🔴 01/03 Salaires hebdomadaires              -380 000 G$     │
│  ✅ 28/02 Part visiteur (vs AS Monaco, ext.)   +30 000 G$     │
│  ✅ 28/02 Prime de match nul                   +20 000 G$     │
│  🔴 27/02 Prolongation M. Eriksen (bonus)      -40 000 G$     │
│  ...                                                           │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Détail masse salariale

```
┌──────────────────────────────────────────────────────────────┐
│  MASSE SALARIALE                                               │
│                                                                │
│  Total : 380 000 G$ / semaine                                  │
│  Budget annuel estimé : ~6 080 000 G$ / saison (16 sem.)      │
│                                                                │
│  Joueur              Poste  OVR   Salaire/sem    Contrat      │
│  ─────────────────────────────────────────────────────────    │
│  R. Rodriguez        CB     71    36 200 G$      12 matchs    │
│  M. Eriksen          CM     68    34 800 G$      20 matchs    │
│  R. Santos           ST     74    37 500 G$      18 matchs    │
│  L. Martin           GK     72    36 000 G$      15 matchs    │
│  ...                                                           │
│                                                                │
│  Tri : [Salaire ▼] [Overall ▼] [Contrat ▼]                    │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Prévision budgétaire (widget dashboard)

Le widget finances sur le dashboard affiche une **prévision simplifiée** :

```
💰 Solde : 4 250 000 G$  🟢
   Prochains salaires dans 3j : -380 000 G$
   Prochain match (dom.) : +~120 000 G$
```

---

## 7. Mesures anti-inflation & anti-abus

### 7.1 Plafonds naturels

| Mécanisme | Effet |
|---|---|
| Salaires proportionnels à l'overall | Les équipes fortes coûtent cher |
| Effectif max 25 joueurs (SPEC-06) | Pas de stockage de joueurs |
| Clause libératoire (SPEC-06 §8) | Les stars peuvent être volées |
| Contrats courts (20 matchs) | Renouvellement permanent, coûts récurrents |
| Économie déficitaire | Les clubs perdent de l'argent par défaut |

### 7.2 Anti-farming sur le marché

Mesures déjà définies dans SPEC-06 :
- **Prix minimum de vente** : 10 000 G$ (SPEC-06 §5.1)
- **Achat IA de listings humains** : l'IA n'achète que si prix ≤ 120% de la valeur marchande (SPEC-06 §5.5)
- **Pas de transfert entre clubs du même joueur** : un joueur ne peut avoir qu'un seul compte (SPEC-01 §2)

### 7.3 Vente forcée (anti-banqueroute)

Si le solde descend sous **-2 000 000 G$**, le système déclenche une vente forcée automatique :

1. Sélectionner le joueur avec le **salaire le plus élevé** parmi les non-listés
2. Le mettre en vente au **prix = valeur marchande × 0.8** (prix bradé)
3. Notification urgente au joueur : Dir. sportif → "Nos finances sont catastrophiques. Nous avons dû mettre {Joueur} sur le marché pour {prix}."
4. Si après 3 jours le joueur n'est pas vendu, un club IA l'achète automatiquement

Maximum **1 vente forcée par semaine**. Le joueur peut éviter la vente forcée en vendant lui-même ou en réduisant son découvert.

---

## 8. Revenus & dépenses des clubs IA

Les clubs IA n'ont **pas de simulation financière** (SPEC-07 §2). Leurs finances sont fictives :
- Pas de solde, pas de transactions
- Les transferts IA (achat de listings humains, SPEC-06 §5.5) utilisent un budget virtuel illimité (mais borné par la logique de prix)
- Les salaires IA ne sont pas prélevés

Cela simplifie considérablement le système tout en préservant l'équilibre (les clubs IA ne peuvent pas "faire faillite").

---

## 9. Notifications financières

| Événement | Staff | Message | Priorité |
|---|---|---|---|
| Revenu billetterie | Dir. sportif | "Recettes du match : {montant} G$ (billetterie + part visiteur)." | Info |
| Versement droits TV | Dir. sportif | "Droits TV versés pour la saison : +{montant} G$." | Info |
| Versement sponsoring | Dir. sportif | "Versement sponsor : +{montant} G$." | Info |
| Prime de match | Dir. sportif | "Prime de {résultat} : +{montant} G$." | Info |
| Prélèvement salaires | Dir. sportif | "Salaires versés : -{montant} G$. Solde : {solde}." | Info |
| Solde < 500K | Dir. sportif | "Attention, nos finances sont préoccupantes. Solde : {montant}." | Warning |
| Solde < 0 | Dir. sportif | "Nous sommes en déficit ! Transferts bloqués. Solde : {montant}." | Critical |
| Solde < -2M (vente forcée) | Dir. sportif | "Situation critique ! {Joueur} mis en vente d'urgence." | Critical |
| Prime de classement | Dir. sportif | "Récompense de fin de saison ({position}e) : +{montant} G$." | Positive |

---

## 10. Modèle de données

### 10.1 Table `financial_transactions` (mise à jour de SPEC-02 §9.4)

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | |
| `type` | `enum` | `ticket_revenue`, `away_revenue`, `tv_rights`, `sponsorship`, `match_prime`, `season_prize`, `player_sale`, `salary`, `player_purchase`, `release_indemnity`, `contract_extension`, `onboarding_reward`, `forced_sale`, `other` |
| `amount` | `bigint` | Montant en centimes (positif = revenu, négatif = dépense) |
| `description` | `varchar(200)` | Description lisible |
| `reference_id` | `uuid` NULLABLE | Référence (match_id, player_id, etc.) |
| `reference_type` | `varchar(20)` NULLABLE | Type de référence (`match`, `player`, `season`, etc.) |
| `balance_after` | `bigint` | Solde après transaction |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `club_id` + `created_at` (historique chronologique)
- `INDEX` sur `club_id` + `type` (filtrage par catégorie)

### 10.2 Table `club_sponsorship`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `club_id` | `uuid` FK | |
| `season_id` | `uuid` FK | Saison en cours |
| `division_level` | `integer` | Division au moment du contrat (1, 2, 3) |
| `total_amount` | `bigint` | Montant total de la saison |
| `installments_paid` | `integer` | Nombre de versements effectués (0-4) |
| `created_at` | `timestamp` | |

---

## 11. API Endpoints

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/finances` | Résumé financier (solde, revenus/dépenses 7j, masse salariale) | Oui |
| `GET` | `/finances/transactions` | Historique des transactions (paginé, filtrable) | Oui |
| `GET` | `/finances/salary-breakdown` | Détail de la masse salariale par joueur | Oui |
| `GET` | `/finances/balance-history` | Historique du solde (pour le graphique, 30 derniers jours) | Oui |
| `GET` | `/finances/forecast` | Prévision simplifiée (prochains salaires, prochain match) | Oui |

### 11.1 `GET /finances`

**Response `200`** :
```json
{
  "balance": 4250000,
  "balanceStatus": "healthy",
  "weeklyChange": 160000,
  "weekSummary": {
    "totalRevenue": 580000,
    "totalExpenses": -420000,
    "netChange": 160000,
    "revenues": [
      { "type": "ticket_revenue", "amount": 260000, "count": 2 },
      { "type": "away_revenue", "amount": 30000, "count": 1 },
      { "type": "match_prime", "amount": 120000, "count": 3 },
      { "type": "sponsorship", "amount": 60000, "count": 1 },
      { "type": "player_sale", "amount": 110000, "count": 1 }
    ],
    "expenses": [
      { "type": "salary", "amount": -380000, "count": 1 },
      { "type": "contract_extension", "amount": -40000, "count": 1 }
    ]
  },
  "salaryOverview": {
    "weeklyTotal": 380000,
    "highestPaid": { "playerId": "uuid", "name": "Rodriguez", "salary": 42000 },
    "lowestPaid": { "playerId": "uuid", "name": "K. Mensah", "salary": 28000 },
    "nextPayday": "2026-03-06T00:00:00Z"
  },
  "transfersBlocked": false
}
```

---

## 12. Jobs BullMQ

| Job | Déclencheur | Description |
|---|---|---|
| `process-salary` | Cron hebdomadaire (lundi 00:00 UTC) | Prélève les salaires de tous les clubs humains |
| `process-match-revenue` | Post-match processing (SPEC-03 §12) | Verse billetterie + primes de match |
| `process-tv-rights` | Début de saison (SPEC-05 §6) | Verse les droits TV à tous les clubs |
| `process-sponsorship` | Cron tous les 30 jours de jeu | Verse les mensualités de sponsoring |
| `process-season-prizes` | Intersaison (SPEC-05 §6.2) | Verse les primes de classement |
| `check-financial-health` | Post-salary processing | Vérifie les seuils d'alerte et déclenche les ventes forcées si nécessaire |

---

## 13. User Stories

### Consultation

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| FIN-01 | Joueur | Voir mon solde en permanence (header) | Suivre mes finances en continu | Format court (4.2M), couleur selon seuil |
| FIN-02 | Joueur | Voir un résumé revenus/dépenses des 7 derniers jours | Comprendre mes flux financiers | Catégorisé par type, total calculé |
| FIN-03 | Joueur | Voir un graphique d'évolution du solde sur 30 jours | Visualiser la tendance de mes finances | Courbe avec axe temporel, points de données quotidiens |
| FIN-04 | Joueur | Voir le détail de ma masse salariale par joueur | Identifier les coûts à optimiser | Liste triable par salaire, overall, contrat |
| FIN-05 | Joueur | Voir l'historique complet de mes transactions | Analyser mes finances sur le long terme | Liste paginée, filtrable par type |
| FIN-06 | Joueur | Voir une prévision des prochaines dépenses/revenus | Anticiper ma trésorerie | Prochains salaires + prochain match estimés |

### Alertes

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| FIN-07 | Joueur | Être alerté quand mon solde est bas (< 500K) | Anticiper les problèmes | Notification orange du Dir. sportif |
| FIN-08 | Joueur | Être alerté quand mes transferts sont bloqués (< 0) | Comprendre la situation | Notification rouge + blocage visible sur le marché |
| FIN-09 | Joueur | Être alerté d'une vente forcée (< -2M) | Réagir à la situation critique | Notification critique + joueur mis en vente visible |

### Revenus automatiques

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| FIN-10 | Système | Verser la billetterie après chaque match | Simuler les revenus de match | Transaction créée, montant variable selon formule |
| FIN-11 | Système | Verser les droits TV en début de saison | Apporter un revenu de base | Transaction unique par saison |
| FIN-12 | Système | Verser le sponsoring mensuellement | Fournir un revenu régulier | 4 versements par saison |
| FIN-13 | Système | Verser les primes de match selon le résultat | Récompenser les performances | 50K victoire, 20K nul, 0 défaite |
| FIN-14 | Système | Verser les primes de classement en fin de saison | Récompenser la compétition | Montants selon position et division |

### Dépenses automatiques

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| FIN-15 | Système | Prélever les salaires hebdomadairement | Simuler les charges du club | Transaction auto chaque 7 jours, même si solde insuffisant |
| FIN-16 | Système | Bloquer les transferts si solde < 0 | Empêcher l'aggravation du déficit | Message d'erreur clair sur le marché |
| FIN-17 | Système | Déclencher une vente forcée si solde < -2M | Éviter la faillite totale | Joueur le plus cher mis en vente automatiquement |

---

## 14. Stratégie de tests

### Tests unitaires

- **Formule billetterie** : vérifier le calcul avec et sans bonus (classement, forme)
- **Primes de match** : vérifier 50K victoire, 20K nul, 0 défaite
- **Seuils d'alerte** : vérifier les triggers à 500K, 0, -2M
- **Vente forcée** : vérifier la sélection du joueur (salaire le plus élevé)
- **Sponsoring** : vérifier les montants par division et les versements mensuels

### Tests d'intégration

- **Cycle économique complet** : début de saison → TV versés → matchs → billetterie → salaires → fin de saison → primes
- **Découvert** : salaires prélevés quand solde insuffisant → blocage transferts → vente joueur → sortie du découvert → déblocage transferts
- **Vente forcée** : solde < -2M → joueur mis en vente → acheté par IA après 3j → solde remonté
- **Promotion** : vérifier que les revenus augmentent en Div 2 vs Div 3
- **Cohérence** : vérifier que `balance_after` est toujours cohérent avec le solde réel

### Tests d'équilibrage

- **Simulation 3 saisons** : un club en Div 3 qui gagne 40% de ses matchs sans transfert → combien de temps avant la faillite ?
- **Club optimal** : un club qui vend bien et achète malin → vérifie qu'il peut être rentable
- **Club champion** : un club qui gagne tout en Div 1 → vérifie que les primes couvrent une bonne partie du déficit

---

## 15. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Budget transfert séparé | Non, solde unique (G$) | 2 |
| Solde négatif | Autorisé (prélèvement salaires force le découvert) | 4.2 |
| Fair-play financier | Blocage transferts si < 0, vente forcée si < -2M | 7.3 |
| Pénalités sportives (points) | Non en MVP (trop punitif) | — |
| Sponsors | Automatiques, fixes par division, mensuels | 3.4 |
| Coûts médicaux | Non en MVP | — |
| Coûts d'entraînement | Non en MVP (SPEC-09 : gratuit) | — |
| Finances IA | Non simulées | 8 |
| Graphique d'évolution | 30 jours, données quotidiennes | 6.1 |
| Vente forcée | Auto à -2M, joueur le plus cher, prix bradé -20% | 7.3 |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
