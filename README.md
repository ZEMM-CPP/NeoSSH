# NeoSSH

Un client SSH/SFTP moderne et open-source, construit avec Electron, Vue.js et Node.js. Conçu comme une alternative légère à Termius, avec un support hors-ligne complet et un système de thèmes personnalisables.

![NeoSSH](https://img.shields.io/badge/version-1.0.0-blue)
![Licence](https://img.shields.io/badge/licence-MIT-green)
![Plateforme](https://img.shields.io/badge/plateforme-linux-lightgrey)

---

## Fonctionnalités

- **Terminal SSH en temps réel** propulsé par xterm.js avec diffusion I/O via IPC
- **Navigateur de fichiers SFTP** avec glisser-déposer pour l'envoi, le téléchargement, le renommage, le copier/coller et la suppression
- **Onglets de session multiples** avec KeepAlive pour une navigation fluide
- **Gestion des hôtes** stockée localement en JSON (pas de cloud, pas de connexion requise)
- **Authentification** par mot de passe et par clé SSH
- **Vérification de disponibilité des hôtes** — affiche le statut En ligne/Hors ligne via vérification TCP
- **Barre de titre personnalisée** avec boutons réduire/agrandir/fermer, fenêtre sans bordure
- **Système de thèmes** — 5 thèmes intégrés, ajoutez les vôtres via JSON
- **Menus contextuels** pour les fichiers SFTP et les zones vides
- **Dialogues de confirmation** pour les actions destructives (suppression d'hôtes/fichiers)
- **100% hors-ligne** — aucune dépendance cloud, aucune télémétrie
- **Packaging Linux `.deb`**

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Bureau | Electron 28 |
| Frontend | Vue.js 3 (Composition API) |
| Build | Vite 5 |
| Terminal | xterm.js 5 + FitAddon + WebLinksAddon |
| SSH | ssh2 1.15 |
| Moteur de thèmes | Propriétés CSS personnalisées + configuration JSON |

---

## Démarrage Rapide

### Prérequis

- Node.js >= 18
- npm >= 9

### Développement

```bash
npm install
npm run dev
```

### Build

```bash
npm run build          # Build Vite + paquet electron-builder .deb
npm run build:deb      # Identique à ce qui précède
npm run preview        # Prévisualiser le build de production
```

Sortie : `dist/neossh_1.0.0_amd64.deb`

---

## Structure du Projet

```
NeoSSH/
├── electron/
│   ├── main.js              # Processus principal : fenêtre, gestionnaires IPC, CRUD hôtes
│   └── preload.js           # Pont de contexte : expose electronAPI au renderer
├── core/
│   └── sshManager.js        # Connexions SSH, canaux SFTP, disponibilité des hôtes
├── src/
│   ├── components/
│   │   ├── App.vue              # Mise en page racine : TitleBar, Sidebar, TabBar, vues
│   │   ├── TitleBar.vue         # Barre de titre déplaçable avec contrôles de fenêtre
│   │   ├── Sidebar.vue          # Rail de navigation (Accueil, Ajouter hôte, Actualiser, Paramètres)
│   │   ├── TabBar.vue           # Barre d'onglets de session (onglets SSH/SFTP)
│   │   ├── WelcomePage.vue      # Écran d'accueil : grille d'hôtes, recherche, statut en ligne/hors ligne
│   │   ├── TerminalCard.vue     # Terminal xterm.js avec couleurs adaptées au thème
│   │   ├── SFTPCard.vue         # Navigateur SFTP : navigation, recherche, glisser-déposer, menu contextuel
│   │   ├── SettingsPage.vue     # Galerie de thèmes, palette de couleurs, documentation
│   │   ├── SettingsHostDrawer.vue  # Formulaire d'ajout/édition d'hôte (tiroir coulissant)
│   │   ├── ConfirmDialog.vue    # Modal de confirmation thématisée (API basée sur les promesses)
│   │   └── SessionPicker.vue    # Sélecteur de session historique (inutilisé, conservé pour référence)
│   ├── lib/
│   │   └── themeManager.js      # Moteur de thèmes : chargement, application, injection de variables CSS
│   ├── App.vue                  # Mise en page principale + gestion d'état
│   └── main.js                  # Point d'entrée de l'application Vue
├── themes/
│   ├── dark.json                # Défaut : tons sombres neutres
│   ├── dark-blue.json           # Bleu océan profond avec accents marine
│   ├── dark-green.json          # Vert forêt avec tons terreux
│   ├── dark-red.json            # Sombre cramoisi avec accents rouge chaud
│   └── light.json               # Thème clair et épuré
├── index.html
├── vite.config.js
└── package.json
```

---

## Architecture

### Modèle de Processus

```
┌─────────────────────────────────────────────────────────────┐
│                     Processus Principal                      │
│  ┌───────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ BrowserWindow │  │ Gestionnaires   │  │ SSHManager    │  │
│  │ (sans bordure)│◄─┤ IPC             │◄─┤ (Client ssh2) │  │
│  └───────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ contextBridge
┌─────────────────────────┴───────────────────────────────────┐
│                     Processus Renderer                       │
│  ┌───────────┐  ┌────────────┐  ┌───────────┐  ┌──────────┐ │
│  │ App.vue   │  │ TitleBar   │  │ Sidebar    │  │ TabBar   │ │
│  │ (état)    │  │ (contrôles)│  │ (nav)      │  │ (onglets)│ │
│  └───────────┘  └────────────┘  └───────────┘  └──────────┘ │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ WelcomePage.vue     │  │ TerminalCard.vue / SFTPCard  │  │
│  │ (grille hôtes+ping) │  │ (vues de session, KeepAlive) │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ SettingsPage.vue │ ConfirmDialog │ SettingsHostDrawer    │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Diffusion du Terminal

Les E/S du terminal utilisent des **événements IPC** (et non `invoke`/`response`) pour éviter le blocage :

```
L'utilisateur tape dans xterm.js
       │
       ▼
  terminal:write (ipcRenderer.send)
       │
       ▼
  SSHManager.write(connectionId, data)
       │
       ▼
  Le flux shell reçoit les données
       │
       ▼
  Le flux émet 'data'
       │
       ▼
  event.sender.send('terminal:data', ...)
       │
       ▼
  ipcRenderer.on('terminal:data') → terminal.write(data)
```

### Flux SFTP

Le SFTP réutilise la même connexion SSH — `getSFTP()` ouvre un canal SFTP à la demande et le met en cache par connexion :

```
SFTPCard.vue  ─invoke→  main.js  ─appel→  SSHManager.sftpList/Download/Upload/Delete/Mkdir
```

### Gestion des Sessions

Les sessions sont stockées en tant que refs réactives dans `App.vue`. Les cartes Terminal et SFTP sont enveloppées dans des composants `<KeepAlive>` séparés avec basculement `v-show`, préservant le buffer xterm.js et l'état SFTP lors des changements d'onglets.

---

## Architecture des Thèmes

NeoSSH utilise un système de **propriétés CSS personnalisées** piloté par des fichiers de thème JSON. L'intégralité de l'interface référence des variables de thème — aucune couleur codée en dur dans les composants.

### Fonctionnement

1. Les **fichiers de thème** (`themes/*.json`) définissent toutes les couleurs dans une structure imbriquée
2. **`themeManager.js`** lit le thème, convertit les clés camelCase en kebab-case, et les injecte comme variables CSS sur `:root`
3. **Tous les composants** référencent `var(--app-bg-primary)`, `var(--text-primary)`, etc.
4. Le **terminal** lit les variables CSS calculées pour construire son objet de thème xterm.js

### Espaces de Noms des Variables CSS

| Espace de noms | Utilité | Exemples |
|----------------|---------|----------|
| `--app-*` | Couleurs de surface | `bg-primary`, `bg-secondary`, `bg-card`, `bg-sidebar`, `bg-hover`, `bg-input`, `bg-tab-active` |
| `--text-*` | Hiérarchie du texte | `primary`, `secondary`, `tertiary`, `quaternary`, `disabled`, `inverse` |
| `--border-*` | Bordures et contours | `primary`, `secondary`, `tertiary`, `focus`, `ring` |
| `--accent-*` | Couleurs interactives | `primary`, `primary-hover`, `success`, `success-bg`, `danger`, `danger-bg`, `warning`, `info` |
| `--shadow-*` | Ombres portées | `sm`, `md`, `lg`, `glow-primary`, `glow-danger` |
| `--terminal-*` | Couleurs du terminal | `bg`, `fg`, `cursor`, `cursorAccent`, `selectionBackground`, palette 16 couleurs complète, `line-hover`, `line-active` |
| `--scrollbar-*` | Style de la barre de défilement | `track`, `thumb`, `thumbHover` |
| `--badge-*` | Badges de statut | `online-bg`, `online-text`, `offline-bg`, `offline-text`, `sftp-bg`, `sftp-text` |

### Structure d'un Fichier de Thème

```json
{
  "id": "mon-theme",
  "name": "Mon Thème",
  "author": "Votre Nom",
  "version": "1.0.0",
  "description": "Description du thème",
  "type": "dark",
  "colors": {
    "app": { ... },
    "text": { ... },
    "border": { ... },
    "accent": { ... },
    "shadow": { ... },
    "terminal": {
      "bg": "#0f1117",
      "fg": "#e4e4e7",
      "cursor": "#3b82f6",
      "cursorAccent": "#0f1117",
      "selectionBackground": "rgba(59,130,246,0.2)",
      "selectionForeground": "#ffffff",
      "line": { "hover": "...", "active": "..." },
      "palette": {
        "black": "#1e2030", "red": "#ef4444", "green": "#22c55e",
        "yellow": "#eab308", "blue": "#3b82f6", "magenta": "#a855f7",
        "cyan": "#06b6d4", "white": "#e4e4e7",
        "brightBlack": "#52525b", "brightRed": "#f87171", "brightGreen": "#4ade80",
        "brightYellow": "#facc15", "brightBlue": "#60a5fa", "brightMagenta": "#c084fc",
        "brightCyan": "#22d3ee", "brightWhite": "#fafafa"
      }
    },
    "scrollbar": { "track": "...", "thumb": "...", "thumbHover": "..." },
    "badge": { "online-bg": "...", "online-text": "...", "offline-bg": "...", "offline-text": "...", "sftp-bg": "...", "sftp-text": "..." }
  }
}
```

### Ajouter un Thème Personnalisé

1. Créez un fichier JSON dans `themes/` en suivant la structure ci-dessus
2. Importez-le dans `src/lib/themeManager.js`
3. Ajoutez-le au tableau `builtinThemes`

Le thème est alors disponible dans la galerie de la page Paramètres et persiste entre les redémarrages via `localStorage`.

### Thèmes Intégrés

| Thème | ID | Type | Description |
|-------|-----|------|-------------|
| **Sombre** | `dark` | dark | Tons sombres neutres, accent bleu |
| **Sombre Bleu** | `dark-blue` | dark | Bleu océan profond, accent bleu ciel |
| **Sombre Vert** | `dark-green` | dark | Vert forêt, accent émeraude |
| **Sombre Rouge** | `dark-red` | dark | Sombre cramoisi, accent rouge chaud |
| **Clair** | `light` | light | Blanc épuré, palette gris moderne |

---

## Référence de l'API IPC

### Terminal

| Canal | Direction | Description |
|-------|-----------|-------------|
| `terminal:write` | renderer → main | Envoyer les saisies utilisateur au shell |
| `terminal:resize` | renderer → main | Redimensionner les colonnes/lignes du terminal |
| `terminal:data` | main → renderer | Diffuser la sortie du shell vers xterm |
| `terminal:close` | main → renderer | Notifier la fermeture de la connexion |

### SSH

| Canal | Type | Description |
|-------|------|-------------|
| `ssh:connect` | invoke | Établir une connexion SSH (mot de passe ou clé) |
| `ssh:openShell` | invoke | Ouvrir un shell interactif pour la session terminal |
| `ssh:disconnect` | invoke | Fermer la connexion et nettoyer |

### SFTP

| Canal | Type | Description |
|-------|------|-------------|
| `sftp:list` | invoke | Lister le contenu d'un répertoire |
| `sftp:download` | invoke | Télécharger un fichier distant vers un chemin local |
| `sftp:upload` | invoke | Envoyer un buffer vers un chemin distant |
| `sftp:delete` | invoke | Supprimer un fichier ou dossier distant |
| `sftp:mkdir` | invoke | Créer un répertoire distant |

### Gestion des Hôtes

| Canal | Type | Description |
|-------|------|-------------|
| `hosts:load` | invoke | Charger les hôtes depuis `hosts.json` |
| `hosts:save` | invoke | Sauvegarder les hôtes dans `hosts.json` |
| `host:check` | invoke | Vérification TCP de disponibilité (en ligne/hors ligne) |

### Fenêtre

| Canal | Type | Description |
|-------|------|-------------|
| `window:minimize` | send | Réduire la fenêtre |
| `window:maximize` | send | Basculer agrandir/restaurer |
| `window:close` | send | Fermer l'application |
| `window:isMaximized` | invoke | Obtenir l'état agrandi |

---

## Licence

MIT
