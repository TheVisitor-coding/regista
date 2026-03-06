---
type: session-log
date: 2026-03-03
project: regista
tags: [session, specs, moderation, cosmetics, nestjs, postgresql, bullmq, setup, obsidian]
---

# Session : 2026-03-03 — Rédaction SPEC-13/14 et initialisation mémoire projet

## Quick Reference
**Sujets :** Modération & Fair-Play (SPEC-13), Cosmétiques & Boutique (SPEC-14), setup mémoire projet (/setup + /mem + /save)
**Résultat :** Corpus de specs MVP complet (SPEC-01 à SPEC-13 = Lot 1, SPEC-14 = Lot 2) + infrastructure mémoire Claude Code initialisée

## Ce qui a été fait

- Rédigé SPEC-13 (Modération & Fair-Play, Lot 1 MVP) : validation des noms, système de signalement, journal d'activités suspectes, actions admin, interface d'administration basique
- Rédigé SPEC-14 (Cosmétiques & Boutique, Lot 2) : 5 catégories de cosmétiques, boutique avec rotation hebdo, modèle économique G$ uniquement au lancement, accomplissements déblocables
- Lancé `/setup` : création de `.claude/CLAUDE.md`, `CC-Session-Logs/`, dossier miroir vault, hub `regista.md` dans le vault, ajout dans `~/Personal_Vault/CLAUDE.md`

## Décisions prises

- **SPEC-13 — Aucun blocage automatique de compte** : toutes les alertes d'activité suspecte remontent à un admin humain. Évite les faux positifs et frustrations injustifiées. Un scoring ML viendrait en post-MVP.
- **SPEC-13 — Validation noms = unicité exacte + blacklist** : pas de similarité Levenshtein au MVP. Trop coûteux pour peu de bénéfice au lancement. La blacklist est seedée avec ~500 termes (FR/EN/ES/DE) et stockée en cache Redis.
- **SPEC-13 — Refus immédiat si nom blacklisté** : pas de nom générique temporaire (ex: "Club XXX123"). L'utilisateur doit simplement en choisir un autre. Simplifie le flux, évite la validation manuelle des noms douteux.
- **SPEC-14 — G$ uniquement au Lot 2** : la table `premium_transactions` est créée (fondation technique) mais reste vide jusqu'à l'intégration d'un provider de paiement (Stripe = Lot 3). Aucun item n'est exclusif à la monnaie premium.
- **SPEC-14 — Items exclusifs via accomplissements uniquement** : les items de rareté "Exclusif" ne sont pas achetables, uniquement débloqués par des accomplissements (champion, invaincu, centenaire, etc.). Garantit l'anti-P2W.

## Problèmes résolus

- **Problème** : Fichier `regista.md` créé au mauvais chemin (`/Users/mat/mat/Personal_Vault/...`) lors de l'utilisation du tool Write avec `~`
- **Cause** : Le tool Write n'expande pas `~` correctement — il faut utiliser le chemin absolu `/Users/mat/Personal_Vault/`
- **Solution** : Suppression du répertoire parasite, recréation au bon chemin absolu

## Points d'attention

- `packages/shared/src/constants.ts` : vérifier que SECONDS_PER_SIMULATED_MINUTE=60, TACTICAL_CHANGE_COOLDOWN_MINUTES=5, MATCH_FREQUENCY_DAYS=3 (valeurs potentiellement incorrectes depuis l'init)
- Dans le tool Write, toujours utiliser `/Users/mat/` au lieu de `~/` pour les chemins vault

## Tâches en suspens

- [ ] Vérifier/corriger `packages/shared/src/constants.ts` (3 constantes)
- [ ] Définir l'ordre d'implémentation des specs (quel module en premier ?)
- [ ] Démarrer l'implémentation — phase 2

## Fichiers impactés

- `docs/specs/13-moderation.md` — Créé (SPEC-13 complète)
- `docs/specs/14-cosmetics.md` — Créé (SPEC-14 complète)
- `.claude/CLAUDE.md` — Créé (mémoire projet)
- `CC-Session-Logs/` — Créé (répertoire)
- `~/Personal_Vault/02 - Projects/regista/Session-Logs/` — Créé (miroir vault)
- `~/Personal_Vault/02 - Projects/regista/regista.md` — Créé (hub Dataview)
- `~/Personal_Vault/CLAUDE.md` — Mis à jour (regista ajouté dans "Projets en cours")

---

## Log détaillé

Cette session est la continuation directe d'une session précédente (contexte compressé) dans laquelle SPEC-01 à SPEC-12 avaient été rédigées. La session précédente avait établi :
- SPEC-12 (Progression) était la dernière complétée
- Les notes pour SPEC-13 (Modération) et SPEC-14 (Cosmétiques) avaient été soumises mais les specs pas encore rédigées

**SPEC-13 (Modération)** — Challenges appliqués :
Le système de score de suspicion automatique (complexe) a été remplacé par des règles déterministes simples avec 3 niveaux de sévérité (low/medium/high). Pas de blocage automatique — tout remonte à un admin. La similarité de noms (Levenshtein) a été écartée au profit d'une simple unicité exacte + blacklist Redis. La spec couvre : validation des noms (blacklist + regex + normalisation leet speak), signalement joueur (4 motifs, 3/24h max, 1 par cible), journal des activités suspectes (5 types d'événements), actions admin (warn, force_rename, suspend, ban, reset_club), interface admin basique intégrée dans l'app principale.

**SPEC-14 (Cosmétiques)** — Périmètre cadré en Lot 2 :
Spec post-MVP. 5 catégories (maillots, logos, stades, bannières, badges), 3 raretés (commun/rare/exclusif). Boutique avec rotation hebdomadaire de 4 items en vitrine. Paiement uniquement en G$ au Lot 2 — la table `premium_transactions` est créée techniquement mais vide. 7 accomplissements déblocables gratuitement (champion, invaincu, centenaire, formateur, etc.). Zéro P2W garanti : aucun cosmétique n'a d'impact gameplay.

**Setup mémoire** :
`/setup` lancé pour initialiser l'infrastructure de mémoire Claude Code. Erreur rencontrée sur le chemin du fichier vault (le tool Write n'expande pas `~`) — corrigée en utilisant le chemin absolu. Structure créée : `.claude/CLAUDE.md` (mémoire projet), `CC-Session-Logs/` (logs sessions), miroir vault avec hub Dataview.

**État final du corpus de specs** :
- Lot 1 MVP : SPEC-01 Auth, 02 Club/Dashboard, 03 Match, 04 Effectif, 05 Championnat, 06 Transferts, 07 IA Clubs, 08 Onboarding, 09 Entraînement, 10 Finances, 11 Tactiques, 12 Progression, 13 Modération
- Lot 2 : SPEC-14 Cosmétiques & Boutique
