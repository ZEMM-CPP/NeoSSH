# NeoSSH

![Installer](https://github.com/ZEMM-CPP/NeoSSH/releases/tag/v1.0.0)

Client SSH/SFTP moderne et open-source pour Linux, macOS et Windows. Conçu comme une alternative légère à Termius, avec support complet hors-ligne et un système de thèmes personnalisable.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Licence](https://img.shields.io/badge/license-MIT-green)

---

## Fonctionnalités

- **Terminal SSH en temps réel** propulsé par xterm.js avec streaming via IPC
- **Navigateur SFTP** avec upload par drag-and-drop, téléchargement, renommage, copie et suppression
- **Onglets multi-sessions** avec persistance du buffer lors du changement d'onglet
- **Gestion des hôtes** stockée en JSON local (pas de cloud, pas de compte)
- **Authentification** par mot de passe ou clé SSH
- **Détection de connectivité** — affiche les hôtes Online/Offline via un ping TCP
- **Barre de titre personnalisée** avec fenêtre sans bordure (frameless)
- **Système de thèmes** — 5 thèmes intégrés, ajoutez les vôtres en JSON
- **Menus contextuels** pour les fichiers SFTP et les zones vides
- **Dialogues de confirmation** pour les actions destructives
- **100% hors-ligne** — aucune télémétrie, aucun service cloud
- **Paquets multi-plateformes** — `.deb`, `.tar.gz`, `.exe`, `.dmg`

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Desktop | Electron 28 |
| Frontend | Vue.js 3 (Composition API) |
| Build | Vite 5 |
| Terminal | xterm.js 5 + FitAddon + WebLinksAddon |
| SSH | ssh2 1.15 |
| Moteur de thèmes | Variables CSS + configuration JSON |

---

## Démarrage rapide

### Prérequis

- Node.js >= 18
- npm >= 9
- Outils de compilation (`make`, `g++`, `python3` — généralement pré-installés)

### Développement

```bash
npm install
npm run dev
```

### Compilation

**Linux .deb (Debian, Ubuntu, Mint) :**
```bash
./build-deb.sh
```

**Linux .tar.gz (portable, toutes distributions) :**
```bash
./build-tar.sh
```

**Windows .exe (fonctionne sur Linux avec Wine, ou sur Windows) :**
```bash
./build-exe.sh
```

**macOS .dmg (doit être exécuté sur macOS) :**
```bash
./build-dmg.sh
```

**Ou via les scripts npm :**
```bash
npm run build        # plateforme courante
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux (.deb + .tar.gz)
```

### Installation

**Debian/Ubuntu :**
```bash
sudo dpkg -i dist/neossh_*.deb
sudo apt install -f   # corrige les dépendances manquantes
```

**Portable (toutes distributions) :**
```bash
tar xzf dist/neossh-*.tar.gz
./NeoSSH/neossh
```

---

## Structure du projet

```
NeoSSH/
├── electron/
│   ├── main.js              # Processus principal : fenêtre, IPC, gestion des hôtes
│   └── preload.js           # Context bridge : expose electronAPI au renderer
├── core/
│   └── sshManager.js        # Connexions SSH, canaux SFTP, ping de connectivité
├── src/
│   ├── components/
│   │   ├── App.vue              # Layout racine : barre de titre, sidebar, vues
│   │   ├── TitleBar.vue         # Barre de titre personnalisée avec contrôles fenêtre
│   │   ├── Sidebar.vue          # Rail de navigation (Accueil, Ajouter, Rafraîchir, Paramètres)
│   │   ├── TabBar.vue           # Barre d'onglets de session (SSH/SFTP)
│   │   ├── WelcomePage.vue      # Écran d'accueil : grille d'hôtes, recherche, statut online/offline
│   │   ├── TerminalCard.vue     # Terminal xterm.js avec couleurs issues du thème
│   │   ├── SFTPCard.vue         # Navigateur SFTP : navigation, recherche, drag-drop, menu contextuel
│   │   ├── SettingsPage.vue     # Galerie de thèmes, palette de couleurs, documentation
│   │   ├── SettingsHostDrawer.vue  # Formulaire d'ajout/édition d'hôte (panneau latéral)
│   │   └── ConfirmDialog.vue    # Modal de confirmation (API basée sur Promise)
│   ├── lib/
│   │   └── themeManager.js      # Moteur de thèmes : chargement, application, injection CSS
│   ├── App.vue                  # Layout principal + gestion de l'état
│   └── main.js                  # Point d'entrée Vue
├── themes/
│   ├── dark.json                # Défaut : tons sombres neutres
│   ├── dark-blue.json           # Bleu océan profond, accents ciel
│   ├── dark-green.json          # Vert forêt, tons terreux
│   ├── dark-red.json            # Rouge cramoisi, accents chauds
│   └── light.json               # Blanc propre, palette grise moderne
├── build-deb.sh                 # Script de compilation .deb
├── build-tar.sh                 # Script de compilation .tar.gz
├── build-exe.sh                 # Script de compilation .exe
├── build-dmg.sh                 # Script de compilation .dmg
├── index.html
├── vite.config.js
└── package.json
```

---

## Architecture

### Modèle de processus

```
┌─────────────────────────────────────────────────────────────┐
│                      Processus principal                     │
│  ┌───────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ BrowserWindow │  │ Gestionnaires   │  │ SSHManager    │  │
│  │ (frameless)   │◄─┤ IPC (invoke/    │◄─┤ (client ssh2) │  │
│  │               │  │  send)          │  │               │  │
│  └───────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ contextBridge
┌─────────────────────────┴───────────────────────────────────┐
│                     Processus renderer                       │
│  ┌───────────┐  ┌────────────┐  ┌───────────┐  ┌──────────┐ │
│  │ App.vue   │  │ TitleBar   │  │ Sidebar    │  │ TabBar   │ │
│  │ (état)    │  │ (contrôles)│  │ (nav)      │  │ (onglets)│ │
│  └───────────┘  └────────────┘  └───────────┘  └──────────┘ │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ WelcomePage.vue     │  │ TerminalCard.vue / SFTPCard  │  │
│  │ (grille + ping)     │  │ (vues de session, KeepAlive) │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ SettingsPage.vue │ ConfirmDialog │ SettingsHostDrawer    │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Streaming du terminal

Le terminal utilise des **événements IPC** (et non `invoke`/`réponse`) pour ne pas bloquer :

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
  Le shell stream reçoit l'entrée
       │
       ▼
  Le stream émet 'data'
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

### Gestion des sessions

Les sessions sont stockées comme des refs réactives dans `App.vue`. Les cartes Terminal et SFTP sont enveloppées dans des composants `<KeepAlive>` séparés avec un basculement `v-show`, ce qui préserve le buffer xterm.js et l'état SFTP lors du changement d'onglet.

---

## Système de thèmes

NeoSSH utilise un système de **variables CSS** piloté par des fichiers JSON. L'interface entière référence des variables de thème — aucune couleur codée en dur dans les composants.

### Fonctionnement

1. Les **fichiers de thème** (`themes/*.json`) définissent toutes les couleurs dans une structure imbriquée
2. **`themeManager.js`** lit le thème, convertit les clés camelCase en kebab-case et les injecte comme variables CSS sur `:root`
3. **Tous les composants** utilisent `var(--app-bg-primary)`, `var(--text-primary)`, etc.
4. **Le terminal** lit les variables CSS calculées pour construire son thème xterm.js

### Espaces de noms des variables CSS

| Espace | Rôle | Exemples |
|--------|------|----------|
| `--app-*` | Couleurs de surface | `bg-primary`, `bg-secondary`, `bg-card`, `bg-sidebar`, `bg-hover`, `bg-input` |
| `--text-*` | Hiérarchie du texte | `primary`, `secondary`, `tertiary`, `quaternary`, `disabled` |
| `--border-*` | Bordures et anneaux | `primary`, `secondary`, `focus`, `ring` |
| `--accent-*` | Couleurs interactives | `primary`, `success`, `success-bg`, `danger`, `danger-bg`, `warning`, `info` |
| `--shadow-*` | Ombres | `sm`, `md`, `lg`, `glow-primary`, `glow-danger` |
| `--terminal-*` | Couleurs du terminal | `bg`, `fg`, `cursor`, palette 16 couleurs complète |
| `--scrollbar-*` | Style de la barre de défilement | `track`, `thumb`, `thumbHover` |
| `--badge-*` | Badges de statut | `online-bg`, `online-text`, `offline-bg`, `offline-text`, `sftp-bg`, `sftp-text` |

### Structure d'un fichier de thème

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
      "palette": {
        "black": "#1e2030", "red": "#ef4444", "green": "#22c55e",
        "yellow": "#eab308", "blue": "#3b82f6", "magenta": "#a855f7",
        "cyan": "#06b6d4", "white": "#e4e4e7"
      }
    },
    "scrollbar": { "track": "...", "thumb": "...", "thumbHover": "..." },
    "badge": { "online-bg": "...", "online-text": "...", "offline-bg": "...", "offline-text": "..." }
  }
}
```

### Ajouter un thème personnalisé

1. Créez un fichier JSON dans `themes/` suivant la structure ci-dessus
2. Importez-le dans `src/lib/themeManager.js`
3. Ajoutez-le au tableau `builtinThemes`

Le thème apparaît dans la galerie des Paramètres et persiste entre les redémarrages via `localStorage`.

### Thèmes intégrés

| Thème | ID | Type | Description |
|-------|-----|------|-------------|
| **Dark** | `dark` | sombre | Tons sombres neutres, accent bleu |
| **Dark Blue** | `dark-blue` | sombre | Bleu océan profond, accent ciel |
| **Dark Green** | `dark-green` | sombre | Vert forêt, accents émeraude |
| **Dark Red** | `dark-red` | sombre | Rouge cramoisi, accents chauds |
| **Light** | `light` | clair | Blanc propre, palette grise moderne |

---

## Référence de l'API IPC

### Terminal

| Canal | Direction | Description |
|-------|-----------|-------------|
| `terminal:write` | renderer → main | Envoie l'entrée utilisateur au shell |
| `terminal:resize` | renderer → main | Redimensionne le terminal (colonnes/lignes) |
| `terminal:data` | main → renderer | Stream la sortie du shell vers xterm |
| `terminal:close` | main → renderer | Notifie la fermeture de la connexion |

### SSH

| Canal | Type | Description |
|-------|------|-------------|
| `ssh:connect` | invoke | Établit une connexion SSH (mot de passe ou clé) |
| `ssh:openShell` | invoke | Ouvre un shell interactif pour la session terminal |
| `ssh:disconnect` | invoke | Ferme la connexion et nettoie |

### SFTP

| Canal | Type | Description |
|-------|------|-------------|
| `sftp:list` | invoke | Liste le contenu d'un répertoire |
| `sftp:download` | invoke | Télécharge un fichier distant vers un chemin local |
| `sftp:upload` | invoke | Upload un buffer vers un chemin distant |
| `sftp:delete` | invoke | Supprime un fichier ou dossier distant |
| `sftp:mkdir` | invoke | Crée un répertoire distant |

### Gestion des hôtes

| Canal | Type | Description |
|-------|------|-------------|
| `hosts:load` | invoke | Charge les hôtes depuis `hosts.json` |
| `hosts:save` | invoke | Sauvegarde les hôtes dans `hosts.json` |
| `host:check` | invoke | Vérification TCP de connectivité (online/offline) |

### Fenêtre

| Canal | Type | Description |
|-------|------|-------------|
| `window:minimize` | send | Minimise la fenêtre |
| `window:maximize` | send | Bascule maximiser/restaurer |
| `window:close` | send | Ferme l'application |
| `window:isMaximized` | invoke | Récupère l'état de maximisation |

---

## Licence

MIT
