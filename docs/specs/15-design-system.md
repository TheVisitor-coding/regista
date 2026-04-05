# SPEC-15 : Design System & Identité Visuelle

> **Statut** : Draft
> **Lot** : 2 (Post-MVP)
> **Dernière mise à jour** : 2026-04-03

---

## 1. Objectif

Donner à Regista une **identité visuelle distinctive** de jeu de gestion de football. Le design doit évoquer le sport, la stratégie et la progression — pas un panneau d'administration.

---

## 2. Palette de couleurs

### 2.1 Couleurs de base (dark mode)

| Token | Valeur | Usage |
|---|---|---|
| `--bg-primary` | `#0a0f0d` | Fond principal (noir légèrement vert) |
| `--bg-secondary` | `#111a16` | Cartes, panneaux |
| `--bg-tertiary` | `#1a2620` | Sections surélevées, sidebar |
| `--border` | `#2a3a32` | Bordures subtiles |
| `--text-primary` | `#f0f4f2` | Texte principal |
| `--text-secondary` | `#8a9a92` | Texte secondaire |

### 2.2 Couleurs d'accent

| Token | Valeur | Usage |
|---|---|---|
| `--accent-primary` | `#10b981` (emerald-500) | Boutons, liens, éléments actifs |
| `--accent-gold` | `#f59e0b` (amber-500) | Victoires, champions, récompenses |
| `--accent-danger` | `#ef4444` (red-500) | Erreurs, défaites, blessures |
| `--accent-warning` | `#f97316` (orange-500) | Avertissements, fatigue |
| `--accent-info` | `#3b82f6` (blue-500) | Information, liens secondaires |

### 2.3 Intégration couleurs du club

L'UI doit intégrer les couleurs du club du joueur :
- **Header** : bande subtile de la couleur primaire du club en dessous du header
- **Cartes joueurs** : liseré gauche couleur primaire
- **Terrain tactique** : joueurs en couleur primaire, adversaires en gris
- **Dashboard** : accent color = couleur primaire du club (remplace l'emerald par défaut)

---

## 3. Typographie

### 3.1 Fonts

| Usage | Font | Poids |
|---|---|---|
| Titres / Scores | **Inter** (ou Geist) bold/black | 700-900 |
| Corps | **Inter** regular | 400 |
| Stats / Chiffres | **JetBrains Mono** | 500 |

### 3.2 Échelle

| Token | Taille | Usage |
|---|---|---|
| `text-hero` | 48px | Score de match, overall joueur |
| `text-h1` | 28px | Titre de page |
| `text-h2` | 20px | Titre de section |
| `text-h3` | 16px | Titre de carte |
| `text-body` | 14px | Texte courant |
| `text-sm` | 12px | Labels, metadata |
| `text-xs` | 10px | Timestamps, badges |

---

## 4. Composants enrichis

### 4.1 Carte joueur (remplace les lignes textuelles)

```
┌─ couleur club ─────────────────────────┐
│  [Silhouette]  Nom Prénom    [72 OVR]  │
│                ST · 24 ans    ⚡ 35%    │
│                🟢🟢🔴⚪🟢              │
│                [Forme 5 derniers]       │
└────────────────────────────────────────┘
```

### 4.2 Badges d'état

| Badge | Couleur | Texte |
|---|---|---|
| 🟢 Disponible | emerald | — |
| 🟡 Fatigué | amber | "Fatigué" (>70%) |
| 🔴 Blessé | red | "Blessé (3 matchs)" |
| 🟣 Suspendu | purple | "Suspendu (1 match)" |
| 🔥 En forme | gold | "En forme" (rating >7.5 sur 3 matchs) |

### 4.3 Indicateur de forme (5 derniers matchs)

5 cercles colorés alignés :
- 🟢 Victoire
- ⚪ Nul
- 🔴 Défaite

### 4.4 Stat bar améliorée

```
pace       ████████░░░░░░░░ 72  (+0.3 ↗)
```

- Barre dégradée (rouge → orange → jaune → vert selon la valeur)
- Valeur numérique à droite
- Indicateur de progression optionnel

---

## 5. Animations et transitions

### 5.1 Micro-interactions

| Élément | Animation |
|---|---|
| Carte hover | `scale(1.02)` + légère ombre portée, 200ms ease |
| Bouton click | `scale(0.97)` feedback, 100ms |
| Changement d'onglet | Slide horizontal, 200ms |
| Loading | Ballon qui rebondit (SVG animé) au lieu du spinner |
| Score de but | Flash doré + scale du score, 500ms |
| Victoire | Confetti subtil (petites particules couleur club) |

### 5.2 Transitions de page

- Fade in/out 150ms entre les routes
- Skeleton loading pour les données (au lieu de spinners)

---

## 6. Empty states

Chaque page sans données affiche une illustration contextuelle :

| Page | Illustration | Message |
|---|---|---|
| Squad vide | Terrain vide avec cônes | "Your journey begins! Create your club to get started." |
| Pas de matchs | Calendrier vide | "No matches scheduled yet. Your first matchday is coming!" |
| Pas de transferts | Valise vide | "The transfer market is quiet. Check back soon!" |
| Pas de notifications | Boîte aux lettres | "All caught up! No new messages from your staff." |

---

## 7. Responsive / Mobile

### 7.1 Breakpoints

| Breakpoint | Taille | Layout |
|---|---|---|
| Mobile | < 640px | Stack vertical, bottom nav, cartes pleine largeur |
| Tablet | 640-1024px | Sidebar collapsée (icônes), contenu 2 colonnes |
| Desktop | > 1024px | Sidebar étendue, contenu 2-3 colonnes |

### 7.2 Touch-friendly

- Zones tactiles minimum 44×44px
- Swipe horizontal pour les onglets
- Pull-to-refresh sur les listes
- Long press pour les actions contextuelles
