<template>
  <div class="tab-bar">
    <div class="tabs">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="tab"
        :class="{ active: session.id === activeSession?.id }"
        @click="$emit('select-session', session)"
      >
        <span class="tab-icon">{{ session.type === 'terminal' ? '>' : '≡' }}</span>
        <span class="tab-label">{{ session.label }}</span>
        <button class="tab-close" @click.stop="$emit('close-session', session.id)">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  sessions: {
    type: Array,
    required: true
  },
  activeSession: {
    type: Object,
    default: null
  }
})

defineEmits(['select-session', 'close-session'])
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  background: var(--app-bg-primary, #0a0b0f);
  border-bottom: 1px solid var(--border-primary, #1e2030);
  padding: 0 8px;
  min-height: 44px;
  overflow-x: auto;
}

.tabs {
  display: flex;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: var(--text-tertiary, #71717a);
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
  min-width: 0;
}

.tab:hover {
  color: var(--text-secondary, #a1a1aa);
  background: var(--app-bg-hover, rgba(30,32,48,0.5));
}

.tab.active {
  color: var(--accent-primary, #3b82f6);
  border-bottom-color: var(--accent-primary, #3b82f6);
  background: var(--app-bg-tab-active, rgba(59,130,246,0.08));
}

.tab:hover {
  color: #a1a1aa;
  background: rgba(30, 32, 48, 0.5);
}

.tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
}

.tab-icon {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
}

.tab-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  width: 16px;
  height: 16px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 4px;
  padding: 0;
}

.tab:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: var(--accent-danger-bg, rgba(239,68,68,0.2));
  color: var(--accent-danger, #ef4444);
}
</style>