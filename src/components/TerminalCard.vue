<template>
  <div class="terminal-card">
    <div class="terminal-header">
      <div class="connection-badge">
        <span class="status-dot"></span>
        <span class="status-text">Connected</span>
      </div>
      <div class="session-info">
        <span class="info-label">{{ session.username }}</span>
        <span class="info-separator">@</span>
        <span class="info-host">{{ session.host }}</span>
      </div>
      <div class="header-actions">
        <button class="btn-action" @click="clearTerminal" title="Clear">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 4h8l-1 8H4L3 4zM5 4V3h4v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="btn-action disconnect" @click="$emit('disconnected')" title="Disconnect">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M6 2H4v10h2M10 2h-2v10h2" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </button>
      </div>
    </div>
    <div ref="terminalElement" class="terminal-body"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, onActivated } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
})

defineEmits(['disconnected'])

const terminalElement = ref(null)
let terminal = null
let fitAddon = null
let cleanupHandlers = []

const initTerminal = () => {
  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
    lineHeight: 1.3,
    letterSpacing: 0,
    scrollback: 10000,
    theme: {
      background: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bg').trim() || '#0f1117',
      foreground: getComputedStyle(document.documentElement).getPropertyValue('--terminal-fg').trim() || '#e4e4e7',
      cursor: getComputedStyle(document.documentElement).getPropertyValue('--terminal-cursor').trim() || '#3b82f6',
      cursorAccent: getComputedStyle(document.documentElement).getPropertyValue('--terminal-cursor-accent').trim() || '#0f1117',
      selectionBackground: getComputedStyle(document.documentElement).getPropertyValue('--terminal-selection-background').trim() || 'rgba(59,130,246,0.2)',
      selectionForeground: '#ffffff',
      black: getComputedStyle(document.documentElement).getPropertyValue('--terminal-black').trim() || '#1e2030',
      red: getComputedStyle(document.documentElement).getPropertyValue('--terminal-red').trim() || '#ef4444',
      green: getComputedStyle(document.documentElement).getPropertyValue('--terminal-green').trim() || '#22c55e',
      yellow: getComputedStyle(document.documentElement).getPropertyValue('--terminal-yellow').trim() || '#eab308',
      blue: getComputedStyle(document.documentElement).getPropertyValue('--terminal-blue').trim() || '#3b82f6',
      magenta: getComputedStyle(document.documentElement).getPropertyValue('--terminal-magenta').trim() || '#a855f7',
      cyan: getComputedStyle(document.documentElement).getPropertyValue('--terminal-cyan').trim() || '#06b6d4',
      white: getComputedStyle(document.documentElement).getPropertyValue('--terminal-white').trim() || '#e4e4e7',
      brightBlack: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bright-black').trim() || '#52525b',
      brightRed: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bright-red').trim() || '#f87171',
      brightGreen: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bright-green').trim() || '#4ade80',
      brightYellow: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bright-yellow').trim() || '#facc15',
      brightBlue: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bright-blue').trim() || '#60a5fa',
      brightMagenta: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bright-magenta').trim() || '#c084fc',
      brightCyan: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bright-cyan').trim() || '#22d3ee',
      brightWhite: getComputedStyle(document.documentElement).getPropertyValue('--terminal-bright-white').trim() || '#fafafa',
    },
  })

  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.loadAddon(new WebLinksAddon())
  terminal.open(terminalElement.value)

  terminal.onData((data) => {
    window.electronAPI.terminalWrite(props.session.id, data)
  })

  const dataHandler = ({ connectionId, data }) => {
    if (connectionId === props.session.id && terminal) {
      terminal.write(data)
    }
  }
  window.electronAPI.onTerminalData(dataHandler)
  cleanupHandlers.push(() => window.electronAPI.off?.('terminal:data', dataHandler))

  const closeHandler = ({ connectionId }) => {
    if (connectionId === props.session.id) {
      terminal.write('\r\n[Connection closed]\r\n')
    }
  }
  window.electronAPI.onTerminalClose(closeHandler)
  cleanupHandlers.push(() => window.electronAPI.off?.('terminal:close', closeHandler))

  fitAddon.fit()
}

const handleResize = () => {
  if (fitAddon) {
    fitAddon.fit()
  }
}

const clearTerminal = () => {
  if (terminal) {
    terminal.clear()
  }
}

onMounted(() => {
  initTerminal()
  window.addEventListener('resize', handleResize)
})

onActivated(() => {
  if (fitAddon && terminal) {
    setTimeout(() => fitAddon.fit(), 50)
    terminal.focus()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  cleanupHandlers.forEach(fn => fn())
  if (terminal) {
    terminal.dispose()
  }
})
</script>

<style scoped>
.terminal-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f1117;
  border: 1px solid #1e2030;
  border-radius: 12px;
  overflow: hidden;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #13141c;
  border-bottom: 1px solid #1e2030;
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(34, 197, 94, 0.12);
  border-radius: 20px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 11px;
  font-weight: 500;
  color: #22c55e;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.info-label {
  color: #e4e4e7;
  font-weight: 500;
}

.info-separator {
  color: #52525b;
}

.info-host {
  color: #71717a;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.btn-action {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #71717a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #1e2030;
  color: #a1a1aa;
}

.btn-action.disconnect:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.terminal-body {
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

.terminal-body :deep(.terminal) {
  height: 100%;
}
</style>