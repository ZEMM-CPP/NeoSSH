<template>
  <div class="app">
    <TitleBar />
    <div class="app-body">
      <Sidebar
        @go-home="goHome"
        @add-host="openHostDrawer"
        @refresh="refreshHosts"
        @settings="openSettings"
      />

      <main class="main-content">
      <TabBar
        :sessions="sessions"
        :active-session="activeSession"
        @select-session="selectSession"
        @close-session="closeSession"
      />

      <SettingsPage
        v-if="showSettings"
        @close="goHome"
      />

      <WelcomePage
        v-else-if="!activeSession"
        :hosts="hosts"
        @add-host="openHostDrawer"
        @edit-host="openHostDrawer"
        @delete-host="deleteHost"
        @connect="connectToHost"
      />

      <div v-show="!showSettings && sessions.length > 0" class="session-container">
        <KeepAlive>
          <TerminalCard
            v-for="s in terminalSessions"
            :key="s.id"
            :session="s"
            v-show="activeSession?.id === s.id"
            @disconnected="closeSession(s.id)"
          />
        </KeepAlive>
        <KeepAlive>
          <SFTPCard
            v-for="s in sftpSessions"
            :key="s.id"
            :session="s"
            v-show="activeSession?.id === s.id"
            @disconnected="closeSession(s.id)"
          />
        </KeepAlive>
      </div>
    </main>

    <SettingsHostDrawer
      v-if="showHostDrawer"
      :host="editingHost"
      @saved="handleSaveHost"
      @closed="closeHostDrawer"
    />

    <ConfirmDialog ref="confirmDialog" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import TabBar from './components/TabBar.vue'
import WelcomePage from './components/WelcomePage.vue'
import TerminalCard from './components/TerminalCard.vue'
import SFTPCard from './components/SFTPCard.vue'
import SettingsHostDrawer from './components/SettingsHostDrawer.vue'
import SettingsPage from './components/SettingsPage.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import TitleBar from './components/TitleBar.vue'
import themeManager from './lib/themeManager'

const hosts = ref([])
const sessions = ref([])
const activeSession = ref(null)
const showSettings = ref(false)
const showHostDrawer = ref(false)
const editingHost = ref(null)
const confirmDialog = ref(null)

onMounted(async () => {
  hosts.value = await window.electronAPI.loadHosts()
  themeManager.loadSavedTheme()
})

const terminalSessions = computed(() => sessions.value.filter(s => s.type === 'terminal'))
const sftpSessions = computed(() => sessions.value.filter(s => s.type === 'sftp'))

const refreshHosts = async () => {
  hosts.value = await window.electronAPI.loadHosts()
}

const connectToHost = async (host, type = 'terminal') => {
  try {
    const authData = host.authType === 'key' 
      ? { privateKey: host.privateKey } 
      : { password: host.password }

    const result = await window.electronAPI.sshConnect({
      host: host.ip,
      port: host.port,
      username: host.username,
      ...authData
    })
    
    if (result.success) {
      const session = {
        id: result.connectionId,
        hostId: host.id,
        label: host.label || `${host.username}@${host.ip}`,
        host: host.ip,
        username: host.username,
        type,
        connected: true
      }
      sessions.value.push(session)
      activeSession.value = session

      if (type === 'terminal') {
        await window.electronAPI.sshOpenShell(result.connectionId)
      }
    } else {
      alert(`Connection failed: ${result.error}`)
    }
  } catch (error) {
    alert(`Connection error: ${error.message}`)
  }
}

const selectSession = (session) => {
  activeSession.value = session
}

const closeSession = async (sessionId) => {
  const session = sessions.value.find(s => s.id === sessionId)
  if (session) {
    await window.electronAPI.sshDisconnect(sessionId)
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    if (activeSession.value?.id === sessionId) {
      activeSession.value = sessions.value.length > 0 
        ? sessions.value[sessions.value.length - 1] 
        : null
    }
  }
}

const openSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const goHome = () => {
  showSettings.value = false
  activeSession.value = null
}

const openHostDrawer = (host = null) => {
  editingHost.value = host ? { ...host } : null
  showHostDrawer.value = true
}

const closeHostDrawer = () => {
  showHostDrawer.value = false
  editingHost.value = null
}

const editHost = (host) => {
  openHostDrawer(host)
}

const deleteHost = async (hostId) => {
  const host = hosts.value.find(h => h.id === hostId)
  if (!host) return
  
  const name = host.label || `${host.username}@${host.ip}`
  const confirmed = await confirmDialog.value?.show({
    title: 'Delete Host',
    message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
    confirmLabel: 'Delete Host'
  })
  
  if (confirmed) {
    hosts.value = hosts.value.filter(h => h.id !== hostId)
    await window.electronAPI.saveHosts(hosts.value)
  }
}

const handleSaveHost = async (hostData) => {
  const isNewHost = !editingHost.value
  if (isNewHost) {
    hostData.id = Date.now().toString()
    hosts.value = [...hosts.value, hostData]
  } else {
    hosts.value = hosts.value.map(h => h.id === editingHost.value.id ? hostData : h)
  }
  await window.electronAPI.saveHosts(hosts.value)
  closeHostDrawer()
  
  if (isNewHost) {
    await connectToHost(hostData, 'terminal')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
  background: var(--app-bg-primary, #0a0b0f);
  color: var(--text-primary, #e4e4e7);
  overflow: hidden;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--app-bg-primary, #0a0b0f);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--app-bg-primary, #0a0b0f);
}

.session-container {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  position: relative;
}

.session-container :deep(.terminal-card),
.session-container :deep(.sftp-card) {
  position: absolute;
  inset: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>