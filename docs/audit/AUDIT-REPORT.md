# AUDIT-REPORT.md — Regista

> **Date :** 2026-04-06
> **Spec :** SPEC-P0-01 — Audit de l'existant
> **Méthode :** Exploration exhaustive de la codebase + tentative d'exécution de l'infrastructure

---

## 1. Auth & Onboarding

### Auth — Inscription / Login / Logout
- **Statut :** ✅ OK
- **Détail :** 9 endpoints complets (register, login, refresh, logout, verify-email, resend-verification, forgot/reset-password, check-username, check-email). JWT HS256 avec rotation de refresh tokens en DB, cookies httpOnly. Bcrypt hashing. Rate limiting en place. Frontend : pages login, register, verify-email, forgot/reset-password toutes connectées à l'API. Auth context avec bootstrap automatique via `GET /users/me` et refresh transparent.
- **Priorité fix :** —

### Auth — Création de club
- **Statut :** ✅ OK
- **Détail :** `POST /clubs/` déclenche la chaîne complète : génération du squad (22 joueurs), création des clubs IA (59 par league), génération de la league (3 divisions + calendrier 38 journées), onboarding missions, presets tactiques par défaut. Onboarding frontend en 4 étapes.
- **Priorité fix :** —

### Auth — Email verification (production)
- **Statut :** ❌ Cassé
- **Détail :** `EmailService` lance `Error('Production email not configured')` en mode production. Seul le mode dev fonctionne (log console). Pas de provider SMTP configuré.
- **Priorité fix :** P2 (peut attendre — dev-only pour le moment)

---

## 2. Squad (Composition d'équipe)

### Squad — Affichage liste joueurs
- **Statut :** ✅ OK
- **Détail :** `GET /squad` avec filtrage par position, tri par stat. Frontend affiche les joueurs groupés par ligne (GK/DEF/MID/ATT) avec stats, fatigue, statut blessure/suspension. Page joueur détaillée avec stats par catégorie, contrat, condition, performances récentes, graphe de progression.
- **Priorité fix :** —

### Squad — Sélection titulaires / remplaçants (drag & drop)
- **Statut :** ❌ Cassé
- **Détail :** **Aucun drag & drop n'existe.** La composition est gérée par auto-lineup (`POST /tactics/auto-lineup`) ou affectation automatique. Il n'y a aucune interface manuelle pour placer les joueurs sur le terrain par glisser-déposer.
- **Priorité fix :** P1 (important pour l'expérience manager)

### Squad — Sauvegarde de la composition
- **Statut :** ⚠️ Partiel
- **Détail :** La composition est stockée en **Redis** (`composition:{clubId}`), pas en PostgreSQL. Endpoint `PUT /tactics/composition` existe et fonctionne. Risque : perte de composition en cas de flush Redis.
- **Priorité fix :** P1 (données critiques en Redis seul — viole la règle CLAUDE.md)

### Squad — Changement de capitaine
- **Statut :** ⚠️ Partiel
- **Détail :** Le capitaine est stocké dans `tacticalPresets` (champ `captainId`). Visible sur le terrain (badge capitaine dans `FootballPitch`). Pas d'interface dédiée pour changer le capitaine indépendamment des presets.
- **Priorité fix :** P2

---

## 3. Tactiques

### Tactiques — Choix de formation
- **Statut :** ✅ OK
- **Détail :** Grille de 8 formations (depuis `FORMATIONS` dans `@regista/shared`). Affichage SVG du terrain via `FootballPitch` avec coordonnées précises par formation (`FORMATION_COORDINATES`). Overall, nom, fatigue, compatibilité couleur, badge capitaine.
- **Priorité fix :** —

### Tactiques — Modification paramètres
- **Statut :** ✅ OK
- **Détail :** 6 paramètres tactiques modifiables : mentalité (5 niveaux), pressing, style de passe, largeur, tempo, ligne défensive (3 options chacun). Sauvegarde via `PUT /tactics`. Score de cohérence calculé (position 40%, fraîcheur 30%, diversité banc 15%, warnings 15%).
- **Priorité fix :** —

### Tactiques — Presets
- **Statut :** ✅ OK
- **Détail :** CRUD complet (max 8 presets). Créer/modifier/supprimer/appliquer. Stockés en PostgreSQL (`tacticalPresets` table). L'application d'un preset déclenche auto-lineup.
- **Priorité fix :** —

### Tactiques — Stockage
- **Statut :** ⚠️ Partiel
- **Détail :** Tactiques courantes en **Redis** (`tactics:{clubId}`), presets en **PostgreSQL**. Les tactiques courantes (paramètres actifs) sont perdues en cas de flush Redis. **Violation de la règle CLAUDE.md** : "Ne jamais stocker de donnée critique dans Redis seul."
- **Priorité fix :** P1 (donnée critique du gameplay)

### Tactiques — Compatibilité position secondaire
- **Statut :** 🔲 Fake/Hardcodé
- **Détail :** `isSecondary = false // Simplified` dans l'auto-lineup. La compatibilité position secondaire est toujours à 0.7 au lieu de vérifier le champ `secondaryPositions` du joueur. Impacte la qualité de l'auto-lineup.
- **Priorité fix :** P2

---

## 4. Match Engine

### Match — Lancement (BullMQ)
- **Statut :** ✅ OK
- **Détail :** Worker `match:scheduler` tourne toutes les 5 minutes, détecte les matchs planifiés dans les 15 prochaines minutes, enqueue `match:pre-match`. Pre-match prépare les lineups (IA auto-select, humain fallback). 4 workers enregistrés dans `start/workers.ts` (email, match, transfer, finance).
- **Priorité fix :** —

### Match — Simulation (événements)
- **Statut :** ✅ OK
- **Détail :** Simulation minute par minute via `MatchEngine.simulateMatch()`. Possession, tirs, buts, fautes, cartons, blessures, fatigue. Probabilités basées sur les stats. IA fait des décisions tactiques à la mi-temps, min 60 et min 75.
- **Priorité fix :** —

### Match — Socket.io (temps réel)
- **Statut :** ❌ Cassé
- **Détail :** **Aucune intégration Socket.io côté frontend.** Grep pour "socket" renvoie 0 résultats dans `apps/web/src/`. Le backend a `start/ws.ts` configuré avec Socket.io, mais le client n'écoute jamais les événements. Les mises à jour live utilisent du **polling HTTP** (refetchInterval 3-5 secondes). Fonctionnel mais inefficient et non-conforme à la spec.
- **Priorité fix :** P1 (core loop — expérience match live dégradée)

### Match — Post-match (score, classement)
- **Statut :** ✅ OK
- **Détail :** Pipeline post-match 10 étapes : (1) standings update, (2) fatigue, (3) match revenue, (4) injury decrement, (5) suspensions, (6) fatigue recovery, (7) passive progression, (8) training, (9) notifications, (10) matchday advancement. Score final persisté en base.
- **Priorité fix :** —

### Match — Fatigue
- **Statut :** ✅ OK
- **Détail :** Appliquée aux joueurs après le match dans le post-processing pipeline (étape 2). Récupération progressive (étape 6).
- **Priorité fix :** —

### Match — Blessures
- **Statut :** ✅ OK
- **Détail :** Générées pendant la simulation et enregistrées. Décrément des jours de blessure dans le post-processing (étape 4).
- **Priorité fix :** —

### Match — Revenue billetterie
- **Statut :** 🔲 Fake/Hardcodé
- **Détail :** `standingPosition = 10` est **hardcodé** dans `match_worker.ts:72`. Le bonus de position (top-5) pour la billetterie n'est jamais attribué car la position réelle au classement n'est pas requêtée. Tous les clubs reçoivent le même bonus par défaut.
- **Priorité fix :** P1 (fausse les finances et l'économie)

---

## 5. Transferts

### Transferts — Affichage marché
- **Statut :** ⚠️ Partiel
- **Détail :** `GET /market` fonctionne avec pagination. Côté frontend, `MarketPlayerCard` affiche les listings. **Problème :** le `marketQueryValidator` accepte des filtres (position, overall, age, prix) mais le controller **n'utilise que le filtre `source`**, ignorant les autres. Les filtres frontend sont visuellement présents mais ne filtrent pas côté serveur.
- **Priorité fix :** P1 (UX trompeuse — les filtres ne fonctionnent pas)

### Transferts — Achat direct
- **Statut :** ✅ OK
- **Détail :** `POST /market/buy/:listingId` transfère le joueur et débite le compte via `TransferExecutor`. Historique enregistré.
- **Priorité fix :** —

### Transferts — Vente / Listing
- **Statut :** ⚠️ Partiel
- **Détail :** `POST /market/sell` et `sellPlayer()` existent dans le backend et le lib frontend. **Mais aucun formulaire de mise en vente n'existe sur la page transferts.** La vente n'est accessible que depuis la page détail d'un joueur. UX incomplète.
- **Priorité fix :** P2

### Transferts — Offres
- **Statut :** ✅ OK
- **Détail :** Système complet : envoi (`POST /offers/`), réception, acceptation, refus, contre-offre. Frontend affiche offres envoyées/reçues dans l'onglet "My Transfers".
- **Priorité fix :** —

### Transferts — Agents libres
- **Statut :** ✅ OK
- **Détail :** `GET /market/free-agents` + `POST /market/free-agents/:id/sign`. Worker `expire-free-agents` avec pénalité -2 OVR au jour 7. Frontend avec onglet dédié.
- **Priorité fix :** —

---

## 6. Finances

### Finances — Affichage budget
- **Statut :** ✅ OK
- **Détail :** `GET /finances` renvoie le résumé (balance, revenus/dépenses 7j). Balance card dans le frontend. Format G$ (centimes → affichage).
- **Priorité fix :** —

### Finances — Billetterie post-match
- **Statut :** ⚠️ Partiel
- **Détail :** Le calcul de billetterie existe dans le post-match pipeline (étape 3). Les revenus sont calculés et crédités. **Mais** le bonus position est faussé (cf. `standingPosition = 10` hardcodé dans le match engine).
- **Priorité fix :** P1 (lié au bug match revenue)

### Finances — Salaires
- **Statut :** ✅ OK
- **Détail :** Worker `process-salaries` tourne chaque lundi 00:00 UTC. Déduit les salaires de TOUS les clubs (humains et IA). Vérifie la santé financière pour les clubs humains (alerte, critique, vente forcée).
- **Priorité fix :** —

### Finances — Historique transactions
- **Statut :** ✅ OK
- **Détail :** `GET /finances/transactions` avec pagination cursor et filtre par type. `TransactionList` component côté frontend. `GET /finances/salary-breakdown` pour le détail par joueur.
- **Priorité fix :** —

---

## 7. Entraînement

### Entraînement — Choix de focus
- **Statut :** ✅ OK
- **Détail :** `GET /training` + `PUT /training`. 4 focus par ligne (GK/DEF/MID/ATT) avec 6 options incluant "repos". Sauvegardé en PostgreSQL (`trainingPrograms` table). Mutations TanStack Query pour save instant côté frontend.
- **Priorité fix :** —

### Entraînement — Progression post-cycle
- **Statut :** ✅ OK
- **Détail :** `TrainingService.applyTraining()` appelé dans le pipeline post-match (étape 8). Stats modifiées en base selon le focus choisi. Progression historique trackée via `playerOverallHistory`.
- **Priorité fix :** —

### Entraînement — Affichage progression
- **Statut :** ⚠️ Partiel
- **Détail :** La page entraînement ne montre que les focus actuels. **Aucun feedback visuel sur les gains de stats.** La progression est visible uniquement sur la page détail joueur (`PlayerProgressionChart`), pas sur la page entraînement elle-même.
- **Priorité fix :** P2

---

## 8. Compétition / Calendrier

### Compétition — Calendrier
- **Statut :** ✅ OK
- **Détail :** Calendrier 38 journées round-robin généré par `CalendarService`. Alternance domicile/extérieur. Matchday view accessible via `/matchday/:number`.
- **Priorité fix :** —

### Compétition — Classement
- **Statut :** ✅ OK
- **Détail :** Standings mis à jour dans le pipeline post-match (étape 1). Table complète avec V/N/D domicile/extérieur, forme. Zones colorées (champion/promotion/relégation) côté frontend.
- **Priorité fix :** —

### Compétition — Avancement journée
- **Statut :** ✅ OK
- **Détail :** Avancement automatique du matchday dans le pipeline post-match (étape 10). Season lifecycle gère la fin de saison, intersaison (promotion/relégation, vieillissement, reset cartons, nouveau calendrier).
- **Priorité fix :** —

### Compétition — Historique de position
- **Statut :** 🔲 Fake/Hardcodé
- **Détail :** `GET /competition/position-history` est un **placeholder** qui retourne uniquement la position actuelle. Aucune table de suivi par journée n'existe (commentaire dans le code : "Placeholder: full history would require a position_history table"). La table `playerOverallHistory` existe pour les joueurs mais pas pour le classement clubs.
- **Priorité fix :** P2

### Compétition — Sidebar division
- **Statut :** 🔲 Fake/Hardcodé
- **Détail :** La sidebar affiche `'Premier Division'` en dur (ligne 68 de `sidebar.tsx`) quel que soit la division réelle du club.
- **Priorité fix :** P2

---

## 9. Infrastructure technique

### Tests — Japa bootstrap
- **Statut :** ❌ Cassé
- **Détail :** `pnpm test` provoque une **boucle infinie** : le message `[ info ] booting application to run tests...` se répète indéfiniment sans jamais exécuter de test. Cause probable : les preloads (`#start/infra`, `#start/routes`) tentent de se connecter à PostgreSQL/Redis qui ne tournent pas. Pas d'environnement de test isolé configuré.
- **Priorité fix :** P0 (bloquant — impossible de valider quoi que ce soit)

### Tests — Couverture
- **Statut :** ❌ Cassé
- **Détail :** **Zéro test unitaire.** Aucun dossier `tests/unit/` n'existe. 4 tests fonctionnels existent (`auth/login.spec.ts`, `auth/refresh.spec.ts`, `auth/register.spec.ts`, `clubs/club.spec.ts`) mais ne peuvent pas tourner (cf. boucle infinie). Le CLAUDE.md mandate des tests unitaires pour le match engine, les finances, la progression — aucun n'existe.
- **Priorité fix :** P0 (bloquant — aucun filet de sécurité)

### Seed — Script
- **Statut :** ⚠️ Partiel
- **Détail :** Seul `packages/db/src/seed.ts` existe et ne seede que la `nameBlacklist` (~45 termes). **Aucun seed de données gameplay** (clubs, joueurs, leagues, fixtures). Le `TestSeeder.ts` mentionné dans CLAUDE.md **n'existe pas**.
- **Priorité fix :** P1 (nécessaire pour le dev et les tests)

### Dev local — `pnpm dev`
- **Statut :** ✅ OK
- **Détail :** `pnpm dev` → `turbo dev` lance API (AdonisJS HMR) + Web (TanStack Start) + DB (tsc watch). Nécessite `pnpm docker:infra:up` au préalable pour PostgreSQL + Redis. Scripts correctement câblés.
- **Priorité fix :** —

### Migrations — Drizzle
- **Statut :** ✅ OK
- **Détail :** 12 migrations (0000-0011) dans `packages/db/drizzle/`. `drizzle.config.ts` pointe vers `./dist/schema/*.js` (nécessite build préalable, géré par le script `db:generate`). Pipeline fonctionnel.
- **Priorité fix :** —

### Docker
- **Statut :** ✅ OK
- **Détail :** 3 fichiers docker-compose (prod, dev, infra). Healthchecks sur tous les services. Dépendances correctes. Dockerfiles API et Web présents.
- **Priorité fix :** —

### Dépendances
- **Statut :** ✅ OK
- **Détail :** `pnpm install --frozen-lockfile` passe en ~728ms. Lockfile à jour. pnpm 9.15.4.
- **Priorité fix :** —

---

## 10. Base de données — Problèmes structurels

### DB — FK manquantes sur `clubs`
- **Statut :** ❌ Cassé
- **Détail :** `clubs.leagueId` et `clubs.divisionId` sont des colonnes UUID **sans contrainte de clé étrangère** vers `leagues.id` / `divisions.id`. L'intégrité référentielle n'est pas garantie par la base.
- **Priorité fix :** P1

### DB — Relations Drizzle non définies
- **Statut :** ❌ Cassé
- **Détail :** **Aucune `relations()` Drizzle définie** dans les 12 fichiers de schéma. Les FK existent au niveau SQL mais les requêtes relationnelles Drizzle (`db.query.X.findMany({ with: {...} })`) ne fonctionneront pas. Tous les joins doivent être manuels.
- **Priorité fix :** P2 (fonctionnel avec joins manuels, mais ergonomie dégradée)

### DB — FK manquantes (autres)
- **Statut :** ⚠️ Partiel
- **Détail :** `transferOffers.parentOfferId` (self-ref manquante) et `moderationReports.reviewedBy` (FK users manquante) n'ont pas de contraintes FK.
- **Priorité fix :** P2

### DB — Table `premium_transactions` absente
- **Statut :** 🔲 Fake/Hardcodé
- **Détail :** Le CLAUDE.md affirme "table `premium_transactions` créée mais vide" — c'est faux, la table **n'existe pas** dans le schéma. Incohérence documentation/code.
- **Priorité fix :** P2 (cosmétiques = Lot 2)

---

## 11. Erreurs métier & Qualité de code

### Exceptions custom
- **Statut :** ❌ Cassé
- **Détail :** Le CLAUDE.md exige des exceptions typées (`InsufficientFundsError`, `SquadFullError`, etc.). **Aucune n'existe.** Tous les services utilisent `throw new Error('message')` et les controllers font `catch (err: any) { return response.badRequest({ error: 'CODE', message: err.message }) }`. Pas de différenciation 400/403/409 au niveau service.
- **Priorité fix :** P2

### Workers non enregistrés
- **Statut :** ⚠️ Partiel
- **Détail :** `cleanup_worker.ts` et `inactivity_worker.ts` existent mais ne sont **pas enregistrés** dans `start/workers.ts`. Code mort. De plus, ils partagent le nom de queue `email`, ce qui causerait des conflits de routage s'ils étaient activés.
- **Priorité fix :** P2

### Validators inline
- **Statut :** ⚠️ Partiel
- **Détail :** Tactics et Training ont leurs validators inline dans les controllers au lieu de fichiers séparés. Rompt la convention du projet.
- **Priorité fix :** P2

### `fetchPlayerDetail` non typé
- **Statut :** ⚠️ Partiel
- **Détail :** `lib/squad.ts` retourne `Promise<any>` pour le détail joueur. Viole la règle "Pas de `any` TypeScript".
- **Priorité fix :** P2

---

## 12. Design System

### Typographie
- **Statut :** ❌ Cassé
- **Détail :** La spec identité exige **Nunito** pour body/navigation/boutons. Le code utilise **Plus Jakarta Sans** (body) et **Space Grotesk** (headings). Nunito n'est même pas chargé. Barlow Condensed est chargé mais sous-utilisé.
- **Priorité fix :** P1 (identité visuelle non respectée)

### Couleurs
- **Statut :** ⚠️ Partiel
- **Détail :** Les couleurs principales sont correctes (#2E9E5B, #3FCE7A, #FF6B35, #F5E642, #EAE8E1). **Déviations :** `--background`/`--nuit` utilise `#05170c` au lieu de `#0D1F14` (plus sombre). `--destructive-foreground: #ffffff` viole la règle "pas de blanc pur".
- **Priorité fix :** P2

---

## Résumé par priorité

### P0 — Bloquant (rien ne démarre sans ça)

| # | Module | Problème |
|---|--------|----------|
| 1 | Tests | Boucle infinie au bootstrap Japa — impossible d'exécuter les tests |
| 2 | Tests | Zéro test unitaire (match engine, finances, progression) |

### P1 — Important (core loop / intégrité données)

| # | Module | Problème |
|---|--------|----------|
| 3 | Match | Socket.io non intégré côté frontend — polling HTTP uniquement |
| 4 | Match | `standingPosition = 10` hardcodé — revenus billetterie faussés |
| 5 | Tactiques | Tactiques courantes stockées en Redis seul (violation règle) |
| 6 | Squad | Composition stockée en Redis seul (violation règle) |
| 7 | Squad | Pas de drag & drop pour la composition |
| 8 | Transferts | Filtres marché (position, overall, age, prix) ignorés côté serveur |
| 9 | Seed | Pas de seed gameplay (clubs, joueurs, leagues) |
| 10 | Design | Typographie non conforme (Nunito manquant) |
| 11 | DB | FK manquantes sur `clubs.leagueId` et `clubs.divisionId` |

### P2 — Peut attendre

| # | Module | Problème |
|---|--------|----------|
| 12 | Compétition | `positionHistory` = placeholder, retourne position actuelle |
| 13 | Compétition | Sidebar hardcode "Premier Division" |
| 14 | Tactiques | Compatibilité position secondaire hardcodée à `false` |
| 15 | Squad | Pas d'interface dédiée changement capitaine |
| 16 | Transferts | Pas de formulaire vente sur la page transferts |
| 17 | Entraînement | Pas de feedback progression sur la page entraînement |
| 18 | DB | Relations Drizzle non définies |
| 19 | DB | FK manquantes (parentOfferId, reviewedBy) |
| 20 | DB | Table `premium_transactions` mentionnée mais inexistante |
| 21 | Code | Aucune exception custom typée |
| 22 | Code | Workers cleanup/inactivity = code mort |
| 23 | Code | Validators inline (tactics, training) |
| 24 | Code | `fetchPlayerDetail` retourne `any` |
| 25 | Code | Email service non configuré pour la production |
| 26 | Design | Couleur nuit légèrement différente, blanc pur dans destructive |

---

## Statistiques globales

| Métrique | Valeur |
|----------|--------|
| Fichiers backend (apps/api) | ~71 fichiers TS |
| Fichiers frontend (apps/web) | ~90+ fichiers (routes + components + lib) |
| Tables en base | 29 |
| Types partagés | 12 fichiers, ~80 exports |
| Endpoints API | ~60 |
| Routes frontend | 23 |
| Migrations | 12 |
| Tests existants | 4 (fonctionnels, ne tournent pas) |
| Tests unitaires | 0 |
| Workers BullMQ | 4 enregistrés + 2 morts |
| Items ✅ OK | 19 |
| Items ⚠️ Partiel | 12 |
| Items ❌ Cassé | 8 |
| Items 🔲 Fake/Hardcodé | 5 |
