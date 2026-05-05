<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="brand-icon">⬡</span>
    </div>

    <div class="sidebar-actions">
      <button class="action-btn" @click="$emit('go-home')" title="Home">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M2 7l6-5 6 5v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M6 14V9h4v5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </button>

      <button class="action-btn primary" @click="$emit('add-host')" title="Add Host">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>Add Host</span>
      </button>

      <div class="divider"></div>

      <button class="action-btn" @click="$emit('refresh')" title="Refresh">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8a6 6 0 0 1 11-3M14 8a6 6 0 0 1-11 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M13 2v3h-3M3 14v-3h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <button class="action-btn" @click="$emit('settings')" title="Settings">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6.5 1.5h3l.5 2.5 2.5 1 1.5-1 2.5 2.5-1 1.5 1 2.5-2.5 1-.5 2.5h-3l-.5-2.5-2.5-1-1.5 1-2.5-2.5 1-1.5-1-2.5 2.5-1L6.5 4V1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          <circle cx="8" cy="8" r="1.5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </button>
    </div>

    <div class="sidebar-footer">
      <button class="action-btn help" title="Help">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2"/>
          <path d="M6 6a2 2 0 0 1 4 0c0 1-1 1.5-1 2M8 11v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup>
defineEmits(['go-home', 'add-host', 'refresh', 'settings'])
</script>

<style scoped>
.sidebar {
  width: 64px;
  background: var(--app-bg-sidebar, #0a0b0f);
  border-right: 1px solid var(--border-primary, #1e2030);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.sidebar-header {
  margin-bottom: 20px;
}

.brand-icon {
  font-size: 24px;
  background: linear-gradient(135deg, var(--accent-primary, #3b82f6), var(--accent-secondary, #8b5cf6));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0 8px;
  flex: 1;
}

.divider {
  width: 24px;
  height: 1px;
  background: var(--border-primary, #1e2030);
  margin: 8px 0;
}

.action-btn {
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #71717a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--app-bg-tertiary, #1e2030);
  color: var(--text-primary, #e4e4e7);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--accent-primary, #3b82f6), var(--accent-primary-hover, #2563eb));
  color: white;
  flex-direction: column;
  gap: 2px;
  width: 48px;
  height: 52px;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-primary, 0 4px 12px rgba(59,130,246,0.3));
}

.action-btn.primary span {
  font-size: 9px;
  font-weight: 500;
}

.sidebar-footer {
  padding-top: 12px;
  border-top: 1px solid var(--border-primary, #1e2030);
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: auto;
}

.sidebar-footer .action-btn {
  color: var(--text-quaternary, #52525b);
}
</style>