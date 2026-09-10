import { calculatorApp } from './calculator'
import { communicationApps } from './communications'
import { creationApps } from './creation'
import { discoveryApps } from './discovery'
import { entertainmentApps } from './entertainment'
import { homeUtilityApps } from './home-utilities'
import { createAppIcon } from './icons'
import { internetApps } from './internet'
import { mediaCaptureApps } from './media-capture'
import { notesApp } from './notes'
import { productivityApps } from './productivity'
import { systemApps } from './system'
import type { AppInstance, PhoneApp } from './types'
import { wellnessApps } from './wellness'
import './style.css'

// Keep app state in memory, but deactivate resources when its screen is hidden.
const apps: PhoneApp[] = [
  ...communicationApps,
  ...internetApps,
  ...productivityApps,
  ...mediaCaptureApps,
  ...entertainmentApps,
  ...wellnessApps,
  ...homeUtilityApps,
  ...creationApps,
  ...discoveryApps,
  ...systemApps,
  calculatorApp,
  notesApp,
]
export const SCREEN_WIDTH = 1000
export const SCREEN_HEIGHT = 704

const dockIds = ['phone', 'safari', 'messages', 'mail', 'music', 'photos', 'camera', 'settings']
const darkApps = new Set(['calculator', 'clock', 'camera', 'facetime', 'weather', 'tv', 'fitness', 'watch', 'wallet', 'home', 'compass', 'measure', 'stocks', 'magnifier', 'voice-memos'])
const statusSymbols = `
  <svg class="phone-signal" viewBox="0 0 20 14" aria-hidden="true"><path d="M1 10h3v4H1zm5-3h3v7H6zm5-3h3v10h-3zm5-4h3v14h-3z" fill="currentColor"/></svg>
  <svg class="phone-wifi" viewBox="0 0 20 15" aria-hidden="true"><path d="M1.5 4.2a13 13 0 0 1 17 0M4.5 7.5a8.5 8.5 0 0 1 11 0M7.5 10.8a4 4 0 0 1 5 0" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><circle cx="10" cy="13.5" r="1.3" fill="currentColor"/></svg>
  <svg class="phone-battery" viewBox="0 0 28 14" aria-hidden="true"><rect x=".5" y="1" width="24" height="12" rx="3.4" fill="none" stroke="currentColor" opacity=".4"/><rect x="2.5" y="3" width="20" height="8" rx="1.5" fill="currentColor"/><path d="M26 4.5v5a2.5 2.5 0 0 0 0-5" fill="currentColor" opacity=".5"/></svg>
`

export function createAppShell() {
  const element = document.createElement('div')
  element.className = 'phone-software'
  element.setAttribute('aria-label', 'Phone apps')
  element.innerHTML = `
    <div class="phone-half phone-left">
      <header class="phone-status"><time></time><span class="phone-connection">${statusSymbols}</span></header>
      <div class="phone-left-content"></div>
      <button class="phone-home" type="button" aria-label="Home"><span class="phone-home-indicator"></span></button>
    </div>
    <div class="phone-half phone-right">
      <header class="phone-status"><time></time><span class="phone-connection">${statusSymbols}</span></header>
      <div class="phone-right-content"></div>
      <button class="phone-home" type="button" aria-label="Home"><span class="phone-home-indicator"></span></button>
    </div>
  `
  const halves = [...element.querySelectorAll<HTMLElement>('.phone-half')]
  const left = element.querySelector<HTMLElement>('.phone-left-content')!
  const right = element.querySelector<HTMLElement>('.phone-right-content')!
  const homeButtons = element.querySelectorAll<HTMLButtonElement>('.phone-home')
  const instances = new Map<string, AppInstance>()
  let active: AppInstance | null = null
  let lastAppId: string | null = null
  let surfaceVisible = true
  let activeRunning = false

  function deactivate() {
    if (!activeRunning) return
    activeRunning = false
    active?.onDeactivate?.()
  }
  function syncActivation() {
    if (!surfaceVisible || document.hidden) { deactivate(); return }
    if (active && !activeRunning) {
      activeRunning = true
      active.onActivate?.()
    }
  }
  function setVisible(visible: boolean) {
    surfaceVisible = visible
    syncActivation()
  }
  function updateStatus() {
    const now = new Date()
    for (const time of element.querySelectorAll<HTMLTimeElement>('.phone-status time')) {
      time.dateTime = now.toISOString()
      time.textContent = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' })
        .formatToParts(now).filter(part => part.type !== 'dayPeriod').map(part => part.value).join('').trim()
    }
    for (const connection of element.querySelectorAll<HTMLElement>('.phone-connection')) {
      connection.classList.toggle('is-offline', !navigator.onLine)
      connection.title = navigator.onLine ? 'Browser reports a network connection. Cellular and battery symbols are illustrative.' : 'Browser reports no network connection. Cellular and battery symbols are illustrative.'
      connection.setAttribute('aria-label', connection.title)
    }
  }
  function applyPreferences(value: unknown) {
    if (!value || typeof value !== 'object') return
    const prefs = value as Record<string, unknown>
    element.dataset.prefDark = String(prefs.darkMode === true)
    element.dataset.largeText = String(prefs.largeText === true)
    element.dataset.reduceMotion = String(prefs.reduceMotion === true)
    const brightness = typeof prefs.brightness === 'number' && Number.isFinite(prefs.brightness)
      ? Math.max(10, Math.min(100, prefs.brightness)) : 100
    element.style.setProperty('--phone-dim', String(1 - brightness / 100))
    element.dispatchEvent(new Event('phone-request-paint'))
  }
  function loadPreferences() {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('duo-system-settings') ?? 'null')
      if (saved && typeof saved === 'object' && 'prefs' in saved) applyPreferences(saved.prefs)
      else applyPreferences({})
    } catch (error) {
      console.error('Unable to load phone appearance preferences; saved data was not changed.', error)
    }
  }
  window.addEventListener('duo:preferences-change', event => {
    if (event instanceof CustomEvent) applyPreferences(event.detail)
  })
  window.addEventListener('storage', event => {
    if (event.key === 'duo-system-settings' || event.key === null) loadPreferences()
  })
  document.addEventListener('visibilitychange', () => { syncActivation(); updateStatus() })
  window.addEventListener('pagehide', deactivate)
  window.addEventListener('pageshow', syncActivation)
  window.addEventListener('online', updateStatus)
  window.addEventListener('offline', updateStatus)
  window.setInterval(() => { if (surfaceVisible && !document.hidden) updateStatus() }, 1000)
  loadPreferences()
  updateStatus()

  function openApp(app: PhoneApp) {
    deactivate()
    let instance = instances.get(app.id)
    if (!instance) { instance = app.create(); instances.set(app.id, instance) }
    active = instance
    lastAppId = app.id
    element.dataset.app = app.id
    element.dataset.appearance = darkApps.has(app.id) ? 'dark' : 'light'
    left.replaceChildren(instance.left)
    right.replaceChildren(instance.right)
    left.setAttribute('aria-label', `${app.name} navigation`)
    right.setAttribute('aria-label', app.name)
    homeButtons.forEach(button => { button.hidden = false })
    syncActivation()
    const heading = instance.left.querySelector<HTMLElement>('h2') ?? instance.right.querySelector<HTMLElement>('h2')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }
  function appButton(app: PhoneApp) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'phone-app-icon'
    button.dataset.appId = app.id
    button.setAttribute('aria-label', `Open ${app.name}`)
    const label = document.createElement('span')
    label.className = 'phone-app-label'
    label.textContent = app.name
    button.append(createAppIcon(app), label)
    button.addEventListener('click', () => openApp(app))
    return button
  }
  function showSearch() {
    right.innerHTML = `
      <section class="phone-search-panel" aria-label="Search apps">
        <div class="phone-search-bar">
          <label><span class="visually-hidden">Search apps</span><input type="search" placeholder="Search" autocomplete="off" spellcheck="false"></label>
          <button type="button">Cancel</button>
        </div>
        <h2>Apps</h2>
        <nav class="phone-search-results" aria-label="Search results"></nav>
        <p class="phone-search-empty" hidden>No Results</p>
      </section>
    `
    const input = right.querySelector('input')!
    const results = right.querySelector('nav')!
    function filter() {
      const matches = apps.filter(app => app.name.toLowerCase().includes(input.value.trim().toLowerCase()))
      results.replaceChildren(...matches.map(appButton))
      right.querySelector<HTMLElement>('.phone-search-empty')!.hidden = matches.length > 0
    }
    input.addEventListener('input', filter)
    right.querySelector('button')!.addEventListener('click', () => showHome())
    filter()
    input.focus({ preventScroll: true })
  }
  function showHome(focus = true) {
    deactivate()
    active = null
    element.dataset.app = 'launcher'
    element.dataset.appearance = 'dark'
    left.setAttribute('aria-label', 'Home Screen')
    right.setAttribute('aria-label', 'Home Screen')
    homeButtons.forEach(button => { button.hidden = true })
    const gridApps = apps.filter(app => !dockIds.includes(app.id))
    for (const [index, pane] of [left, right].entries()) {
      pane.innerHTML = `
        <nav class="phone-app-grid" aria-label="Apps"></nav>
        <button class="phone-search" type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>Search</button>
        <nav class="phone-dock" aria-label="Dock"></nav>
      `
      const grid = pane.querySelector('.phone-app-grid')!
      const dock = pane.querySelector('.phone-dock')!
      grid.replaceChildren(...gridApps.slice(index * 20, (index + 1) * 20).map(appButton))
      for (const id of dockIds.slice(index * 4, index * 4 + 4)) {
        const app = apps.find(app => app.id === id)
        if (app) dock.append(appButton(app))
      }
      pane.querySelector('.phone-search')!.addEventListener('click', showSearch)
    }
    if (focus) {
      const previous = [...element.querySelectorAll<HTMLButtonElement>('[data-app-id]')].find(button => button.dataset.appId === lastAppId)
      ;(previous ?? left.querySelector('button'))?.focus({ preventScroll: true })
    }
  }
  homeButtons.forEach(button => button.addEventListener('click', () => showHome()))
  element.addEventListener('duo:open-app', event => {
    if (!(event instanceof CustomEvent) || typeof event.detail?.name !== 'string') return
    const name = event.detail.name.trim().toLowerCase()
    const app = apps.find(candidate => candidate.id === name || candidate.name.toLowerCase() === name)
    if (!app) { console.error(`Phone app not found: ${event.detail.name}`); return }
    event.preventDefault()
    openApp(app)
  })
  for (const name of ['pointerdown', 'pointerup', 'click', 'dblclick', 'wheel']) {
    element.addEventListener(name, event => {
      if ((name === 'pointerdown' || name === 'pointerup') && element.closest('canvas')?.dataset.navigationPan === 'true') return
      event.stopPropagation()
    })
  }
  element.addEventListener('keydown', event => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      if (active || right.querySelector('.phone-search-panel')) { event.preventDefault(); showHome() }
    } else if (active?.onKey?.(event)) event.preventDefault()
  })
  showHome(false)
  return { element, halves, showHome, setVisible }
}
