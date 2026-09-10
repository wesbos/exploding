import { createAppShell, SCREEN_WIDTH } from './shell'

export function createAppsPreview(shell = createAppShell(), notice?: HTMLElement) {
  const dialog = document.createElement('dialog')
  dialog.className = 'software-preview'
  dialog.setAttribute('aria-label', 'Phone apps preview')
  dialog.innerHTML = `
    <div class="software-preview-header">
      <button type="button">Close</button>
    </div>
    <div class="software-preview-viewport"></div>
  `
  if (notice) dialog.querySelector('.software-preview-header')!.prepend(notice)
  dialog.querySelector('.software-preview-viewport')!.append(shell.element)
  dialog.querySelector('button')!.addEventListener('click', () => dialog.close())
  dialog.addEventListener('close', () => shell.setVisible(false))
  document.body.append(dialog)
  shell.setVisible(false)
  const observer = new ResizeObserver(() => {
    shell.element.style.setProperty('--preview-scale', String(Math.min(1, (dialog.clientWidth - 32) / SCREEN_WIDTH)))
  })
  observer.observe(dialog)
  function open() {
    if (!dialog.open) dialog.showModal()
    shell.setVisible(true)
  }
  return { open, goHome() { shell.showHome(); open() } }
}
