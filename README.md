# NeoSSH

A modern, open-source SSH/SFTP client built with Electron, Vue.js, and Node.js. Designed as a lightweight alternative to Termius, with full offline support and a customizable theme system.

![NeoSSH](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-linux-lightgrey)

---

## Features

- **Real-time SSH terminal** powered by xterm.js with streaming I/O via IPC
- **SFTP file browser** with drag-and-drop upload, download, rename, copy/paste, and delete
- **Multiple session tabs** with KeepAlive for seamless switching
- **Host management** stored locally as JSON (no cloud, no login)
- **Password & SSH key** authentication
- **Host reachability ping** — shows Online/Offline status via TCP check
- **Custom title bar** with minimize/maximize/close, frameless window
- **Theme system** — 5 built-in themes, add your own via JSON
- **Context menus** for both SFTP files and empty areas
- **Confirmation dialogs** for destructive actions (delete hosts/files)
- **100% offline** — no cloud dependencies, no telemetry
- **Linux `.deb` packaging**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 28 |
| Frontend | Vue.js 3 (Composition API) |
| Build | Vite 5 |
| Terminal | xterm.js 5 + FitAddon + WebLinksAddon |
| SSH | ssh2 1.15 |
| Theme engine | CSS custom properties + JSON config |

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build          # Vite build + electron-builder .deb
npm run build:deb      # Same as above
npm run preview        # Preview production build
```

Output: `dist/neossh_1.0.0_amd64.deb`

---

## Project Structure

```
NeoSSH/
├── electron/
│   ├── main.js              # Main process: window, IPC handlers, host CRUD
│   └── preload.js           # Context bridge: exposes electronAPI to renderer
├── core/
│   └── sshManager.js        # SSH connections, SFTP channels, host reachability
├── src/
│   ├── components/
│   │   ├── App.vue              # Root layout: TitleBar, Sidebar, TabBar, views
│   │   ├── TitleBar.vue         # Custom draggable title bar with window controls
│   │   ├── Sidebar.vue          # Navigation rail (Home, Add Host, Refresh, Settings)
│   │   ├── TabBar.vue           # Session tab strip (SSH/SFTP tabs)
│   │   ├── WelcomePage.vue      # Home screen: host grid, search, online/offline status
│   │   ├── TerminalCard.vue     # xterm.js terminal with theme-aware colors
│   │   ├── SFTPCard.vue         # SFTP file browser: nav, search, drag-drop, context menu
│   │   ├── SettingsPage.vue     # Theme gallery, color palette, docs
│   │   ├── SettingsHostDrawer.vue  # Host add/edit form (slide-out drawer)
│   │   ├── ConfirmDialog.vue    # Themed confirmation modal (promise-based API)
│   │   └── SessionPicker.vue    # Legacy session picker (unused, kept for reference)
│   ├── lib/
│   │   └── themeManager.js      # Theme engine: load, apply, CSS variable injection
│   ├── App.vue                  # Main layout + state management
│   └── main.js                  # Vue app entry point
├── themes/
│   ├── dark.json                # Default: neutral dark tones
│   ├── dark-blue.json           # Deep ocean blue with navy accents
│   ├── dark-green.json          # Forest green with earthy tones
│   ├── dark-red.json            # Crimson dark with warm red accents
│   └── light.json               # Clean light theme
├── index.html
├── vite.config.js
└── package.json
```

---

## Architecture

### Process Model

```
┌─────────────────────────────────────────────────────────────┐
│                        Main Process                          │
│  ┌───────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ BrowserWindow │  │ IPC Handlers    │  │ SSHManager    │  │
│  │ (frameless)   │◄─┤ (invoke/send)   │◄─┤ (ssh2 Client) │  │
│  └───────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ contextBridge
┌─────────────────────────┴───────────────────────────────────┐
│                       Renderer Process                       │
│  ┌───────────┐  ┌────────────┐  ┌───────────┐  ┌──────────┐ │
│  │ App.vue   │  │ TitleBar   │  │ Sidebar    │  │ TabBar   │ │
│  │ (state)   │  │ (controls) │  │ (nav)      │  │ (tabs)   │ │
│  └───────────┘  └────────────┘  └───────────┘  └──────────┘ │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ WelcomePage.vue     │  │ TerminalCard.vue / SFTPCard  │  │
│  │ (host grid + ping)  │  │ (session views, KeepAlive)   │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ SettingsPage.vue │ ConfirmDialog │ SettingsHostDrawer    │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Terminal Streaming

Terminal I/O uses **IPC events** (not `invoke`/`response`) to avoid blocking:

```
User types in xterm.js
       │
       ▼
  terminal:write (ipcRenderer.send)
       │
       ▼
  SSHManager.write(connectionId, data)
       │
       ▼
  shell stream receives input
       │
       ▼
  stream emits 'data'
       │
       ▼
  event.sender.send('terminal:data', ...)
       │
       ▼
  ipcRenderer.on('terminal:data') → terminal.write(data)
```

### SFTP Flow

SFTP reuses the same SSH connection — `getSFTP()` opens an SFTP channel on demand and caches it per connection:

```
SFTPCard.vue  ─invoke→  main.js  ─call→  SSHManager.sftpList/Download/Upload/Delete/Mkdir
```

### Session Management

Sessions are stored as reactive refs in `App.vue`. Terminal and SFTP cards are wrapped in separate `<KeepAlive>` components with `v-show` toggling, preserving xterm.js buffer and SFTP state when switching between tabs.

---

## Theme Architecture

NeoSSH uses a **CSS custom property** system driven by JSON theme files. The entire UI references theme variables — no hardcoded colors in components.

### How It Works

1. **Theme files** (`themes/*.json`) define all colors in a nested structure
2. **`themeManager.js`** reads the theme, converts camelCase keys to kebab-case, and injects them as CSS variables on `:root`
3. **All components** reference `var(--app-bg-primary)`, `var(--text-primary)`, etc.
4. **Terminal** reads computed CSS variables to build its xterm.js theme object

### CSS Variable Namespaces

| Namespace | Purpose | Examples |
|-----------|---------|----------|
| `--app-*` | Surface colors | `bg-primary`, `bg-secondary`, `bg-card`, `bg-sidebar`, `bg-hover`, `bg-input`, `bg-tab-active` |
| `--text-*` | Text hierarchy | `primary`, `secondary`, `tertiary`, `quaternary`, `disabled`, `inverse` |
| `--border-*` | Borders & rings | `primary`, `secondary`, `tertiary`, `focus`, `ring` |
| `--accent-*` | Interactive colors | `primary`, `primary-hover`, `success`, `success-bg`, `danger`, `danger-bg`, `warning`, `info` |
| `--shadow-*` | Box shadows | `sm`, `md`, `lg`, `glow-primary`, `glow-danger` |
| `--terminal-*` | Terminal colors | `bg`, `fg`, `cursor`, `cursorAccent`, `selectionBackground`, full 16-color palette, `line-hover`, `line-active` |
| `--scrollbar-*` | Scrollbar styling | `track`, `thumb`, `thumbHover` |
| `--badge-*` | Status badges | `online-bg`, `online-text`, `offline-bg`, `offline-text`, `sftp-bg`, `sftp-text` |

### Theme File Structure

```json
{
  "id": "my-theme",
  "name": "My Theme",
  "author": "Your Name",
  "version": "1.0.0",
  "description": "Description of the theme",
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

### Adding a Custom Theme

1. Create a JSON file in `themes/` following the structure above
2. Import it in `src/lib/themeManager.js`
3. Add it to the `builtinThemes` array

The theme is then available in the Settings page gallery and persists across restarts via `localStorage`.

### Built-in Themes

| Theme | ID | Type | Description |
|-------|-----|------|-------------|
| **Dark** | `dark` | dark | Neutral dark tones, blue accent |
| **Dark Blue** | `dark-blue` | dark | Deep ocean blue, sky blue accent |
| **Dark Green** | `dark-green` | dark | Forest green, emerald accent |
| **Dark Red** | `dark-red` | dark | Crimson dark, warm red accent |
| **Light** | `light` | light | Clean white, modern gray palette |

---

## IPC API Reference

### Terminal

| Channel | Direction | Description |
|---------|-----------|-------------|
| `terminal:write` | renderer → main | Send user input to shell |
| `terminal:resize` | renderer → main | Resize terminal cols/rows |
| `terminal:data` | main → renderer | Stream shell output to xterm |
| `terminal:close` | main → renderer | Notify connection closed |

### SSH

| Channel | Type | Description |
|---------|------|-------------|
| `ssh:connect` | invoke | Establish SSH connection (password or key) |
| `ssh:openShell` | invoke | Open interactive shell for terminal session |
| `ssh:disconnect` | invoke | Close connection and cleanup |

### SFTP

| Channel | Type | Description |
|---------|------|-------------|
| `sftp:list` | invoke | List directory contents |
| `sftp:download` | invoke | Download remote file to local path |
| `sftp:upload` | invoke | Upload buffer to remote path |
| `sftp:delete` | invoke | Delete remote file or folder |
| `sftp:mkdir` | invoke | Create remote directory |

### Host Management

| Channel | Type | Description |
|---------|------|-------------|
| `hosts:load` | invoke | Load hosts from `hosts.json` |
| `hosts:save` | invoke | Save hosts to `hosts.json` |
| `host:check` | invoke | TCP reachability check (online/offline) |

### Window

| Channel | Type | Description |
|---------|------|-------------|
| `window:minimize` | send | Minimize window |
| `window:maximize` | send | Toggle maximize/restore |
| `window:close` | send | Close application |
| `window:isMaximized` | invoke | Get maximize state |

---

## License

MIT
