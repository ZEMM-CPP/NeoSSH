<template>
  <div class="welcome-page">
    <div class="page-header">
      <div class="brand">
        <span class="brand-icon">⬡</span>
        <h1>Welcome to NeoSSH</h1>
      </div>
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 10l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search hosts..." 
          class="search-input"
        />
        <button v-if="searchQuery" class="btn-clear" @click="searchQuery = ''">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="filteredHosts.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="12" width="32" height="24" rx="4" stroke="#52525b" stroke-width="2"/>
        <path d="M8 28h32" stroke="#52525b" stroke-width="1.5"/>
        <circle cx="16" cy="20" r="2" fill="#52525b"/>
        <path d="M20 32h8" stroke="#52525b" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <h2>No hosts found</h2>
      <p>Add a host to get started</p>
      <button class="btn-add" @click="$emit('add-host')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add Host
      </button>
    </div>

    <div v-else class="host-grid">
      <div 
        v-for="host in filteredHosts" 
        :key="host.id" 
        class="host-card"
      >
        <div class="card-top">
          <div class="host-icon" :class="host.authType === 'key' ? 'key-auth' : 'pass-auth'">
            <svg v-if="host.authType === 'key'" width="18" height="18" viewBox="0 0 14 14" fill="none">
              <circle cx="5" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/>
              <path d="M7 7l5-5M11 2h2v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="6" width="10" height="6" rx="2" stroke="currentColor" stroke-width="1.2"/>
              <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.2"/>
            </svg>
          </div>
          <div class="card-actions">
            <button class="btn-action" @click.stop="$emit('edit-host', host)" title="Edit">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8 2l4 4-7 7H1v-4l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="btn-action delete" @click.stop="handleDeleteHost(host)" title="Delete">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 4h8l-1 8H4L3 4zM5 4V3h4v1" stroke="currentColor" stroke-width="1.2"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="card-body">
          <h3 class="host-name">{{ host.label || host.ip }}</h3>
          <div class="host-meta">
            <span class="meta-ip">{{ host.ip }}</span>
            <span v-if="host.port !== 22" class="meta-port">:{{ host.port }}</span>
          </div>
          <div class="host-user">{{ host.username }}</div>
        </div>
        <div class="card-footer">
          <div class="connection-options">
            <button class="btn-ssh" @click.stop="connect(host, 'terminal')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              SSH
            </button>
            <button class="btn-sftp" @click.stop="connect(host, 'sftp')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M2 7h10M2 10h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              SFTP
            </button>
          </div>
          <div class="card-tags">
            <span v-if="host.group" class="tag">{{ host.group }}</span>
            <span v-if="isHostOnline(host)" class="tag status-connected">Online</span>
            <span v-else class="tag status-disconnected">Offline</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  hosts: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['add-host', 'edit-host', 'delete-host', 'connect'])

const searchQuery = ref('')
const hostStatuses = ref({})

const filteredHosts = computed(() => {
  if (!searchQuery.value) return props.hosts
  const q = searchQuery.value.toLowerCase()
  return props.hosts.filter(h => 
    (h.label || h.ip).toLowerCase().includes(q) ||
    h.username.toLowerCase().includes(q) ||
    (h.group || '').toLowerCase().includes(q)
  )
})

const isHostOnline = (host) => {
  return hostStatuses.value[host.id] === true
}

const pingHosts = async () => {
  const results = {}
  const checks = props.hosts.map(async (host) => {
    try {
      const res = await window.electronAPI.hostCheck({ host: host.ip, port: host.port })
      results[host.id] = res.reachable
    } catch {
      results[host.id] = false
    }
  })
  await Promise.all(checks)
  hostStatuses.value = results
}

watch(() => props.hosts, () => {
  pingHosts()
}, { immediate: false })

onMounted(() => {
  pingHosts()
})

const handleDeleteHost = (host) => {
  emit('delete-host', host.id)
}

const connect = (host, type) => {
  emit('connect', host, type)
}
</script>

<style scoped>
.welcome-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0a0b0f;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 32px 40px 24px;
  border-bottom: 1px solid #1e2030;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-icon {
  font-size: 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand h1 {
  font-size: 28px;
  font-weight: 700;
  color: #f4f4f5;
  margin: 0;
}

.search-box {
  position: relative;
  width: 320px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 38px;
  background: #13141c;
  border: 1px solid #1e2030;
  border-radius: 10px;
  color: #e4e4e7;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.search-input::placeholder {
  color: #52525b;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #52525b;
}

.btn-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-clear:hover {
  background: #1e2030;
  color: #e4e4e7;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px;
}

.empty-state h2 {
  font-size: 20px;
  font-weight: 600;
  color: #a1a1aa;
  margin: 0;
}

.empty-state p {
  color: #71717a;
  margin: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.host-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 24px 40px;
  overflow-y: auto;
  align-content: start;
}

.host-card {
  background: #13141c;
  border: 1px solid #1e2030;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.host-card:hover {
  border-color: #2a2d3d;
  background: #161822;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.host-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.key-auth {
  background: rgba(139, 92, 246, 0.12);
  color: #a855f7;
}

.pass-auth {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.host-card:hover .card-actions {
  opacity: 1;
}

.btn-action {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #1e2030;
  color: #e4e4e7;
}

.btn-action.delete:hover {
  color: #ef4444;
}

.card-body h3 {
  font-size: 16px;
  font-weight: 600;
  color: #f4f4f5;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.host-meta {
  font-size: 13px;
  color: #71717a;
  font-family: 'JetBrains Mono', monospace;
}

.host-user {
  font-size: 13px;
  color: #52525b;
  margin-top: 2px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #1e2030;
}

.connection-options {
  display: flex;
  gap: 6px;
}

.btn-ssh,
.btn-sftp {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #1e2030;
  border-radius: 6px;
  color: #a1a1aa;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ssh:hover {
  background: rgba(59, 130, 246, 0.12);
  border-color: #3b82f6;
  color: #3b82f6;
}

.btn-sftp:hover {
  background: rgba(139, 92, 246, 0.12);
  border-color: #a855f7;
  color: #a855f7;
}

.card-tags {
  display: flex;
  gap: 6px;
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  background: #1e2030;
  color: #a1a1aa;
}

.status-disconnected {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.status-connected {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}
</style>