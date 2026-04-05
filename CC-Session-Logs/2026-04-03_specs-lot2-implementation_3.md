---
type: session-log
date: 2026-04-03
project: regista
tags: [session, specs, tactics, player-development, match-experience, dashboard, competition, design-system, recharts, dnd-kit, svg]
---

# Session : 2026-04-03 — Specs Lot 2 (SPEC-15 à 20) : rédaction + implémentation

## Quick Reference
**Sujets :** Audit UX/UI MVP, rédaction 6 specs Lot 2, implémentation complète SPEC-15 à 20 (terrain tactique 2D, radar charts, post-match summary, dashboard fix, top scorers, design system)
**Résultat :** Lot 2 complet — terrain tactique avec joueurs positionnés, presets, radar charts Recharts, post-match MOTM, dashboard avec données réelles, design system avec identité football

## Ce qui a été fait

### Audit UX/UI
- Audit complet de chaque page (landing, auth, dashboard, squad, tactics, matches, competition, transfers, training, finances, stats)
- Score identité visuelle : 2/10, UX : 3/10, game feel : 1/10
- Identification des fonctionnalités spec promises mais non implémentées (~40-50% des specs)
- Proposition structurée en 4 axes : identité visuelle, UX, fonctionnalités manquantes, techniques

### Rédaction des specs Lot 2
- SPEC-15 : Design System (palette, typo, animations, mobile) — 4.9K
- SPEC-16 : Tactical System v2 (terrain 2D, presets, auto-lineup, analyse) — 20.5K
- SPEC-17 : Player Development v2 (radar, polyvalence, comparaison, contrat) — 14.8K
- SPEC-18 : Match Experience v2 (live immersif, post-match summary) — 8.8K
- SPEC-19 : Dashboard & UX v2 (fix bugs, actions dynamiques, tour) — 9.9K
- SPEC-20 : Competition & Stats v2 (scorers, historique, stats avancées) — 4.1K

### SPEC-16 : Tactical System v2
- Table `tactical_presets` (18 colonnes) + migration 0010
- Column `auto_adjustment` sur clubs
- TacticsController enrichi : 12 endpoints (CRUD presets, auto-lineup, composition, analyse pré-match, auto-adjustment)
- TacticalPresetsService : 3 presets par défaut à la création du club
- Calcul de cohésion (formule pondérée : compatibilité 40%, fraîcheur 30%, diversité banc 15%, warnings 15%)
- FORMATION_COORDINATES : coordonnées x,y pour 8 formations (terrain SVG)
- FootballPitch composant SVG (terrain avec lignes, joueurs positionnés, badges compatibilité/fatigue/capitaine)
- BenchDisplay (7 slots), CoherenceBar (barre 0-100%)
- Page /tactics refonte : terrain + banc à gauche, paramètres à droite, presets bar, auto-lineup, save preset dialog

### SPEC-17 : Player Development v2
- Table `player_overall_history` + migration 0011
- 4 nouveaux endpoints : history, compare, extend-contract, valuation
- Recharts installé + PlayerRadarChart (4 axes field, 3 axes GK)
- Fiche joueur refonte : hero avec OVR cercle couleur club, radar chart, condition, contrat, progression LineChart, performances récentes, stats détaillées, dialog renouvellement contrat
- Page comparaison side-by-side (/squad/compare)

### SPEC-18 : Match Experience v2
- 2 endpoints : summary (MOTM, highlights, ratings, assistant comment), player-stats
- Fonction generateComment (template-based selon résultat, écart, joueur clé)
- EventTimeline refonte (bordures colorées par type, pastilles couleur équipe)
- PostMatchSummary composant (bannière résultat, carte MOTM dorée, key moments, player ratings, stats, commentaire assistant)
- Page match refonte : score header 5xl, tabs events/stats/tactics, auto-affichage post-match summary

### SPEC-19 : Dashboard UX v2
- Fix recentResults (requête 3 derniers matchs terminés avec adversaires)
- Fix moraleTrend (calculé dynamiquement vs morale initial)
- Quick actions dynamiques (6 types : balance, fatigue, contrats expirant, offres reçues, winning streak)
- opponentForm dans nextMatch
- seasonProgress (barre de progression saison)
- Dashboard header refonte (progress bar, morale avec tendance ↗/→/↘)
- Next Match widget (countdown, opponent form, bouton prepare)
- Quick actions colorées par priorité avec liens
- DashboardData type unifié (shared package)

### SPEC-20 : Competition & Stats v2
- 4 endpoints : scorers, position-history, seasons, club stats
- Page competition 3 onglets : Standings, Top Scorers, Season History
- Page stats refonte : W-D-L, clean sheets, biggest win/loss, top players (⚽🅰️⭐)

### SPEC-15 : Design System
- Palette refonte : fond green-tinted (155° hue), borders vertes, sidebar darker
- Animations CSS : card-hover, fade-in, slide-up, pulse-live, score-flash, stat-bar-fill, text-gradient, glass
- FootballLoader SVG (ballon avec pentagon + spin)
- Skeleton components (SkeletonCard, SkeletonPlayerRow, SkeletonTable)
- Dashboard loading/error refonte
- Landing page avec gradient overlay, text-gradient, card-hover, animations d'entrée
- Scrollbar custom, focus rings, smooth scroll

## Décisions prises
- Recharts pour les charts : parce que React-natif, léger, bon pour radar + line charts
- @dnd-kit pour drag & drop : parce que léger, React-friendly, touch support (installé, pas encore fully wired)
- SVG pour le terrain : parce que accessibility, CSS styling, événements DOM natifs
- Palette 155° hue : parce que donne une teinte verte subtile évoquant le terrain de football
- DashboardData type unifié dans shared package : parce que élimine la duplication et les désynchronisations
- Post-match summary auto-affiché : parce que feedback immédiat après un match
- Specs rédigées avant implémentation : parce que approche specs-driven du projet

## Problèmes résolus
- **Problème** : recentResults retournait toujours [] sur le dashboard
- **Cause** : Le controller ne requêtait jamais les matchs terminés
- **Solution** : Requête des 3 derniers matchs finished avec enrichissement noms adversaires

- **Problème** : moraleTrend hardcodé "stable"
- **Cause** : Pas de calcul dynamique
- **Solution** : Comparaison avec morale initial (60), threshold ±5

- **Problème** : Quick actions hardcodées et non pertinentes
- **Cause** : Pas de checks dynamiques des données réelles
- **Solution** : 6 types de checks : balance, fatigue, contrats, offres, winning streak

## Points d'attention
- Le drag & drop @dnd-kit est installé mais le wiring complet (drag depuis banc vers terrain) n'est pas encore fait — actuellement le terrain est en lecture seule avec clic
- Le position history endpoint retourne seulement la position actuelle (pas d'historique, besoin d'une table de tracking par matchday)
- Les coordonnées de formation sont des approximations visuelles — à ajuster avec des tests en navigateur

## Tâches en suspens
- [ ] Tester le flow complet E2E en local
- [ ] Wiring complet drag & drop @dnd-kit sur le terrain tactique
- [ ] Table position_history pour le graphe d'évolution de position
- [ ] Production email (Resend/SMTP)
- [ ] Guided tour onboarding (tooltips interactifs)
- [ ] Seed de données de jeu complètes

## Fichiers impactés

### Specs (docs/specs/)
- `15-design-system.md` — Créé (palette, typo, animations, mobile)
- `16-tactical-system-v2.md` — Créé (terrain, presets, auto-lineup, analyse)
- `17-player-development-v2.md` — Créé (radar, polyvalence, comparaison, contrat)
- `18-match-experience-v2.md` — Créé (match live, post-match summary)
- `19-dashboard-ux-v2.md` — Créé (dashboard refonte, fix bugs, guided tour)
- `20-competition-stats-v2.md` — Créé (scorers, historique, stats avancées)

### Database
- `packages/db/src/schema/tactics.ts` — Créé (table tactical_presets)
- `packages/db/src/schema/player_history.ts` — Créé (table player_overall_history)
- `packages/db/src/schema/clubs.ts` — Ajout auto_adjustment
- `packages/db/drizzle/0010_early_green_goblin.sql` — Migration tactical_presets
- `packages/db/drizzle/0011_legal_polaris.sql` — Migration player_overall_history

### Shared
- `packages/shared/src/constants.ts` — Ajout FORMATION_COORDINATES (8 formations × 11 positions x,y)
- `packages/shared/src/types/dashboard.ts` — Ajout seasonProgress, opponent primaryColor

### Backend API
- `apps/api/app/tactics/tactics_controller.ts` — Réécriture complète (12 endpoints)
- `apps/api/app/tactics/presets_service.ts` — Créé (3 presets par défaut)
- `apps/api/app/squad/squad_controller.ts` — Ajout history, compare, extend-contract, valuation
- `apps/api/app/match/match_detail_controller.ts` — Ajout summary, playerStatsDetail, generateComment
- `apps/api/app/dashboard/dashboard_controller.ts` — Réécriture (fix bugs, enrichissements)
- `apps/api/app/competition/competition_controller.ts` — Ajout scorers, positionHistory, seasonHistory
- `apps/api/app/stats/stats_controller.ts` — Créé (club stats)
- `apps/api/app/clubs/club_controller.ts` — Intégration TacticalPresetsService
- `apps/api/start/routes.ts` — Ajout routes tactics presets, squad enrichi, match summary, competition enrichi, stats

### Frontend
- `apps/web/src/styles/app.css` — Réécriture complète (palette, animations, scrollbar, typo)
- `apps/web/src/components/tactics/football-pitch.tsx` — Créé (terrain SVG avec joueurs)
- `apps/web/src/components/tactics/bench-display.tsx` — Créé (banc 7 slots)
- `apps/web/src/components/tactics/coherence-bar.tsx` — Créé (barre cohésion)
- `apps/web/src/components/squad/player-radar-chart.tsx` — Créé (Recharts radar 4 axes)
- `apps/web/src/components/match/event-timeline.tsx` — Refonte (bordures colorées)
- `apps/web/src/components/match/post-match-summary.tsx` — Créé (MOTM, highlights, ratings, comment)
- `apps/web/src/components/dashboard/dashboard-header.tsx` — Refonte (season progress, morale trend)
- `apps/web/src/components/dashboard/dashboard-match-actions.tsx` — Refonte (countdown, quick actions colorées)
- `apps/web/src/components/dashboard/dashboard-results-standings.tsx` — Refonte (form indicator, liens)
- `apps/web/src/components/dashboard/dashboard-loading.tsx` — Refonte (FootballLoader + skeletons)
- `apps/web/src/components/dashboard/dashboard-error-state.tsx` — Refonte (illustration, retry)
- `apps/web/src/components/ui/football-loader.tsx` — Créé (SVG ballon animé)
- `apps/web/src/components/ui/skeleton.tsx` — Créé (SkeletonCard, SkeletonPlayerRow, SkeletonTable)
- `apps/web/src/routes/tactics.tsx` — Réécriture complète (terrain + presets + paramètres)
- `apps/web/src/routes/squad.$playerId.tsx` — Réécriture complète (radar, progression, performances, contract renewal)
- `apps/web/src/routes/squad.compare.tsx` — Créé (comparaison side-by-side)
- `apps/web/src/routes/matches.$matchId.tsx` — Réécriture complète (tabs, post-match summary auto)
- `apps/web/src/routes/competition.tsx` — Refonte (3 onglets : standings, scorers, history)
- `apps/web/src/routes/stats.tsx` — Refonte (données réelles, top players, clean sheets)
- `apps/web/src/routes/index.tsx` — Refonte (gradient, text-gradient, animations)
- `apps/web/src/lib/tactics.ts` — Enrichi (presets, auto-lineup, composition, analysis)
- `apps/web/src/lib/squad.ts` — Enrichi (history, compare, extend-contract, valuation)
- `apps/web/src/lib/match-detail.ts` — Enrichi (summary, player stats)
- `apps/web/src/lib/competition.ts` — Enrichi (scorers, season history, club stats)
- `apps/web/src/lib/dashboard.ts` — Unifié (type du shared package)

---

## Log détaillé

### Audit et conception
Session démarrée avec un audit UX/UI complet du MVP. Deux agents Explore lancés en parallèle : un pour l'audit frontend (chaque page, composants, CSS), l'autre pour comparer specs vs implémentation. Résultat brutal : le MVP ressemble à un panneau d'admin CRUD, pas à un jeu. Score identité visuelle 2/10.

Propositions structurées en 4 axes (A-D). L'utilisateur a choisi l'approche specs-driven : rédiger les specs d'abord. 6 specs rédigées (SPEC-15 à 20), totalisant ~63K de documentation. Ordre de rédaction : Tactiques → Joueurs → Design → Match → Dashboard → Competition.

### Implémentation SPEC-16 (Tactiques)
La plus grosse spec. 3 steps : backend (table tactical_presets + 12 endpoints + presets service), shared (FORMATION_COORDINATES), frontend (terrain SVG + composants + page refonte).

Le terrain SVG utilise des coordonnées relatives (x,y en %) avec lignes blanches semi-transparentes sur fond dégradé vert. Les joueurs sont des cercles positionnés avec OVR, nom, fatigue, et badge compatibilité. Installation de @dnd-kit (core + utilities).

Erreur TypeScript sur la diversité du banc (Set typé strictement) → résolu en utilisant un array avec `.includes()`.

### Implémentation SPEC-17 (Player Development)
Table player_overall_history + 4 endpoints. Installation de Recharts. Radar chart avec 4 axes (Physical/Technical/Mental/Defense). Line chart pour la progression overall. Page joueur refonte complète avec hero coloré, condition, contrat, dialog de renouvellement.

Page comparaison avec stat bars face-à-face (vert pour le meilleur).

### Implémentation SPEC-18 (Match Experience)
Endpoint summary avec generateComment (template-based). PostMatchSummary composant avec carte MOTM dorée, key moments, player ratings, stats comparées, commentaire assistant. Page match avec tabs et auto-affichage du summary quand le match est terminé.

### Implémentation SPEC-19 (Dashboard UX)
Réécriture du dashboard controller pour corriger les 3 bugs majeurs : recentResults vide (requête des matchs finished), moraleTrend hardcodé (calcul dynamique), quick actions statiques (6 checks dynamiques). Ajout seasonProgress et opponentForm.

Frontend : dashboard header avec progress bar saison et morale trend, next match avec countdown, quick actions colorées par priorité, results avec form indicator. Type DashboardData unifié depuis le shared package.

### Implémentation SPEC-20 (Competition & Stats)
4 endpoints agrégés (scorers via match_player_stats, season history via season_results, club stats). Page competition avec 3 onglets. Page stats avec données réelles (clean sheets, biggest win/loss, top players).

### Implémentation SPEC-15 (Design System)
Refonte CSS : palette green-tinted (155° hue oklch), animations (card-hover, fade-in, slide-up, pulse-live, score-flash), utilitaires (text-gradient, glass, font-display, font-stat). FootballLoader SVG remplace les spinners. Skeleton components. Landing page avec gradient et animations d'entrée.

Build final clean : 4/4 tasks successful, 0 erreur TS.
