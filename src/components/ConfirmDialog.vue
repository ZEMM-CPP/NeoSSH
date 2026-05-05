<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="visible" class="confirm-overlay" @click.self="onCancel">
        <div class="confirm-dialog">
          <div class="confirm-icon danger">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 6h10l-2 18H8L6 6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M12 6V4h8v2" stroke="currentColor" stroke-width="2"/>
              <path d="M16 12v7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="16" cy="23" r="1" fill="currentColor"/>
            </svg>
          </div>
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="onCancel">
              Cancel
            </button>
            <button class="btn-confirm danger" @click="onConfirm" autofocus>
              {{ confirmLabel || 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

const visible = ref(false)
const title = ref('')
const message = ref('')
const confirmLabel = ref('')
let resolveFn = null

const show = (options = {}) => {
  title.value = options.title || 'Confirm'
  message.value = options.message || 'Are you sure?'
  confirmLabel.value = options.confirmLabel || 'Delete'
  visible.value = true
  return new Promise((resolve) => {
    resolveFn = resolve
  })
}

const onConfirm = () => {
  visible.value = false
  resolveFn?.(true)
}

const onCancel = () => {
  visible.value = false
  resolveFn?.(false)
}

onBeforeUnmount(() => {
  resolveFn?.(false)
})

defineExpose({ show })
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  background: var(--app-bg-secondary, #13141c);
  border: 1px solid var(--border-primary, #1e2030);
  border-radius: 16px;
  padding: 32px;
  width: 400px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg, 0 12px 40px rgba(0, 0, 0, 0.5));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.confirm-icon.danger {
  background: var(--accent-danger-bg, rgba(239, 68, 68, 0.12));
  color: var(--accent-danger, #ef4444);
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #e4e4e7);
  margin: 0 0 8px;
}

.confirm-message {
  font-size: 14px;
  color: var(--text-tertiary, #71717a);
  margin: 0 0 28px;
  line-height: 1.5;
}

.confirm-message strong {
  color: var(--text-primary, #e4e4e7);
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-cancel {
  background: transparent;
  border-color: var(--border-primary, #1e2030);
  color: var(--text-tertiary, #71717a);
}

.btn-cancel:hover {
  background: var(--app-bg-hover, #161822);
  color: var(--text-primary, #e4e4e7);
  border-color: var(--border-secondary, #2a2d3d);
}

.btn-confirm {
  background: var(--accent-danger, #ef4444);
  color: white;
}

.btn-confirm:hover {
  background: #dc2626;
  box-shadow: 0 4px 12px var(--accent-danger-bg, rgba(239, 68, 68, 0.3));
}

.btn-confirm.danger {
  background: var(--accent-danger, #ef4444);
}

.btn-confirm.danger:hover {
  background: #dc2626;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: all 0.2s ease;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}

.confirm-enter-from .confirm-dialog,
.confirm-leave-to .confirm-dialog {
  transform: scale(0.95) translateY(8px);
}
</style>
