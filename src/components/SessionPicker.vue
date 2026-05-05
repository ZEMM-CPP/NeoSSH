<template>
  <div class="session-picker">
    <div class="picker-header">
      <h2>New Session</h2>
      <button class="btn-close" @click="$emit('cancel')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
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
        autofocus 
      />
    </div>

    <div v-if="connecting" class="connecting-state">
      <div class="spinner"></div>
      <span>Connecting to {{ connectingHost?.label || connectingHost?.ip }}...</span>
    </div>

    <div v-else class="host-grid">
      <div 
        v-for="host in filteredHosts" 
        :key="host.id" 
        class="host-card"
      >
        <div class="host-header">
          <div class="host-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M2 12h16" stroke="currentColor" stroke-width="1.2"/>
              <circle cx="6" cy="8" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div class="host-info">
            <div class="host-name">{{ host.label || host.ip }}</div>
            <div class="host-meta">
              <span>{{ host.username }}@{{ host.ip }}</span>
              <span v-if="host.port !== 22">:{{ host.port }}</span>
              <span v-if="host.group" class="group-badge">{{ host.group }}</span>
            </div>
          </div>
        </div>
        <div class="host-actions">
          <button class="btn-connect ssh" @click="connect(host, 'terminal')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            SSH
          </button>
          <button class="btn-connect sftp" @click="connect(host, 'sftp')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M2 7h10M2 10h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            SFTP
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  hosts: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['cancel', 'connect'])

const searchQuery = ref('')
const connecting = ref(false)
const connectingHost = ref(null)

const filteredHosts = computed(() => {
  if (!searchQuery.value) return props.hosts
  const q = searchQuery.value.toLowerCase()
  return props.hosts.filter(h => 
    (h.label || h.ip).toLowerCase().includes(q) ||
    h.username.toLowerCase().includes(q) ||
    (h.group || '').toLowerCase().includes(q)
  )
})

const connect = async (host, type) => {
  connectingHost.value = host
  connecting.value = true
  await emit('connect', host, type)
  connecting.value = false
  connectingHost.value = null
}
</script>

<style scoped>
.session-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f1117;
  padding: 20px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.picker-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #f4f4f5;
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #1e2030;
  color: #e4e4e7;
}

.search-box {
  position: relative;
  margin-bottom: 24px;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  background: #13141c;
  border: 1px solid #1e2030;
  border-radius: 8px;
  color: #e4e4e7;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-box input:focus {
  border-color: #3b82f6;
}

.search-box input::placeholder {
  color: #52525b;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #52525b;
}

.connecting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
  color: #71717a;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #1e2030;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.host-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
}

.host-card {
  background: #13141c;
  border: 1px solid #1e2030;
  border-radius: 10px;
  padding: 14px;
  transition: all 0.2s;
}

.host-card:hover {
  border-color: #2a2d3d;
  background: #161822;
}

.host-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.host-icon {
  width: 40px;
  height: 40px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  flex-shrink: 0;
}

.host-info {
  min-width: 0;
  flex: 1;
}

.host-name {
  font-size: 15px;
  font-weight: 500;
  color: #e4e4e7;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.host-meta {
  font-size: 12px;
  color: #71717a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-badge {
  background: #1e2030;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: #a1a1aa;
}

.host-actions {
  display: flex;
  gap: 8px;
}

.btn-connect {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: transparent;
  border: 1px solid #1e2030;
  border-radius: 6px;
  color: #a1a1aa;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-connect.ssh:hover {
  background: rgba(59, 130, 246, 0.12);
  border-color: #3b82f6;
  color: #3b82f6;
}

.btn-connect.sftp:hover {
  background: rgba(139, 92, 246, 0.12);
  border-color: #a855f7;
  color: #a855f7;
}
</style>