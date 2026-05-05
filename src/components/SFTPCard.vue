<template>
  <div 
    ref="dropZone"
    class="sftp-card" 
    :class="{ 'drag-over': isDragOver }"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="sftp-header">
      <div class="connection-badge">
        <span class="status-dot"></span>
        <span class="status-text">SFTP</span>
      </div>
      <div class="path-bar">
        <button class="btn-nav" @click="navigateUp" :disabled="currentPath === '/'">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3l-5 4 5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="path-display">
          <span class="path-segment" @click="navigateTo('/')">/</span>
          <template v-for="(segment, index) in pathSegments" :key="index">
            <span class="path-separator">/</span>
            <span class="path-segment" @click="navigateToIndex(index)">{{ segment }}</span>
          </template>
        </div>
      </div>
      <div class="search-bar">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 10l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search files..." 
          class="search-input"
        />
        <button v-if="searchQuery" class="btn-clear-search" @click="searchQuery = ''">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="header-actions">
        <button class="btn-action" @click="refreshFiles" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7a5 5 0 0 1 9-3M12 7a5 5 0 0 1-9 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M11 1v3H8M3 13v-3h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="btn-action" @click="toggleNewFolder" title="New Folder">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h4l2 2h4v6H2V4zM7 7v4M5 9h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="btn-action disconnect" @click="$emit('disconnected')" title="Disconnect">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M6 2H4v10h2M10 2h-2v10h2" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="showNewFolder" class="new-folder-row">
      <div class="file-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 6h6l2 2h10v12H3V6z" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round" fill="rgba(59,130,246,0.1)"/>
        </svg>
      </div>
      <input 
        ref="newFolderInput"
        v-model="newFolderName" 
        type="text" 
        class="new-folder-input" 
        placeholder="Folder name..."
        @keyup.enter="confirmNewFolder"
        @keyup.escape="cancelNewFolder"
      />
      <button class="btn-confirm" @click="confirmNewFolder">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="btn-cancel" @click="cancelNewFolder">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div v-if="dragUploads.length > 0" class="upload-progress-list">
      <div v-for="upload in dragUploads" :key="upload.name" class="upload-item">
        <span class="upload-name">{{ upload.name }}</span>
        <span class="upload-status">{{ upload.status }}</span>
      </div>
    </div>

    <div class="sftp-content" @contextmenu.prevent="hideContextMenu">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Loading...</span>
      </div>
      <div v-else-if="error" class="error-state">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2"/>
          <path d="M8 5v3M8 10v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span>{{ error }}</span>
        <button class="btn-retry" @click="refreshFiles">Retry</button>
      </div>
      <div v-else-if="searchQuery && filteredFiles.length === 0" class="no-results" @contextmenu.prevent.stop="showContextMenu($event)">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="1.2"/>
          <path d="M10 10l4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span>No files matching "{{ searchQuery }}"</span>
      </div>
      <div v-else-if="files.length === 0" class="no-results" @contextmenu.prevent.stop="showContextMenu($event)">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="12" width="32" height="24" rx="4" stroke="#52525b" stroke-width="2"/>
          <path d="M8 28h32" stroke="#52525b" stroke-width="1.5"/>
          <path d="M20 20h8M20 24h8M20 28h5" stroke="#52525b" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Empty folder</span>
        <button class="btn-add-folder" @click="toggleNewFolder">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h4l2 2h4v6H2V4zM7 7v4M5 9h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          New Folder
        </button>
      </div>
      <div v-else class="file-list" @contextmenu.prevent.stop="showContextMenu($event)">
        <div v-if="currentPath !== '/' && !searchQuery" class="file-row parent-row" @click="navigateUp">
          <div class="file-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h6l2 2h10v12H3V6z" stroke="#a1a1aa" stroke-width="1.5" stroke-linejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <span class="file-name">..</span>
          <span class="file-size"></span>
          <span class="file-type">Parent</span>
        </div>

        <div 
          v-for="file in filteredFiles" 
          :key="file.name" 
          class="file-row"
          :class="{ selected: selectedFile === file.name }"
          @click="selectedFile = file.name"
          @dblclick="handleFileAction(file)"
          @contextmenu.prevent.stop="showContextMenu($event, file)"
        >
          <div v-if="renamingFile === file.name" class="rename-inline" @click.stop>
            <div class="file-icon">
              <svg v-if="file.isDirectory" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h6l2 2h10v12H3V6z" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round" fill="rgba(59,130,246,0.08)"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 2h8l4 4v16H6V2z" stroke="#a1a1aa" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M14 2v4h4" stroke="#a1a1aa" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
            <input 
              ref="renameInput"
              v-model="renameValue"
              class="rename-input"
              @keyup.enter="confirmRename(file)"
              @keyup.escape="cancelRename"
            />
            <button class="btn-confirm" @click="confirmRename(file)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="btn-cancel" @click="cancelRename">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <template v-else>
            <div class="file-icon">
              <svg v-if="file.isDirectory" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h6l2 2h10v12H3V6z" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round" fill="rgba(59,130,246,0.08)"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 2h8l4 4v16H6V2z" stroke="#a1a1aa" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M14 2v4h4" stroke="#a1a1aa" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ file.isDirectory ? '—' : formatSize(file.size) }}</span>
            <span class="file-type">{{ file.isDirectory ? 'Folder' : getFileType(file.name) }}</span>
            <div class="file-row-actions">
              <button v-if="!file.isDirectory" class="btn-row" @click.stop="downloadFile(file)" title="Download">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="btn-row more" @click.stop="showContextMenu($event, file)" title="Actions">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="3" r="1" fill="currentColor"/>
                  <circle cx="7" cy="7" r="1" fill="currentColor"/>
                  <circle cx="7" cy="11" r="1" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="sftp-footer">
      <span class="footer-info">
        {{ searchQuery ? `${filteredFiles.length} of ${files.length} items` : `${files.length} items` }}
      </span>
      <span class="footer-path">{{ currentPath }}</span>
    </div>

    <div v-if="isDragOver" class="drop-overlay" @dragover.prevent @dragenter.prevent @drop.prevent>
      <div class="drop-icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 8v18M12 18l8 8 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 28h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <span>Drop files to upload</span>
    </div>

    <div 
      v-if="contextMenu.show" 
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <template v-if="contextMenu.file">
        <div v-if="!contextMenu.file.isDirectory" class="context-item" @click="downloadFile(contextMenu.file)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Download
        </div>
        <div class="context-item" @click="startRename(contextMenu.file)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8 2l4 4-7 7H1v-4l7-7z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          </svg>
          Rename
        </div>
        <div class="context-item" @click="copyFile(contextMenu.file)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M10 4V3a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 2 3v5a1.5 1.5 0 0 0 1.5 1.5H4" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          Copy
        </div>
        <div class="context-divider"></div>
        <div class="context-item danger" @click="confirmDelete(contextMenu.file)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 4h8l-1 8H4L3 4zM5 4V3h4v1" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          Delete
        </div>
      </template>
      <template v-else>
        <div class="context-item" @click="toggleNewFolder">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h4l2 2h4v6H2V4zM7 7v4M5 9h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          New Folder
        </div>
        <div class="context-item" @click="pasteFile" :class="{ disabled: !copiedFile }">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="4" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          Paste
        </div>
      </template>
    </div>
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
})

defineEmits(['disconnected'])

const currentPath = ref('/')
const files = ref([])
const loading = ref(false)
const error = ref(null)
const selectedFile = ref(null)
const isDragOver = ref(false)
const dragUploads = ref([])
const showNewFolder = ref(false)
const newFolderName = ref('')
const newFolderInput = ref(null)
const dropZone = ref(null)
const searchQuery = ref('')
const copiedFile = ref(null)
const contextMenu = ref({ show: false, x: 0, y: 0, file: null })
const renamingFile = ref(null)
const renameValue = ref('')
const renameInput = ref(null)
const confirmDialog = ref(null)

let dragCounter = 0

const pathSegments = computed(() => {
  if (currentPath.value === '/') return []
  return currentPath.value.split('/').filter(Boolean)
})

const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value
  const q = searchQuery.value.toLowerCase()
  return files.value.filter(f => f.name.toLowerCase().includes(q))
})

onMounted(() => {
  loadFiles('/')
  document.addEventListener('dragover', preventDefaults)
  document.addEventListener('drop', preventDefaults)
  document.addEventListener('click', hideContextMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('dragover', preventDefaults)
  document.removeEventListener('drop', preventDefaults)
  document.removeEventListener('click', hideContextMenu)
})

const preventDefaults = (e) => {
  e.preventDefault()
  e.stopPropagation()
}

const showContextMenu = (event, file = null) => {
  event.preventDefault()
  event.stopPropagation()
  const card = event.currentTarget.closest('.sftp-card')
  const cardRect = card ? card.getBoundingClientRect() : { left: 0, top: 0 }
  let x = event.clientX - cardRect.left
  let y = event.clientY - cardRect.top
  
  contextMenu.value = {
    show: true,
    x,
    y,
    file
  }
  
  nextTick(() => {
    const menu = document.querySelector('.sftp-card .context-menu')
    if (menu) {
      const rect = menu.getBoundingClientRect()
      const parentRect = cardRect
      if (x + rect.width > parentRect.width) {
        contextMenu.value.x = x - rect.width
      }
      if (y + rect.height > parentRect.height) {
        contextMenu.value.y = y - rect.height
      }
    }
  })
}

const hideContextMenu = () => {
  contextMenu.value = { show: false, x: 0, y: 0, file: null }
}

const handleDragEnter = (e) => {
  e.preventDefault()
  e.stopPropagation()
  dragCounter++
  isDragOver.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  e.stopPropagation()
  dragCounter--
  if (dragCounter === 0) {
    isDragOver.value = false
  }
}

const handleDragOver = (e) => {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = 'copy'
}

const handleDrop = async (e) => {
  e.preventDefault()
  e.stopPropagation()
  isDragOver.value = false
  dragCounter = 0
  
  const dt = e.dataTransfer
  const items = dt?.items
  const fileList = dt?.files
  
  const filesToUpload = []
  
  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const f = item.getAsFile()
        if (f) {
          filesToUpload.push(f)
        }
      }
    }
  }
  
  if (filesToUpload.length === 0 && fileList && fileList.length > 0) {
    for (const f of fileList) {
      filesToUpload.push(f)
    }
  }
  
  if (filesToUpload.length === 0) {
    error.value = 'No files detected in drop event'
    return
  }
  
  for (const file of filesToUpload) {
    dragUploads.value.push({ name: file.name, status: 'Reading...' })
    
    try {
      const remotePath = currentPath.value === '/' 
        ? '/' + file.name 
        : currentPath.value + '/' + file.name
      
      const arrayBuffer = await file.arrayBuffer()
      dragUploads.value.find(u => u.name === file.name).status = 'Uploading...'
      
      const result = await window.electronAPI.sftpUpload(
        props.session.id, 
        arrayBuffer, 
        remotePath
      )
      
      if (result && result.success) {
        dragUploads.value.find(u => u.name === file.name).status = 'Done'
        refreshFiles()
      } else {
        dragUploads.value.find(u => u.name === file.name).status = result?.error || 'Failed'
      }
    } catch (err) {
      dragUploads.value.find(u => u.name === file.name).status = `Error: ${err.message}`
      error.value = err.message
    }
  }
  
  setTimeout(() => { dragUploads.value = [] }, 4000)
}

const loadFiles = async (path) => {
  loading.value = true
  error.value = null
  try {
    const result = await window.electronAPI.sftpList(props.session.id, path)
    if (result.success) {
      currentPath.value = path
      files.value = result.files
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const navigateUp = () => {
  if (currentPath.value === '/') return
  const parts = currentPath.value.split('/').filter(Boolean)
  parts.pop()
  loadFiles(parts.length ? '/' + parts.join('/') : '/')
}

const navigateTo = (path) => {
  loadFiles(path)
}

const navigateToIndex = (index) => {
  const parts = currentPath.value.split('/').filter(Boolean)
  const newPath = '/' + parts.slice(0, index + 1).join('/')
  loadFiles(newPath)
}

const refreshFiles = () => {
  loadFiles(currentPath.value)
}

const handleFileAction = async (file) => {
  if (file.isDirectory) {
    const newPath = currentPath.value === '/' 
      ? '/' + file.name 
      : currentPath.value + '/' + file.name
    loadFiles(newPath)
  } else {
    await downloadFile(file)
  }
}

const downloadFile = async (file) => {
  hideContextMenu()
  const remotePath = currentPath.value === '/' 
    ? '/' + file.name 
    : currentPath.value + '/' + file.name
  
  try {
    const localPath = `/tmp/${file.name}`
    const result = await window.electronAPI.sftpDownload(props.session.id, remotePath, localPath)
    if (result.success) {
      alert(`Downloaded to: ${localPath}`)
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const toggleNewFolder = async () => {
  showNewFolder.value = !showNewFolder.value
  if (showNewFolder.value) {
    newFolderName.value = ''
    await nextTick()
    newFolderInput.value?.focus()
  }
}

const confirmNewFolder = async () => {
  const name = newFolderName.value.trim()
  if (!name) return
  
  const folderPath = currentPath.value === '/' 
    ? '/' + name 
    : currentPath.value + '/' + name
  
  try {
    const result = await window.electronAPI.sftpMkdir(props.session.id, folderPath)
    if (result.success) {
      showNewFolder.value = false
      refreshFiles()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const cancelNewFolder = () => {
  showNewFolder.value = false
  newFolderName.value = ''
}

const copyFile = (file) => {
  copiedFile.value = { ...file, sourcePath: currentPath.value === '/' ? '/' + file.name : currentPath.value + '/' + file.name }
  hideContextMenu()
}

const pasteFile = async () => {
  if (!copiedFile.value) return
  
  let remotePath = currentPath.value === '/' 
    ? '/' + copiedFile.value.name 
    : currentPath.value + '/' + copiedFile.value.name
  
  if (files.value.some(f => f.name === copiedFile.value.name)) {
    const ext = copiedFile.value.isDirectory ? '' : '.' + copiedFile.value.name.split('.').pop()
    const base = copiedFile.value.isDirectory ? copiedFile.value.name : copiedFile.value.name.split('.').slice(0, -1).join('.')
    let counter = 2
    const newName = copiedFile.value.isDirectory 
      ? `${base} (${counter})` 
      : `${base} (${counter})${ext}`
    remotePath = currentPath.value === '/' 
      ? '/' + newName 
      : currentPath.value + '/' + newName
  }
  
  try {
    const tmpLocal = `/tmp/${Date.now()}_${copiedFile.value.name}`
    const downloadResult = await window.electronAPI.sftpDownload(props.session.id, copiedFile.value.sourcePath, tmpLocal)
    if (downloadResult.success) {
      await window.electronAPI.sftpUpload(props.session.id, tmpLocal, remotePath)
      refreshFiles()
    } else {
      error.value = downloadResult.error
    }
  } catch (err) {
    error.value = err.message
  }
  hideContextMenu()
}

const startRename = (file) => {
  hideContextMenu()
  if (!file) return
  renamingFile.value = file.name
  renameValue.value = file.name
  
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

const confirmRename = async (file) => {
  const newName = renameValue.value.trim()
  if (!newName || newName === file.name) {
    cancelRename()
    return
  }
  
  const oldPath = currentPath.value === '/' ? '/' + file.name : currentPath.value + '/' + file.name
  const newPath = currentPath.value === '/' ? '/' + newName : currentPath.value + '/' + newName
  
  try {
    const res = await window.electronAPI.sftpRename(props.session.id, oldPath, newPath)
    if (res.success) {
      refreshFiles()
    } else {
      error.value = res.error
    }
  } catch (err) {
    error.value = err.message
  }
  cancelRename()
}

const cancelRename = () => {
  renamingFile.value = null
  renameValue.value = ''
}

const confirmDelete = async (file) => {
  hideContextMenu()
  if (!file) return
  
  const type = file.isDirectory ? 'folder' : 'file'
  const confirmed = await confirmDialog.value?.show({
    title: `Delete ${type}`,
    message: `Are you sure you want to delete "${file.name}"? This cannot be undone.`,
    confirmLabel: `Delete ${type}`
  })
  
  if (confirmed) {
    deleteFile(file)
  }
}

const deleteFile = async (file) => {
  hideContextMenu()
  const filePath = currentPath.value === '/' 
    ? '/' + file.name 
    : currentPath.value + '/' + file.name
  
  try {
    const result = await window.electronAPI.sftpDelete(props.session.id, filePath)
    if (result.success) {
      refreshFiles()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getFileType = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  return ext.toUpperCase() + ' File'
}
</script>

<style scoped>
.sftp-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-bg-card, #0f1117);
  border: 1px solid var(--border-primary, #1e2030);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.sftp-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--app-bg-secondary, #13141c);
  border-bottom: 1px solid var(--border-primary, #1e2030);
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--badge-sftp-bg, rgba(139,92,246,0.12));
  border-radius: 20px;
  flex-shrink: 0;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: var(--badge-sftp-text, #a855f7);
  border-radius: 50%;
}

.status-text {
  font-size: 11px;
  font-weight: 500;
  color: var(--badge-sftp-text, #a855f7);
}

.path-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--app-bg-input, #0f1117);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-primary, #1e2030);
  min-width: 0;
}

.btn-nav {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #71717a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  flex-shrink: 0;
}

.btn-nav:hover:not(:disabled) {
  background: var(--app-bg-tertiary, #1e2030);
  color: var(--text-primary, #e4e4e7);
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.path-display {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
}

.path-display::-webkit-scrollbar {
  display: none;
}

.path-segment {
  color: var(--text-primary, #e4e4e7);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.path-segment:hover {
  background: var(--app-bg-tertiary, #1e2030);
}

.path-separator {
  color: var(--text-quaternary, #52525b);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--app-bg-input, #0f1117);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-primary, #1e2030);
  width: 220px;
  flex-shrink: 0;
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--border-focus, #3b82f6);
}

.search-icon {
  color: var(--text-quaternary, #52525b);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary, #e4e4e7);
  font-size: 13px;
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--text-quaternary, #52525b);
}

.btn-clear-search {
  width: 18px;
  height: 18px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #71717a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 0;
  flex-shrink: 0;
}

.btn-clear-search:hover {
  background: var(--app-bg-tertiary, #1e2030);
  color: var(--text-primary, #e4e4e7);
}

.header-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-action {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-tertiary, #71717a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-action:hover {
  background: var(--app-bg-tertiary, #1e2030);
  color: var(--text-secondary, #a1a1aa);
}

.btn-action.disconnect:hover {
  background: var(--accent-danger-bg, rgba(239,68,68,0.12));
  color: var(--accent-danger, #ef4444);
}

.new-folder-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--accent-success-bg, rgba(59,130,246,0.06));
  border-bottom: 1px solid var(--border-primary, #1e2030);
}

.file-icon {
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.new-folder-input {
  flex: 1;
  padding: 6px 10px;
  background: var(--app-bg-input, #13141c);
  border: 1px solid var(--accent-primary, #3b82f6);
  border-radius: 6px;
  color: var(--text-primary, #e4e4e7);
  font-size: 13px;
  outline: none;
}

.btn-confirm,
.btn-cancel {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-confirm {
  color: var(--accent-success, #22c55e);
}

.btn-confirm:hover {
  background: var(--accent-success-bg, rgba(34,197,94,0.15));
}

.btn-cancel {
  color: var(--accent-danger, #ef4444);
}

.btn-cancel:hover {
  background: var(--accent-danger-bg, rgba(239,68,68,0.15));
}

.upload-progress-list {
  background: var(--app-bg-secondary, #13141c);
  border-bottom: 1px solid var(--border-primary, #1e2030);
  max-height: 80px;
  overflow-y: auto;
}

.upload-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 16px;
  font-size: 12px;
}

.upload-name {
  color: var(--text-primary, #e4e4e7);
}

.upload-status {
  color: var(--accent-primary, #3b82f6);
}

.sftp-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  position: relative;
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--text-tertiary, #71717a);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-primary, #1e2030);
  border-top-color: var(--accent-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: var(--accent-danger, #ef4444);
}

.btn-retry {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid var(--accent-danger, #ef4444);
  border-radius: 4px;
  color: var(--accent-danger, #ef4444);
  font-size: 12px;
  cursor: pointer;
}

.btn-retry:hover {
  background: var(--accent-danger-bg, rgba(239,68,68,0.15));
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--text-tertiary, #71717a);
  font-size: 14px;
}

.no-results svg {
  color: var(--text-quaternary, #52525b);
}

.btn-add-folder {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-primary, #1e2030);
  border-radius: 6px;
  color: var(--text-tertiary, #71717a);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-folder:hover {
  background: var(--app-bg-hover, #161822);
  border-color: var(--accent-primary, #3b82f6);
  color: var(--accent-primary, #3b82f6);
}

.file-list {
  padding: 0;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: default;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(30,32,48,0.5);
}

.file-row:hover {
  background: var(--app-bg-hover, #161822);
}

.file-row.selected {
  background: var(--app-bg-tab-active, rgba(59,130,246,0.08));
}

.parent-row {
  opacity: 0.5;
}

.parent-row:hover {
  opacity: 1;
  cursor: pointer;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary, #e4e4e7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.file-size {
  width: 80px;
  text-align: right;
  font-size: 12px;
  color: var(--text-tertiary, #71717a);
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
}

.file-type {
  width: 80px;
  text-align: right;
  font-size: 11px;
  color: var(--text-quaternary, #52525b);
  text-transform: uppercase;
  flex-shrink: 0;
}

.file-row-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.file-row:hover .file-row-actions {
  opacity: 1;
}

.btn-row {
  width: 26px;
  height: 26px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #71717a);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-row:hover {
  background: var(--app-bg-tertiary, #1e2030);
  color: var(--text-primary, #e4e4e7);
}

.btn-row.delete:hover {
  background: var(--accent-danger-bg, rgba(239,68,68,0.15));
  color: var(--accent-danger, #ef4444);
}

.rename-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.rename-input {
  flex: 1;
  padding: 4px 8px;
  background: var(--app-bg-input, #13141c);
  border: 1px solid var(--accent-primary, #3b82f6);
  border-radius: 4px;
  color: var(--text-primary, #e4e4e7);
  font-size: 13px;
  outline: none;
  min-width: 0;
}

.sftp-footer {
  display: flex;
  justify-content: space-between;
  padding: 6px 16px;
  background: var(--app-bg-secondary, #13141c);
  border-top: 1px solid var(--border-primary, #1e2030);
  font-size: 11px;
  color: var(--text-quaternary, #52525b);
}

.drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(59,130,246,0.1);
  border: 2px dashed var(--accent-primary, #3b82f6);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
  color: var(--accent-primary, #3b82f6);
  font-size: 16px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  pointer-events: none;
}

.drop-icon {
  width: 64px;
  height: 64px;
  background: rgba(59,130,246,0.12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.context-menu {
  position: absolute;
  background: var(--app-bg-secondary, #1e2030);
  border: 1px solid var(--border-secondary, #2a2d3d);
  border-radius: 8px;
  padding: 6px;
  min-width: 180px;
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.4));
  z-index: 100;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary, #e4e4e7);
  cursor: pointer;
  transition: background 0.15s;
}

.context-item:hover {
  background: var(--app-bg-hover, rgba(255,255,255,0.08));
}

.context-item.danger {
  color: var(--accent-danger, #ef4444);
}

.context-item.danger:hover {
  background: var(--accent-danger-bg, rgba(239,68,68,0.12));
}

.context-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-divider {
  height: 1px;
  background: var(--border-primary, #1e2030);
  margin: 4px 8px;
}
</style>