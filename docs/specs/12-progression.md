# SPEC-12 : Progression Hors Match (Complément)

> **Statut** : Draft
> **Lot** : 1 (MVP)
> **Dépendances** : SPEC-04 (Effectif), SPEC-09 (Entraînement)
> **Dépendants** : Aucun
> **Dernière mise à jour** : 2026-03-03
> **Note** : cette spec **complète** SPEC-04 §11 (progression passive) et SPEC-09 (entraînement) avec des mécaniques additionnelles : bonus de rôle, temps de jeu, dépassement de plafond et suivi de progression.

---

## 1. Objectif

Enrichir le système de progression existant pour récompenser les **choix de gestion du manager** (qui joue, qui est capitaine, qui est mis de côté) et offrir une **visibilité claire** sur l'évolution des joueurs dans le temps.

**Philosophie** : la progression ne doit pas nécessiter de micro-management. Le joueur fait des choix stratégiques (qui titulariser, quel programme d'entraînement) et le système récompense ces choix automatiquement.

---

## 2. Rappel des systèmes existants

| Système | Source | Fréquence | Mécanisme |
|---|---|---|---|
| Progression passive | SPEC-04 §11 | Après chaque match | +0.1-0.3 sur 1-2 stats (aléatoire, basé sur l'âge) |
| Entraînement ciblé | SPEC-09 | Entre chaque match | Gain ciblé sur les stats du focus choisi |
| Régression (30+) | SPEC-04 §11 | Après chaque match | -0.05-0.15 sur stats physiques (30% de chance si ≥ 30 ans) |
| Retraite | SPEC-04 §12.4 | Fin de saison | Joueur retiré à 35 ans |
| Plafond | SPEC-04 §2 / SPEC-09 §4.1 | Permanent | Aucune stat ne dépasse `potential + 5` |

---

## 3. Nouveauté : Modificateurs de progression par rôle

### 3.1 Bonus de rôle

Le rôle d'un joueur dans l'équipe influence sa progression passive (SPEC-04 §11) via un **modificateur appliqué au gain post-match** :

| Rôle | Modificateur progression | Condition |
|---|---|---|
| **Titulaire régulier** | × 1.2 | A joué ≥ 60 min dans 3 des 5 derniers matchs |
| **Capitaine** | × 1.1 (bonus mental) | Est capitaine + a joué le match. S'applique uniquement aux stats mentales (vision, composure, workRate, positioning) |
| **Jeune intégré** | × 1.3 | Âge ≤ 21 ET titulaire régulier |
| **Remplaçant** | × 0.7 | A joué < 30 min OU entré en jeu |
| **Non convoqué** | × 0.3 | N'a pas été dans les 18 pour le match |
| **Standard** | × 1.0 | Tous les autres cas |

**Les modificateurs se cumulent** (multiplicatifs) : un capitaine de 20 ans titulaire régulier obtient × 1.2 × 1.1 × 1.3 = × 1.72 sur ses stats mentales et × 1.2 × 1.3 = × 1.56 sur les autres.

### 3.2 Ralentissement des joueurs non utilisés

Un joueur qui **ne joue pas** voit sa progression passive s'effondrer :

| Statut | Derniers 5 matchs | Effet |
|---|---|---|
| Actif | ≥ 3 matchs joués (≥ 1 min) | Progression normale |
| Peu utilisé | 1-2 matchs joués | Progression × 0.5 |
| Inactif | 0 match joué | Progression × 0.1 (quasi nulle) |

**Remarque** : l'entraînement (SPEC-09) n'est pas affecté par ce modificateur. Seule la progression passive post-match est réduite. Un joueur sur le banc qui s'entraîne continue de progresser via l'entraînement.

---

## 4. Nouveauté : Dépassement temporaire du plafond

### 4.1 Concept "Forme exceptionnelle"

Un joueur qui enchaîne des performances exceptionnelles peut temporairement dépasser son plafond de potentiel sur certaines stats.

### 4.2 Déclenchement

```
SI un joueur a obtenu une note ≥ 8.0 dans 3 des 5 derniers matchs :
    → Statut "En forme exceptionnelle" activé
    → Le plafond de stat passe de (potential + 5) à (potential + 8)
    → Durée : tant que le joueur maintient une note ≥ 7.0 dans au moins 2/5 derniers matchs
    → Quand le statut se perd, les stats au-dessus de (potential + 5) déclinent de -0.1/match jusqu'à revenir au plafond normal
```

### 4.3 Affichage

| Indicateur | Affichage |
|---|---|
| Joueur "en forme exceptionnelle" | Badge 🔥 sur la fiche joueur |
| Stat au-dessus du plafond normal | Barre de stat avec zone dorée au-delà du plafond |
| Perte du statut | Notification adjoint : "{Joueur} revient à son niveau habituel après une période faste." |
| Gain du statut | Notification adjoint : "{Joueur} est en feu ! Ses performances récentes sont au-dessus de son potentiel." |

### 4.4 Limitations

- Le dépassement est **limité à +3** au-dessus du plafond normal (donc stat max = potential + 8)
- Le dépassement ne peut affecter que les stats liées au poste du joueur
- Le déclin est automatique et progressif (pas de chute brutale)

---

## 5. Nouveauté : Suivi de progression

### 5.1 Historique de progression (fiche joueur)

Chaque fiche joueur affiche un **graphique de progression sur 30 jours** :

```
── PROGRESSION (30 derniers jours) ──────────────

Overall : 62.4 → 63.1 (+0.7)

pace      ████████████████░░░░  58 → 58.3  (+0.3)
stamina   █████████████████░░░  62 → 62.5  (+0.5)
passing   ██████████████████░░  66 → 66.8  (+0.8)  ⬆
shooting  ████████████████░░░░  59 → 59.2  (+0.2)
tackling  ███████████████████░  70 → 70.1  (+0.1)  🔒 plafond

Légende : ⬆ forte progression │ 🔒 plafond atteint │ 🔥 forme exceptionnelle
```

### 5.2 Sources de progression détaillées

Le joueur peut voir d'où vient la progression de chaque stat :

```
passing : +0.8 sur 30 jours
  ├── Progression passive (post-match) : +0.3
  ├── Entraînement (focus Technique) : +0.4
  └── Bonus titulaire régulier : +0.1
```

### 5.3 Joueurs favoris

Le joueur peut marquer des joueurs comme **"favoris"** (max 5). Les favoris apparaissent dans un widget dédié sur le dashboard :

```
── JOUEURS SUIVIS ──────────────────────────

🔥 K. Mensah (LW, 19 ans)  OVR 58 → 60.1 (+2.1 / 30j)
   pace +0.8 │ dribbling +0.6 │ shooting +0.4

⬆  R. Santos (ST, 22 ans)  OVR 68 → 68.9 (+0.9 / 30j)
   shooting +0.4 │ composure +0.3

→  A. Dupont (CB, 28 ans)  OVR 71 → 71.2 (+0.2 / 30j)
   stable
```

---

## 6. Récapitulatif : progression totale par profil

### Saison type pour un jeune pépite (19 ans, overall 55, potential 75)

| Source | Stats ciblées | Gain estimé / saison |
|---|---|---|
| Progression passive | 1-2 stats aléatoires | +4-6 (avec bonus jeune intégré × 1.3) |
| Entraînement (focus Physique) | pace, stamina, strength, agility | +2-3 par stat |
| Bonus titulaire régulier | toutes stats | multiplicateur × 1.2 déjà inclus |
| **Total estimé** | **stats ciblées** | **+6-9 par stat** |
| **Overall estimé** | | **+3-5 points** |

### Saison type pour un milieu confirmé (27 ans, overall 70, potential 74)

| Source | Gain estimé / saison |
|---|---|
| Progression passive | +1-2 sur 1-2 stats |
| Entraînement | +0.7-1.0 par stat ciblée |
| **Total** | **+1-2 overall** |

### Saison type pour un vétéran (33 ans, overall 72, potential 72)

| Source | Gain estimé / saison |
|---|---|
| Progression passive | quasi nulle |
| Régression physique | -1 à -3 sur stats physiques |
| Entraînement | +0.3-0.5 (compense partiellement) |
| **Total** | **-0.5 à -2 overall** |

---

## 7. Modèle de données

### 7.1 Table `player_progression_log`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK | |
| `source` | `enum` | `passive`, `training`, `regression`, `exceptional_form_decay` |
| `stat_name` | `varchar(20)` | Stat affectée |
| `old_value` | `decimal(4,1)` | Valeur avant |
| `new_value` | `decimal(4,1)` | Valeur après |
| `modifier_detail` | `jsonb` NULLABLE | Détail des modificateurs appliqués |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `player_id` + `created_at` (historique 30 jours)
- `INDEX` sur `player_id` + `source` (filtrage par type)

### 7.2 Modification sur la table `players`

| Colonne ajoutée | Type | Description |
|---|---|---|
| `is_exceptional_form` | `boolean` | En forme exceptionnelle (défaut: false) |
| `exceptional_form_since` | `timestamp` NULLABLE | Début du statut |
| `is_favorite` | `boolean` | Marqué comme favori (défaut: false) |

### 7.3 Table `player_match_appearances`

| Colonne | Type | Description |
|---|---|---|
| `id` | `uuid` PK | |
| `player_id` | `uuid` FK | |
| `match_id` | `uuid` FK | |
| `minutes_played` | `integer` | Minutes jouées |
| `rating` | `decimal(3,1)` | Note du match |
| `was_starter` | `boolean` | Titulaire ou entré en jeu |
| `was_captain` | `boolean` | Capitaine pour ce match |
| `created_at` | `timestamp` | |

**Index** :
- `INDEX` sur `player_id` + `created_at` DESC (5 derniers matchs)

---

## 8. API Endpoints

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/players/:id/progression` | Historique de progression (30 jours, par stat) | Oui |
| `GET` | `/players/:id/progression/summary` | Résumé de progression (overall + top stats) | Oui |
| `POST` | `/players/:id/favorite` | Marquer comme favori | Oui |
| `DELETE` | `/players/:id/favorite` | Retirer des favoris | Oui |
| `GET` | `/squad/favorites` | Liste des joueurs favoris avec progression | Oui |

---

## 9. User Stories

| ID | En tant que... | Je veux... | Pour... | Critères d'acceptation |
|---|---|---|---|---|
| PROG-01 | Joueur | Que mes titulaires progressent plus vite que mes réservistes | Récompenser mes choix de composition | Modificateur × 1.2 visible dans le détail de progression |
| PROG-02 | Joueur | Que mon capitaine gagne un bonus sur les stats mentales | Donner du sens au brassard | Bonus × 1.1 sur vision, composure, workRate, positioning |
| PROG-03 | Joueur | Que mes jeunes intégrés dans le XI progressent rapidement | Investir dans la formation | Modificateur × 1.3 pour les ≤ 21 ans titulaires |
| PROG-04 | Joueur | Voir un joueur "en forme exceptionnelle" avec un badge | Ressentir de la fierté | Badge 🔥, note ≥ 8.0 dans 3/5 derniers matchs |
| PROG-05 | Joueur | Voir l'historique de progression sur 30 jours | Comprendre l'évolution de mes joueurs | Graphique par stat, sources détaillées |
| PROG-06 | Joueur | Marquer des joueurs favoris (max 5) | Suivre mes pépites sur le dashboard | Widget favoris avec progression rapide |
| PROG-07 | Système | Ralentir la progression des joueurs non utilisés | Éviter le power creep sur un effectif de 25 | Modificateur × 0.5 (peu utilisé), × 0.1 (inactif) |
| PROG-08 | Joueur | Comprendre ce qui influence la progression | Avoir de la transparence | Détail sources (passive + entraînement + bonus rôle) |

---

## 10. Décisions de design

| Question | Décision | Section |
|---|---|---|
| XP / système de points | Non, progression directe sur les stats (pas de système d'XP intermédiaire) | — |
| Rétrogradation automatique | Uniquement pour les 30+ sur stats physiques (SPEC-04 §11), pas de rétrogradation arbitraire | 2 |
| Dépassement du plafond | Oui, temporaire (+3 max), basé sur les performances | 4 |
| Progression manuelle (choix du joueur) | Non, le joueur ne choisit pas où vont les points. Il influence via l'entraînement et la composition. | — |
| Coaching / mentorat | Post-MVP | — |
| Favoris | Max 5, widget dashboard | 5.3 |
| Cron quotidien | Non, progression appliquée post-match (plus cohérent que quotidien) | 3 |

---

*Spec rédigée le 2026-03-03. À valider avant implémentation.*
