<template>
  <div class="titlebar" @dblclick="onDoubleClick">
    <div class="titlebar-drag-area"></div>
    <div class="titlebar-brand">
      <span class="brand-icon">⬡</span>
      <span class="brand-name">NeoSSH</span>
    </div>
    <div class="titlebar-controls">
      <button class="control-btn" @click="minimize" title="Minimize">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="control-btn" @click="maximize" :title="isMaximized ? 'Restore' : 'Maximize'">
        <svg v-if="!isMaximized" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 3.5h8v6.5H2z" stroke="currentColor" stroke-width="1.2"/>
          <path d="M3.5 2h6.5v6.5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </button>
      <button class="control-btn close-btn" @click="closeWindow" title="Close">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isMaximized = ref(false)

onMounted(async () => {
  isMaximized.value = await window.electronAPI.windowIsMaximized()
})

const minimize = () => {
  window.electronAPI.windowMinimize()
}

const maximize = () => {
  isMaximized.value = !isMaximized.value
  window.electronAPI.windowMaximize()
}

const closeWindow = () => {
  window.electronAPI.windowClose()
}

const onDoubleClick = () => {
  maximize()
}
</script>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  height: 38px;
  background: var(--app-bg-secondary, #13141c);
  border-bottom: 1px solid var(--border-primary, #1e2030);
  position: relative;
  user-select: none;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.titlebar-drag-area {
  position: absolute;
  inset: 0;
  -webkit-app-region: drag;
  pointer-events: none;
}

.titlebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  pointer-events: none;
}

.brand-icon {
  font-size: 16px;
  background: linear-gradient(135deg, var(--accent-primary, #3b82f6), var(--accent-purple, #8b5cf6));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #a1a1aa);
}

.titlebar-controls {
  display: flex;
  align-items: center;
  height: 100%;
  margin-left: auto;
  -webkit-app-region: no-drag;
  pointer-events: auto;
}

.control-btn {
  width: 46px;
  height: 38px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #71717a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.control-btn:hover {
  background: var(--app-bg-hover, rgba(255, 255, 255, 0.06));
  color: var(--text-primary, #e4e4e7);
}

.control-btn:active {
  background: var(--app-bg-active, rgba(255, 255, 255, 0.1));
}

.close-btn:hover {
  background: var(--accent-danger, #ef4444);
  color: white;
}

.close-btn:active {
  background: #dc2626;
}
</style>
