# SPEC-13 : Modération & Fair-Play

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-01 (Auth), SPEC-02 (Club)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03

---

## 1. Objectif

Assurer un **environnement sain, compétitif et respectueux** en prévenant les abus, la triche et les comportements toxiques. La modération est **discrète, automatisée au maximum** et scalable dès les premières centaines de joueurs.

**Philosophie** : la modération ne doit pas être visible ni intrusive pour le joueur honnête. Le système intercepte les cas évidents automatiquement et remonte les cas ambigus à un admin humain.

---

## 2. Validation des noms

### 2.1 Périmètre

La validation s'applique à :
- **Noms de club** (création + renommage)
- **Noms de stade** (création + modification)
- **Pseudos utilisateur** (inscription)

### 2.2 Règles de validation

| Règle | Détail |
|---|---|
| Longueur | Club : 3-30 caractères, Pseudo : 3-20 caractères, Stade : 3-40 caractères |
| Caractères autorisés | Lettres (avec accents), chiffres, espaces, tirets, apostrophes |
| Blacklist | Liste de termes interdits (insultes, racisme, marques, termes sexuels) — vérification par substring, case-insensitive |
| Unicité | Noms de club : **unicité exacte** (case-insensitive, trim, normalisation des espaces multiples). Pseudos : unicité exacte. |
| Regex patterns | Blocage des patterns type `xxx`, `420`, `nazi`, etc. via expressions régulières configurables |

### 2.3 Flux de validation

```
Nom soumis
  │
  ├── Passe tous les filtres → ✅ Accepté immédiatement
  │
  └── Bloqué par un filtre → ❌ Refusé avec message générique
       "Ce nom n'est pas disponible. Veuillez en choisir un autre."
```

**Pas de nom temporaire générique** au MVP — le nom est simplement refusé et l'utilisateur doit en choisir un autre. Cela évite la complexité d'un flux de validation manuelle pour les noms.

### 2.4 Blacklist

- Stockée en base de données (table `name_blacklist`)
- Chargée en cache Redis au démarrage et rafraîchie toutes les heures
- Modifiable par un admin via l'interface d'administration
- Fournie avec une **seed initiale** de ~500 termes (FR + EN + ES + DE)
- Supporte les variantes simples : `a` → `@`, `e` → `3`, `i` → `1`, `o` → `0` (normalisation avant vérification)

---

## 3. Système de signalement

### 3.1 Qui peut signaler

Tout joueur authentifié peut signaler un **club** ou un **utilisateur**.

### 3.2 Motifs de signalement

| Motif | Code |
|---|---|
| Nom offensant | `offensive_name` |
| Suspicion de triche | `cheating` |
| Comportement toxique | `toxic_behavior` |
| Autre | `other` |

### 3.3 Flux de signalement

```
Joueur clique "Signaler" sur un profil/club
  │
  ├── Choisit un motif (obligatoire)
  ├── Ajoute un commentaire (optionnel, max 500 caractères)
  │
  └── Signalement créé avec statut "pending"
       → Visible dans le dashboard admin
```

### 3.4 Limitations anti-abus

| Règle | Valeur |
|---|---|
| Signalements max par joueur par 24h | 3 |
| Signalements max sur la même cible par joueur | 1 (pas de doublon) |
| Signalements résolus nécessaires avant action auto | Aucune action auto — tout est manuel au MVP |

### 3.5 Confidentialité

- Le joueur signalé **n'est jamais informé** qu'il a été signalé
- L'identité du signaleur **n'est jamais révélée** au signalé
- L'admin voit l'identité du signaleur pour tracer les abus de signalement

---

## 4. Journal d'activités suspectes

### 4.1 Événements loggés

Le système enregistre automatiquement les événements suivants :

| Événement | Condition de détection |
|---|---|
| Multi-comptes potentiel | Même adresse IP créant 2+ comptes en 24h |
| Transfert suspect | Transfert entre deux clubs partageant la même IP (dans les 30 derniers jours) |
| Compte neuf performant | Compte < 7 jours avec > 5 victoires consécutives |
| Abandon de match répété | ≥ 3 matchs abandonnés (déconnexion) en 24h |
| Changement d'IP suspect | ≥ 5 IPs différentes en 1h |

### 4.2 Niveau de sévérité

| Niveau | Effet |
|---|---|
| `low` | Log uniquement, visible dans le journal admin |
| `medium` | Log + notification admin (badge sur le dashboard) |
| `high` | Log + notification admin + compte marqué pour revue prioritaire |

### 4.3 Pas de blocage automatique au MVP

Toutes les alertes remontent à un admin humain. **Aucun blocage automatique** n'est effectué au MVP pour éviter les faux positifs. L'admin décide de l'action à prendre.

---

## 5. Actions administratives

### 5.1 Actions disponibles

| Action | Effet | Réversible |
|---|---|---|
| **Avertissement** (`warn`) | Notification envoyée au joueur | — |
| **Renommage forcé** (`force_rename`) | Le nom du club/pseudo est remplacé. Le joueur doit en choisir un nouveau à sa prochaine connexion | Oui (le joueur choisit un nouveau nom) |
| **Suspension** (`suspend`) | Compte inaccessible pour X jours (1-30) | Oui (expiration automatique ou levée manuelle) |
| **Bannissement** (`ban`) | Compte définitivement inaccessible | Oui (débannissement possible par admin) |
| **Reset club** (`reset_club`) | Le club est supprimé et recréé avec les paramètres par défaut (effectif régénéré, solde initial, stats remises à zéro) | Non |

### 5.2 Flux de renommage forcé

```
Admin force le renommage
  │
  └── Au prochain login du joueur :
       ├── Modal bloquant : "Votre nom de club a été jugé inapproprié."
       ├── Champ pour saisir un nouveau nom (mêmes règles de validation §2)
       └── Le joueur ne peut pas accéder au jeu tant qu'il n'a pas renommé
```

### 5.3 Historique

Chaque action admin est enregistrée avec :
- L'admin qui a effectué l'action
- La cible (user ou club)
- Le type d'action
- La raison (texte libre, obligatoire)
- La date

---

## 6. Interface d'administration (MVP)

### 6.1 Accès

- Route `/admin/moderation` protégée par le rôle `admin` (SPEC-01)
- **Pas d'interface séparée** — intégrée dans l'app principale, visible uniquement par les admins

### 6.2 Vue principale

```
── MODÉRATION ──────────────────────────────────────

[Signalements (12)]  [Activité suspecte (3)]  [Blacklist]

── SIGNALEMENTS EN ATTENTE ─────────────────────────

#  Cible          Motif              Signaleur       Date         Actions
1  FC Raciste     Nom offensant      user_abc        il y a 2h    [Renommer] [Rejeter]
2  xXx_H4cker     Triche             user_def        il y a 5h    [Suspendre] [Rejeter]
3  Club Normal    Autre              user_ghi        il y a 1j    [Voir détail] [Rejeter]

── SIGNALEMENTS TRAITÉS (7 derniers jours) ─────────
...
```

### 6.3 Fiche utilisateur (vue admin)

```
── FICHE UTILISATEUR (admin) ───────────────────────

Pseudo : xXx_H4cker          Email : hacker@mail.com
Inscrit le : 2026-02-15       Dernière connexion : il y a 3h
Club : Hack FC                Division : 3
IP récentes : 192.168.1.1, 10.0.0.5

── SIGNALEMENTS REÇUS (2) ─────────────────────────
• Triche - "Score suspect, 10 victoires d'affilée" - par user_def
• Nom offensant - par user_xyz

── ACTIVITÉ SUSPECTE ──────────────────────────────
• [medium] Compte neuf performant - 7 victoires en 3 jours
• [low] 3 IPs différentes en 24h

── HISTORIQUE MODÉRATION ──────────────────────────
• 2026-02-20 - Avertissement par admin_01 : "Comportement suspect"

[Avertir] [Renommer club] [Suspendre ▾] [Bannir] [Reset club]
```

---

## 7. Modèle de données

### 7.1 Table `name_blacklist`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `term` | `varchar(50)` | Terme interdit (lowercase, normalisé) |
| `category` | `enum` | `insult`, `racism`, `sexual`, `brand`, `other` |
| `language` | `varchar(5)` | Code langue (`fr`, `en`, `es`, `de`, `*` pour universel) |
| `is_regex` | `boolean` | Si true, `term` est traité comme une expression régulière |
| `created_by` | `uuid` FK NULLABLE | Admin qui a ajouté le terme |
| `created_at` | `timestamp` | |

**Index** :
- `UNIQUE INDEX` sur `term`

### 7.2 Table `moderation_reports`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `reporter_id` | `uuid` FK | Joueur qui signale |
| `target_user_id` | `uuid` FK NULLABLE | Utilisateur ciblé |
| `target_club_id` | `uuid` FK NULLABLE | Club ciblé |
| `reason` | `enum` | `offensive_name`, `cheating`, `toxic_behavior`, `other` |
| `comment` | `varchar(500)` NULLABLE | Commentaire du signaleur |
| `status` | `enum` | `pending`, `reviewed`, `dismissed` |
| `reviewed_by` | `uuid` FK NULLABLE | Admin qui a traité |
| `reviewed_at` | `timestamp` NULLABLE | |
| `review_note` | `text` NULLABLE | Note interne de l'admin |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `status` (filtrage des signalements en attente)
- `INDEX` sur `target_user_id` + `created_at`
- `UNIQUE INDEX` sur `reporter_id` + `target_user_id` (empêche doublons)
- `UNIQUE INDEX` sur `reporter_id` + `target_club_id` (empêche doublons)

**Contrainte** : `target_user_id` ou `target_club_id` doit être renseigné (pas les deux à null).

### 7.3 Table `suspicious_activities`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | Utilisateur concerné |
| `event_type` | `enum` | `multi_account`, `suspicious_transfer`, `new_account_performing`, `match_abandon`, `ip_change` |
| `severity` | `enum` | `low`, `medium`, `high` |
| `details` | `jsonb` | Détail de l'événement (IPs, match IDs, etc.) |
| `is_reviewed` | `boolean` | Marqué comme traité par un admin (défaut: false) |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `user_id` + `created_at` DESC
- `INDEX` sur `severity` + `is_reviewed` (filtrage dashboard)

### 7.4 Table `moderation_actions`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `admin_id` | `uuid` FK | Admin qui a effectué l'action |
| `target_user_id` | `uuid` FK | Utilisateur ciblé |
| `action_type` | `enum` | `warn`, `force_rename`, `suspend`, `unsuspend`, `ban`, `unban`, `reset_club` |
| `reason` | `text` | Raison de l'action (obligatoire) |
| `metadata` | `jsonb` NULLABLE | Données complémentaires (ex: durée de suspension, ancien nom) |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `target_user_id` + `created_at` DESC (historique)

### 7.5 Modifications sur la table `users`

| Colonne ajoutée | Type | Description |
|---|---|---|
| `is_suspended` | `boolean` | Compte suspendu (défaut: false) |
| `suspended_until` | `timestamp` NULLABLE | Date de fin de suspension |
| `is_banned` | `boolean` | Compte banni définitivement (défaut: false) |
| `must_rename` | `boolean` | Doit renommer son club au prochain login (défaut: false) |

### 7.6 Modifications sur la table `clubs`

Aucune modification. Le renommage forcé est géré via le flag `must_rename` sur `users` et le flux de validation standard (§2).

---

## 8. API Endpoints

### 8.1 Endpoints joueur

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/names/validate` | Valide un nom (club, stade, pseudo) sans le créer | Oui |
| `POST` | `/reports` | Créer un signalement | Oui |

#### `POST /names/validate`

**Request** :
```json
{
  "name": "Mon Super Club",
  "type": "club"
}
```

**Response 200** :
```json
{
  "valid": true
}
```

**Response 200 (invalide)** :
```json
{
  "valid": false,
  "reason": "unavailable"
}
```

`reason` : `unavailable` | `blacklisted` | `invalid_characters` | `too_short` | `too_long` — le client affiche un message générique quel que soit le `reason` pour ne pas révéler les détails du filtre.

#### `POST /reports`

**Request** :
```json
{
  "targetUserId": "uuid",
  "reason": "offensive_name",
  "comment": "Nom clairement raciste"
}
```

**Response 201** :
```json
{
  "id": "uuid",
  "status": "pending"
}
```

**Erreurs** : `429` si limite de 3 signalements/24h atteinte, `409` si déjà signalé cette cible.

### 8.2 Endpoints admin

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/admin/reports` | Liste des signalements (filtres: status, reason) | Admin |
| `PATCH` | `/admin/reports/:id` | Traiter un signalement (reviewed/dismissed + note) | Admin |
| `GET` | `/admin/suspicious-activities` | Liste des activités suspectes (filtres: severity, is_reviewed) | Admin |
| `PATCH` | `/admin/suspicious-activities/:id` | Marquer comme traité | Admin |
| `GET` | `/admin/users/:id` | Fiche utilisateur complète (avec signalements, activité suspecte, historique modération) | Admin |
| `POST` | `/admin/users/:id/warn` | Envoyer un avertissement | Admin |
| `POST` | `/admin/users/:id/force-rename` | Forcer le renommage | Admin |
| `POST` | `/admin/users/:id/suspend` | Suspendre (body: `{ days: number, reason: string }`) | Admin |
| `POST` | `/admin/users/:id/unsuspend` | Lever la suspension | Admin |
| `POST` | `/admin/users/:id/ban` | Bannir définitivement | Admin |
| `POST` | `/admin/users/:id/unban` | Débannir | Admin |
| `POST` | `/admin/clubs/:id/reset` | Réinitialiser le club | Admin |
| `GET` | `/admin/blacklist` | Liste des termes blacklistés | Admin |
| `POST` | `/admin/blacklist` | Ajouter un terme | Admin |
| `DELETE` | `/admin/blacklist/:id` | Supprimer un terme | Admin |
| `GET` | `/admin/moderation/stats` | Stats rapides (signalements en attente, alertes, etc.) | Admin |

---

## 9. Middleware de modération

### 9.1 Vérification au login

À chaque authentification (SPEC-01), le middleware vérifie :

```
1. is_banned === true → 403 "Votre compte a été définitivement suspendu."
2. is_suspended === true ET suspended_until > now → 403 "Votre compte est suspendu jusqu'au {date}."
3. is_suspended === true ET suspended_until <= now → Lever automatiquement la suspension
4. must_rename === true → Réponse spéciale indiquant qu'un renommage est requis
```

### 9.2 Logging IP

Chaque requête authentifiée enregistre l'IP dans un cache Redis (set par user_id, TTL 30 jours). Utilisé pour la détection multi-comptes.

---

## 10. Jobs BullMQ

| Job | Déclencheur | Action |
|---|---|---|
| `SuspiciousActivityCheck` | Après chaque match | Vérifie les patterns d'abandon et de performances suspectes |
| `MultiAccountCheck` | À chaque inscription | Compare l'IP avec les comptes existants |
| `TransferSuspicionCheck` | Après chaque transfert | Vérifie si les deux clubs partagent des IPs récentes |
| `BlacklistCacheRefresh` | Cron toutes les heures | Rafraîchit le cache Redis de la blacklist |
| `AutoUnsuspend` | Cron toutes les heures | Lève les suspensions expirées |

---

## 11. User Stories

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| MOD-01 | Système | Valider les noms via blacklist + regex à la création | Bloquer les noms offensants automatiquement | Nom refusé immédiatement si match blacklist, message générique affiché |
| MOD-02 | Joueur | Choisir un autre nom si le mien est refusé | Comprendre que mon nom n'est pas accepté | Message clair, pas de détail sur la raison du refus |
| MOD-03 | Joueur | Signaler un club ou joueur avec un motif | Reporter un comportement inapproprié | Motif obligatoire, commentaire optionnel, confirmation visuelle |
| MOD-04 | Joueur | Ne pas pouvoir spammer les signalements | Éviter les abus | Max 3/24h, 1 par cible, erreur claire si limite atteinte |
| MOD-05 | Joueur | Ne pas savoir si j'ai été signalé | Éviter les tensions | Aucune notification, aucun indicateur visible |
| MOD-06 | Système | Logger les activités suspectes automatiquement | Détecter la triche sans intervention humaine | Événements loggés avec sévérité, visibles dans le dashboard admin |
| MOD-07 | Système | Détecter les multi-comptes par IP | Limiter la triche | Alerte créée si même IP pour 2+ comptes en 24h |
| MOD-08 | Système | Détecter les transferts suspects | Empêcher le transfert d'argent entre comptes liés | Alerte si transfert entre clubs partageant une IP |
| MOD-09 | Admin | Voir la liste des signalements en attente | Traiter les cas rapidement | Liste filtrée, actions rapides (renommer, rejeter, suspendre) |
| MOD-10 | Admin | Voir la fiche complète d'un utilisateur suspect | Avoir tout le contexte avant de décider | Signalements, activité suspecte, historique de modération, IPs |
| MOD-11 | Admin | Avertir un joueur | Donner un premier avertissement | Notification envoyée, action historisée |
| MOD-12 | Admin | Forcer le renommage d'un club | Corriger un nom inapproprié passé entre les mailles | Flag `must_rename`, modal au prochain login |
| MOD-13 | Admin | Suspendre un compte pour X jours | Sanctionner temporairement | Compte inaccessible, levée automatique à expiration |
| MOD-14 | Admin | Bannir un compte définitivement | Exclure un tricheur ou joueur toxique | Compte inaccessible, historisé, débannissement possible |
| MOD-15 | Admin | Réinitialiser un club | Sanctionner une triche avérée | Club régénéré, solde initial, effectif neuf |
| MOD-16 | Admin | Gérer la blacklist de noms | Ajouter/supprimer des termes interdits | CRUD sur la blacklist, cache Redis mis à jour |
| MOD-17 | Système | Lever automatiquement les suspensions expirées | Éviter l'intervention manuelle | Job cron horaire, vérification `suspended_until` |
| MOD-18 | Système | Bloquer les noms de club en doublon exact | Éviter la confusion entre clubs | Unicité case-insensitive vérifiée à la création et au renommage |

---

## 12. Stratégie de tests

| Catégorie | Tests |
|---|---|
| Unitaire | Validation de noms (blacklist, regex, unicité, normalisation leet speak) |
| Unitaire | Calcul de sévérité des activités suspectes |
| Intégration | Création de signalement (limites, doublons, motifs) |
| Intégration | Actions admin (suspend, ban, rename) + vérification middleware au login |
| Intégration | Détection multi-comptes et transferts suspects |
| E2E | Flux complet : signalement → traitement admin → action → effet sur le joueur |

---

## 13. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Nom temporaire générique si douteux | Non — le nom est simplement refusé, l'utilisateur doit en choisir un autre. Plus simple et évite le flux de validation manuelle. | 2.3 |
| Similarité de noms (Levenshtein) | Non au MVP. Unicité exacte (case-insensitive) + blacklist. L'algo de similarité est complexe et coûteux pour peu de bénéfice au lancement. | 2.2 |
| Score de suspicion automatique | Non au MVP. Sévérité simple (low/medium/high) basée sur des règles déterministes. Un scoring ML viendrait en post-MVP. | 4.2 |
| Blocage automatique de compte | Non au MVP. Toutes les alertes remontent à un admin humain. Évite les faux positifs et les frustrations injustifiées. | 4.3 |
| Vote modérateur | Post-MVP. Au MVP, un seul admin décide. | — |
| Discord bot pour notifications | Post-MVP. Les notifications sont dans le dashboard. | — |
| Modération communautaire | Non. Risque d'abus et de vengeance. La modération reste entre les mains des admins. | — |
| Tribunal public / karma visible | Non. Pas de justice publique, pas de score de karma. | — |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
