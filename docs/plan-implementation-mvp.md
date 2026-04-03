# Plan d'Implémentation — MVP Lot 1

> **Dernière mise à jour** : 2026-03-03
> **Périmètre** : SPEC-01 à SPEC-13 (Lot 1 MVP)
> **Estimation** : ~42 tables, ~128 endpoints REST, ~11 événements Socket.io, ~37 jobs BullMQ

## Avancement Implémentation (réel)

> **Mise à jour** : 2026-03-06

- `SPEC-01 Auth` : implémentée et fonctionnelle (register/login/refresh/profil/sessions)
- `Step 1 (Phase 2)` : fondations Club backend implémentées
  - DB : `clubs`, `club_staff`, `notifications`, `financial_transactions`
  - API : `POST /clubs`, `GET /clubs/mine`, `PATCH /clubs/mine`, `GET /clubs/:id`
  - Migration : `packages/db/drizzle/0001_material_malice.sql`
- `Step 2 (Phase 2)` : dashboard minimal connecté implémenté
  - API : `GET /dashboard` (agrégation minimale réelle + placeholders des modules non encore implémentés)
  - Frontend : page `/dashboard` branchée via TanStack Query avec états `loading / error / empty-data`

### Note de validation technique

- Le runner `node ace test` est actuellement instable dans cet environnement (boot bloqué), donc la validation de Step 1 et Step 2 a été faite en runtime via appels HTTP réels + contrôles de typage.

### Correctifs post-Step 2 (2026-03-06)

- Persistance d'authentification frontend renforcée :
  - token d'accès persisté côté client (`localStorage`) avec hydratation au reload
  - utilisateur authentifié persisté côté client et resynchronisé via `GET /users/me`
  - fallback refresh cookie conservé (`POST /auth/refresh`)
- Stabilisation du dashboard :
  - suppression des redirections impératives pendant le rendu React (navigation déplacée dans `useEffect`)
  - traitement explicite des états `loading / error / no-club`
- Refactor architecture frontend (atomic/component-first) :
  - route `/dashboard` réduite au rôle d'orchestrateur
  - extraction de composants dédiés dans `apps/web/src/components/dashboard/`
- Déblocage auth sans service email actif :
  - vérification email rendue configurable via `EMAIL_VERIFICATION_REQUIRED`
  - en dev/test, les nouveaux comptes peuvent se connecter immédiatement (pas de blocage sur `/verify-email`)

---

## Graphe de dépendances des specs

```
SPEC-01 (Auth)                                    ← Fondation
  ├── SPEC-02 (Club & Dashboard)                  ← Domaine central
  │     ├── SPEC-04 (Effectif)                    ← Joueurs, tactiques
  │     │     ├── SPEC-03 (Match)                 ← Moteur de simulation
  │     │     │     └── SPEC-05 (Championnat)     ← Compétition, calendrier
  │     │     │           ├── SPEC-06 (Transferts) ← Marché
  │     │     │           │     └── SPEC-07 (IA)   ← Clubs IA
  │     │     │           ├── SPEC-09 (Entraînement)
  │     │     │           └── SPEC-10 (Finances)
  │     │     ├── SPEC-11 (Tactiques)
  │     │     └── SPEC-12 (Progression)           ← dépend aussi SPEC-09
  │     └── SPEC-13 (Modération)
  └── SPEC-08 (Onboarding)                        ← dépend de tout le reste
```

---

## Stratégie générale

- **Approche verticale** : chaque phase implémente backend + frontend pour un domaine complet, testable de bout en bout
- **Schema DB incrémental** : les tables sont créées par phase (pas tout d'un coup) via des migrations Drizzle successives
- **Types partagés d'abord** : les enums et types sont définis dans `packages/shared` avant d'écrire le code métier
- **Tests au fil de l'eau** : chaque phase inclut ses tests unitaires et d'intégration (Japa côté API, Vitest côté frontend et packages)

---

## Phase 0 — Infrastructure & Fondations

> **Objectif** : préparer le terrain technique pour que toutes les phases suivantes puissent démarrer sans blocage.

### 0.1 Corriger les constantes partagées
- **Fichier** : `packages/shared/src/constants.ts`
- `SECONDS_PER_SIMULATED_MINUTE` : 2 → **60** (1 min simulée = 1 min réelle)
- `TACTICAL_CHANGE_COOLDOWN_MINUTES` : 3 → **5**
- `MATCH_FREQUENCY_DAYS` : 2 → **3**
- Ajouter les constantes manquantes (plafond effectif 25/16, salaire formule, budget initial 5M, etc.)

### 0.2 Types et enums partagés
- **Fichier** : `packages/shared/src/types/`
- Définir tous les enums nécessaires au MVP :
  - `PlayerPosition` (GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, CF)
  - `Formation` (4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 3-4-3, 4-5-1, 5-3-2, 5-4-1)
  - `MatchStatus` (scheduled, pre_match, first_half, half_time, second_half, finished, post_match, cancelled, forfeit)
  - `Mentality` (ultra_defensive, defensive, balanced, offensive, ultra_offensive)
  - `UserStatus` (PENDING_VERIFICATION, ACTIVE, INACTIVE, BANNED, DELETED)
  - `SeasonStatus` (created, in_progress, finishing, intersaison, archived)
  - `OnboardingStatus`, `TransferStatus`, `OfferStatus`, `TrainingFocus`, etc.
- Définir les DTOs de base (request/response) pour les endpoints critiques

### 0.3 Scaffold AdonisJS 6
- Remplacer le scaffold NestJS dans `apps/api/` par un projet AdonisJS 6
- Configurer : `@adonisjs/auth` (JWT access tokens), `@adonisjs/mail`, `@adonisjs/redis`, VineJS (validation intégrée)
- Intégrer Drizzle ORM comme couche DB (via un provider custom ou import direct de `@regista/db`)
- Configurer CORS (origin `http://localhost:3000`)
- Health check endpoint : `GET /health`

### 0.4 Infrastructure BullMQ
- Configurer BullMQ dans AdonisJS (via provider custom ou intégration directe avec ioredis)
- Créer les queues nommées : `email`, `match`, `season`, `transfer`, `training`, `finance`, `moderation`
- Configurer les options par défaut (retry, backoff, concurrency)
- Créer un service `QueueService` injectable pour enqueue depuis les controllers/services

### 0.5 Infrastructure Socket.io
- Intégrer Socket.io dans le serveur HTTP AdonisJS (attach sur le serveur Node existant)
- Créer un service `SocketService` (singleton) pour gérer les connexions, rooms, et broadcast
- Auth WebSocket via JWT (middleware de vérification au handshake)
- Définir les événements partagés (types dans `packages/shared`)

### 0.6 Frontend — Base UI
- Installer et configurer **shadcn/ui** dans `apps/web`
- Créer le layout principal (sidebar, header, contenu)
- Configurer le client API (fetch wrapper + TanStack Query)
- Mettre en place le store d'auth (context React ou Zustand)
- Configurer les routes protégées (redirect si non authentifié)

### 0.7 Seed & utilitaires
- Créer un script `packages/db/src/seed.ts` (structure vide, sera enrichi par phase)
- Utilitaires partagés : générateur de noms, formules de calcul (valuation, salaire, etc.)

**Livrable Phase 0** : le projet compile, `pnpm dev` démarre sans erreur, l'infrastructure est prête à accueillir les modules métier.

---

## Phase 1 — Authentification (SPEC-01)

> **Objectif** : un joueur peut s'inscrire, se connecter, et accéder à des routes protégées.

### 1.1 Schema DB
- Tables : `users`, `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`
- Migration Drizzle initiale

### 1.2 Auth — Inscription & Connexion
- `POST /auth/register` : inscription, hash via `@adonisjs/hash` (scrypt par défaut ou bcrypt), token de vérification
- `POST /auth/login` : vérification mot de passe, émission JWT (access 15min) + refresh token (cookie httpOnly 30j)
- `POST /auth/logout` : suppression du refresh token
- `POST /auth/refresh` : rotation du refresh token
- Middleware AdonisJS : `auth` middleware (vérifie JWT), `guest` middleware (redirige si connecté)

### 1.3 Auth — Vérification & Reset
- `POST /auth/verify-email` : validation du token
- `POST /auth/resend-verification` : renvoi du mail
- `POST /auth/forgot-password` : envoi token de reset
- `POST /auth/reset-password` : modification mot de passe
- Job BullMQ `send-email` : dispatch asynchrone des emails (mock console en dev, intégration SMTP plus tard)

### 1.4 Auth — Profil & Sessions
- `GET /users/me`, `PATCH /users/me/username`, `PATCH /users/me/email`, `PATCH /users/me/password`
- `DELETE /users/me` : suppression logique (status → DELETED)
- `GET /users/me/sessions`, `DELETE /users/me/sessions` : gestion des sessions actives
- `GET /auth/check-username`, `GET /auth/check-email` : vérification de disponibilité

### 1.5 Rate limiting & Sécurité
- Rate limiting Redis sur les endpoints auth (5 req/min login, 3 req/h reset)
- Protection CSRF (headers)
- Job `cleanup-expired-tokens` (cron quotidien)
- Job `check-inactive-users` (cron quotidien — 7/14/21j thresholds)

### 1.6 Validation des noms (SPEC-13 partiel)
- Table `name_blacklist` + seed initial (~500 termes)
- Service `NameValidationService` : blacklist + regex + normalisation leet speak + unicité
- `POST /names/validate` : endpoint utilisé par l'inscription et la création de club
- Cache Redis de la blacklist

### 1.7 Frontend — Pages Auth
- Pages : `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- Formulaires avec validation VineJS (shared) ou Zod côté client
- Gestion du token JWT (stockage mémoire, refresh automatique)
- Redirect vers `/dashboard` après login

**Livrable Phase 1** : flow d'auth complet fonctionnel, routes protégées, validations de noms actives.

---

## Phase 2 — Club & Effectif (SPEC-02, SPEC-04)

> **Objectif** : un joueur peut créer son club, voir son effectif, et configurer sa tactique.

### 2.1 Schema DB
- Tables : `clubs`, `club_staff`, `notifications`, `financial_transactions`, `players`, `player_stats`, `goalkeeper_stats`, `club_tactics`, `club_lineup`, `player_season_stats`
- Colonnes AI sur `clubs` : `is_ai`, `ai_profile`

### 2.2 Création de club & Génération d'effectif
- `POST /clubs` : création du club (nom validé via §1.6, couleurs, stade)
- Service `SquadGenerationService` : génération de 22 joueurs (distribution par poste, stats basées sur la division, âge 18-34, overall 45-72 pour Div 3)
- Service `StaffGenerationService` : génération des 4 membres du staff
- Solde initial : 5 000 000 G$
- Formule salaire : `overall × 500 + random(0, 2000)` par semaine

### 2.3 Effectif — API
- `GET /squad` : liste des joueurs avec stats
- `GET /squad/:playerId` : fiche détaillée d'un joueur
- `GET /squad/:playerId/history` : historique (stats saison par saison)
- `GET /squad/compare?players=id1,id2` : comparaison
- `POST /squad/:playerId/extend-contract` : prolongation (+20 matchs, salaire recalculé)

### 2.4 Tactiques & Composition
- `GET /tactics` : configuration tactique actuelle
- `PUT /tactics/lineup` : définir la composition (11 titulaires + 7 remplaçants)
- `PUT /tactics/settings` : mentality, pressing, passing_style, width, tempo, defensive_line
- `POST /tactics/auto-lineup` : composition automatique (meilleurs joueurs par poste)
- `PUT /tactics/set-pieces` : tireurs (penalties, corners, coups francs)

### 2.5 Dashboard & Notifications
- `GET /dashboard` : agrégation (club info, prochain match, classement, finances, notifications)
- `GET /clubs/mine`, `PATCH /clubs/mine` : info et modification du club
- `GET /clubs/:id` : profil public d'un club
- `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `GET /notifications/unread-count`
- `GET /finances`, `GET /finances/transactions` (versions de base — enrichies en Phase 9)

### 2.6 Frontend — Dashboard & Effectif
- Page `/dashboard` : vue d'ensemble du club
- Page `/squad` : liste des joueurs (tableau triable, filtres par poste)
- Page `/squad/:id` : fiche joueur détaillée (radar chart stats)
- Page `/tactics` : terrain drag & drop, sliders tactiques
- Composant notifications (dropdown dans le header)
- Page `/settings` : profil utilisateur, paramètres du club

**Livrable Phase 2** : le joueur a un club avec 22 joueurs, peut gérer son effectif et sa tactique.

---

## Phase 3 — Championnat (SPEC-05)

> **Objectif** : le système de ligue est opérationnel avec calendrier, classement et saisons.

### 3.1 Schema DB
- Tables : `leagues`, `divisions`, `seasons`, `standings`, `season_results`, `notification_preferences`

### 3.2 Création de ligue & Saison
- Service `LeagueService` : création d'une ligue (3 divisions × 20 clubs)
- Service `SeasonService` : génération du calendrier (38 journées, round-robin aller-retour)
- Algorithme de calendar : chaque club joue 1 match tous les 3 jours
- Horaire de match configurable par ligue (défaut : 21h00 UTC)

### 3.3 Classement
- Service `StandingsService` : calcul/mise à jour après chaque journée
- Critères de départage : points > goal difference > goals scored > face-to-face > alphabétique
- Forme récente (5 derniers matchs : W/D/L)

### 3.4 Gestion de saison
- Jobs `season:create`, `season:finish`, `season:intersaison`
- Cycle intersaison (5 jours) : résultats finaux → promotions/relégations → transferts expirés → nouvelle saison → reprise
- Promotions : top 3 monte, bottom 3 descend

### 3.5 Frontend — Compétition
- Page `/competition` : classement actuel (avec surbrillance du club du joueur)
- Page `/competition/matchday/:number` : résultats d'une journée
- Page `/calendar` : calendrier des matchs (passés et à venir)
- Préférences de notifications `/settings/notifications`

**Livrable Phase 3** : une ligue fonctionnelle avec classement dynamique et calendrier complet.

---

## Phase 4 — Clubs IA (SPEC-07)

> **Objectif** : les 59 clubs IA par ligue sont générés et capables de jouer.

### 4.1 Génération de clubs IA
- Service `AIClubGenerationService` : création de 59 clubs IA par ligue
- Distribution des profils : 30% offensif, 45% équilibré, 25% défensif
- Noms et stades générés aléatoirement (pool de ~200 noms)
- Effectifs calibrés par division (overall moyen : Div1 70-75, Div2 60-68, Div3 50-62)

### 4.2 IA — Composition & Tactique
- Service `AIManagerService` : algorithme `AutoLineup` (meilleurs joueurs par poste, gestion fatigue/blessures/suspensions)
- Sélection de formation par profil : Offensif → 4-3-3/3-4-3, Équilibré → 4-4-2/4-2-3-1, Défensif → 5-3-2/4-5-1
- Job `prepare-ai-lineup` : T-30min avant chaque match

### 4.3 IA — Décisions en match
- Décisions aux 3 moments clés : mi-temps, 60e, 75e minute
- Contexte de décision : `scoreDiff`, `fatigue`, `cards`, `mentality`
- Substitutions : priorité blessé > fatigué > jaune+fatigué > tactique (garde 1 remplacement en réserve)
- Ajustement tactique : si mené → +1 mentalité, si mène de 2+ → -1 mentalité

### 4.4 Matchs amicaux
- Service `FriendlyMatchService` : génération d'un club IA éphémère
- 3 niveaux de difficulté : Facile (×0.85), Normal (×1.0), Difficile (×1.15) appliqué à l'overall du joueur
- `POST /matches/friendly`, `DELETE /matches/friendly/:id`

**Livrable Phase 4** : les clubs IA ont des effectifs, choisissent leur compo et réagissent en match.

---

## Phase 5 — Moteur de Match (SPEC-03)

> **Objectif** : les matchs se simulent en temps réel avec tous les événements.
> **C'est la phase la plus complexe du MVP.**

### 5.1 Schema DB
- Tables : `matches`, `match_events`, `match_lineups`, `match_stats`, `match_player_stats`, `match_tactical_changes`

### 5.2 Moteur de simulation — Core
- Service `MatchEngineService` : boucle minute par minute (90 minutes + temps additionnel)
- Système de possession basé sur les stats collectives (passing, vision, work_rate)
- Zones de jeu (defense, midfield_def, midfield, midfield_att, attack) avec probabilités de transition
- Calcul de dangerosité : tir → cadré → but (basé sur shooting, positioning, composure vs reflexes, diving)
- Gestion de la fatigue en temps réel (-0.5/15min, modifié par stamina et tempo)

### 5.3 Moteur de simulation — Événements
- 27 types d'événements : goal, shot_on_target, shot_off_target, shot_blocked, save, corner, free_kick, penalty, foul, yellow_card, red_card, injury, substitution, offside, goal_kick, throw_in, cross, interception, tackle, dribble, pass_key, header, own_goal, penalty_missed, penalty_saved, var_review, second_yellow
- Chaque événement a un contexte : minute, zone, joueurs impliqués, outcome

### 5.4 Jobs BullMQ — Pipeline de match
- `match:pre-match` (T-15min) : validation des compositions, application des suspensions/blessures, substitution auto si lineup invalide
- `match:simulate` (T+0) : job long-running, émet un événement par minute via Redis pub/sub
- `match:post-process` (match terminé) : calcul des notes, fatigue finale, blessures, suspensions (jaunes accumulés), mise à jour standings

### 5.5 Socket.io — Temps réel
- Room par match (`match:{id}`)
- Événements serveur → client : `match:status`, `match:event`, `match:score`, `match:stats`, `match:minute`, `match:half-time`, `match:finished`
- Événements client → serveur : `match:join`, `match:leave`
- État live stocké dans Redis (`MatchLiveState`) pour récupération après crash

### 5.6 Actions en match
- `POST /matches/:id/tactics` : changement tactique (cooldown 5 min)
- `POST /matches/:id/substitution` : remplacement (max 5, 3 fenêtres)

### 5.7 Frontend — Match
- Page `/matches/:id` : vue live (terrain animé, score, événements en temps réel, stats, composition)
- Mode résumé (match terminé) : timeline des événements, stats finales, notes des joueurs
- Page `/matches/live` : liste des matchs en cours
- Contrôles en match : panel tactique (sliders), bouton substitution

**Livrable Phase 5** : un match se joue en temps réel avec événements, stats, et interaction du joueur.

---

## Phase 6 — Orchestration Game Loop

> **Objectif** : les journées de championnat s'enchaînent automatiquement.

### 6.1 Orchestration des journées
- Job `matchday:pre-match` (cron T-15min) : lance les pre-match pour les 10 matchs de la journée
- Job `matchday:start` (cron T+0) : lance les 10 simulations en parallèle
- Job `matchday:post-process` : attend que les 10 matchs soient terminés, puis calcule classement, finances, notifications

### 6.2 Cycle de saison complet
- Enchaînement : journée N → 3 jours → journée N+1 (38 journées)
- Fin de saison → intersaison (5 jours) → nouvelle saison
- Promotions/relégations automatiques
- Job `league:check-abandons` : détection des joueurs inactifs

### 6.3 Intégration post-match complète
- Pipeline séquentiel après chaque match :
  1. Stats et notes calculées
  2. Standings mis à jour
  3. Fatigue appliquée
  4. Blessures et suspensions traitées
  5. Progression passive appliquée (SPEC-04 §11)
  6. Entraînement appliqué (SPEC-09) — ajouté en Phase 8
  7. Revenus match (SPEC-10) — ajouté en Phase 9
  8. Notifications envoyées

### 6.4 Recovery
- Job `match:recovery` : au redémarrage du serveur, scanne les matchs `in_progress`, reprend depuis l'état Redis
- Gestion des matchs forfait si le serveur crashe pendant > 10 minutes

**Livrable Phase 6** : le championnat tourne en automatique, les matchs s'enchaînent, le classement se met à jour.

---

## Phase 7 — Transferts (SPEC-06)

> **Objectif** : le marché des transferts est fonctionnel avec offres entre clubs.

### 7.1 Schema DB
- Tables : `transfer_listings`, `transfer_offers`, `transfer_history`, `free_agents`

### 7.2 Marché IA
- Service `AIMarketService` : génération quotidienne de ~50 joueurs IA
- Formule de prix : `((overall-40)/10)^2.5 × 100000` × modificateurs (âge, potentiel, poste, random ±20%)
- Job `refresh-ai-market` (cron 04:00 UTC) : suppression expirés, génération nouveaux, achats IA de joueurs humains listés

### 7.3 Mise en vente humaine
- `POST /market/sell` : mettre un joueur en vente (prix min 10K, durée min 24h, max 5 listings simultanés)
- `DELETE /market/listings/:listingId` : retirer de la vente (après 24h minimum)
- `GET /market/my-listings` : mes joueurs en vente

### 7.4 Système d'offres
- `POST /offers` : faire une offre (fonds bloqués, max 3 offres sortantes)
- `POST /offers/:offerId/accept`, `/reject`, `/counter` : répondre à une offre
- Contre-offre : une seule autorisée, même deadline 48h
- Job `expire-offers` (cron horaire) : expiration des offres > 48h
- Clause libératoire : achat automatique si offre ≥ clause

### 7.5 Agents libres
- Pool de joueurs libérés (contrat expiré, libéré, club supprimé)
- `POST /market/free-agents/:id/sign` : recrutement gratuit
- Job `expire-free-agents` : -2 overall à J+7, suppression à J+14

### 7.6 Gestion des contrats
- Job `check-expired-contracts` : après chaque journée, libère les joueurs à 0 matchs restants
- Vérification effectif min 16 avant toute vente/libération
- Vérification effectif max 25 avant tout achat/recrutement

### 7.7 Frontend — Transferts
- Page `/market` : 3 onglets (Joueurs disponibles, Agents libres, Mes transferts)
- Filtres : poste, overall, âge, prix
- Fiche joueur avec bouton "Acheter" / "Faire une offre"
- Page `/market/offers` : offres envoyées et reçues
- Notifications pour offres reçues, acceptées, rejetées

**Livrable Phase 7** : un marché des transferts complet avec IA, offres humaines, et agents libres.

---

## Phase 8 — Entraînement & Progression (SPEC-09, SPEC-12)

> **Objectif** : les joueurs progressent via l'entraînement et les performances en match.

### 8.1 Schema DB
- Tables : `club_training_program`, `player_training_override`, `training_sessions`, `training_results`, `player_progression_log`, `player_match_appearances`
- Colonnes sur `players` : `is_exceptional_form`, `exceptional_form_since`, `is_favorite`

### 8.2 Programme d'entraînement
- `GET /training/program`, `PUT /training/program` : programme par ligne (GK/DEF/MID/ATT)
- `GET/PUT/DELETE /training/overrides/:playerId` : focus individuel
- 5 focus + repos : Physique, Technique, Mental, Défensif, CPA, Repos

### 8.3 Application de l'entraînement
- Job `apply-training` (post-match) : calcul des gains par joueur
- Formule : `budget_session = 0.5` × modif_âge × modif_niveau × modif_fatigue
- Distribution sur les stats du focus, ±30% random
- Plafond : stat ≤ `potential + 5`

### 8.4 Modificateurs de progression
- Service `ProgressionService` : calcul des modificateurs de rôle
- Titulaire régulier ×1.2, Capitaine ×1.1 (mental), Jeune intégré ×1.3, Remplaçant ×0.7, Non convoqué ×0.3
- Ralentissement par inactivité : Peu utilisé ×0.5, Inactif ×0.1
- Cumulatifs (multiplicatifs)

### 8.5 Forme exceptionnelle
- Détection : note ≥ 8.0 dans 3/5 derniers matchs → plafond passe de potential+5 à potential+8
- Maintien : note ≥ 7.0 dans 2/5 derniers matchs
- Déclin : -0.1/match sur les stats au-dessus du plafond normal
- Badge 🔥 et notifications adjoint

### 8.6 API Progression
- `GET /players/:id/progression` : historique 30 jours par stat avec sources détaillées
- `GET /players/:id/progression/summary` : résumé overall
- `POST/DELETE /players/:id/favorite` : marquer/démarquer comme favori (max 5)
- `GET /squad/favorites` : widget dashboard

### 8.7 Frontend — Entraînement & Progression
- Page `/training` : programme par ligne, overrides individuels
- Section progression sur la fiche joueur (graphique 30j, sources détaillées)
- Widget favoris sur le dashboard

**Livrable Phase 8** : les joueurs progressent via entraînement et matchs, avec suivi visible.

---

## Phase 9 — Finances (SPEC-10)

> **Objectif** : le système économique complet avec revenus, dépenses et alertes.

### 9.1 Schema DB
- Table : `club_sponsorship`
- Enrichissement de `financial_transactions` (nouveaux types)

### 9.2 Revenus
- Billetterie : 100-250K par match à domicile (selon division)
- Droits TV : 500K-2M par saison (selon division)
- Sponsoring : 240K-1.2M par saison (4 versements mensuels)
- Primes de match : 50K victoire, 20K nul
- Primes de saison : 50K-5M selon position et division

### 9.3 Dépenses
- Job `process-salary` (cron hebdo lundi 00:00) : déduction salaires
- Transferts, indemnités de libération, extensions de contrat
- Chaque transaction crée une entrée dans `financial_transactions`

### 9.4 Santé financière
- Alerte orange : solde < 500K
- Blocage transferts : solde < 0
- Vente forcée : solde < -2M → joueur au plus gros salaire vendu à 80% de sa valeur marché
- Job `check-financial-health` (post-salaires)

### 9.5 Frontend — Finances
- Enrichir la page `/finances` : graphique solde 30j, détail salaires, historique transactions
- Notifications pour alertes financières
- Indicateur de santé financière dans le dashboard

**Livrable Phase 9** : économie complète avec revenus automatiques, salaires, et garde-fous.

---

## Phase 10 — Tactiques avancées (SPEC-11)

> **Objectif** : presets tactiques, auto-adjustment et analyse pré-match.

### 10.1 Schema DB
- Table : `tactical_presets`
- Colonne `auto_adjustment` sur `clubs`

### 10.2 Presets tactiques
- `GET/POST/PUT/DELETE /tactics/presets` : CRUD (max 5 presets, 3 par défaut)
- `POST /tactics/presets/:id/apply` : appliquer un preset à la tactique courante

### 10.3 Auto-adjustment
- `PATCH /tactics/auto-adjustment` : activer/désactiver (défaut: ON)
- Logique : si joueur déconnecté et blessure/rouge pendant le match → remplacement automatique + passage en 4-4-2 équilibré

### 10.4 Analyse pré-match
- `GET /tactics/analysis/:matchId` : dernière formation adverse, mentalité, forme récente, overalls par ligne, suggestion tactique de l'adjoint

### 10.5 Score de cohérence
- Calcul sur la composition : joueurs à leur poste préféré, affinités formation, fatigue, moral
- Score 0-100% affiché sur l'écran de tactique

### 10.6 Frontend — Tactiques avancées
- Panel de presets (sauvegarder, charger)
- Toggle auto-adjustment dans les paramètres
- Vue pré-match (analyse adversaire + suggestion)
- Indicateur de cohérence sur le terrain tactique

**Livrable Phase 10** : gestion tactique complète avec presets et assistance de l'adjoint.

---

## Phase 11 — Onboarding (SPEC-08)

> **Objectif** : guider les nouveaux joueurs à travers les premières actions.

### 11.1 Schema DB
- Table : `onboarding_missions`
- Colonnes sur `users` : `onboarding_status`, `onboarding_completed_at`

### 11.2 Flow d'onboarding
- Étape 1 : Création de club (formulaire dédié, ~2min)
- Étape 2 : Tour guidé (highlights sur les zones clés, ~1min)
- Étape 3 : Missions (5 objectifs avec récompenses G$)

### 11.3 Missions
- Détection côté serveur (anti-triche) :
  1. Créer son club : auto-complétée (50K G$)
  2. Voir son effectif : visite de `/squad` (50K G$)
  3. Configurer sa tactique : sauvegarde d'une composition (100K G$)
  4. Jouer un match amical : match terminé (200K G$)
  5. Voir le classement : visite de `/competition` (50K G$)
- `POST /onboarding/missions/:missionKey/claim` : réclamer la récompense

### 11.4 Introduction du staff
- 4 notifications d'accueil personnalisées (adjoint, médecin, directeur sportif, secrétaire)

### 11.5 Frontend — Onboarding
- Modal de création de club (nom, couleurs, stade)
- Tour guidé (overlay avec highlights)
- Widget missions (checklist avec progression)
- Skip possible + relance depuis les paramètres

**Livrable Phase 11** : les nouveaux joueurs sont guidés et récompensés pour leurs premières actions.

---

## Phase 12 — Modération (SPEC-13 complément)

> **Objectif** : compléter le système de modération initié en Phase 1.
> La validation des noms et la blacklist sont déjà en place depuis la Phase 1.

### 12.1 Schema DB (compléments)
- Tables : `moderation_reports`, `suspicious_activities`, `moderation_actions`
- Colonnes sur `users` : `is_suspended`, `suspended_until`, `is_banned`, `must_rename`

### 12.2 Signalement
- `POST /reports` : créer un signalement (4 motifs, max 3/24h, 1 par cible)
- Confidentialité totale (le signalé ne sait pas)

### 12.3 Détection automatique
- Job `SuspiciousActivityCheck` (post-match) : abandon, performances suspectes
- Job `MultiAccountCheck` (inscription) : IP déjà connue
- Job `TransferSuspicionCheck` (post-transfert) : même IP
- 3 niveaux de sévérité (low/medium/high), jamais de blocage automatique

### 12.4 Actions admin
- Endpoints admin : warn, force-rename, suspend, ban, reset-club, unsuspend, unban
- Middleware de vérification au login (banned → 403, suspended → 403 avec date)
- Job `AutoUnsuspend` (cron horaire) : levée des suspensions expirées

### 12.5 Frontend — Admin
- Page `/admin/moderation` : liste signalements, activités suspectes, blacklist
- Fiche utilisateur admin : signalements, activité suspecte, historique modération, IPs
- Actions rapides (renommer, suspendre, bannir)
- Modal de renommage forcé au login si `must_rename = true`

**Livrable Phase 12** : modération complète avec signalement, détection et actions admin.

---

## Phase 13 — Polish & Intégration finale

> **Objectif** : s'assurer que tout fonctionne ensemble et que l'expérience est fluide.

### 13.1 Tests end-to-end
- Scénario complet : inscription → club → ligue → match → transfert → entraînement → progression
- Test de cycle de saison complet (38 journées accélérées)
- Test de concurrence (plusieurs clubs dans la même ligue)

### 13.2 Gestion d'erreurs
- Revue de tous les endpoints : codes d'erreur cohérents, messages explicites
- Gestion des cas limites : effectif minimum, solde négatif, offres simultanées

### 13.3 Performance
- Indexes DB vérifiés pour toutes les requêtes fréquentes
- Cache Redis pour les données chaudes (classement, prochain match, stats agrégées)
- Optimisation des queries N+1 (Drizzle relations)

### 13.4 Seed complet
- Script de seed pour créer un environnement de test réaliste :
  - 1 ligue avec 3 divisions de 20 clubs
  - 1 club humain + 59 IA
  - Saison en cours à la journée 5
  - Historique de matchs et transactions

### 13.5 UX final
- Responsive design vérifié
- Loading states sur toutes les pages
- Animations subtiles (transitions de pages, mises à jour en temps réel)
- Messages d'erreur contextuels et utiles

**Livrable Phase 13** : MVP Lot 1 complet, testable de bout en bout.

---

## Récapitulatif des phases

| Phase | Domaine | Specs | Tables | Endpoints | Jobs |
|---|---|---|---|---|---|
| 0 | Infrastructure | — | 0 | 0 | 0 |
| 1 | Auth + Noms | SPEC-01, SPEC-13 (partiel) | 5 | 19 | 3 |
| 2 | Club & Effectif | SPEC-02, SPEC-04 | 10 | 22 | 0 |
| 3 | Championnat | SPEC-05 | 6 | 11 | 8 |
| 4 | Clubs IA | SPEC-07 | 0 | 2 | 4 |
| 5 | Match Engine | SPEC-03 | 6 | 13 + WS | 4 |
| 6 | Game Loop | — | 0 | 0 | 2 |
| 7 | Transferts | SPEC-06 | 4 | 18 | 6 |
| 8 | Entraînement & Progression | SPEC-09, SPEC-12 | 6 | 13 | 1 |
| 9 | Finances | SPEC-10 | 1 | 5 | 6 |
| 10 | Tactiques avancées | SPEC-11 | 1 | 7 | 0 |
| 11 | Onboarding | SPEC-08 | 1 | 5 | 0 |
| 12 | Modération (complément) | SPEC-13 | 3 | 17 | 5 |
| 13 | Polish | — | 0 | 0 | 0 |
| **Total** | | **13 specs** | **~43** | **~132 + WS** | **~39** |

---

*Plan rédigé le 2026-03-03. À valider avant démarrage de l'implémentation.*
