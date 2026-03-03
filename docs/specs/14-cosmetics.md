# SPEC-14 : Cosmétiques & Boutique

> **Statut** : Draft
> **Lot** : 2 (Post-MVP)
> **Dépendances** : SPEC-01 (Auth), SPEC-02 (Club), SPEC-10 (Finances)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03
> **Note** : cette spec est **Lot 2**. Aucune autre spec MVP n'en dépend. Le modèle de données est conçu pour supporter une monnaie premium (€) à terme sans restructuration, mais **seule la monnaie G$ est implémentée en première version**.

---

## 1. Objectif

Créer un **système économique non-pay-to-win** basé exclusivement sur la **personnalisation esthétique du club**. Les cosmétiques offrent un sentiment de progression et d'identité au joueur sans déséquilibrer le jeu.

**Philosophie** : zéro impact gameplay. Un club gratuit et un club qui a dépensé en cosmétiques sont strictement équivalents sur le terrain. La boutique récompense l'implication et l'ancienneté, pas le portefeuille.

---

## 2. Types de cosmétiques

### 2.1 Catégories

| Catégorie | Description | Exemples |
|---|---|---|
| **Maillots** | Kit domicile, extérieur, third | Maillot rétro rayé, maillot dégradé futuriste |
| **Logos** | Écusson du club | Logo minimaliste, logo vintage, logo néon |
| **Stades** | Apparence visuelle du stade | Stade moderne, stade rétro, stade ambiance ultras |
| **Bannières** | Bannière de supporters affichée sur le profil | Tifo géant, fumigènes, mosaïque |
| **Badges** | Badges de récompense affichés sur le profil | Badge "Centenaire", badge "Invaincu", badge "Formateur" |

### 2.2 Exclusions MVP (Lot 2)

- **Skins d'interface** → Lot 3
- **Effets d'entrée / célébrations animées** → Lot 3
- **Éditeur complet de maillot/logo** → Lot 3 (uniquement des assets préfaits au Lot 2)

### 2.3 Format des assets

Tous les cosmétiques sont des **assets préfaits** :
- Logos et badges : **SVG**
- Maillots : **SVG paramétrable** (couleurs injectées via variables CSS)
- Stades et bannières : **PNG / WebP** (illustrations statiques)

---

## 3. Système de boutique

### 3.1 Structure

```
┌──────────────────────────────────────────────────────────────┐
│  BOUTIQUE                                          Solde: 850K G$  │
│                                                                     │
│  [Maillots]  [Logos]  [Stades]  [Bannières]  [Badges]              │
│  ──────────────────────────────────────────────────────────        │
│                                                                     │
│  ── EN VITRINE (rotation hebdo) ────────────────────────────       │
│                                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ Maillot │  │  Logo   │  │ Stade   │  │Bannière │              │
│  │ Néon    │  │ Vintage │  │ Ultras  │  │ Tifo    │              │
│  │         │  │         │  │         │  │         │              │
│  │ ★ Rare  │  │ Commun  │  │ ★ Rare  │  │ Commun  │              │
│  │ 200K G$ │  │  50K G$ │  │ 300K G$ │  │  80K G$ │              │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │
│                                                                     │
│  ── CATALOGUE ──────────────────────────────────────────────       │
│                                                                     │
│  Filtrer par : [Thème ▾] [Rareté ▾] [Prix ▾]                      │
│  ...                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Rotation hebdomadaire

- **4 items en vitrine**, renouvelés chaque **lundi à 00:00 UTC**
- La vitrine met en avant des items existants du catalogue (pas d'exclusivité temporaire au Lot 2)
- Le catalogue complet reste accessible en permanence

### 3.3 Thèmes

| Thème | Description |
|---|---|
| Classique | Designs sobres et intemporels |
| Rétro | Inspirés des années 70-90 |
| Moderne | Designs épurés et contemporains |
| Futuriste | Néon, holographique, tech |
| Pays | Inspirés de nations (couleurs, motifs) |

### 3.4 Raretés

| Rareté | Couleur | Prix moyen (G$) | Proportion |
|---|---|---|---|
| **Commun** | Gris | 30K - 80K | 60% des items |
| **Rare** | Bleu | 100K - 300K | 30% des items |
| **Exclusif** | Or | Non achetable | 10% — uniquement déblocable via accomplissements |

---

## 4. Personnalisation du club

### 4.1 Interface

```
── APPARENCE DU CLUB ──────────────────────────────

┌─────────────────────┐    ┌──────────────────────────┐
│                     │    │  Maillot domicile :       │
│   [APERÇU LIVE]     │    │  ▸ Classique bleu  ✏️    │
│                     │    │                           │
│   Montre le club    │    │  Maillot extérieur :      │
│   tel qu'il         │    │  ▸ Rétro rayé  ✏️        │
│   apparaît aux      │    │                           │
│   autres joueurs    │    │  Logo :                   │
│                     │    │  ▸ Écusson vintage  ✏️    │
│                     │    │                           │
│                     │    │  Stade :                  │
│                     │    │  ▸ Stade par défaut  ✏️   │
│                     │    │                           │
│                     │    │  Bannière :               │
│                     │    │  ▸ Aucune  ✏️             │
│                     │    │                           │
└─────────────────────┘    └──────────────────────────┘
```

### 4.2 Slots d'équipement

| Slot | Quantité | Description |
|---|---|---|
| Maillot domicile | 1 | Affiché lors des matchs à domicile |
| Maillot extérieur | 1 | Affiché lors des matchs à l'extérieur |
| Logo | 1 | Affiché partout (profil, classement, matchs) |
| Stade | 1 | Apparence visuelle du stade |
| Bannière | 1 | Affichée sur le profil du club |

### 4.3 Visibilité

Les éléments cosmétiques sont visibles dans :
- La fiche du club (profil)
- Les résumés de match
- Le classement de la ligue
- Le marché des transferts (logo du club vendeur)

### 4.4 Valeurs par défaut

Chaque club commence avec un **kit par défaut** (maillot, logo, stade) généré à la création du club (SPEC-08). Ces items par défaut ne sont pas comptés dans l'inventaire et ne peuvent pas être vendus.

---

## 5. Modèle économique

### 5.1 Monnaie G$ (Lot 2)

Les cosmétiques sont achetables **uniquement en G$** au Lot 2. Les prix sont calibrés pour que :
- Un item commun = 1-2 victoires en championnat (50K-80K G$)
- Un item rare = 3-10 matchs de revenus (~100K-300K G$)
- Les items exclusifs ne sont pas achetables

**L'économie cosmétique est volontairement coûteuse** pour créer un dilemme : investir en transferts ou en cosmétiques.

### 5.2 Monnaie premium (préparation technique)

Le modèle de données supporte une **monnaie premium** dès le Lot 2 mais elle **n'est pas implémentée** :
- Le champ `price_premium` existe sur les items (nullable, défaut: null)
- La table `premium_transactions` existe mais reste vide
- L'intégration Stripe / paiement est un lot ultérieur
- **Aucun item n'est exclusif à la monnaie premium** — tout est achetable en G$ au Lot 2

### 5.3 Garantie anti-P2W

| Règle | Application |
|---|---|
| Zéro impact gameplay | Aucun cosmétique ne modifie des stats, de la progression, ou des résultats de match |
| Pas d'avantage indirect | Pas de boost XP, pas de revenus supplémentaires, pas de slots bonus |
| Tout déblocable en jouant | Au Lot 2, 100% des items sont accessibles via G$ ou accomplissements |

---

## 6. Items déblocables gratuitement

### 6.1 Accomplissements

| Accomplissement | Récompense | Condition |
|---|---|---|
| Fondateur | Badge "Fondateur" (exclusif) | Avoir créé son club pendant la saison 1 |
| Centenaire | Badge "100 matchs" | 100 matchs joués |
| Champion | Badge division + bannière spéciale | Remporter un championnat |
| Invaincu | Badge "Invaincu" | Terminer une saison sans défaite |
| Formateur | Bannière "Académie" | Avoir 3 joueurs ≤ 21 ans avec overall ≥ 65 |
| Vétéran | Logo "Vétéran" | Club actif depuis 5 saisons |
| Fair-play | Badge "Fair-play" | Terminer une saison avec < 3 cartons rouges |

### 6.2 Déblocage

- Les accomplissements sont vérifiés automatiquement en fin de saison (ou après chaque match pour les compteurs)
- Notification à l'obtention : "Vous avez débloqué : {item} pour l'accomplissement {nom} !"
- L'item est ajouté automatiquement à l'inventaire

---

## 7. Administration

### 7.1 CRUD Items

L'admin peut créer, modifier et supprimer des items cosmétiques via l'interface admin :

```
── ADMIN : COSMÉTIQUES ─────────────────────────────

[+ Nouvel item]

Catégorie  Nom               Rareté    Prix G$    Thème       Statut
Maillot    Néon bleu         Rare      200K       Futuriste   Actif
Logo       Vintage rond      Commun     50K       Rétro       Actif
Stade      Ultras ambiance   Rare      300K       Classique   Actif
Badge      Champion Div 1    Exclusif   —         —           Actif (accomplissement)

[Modifier] [Désactiver] [Supprimer]
```

### 7.2 Gestion de la rotation

- L'admin sélectionne manuellement les 4 items en vitrine pour la semaine suivante
- Si aucune sélection n'est faite, 4 items sont tirés aléatoirement (1 par catégorie, pondérés par rareté)

### 7.3 Pas d'analytics au Lot 2

Le suivi analytique des items populaires (achats, vues, etc.) est reporté à un lot ultérieur. Le Lot 2 se concentre sur le fonctionnel.

---

## 8. Modèle de données

### 8.1 Table `shop_items`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `name` | `varchar(50)` | Nom de l'item |
| `description` | `varchar(200)` NULLABLE | Description courte |
| `category` | `enum` | `jersey`, `logo`, `stadium`, `banner`, `badge` |
| `theme` | `enum` | `classic`, `retro`, `modern`, `futuristic`, `country` |
| `rarity` | `enum` | `common`, `rare`, `exclusive` |
| `price_game` | `bigint` NULLABLE | Prix en G$ (centimes). Null si non achetable (exclusif) |
| `price_premium` | `bigint` NULLABLE | Prix en monnaie premium (centimes). Null = pas disponible en premium. Non utilisé au Lot 2. |
| `asset_url` | `varchar(255)` | Chemin vers l'asset (SVG, PNG, WebP) |
| `asset_config` | `jsonb` NULLABLE | Configuration de l'asset (ex: couleurs variables pour un maillot SVG) |
| `unlock_condition` | `varchar(50)` NULLABLE | Code de l'accomplissement qui débloque cet item (ex: `champion_div1`). Null si achetable. |
| `is_active` | `boolean` | Item visible dans la boutique (défaut: true) |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

**Index** :
- `INDEX` sur `category` + `is_active`
- `INDEX` sur `rarity` + `is_active`

### 8.2 Table `player_inventory`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | Propriétaire |
| `item_id` | `uuid` FK → `shop_items` | Item possédé |
| `source` | `enum` | `purchase`, `achievement`, `default`, `event` |
| `purchased_at` | `timestamp` | Date d'acquisition |

**Index** :
- `UNIQUE INDEX` sur `user_id` + `item_id` (pas de doublon)
- `INDEX` sur `user_id` + `source`

### 8.3 Table `club_customization`

| Colonne | Type | Description |
|---|---|---|
| `club_id` | `uuid` PK FK | Relation 1:1 avec `clubs` |
| `jersey_home_id` | `uuid` FK NULLABLE → `shop_items` | Maillot domicile équipé |
| `jersey_away_id` | `uuid` FK NULLABLE → `shop_items` | Maillot extérieur équipé |
| `logo_id` | `uuid` FK NULLABLE → `shop_items` | Logo équipé |
| `stadium_id` | `uuid` FK NULLABLE → `shop_items` | Stade équipé |
| `banner_id` | `uuid` FK NULLABLE → `shop_items` | Bannière équipée |
| `primary_color` | `varchar(7)` | Couleur primaire du club (hex, ex: `#1A3C6E`) |
| `secondary_color` | `varchar(7)` | Couleur secondaire (hex) |
| `updated_at` | `timestamp` | |

**Contrainte** : chaque item équipé doit exister dans `player_inventory` pour le propriétaire du club. Null = item par défaut.

### 8.4 Table `shop_featured`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `item_id` | `uuid` FK → `shop_items` | Item en vitrine |
| `week_start` | `date` | Lundi de la semaine (date de début) |
| `position` | `integer` | Position en vitrine (1-4) |

**Index** :
- `UNIQUE INDEX` sur `week_start` + `position`

### 8.5 Table `premium_transactions` (préparation technique)

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | Acheteur |
| `amount` | `bigint` | Montant en centimes d'euro |
| `currency` | `varchar(3)` | Code ISO (EUR, USD, etc.) |
| `provider_ref` | `varchar(100)` | Référence Stripe / provider |
| `status` | `enum` | `pending`, `completed`, `refunded` |
| `created_at` | `timestamp` | |

**Note** : cette table est créée au Lot 2 mais **reste vide** jusqu'à l'intégration d'un provider de paiement.

---

## 9. API Endpoints

### 9.1 Endpoints joueur

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/shop/items` | Catalogue (filtres: category, theme, rarity) — paginé | Oui |
| `GET` | `/shop/featured` | Items en vitrine cette semaine | Oui |
| `GET` | `/shop/items/:id` | Détail d'un item | Oui |
| `POST` | `/shop/items/:id/purchase` | Acheter un item (G$) | Oui |
| `GET` | `/inventory` | Inventaire du joueur | Oui |
| `GET` | `/club/customization` | Personnalisation actuelle du club | Oui |
| `PUT` | `/club/customization` | Modifier la personnalisation (équiper/déséquiper) | Oui |

#### `POST /shop/items/:id/purchase`

**Request** : (pas de body, l'item est identifié par l'URL)

**Response 201** :
```json
{
  "inventoryId": "uuid",
  "item": { "id": "uuid", "name": "Maillot Néon", "category": "jersey" },
  "newBalance": 650000
}
```

**Erreurs** :
- `400` si l'item est exclusif (non achetable)
- `409` si l'item est déjà possédé
- `402` si solde G$ insuffisant

#### `PUT /club/customization`

**Request** :
```json
{
  "jerseyHomeId": "uuid",
  "jerseyAwayId": "uuid",
  "logoId": null,
  "primaryColor": "#1A3C6E",
  "secondaryColor": "#FFFFFF"
}
```

Null = revenir à l'item par défaut. Seuls les champs envoyés sont modifiés.

**Response 200** :
```json
{
  "jerseyHomeId": "uuid",
  "jerseyAwayId": "uuid",
  "logoId": null,
  "stadiumId": null,
  "bannerId": null,
  "primaryColor": "#1A3C6E",
  "secondaryColor": "#FFFFFF"
}
```

**Erreur** : `403` si l'item n'est pas dans l'inventaire du joueur.

### 9.2 Endpoints admin

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/admin/shop/items` | Créer un item | Admin |
| `PATCH` | `/admin/shop/items/:id` | Modifier un item | Admin |
| `DELETE` | `/admin/shop/items/:id` | Désactiver un item (soft delete via `is_active`) | Admin |
| `PUT` | `/admin/shop/featured` | Définir la vitrine de la semaine (body: array de 4 item IDs) | Admin |

---

## 10. Jobs BullMQ

| Job | Déclencheur | Action |
|---|---|---|
| `ShopRotation` | Cron chaque lundi 00:00 UTC | Si aucune vitrine admin définie, tire 4 items aléatoires |
| `AchievementCheck` | Fin de saison / après match | Vérifie les conditions d'accomplissement, débloque les items |

---

## 11. User Stories

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| COS-01 | Joueur | Parcourir la boutique par catégorie et thème | Trouver des cosmétiques qui me plaisent | Filtres fonctionnels, items affichés avec aperçu et prix |
| COS-02 | Joueur | Voir les items en vitrine de la semaine | Découvrir des nouveautés chaque semaine | 4 items mis en avant, rotation hebdomadaire |
| COS-03 | Joueur | Acheter un cosmétique en G$ | Personnaliser mon club | Achat instantané, solde débité, item dans l'inventaire |
| COS-04 | Joueur | Voir mon inventaire complet | Gérer mes cosmétiques | Liste avec source (achat, accomplissement), catégorie |
| COS-05 | Joueur | Équiper un maillot domicile et extérieur | Personnaliser l'apparence de mon équipe en match | Maillot visible dans les résumés de match |
| COS-06 | Joueur | Changer le logo de mon club | Avoir une identité visuelle unique | Logo visible dans le classement, profil, matchs |
| COS-07 | Joueur | Personnaliser les couleurs de mon club | Affirmer l'identité de mon club | Couleurs primaire/secondaire, aperçu live |
| COS-08 | Joueur | Voir un aperçu live avant d'équiper | Vérifier que le rendu me convient | Aperçu dans l'interface de personnalisation |
| COS-09 | Joueur | Débloquer un badge en atteignant un accomplissement | Avoir une récompense visible pour mes exploits | Notification + ajout auto à l'inventaire |
| COS-10 | Joueur | Afficher mes badges sur mon profil | Montrer mes accomplissements aux autres | Badges visibles sur la fiche du club |
| COS-11 | Système | Garantir zéro impact gameplay | Préserver l'équité | Aucun cosmétique ne modifie stats, progression, ou revenus |
| COS-12 | Admin | Créer et modifier des items cosmétiques | Enrichir le catalogue | CRUD complet, catégorie, rareté, prix, asset |
| COS-13 | Admin | Définir la vitrine hebdomadaire | Mettre en avant des items spécifiques | Sélection de 4 items, fallback aléatoire |
| COS-14 | Système | Vérifier automatiquement les accomplissements | Débloquer les récompenses sans intervention | Check en fin de saison et après matchs |

---

## 12. Stratégie de tests

| Catégorie | Tests |
|---|---|
| Unitaire | Vérification qu'un item est dans l'inventaire avant équipement |
| Unitaire | Calcul du solde après achat |
| Unitaire | Conditions d'accomplissement (champion, invaincu, 100 matchs, etc.) |
| Intégration | Achat d'item (solde suffisant, insuffisant, déjà possédé, item exclusif) |
| Intégration | Équipement et déséquipement (slots, retour au défaut) |
| Intégration | Rotation hebdomadaire (auto + manuelle) |
| E2E | Flux complet : boutique → achat → inventaire → équipement → visibilité en match |

---

## 13. Décisions de design

| Question | Décision | Section |
|---|---|---|
| Monnaie premium (€) au Lot 2 | Non. Le modèle de données est prêt mais seul G$ est actif. L'intégration paiement est un lot ultérieur. | 5.2 |
| Club Pass | Post-Lot 2. Trop complexe pour la première itération cosmétique. | — |
| Événements saisonniers | Post-Lot 2. Les accomplissements permanents suffisent pour le lancement. | — |
| Marketplace entre joueurs | Non, jamais. Risque d'économie parallèle, bots, et contournement anti-P2W. | — |
| Éditeur de maillot/logo | Post-Lot 2. Assets préfaits uniquement. Un éditeur complet est un projet en soi. | 2.3 |
| Analytics boutique | Post-Lot 2. Le Lot 2 se concentre sur le fonctionnel. | 7.3 |
| Items supprimables de l'inventaire | Non. Un item acquis reste dans l'inventaire. Pas de système de vente/échange. | — |
| Nombre d'items au lancement | ~30-40 items (6-8 par catégorie) pour un catalogue initial suffisant. | — |
| Couleurs personnalisées | Oui, 2 couleurs (primaire + secondaire) via color picker. Pas de palette restreinte. | 4.1 |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
