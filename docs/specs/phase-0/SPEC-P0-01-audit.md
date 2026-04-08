# SPEC-P0-01 — Audit de l'existant

> **Phase :** 0 — Sauvetage
> **Priorité :** P0 (BLOQUANT — rien ne démarre sans ça)
> **Estimation :** 2-3 heures
> **Dépendances :** aucune

## Contexte

Le prototype a été construit en mode spec-driven par IA. Le résultat est un ensemble de pages et de mécaniques dont le fonctionnement réel n'a pas été vérifié systématiquement. Avant de corriger quoi que ce soit, il faut un inventaire honnête de ce qui marche, ce qui est cassé, et ce qui est faux.

## Objectif

Produire un fichier `docs/audit/AUDIT-REPORT.md` qui liste exhaustivement l'état de chaque module du jeu.

## Procédure d'audit

Pour CHAQUE module ci-dessous, vérifier en testant réellement (pas en lisant le code) :

### Modules à auditer

1. **Auth & Onboarding**
   - Inscription → création de compte → ça marche ?
   - Création de club → attribution d'un effectif → ça marche ?
   - Création/rejoindre une league → génération des clubs IA → ça marche ?

2. **Squad (Composition d'équipe)**
   - Affichage de la liste des joueurs → données correctes ?
   - Sélection des titulaires / remplaçants → le drag & drop fonctionne ?
   - Sauvegarde de la composition → persistée en base ?
   - Changement de capitaine → fonctionne ?

3. **Tactiques**
   - Choix de formation → affichage correct sur le terrain ?
   - Modification des paramètres (mentalité, pressing, etc.) → sauvegardés ?
   - Presets → créer/modifier/supprimer → fonctionne ?
   - Stockage → Redis ? PostgreSQL ? Les deux ?

4. **Match Engine**
   - Lancement d'un match → le job BullMQ se déclenche ?
   - Simulation → les événements sont générés ?
   - Socket.io → les événements arrivent au client en temps réel ?
   - Post-match → score final en base, classement mis à jour ?
   - Fatigue → appliquée aux joueurs après le match ?
   - Blessures → générées et enregistrées ?

5. **Transferts**
   - Affichage du marché → joueurs disponibles ?
   - Achat direct → joueur transféré, argent débité ?
   - Vente / listing → joueur sur le marché ?
   - Offres → envoi/réception/acceptation/refus ?
   - Agents libres → disponibles, recrutables ?

6. **Finances**
   - Affichage du budget → montant correct ?
   - Billetterie post-match → revenus calculés et crédités ?
   - Salaires → déduits au bon moment ?
   - Historique des transactions → affiché ?

7. **Entraînement**
   - Choix de focus → sauvegardé ?
   - Progression post-cycle → stats modifiées en base ?

8. **Compétition / Calendrier**
   - Calendrier → généré correctement (38 journées, alternance domicile/extérieur) ?
   - Classement → calculé après chaque match ?
   - Journée suivante → avancement automatique ?

9. **Infrastructure technique**
   - Tests Japa → bootstrap fonctionne ? `pnpm test` tourne ?
   - Seed → script existant ? Fonctionnel ?
   - Dev local → `pnpm dev` lance tout ?
   - Migrations Drizzle → à jour ? Pas de conflit ?

## Format du rapport

Pour chaque point audité :

```markdown
### [Module] — [Sous-feature]
- **Statut :** ✅ OK | ⚠️ Partiel | ❌ Cassé | 🔲 Fake/Hardcodé
- **Détail :** Description du problème ou du comportement observé
- **Priorité fix :** P0 (bloquant core loop) | P1 (important) | P2 (peut attendre)
```

## Critères d'acceptation

- [ ] Chaque module a été testé en conditions réelles (pas juste une lecture du code)
- [ ] Le rapport `AUDIT-REPORT.md` est généré avec le statut de chaque point
- [ ] Les items P0 sont identifiés et priorisés pour SPEC-P0-02 à P0-05
- [ ] Le rapport est honnête — si c'est cassé, c'est marqué cassé

## Hors scope

- Corriger les bugs (c'est le rôle des specs suivantes)
- Réécrire du code
- Ajouter des features