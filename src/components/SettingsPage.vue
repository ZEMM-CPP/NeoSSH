<template>
  <div class="settings-page">
    <div class="settings-header">
      <h2>Settings</h2>
      <button class="btn-close" @click="$emit('close')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="settings-body">
      <section class="settings-section">
        <h3 class="section-title">Appearance</h3>
        <p class="section-desc">Choose a theme for NeoSSH. Community themes can be added to the <code>themes/</code> folder.</p>
        
        <div class="theme-grid">
          <div 
            v-for="theme in themes" 
            :key="theme.id" 
            class="theme-card"
            :class="{ active: activeThemeId === theme.id }"
            @click="selectTheme(theme)"
          >
            <div class="theme-preview" :class="theme.type">
              <div class="preview-sidebar"></div>
              <div class="preview-content">
                <div class="preview-bar"></div>
                <div class="preview-cards">
                  <div class="preview-card"></div>
                  <div class="preview-card"></div>
                </div>
              </div>
            </div>
            <div class="theme-info">
              <span class="theme-name">{{ theme.name }}</span>
              <span class="theme-type">{{ theme.type }}</span>
              <svg v-if="activeThemeId === theme.id" class="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3 class="section-title">Color Palette</h3>
        <p class="section-desc">Current theme colors</p>
        
        <div class="palette-preview">
          <div 
            v-for="[key, value] in colorPalette" 
            :key="key" 
            class="palette-item"
          >
            <div class="palette-swatch" :style="{ background: value }"></div>
            <div class="palette-info">
              <span class="palette-label">{{ key }}</span>
              <code class="palette-value">{{ value }}</code>
            </div>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3 class="section-title">About Themes</h3>
        <p class="section-desc">Create custom themes by adding JSON files to the <code>themes/</code> directory in your NeoSSH installation.</p>
        <div class="theme-docs">
          <pre class="code-block">{
  "id": "my-theme",
  "name": "My Theme",
  "author": "Your Name",
  "type": "dark | light",
  "colors": { ... }
}</pre>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import themeManager from '../lib/themeManager'

const emit = defineEmits(['close'])

const themes = ref([])
const activeThemeId = ref('dark')

const themesList = themeManager.getBuiltinThemes()
themes.value = themesList

onMounted(() => {
  const current = themeManager.getActiveTheme()
  if (current) activeThemeId.value = current.id
})

const activeTheme = computed(() => {
  return themesList.find(t => t.id === activeThemeId.value)
})

const colorPalette = computed(() => {
  if (!activeTheme.value?.colors) return []
  const c = activeTheme.value.colors
  return [
    ['bg-primary', c.app['bg-primary']],
    ['bg-secondary', c.app['bg-secondary']],
    ['bg-card', c.app['bg-card']],
    ['bg-sidebar', c.app['bg-sidebar']],
    ['accent-primary', c.accent.primary],
    ['accent-secondary', c.accent.secondary],
    ['accent-success', c.accent.success],
    ['accent-danger', c.accent.danger],
    ['text-primary', c.text.primary],
    ['text-secondary', c.text.secondary],
    ['border-primary', c.border.primary],
    ['terminal-bg', c.terminal.bg],
    ['terminal-cursor', c.terminal.cursor],
  ]
})

const selectTheme = (theme) => {
  themeManager.applyTheme(theme)
  activeThemeId.value = theme.id
}
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-bg-secondary, #0f1117);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-primary, #1e2030);
}

.settings-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary, #f4f4f5);
  margin: 0;
}

.btn-close {
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--border-primary, #1e2030);
  color: var(--text-tertiary, #71717a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--app-bg-tertiary, #1e2030);
  color: var(--text-primary, #e4e4e7);
  border-color: var(--border-secondary, #2a2d3d);
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.settings-section {
  margin-bottom: 40px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #f4f4f5);
  margin: 0 0 8px;
}

.section-desc {
  font-size: 14px;
  color: var(--text-tertiary, #71717a);
  margin: 0 0 20px;
  line-height: 1.5;
}

.section-desc code {
  background: var(--app-bg-tertiary, #1e2030);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary, #a1a1aa);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.theme-card {
  background: var(--app-bg-card, #13141c);
  border: 2px solid var(--border-primary, #1e2030);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-card:hover {
  border-color: var(--border-secondary, #2a2d3d);
  transform: translateY(-2px);
}

.theme-card.active {
  border-color: var(--accent-primary, #3b82f6);
  box-shadow: 0 0 0 3px var(--accent-primary, #3b82f6);
}

.theme-preview {
  height: 120px;
  display: flex;
  overflow: hidden;
}

.theme-preview.dark {
  background: #0a0b0f;
}

.theme-preview.dark-blue {
  background: #0f172a;
}

.theme-preview.dark-green {
  background: #0a1a0f;
}

.theme-preview.dark-red {
  background: #1a0a0a;
}

.theme-preview.light {
  background: #ffffff;
}

.preview-sidebar {
  width: 30px;
  border-right: 1px solid rgba(128,128,128,0.2);
  flex-shrink: 0;
}

.preview-content {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-bar {
  height: 6px;
  border-radius: 3px;
  opacity: 0.4;
}

.preview-cards {
  display: flex;
  gap: 4px;
  flex: 1;
}

.preview-card {
  flex: 1;
  border-radius: 4px;
  opacity: 0.2;
}

/* Dark preview colors */
.theme-preview.dark .preview-sidebar { background: #0a0b0f; }
.theme-preview.dark .preview-content { background: #0f1117; }
.theme-preview.dark .preview-bar { background: #1e2030; }
.theme-preview.dark .preview-card { background: #13141c; }

.theme-preview.dark-blue .preview-sidebar { background: #0c1322; }
.theme-preview.dark-blue .preview-content { background: #0c1a2e; }
.theme-preview.dark-blue .preview-bar { background: #1e3a5f; }
.theme-preview.dark-blue .preview-card { background: #1e293b; }

.theme-preview.dark-green .preview-sidebar { background: #07130a; }
.theme-preview.dark-green .preview-content { background: #070f0a; }
.theme-preview.dark-green .preview-bar { background: #1e3322; }
.theme-preview.dark-green .preview-card { background: #142618; }

.theme-preview.dark-red .preview-sidebar { background: #110606; }
.theme-preview.dark-red .preview-content { background: #0d0505; }
.theme-preview.dark-red .preview-bar { background: #3b1a1e; }
.theme-preview.dark-red .preview-card { background: #2a1215; }

.theme-preview.light .preview-sidebar { background: #f8fafc; }
.theme-preview.light .preview-content { background: #ffffff; }
.theme-preview.light .preview-bar { background: #e2e8f0; }
.theme-preview.light .preview-card { background: #f1f5f9; }

.theme-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--border-primary, #1e2030);
}

.theme-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #e4e4e7);
  flex: 1;
}

.theme-type {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-quaternary, #52525b);
  background: var(--app-bg-tertiary, #1e2030);
  padding: 2px 6px;
  border-radius: 4px;
}

.check-icon {
  color: var(--accent-primary, #3b82f6);
}

.palette-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--app-bg-tertiary, #1e2030);
  padding: 6px 10px;
  border-radius: 8px;
}

.palette-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border-secondary, #2a2d3d);
  flex-shrink: 0;
}

.palette-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.palette-label {
  font-size: 11px;
  color: var(--text-tertiary, #71717a);
}

.palette-value {
  font-size: 11px;
  color: var(--text-secondary, #a1a1aa);
  font-family: 'JetBrains Mono', monospace;
}

.theme-docs {
  background: var(--app-bg-tertiary, #1e2030);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

.code-block {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary, #a1a1aa);
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>