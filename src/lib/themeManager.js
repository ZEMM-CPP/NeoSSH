import dark from '../../themes/dark.json'
import darkBlue from '../../themes/dark-blue.json'
import darkGreen from '../../themes/dark-green.json'
import darkRed from '../../themes/dark-red.json'
import light from '../../themes/light.json'

const builtinThemes = [dark, darkBlue, darkGreen, darkRed, light]
const themeMap = Object.fromEntries(builtinThemes.map(t => [t.id, t]))
const STORAGE_KEY = 'neossh-active-theme'

let activeTheme = null
let listeners = []

function getBuiltinThemes() {
  return builtinThemes
}

function getThemeById(id) {
  return themeMap[id] || null
}

function applyTheme(theme) {
  if (!theme?.colors) return
  
  activeTheme = theme
  const root = document.documentElement
  
  const c = theme.colors
  
  for (const [key, value] of Object.entries(c.app)) {
    root.style.setProperty(`--app-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.text)) {
    root.style.setProperty(`--text-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.border)) {
    root.style.setProperty(`--border-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.accent)) {
    root.style.setProperty(`--accent-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.shadow)) {
    root.style.setProperty(`--shadow-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.terminal)) {
    root.style.setProperty(`--terminal-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.terminal.palette)) {
    root.style.setProperty(`--terminal-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.terminal.line)) {
    root.style.setProperty(`--terminal-line-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.scrollbar)) {
    root.style.setProperty(`--scrollbar-${kebab(key)}`, value)
  }
  for (const [key, value] of Object.entries(c.badge)) {
    root.style.setProperty(`--badge-${kebab(key)}`, value)
  }
  
  localStorage.setItem(STORAGE_KEY, theme.id)
  notifyListeners(theme)
}

function getActiveTheme() {
  return activeTheme
}

function loadSavedTheme() {
  const savedId = localStorage.getItem(STORAGE_KEY)
  const theme = savedId ? getThemeById(savedId) : themeMap.dark
  if (theme) applyTheme(theme)
  return theme
}

function onChange(cb) {
  listeners.push(cb)
  return () => { listeners = listeners.filter(l => l !== cb) }
}

function notifyListeners(theme) {
  listeners.forEach(cb => cb(theme))
}

function kebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export default {
  getBuiltinThemes,
  getThemeById,
  applyTheme,
  getActiveTheme,
  loadSavedTheme,
  onChange
}