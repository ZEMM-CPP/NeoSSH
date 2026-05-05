<template>
  <div class="settings-overlay" @click.self="$emit('closed')">
    <div class="settings-drawer">
      <div class="drawer-header">
        <h2>{{ editingHost ? 'Edit Host' : 'Add Host' }}</h2>
        <button class="btn-close" @click="$emit('closed')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="settings-form">
        <div class="form-section">
          <h3 class="section-title">General</h3>
          
          <div class="form-group">
            <label for="label">Display Name</label>
            <input type="text" id="label" v-model="formData.label" placeholder="My Server" />
          </div>

          <div class="form-row">
            <div class="form-group flex-2">
              <label for="ip">Host / IP</label>
              <input type="text" id="ip" v-model="formData.ip" placeholder="192.168.1.100" required />
            </div>
            <div class="form-group flex-1">
              <label for="port">Port</label>
              <input type="number" id="port" v-model.number="formData.port" placeholder="22" required />
            </div>
          </div>

          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" v-model="formData.username" placeholder="root" required />
          </div>

          <div class="form-group">
            <label for="group">Group</label>
            <input type="text" id="group" v-model="formData.group" placeholder="Production" />
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Authentication</h3>
          
          <div class="auth-toggle">
            <button 
              type="button"
              class="auth-btn"
              :class="{ active: formData.authType === 'password' }"
              @click="formData.authType = 'password'"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="6" width="10" height="6" rx="2" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              Password
            </button>
            <button 
              type="button"
              class="auth-btn"
              :class="{ active: formData.authType === 'key' }"
              @click="formData.authType = 'key'"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="5" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/>
                <path d="M7 7l5-5M11 2h2v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              SSH Key
            </button>
          </div>

          <div v-if="formData.authType === 'password'" class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="formData.password" placeholder="Enter password" />
          </div>

          <div v-if="formData.authType === 'key'" class="form-group">
            <label for="privateKey">Private Key Path</label>
            <input type="text" id="privateKey" v-model="formData.privateKey" placeholder="~/.ssh/id_rsa" />
            <p class="hint">Path to your SSH private key file</p>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="$emit('closed')">Cancel</button>
          <button type="submit" class="btn-save">
            {{ editingHost ? 'Save Changes' : 'Connect Host' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  host: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['saved', 'closed'])

const formData = reactive({
  id: '',
  label: '',
  ip: '',
  port: 22,
  username: '',
  group: '',
  authType: 'password',
  password: '',
  privateKey: ''
})

watch(() => props.host, (newVal) => {
  if (newVal) {
    Object.assign(formData, { ...newVal, authType: newVal.privateKey ? 'key' : 'password' })
  } else {
    formData.id = ''
    formData.label = ''
    formData.ip = ''
    formData.port = 22
    formData.username = ''
    formData.group = ''
    formData.authType = 'password'
    formData.password = ''
    formData.privateKey = ''
  }
}, { immediate: true })

const handleSubmit = () => {
  const hostData = { ...formData, id: formData.id || Date.now().toString() }
  emit('saved', hostData)
}
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: flex-end;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.settings-drawer {
  width: 400px;
  height: 100vh;
  background: #0f1117;
  border-left: 1px solid #1e2030;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #1e2030;
}

.drawer-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #f4f4f5;
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

.settings-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.form-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e2030;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #a1a1aa;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  background: #13141c;
  border: 1px solid #1e2030;
  border-radius: 8px;
  color: #e4e4e7;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-group input::placeholder {
  color: #52525b;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-2 { flex: 2; }
.flex-1 { flex: 1; }

.hint {
  font-size: 11px;
  color: #52525b;
  margin-top: 6px;
}

.auth-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.auth-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #13141c;
  border: 1px solid #1e2030;
  border-radius: 8px;
  color: #71717a;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-btn.active {
  background: rgba(59, 130, 246, 0.12);
  border-color: #3b82f6;
  color: #3b82f6;
}

.auth-btn:hover:not(.active) {
  background: #161822;
  border-color: #2a2d3d;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background: #13141c;
  border: 1px solid #1e2030;
  border-radius: 8px;
  color: #a1a1aa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #161822;
  border-color: #2a2d3d;
}

.btn-save {
  flex: 2;
  padding: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}
</style>