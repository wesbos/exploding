import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createDuo } from './model'
import { createPhoneSoftware } from './software'
import { stepPose } from './pose'
import { createKnollingLayout } from '../knolling'
import { setupNavigation } from '../navigation'
import { setupAppearance } from '../appearance'
import { foldRadians, type DuoFinish, type DuoPose } from './types'
import './style.css'

document.title = 'Phoneform Lab — iPhone Duo'
document.querySelector('meta[name="description"]')?.setAttribute('content', 'An articulated, photo-referenced iPhone Duo model. Fold the continuous display, open the device, and inspect its separated internal assemblies.')
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="duo-app">
    <header class="duo-header">
      <a class="duo-brand" href="/"><span></span> PHONEFORM <i>/</i> LAB</a>
      <nav aria-label="Device model"><a href="/" aria-current="page">iPhone Duo</a><a href="?model=15">15 Pro</a></nav>
      <button id="reference-toggle" type="button" aria-expanded="false" aria-controls="reference-panel">Reference notes ↗</button>
      <aside id="reference-panel" hidden>
        <strong>A study of the supplied announcement.</strong>
        <p>Exterior proportions, two rounded outer corners, two rear cameras, and the display stack follow your September 9 reference collection.</p>
        <dl><dt>spec-sheet.md</dt><dd>Dimensions, displays, materials and known / unknown specifications.</dd><dt>Announcement · 14:28–14:35</dt><dd>Hinge cartridges, center rails and carbon-fiber support plates.</dd><dt>Announcement · 15:49</dt><dd>Revealed assemblies and the stepped vapor chamber.</dd><dt>Announcement · 17:08</dt><dd>Dual-cell outlines and the right-side board, with the thermal cover removed.</dd><dt>Newsroom images</dt><dd>Star White / Night Sky finishes, corner camera, camera plateau and hinge cover.</dd></dl>
        <p>Board routing, concealed fasteners, hinge kinematics and cell outlines are visual approximations—not manufacturing CAD. Battery mAh / Wh and RAM are not assigned.</p>
        <p class="small-note">The supplied leak GLB was inspected but is not bundled: it has no animation rig and its metadata marks the model as reserved rights. This is original procedural geometry.</p>
      </aside>
    </header>
    <section class="duo-workspace">
      <aside class="duo-inspector">
        <p class="duo-kicker">STUDY 002 / FOLDABLE SYSTEM</p>
        <h1>iPhone Duo.</h1>
        <p class="duo-intro">One device. Two perspectives.<br>A closer look at what folds inside.</p>
        <section class="duo-control">
          <label for="fold-angle">HINGE ANGLE <output id="fold-output" for="fold-angle" aria-live="off">130°</output></label>
          <input id="fold-angle" type="range" min="0" max="180" value="130" aria-label="Hinge opening angle" />
          <div class="range-endpoints"><span>0° CLOSED</span><span>180° FLAT</span></div>
          <div class="pose-presets" aria-label="Device pose">
            <button type="button" data-pose="closed">Closed</button><button type="button" data-pose="book" aria-pressed="true">Book</button><button type="button" data-pose="flat">Flat</button><button type="button" data-pose="tent">Tent</button>
          </div>
        </section>
        <section class="duo-control">
          <label for="explode-amount">COMPONENT SEPARATION <output id="explode-output" for="explode-amount" aria-live="off">0%</output></label>
          <input id="explode-amount" type="range" min="0" max="100" value="0" aria-label="Internal component separation" />
          <div class="explode-actions"><button id="explode-toggle" type="button">Explode internals ↗</button><button id="reveal-toggle" type="button" aria-pressed="false">Reveal</button></div>
          <button id="knoll-toggle" type="button" aria-pressed="false">Knolling grid</button>
          <p id="pose-status" aria-live="polite">Exploding opens the device into a service view.</p>
          <div id="appearance"></div>
        </section>
        <div class="component-heading"><span>COMPONENT LIBRARY</span><span id="component-count"></span></div>
        <input id="component-search" type="search" placeholder="Find a component…" aria-label="Find a component" />
        <div id="duo-parts" role="group" aria-label="Inspect a component"></div>
        <p id="empty-search" hidden>No components match.</p>
        <button id="all-components" type="button" aria-pressed="true">↖ Return to full assembly</button>
        <p class="evidence-key"><span></span> Source documented <i></i> Inferred construction</p>
      </aside>
      <div class="duo-stage">
        <div class="duo-stage-heading"><span id="stage-state">ARTICULATED ASSEMBLY</span><span><i></i> LIVE 3D</span></div>
        <div id="duo-scene" data-fold="130" data-explosion="0"></div>
        <div class="duo-stage-controls"><button id="use-apps" type="button">Use apps</button><span></span><button id="view-front" type="button">Front</button><button id="view-rear" type="button">Rear</button><button id="view-perspective" type="button">Perspective</button><span></span><button id="screen-toggle" type="button" aria-pressed="true">Displays on</button><button id="reset-camera" type="button">Reset ↺</button></div>
        <section class="duo-caption" aria-live="polite">
          <div><p id="part-category">TITANIUM / CERAMIC SHIELD / OLED</p><h2 id="part-title">Built around a new point of view.</h2><p id="part-detail">Drag to orbit. Middle-drag or Space + drag to pan. Scroll to zoom. Select any component for an isolated close-up.</p></div>
          <span id="part-evidence" hidden></span>
        </section>
        <div class="duo-dimensions"><span id="dimension-value">117.8 mm tall · 254 g</span><span>5.4″ COVER <i>/</i> 7.6″ INNER</span></div>
      </div>
    </section>
    <footer class="duo-footer">
      <p>REFERENCE COLLECTION <span>09 SEP 2026</span></p>
      <div class="duo-finishes" role="group" aria-label="Device finish">
        <button type="button" data-finish="white" aria-pressed="true"><i></i> Star White</button><button type="button" data-finish="night" aria-pressed="false"><i></i> Night Sky</button>
      </div>
      <p>ORIGINAL PROCEDURAL MODEL <span>THREE.JS · TYPESCRIPT</span></p>
    </footer>
  </main>
`

const host = document.querySelector<HTMLDivElement>('#duo-scene')!
const model = createDuo()
model.setPose({ fold: 180, explosion: 1 })
const knollLayout = createKnollingLayout(model.parts, ['cover-display', 'rear-glass', 'cameras', 'cover-camera', 'magsafe'])
model.setPose({ fold: 130, explosion: 0 })
const scene = new THREE.Scene()
scene.add(model.phone)
const camera = new THREE.PerspectiveCamera(32, 1, 0.06, 250)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.02
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.domElement.tabIndex = 0
renderer.domElement.setAttribute('aria-label', 'Interactive folding iPhone Duo. Drag or arrow keys to orbit, middle-drag or Space and drag to pan, scroll to zoom, R to reset, Escape to show all parts.')
host.appendChild(renderer.domElement)
const room = new RoomEnvironment()
const generator = new THREE.PMREMGenerator(renderer)
const environment = generator.fromScene(room, 0.025)
scene.environment = environment.texture
scene.environmentIntensity = 0.92
room.dispose()
generator.dispose()
scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x696157, 1.2))
const key = new THREE.DirectionalLight(0xfff6e8, 3.3)
key.position.set(-10, 13, 16)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
key.shadow.camera.left = key.shadow.camera.bottom = -23
key.shadow.camera.right = key.shadow.camera.top = 23
key.shadow.camera.near = 0.5
key.shadow.camera.far = 65
key.shadow.bias = -0.00008
key.shadow.normalBias = 0.012
scene.add(key)
const edge = new THREE.DirectionalLight(0xd6e6ff, 2.4)
edge.position.set(14, 4, -9)
scene.add(edge)
const fill = new THREE.DirectionalLight(0xffffff, 0.7)
fill.position.set(2, -4, 8)
scene.add(fill)
model.phone.traverse(object => {
  if (!(object instanceof THREE.Mesh)) return
  const materials = Array.isArray(object.material) ? object.material : [object.material]
  object.castShadow = materials.every(material => !material.transparent)
  object.receiveShadow = true
})
const software = createPhoneSoftware(renderer, camera, model.display, () => renderer.render(scene, camera))
const appearance = setupAppearance({
  color: '#e6e6e0',
  onColor(color) {
    model.setColor(color)
    document.querySelectorAll('[data-finish]').forEach(button => button.setAttribute('aria-pressed', 'false'))
  },
  onWallpaper(value) {
    model.setWallpaper(value)
    software.setWallpaper(value)
  },
})
const useApps = document.querySelector<HTMLButtonElement>('#use-apps')!
if (!software.supported) useApps.textContent = 'Apps preview'

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = !reducedMotion.matches
const navigation = setupNavigation(controls, renderer.domElement)
controls.minDistance = 1.0
controls.maxDistance = 190
controls.minPolarAngle = 0.1
controls.maxPolarAngle = Math.PI - 0.1
const foldInput = document.querySelector<HTMLInputElement>('#fold-angle')!
const explodeInput = document.querySelector<HTMLInputElement>('#explode-amount')!
const foldOutput = document.querySelector<HTMLOutputElement>('#fold-output')!
const explodeOutput = document.querySelector<HTMLOutputElement>('#explode-output')!
const explodeToggle = document.querySelector<HTMLButtonElement>('#explode-toggle')!
const revealToggle = document.querySelector<HTMLButtonElement>('#reveal-toggle')!
const knollToggle = document.querySelector<HTMLButtonElement>('#knoll-toggle')!
const status = document.querySelector<HTMLElement>('#pose-status')!
const library = document.querySelector<HTMLDivElement>('#duo-parts')!
const dimension = document.querySelector<HTMLElement>('#dimension-value')!
const stageState = document.querySelector<HTMLElement>('#stage-state')!

let pose: DuoPose = { fold: 130, explosion: 0 }
let target: DuoPose = { ...pose }
let lastFold = 130
let selection: string | null = null
let reveal = false
let screens = true
let view: 'front' | 'rear' | 'perspective' = 'perspective'
let tent = false
let knolling = false
let knollAmount = 0
let cameraTween: { start: THREE.Vector3; end: THREE.Vector3; startTarget: THREE.Vector3; endTarget: THREE.Vector3; elapsed: number } | null = null
const visibleBounds = new THREE.Box3()
const targetRotation = new THREE.Quaternion()
const scratchBounds = new THREE.Box3()
const savedRotation = new THREE.Quaternion()
const yAxis = new THREE.Vector3(0, 1, 0)

function orientation(angle: number, separation = 0) {
  if (knolling) return new THREE.Quaternion()
  if (tent) {
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, -0.58, 0))
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2))
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2))
      .multiply(new THREE.Quaternion().setFromAxisAngle(yAxis, -foldRadians(angle) / 2))
  }
  if (view === 'front') return new THREE.Quaternion()
  if (view === 'rear') return new THREE.Quaternion().setFromAxisAngle(yAxis, Math.PI)
  if (selection) {
    const rearFacing = ['cover-display', 'rear-glass', 'cameras', 'cover-camera', 'magsafe'].includes(selection)
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(0.13, rearFacing ? Math.PI - 0.32 : -0.32, -0.025))
  }
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(
    THREE.MathUtils.lerp(0.13, -0.48, separation),
    THREE.MathUtils.lerp(-0.32, -0.66, separation),
    THREE.MathUtils.lerp(-0.025, -0.06, separation),
  ))
}

function applyPose(value: DuoPose, amount: number) {
  knollLayout.restore()
  model.setPose(value)
  knollLayout.apply(amount, camera.aspect)
}

function setKnolling(value: boolean) {
  knolling = value
  knollToggle.setAttribute('aria-pressed', String(value))
  revealToggle.disabled = value
  document.querySelectorAll<HTMLButtonElement>('[id^="view-"]').forEach(button => { button.disabled = value })
}

function frameModel(animate = true) {
  const damping = controls.enableDamping
  controls.enableDamping = false
  controls.update()
  controls.enableDamping = damping
  savedRotation.copy(model.phone.quaternion)
  model.phone.quaternion.copy(orientation(target.fold, target.explosion))
  applyPose(target, knolling ? 1 : 0)
  model.phone.updateMatrixWorld(true)
  visibleBounds.makeEmpty()
  for (const part of model.parts) {
    if (part.group.visible) visibleBounds.union(scratchBounds.setFromObject(part.group))
  }
  const center = visibleBounds.getCenter(new THREE.Vector3())
  const size = visibleBounds.getSize(new THREE.Vector3())
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
  const distance = Math.max(size.y / 2 / Math.tan(halfFov), size.x / 2 / (Math.tan(halfFov) * camera.aspect)) * 1.12 + size.z / 2
  const position = center.clone().add(new THREE.Vector3(0, 0, Math.max(2, distance)))
  controls.maxDistance = Math.max(190, distance * 2)
  camera.far = Math.max(250, distance * 4)
  camera.updateProjectionMatrix()
  applyPose(pose, knollAmount)
  model.phone.quaternion.copy(savedRotation)
  if (animate && !reducedMotion.matches) {
    cameraTween = { start: camera.position.clone(), end: position, startTarget: controls.target.clone(), endTarget: center, elapsed: 0 }
  } else {
    cameraTween = null
    camera.position.copy(position)
    controls.target.copy(center)
  }
}

function applyVisibility() {
  for (const part of model.parts) {
    const outer = /display|rear-glass|support|hinge-cover/.test(part.id)
    part.group.visible = selection ? part.id === selection : !(reveal && outer)
  }
}

function updateCaption() {
  const part = model.parts.find(part => part.id === selection)
  document.querySelector('#part-title')!.textContent = part?.name ?? (knolling ? 'Every component, in its place.' : 'Built around a new point of view.')
  document.querySelector('#part-detail')!.textContent = part?.detail ?? (knolling ? 'All components at their original scale, laid flat in an aligned grid. Middle-drag or Space + drag to pan. Select one to inspect it, or turn off Knolling grid to return to the exploded view.' : 'Drag to orbit. Middle-drag or Space + drag to pan. Scroll to zoom. Select any component for an isolated close-up.')
  document.querySelector('#part-category')!.textContent = part ? `${String(model.parts.indexOf(part) + 1).padStart(2, '0')} / ${part.side.toUpperCase()} ASSEMBLY` : 'TITANIUM / CERAMIC SHIELD / OLED'
  const evidence = document.querySelector<HTMLElement>('#part-evidence')!
  evidence.hidden = !part
  evidence.dataset.evidence = part?.evidence ?? ''
  evidence.textContent = part?.evidence === 'documented' ? 'SOURCE DOCUMENTED' : 'INFERRED CONSTRUCTION'
  library.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.part === selection)))
  document.querySelector('#all-components')!.setAttribute('aria-pressed', String(!selection))
}

function clearSelection() {
  selection = null
  applyVisibility()
  updateCaption()
}

function requestPose(next: DuoPose, clear = true, keepKnolling = false) {
  if (!keepKnolling) setKnolling(false)
  if (clear) clearSelection()
  target = { fold: THREE.MathUtils.clamp(next.fold, 0, 180), explosion: THREE.MathUtils.clamp(next.explosion, 0, 1) }
  if (target.explosion > 0) {
    if (pose.explosion === 0 && pose.fold < 180) lastFold = pose.fold
    target.fold = 180
    tent = false
  } else lastFold = target.fold
  foldInput.value = String(target.fold)
  explodeInput.value = String(Math.round(target.explosion * 100))
  explodeToggle.textContent = target.explosion > 0 ? 'Assemble device ↙' : 'Explode internals ↗'
  document.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(button => {
    const active = target.explosion === 0 && (
      button.dataset.pose === 'closed' && target.fold === 0 ||
      button.dataset.pose === 'flat' && target.fold === 180 ||
      button.dataset.pose === 'book' && target.fold === 130 && !tent ||
      button.dataset.pose === 'tent' && tent
    )
    button.setAttribute('aria-pressed', String(active))
  })
  if (reducedMotion.matches) pose = { ...target }
  frameModel()
}
knollToggle.addEventListener('click', () => {
  setKnolling(!knolling)
  reveal = false
  revealToggle.setAttribute('aria-pressed', 'false')
  tent = false
  view = 'perspective'
  requestPose({ fold: 180, explosion: 1 }, true, true)
})
foldInput.addEventListener('input', () => {
  tent = false
  requestPose({ fold: foldInput.valueAsNumber, explosion: 0 })
})
explodeInput.addEventListener('input', () => requestPose({ fold: target.fold, explosion: explodeInput.valueAsNumber / 100 }))
explodeToggle.addEventListener('click', () => {
  reveal = false
  revealToggle.setAttribute('aria-pressed', 'false')
  requestPose(target.explosion > 0 ? { fold: lastFold, explosion: 0 } : { fold: 180, explosion: 1 })
})
document.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(button => button.addEventListener('click', () => {
  tent = button.dataset.pose === 'tent'
  reveal = false
  revealToggle.setAttribute('aria-pressed', 'false')
  requestPose({ fold: button.dataset.pose === 'closed' ? 0 : button.dataset.pose === 'flat' ? 180 : tent ? 70 : 130, explosion: 0 })
}))
revealToggle.addEventListener('click', () => {
  reveal = !reveal
  tent = false
  view = 'perspective'
  revealToggle.setAttribute('aria-pressed', String(reveal))
  requestPose({ fold: 180, explosion: 0 })
})

function selectPart(id: string) {
  const part = model.parts.find(part => part.id === id)
  if (!part) throw new Error(`Unknown Duo component: ${id}`)
  selection = id
  tent = false
  view = 'perspective'
  pose = { fold: 180, explosion: 1 }
  requestPose(pose, false, true)
  applyVisibility()
  updateCaption()
  frameModel()
}
for (const [index, part] of model.parts.entries()) {
  const button = document.createElement('button')
  button.type = 'button'
  button.dataset.part = part.id
  button.dataset.evidence = part.evidence
  button.setAttribute('aria-pressed', 'false')
  const number = document.createElement('span')
  number.textContent = String(index + 1).padStart(2, '0')
  const name = document.createElement('span')
  name.textContent = part.name
  const dot = document.createElement('i')
  dot.title = part.evidence === 'documented' ? 'Source documented' : 'Inferred construction'
  button.append(number, name, dot)
  button.addEventListener('click', () => selectPart(part.id))
  library.append(button)
}
document.querySelector('#component-count')!.textContent = String(model.parts.length).padStart(2, '0')
document.querySelector('#all-components')!.addEventListener('click', () => { clearSelection(); frameModel() })
document.querySelector<HTMLInputElement>('#component-search')!.addEventListener('input', event => {
  const query = (event.currentTarget as HTMLInputElement).value.trim().toLowerCase()
  let matches = 0
  library.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
    button.hidden = !button.textContent!.toLowerCase().includes(query)
    if (!button.hidden) matches++
  })
  document.querySelector<HTMLElement>('#empty-search')!.hidden = matches > 0
})

document.querySelectorAll<HTMLButtonElement>('[data-finish]').forEach(button => button.addEventListener('click', () => {
  const finish = button.dataset.finish
  if (finish !== 'white' && finish !== 'night') throw new Error('Unknown Duo finish')
  model.setFinish(finish as DuoFinish)
  appearance.setColor(finish === 'white' ? '#e6e6e0' : '#263748')
  document.querySelectorAll<HTMLButtonElement>('[data-finish]').forEach(item => item.setAttribute('aria-pressed', String(item === button)))
}))
document.querySelector<HTMLButtonElement>('#screen-toggle')!.addEventListener('click', event => {
  screens = !screens
  model.setScreen(screens)
  const button = event.currentTarget as HTMLButtonElement
  button.setAttribute('aria-pressed', String(screens))
  button.textContent = screens ? 'Displays on' : 'Displays off'
})
useApps.addEventListener('click', () => {
  if (!software.supported) { software.openPreview(); return }
  tent = false
  reveal = false
  revealToggle.setAttribute('aria-pressed', 'false')
  view = 'front'
  screens = true
  model.setScreen(true)
  const screenToggle = document.querySelector<HTMLButtonElement>('#screen-toggle')!
  screenToggle.setAttribute('aria-pressed', 'true')
  screenToggle.textContent = 'Displays on'
  requestPose({ fold: 180, explosion: 0 })
})
for (const direction of ['front', 'rear', 'perspective'] as const) {
  document.querySelector(`#view-${direction}`)!.addEventListener('click', () => {
    tent = false
    document.querySelector('[data-pose="tent"]')!.setAttribute('aria-pressed', 'false')
    view = direction
    frameModel()
  })
}
function resetCamera() {
  view = 'perspective'
  frameModel()
}
document.querySelector('#reset-camera')!.addEventListener('click', resetCamera)
controls.addEventListener('start', () => { cameraTween = null })
reducedMotion.addEventListener('change', () => {
  controls.enableDamping = !reducedMotion.matches
  if (reducedMotion.matches) { pose = { ...target }; frameModel(false) }
})

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let pointerStart: { x: number; y: number } | null = null
renderer.domElement.addEventListener('pointerdown', event => {
  pointerStart = null
  if (!navigation.canSelect(event)) return
  pointerStart = { x: event.clientX, y: event.clientY }
})
renderer.domElement.addEventListener('pointercancel', () => { pointerStart = null })
renderer.domElement.addEventListener('pointerup', event => {
  const start = pointerStart
  pointerStart = null
  if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return
  const box = renderer.domElement.getBoundingClientRect()
  pointer.set((event.clientX - box.left) / box.width * 2 - 1, -(event.clientY - box.top) / box.height * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  const hit = raycaster.intersectObjects(model.parts.filter(part => part.group.visible).map(part => part.group), true)[0]
  if (software.supported && screens && pose.explosion === 0 && hit?.object === model.display.surface) return
  if (hit && typeof hit.object.userData.partId === 'string') selectPart(hit.object.userData.partId)
})
renderer.domElement.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'r') { event.preventDefault(); resetCamera(); return }
  const directions: Record<string, [number, number]> = { ArrowLeft: [-0.13, 0], ArrowRight: [0.13, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }
  if (!directions[event.key]) return
  event.preventDefault()
  cameraTween = null
  const orbit = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
  orbit.theta += directions[event.key][0]
  orbit.phi = THREE.MathUtils.clamp(orbit.phi + directions[event.key][1], controls.minPolarAngle, controls.maxPolarAngle)
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit))
  controls.update()
})
const referenceButton = document.querySelector<HTMLButtonElement>('#reference-toggle')!
const referencePanel = document.querySelector<HTMLElement>('#reference-panel')!
function closeReference() { referencePanel.hidden = true; referenceButton.setAttribute('aria-expanded', 'false') }
referenceButton.addEventListener('click', () => {
  referencePanel.hidden = !referencePanel.hidden
  referenceButton.setAttribute('aria-expanded', String(!referencePanel.hidden))
})
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return
  if (!referencePanel.hidden) { closeReference(); referenceButton.focus() }
  else if (selection) { clearSelection(); frameModel() }
})
document.addEventListener('pointerdown', event => {
  if (event.target instanceof Node && !referencePanel.contains(event.target) && !referenceButton.contains(event.target)) closeReference()
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
model.phone.quaternion.copy(orientation(pose.fold))
const resizeObserver = new ResizeObserver(resize)
resizeObserver.observe(host)
resize()

const clock = new THREE.Clock()
function renderFrame(delta: number) {
  pose = stepPose(pose, target, delta, reducedMotion.matches)
  const knollTarget = knolling && pose.fold === 180 ? 1 : 0
  knollAmount = reducedMotion.matches ? knollTarget : THREE.MathUtils.damp(knollAmount, knollTarget, 9, delta)
  if (Math.abs(knollAmount - knollTarget) < 0.0005) knollAmount = knollTarget
  applyPose(pose, knollAmount)
  targetRotation.copy(orientation(pose.fold, pose.explosion))
  if (reducedMotion.matches) model.phone.quaternion.copy(targetRotation)
  else model.phone.quaternion.slerp(targetRotation, 1 - Math.exp(-10 * delta))
  if (cameraTween) {
    cameraTween.elapsed += delta
    const t = THREE.MathUtils.smoothstep(cameraTween.elapsed, 0, 0.65)
    camera.position.lerpVectors(cameraTween.start, cameraTween.end, t)
    controls.target.lerpVectors(cameraTween.startTarget, cameraTween.endTarget, t)
    if (t === 1) cameraTween = null
  }
  controls.update(delta)
  renderer.render(scene, camera)
  software.updateGeometry(screens && model.display.part.group.visible && pose.fold > 20 && pose.explosion === 0 && knollAmount === 0)
  const foldText = `${Math.round(pose.fold)}°`
  const explosionText = `${Math.round(pose.explosion * 100)}%`
  if (foldOutput.value !== foldText) foldOutput.value = foldText
  if (explodeOutput.value !== explosionText) explodeOutput.value = explosionText
  host.dataset.fold = pose.fold.toFixed(2)
  host.dataset.explosion = pose.explosion.toFixed(3)
  host.dataset.selection = selection ?? ''
  host.dataset.knolling = knollAmount.toFixed(3)
  const opening = target.explosion > 0 && pose.fold < 180
  const assembling = target.fold < 180 && pose.explosion > 0
  const statusText = opening ? 'Opening into a service view…' : knolling ? `${model.parts.length} components, aligned on one plane. Select a part to inspect it.` : assembling ? 'Reuniting the layers before folding…' : 'Exploding opens the device into a service view.'
  if (status.textContent !== statusText) status.textContent = statusText
  const stateText = selection ? 'ISOLATED COMPONENT' : knolling ? 'KNOLLING GRID' : pose.explosion > 0 ? 'EXPLODED ASSEMBLY' : tent ? 'SELF-SUPPORTING TENT' : 'ARTICULATED ASSEMBLY'
  if (stageState.textContent !== stateText) stageState.textContent = stateText
  const dimensionsText = pose.explosion > 0 ? 'Dual-cell architecture · capacity unpublished' : pose.fold === 0 ? '84.1 × 117.8 × 11.3 mm closed' : pose.fold === 180 ? '164.6 × 117.8 × 5.2 mm open' : '117.8 mm tall · 254 g'
  if (dimension.textContent !== dimensionsText) dimension.textContent = dimensionsText
}
renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05)
  if (!document.hidden) renderFrame(delta)
})
