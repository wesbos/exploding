import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createPhone, finishes, type Finish } from './phone'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="viewer">
    <header class="topbar">
      <a class="brand" href="/" aria-label="Phoneform home"><span class="brand-mark"></span> PHONEFORM <span class="brand-divider">/</span> LAB</a>
      <nav class="model-switch" aria-label="Device model"><a href="?model=15" aria-current="page">15 Pro</a><a href="?model=duo">iPhone Duo ↗</a></nav>
      <button class="menu" type="button" aria-label="Show reference information" aria-expanded="false" aria-controls="object-info"><i></i><i></i></button>
      <aside id="object-info" hidden>
        <strong>Built from the inside out.</strong>
        <p>Component silhouettes and placement studied from the iPhone 15 Pro, not the Pro Max. All geometry and surface textures are generated locally.</p>
        <a href="https://support.apple.com/en-us/104873" target="_blank" rel="noreferrer">Apple · Internal view ↗</a>
        <a href="https://www.ifixit.com/Guide/iPhone+15+Pro+Battery+Replacement/166394" target="_blank" rel="noreferrer">iFixit · Battery & interior photos ↗</a>
        <a href="https://www.ifixit.com/Guide/iPhone+15+Pro+Rear+Cameras+Replacement/166366" target="_blank" rel="noreferrer">iFixit · Camera assembly photos ↗</a>
        <p class="model-note">Photo-referenced reconstruction, not dimensionally exact service CAD. Hidden circuitry and small surface markings are illustrative.</p>
        <p class="model-note">Arrow keys rotate. R resets the view. Escape returns to the full assembly.</p>
      </aside>
    </header>
    <section class="stage">
      <aside class="copy">
        <p class="eyebrow">146.6 × 70.6 × 8.25 MM</p>
        <h1>iPhone 15 Pro<span>Under the surface.</span></h1>
        <p class="intro">A component-by-component study.<br>Select a part to get closer.</p>
        <div class="explosion-controls">
          <label for="explosion">SEPARATION <output id="explosion-value" for="explosion">100%</output></label>
          <input id="explosion" type="range" min="0" max="100" value="100" aria-label="Component separation" />
          <div class="explosion-endpoints"><span>ASSEMBLED</span><span>EXPLODED</span></div>
          <div class="view-actions">
            <button class="assembly-toggle" type="button">Assemble</button>
            <button class="explore" type="button">Reverse view ↗</button>
          </div>
        </div>
        <div class="parts-heading"><span>COMPONENT INDEX</span><span id="part-count"></span></div>
        <div class="parts-list" role="group" aria-label="Inspect an individual component"></div>
        <button class="show-all" type="button" aria-pressed="true">↖ Full assembly</button>
      </aside>
      <div class="model-stage">
        <div class="stage-meta"><span id="view-title">EXPLODED ASSEMBLY</span><span class="live-dot">LIVE 3D</span></div>
        <div id="scene" aria-label="Interactive 3D iPhone teardown"></div>
        <div class="part-caption" aria-live="polite"><span id="caption-number">001 / 015 PRO</span><h2 id="caption-title">Every part has a purpose.</h2><p id="caption-detail">Drag to orbit. Scroll to zoom. Click a component to inspect it on its own.</p></div>
        <div class="stage-tools">
          <button class="shell-toggle" type="button" aria-pressed="false">Hide outer layers</button>
          <button class="reset-view" type="button">Reset view ↺</button>
        </div>
      </div>
    </section>
    <footer class="footer">
      <p>PHOTO-REFERENCED RECONSTRUCTION<br><a href="https://support.apple.com/en-us/104873" target="_blank" rel="noreferrer">APPLE INTERNAL VIEW ↗</a> <span>·</span> <a href="https://www.ifixit.com/Device/iPhone_15_Pro" target="_blank" rel="noreferrer">IFIXIT ↗</a></p>
      <div class="swatches" role="group" aria-label="Titanium finish">
        <button class="swatch active" data-color="black" aria-label="Natural titanium" aria-pressed="true" title="Natural titanium"></button>
        <button class="swatch" data-color="blue" aria-label="Blue titanium" aria-pressed="false" title="Blue titanium"></button>
        <button class="swatch" data-color="white" aria-label="White titanium" aria-pressed="false" title="White titanium"></button>
      </div>
      <p class="details">THREE.JS / PROCEDURAL GEOMETRY<br>DRAG · ZOOM · INSPECT</p>
    </footer>
  </main>
`

const host = document.querySelector<HTMLDivElement>('#scene')!
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 150)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.06
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.domElement.tabIndex = 0
renderer.domElement.setAttribute('aria-label', '3D iPhone components. Drag or use arrow keys to rotate, scroll to zoom, R to reset, Escape for the full assembly.')
host.appendChild(renderer.domElement)

const pmrem = new THREE.PMREMGenerator(renderer)
const studio = new RoomEnvironment()
const environment = pmrem.fromScene(studio, 0.025)
scene.environment = environment.texture
scene.environmentIntensity = 0.9
studio.dispose()
pmrem.dispose()

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = !reducedMotion.matches
controls.enablePan = false
controls.minDistance = 0.8
controls.maxDistance = 55
controls.minPolarAngle = 0.12
controls.maxPolarAngle = Math.PI - 0.12
const { phone, parts, setFinish, setExplosion } = createPhone()
phone.rotation.set(0.2, -0.65, -0.07)
scene.add(phone)
phone.traverse(object => {
  if (object instanceof THREE.Mesh) {
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    object.castShadow = materials.every(material => !material.transparent)
    object.receiveShadow = true
  }
})
scene.add(new THREE.HemisphereLight(0xffffff, 0x4c4842, 1.15))
const key = new THREE.DirectionalLight(0xfff5e8, 3.3)
key.position.set(-5, 8, 7)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
key.shadow.camera.left = key.shadow.camera.bottom = -9
key.shadow.camera.right = key.shadow.camera.top = 9
key.shadow.camera.near = 0.5
key.shadow.camera.far = 30
key.shadow.normalBias = 0.008
key.shadow.bias = -0.00015
scene.add(key)
const edge = new THREE.DirectionalLight(0xe1ebff, 2.0)
edge.position.set(4, 3, -6)
scene.add(edge)
const fill = new THREE.DirectionalLight(0xffffff, 0.8)
fill.position.set(1, -1, 6)
scene.add(fill)

let frontView = true
let explosion = 1
let explosionTarget = 1
let selection: string | null = null
let hideShell = false
let transition: { from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; elapsed: number } | null = null
const separation = document.querySelector<HTMLInputElement>('#explosion')!
const separationValue = document.querySelector<HTMLOutputElement>('#explosion-value')!
const assemblyToggle = document.querySelector<HTMLButtonElement>('.assembly-toggle')!
const shellToggle = document.querySelector<HTMLButtonElement>('.shell-toggle')!
const captionTitle = document.querySelector<HTMLElement>('#caption-title')!
const captionDetail = document.querySelector<HTMLElement>('#caption-detail')!
const viewTitle = document.querySelector<HTMLElement>('#view-title')!
const partList = document.querySelector<HTMLDivElement>('.parts-list')!
const partCount = document.querySelector<HTMLElement>('#part-count')!
partCount.textContent = String(parts.length).padStart(2, '0')

parts.forEach((part, index) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'part-button'
  button.dataset.part = part.id
  button.setAttribute('aria-pressed', 'false')
  const number = document.createElement('span')
  number.className = 'part-number'
  number.textContent = String(index + 1).padStart(2, '0')
  const name = document.createElement('span')
  name.textContent = part.name
  const arrow = document.createElement('span')
  arrow.className = 'part-arrow'
  arrow.textContent = '↗'
  arrow.setAttribute('aria-hidden', 'true')
  button.append(number, name, arrow)
  button.addEventListener('click', () => selectPart(selection === part.id ? null : part.id))
  partList.append(button)
})

function applyVisibility() {
  for (const part of parts) {
    part.group.visible = selection ? part.id === selection : !(hideShell && ['display', 'rear-glass'].includes(part.id))
  }
}

function frameModel(animate = true) {
  // Compute the destination pose, then restore the animated pose. Invisible
  // assemblies must not contribute to an isolated component's framing.
  setExplosion(explosionTarget)
  phone.updateMatrixWorld(true)
  const bounds = new THREE.Box3()
  for (const part of parts) if (part.group.visible) bounds.union(new THREE.Box3().setFromObject(part.group))
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
  const distance = Math.max(size.y / 2 / Math.tan(halfFov), size.x / 2 / (Math.tan(halfFov) * camera.aspect)) * 1.17 + size.z / 2
  const position = center.clone().add(new THREE.Vector3(0, 0, Math.max(1.5, distance)))
  setExplosion(explosion)
  if (animate && !reducedMotion.matches) {
    transition = { from: camera.position.clone(), to: position, fromTarget: controls.target.clone(), toTarget: center, elapsed: 0 }
  } else {
    transition = null
    camera.position.copy(position)
    controls.target.copy(center)
  }
}

function selectPart(id: string | null) {
  selection = id
  applyVisibility()
  const selected = parts.find(part => part.id === id)
  document.querySelectorAll<HTMLButtonElement>('.part-button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.part === id))
  })
  document.querySelector('.show-all')!.setAttribute('aria-pressed', String(id === null))
  captionTitle.textContent = selected?.name ?? 'Every part has a purpose.'
  captionDetail.textContent = selected?.detail ?? 'Drag to orbit. Scroll to zoom. Click a component to inspect it on its own.'
  document.querySelector('#caption-number')!.textContent = selected
    ? `${String(parts.indexOf(selected) + 1).padStart(2, '0')} / COMPONENT STUDY` : '001 / 015 PRO'
  viewTitle.textContent = selected ? 'ISOLATED COMPONENT' : explosionTarget > 0 ? 'EXPLODED ASSEMBLY' : 'ASSEMBLED DEVICE'
  shellToggle.disabled = id !== null
  frameModel()
}
document.querySelector('.show-all')!.addEventListener('click', () => selectPart(null))

function updateExplosion(value: number) {
  explosionTarget = value / 100
  separation.value = String(value)
  separationValue.value = `${value}%`
  assemblyToggle.textContent = value > 0 ? 'Assemble' : 'Explode'
  if (!selection) viewTitle.textContent = value > 0 ? 'EXPLODED ASSEMBLY' : 'ASSEMBLED DEVICE'
  frameModel()
}
separation.addEventListener('input', () => updateExplosion(separation.valueAsNumber))
assemblyToggle.addEventListener('click', () => {
  if (selection) selectPart(null)
  hideShell = false
  updateShell()
  updateExplosion(explosionTarget > 0 ? 0 : 100)
})
function updateShell() {
  shellToggle.setAttribute('aria-pressed', String(hideShell))
  shellToggle.textContent = hideShell ? 'Show outer layers' : 'Hide outer layers'
  applyVisibility()
}
shellToggle.addEventListener('click', () => {
  hideShell = !hideShell
  updateShell()
  frameModel()
})

function resetView(front = true) {
  frontView = front
  const damping = controls.enableDamping
  controls.enableDamping = false
  controls.update()
  phone.rotation.set(0.2, front ? -0.65 : Math.PI - 0.65, -0.07)
  controls.enableDamping = damping
  frameModel()
}
document.querySelector('.explore')!.addEventListener('click', () => resetView(!frontView))
document.querySelector('.reset-view')!.addEventListener('click', () => resetView())
controls.addEventListener('start', () => { transition = null })
reducedMotion.addEventListener('change', () => {
  controls.enableDamping = !reducedMotion.matches
  if (reducedMotion.matches) frameModel(false)
})
renderer.domElement.addEventListener('keydown', event => {
  const directions: Record<string, [number, number]> = {
    ArrowLeft: [-0.14, 0], ArrowRight: [0.14, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12],
  }
  if (event.key.toLowerCase() === 'r') {
    event.preventDefault()
    resetView()
  } else if (directions[event.key]) {
    event.preventDefault()
    transition = null
    const [azimuth, polar] = directions[event.key]
    const orbit = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
    orbit.theta += azimuth
    orbit.phi = THREE.MathUtils.clamp(orbit.phi + polar, controls.minPolarAngle, controls.maxPolarAngle)
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit))
    controls.update()
  }
})

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let pointerStart: { x: number; y: number } | null = null
renderer.domElement.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY } })
renderer.domElement.addEventListener('pointercancel', () => { pointerStart = null })
renderer.domElement.addEventListener('pointerup', event => {
  if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) {
    pointerStart = null
    return
  }
  pointerStart = null
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  const hit = raycaster.intersectObjects(parts.filter(part => part.group.visible).map(part => part.group), true)[0]
  if (hit && typeof hit.object.userData.partId === 'string') selectPart(hit.object.userData.partId)
})

document.querySelectorAll<HTMLButtonElement>('.swatch').forEach(button => {
  button.addEventListener('click', () => {
    const value = button.dataset.color
    if (!value || !Object.hasOwn(finishes, value)) throw new Error(`Unknown finish: ${value}`)
    setFinish(value as Finish)
    document.querySelectorAll<HTMLButtonElement>('.swatch').forEach(swatch => {
      swatch.classList.toggle('active', swatch === button)
      swatch.setAttribute('aria-pressed', String(swatch === button))
    })
  })
})
const menu = document.querySelector<HTMLButtonElement>('.menu')!
const info = document.querySelector<HTMLElement>('#object-info')!
function closeInfo() {
  info.hidden = true
  menu.setAttribute('aria-expanded', 'false')
}
menu.addEventListener('click', () => {
  info.hidden = !info.hidden
  menu.setAttribute('aria-expanded', String(!info.hidden))
})
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return
  if (!info.hidden) {
    closeInfo()
    menu.focus()
  } else if (selection) selectPart(null)
})
document.addEventListener('pointerdown', event => {
  if (event.target instanceof Node && !info.contains(event.target) && !menu.contains(event.target)) closeInfo()
})

function resize() {
  const width = Math.max(1, host.clientWidth)
  const height = Math.max(1, host.clientHeight)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  frameModel(false)
}
setExplosion(explosion)
const resizeObserver = new ResizeObserver(resize)
resizeObserver.observe(host)
resize()
const clock = new THREE.Clock()
renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05)
  if (document.hidden) return
  explosion = reducedMotion.matches ? explosionTarget : THREE.MathUtils.damp(explosion, explosionTarget, 9, delta)
  setExplosion(explosion)
  if (transition) {
    transition.elapsed += delta
    const t = THREE.MathUtils.smoothstep(transition.elapsed, 0, 0.55)
    camera.position.lerpVectors(transition.from, transition.to, t)
    controls.target.lerpVectors(transition.fromTarget, transition.toTarget, t)
    if (t === 1) transition = null
  }
  controls.update(delta)
  renderer.render(scene, camera)
})
