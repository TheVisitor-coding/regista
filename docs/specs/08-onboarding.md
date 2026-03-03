# SPEC-08 : Onboarding & Démarrage

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-01 (Auth), SPEC-02 (Club), SPEC-04 (Effectif), SPEC-05 (Championnat), SPEC-07 (IA)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03

---

## 1. Objectif

Accompagner le nouveau joueur de la **création de son compte** jusqu'à son **premier match amical** en moins de 5 minutes. L'onboarding doit créer un lien émotionnel avec le club, enseigner les mécaniques essentielles sans noyer d'informations, et inciter à revenir le lendemain.

**Philosophie** : chaque étape doit produire un résultat visible et gratifiant. Le joueur ne lit pas de documentation — il apprend en faisant. L'onboarding est un entonnoir : rapide pour les impatients (skippable), riche pour les curieux.

---

## 2. Règles métier fondamentales

| Règle | Valeur |
|---|---|
| Durée cible | < 5 minutes (création club + tutoriel + premier match lancé) |
| Skippable | Oui, à tout moment après la création du club |
| Relançable | Oui, depuis `/settings` (réinitialise les missions non complétées) |
| Récompenses | Bonus G$ pour chaque mission complétée |
| Missions de démarrage | 5 missions courtes |
| Dépendance réseau | Aucune dépendance sur d'autres joueurs humains |
| Textes | Modulaires, clés i18n pour localisation future |

---

## 3. Flux global d'onboarding

```
Inscription (SPEC-01)
    │
    ▼
Vérification email
    │
    ▼
Première connexion (compte ACTIVE, pas de club)
    │
    ▼
┌─────────────────────────────────────┐
│  ÉTAPE 1 : Création du club         │  ~2 min
│  (4 sous-étapes — SPEC-02 §4.1)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  ÉTAPE 2 : Bienvenue & Tour guidé   │  ~1 min
│  (tooltips successifs sur le         │
│   dashboard)                         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  ÉTAPE 3 : Missions de démarrage    │  ~2 min
│  (5 objectifs courts avec           │
│   récompenses)                       │
└──────────────┬──────────────────────┘
               │
               ▼
Onboarding terminé → Dashboard normal
(les missions non complétées restent accessibles)
```

---

## 4. Étape 1 : Création du club

Flux identique à SPEC-02 §4.1 avec quelques améliorations UX pour l'onboarding :

### 4.1 Sous-étapes

```
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│  🏟️ CRÉEZ VOTRE CLUB                          Étape 1/4       │
│  ─────────────────────────────────────────────────────────    │
│                                                                │
│  Quel est le nom de votre club ?                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  FC Regista                                           │     │
│  └──────────────────────────────────────────────────────┘     │
│  ✓ Nom disponible                                              │
│                                                                │
│  💡 "Un grand club commence par un grand nom."                 │
│     — Votre adjoint, J. Durand                                 │
│                                                                │
│                               [Suivant →]                      │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Amélioration onboarding** : chaque sous-étape affiche une citation du staff (immersion dès le début). Le staff se "présente" naturellement à travers ces citations.

| Sous-étape | Staff qui parle | Citation |
|---|---|---|
| 1. Nom du club | Adjoint | "Un grand club commence par un grand nom." |
| 2. Couleurs | Secrétaire | "Ces couleurs seront portées avec fierté." |
| 3. Logo | Dir. sportif | "Le blason, c'est l'identité. Choisissez bien." |
| 4. Confirmation | Médecin | "L'effectif est prêt. Bienvenue, coach !" |

### 4.2 Post-création

À la confirmation (étape 4), le système exécute (SPEC-02 §4.2) :
1. Création du club en base
2. Génération de l'effectif (22 joueurs, overall ~55-65)
3. Assignation à une ligue (Division 3 — SPEC-05 §3.2)
4. Génération du staff (4 personnages)
5. Solde initial : 5 000 000 G$
6. Morale initiale : 60
7. Composition par défaut générée (AutoLineup avec formation 4-4-2)

### 4.3 Animation de transition

Après la confirmation, une **animation de transition** (2-3 secondes) montre :
- Le logo du club qui se dessine
- Les joueurs qui "arrivent" (liste de noms qui défilent)
- Le nom de la ligue assignée
- Transition fluide vers le dashboard

---

## 5. Étape 2 : Tour guidé du dashboard

### 5.1 Système de tooltips

Au premier chargement du dashboard, un **tour guidé par tooltips** met en surbrillance les zones clés de l'interface. Le joueur peut avancer (Suivant), revenir (Précédent), ou quitter (Passer) à tout moment.

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER                                                        │
│  [Logo]  [FC Regista]  💰 5.0M  🔔 3   [Avatar ▼]            │
│              ▲                                                  │
│              │                                                  │
│    ┌─────────┴──────────────────────┐                          │
│    │ Votre club ! C'est ici que     │                          │
│    │ vous voyez votre solde et vos  │                          │
│    │ notifications.                 │                          │
│    │            [1/6]  [Suivant →]  │                          │
│    └────────────────────────────────┘                          │
│                                                                │
│  SIDEBAR   │  CONTENU PRINCIPAL                                │
│            │                                                   │
│  ...       │  ...                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Points du tour (6 étapes)

| # | Zone ciblée | Message | Staff |
|---|---|---|---|
| 1 | Header (nom + solde) | "Votre club ! Ici vous voyez votre solde et vos notifications." | Secrétaire |
| 2 | Sidebar navigation | "Tout est accessible en un clic : effectif, tactique, matchs, transferts..." | Adjoint |
| 3 | Widget prochain match | "Votre prochain match officiel apparaîtra ici. Préparez-vous !" | Adjoint |
| 4 | Widget forme d'équipe | "Surveillez la fatigue et la morale de votre équipe." | Médecin |
| 5 | Widget actions recommandées | "Je vous signalerai les actions prioritaires ici." | Adjoint |
| 6 | Notifications (cloche) | "L'équipe vous enverra des messages importants. Consultez-les régulièrement !" | Secrétaire |

### 5.3 Comportement

- Le tour se lance automatiquement au premier chargement du dashboard
- Overlay semi-transparent sur tout sauf la zone ciblée
- Clic en dehors du tooltip = ferme le tour (comme "Passer")
- Si skippé, le tour peut être relancé depuis `/settings`
- Le tour n'est joué qu'une seule fois (flag `has_completed_tour` sur le user)

---

## 6. Étape 3 : Missions de démarrage

### 6.1 Système de missions

Les missions de démarrage sont un **checklist gamifié** qui guide le joueur vers les premières actions clés. Elles restent visibles sur le dashboard tant qu'elles ne sont pas toutes complétées.

```
┌──────────────────────────────────────────────────────────────┐
│  🎯 MISSIONS DE DÉMARRAGE                        3/5 ✓       │
│                                                                │
│  ✅ Créer votre club                          + 0 G$ (auto)   │
│  ✅ Voir votre effectif                       + 50 000 G$     │
│  ✅ Configurer votre tactique                 + 100 000 G$    │
│  ⬜ Jouer un match amical                     + 200 000 G$    │
│  ⬜ Consulter le classement                   + 50 000 G$     │
│                                                                │
│  ──────────────────────────────────────────────────────────   │
│  Total gagné : 150 000 G$ / 400 000 G$                        │
│  [Passer les missions]                                         │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Liste des missions

| # | Mission | Détection | Récompense | Staff message |
|---|---|---|---|---|
| 1 | **Créer votre club** | Automatique (complétée à l'étape 1) | — | — |
| 2 | **Voir votre effectif** | Visite de la page `/squad` | 50 000 G$ | Dir. sportif : "Voici vos joueurs. Apprenez à les connaître !" |
| 3 | **Configurer votre tactique** | Sauvegarde d'une composition via `/tactics` | 100 000 G$ | Adjoint : "Excellente composition ! On est prêts." |
| 4 | **Jouer un match amical** | Match amical terminé (SPEC-05 §7) | 200 000 G$ | Adjoint : "Premier match dans les pattes ! L'aventure commence." |
| 5 | **Consulter le classement** | Visite de la page `/competition` | 50 000 G$ | Secrétaire : "Voilà vos adversaires. À vous de gravir les échelons !" |

**Total des récompenses** : 400 000 G$ (soit 8% du solde initial de 5M — un coup de pouce appréciable sans déséquilibrer).

### 6.3 Détection de complétion

Les missions sont détectées **automatiquement** côté serveur :

| Mission | Trigger technique |
|---|---|
| Créer votre club | `POST /clubs` retourne 201 |
| Voir votre effectif | `GET /squad` par le joueur (premier appel) |
| Configurer votre tactique | `PUT /tactics/lineup` par le joueur (premier appel) |
| Jouer un match amical | Match amical avec `status = FINISHED` pour ce club |
| Consulter le classement | `GET /competition/standings` par le joueur (premier appel) |

### 6.4 Comportement

- Les missions apparaissent comme un widget dédié en haut du dashboard (au-dessus des autres widgets)
- Une animation de validation (checkmark animé + toast de récompense) se joue à chaque complétion
- Le widget disparaît une fois toutes les missions complétées
- "Passer les missions" = ferme le widget définitivement, mais les récompenses non réclamées sont perdues
- Les missions n'ont pas de deadline (le joueur peut les compléter à son rythme)

### 6.5 Premier match amical

La mission "Jouer un match amical" est la plus engageante. Pour la faciliter :

- Un CTA "Jouer un match amical" est ajouté directement dans le widget missions
- Le match amical de l'onboarding est automatiquement en difficulté **Facile** (SPEC-07 §7.1)
- Le joueur est redirigé vers une page de pré-match simplifiée (pas besoin de configurer la tactique si déjà fait via la mission 3)

---

## 7. Notifications d'onboarding

### 7.1 Notifications initiales

À la création du club, le joueur reçoit **4 notifications de bienvenue** (une par personnage du staff) :

| Ordre | Staff | Message | Priorité |
|---|---|---|---|
| 1 | Adjoint | "Bienvenue, coach ! Je suis {Nom}, votre adjoint. Je vous aiderai à préparer les matchs et analyser les adversaires." | Info |
| 2 | Médecin | "Bonjour ! Je suis {Nom}, médecin du club. Je veillerai sur la santé de vos joueurs." | Info |
| 3 | Dir. sportif | "Enchanté, coach. {Nom}, directeur sportif. Budget, transferts, contrats — je gère tout ça avec vous." | Info |
| 4 | Secrétaire | "{Nom}, secrétaire du club. Calendrier, résultats, classement — je vous tiens informé de tout !" | Info |

Ces notifications servent de présentation immersive du staff. Elles sont marquées lues automatiquement après le tour guidé (pour ne pas encombrer).

### 7.2 Notification post-premier match

Après le premier match amical terminé :

| Staff | Message | Priorité |
|---|---|---|
| Adjoint | "Premier match terminé ! {Résultat}. J'ai quelques observations pour la suite. Continuez comme ça, coach !" | Positive |

---

## 8. Gestion des états d'onboarding

### 8.1 Statut d'onboarding du joueur

| État | Description |
|---|---|
| `NOT_STARTED` | Compte créé mais pas encore de club |
| `CLUB_CREATED` | Club créé, tour guidé pas encore vu |
| `TOUR_COMPLETED` | Tour guidé terminé (ou skippé) |
| `MISSIONS_IN_PROGRESS` | Au moins 1 mission complétée, pas toutes |
| `COMPLETED` | Toutes les missions complétées (ou skippées) |

### 8.2 Comportement par état

| État | Redirect après login | Dashboard |
|---|---|---|
| `NOT_STARTED` | `/onboarding/create-club` | Non accessible |
| `CLUB_CREATED` | `/dashboard` (lance le tour) | Dashboard + tour guidé auto |
| `TOUR_COMPLETED` | `/dashboard` | Dashboard + widget missions |
| `MISSIONS_IN_PROGRESS` | `/dashboard` | Dashboard + widget missions |
| `COMPLETED` | `/dashboard` | Dashboard normal (widget missions masqué) |

---

## 9. Réinitialisation de l'onboarding

Depuis `/settings`, le joueur peut relancer :
- **Le tour guidé** : rejoue les 6 tooltips
- **Les missions** : réaffiche le widget (mais les missions déjà complétées restent cochées, pas de double récompense)

---

## 10. Modèle de données

### 10.1 Modifications sur la table `users`

| Colonne ajoutée | Type | Description |
|---|---|---|
| `onboarding_status` | `enum` | `NOT_STARTED`, `CLUB_CREATED`, `TOUR_COMPLETED`, `MISSIONS_IN_PROGRESS`, `COMPLETED` |
| `onboarding_completed_at` | `timestamp` NULLABLE | Date de complétion totale |

### 10.2 Table `onboarding_missions`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `mission_key` | `varchar(50)` | `create_club`, `view_squad`, `set_tactics`, `play_friendly`, `view_standings` |
| `completed_at` | `timestamp` NULLABLE | Date de complétion |
| `reward_claimed` | `boolean` | Récompense réclamée (défaut: false) |
| `reward_amount` | `bigint` | Montant de la récompense en centimes G$ |
| `created_at` | `timestamp` | |

**Index** :
- `UNIQUE` sur `user_id` + `mission_key` (1 entrée par mission par joueur)
- `INDEX` sur `user_id` + `completed_at` (missions en cours)

---

## 11. API Endpoints

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/onboarding/status` | Statut d'onboarding + missions | Oui |
| `POST` | `/onboarding/tour/complete` | Marquer le tour guidé comme terminé | Oui |
| `POST` | `/onboarding/missions/:missionKey/claim` | Réclamer la récompense d'une mission | Oui |
| `POST` | `/onboarding/skip` | Passer les missions restantes | Oui |
| `POST` | `/onboarding/reset-tour` | Relancer le tour guidé | Oui |

### 11.1 `GET /onboarding/status`

**Response `200`** :
```json
{
  "status": "MISSIONS_IN_PROGRESS",
  "tourCompleted": true,
  "missions": [
    { "key": "create_club", "completed": true, "reward": 0, "claimed": true },
    { "key": "view_squad", "completed": true, "reward": 50000, "claimed": true },
    { "key": "set_tactics", "completed": true, "reward": 100000, "claimed": false },
    { "key": "play_friendly", "completed": false, "reward": 200000, "claimed": false },
    { "key": "view_standings", "completed": false, "reward": 50000, "claimed": false }
  ],
  "totalReward": 400000,
  "claimedReward": 50000
}
```

---

## 12. User Stories

### Création du club (onboarding)

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| ONB-01 | Nouveau joueur | Créer mon club en 4 étapes simples | Personnaliser mon identité | Flux en 4 sous-étapes, citations du staff, < 2 min |
| ONB-02 | Nouveau joueur | Voir une animation de transition après la création | Ressentir un moment d'accomplissement | Animation 2-3s, logo + joueurs + ligue affichés |
| ONB-03 | Nouveau joueur | Recevoir un effectif complet et une composition par défaut | Commencer immédiatement sans configuration | 22 joueurs, 4-4-2 par défaut, AutoLineup |

### Tour guidé

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| ONB-04 | Nouveau joueur | Être guidé par des tooltips sur le dashboard | Comprendre l'interface rapidement | 6 tooltips, navigation Suivant/Précédent/Passer |
| ONB-05 | Nouveau joueur | Pouvoir passer le tour guidé | Ne pas être bloqué si je comprends déjà | Bouton "Passer" visible, tour terminé immédiatement |
| ONB-06 | Joueur | Relancer le tour guidé depuis les réglages | Revoir les explications si besoin | Option dans `/settings`, tour rejoué intégralement |

### Missions de démarrage

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| ONB-07 | Nouveau joueur | Voir des missions de démarrage sur le dashboard | Être guidé vers les premières actions | Widget missions visible, 5 missions listées |
| ONB-08 | Nouveau joueur | Compléter des missions et recevoir des récompenses G$ | Être motivé à explorer le jeu | Détection auto, animation de validation, G$ crédités |
| ONB-09 | Nouveau joueur | Jouer un match amical facile comme mission | Découvrir le gameplay de match | CTA direct, difficulté facile, match jouable immédiatement |
| ONB-10 | Nouveau joueur | Passer les missions si je ne veux pas les faire | Garder le contrôle de mon expérience | "Passer" = widget fermé, récompenses non réclamées perdues |
| ONB-11 | Joueur | Que le widget missions disparaisse une fois tout complété | Avoir un dashboard propre après l'onboarding | Widget masqué automatiquement |

### Notifications & Immersion

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| ONB-12 | Nouveau joueur | Recevoir des messages de bienvenue de mon staff | Être immergé dans la vie du club dès le début | 4 notifications de présentation du staff |
| ONB-13 | Nouveau joueur | Recevoir un feedback de mon adjoint après mon 1er match | Sentir que le staff réagit à mes actions | Notification post-match avec résultat et encouragements |

### Technique

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| ONB-14 | Dev | Détecter automatiquement la complétion des missions côté serveur | Éviter la triche et simplifier le frontend | Triggers sur les appels API, pas de validation client |
| ONB-15 | Dev | Avoir des clés i18n pour tous les textes d'onboarding | Préparer la localisation future | Toutes les chaînes dans des fichiers de traduction |

---

## 13. Stratégie de tests

### Tests unitaires

- **Détection de missions** : vérifier que chaque API trigger complète la bonne mission
- **Récompenses** : vérifier le crédit correct en G$, pas de double récompense
- **État d'onboarding** : vérifier les transitions d'état (NOT_STARTED → CLUB_CREATED → etc.)
- **Skip** : vérifier que "Passer" ferme le widget et empêche les récompenses futures

### Tests d'intégration

- **Flux complet** : inscription → vérification email → création club → tour guidé → 5 missions → onboarding terminé
- **Récompenses financières** : vérifier que le solde du club est correctement mis à jour après chaque mission claim
- **Premier match amical** : vérifier que le match est en difficulté "Facile" et qu'il complète la mission

### Tests E2E

- **Parcours complet en < 5 min** : mesurer le temps réel du flux inscription → premier match amical terminé
- **Skip total** : vérifier que tout est skippable et que le joueur arrive sur un dashboard fonctionnel
- **Relance** : vérifier que le tour et les missions sont relançables depuis les réglages

---

## 14. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Onboarding obligatoire | Non, skippable après création du club | 2 |
| Relançable | Oui depuis les réglages | 9 |
| Format du tutoriel | Tooltips in-app (pas de vidéo, pas de page dédiée) | 5 |
| Récompenses | G$ (400K total, ~8% du solde initial) | 6.2 |
| Nombre de missions | 5 (court et ciblé) | 6.2 |
| Difficulté du 1er amical | Facile (automatique) | 6.5 |
| Notifications de bienvenue | 4 messages du staff (1 par personnage) | 7.1 |
| Slogan/devise optionnelle | Post-MVP (cosmétique, pas prioritaire) | — |
| Analytics de complétion | Post-MVP (tracking des étapes d'onboarding) | — |
| Confettis/animations excessives | Non, feedback positif sobre (checkmark animé, toast) | 6.4 |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
