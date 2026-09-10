import * as THREE from 'three'
import { createAppShell, SCREEN_HEIGHT, SCREEN_WIDTH } from './apps/shell'
import type { createFoldingDisplay } from './display'
import { wallpaperImage, type WallpaperId } from '../wallpapers'

function supportsCanvasGeometry() {
  const probe = document.createElement('canvas')
  if (typeof probe.getElementTransform !== 'function') return false
  probe.setAttribute('layoutsubtree', '')
  const element = document.createElement('div')
  element.setAttribute('drawable', '')
  probe.append(element)
  try {
    probe.getElementTransform(element)
    return true
  } catch (error) {
    // Some Canary versions expose only the older, two-argument overload.
    if (error instanceof TypeError) return false
    throw error
  }
}

export function createPhoneSoftware(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  display: ReturnType<typeof createFoldingDisplay>,
  repaint: () => void,
) {
  const canvas = renderer.domElement
  const shell = createAppShell()
  const ctx = document.createElement('canvas').getContext('2d')!
  const gl = renderer.getContext()
  const supported = gl instanceof WebGL2RenderingContext
    && typeof ctx.drawElementImage === 'function'
    && typeof gl.texElementSubImage2D === 'function'
    && typeof canvas.updateElementGeometry === 'function'
    && typeof canvas.clearElementGeometry === 'function'
    && typeof canvas.requestPaint === 'function'
    && supportsCanvasGeometry()

  function setWallpaper(value: WallpaperId) {
    if (value === 'original') shell.element.style.removeProperty('--custom-wallpaper')
    else shell.element.style.setProperty('--custom-wallpaper', `url("${wallpaperImage(value)}")`)
    if (supported) canvas.requestPaint()
  }

  if (!supported) {
    const dialog = document.createElement('dialog')
    dialog.className = 'software-preview'
    dialog.innerHTML = `
      <div class="software-preview-header">
        <p>Apps preview. To run these apps on the 3D screen, use Chrome Canary and enable <strong>chrome://flags/#canvas-draw-element</strong> and <strong>chrome://flags/#enable-experimental-web-platform-features</strong>, then relaunch. Both drawing and geometry support are required.</p>
        <button type="button">Close</button>
      </div>
      <div class="software-preview-viewport"></div>
    `
    dialog.querySelector('.software-preview-viewport')!.append(shell.element)
    dialog.querySelector('button')!.addEventListener('click', () => dialog.close())
    document.body.append(dialog)
    const observer = new ResizeObserver(() => {
      shell.element.style.setProperty('--preview-scale', String(Math.min(1, (dialog.clientWidth - 32) / SCREEN_WIDTH)))
    })
    observer.observe(dialog)
    return {
      supported,
      setWallpaper,
      openPreview() { dialog.showModal() },
      updateGeometry(_enabled: boolean) {},
    }
  }

  canvas.setAttribute('layoutsubtree', '')
  for (const element of [shell.element, ...shell.halves]) element.setAttribute('drawable', '')
  canvas.append(shell.element)
  const scale = 2
  const sourceTexture = gl.createTexture()
  if (!sourceTexture) throw new Error('Unable to allocate the phone app texture')
  renderer.resetState()
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, SCREEN_WIDTH * scale, SCREEN_HEIGHT * scale, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  renderer.resetState()
  const texture = new THREE.ExternalTexture(sourceTexture)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  let painted = false
  canvas.addEventListener('paint', () => {
    renderer.resetState()
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    // Upload snapshots using the same canvas that owns the source DOM.
    for (const element of [shell.element, ...shell.halves]) {
      const x = element === shell.element ? 0 : element.offsetLeft
      gl.texElementSubImage2D(gl.TEXTURE_2D, 0, x * scale, 0, element, { width: element.offsetWidth * scale, height: element.offsetHeight * scale })
    }
    renderer.resetState()
    if (!painted) { display.setAppTexture(texture); painted = true }
    repaint()
  })
  canvas.requestPaint()

  const normal = new THREE.Vector3()
  const center = new THREE.Vector3()
  const toCamera = new THREE.Vector3()
  function updateGeometry(enabled: boolean) {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const viewport = new THREE.Matrix4().set(
      width / 2, 0, 0, width / 2,
      0, -height / 2, 0, height / 2,
      0, 0, 1, 0,
      0, 0, 0, 1,
    )
    const halves = shell.halves.map((element, index) => {
      const world = display.surface.matrixWorld.clone()
        .multiply(display.pixelTransform(index === 0, SCREEN_WIDTH, SCREEN_HEIGHT))
        .multiply(new THREE.Matrix4().makeTranslation(element.offsetLeft, 0, 0))
      normal.set(0, 0, 1).transformDirection(world)
      center.set(element.offsetWidth / 2, SCREEN_HEIGHT / 2, 0).applyMatrix4(world)
      toCamera.copy(camera.position).sub(center)
      const visible = enabled && painted && normal.dot(toCamera) > 0
      return { element, world, visible, distance: toCamera.lengthSq() }
    })
    // Nearer halves take precedence when they overlap in a folded view.
    halves.sort((a, b) => b.distance - a.distance)
    for (const { element, world, visible } of halves) {
      if (element.inert === visible) {
        element.inert = !visible
        element.setAttribute('aria-hidden', String(!visible))
      }
      if (!visible) { canvas.clearElementGeometry(element); continue }
      const transform = viewport.clone().multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(world)
      canvas.updateElementGeometry(element, { canvasTransform: new DOMMatrix(transform.elements) })
    }
  }
  return { supported, setWallpaper, openPreview() {}, updateGeometry }
}
