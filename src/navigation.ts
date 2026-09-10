import { MOUSE } from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function setupNavigation(controls: OrbitControls, canvas: HTMLCanvasElement) {
  controls.enablePan = true
  controls.screenSpacePanning = true
  controls.mouseButtons.MIDDLE = MOUSE.PAN

  let spaceHeld = false
  let hovered = false
  let suppressClick = false

  function releaseSpace() {
    spaceHeld = false
    controls.mouseButtons.LEFT = MOUSE.ROTATE
  }
  function reset() {
    releaseSpace()
    delete canvas.dataset.navigationPan
  }

  canvas.addEventListener('pointerenter', () => { hovered = true })
  canvas.addEventListener('pointerleave', () => { hovered = false })
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target
    if (target instanceof Element && (
      target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]') ||
      target !== canvas && canvas.contains(target)
    )) return
    if (!hovered && document.activeElement !== canvas) return
    event.preventDefault()
    spaceHeld = true
    controls.mouseButtons.LEFT = MOUSE.PAN
  }, true)
  document.addEventListener('keyup', event => {
    if (event.code !== 'Space') return
    if (spaceHeld) event.preventDefault()
    releaseSpace()
  }, true)
  window.addEventListener('blur', reset)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) reset()
  })

  canvas.addEventListener('pointerdown', event => {
    const pan = event.pointerType !== 'touch' && (
      event.button === 1 || event.button === 2 ||
      event.button === 0 && (spaceHeld || event.ctrlKey || event.metaKey || event.shiftKey)
    )
    suppressClick = pan
    if (pan) {
      canvas.dataset.navigationPan = 'true'
      event.preventDefault()
    } else delete canvas.dataset.navigationPan
    if (pan || event.target === canvas) canvas.focus({ preventScroll: true })
  }, true)
  // Suppress the browser's middle-button autoscroll, but leave wheel zoom alone.
  canvas.addEventListener('mousedown', event => {
    if (event.button === 1) event.preventDefault()
  })
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(name, () => { delete canvas.dataset.navigationPan })
  }
  for (const name of ['click', 'auxclick']) {
    canvas.addEventListener(name, event => {
      if (!suppressClick) return
      event.preventDefault()
      event.stopPropagation()
    }, true)
  }

}
