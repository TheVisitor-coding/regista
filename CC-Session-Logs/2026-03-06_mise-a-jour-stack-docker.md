---
type: session-log
date: 2026-03-06
project: regista
tags: [session, stack, docker, adonisjs, japa, node22]
---

# Session : 2026-03-06 — Mise à jour stack technique et configuration Docker

## Quick Reference
**Sujets :** Analyse stack technique, mise à jour documentation Claude (CLAUDE.md root + .claude/CLAUDE.md)
**Résultat :** Documentation synchronisée avec le code réel (Node 22, Japa, Docker modes, AdonisJS imports)

## Ce qui a été fait

- Analysé la stack technique réelle dans les fichiers de configuration (package.json, Dockerfiles, docker-compose*)
- Identifié les écarts entre la documentation existante et le code
- Mis à jour `CLAUDE.md` (racine) et `.claude/CLAUDE.md` avec les informations correctes

## Décisions prises / Corrections documentées

- **Node.js 22** : runtime cible confirmé (images Docker `node:22-alpine`)
- **pnpm 9.15.4** : version explicite dans package.json et Dockerfiles
- **Tests API = Japa** (pas Vitest) : @japa/runner + @japa/assert + @japa/api-client + @japa/plugin-adonisjs
- **AdonisJS imports** : subpath imports Node.js avec préfixe `#` (`#controllers/*`, `#services/*`, etc.) — l'alias `~/` ne s'applique pas à l'API
- **AdonisJS dev** : `node ace serve --hmr` via hot-hook + @swc/core
- **Docker — 3 modes distincts** :
  - `pnpm docker:infra:up` → postgres + redis seuls (pour dev local sans Docker API/web)
  - `pnpm docker:up` → stack complète en prod build
  - `pnpm docker:dev:up` → stack complète en dev mode (volumes nommés, hot-reload, `node:22-alpine` image directe)

## Fichiers impactés

- `CLAUDE.md` — Mis à jour (Node 22, pnpm version, Japa, Docker commands, AdonisJS import aliases)
- `.claude/CLAUDE.md` — Mis à jour (stack, décisions techniques, historique)
- `CC-Session-Logs/2026-03-06_mise-a-jour-stack-docker.md` — Créé

## Tâches en suspens

- [ ] Vérifier/corriger `packages/shared/src/constants.ts` (SECONDS_PER_SIMULATED_MINUTE, TACTICAL_CHANGE_COOLDOWN_MINUTES, MATCH_FREQUENCY_DAYS)
- [ ] Définir l'ordre d'implémentation des specs
- [ ] Démarrer l'implémentation — phase 2
