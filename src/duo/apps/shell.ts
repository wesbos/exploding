import { calculatorApp } from './calculator'
import { notesApp } from './notes'
import type { AppInstance, PhoneApp } from './types'
import './style.css'

// App instances stay mounted in memory when returning home.
const apps: PhoneApp[] = [calculatorApp, notesApp]
export const SCREEN_WIDTH = 1000
export const SCREEN_HEIGHT = 704

export function createAppShell() {
  const element = document.createElement('div')
  element.className = 'phone-software'
  element.setAttribute('aria-label', 'Phone apps')
  element.innerHTML = `
    <div class="phone-half phone-left">
      <header class="phone-status"><span>9:41</span><span>DUO</span></header>
      <button class="phone-home" type="button" aria-label="Home">Home</button>
      <div class="phone-left-content"></div>
      <footer class="phone-footer">DESIGNED TO UNFOLD.</footer>
    </div>
    <div class="phone-half phone-right">
      <header class="phone-status"><span class="phone-app-title">Home</span><span aria-label="Battery full">100% <i class="phone-battery"></i></span></header>
      <div class="phone-right-content"></div>
      <div class="phone-home-indicator" aria-hidden="true"></div>
    </div>
  `
  const halves = [...element.querySelectorAll<HTMLElement>('.phone-half')]
  const left = element.querySelector<HTMLElement>('.phone-left-content')!
  const right = element.querySelector<HTMLElement>('.phone-right-content')!
  const home = element.querySelector<HTMLButtonElement>('.phone-home')!
  const title = element.querySelector<HTMLElement>('.phone-app-title')!
  const instances = new Map<string, AppInstance>()
  let active: AppInstance | null = null

  function openApp(app: PhoneApp) {
    let instance = instances.get(app.id)
    if (!instance) { instance = app.create(); instances.set(app.id, instance) }
    active = instance
    element.dataset.app = app.id
    left.replaceChildren(instance.left)
    right.replaceChildren(instance.right)
    title.textContent = app.name
    home.hidden = false
    instance.right.querySelector('button')?.focus({ preventScroll: true })
  }
  function showHome(focus = true) {
    active = null
    element.dataset.app = 'home'
    title.textContent = 'Home'
    home.hidden = true
    left.innerHTML = `
      <section class="phone-welcome">
        <p class="phone-eyebrow">YOUR EVERYDAY, UNFOLDED</p>
        <h2>A little more<br>possibility.</h2>
        <p>A home for the things you do.<br>Pick an app to get started.</p>
        <div class="phone-widget"><span>MAKE SOME SPACE</span><strong>Think bigger.</strong><span>One screen. Room for more.</span></div>
      </section>
    `
    right.innerHTML = '<nav class="phone-app-grid" aria-label="Apps"></nav><p class="phone-app-note">Small apps. A bigger canvas.</p>'
    const grid = right.querySelector('nav')!
    for (const app of apps) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'phone-app-icon'
      button.setAttribute('aria-label', `Open ${app.name}`)
      const icon = document.createElement('span')
      icon.className = 'phone-icon-art'
      icon.style.backgroundColor = app.color
      icon.textContent = app.icon
      icon.setAttribute('aria-hidden', 'true')
      const label = document.createElement('span')
      label.textContent = app.name
      button.append(icon, label)
      button.addEventListener('click', () => openApp(app))
      grid.append(button)
    }
    if (focus) grid.querySelector('button')?.focus({ preventScroll: true })
  }
  home.addEventListener('click', () => showHome())
  for (const name of ['pointerdown', 'pointerup', 'click', 'dblclick', 'wheel']) {
    element.addEventListener(name, event => {
      if ((name === 'pointerdown' || name === 'pointerup') && element.closest('canvas')?.dataset.navigationPan === 'true') return
      event.stopPropagation()
    })
  }
  element.addEventListener('keydown', event => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      if (active) { event.preventDefault(); showHome() }
    } else if (active?.onKey?.(event)) event.preventDefault()
  })
  showHome(false)
  return { element, halves }
}
