# REGISTA — Roadmap stratégique

> **Objectif** : transformer un prototype cassé en un jeu de football management web multijoueur, fun et jouable — d'abord pour toi, puis tes potes, puis le monde.

---

## Décisions structurantes (à trancher AVANT de coder)

### 1. Rythme de jeu — Le nerf de la guerre

Le cycle de 3 jours est mort. Voici la proposition :

**2 matchs par semaine** — mardi soir + samedi après-midi (heures fixes, configurables par league).

- Championnat : 38 journées = **19 semaines ≈ 4.5 mois** par saison (proche d'une vraie saison)
- Coupe nationale (à ajouter) : matchs en milieu de semaine → jusqu'à **3 matchs/semaine** en période de coupe
- Intersaison : **3-5 jours** (transferts, vieillissement, promotions/relégations)

**Pourquoi c'est mieux que 3 jours :** le joueur a un rendez-vous régulier (mardi/samedi), il gère ses transferts et entraînement entre les matchs, et la saison dure assez longtemps pour créer de l'attachement sans traîner.

**Le match de 90 minutes réelles :** conservé tel quel. Le match démarre à l'heure fixe. Si le manager est en ligne, il peut intervenir (remplacements, changement de mentalité, ajustements tactiques). S'il est absent, ses presets jouent automatiquement. C'est le modèle Virtuafoot et il fonctionne — il crée un rendez-vous sans obliger à être collé à l'écran.

### 2. Architecture multijoueur

**Modèle : League partagée avec slots humains et IA.**

- Chaque league = 20 clubs (mix humains + IA)
- Un joueur crée ou rejoint une league existante
- Les clubs IA comblent les places vides et se comportent comme de vrais clubs (transferts, rotation, progression)
- Quand un humain rejoint, il remplace un club IA (ou en crée un nouveau si la league n'est pas pleine)

**Pourquoi ce modèle :**
- Jouable seul (1 humain + 19 IA) → ton cas de test immédiat
- Jouable entre amis (5 humains + 15 IA) → ton premier objectif social
- Scalable (20 humains, 0 IA) → l'objectif long terme
- Pas besoin de refonte quand tu ajoutes des joueurs

### 3. Monétisation (poser les bases même si c'est loin)

Cosmétiques uniquement, zéro pay-to-win :
- Maillots custom / édités
- Thèmes de stade
- Badges, écussons, animations de but
- Naming de league (fun entre potes)
- Pass saisonnier cosmétique (si ça décolle)

---

## Phase 0 — Sauvetage (2-3 semaines)

> **Objectif : un prototype qui FONCTIONNE de bout en bout.**
> Tant que la boucle de base ne tourne pas, rien d'autre ne compte.

### 0.1 Audit & stabilisation du code existant

- [ ] **Inventaire de ce qui marche vs. ce qui est cassé** — parcourir chaque feature (compo, tactique, match, transferts, finances) et lister ce qui fonctionne, ce qui crashe, ce qui est fake/hardcodé
- [ ] **Fixer le bootstrap des tests Japa** — priorité absolue. Sans tests, chaque modification est un coup de dés
- [ ] **Écrire les tests critiques du match engine** — simulation complète d'un match, vérification des scores, events, fatigue, blessures
- [ ] **Écrire les tests des finances** — billetterie, salaires, transferts, vérifier que le solde est cohérent après un cycle complet
- [ ] **Script de seed complet** — 1 user + 1 club + 1 league de 20 clubs + avancer à la journée 5 automatiquement

### 0.2 Réparer le core loop

- [ ] **Composition d'équipe** — le drag & drop / sélection de joueurs DOIT fonctionner (titulaires, remplaçants, rôles)
- [ ] **Lancement d'un match** — de la compo au coup d'envoi, la chaîne complète doit tourner : job BullMQ → simulation → événements → résultat en base
- [ ] **Match live via Socket.io** — valider le flow complet : le client reçoit les events en temps réel, affiche le score, les actions
- [ ] **Post-match** — classement mis à jour, fatigue appliquée, blessures enregistrées, finances calculées
- [ ] **Migrer les tactiques de Redis vers PostgreSQL** — donnée critique, ne doit pas être volatile

### 0.3 Workflow de développement

- [ ] **Définir une convention de specs** — chaque feature = 1 spec markdown (contexte, règles métier, critères d'acceptation, edge cases)
- [ ] **CI basique sur GitHub** — lint + tests sur chaque push (même si la suite de tests est petite au début)
- [ ] **Script de dev local** — `pnpm dev` qui lance tout (API, workers, frontend, Redis, PostgreSQL) en une commande

**Critère de sortie Phase 0 :** tu peux créer un club, composer ton équipe, lancer un match, le regarder se dérouler en live, voir le résultat, et le classement est mis à jour. Testé, reproductible, pas de crash.

---

## Phase 1 — Core loop fun en solo (4-6 semaines)

> **Objectif : une saison complète jouable seul, avec une IA crédible et un rythme qui donne envie de revenir.**

### 1.1 Rythme & calendrier

- [ ] **Passer au cycle 2 matchs/semaine** — implémenter le scheduling mardi/samedi (configurable)
- [ ] **Calendrier round-robin** — génération automatique des 38 journées avec alternance domicile/extérieur
- [ ] **Intersaison automatisée** — job de fin de saison : classement final, primes, promotions/relégations, vieillissement, nouveau calendrier

### 1.2 Match engine v1.5

Pas besoin d'un moteur parfait, mais les bases manquantes sont critiques :

- [ ] **Penalties** — faute dans la surface → penalty (probabilité liée au pressing et à la zone d'action)
- [ ] **Corners** — tir non cadré ou dévié → corner (probabilité de but liée au heading des attaquants et à la taille du GK)
- [ ] **Coups francs** — faute → coup franc (tir direct si zone dangereuse, sinon phase de jeu classique)
- [ ] **Fatigue progressive** — accélération après 65-70 min, impact sur les stats en temps réel (pas linéaire)
- [ ] **Impact réel des paramètres tactiques** — largeur, tempo, style de passe doivent modifier les probabilités de manière visible et compréhensible par le joueur

### 1.3 IA crédible (niveau 1)

- [ ] **IA de transferts** — les clubs IA achètent, vendent, libèrent des joueurs chaque intersaison (budget limité, logique simple : remplacer les vieux, renforcer les postes faibles)
- [ ] **IA de composition** — sélection automatique intelligente basée sur fatigue, forme, compatibilité de poste (pas juste les 11 meilleurs OVR)
- [ ] **IA de tactique variée** — chaque club IA a une formation préférée et un style (pas tous en 4-4-2 balanced). 5-6 archétypes : bus parking, tiki-taka, contre-attaque, pressing haut, jeu direct, équilibré
- [ ] **Renouvellement intersaison** — les clubs IA font évoluer leur effectif entre les saisons (pas le même roster indéfiniment)

### 1.4 Progression & équilibrage

- [ ] **Régression des vétérans** — joueurs > 30 ans : décroissance passive sur stats physiques (-0.1 à -0.3 par match selon l'âge)
- [ ] **Courbe de forme** — fluctuation ±5% sur les performances, influencée par le temps de jeu, les résultats récents et la fatigue accumulée
- [ ] **Plafond de progression ajusté** — potential + 2 au lieu de +5, ou progression exponentiellement plus lente au-delà du potentiel

### 1.5 Engagement minimum

- [ ] **Objectifs saisonniers** — "maintien", "top 10", "promotion", "titre" selon la division. Visibles sur le dashboard, récompense financière à l'atteinte
- [ ] **Historique du club** — palmarès (titres, promotions, records), meilleur buteur de l'histoire, plus gros transfert
- [ ] **Résumé post-match enrichi** — stats du match, notes des joueurs, homme du match, progression visible

**Critère de sortie Phase 1 :** tu peux jouer une saison complète seul en trouvant ça intéressant. L'IA propose des défis variés, tu ressens la progression de ton club, tu as envie de lancer la saison suivante.

---

## Phase 2 — Multijoueur & identité (3-4 semaines)

> **Objectif : inviter tes potes et que le jeu ait une gueule.**

### 2.1 Multijoueur

- [ ] **Système de leagues** — création/rejoindre une league, invitations par lien/code
- [ ] **Slots hybrides** — chaque league mixe humains et IA, un humain peut "prendre le contrôle" d'un club IA existant (hérite de l'effectif, du classement, etc.)
- [ ] **Scheduling adapté** — les matchs humain vs humain ont lieu à l'heure fixe de la league. Notifications avant le match (email via Resend, et/ou push web)
- [ ] **Chat de league** — fil de discussion simple entre les managers de la même league (pas besoin d'un système complexe — un fil chronologique suffit)
- [ ] **Protection anti-triche basique** — validation serveur de toutes les actions (compo, transferts, tactiques), rate limiting, logs des transactions

### 2.2 Identité visuelle Regista

Le document d'identité visuelle est solide. Il faut l'appliquer systématiquement :

- [ ] **Design system en composants** — implémenter la palette (Nuit pelouse, Regista vert, Pelouse vive, Orange action, Jaune passe, Blanc chaud), la typo (Barlow Condensed + Nunito), les radius (min 10px), les règles (pas de blanc pur, pas d'angles droits, gradients sur fonds uniquement)
- [ ] **Refonte des écrans critiques** — Dashboard, Match live, Tactics, Squad — dans l'identité Regista
- [ ] **Responsive validé** — mobile-first sur dashboard, match live et tactics (les 3 écrans les plus utilisés)
- [ ] **Logo & branding** — intégrer le logo mark "R" partout, favicon, OG images pour le partage

### 2.3 Onboarding

- [ ] **Flow d'inscription simplifié** — nom du club, choix de maillot (3-4 presets), choix de league (créer ou rejoindre), attribution d'un effectif de départ
- [ ] **Tutoriel interactif** — 3-4 étapes maximum : composer l'équipe, lancer un match amical, faire un transfert, définir une tactique. Pas 5 missions textuelles — des actions guidées dans l'interface réelle
- [ ] **Génération de league en arrière-plan** — les 19 clubs IA sont générés par un job BullMQ pendant que le joueur fait le tuto, pas un loading de 60 secondes

**Critère de sortie Phase 2 :** tu invites 3-4 amis, vous jouez dans la même league, le jeu est visuellement cohérent, l'onboarding ne perd personne.

---

## Phase 3 — Profondeur de jeu (6-8 semaines)

> **Objectif : les features qui transforment un jeu correct en jeu captivant.**

### 3.1 Coupe nationale

- [ ] Élimination directe, 60 clubs (3 divisions mélangées)
- [ ] Matchs en milieu de semaine (entre les journées de championnat)
- [ ] Tirage au sort aléatoire, pas de têtes de série
- [ ] Prime de passage de tour + finale avec enjeu financier significatif

### 3.2 Centre de formation

- [ ] Structure avec niveaux (investissement progressif)
- [ ] Génération de 3-5 juniors par saison (potentiel lié au niveau du CDF)
- [ ] Progression des juniors via matchs simulés (pas gérés manuellement, juste un % de progression qui monte)
- [ ] Promotion en équipe première quand le junior atteint 100%
- [ ] Alternative : scouting simplifié (choisir un pays → recevoir un profil de junior après X jours)

### 3.3 Économie enrichie

- [ ] **Sponsors** — contrat maillot + contrat stade, valeur liée à la division et au classement. Renouvellement chaque saison avec offres à accepter/refuser
- [ ] **Stade évolutif** — capacité → revenus billetterie. Niveaux d'amélioration (tribunes, pelouse, VIP, éclairage) avec coûts croissants
- [ ] **Système de prêt** — prêt avec/sans option d'achat, salaire partagé ou non
- [ ] **Salaires négociables** — le joueur virtuel demande un salaire qui varie selon la division, le classement du club et son propre OVR. Possibilité de négocier (±15%)
- [ ] **IA qui achète aux humains** — les clubs IA peuvent faire des offres sur les joueurs listés par des humains. Crée un vrai marché bidirectionnel

### 3.4 Match engine v2

- [ ] **Hors-jeu** — probabilité liée à la hauteur de la ligne défensive adverse
- [ ] **Météo** — pluie (passes moins précises), chaleur (fatigue ×1.3), vent (tirs longue distance affectés). Cosmétique + impact gameplay léger
- [ ] **Forme individuelle** — un joueur en série de buts est boosté, un joueur qui enchaîne les défaites est en méforme. Visible sur la fiche joueur
- [ ] **Blessures longue durée** — faible probabilité mais impact fort (ligaments = 10-20 matchs). Force la gestion de la profondeur d'effectif

### 3.5 Immersion & rétention

- [ ] **Fil d'actualité** — "Le FC Porto recrute X pour 12M", "Derby tendu entre A et B", "C promu en Div1 pour la première fois". Généré automatiquement à partir des événements réels de la league
- [ ] **Classement des buteurs / passeurs** — par saison et historique
- [ ] **Records de league** — plus grosse victoire, série d'invincibilité, meilleur buteur all-time
- [ ] **Notifications intelligentes** — "Ton match commence dans 30 min", "Offre reçue pour ton joueur X", "Ton rival a perdu, tu peux prendre la tête du classement ce soir"

**Critère de sortie Phase 3 :** le jeu a assez de profondeur pour que les joueurs discutent stratégie entre eux, qu'ils aient des opinions sur la meilleure approche, et qu'une saison complète réserve des surprises.

---

## Phase 4 — Polish & lancement public (4-6 semaines)

> **Objectif : le jeu est prêt pour des inconnus.**

### 4.1 Infra & fiabilité

- [ ] Déploiement production (VPS ou PaaS type Railway/Render)
- [ ] Monitoring basique (logs structurés, alertes sur les erreurs critiques du match engine et des workers)
- [ ] Backup automatique PostgreSQL quotidien
- [ ] Rate limiting, protection contre les abus de marché
- [ ] RGPD : suppression de compte, export de données

### 4.2 Acquisition & communauté

- [ ] Landing page avec le positionnement Regista ("Le beau jeu, entre tes mains")
- [ ] Discord communautaire (remplace un forum custom dans un premier temps)
- [ ] Partage social — résultats de match, classement, transferts marquants partageables en 1 clic (image OG générée)
- [ ] SEO basique — pages publiques pour les classements, les résultats, les profils de club

### 4.3 Cosmétiques (première brique monétisation)

- [ ] Éditeur de maillot (couleurs, motifs, écusson)
- [ ] Thèmes de stade (pelouse, ambiance sonore, bannières)
- [ ] Achat via Stripe (micro-transactions 1-5€)

---

## Ce que cette roadmap NE contient PAS (et pourquoi)

| Fonctionnalité | Pourquoi c'est reporté |
|---|---|
| Équipes nationales / sélections | Complexité énorme pour peu de valeur au départ. Phase 5+ minimum |
| Paris in-game (VF Bets) | Juridiquement risqué, pas prioritaire pour le fun |
| Futsal / mini-tournois | Nice-to-have mais n'ajoute pas au core loop. Après le lancement |
| Éditeur de joueur (nom, nationalité) | Cosmétique secondaire. Après la monétisation de base |
| Chat vocal / vidéo | Discord existe, pas besoin de le recréer |
| App mobile native | Le web responsive suffit largement pour la phase actuelle |
| IA avancée (personnalité coach, rivalités) | Phase 3.5+ si le jeu prend. L'IA de base de Phase 1 suffit pour valider |

---

## Indicateurs de succès par phase

| Phase | Tu sais que c'est OK quand... |
|---|---|
| 0 — Sauvetage | Tu joues un match complet sans crash, les tests passent |
| 1 — Core loop | Tu joues 3 saisons seul sans t'ennuyer, l'IA te surprend parfois |
| 2 — Multi | 4-5 amis jouent pendant 2+ semaines sans abandonner |
| 3 — Profondeur | Les joueurs débattent de stratégie et de transferts entre eux |
| 4 — Lancement | 50+ joueurs actifs, taux de rétention J7 > 40% |

---

## Note sur le workflow Claude Code

Étant donné que le projet est entièrement piloté par IA, quelques recommandations pour éviter la dette technique qui s'accumule :

1. **Spec first, toujours** — chaque feature commence par une spec markdown validée par toi AVANT de coder. La spec doit contenir les règles métier ET les edge cases
2. **Tests avec la feature** — jamais de PR sans tests. Le match engine en particulier doit avoir une couverture quasi totale
3. **Review le code généré** — même si Claude Code écrit tout, tu dois comprendre chaque module critique (match engine, finances, transferts). Si tu ne comprends pas un calcul, c'est un red flag
4. **Branches par feature** — pas de commits directs sur main. Feature branch → tests → merge
5. **Limiter la taille des prompts** — une feature à la fois, pas "implémente le centre de formation, les sponsors et le système de prêt". La qualité du code généré chute avec la complexité du prompt