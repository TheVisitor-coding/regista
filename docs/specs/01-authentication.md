# SPEC-01 : Authentification & Inscription

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : Aucune (fondation)
> **Dépendants** : SPEC-02 (Club), SPEC-03 (Match), SPEC-04 (Effectif), SPEC-05 (Championnat), SPEC-06 (Transferts)
> **Dernière mise à jour** : 2026-03-02

---

## 1. Objectif

Fournir un système d'authentification **simple, sécurisé et fluide** permettant aux joueurs de créer un compte, se connecter et gérer leur identité. Le système doit être suffisamment robuste pour un jeu web persistant tout en restant léger pour le MVP.

**Philosophie** : l'inscription doit être rapide (< 2 minutes) et mener directement à la création de club (SPEC-02). Aucune friction inutile — le joueur veut jouer, pas remplir des formulaires.

---

## 2. Règles métier fondamentales

| Règle | Valeur |
|---|---|
| 1 compte = 1 club | Strict (relation one-to-one) |
| Méthode d'auth MVP | Email + mot de passe |
| Vérification email | Requise avant de jouer |
| Session | JWT (access token + refresh token) |
| Durée access token | 15 minutes |
| Durée refresh token | 30 jours |
| Tentatives de connexion | Max 5 par IP par 15 min (rate limiting) |
| Multi-compte | Interdit (1 email = 1 compte) |
| Âge minimum | 13 ans (conformité RGPD mineurs) |

---

## 3. Flux d'inscription

### 3.1 Formulaire d'inscription

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│              🏟️  REGISTA                                   │
│              Football Management Game                      │
│                                                            │
│  ─── Créer un compte ─────────────────────────────────    │
│                                                            │
│  Nom d'utilisateur                                         │
│  ┌──────────────────────────────────────────────────┐     │
│  │  matth1eu                                         │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  Email                                                     │
│  ┌──────────────────────────────────────────────────┐     │
│  │  mat@example.com                                  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  Mot de passe                                              │
│  ┌──────────────────────────────────────────────────┐     │
│  │  ••••••••••••                          [👁]       │     │
│  └──────────────────────────────────────────────────┘     │
│  ✓ Min. 8 caractères  ✓ 1 majuscule  ✓ 1 chiffre         │
│                                                            │
│  Confirmer le mot de passe                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │  ••••••••••••                                     │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ☐ J'accepte les CGU et la politique de confidentialité    │
│  ☐ J'ai 13 ans ou plus                                     │
│                                                            │
│  [ ─────── Créer mon compte ─────── ]                      │
│                                                            │
│  Déjà inscrit ? Se connecter                               │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Validation des champs

| Champ | Règles de validation |
|---|---|
| **Nom d'utilisateur** | 3-20 caractères, alphanumérique + underscore + tiret, unique, pas de caractères spéciaux, pas d'espaces, insensible à la casse pour l'unicité |
| **Email** | Format email valide (RFC 5322 simplifié), unique, insensible à la casse, normalisé (trim + lowercase) |
| **Mot de passe** | Min. 8 caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre. Max 128 caractères. |
| **Confirmation** | Doit correspondre exactement au mot de passe |
| **CGU** | Case cochée obligatoire |
| **Âge minimum** | Case cochée obligatoire |

**Validation en temps réel** : chaque champ est validé au blur (perte de focus). La disponibilité du nom d'utilisateur et de l'email est vérifiée via appels API debounced (300ms).

### 3.3 Processus post-inscription

```
Inscription
    │
    ▼
Compte créé (statut: PENDING_VERIFICATION)
    │
    ▼
Email de vérification envoyé
    │
    ▼
Page "Vérifiez votre email"
    │  (affiche message + bouton "Renvoyer l'email")
    │
    ├── Clic sur le lien de vérification ──► Compte activé (statut: ACTIVE)
    │                                             │
    │                                             ▼
    │                                    Redirect vers création de club (SPEC-02)
    │
    └── Le joueur se connecte sans avoir vérifié ──► Page "Vérifiez votre email" (bloquant)
```

### 3.4 Email de vérification

| Paramètre | Valeur |
|---|---|
| Expiration du lien | 24 heures |
| Renvoi possible | Oui, max 3 par heure (rate limited) |
| Token | UUID v4 signé (HMAC-SHA256) |
| Format | Lien cliquable : `{FRONTEND_URL}/verify-email?token={token}` |

**Contenu de l'email** :

```
Objet : Bienvenue sur Regista ! Confirmez votre email.

Bonjour {username},

Merci de vous être inscrit sur Regista.
Cliquez sur le lien ci-dessous pour activer votre compte :

[Activer mon compte]

Ce lien est valable 24 heures.

Si vous n'avez pas créé de compte, ignorez cet email.

— L'équipe Regista
```

---

## 4. Flux de connexion

### 4.1 Formulaire de connexion

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│              🏟️  REGISTA                                   │
│              Football Management Game                      │
│                                                            │
│  ─── Se connecter ────────────────────────────────────    │
│                                                            │
│  Email ou nom d'utilisateur                                │
│  ┌──────────────────────────────────────────────────┐     │
│  │                                                   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  Mot de passe                                              │
│  ┌──────────────────────────────────────────────────┐     │
│  │                                          [👁]     │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ☐ Se souvenir de moi                                      │
│                                                            │
│  [ ─────── Se connecter ─────── ]                          │
│                                                            │
│  Mot de passe oublié ?                                     │
│  Pas encore inscrit ? Créer un compte                      │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Logique de connexion

```
Tentative de connexion
    │
    ▼
Vérifier rate limit (5 tentatives / 15 min par IP)
    │
    ├── Rate limit atteint ──► Erreur 429 : "Trop de tentatives. Réessayez dans X minutes."
    │
    ▼
Trouver le user par email OU username (insensible à la casse)
    │
    ├── Non trouvé ──► Erreur 401 : "Identifiants incorrects."
    │                   (message générique pour ne pas révéler l'existence du compte)
    │
    ▼
Vérifier le mot de passe (bcrypt compare)
    │
    ├── Incorrect ──► Erreur 401 : "Identifiants incorrects."
    │                  + incrémenter compteur tentatives
    │
    ▼
Vérifier statut du compte
    │
    ├── PENDING_VERIFICATION ──► Redirect vers page "Vérifiez votre email"
    ├── BANNED ──► Erreur 403 : "Ce compte a été suspendu."
    │
    ▼
Compte ACTIVE → Générer tokens
    │
    ▼
Mettre à jour last_login_at
    │
    ▼
Redirect vers :
    ├── Dashboard (si club existe)
    └── Création de club (si pas de club → SPEC-02 §4.1)
```

### 4.3 Option "Se souvenir de moi"

| Option | Durée du refresh token | Comportement |
|---|---|---|
| Cochée | 30 jours | Le joueur reste connecté même après fermeture du navigateur |
| Non cochée | Session navigateur | Le refresh token expire à la fermeture du navigateur (cookie de session) |

---

## 5. Gestion des tokens JWT

### 5.1 Architecture

```
Client (navigateur)                           Serveur (API NestJS)
       │                                              │
       │─── POST /auth/login ──────────────────────►  │
       │                                              │── Valider credentials
       │  ◄── { accessToken, user } ──────────────────│── Générer access + refresh tokens
       │      + Set-Cookie: refresh_token (httpOnly)   │── Set refresh en cookie httpOnly
       │                                              │
       │─── GET /api/... ─────────────────────────►   │
       │    Authorization: Bearer {accessToken}        │── Valider access token
       │  ◄── 200 OK ─────────────────────────────────│
       │                                              │
       │─── GET /api/... (token expiré) ───────────►  │
       │  ◄── 401 Unauthorized ────────────────────── │
       │                                              │
       │─── POST /auth/refresh ────────────────────►  │
       │    Cookie: refresh_token                      │── Valider refresh token
       │  ◄── { accessToken } ─────────────────────── │── Nouveau access token
       │                                              │
```

### 5.2 Structure des tokens

**Access Token (JWT)** :
```json
{
  "sub": "user-uuid",
  "username": "matth1eu",
  "iat": 1709413200,
  "exp": 1709414100
}
```

**Refresh Token** :
- Stocké en base de données (table `refresh_tokens`)
- Cookie `httpOnly`, `secure`, `sameSite: strict`
- Hashé (SHA-256) en base pour éviter le vol en cas de leak DB
- Rotation : chaque utilisation génère un nouveau refresh token et invalide l'ancien

### 5.3 Refresh automatique (frontend)

Le frontend intercepte les réponses 401 et tente automatiquement un refresh :

```
Appel API retourne 401
    │
    ▼
Tenter POST /auth/refresh (cookie httpOnly)
    │
    ├── Succès → Nouveau accessToken → Rejouer la requête originale
    │
    └── Échec → Déconnecter l'utilisateur → Redirect /login
```

**Implémentation** : intercepteur Axios/fetch global avec queue de requêtes en attente pendant le refresh (éviter les appels parallèles de refresh).

---

## 6. Réinitialisation de mot de passe

### 6.1 Flux

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│  ─── Mot de passe oublié ─────────────────────────────    │
│                                                            │
│  Entrez votre email pour recevoir un lien de              │
│  réinitialisation.                                         │
│                                                            │
│  Email                                                     │
│  ┌──────────────────────────────────────────────────┐     │
│  │  mat@example.com                                  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  [ ─────── Envoyer le lien ─────── ]                       │
│                                                            │
│  Retour à la connexion                                     │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Processus

```
Demande de reset
    │
    ▼
Email existe ?
    │
    ├── Non ──► Afficher le même message de succès (anti-énumération)
    │
    ▼
Générer un token de reset (UUID v4, HMAC-SHA256)
    │
    ▼
Stocker le hash du token en base (table password_reset_tokens)
    │
    ▼
Envoyer email avec lien : {FRONTEND_URL}/reset-password?token={token}
    │
    ▼
Page confirmation : "Si un compte existe avec cet email, vous recevrez un lien."
```

### 6.3 Page de nouveau mot de passe

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│  ─── Nouveau mot de passe ────────────────────────────    │
│                                                            │
│  Nouveau mot de passe                                      │
│  ┌──────────────────────────────────────────────────┐     │
│  │                                          [👁]     │     │
│  └──────────────────────────────────────────────────┘     │
│  ✓ Min. 8 caractères  ✓ 1 majuscule  ✓ 1 chiffre         │
│                                                            │
│  Confirmer                                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │                                                   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  [ ─────── Réinitialiser ─────── ]                         │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

| Paramètre | Valeur |
|---|---|
| Expiration du token | 1 heure |
| Utilisation unique | Oui (invalidé après usage) |
| Renvoi possible | Max 3 par heure par email |
| Effet secondaire | Invalide toutes les sessions actives (tous les refresh tokens) |

---

## 7. Déconnexion

### 7.1 Déconnexion simple

- Supprime le refresh token de la base de données
- Efface le cookie `refresh_token`
- Le frontend supprime l'access token de la mémoire
- Redirect vers `/login`

### 7.2 Déconnexion de tous les appareils

Disponible dans les réglages (`/settings`). Supprime **tous** les refresh tokens du user en base. Toutes les sessions expirent dès que l'access token courant expire (max 15 min).

---

## 8. Suivi d'activité

Le suivi de la dernière activité est essentiel pour le système de gestion de l'abandon (SPEC-05 §3.4).

### 8.1 Mise à jour de `last_active_at`

Le champ `last_active_at` est mis à jour **à chaque refresh de token** (pas à chaque requête API, pour éviter les écritures excessives).

Puisque l'access token dure 15 minutes, `last_active_at` est mis à jour au maximum toutes les 15 minutes quand le joueur est actif.

### 8.2 Détection d'inactivité

Un cron job quotidien (BullMQ) vérifie les joueurs inactifs :

```
Cron quotidien (06:00 UTC)
    │
    ▼
SELECT * FROM users
WHERE status = 'ACTIVE'
AND has_club = true
AND last_active_at < NOW() - INTERVAL '7 days'
    │
    ▼
Pour chaque utilisateur inactif :
    │
    ├── 7 jours < inactivité ≤ 14 jours
    │   → Notification "Votre club vous attend !" (Secrétaire)
    │   → Email de rappel
    │
    ├── 14 jours < inactivité ≤ 21 jours
    │   → Notification "Votre club sera retiré dans 7 jours." (Secrétaire)
    │   → Email d'avertissement
    │
    └── inactivité > 21 jours
        → Club retiré de la ligue (voir SPEC-05 §3.4)
        → Statut user → INACTIVE
        → Email de notification de suppression du club
```

---

## 9. Page réglages (`/settings`)

### 9.1 Sections

```
┌──────────────────────────────────────────────────────────┐
│  RÉGLAGES                                                  │
│                                                            │
│  ─── Profil ──────────────────────────────────────────    │
│  Nom d'utilisateur : matth1eu                [Modifier]    │
│  Email : mat@example.com                     [Modifier]    │
│                                                            │
│  ─── Sécurité ────────────────────────────────────────    │
│  Mot de passe : ••••••••                     [Modifier]    │
│  Sessions actives : 2 appareils    [Déconnecter partout]   │
│                                                            │
│  ─── Notifications ───────────────────────────────────    │
│  Notifications email :                                     │
│    ☑ Matchs (rappels, résultats)                           │
│    ☑ Transferts (propositions, fin de contrat)             │
│    ☑ Finances (alertes budget)                             │
│    ☐ Résultats concurrents                                 │
│    ☑ Compétition (classement, saison)                      │
│    ☑ Système (maintenance, mises à jour)                   │
│                                                            │
│  ─── Compte ──────────────────────────────────────────    │
│  [Supprimer mon compte]                                    │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### 9.2 Modification de l'email

Changer d'email nécessite :
1. Saisir le mot de passe actuel (vérification)
2. Saisir le nouvel email
3. Email de vérification envoyé au **nouvel** email
4. L'ancien email reste actif tant que le nouveau n'est pas vérifié
5. Clic sur le lien → email mis à jour

### 9.3 Modification du mot de passe

1. Saisir le mot de passe actuel
2. Saisir le nouveau mot de passe (mêmes règles de validation)
3. Confirmer le nouveau mot de passe
4. Toutes les autres sessions sont invalidées (sauf la session courante)

### 9.4 Modification du nom d'utilisateur

- Modifiable 1 fois par saison (comme le nom de club, mais indépendant)
- Même règles de validation que l'inscription
- Vérification d'unicité en temps réel
- Compteur `username_changes_remaining` (défaut : 1, reset chaque saison)

### 9.5 Suppression de compte

Processus irréversible :

```
Clic "Supprimer mon compte"
    │
    ▼
Modale de confirmation avec saisie du mot de passe
    │
    ├── Mot de passe incorrect → Erreur
    │
    ▼
Confirmation : "Tapez SUPPRIMER pour confirmer"
    │
    ▼
Marquer le compte comme DELETED (soft delete)
    │
    ▼
Le club est retiré de la ligue (remplacé par IA — SPEC-05 §3.4)
    │
    ▼
Toutes les sessions invalidées
    │
    ▼
Email de confirmation de suppression
    │
    ▼
Données personnelles anonymisées sous 30 jours (RGPD)
    │
    ▼
Redirect vers /login
```

**Rétention de données** : le compte est soft-deleted. Les données de jeu (stats, historique matchs) sont conservées sous forme anonymisée pour l'intégrité des classements et de l'historique. Les données personnelles (email, username, IP) sont supprimées sous 30 jours.

---

## 10. Pages publiques (non authentifié)

### 10.1 Landing page (`/`)

Page d'accueil pour les visiteurs non connectés :

```
┌──────────────────────────────────────────────────────────┐
│  🏟️ REGISTA                          [Se connecter]       │
│                                                            │
│  ─────────────── HERO SECTION ────────────────────────    │
│                                                            │
│  Gérez votre club. Imposez votre style.                    │
│  Matches en temps réel. Compétitions en ligne.             │
│                                                            │
│  [ ─────── Commencer gratuitement ─────── ]                │
│                                                            │
│  ─────────────── FEATURES (3 colonnes) ───────────────    │
│                                                            │
│  🏟️ Gérez votre club    │  ⚽ Matchs en direct    │  🏆 Compétez │
│  Créez, personnalisez,   │  90 minutes en temps   │  Ligues,     │
│  développez.             │  réel, tactiques live. │  classements, │
│                          │                        │  promotions.  │
│                                                            │
│  ─────────────── FOOTER ──────────────────────────────    │
│  CGU · Politique de confidentialité · Contact              │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### 10.2 Routing non authentifié

| Route | Page | Accès |
|---|---|---|
| `/` | Landing page | Public uniquement (redirect `/dashboard` si connecté) |
| `/login` | Connexion | Public uniquement (redirect `/dashboard` si connecté) |
| `/register` | Inscription | Public uniquement |
| `/verify-email` | Vérification email | Public (avec token en query param) |
| `/forgot-password` | Demande de reset | Public |
| `/reset-password` | Nouveau mot de passe | Public (avec token en query param) |
| `/cgu` | Conditions générales | Public |
| `/privacy` | Politique de confidentialité | Public |

### 10.3 Routing authentifié

Toutes les routes applicatives (`/dashboard`, `/squad`, `/tactics`, etc.) nécessitent une session active. Si non authentifié → redirect vers `/login` avec le `returnUrl` en query param pour revenir à la page demandée après connexion.

---

## 11. Sécurité

### 11.1 Hashage des mots de passe

- **Algorithme** : bcrypt
- **Salt rounds** : 12
- Le mot de passe en clair n'est jamais stocké ni loggé

### 11.2 Rate limiting

| Endpoint | Limite | Fenêtre |
|---|---|---|
| `POST /auth/register` | 3 par IP | 1 heure |
| `POST /auth/login` | 5 par IP | 15 minutes |
| `POST /auth/forgot-password` | 3 par email | 1 heure |
| `POST /auth/resend-verification` | 3 par email | 1 heure |
| `POST /auth/refresh` | 30 par user | 15 minutes |
| Routes API (authentifié) | 100 par user | 1 minute |

**Implémentation** : Redis-backed rate limiter via `@nestjs/throttler` avec store Redis.

### 11.3 Protection CSRF

- Les mutations (POST/PATCH/DELETE) utilisent le pattern "cookie-to-header" :
  - Le refresh token est dans un cookie `httpOnly`
  - L'access token est envoyé via header `Authorization: Bearer`
  - Cette séparation protège naturellement contre le CSRF

### 11.4 Headers de sécurité

| Header | Valeur |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (désactivé, CSP préféré) |
| `Content-Security-Policy` | Politique restrictive adaptée à l'app |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

### 11.5 Validation des entrées

- Tous les inputs sont sanitisés (trim, normalisation unicode)
- Les emails sont normalisés (lowercase, trim)
- Les usernames sont vérifiés contre une liste de mots réservés (`admin`, `system`, `regista`, `support`, `mod`, `moderator`, etc.)
- Les mots de passe sont vérifiés contre une liste des 10 000 mots de passe les plus courants (rejet si correspondance)
- Protection XSS : sanitisation des inputs en base, échappement en sortie (React gère naturellement côté frontend)

---

## 12. Emails transactionnels

### 12.1 Système d'envoi

| Paramètre | Valeur MVP |
|---|---|
| Service | Resend (alternative : Nodemailer + SMTP) |
| Adresse d'envoi | `noreply@regista.gg` |
| Templates | HTML + fallback texte brut |
| Queue | BullMQ (envoi asynchrone, retry x3 avec backoff exponentiel) |

### 12.2 Types d'emails

| Email | Déclencheur | Contenu |
|---|---|---|
| Vérification email | Inscription | Lien de vérification (24h) |
| Bienvenue | Vérification réussie | Message de bienvenue + lien vers le jeu |
| Reset mot de passe | Demande de reset | Lien de réinitialisation (1h) |
| Changement d'email | Demande de changement | Lien de vérification du nouvel email (24h) |
| Rappel inactivité (J7) | Cron inactivité | "Votre club vous attend !" |
| Avertissement inactivité (J14) | Cron inactivité | "Club retiré dans 7 jours" |
| Club retiré (J21) | Cron inactivité | "Votre club a été retiré" |
| Confirmation suppression | Suppression de compte | Confirmation + info rétention RGPD |

### 12.3 Préférences email

Les emails transactionnels critiques (vérification, reset, suppression) sont toujours envoyés. Les emails d'inactivité et de jeu respectent les préférences de notification de l'utilisateur (SPEC-05 §9.2).

---

## 13. Modèle de données

### 13.1 Table `users`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `username` | `varchar(20)` UNIQUE | Nom d'utilisateur (insensible casse) |
| `email` | `varchar(255)` UNIQUE | Email (normalisé lowercase) |
| `password_hash` | `varchar(255)` | Hash bcrypt du mot de passe |
| `status` | `enum` | `PENDING_VERIFICATION`, `ACTIVE`, `INACTIVE`, `BANNED`, `DELETED` |
| `email_verified_at` | `timestamp` | Nullable, date de vérification |
| `last_login_at` | `timestamp` | Dernière connexion |
| `last_active_at` | `timestamp` | Dernière activité (mis à jour au refresh token) |
| `username_changes_remaining` | `integer` | Changements restants (défaut: 1, reset par saison) |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

**Index** :
- `UNIQUE` sur `lower(username)` (unicité insensible à la casse)
- `UNIQUE` sur `lower(email)` (unicité insensible à la casse)
- `INDEX` sur `status` + `last_active_at` (requête d'inactivité)

### 13.2 Table `refresh_tokens`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `token_hash` | `varchar(64)` | SHA-256 du refresh token |
| `expires_at` | `timestamp` | Expiration |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `token_hash` (lookup au refresh)
- `INDEX` sur `user_id` (suppression de toutes les sessions)
- `INDEX` sur `expires_at` (cleanup cron)

### 13.3 Table `email_verification_tokens`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `token_hash` | `varchar(64)` | SHA-256 du token |
| `expires_at` | `timestamp` | Expiration (24h) |
| `used_at` | `timestamp` | Nullable, date d'utilisation |
| `created_at` | `timestamp` | |

### 13.4 Table `password_reset_tokens`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | |
| `token_hash` | `varchar(64)` | SHA-256 du token |
| `expires_at` | `timestamp` | Expiration (1h) |
| `used_at` | `timestamp` | Nullable, date d'utilisation |
| `created_at` | `timestamp` | |

---

## 14. API Endpoints

### 14.1 Authentification

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| `POST` | `/auth/register` | Créer un compte | Non |
| `POST` | `/auth/login` | Se connecter | Non |
| `POST` | `/auth/logout` | Se déconnecter | Oui |
| `POST` | `/auth/refresh` | Rafraîchir l'access token | Non (cookie) |
| `POST` | `/auth/verify-email` | Vérifier l'email | Non |
| `POST` | `/auth/resend-verification` | Renvoyer l'email de vérification | Non |
| `POST` | `/auth/forgot-password` | Demander un reset de mot de passe | Non |
| `POST` | `/auth/reset-password` | Réinitialiser le mot de passe | Non |

### 14.2 Profil & Réglages

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| `GET` | `/users/me` | Profil de l'utilisateur connecté | Oui |
| `PATCH` | `/users/me/username` | Modifier le nom d'utilisateur | Oui |
| `PATCH` | `/users/me/email` | Demander un changement d'email | Oui |
| `PATCH` | `/users/me/password` | Modifier le mot de passe | Oui |
| `DELETE` | `/users/me` | Supprimer le compte | Oui |
| `GET` | `/users/me/sessions` | Lister les sessions actives | Oui |
| `DELETE` | `/users/me/sessions` | Révoquer toutes les sessions | Oui |

### 14.3 Validation (publique)

| Méthode | Route | Description | Auth requise |
|---|---|---|---|
| `GET` | `/auth/check-username?q={username}` | Vérifier disponibilité username | Non |
| `GET` | `/auth/check-email?q={email}` | Vérifier disponibilité email | Non |

### 14.4 Contrats API détaillés

#### `POST /auth/register`

**Request** :
```json
{
  "username": "matth1eu",
  "email": "mat@example.com",
  "password": "SecurePass123",
  "acceptedTos": true,
  "isOver13": true
}
```

**Response `201`** :
```json
{
  "user": {
    "id": "uuid",
    "username": "matth1eu",
    "email": "mat@example.com",
    "status": "PENDING_VERIFICATION"
  },
  "message": "Un email de vérification a été envoyé."
}
```

**Erreurs** :
| Code | Cas | Body |
|---|---|---|
| `400` | Validation échouée | `{ "errors": [{ "field": "password", "message": "..." }] }` |
| `409` | Email ou username déjà pris | `{ "error": "EMAIL_TAKEN" }` ou `{ "error": "USERNAME_TAKEN" }` |
| `429` | Rate limit | `{ "error": "TOO_MANY_REQUESTS", "retryAfter": 3600 }` |

#### `POST /auth/login`

**Request** :
```json
{
  "login": "matth1eu",
  "password": "SecurePass123",
  "rememberMe": true
}
```

**Response `200`** :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "matth1eu",
    "email": "mat@example.com",
    "status": "ACTIVE",
    "hasClub": true,
    "clubId": "uuid"
  }
}
```

*+ cookie `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=2592000`*

**Erreurs** :
| Code | Cas | Body |
|---|---|---|
| `401` | Identifiants incorrects | `{ "error": "INVALID_CREDENTIALS" }` |
| `403` | Compte banni | `{ "error": "ACCOUNT_BANNED" }` |
| `429` | Rate limit | `{ "error": "TOO_MANY_REQUESTS", "retryAfter": 900 }` |

#### `POST /auth/refresh`

**Request** : pas de body (cookie httpOnly envoyé automatiquement)

**Response `200`** :
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

*+ nouveau cookie `refresh_token` (rotation)*

#### `GET /users/me`

**Response `200`** :
```json
{
  "id": "uuid",
  "username": "matth1eu",
  "email": "mat@example.com",
  "status": "ACTIVE",
  "hasClub": true,
  "clubId": "uuid",
  "emailVerifiedAt": "2026-03-02T10:00:00Z",
  "lastLoginAt": "2026-03-02T14:30:00Z",
  "usernameChangesRemaining": 1,
  "createdAt": "2026-03-01T09:00:00Z"
}
```

---

## 15. Guards & Middleware NestJS

### 15.1 AuthGuard (JWT)

Guard global appliqué à toutes les routes sauf celles décorées `@Public()`.

```typescript
// Décorateur pour les routes publiques
@Public()
@Post('login')
async login() { ... }

// Toutes les autres routes nécessitent un JWT valide
@Get('dashboard')
async getDashboard(@CurrentUser() user: UserPayload) { ... }
```

### 15.2 Middleware de traçage d'activité

Middleware qui met à jour `last_active_at` uniquement lors du refresh de token (pas à chaque requête).

### 15.3 Décorateur `@CurrentUser()`

Extrait les informations de l'utilisateur depuis le JWT décodé pour injection dans les handlers.

```typescript
interface UserPayload {
  sub: string;      // user id
  username: string;
}
```

---

## 16. Frontend : gestion de l'état auth

### 16.1 AuthContext

Le state d'authentification est géré via un React Context + TanStack Query :

```
AuthProvider
  │
  ├── user: User | null       (utilisateur connecté)
  ├── isLoading: boolean       (chargement initial)
  ├── isAuthenticated: boolean (raccourci)
  │
  ├── login(credentials)       → POST /auth/login
  ├── register(data)           → POST /auth/register
  ├── logout()                 → POST /auth/logout
  └── refreshToken()           → POST /auth/refresh (automatique)
```

### 16.2 Route protection

TanStack Router avec `beforeLoad` pour protéger les routes authentifiées :

```typescript
// Route protégée
export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { returnUrl: '/dashboard' } })
    }
  },
})

// Route publique uniquement (redirect si déjà connecté)
export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
})
```

### 16.3 Stockage des tokens

| Token | Stockage | Raison |
|---|---|---|
| Access token | Mémoire (variable JS) | Pas accessible via XSS sur le storage, pas envoyé automatiquement (pas de CSRF) |
| Refresh token | Cookie httpOnly | Pas accessible via JS (protection XSS), envoyé automatiquement au serveur |

---

## 17. Jobs BullMQ

| Job | Déclencheur | Description |
|---|---|---|
| `send-email` | Inscription, reset, etc. | Envoi d'email asynchrone (retry x3) |
| `cleanup-expired-tokens` | Cron quotidien (03:00 UTC) | Supprime les tokens expirés (refresh, vérification, reset) |
| `check-inactive-users` | Cron quotidien (06:00 UTC) | Détecte les joueurs inactifs (voir §8.2) |

---

## 18. User Stories

### Inscription

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AUTH-01 | Visiteur | Créer un compte avec email et mot de passe | Accéder au jeu | Formulaire validé, email de vérification envoyé, compte en PENDING |
| AUTH-02 | Visiteur | Voir la disponibilité de mon username en temps réel | Choisir un nom disponible | Vérification debounced (300ms), indicateur visuel vert/rouge |
| AUTH-03 | Visiteur | Recevoir un email de vérification | Activer mon compte | Email reçu < 30s, lien fonctionnel, expiration 24h |
| AUTH-04 | Visiteur | Cliquer sur le lien de vérification et activer mon compte | Commencer à jouer | Redirect vers création de club, statut ACTIVE |
| AUTH-05 | Visiteur | Renvoyer l'email de vérification si non reçu | Ne pas rester bloqué | Bouton "Renvoyer", rate limited 3/h |

### Connexion

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AUTH-06 | Joueur | Me connecter avec email ou username + mot de passe | Accéder à mon club | Connexion < 1s, redirect dashboard ou création club |
| AUTH-07 | Joueur | Rester connecté via "Se souvenir de moi" | Ne pas me reconnecter à chaque visite | Session persistante 30 jours |
| AUTH-08 | Joueur | Être redirigé vers la page demandée après connexion | Reprendre où j'en étais | returnUrl en query param respecté |
| AUTH-09 | Joueur | Voir un message d'erreur clair si mes identifiants sont faux | Comprendre le problème | Message générique (pas de leak d'info) |

### Mot de passe

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AUTH-10 | Joueur | Réinitialiser mon mot de passe via email | Récupérer l'accès à mon compte | Email envoyé, lien 1h, nouveau mot de passe fonctionnel |
| AUTH-11 | Joueur | Modifier mon mot de passe depuis les réglages | Sécuriser mon compte | Ancien mot de passe requis, autres sessions invalidées |

### Session & Sécurité

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AUTH-12 | Joueur | Me déconnecter | Sécuriser mon compte sur un appareil partagé | Session supprimée, redirect login |
| AUTH-13 | Joueur | Déconnecter tous mes appareils | Révoquer des sessions suspectes | Toutes les sessions supprimées sauf la courante |
| AUTH-14 | Joueur | Que mon token se rafraîchisse automatiquement | Ne pas être déconnecté en plein match | Refresh transparent, aucune interruption |

### Profil & Réglages

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AUTH-15 | Joueur | Modifier mon nom d'utilisateur (1x par saison) | Changer d'identité | Validation unicité, compteur décrémenté |
| AUTH-16 | Joueur | Modifier mon email | Mettre à jour mes coordonnées | Vérification du nouveau mail, ancien actif entre-temps |
| AUTH-17 | Joueur | Supprimer mon compte | Exercer mon droit à l'effacement (RGPD) | Confirmation double, soft delete, anonymisation sous 30j |
| AUTH-18 | Joueur | Configurer mes préférences de notification email | Contrôler les emails reçus | 6 catégories toggleables, sauvegarde instantanée |

### Landing & Onboarding

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AUTH-19 | Visiteur | Voir une landing page attractive | Comprendre le jeu avant de m'inscrire | Hero section, features, CTA visible |
| AUTH-20 | Nouveau joueur | Être redirigé vers la création de club après activation | Commencer à jouer immédiatement | Aucune étape intermédiaire entre activation et onboarding |

### Inactivité

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| AUTH-21 | Joueur inactif | Recevoir un rappel à 7 jours d'inactivité | Revenir jouer avant de perdre mon club | Email + notification in-game |
| AUTH-22 | Joueur inactif | Recevoir un avertissement à 14 jours | Être prévenu de la suppression imminente | Email + notification urgente |
| AUTH-23 | Joueur (revenu après suppression) | Pouvoir recréer un club | Reprendre le jeu | Flux normal : création club → Division 3 |

---

## 19. Stratégie de tests

### Tests unitaires

- **Validation des champs** : username (format, longueur, caractères interdits), email (format, normalisation), password (force, liste noire)
- **Hashage** : vérifier bcrypt hash + compare
- **Token generation** : vérifier format et signature des JWT, hash des refresh tokens
- **Rate limiting** : vérifier le blocage après N tentatives
- **Inactivity detection** : vérifier les seuils 7/14/21 jours

### Tests d'intégration

- **Inscription complète** : register → email envoyé → verify → compte activé → redirect création club
- **Connexion** : login → tokens générés → accès API → refresh → re-accès
- **Reset password** : forgot → email → reset → login avec nouveau mot de passe → anciennes sessions invalidées
- **Session management** : login 2 appareils → logout all → vérifier les 2 sessions invalidées
- **Suppression compte** : delete → club retiré → données anonymisées

### Tests de sécurité

- **Rate limiting** : vérifier le blocage effectif sur login/register/reset
- **Token expiration** : vérifier qu'un access token expiré est rejeté
- **Token rotation** : vérifier qu'un refresh token utilisé est invalidé
- **Enumeration prevention** : vérifier que login et forgot-password ne révèlent pas l'existence d'un compte
- **Password blacklist** : vérifier que "password123" est rejeté

---

## 20. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Méthode d'auth | Email + mot de passe (social login post-MVP) | 2 |
| Tokens | JWT access (15min) + refresh token cookie httpOnly (30j) | 5 |
| Stockage tokens | Access en mémoire JS, refresh en cookie httpOnly | 16.3 |
| Hashage | bcrypt (12 rounds) | 11.1 |
| Vérification email | Requise avant de jouer, bloquante | 3.3 |
| Rate limiting | Redis-backed via @nestjs/throttler | 11.2 |
| Emails | Resend (ou SMTP) via BullMQ queue async | 12 |
| Suppression compte | Soft delete + anonymisation RGPD 30j | 9.5 |
| Suivi activité | Mis à jour au refresh token (pas à chaque requête) | 8.1 |
| Multi-compte | Interdit (1 email = 1 compte) | 2 |
| Social login (OAuth) | Post-MVP (Google, Discord) | — |
| 2FA | Post-MVP | — |

---

*Spec rédigée le 2026-03-02. À valider avant implémentation.*
