import * as THREE from 'three'
import { batchGroup, disc, makeMaterials, microLabel, panel, ring, slab } from './geometry'
import { createFoldingDisplay, wallpaper } from './display'
import { createDuoInternals } from './internals'
import { createHinge } from './hinge'
import { DUO, chassisOffset, foldRadians, type DuoFinish, type DuoPart, type DuoPose, type DuoSide } from './types'
import { createWallpaperLibrary, type WallpaperId } from '../wallpapers'

function halfShape(side: 'left' | 'right', inset = 0) {
  const w = DUO.halfWidth / 2 - inset
  const h = DUO.height / 2 - inset
  const outer = Math.max(0.015, 0.94 - inset)
  const inner = Math.max(0.015, 0.09 - inset / 2)
  const l = side === 'left' ? outer : inner
  const r = side === 'right' ? outer : inner
  return new THREE.Shape().moveTo(-w + l, -h).lineTo(w - r, -h)
    .quadraticCurveTo(w, -h, w, -h + r).lineTo(w, h - r)
    .quadraticCurveTo(w, h, w - r, h).lineTo(-w + l, h)
    .quadraticCurveTo(-w, h, -w, h - l).lineTo(-w, -h + l)
    .quadraticCurveTo(-w, -h, -w + l, -h)
}

function appleMark() {
  const shape = new THREE.Shape().moveTo(0, 0.31)
    .bezierCurveTo(-0.18, 0.43, -0.39, 0.41, -0.47, 0.18)
    .bezierCurveTo(-0.61, -0.15, -0.32, -0.63, -0.15, -0.57)
    .bezierCurveTo(-0.03, -0.51, 0.04, -0.51, 0.17, -0.57)
    .bezierCurveTo(0.34, -0.63, 0.49, -0.31, 0.51, -0.22)
    .bezierCurveTo(0.23, -0.08, 0.23, 0.17, 0.48, 0.29)
    .bezierCurveTo(0.31, 0.49, 0.13, 0.42, 0, 0.31).closePath()
  const leaf = new THREE.Shape().moveTo(0.015, 0.44)
    .bezierCurveTo(-0.01, 0.64, 0.14, 0.80, 0.33, 0.82)
    .bezierCurveTo(0.33, 0.62, 0.18, 0.45, 0.015, 0.44).closePath()
  return [shape, leaf]
}

export function createDuo() {
  const phone = new THREE.Group()
  phone.name = 'iPhone Duo'
  let sideButton: THREE.Mesh | null = null
  const sideButtonRestX = 8.252
  const m = makeMaterials()
  const backMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe6e6e0, roughness: 0.37, metalness: 0.15, clearcoat: 0.44, clearcoatRoughness: 0.29,
  })
  const logoMaterial = new THREE.MeshStandardMaterial({ color: 0xc3c5bf, roughness: 0.24, metalness: 0.8, side: THREE.DoubleSide })
  const coverMaps = { white: wallpaper('white', true), night: wallpaper('night', true) }
  for (const map of Object.values(coverMaps)) {
    map.repeat.set(0.48, 1)
    map.offset.set(0.26, 0)
  }
  const coverMaterial = new THREE.MeshPhysicalMaterial({
    map: coverMaps.white, emissiveMap: coverMaps.white, emissive: 0xffffff, emissiveIntensity: 0.45,
    roughness: 0.16, metalness: 0.06, clearcoat: 0.6, clearcoatRoughness: 0.12, side: THREE.BackSide,
  })
  const parts: DuoPart[] = []
  const addPart = (id: string, name: string, side: DuoSide, group: THREE.Group, detail: string, offset: THREE.Vector3) => {
    const part: DuoPart = { id, name, side, group, detail, offset, evidence: 'documented' }
    parts.push(part)
    return part
  }

  for (const side of ['left', 'right'] as const) {
    const center = side === 'left' ? -DUO.halfCenter : DUO.halfCenter
    const chassis = new THREE.Group()
    const rimShape = halfShape(side, 0.014)
    rimShape.holes.push(halfShape(side, 0.115))
    const rim = slab(rimShape, DUO.depth - 0.024, m.titanium, 0.012)
    rim.position.x = center
    chassis.add(rim)
    for (const z of [-0.246, 0.246]) {
      const lineShape = halfShape(side, 0.027)
      lineShape.holes.push(halfShape(side, 0.06))
      const edge = slab(lineShape, 0.012, m.steel, 0)
      edge.position.set(center, 0, z)
      chassis.add(edge)
    }
    const baseShape = halfShape(side, 0.14)
    if (side === 'right') {
      for (const x of [4.6, 6.75]) baseShape.holes.push(new THREE.Path().absarc(x - center, 4.35, 0.75, 0, Math.PI * 2, true))
      baseShape.holes.push(new THREE.Path().absarc(4.3 - center, -0.9, 2.2, 0, Math.PI * 2, true))
    }
    const base = slab(baseShape, 0.038, m.aluminum, 0.006)
    base.position.set(center, 0, -0.199)
    chassis.add(base)
    const hingeX = side === 'left' ? -0.599 : 0.599
    for (const sign of [-1, 1]) for (const y of [1.3, 2.101, 4.181, 5.48]) {
      disc(chassis, 0.095, 0.184, m.aluminum, hingeX, sign * y, -0.096)
      ring(chassis, 0.060, 0.032, 0.012, m.steel, hingeX, sign * y, -0.01)
    }
    // Real raised lands, threaded bosses and milled ribs replace a solid block.
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 12; i++) {
        const y = -4.85 + i * 0.875
        panel(chassis, 0.11, 0.29, 0.11, m.aluminum, center + sign * 3.87, y, -0.1, 0.016)
        disc(chassis, 0.06, 0.022, m.steel, center + sign * 3.84, y, -0.031)
        disc(chassis, 0.024, 0.026, m.black, center + sign * 3.84, y, -0.016)
      }
    }
    for (const y of [-5.56, 5.56]) {
      panel(chassis, 6.64, 0.10, 0.10, m.aluminum, center, y, -0.09)
      for (const x of [-2.8, -1.7, 1.7, 2.8]) {
        disc(chassis, 0.072, 0.07, m.aluminum, center + x, y, -0.11)
        disc(chassis, 0.022, 0.08, m.black, center + x, y, -0.09)
      }
    }
    const gasketShape = halfShape(side, 0.079)
    gasketShape.holes.push(halfShape(side, 0.10))
    const seal = slab(gasketShape, 0.009, m.black, 0)
    seal.position.set(center, 0, 0.252)
    chassis.add(seal)
    const bezelShape = halfShape(side, 0.068)
    bezelShape.holes.push(halfShape(side, 0.345))
    const bezel = slab(bezelShape, 0.008, m.black, 0)
    bezel.position.set(center, 0, 0.251)
    chassis.add(bezel)
    const freeEdge = side === 'left' ? -8.235 : 8.235
    for (const y of [-4.55, 4.55]) panel(chassis, 0.011, 0.055, 0.43, m.graphite, freeEdge, y, 0, 0.004)
    for (const y of [-5.892, 5.892]) {
      for (const x of [-2.35, 1.70]) {
        const separator = panel(chassis, 0.053, 0.01, 0.42, m.graphite, center + x, y, 0, 0.003)
        separator.name = 'Ceramic-fiber antenna split'
      }
    }
    if (side === 'right') {
      for (const [y, length] of [[1.5, 1.48], [-2.42, 1.12]]) {
        const socket = panel(chassis, 0.19, length + 0.05, 0.015, m.black, 8.241, y, 0.005, 0.07)
        socket.rotation.y = Math.PI / 2
        if (y !== 1.5) {
          const button = panel(chassis, 0.15, length, 0.021, m.titanium, 8.252, y, 0.005, 0.065)
          button.rotation.y = Math.PI / 2
        }
      }
      for (const x of [4.64, 5.82]) {
        const button = panel(chassis, 0.86, 0.15, 0.025, m.titanium, x, 5.902, 0, 0.06)
        button.rotation.x = -Math.PI / 2
      }
    }
    const edgeHardware = new THREE.Group()
    const top = side === 'left'
    edgeHardware.position.y = top ? 5.895 : -5.895
    edgeHardware.rotation.x = top ? -Math.PI / 2 : Math.PI / 2
    chassis.add(edgeHardware)
    for (let i = 0; i < 10; i++) {
      disc(edgeHardware, 0.035, 0.008, m.black, center - 0.63 + i * 0.14, 0, 0)
    }
    if (side === 'right') {
      panel(edgeHardware, 0.90, 0.236, 0.005, m.steel, 3.04, 0, 0.002, 0.108)
      panel(edgeHardware, 0.82, 0.175, 0.008, m.black, 3.04, 0, 0.007, 0.078)
      panel(edgeHardware, 0.63, 0.045, 0.009, m.graphite, 3.04, 0, 0.012, 0.016)
      for (let i = 0; i < 12; i++) {
        panel(edgeHardware, 0.02, 0.05, 0.002, m.gold, 2.80 + i * 0.044, 0, 0.018, 0.003)
      }
    }
    microLabel(chassis, ['DUO / TITANIUM SUBSTRUCTURE', '5.2 MM  |  eSIM ONLY'], center, -4.87, -0.176, 1.8)
    batchGroup(chassis)
    if (side === 'right') {
      sideButton = panel(chassis, 0.15, 1.48, 0.021, m.titanium, sideButtonRestX, 1.5, 0.005, 0.065)
      sideButton.rotation.y = Math.PI / 2
      sideButton.name = 'Side button'
      sideButton.userData.control = 'home'
    }
    addPart(`frame-${side}`, `${side === 'left' ? 'Cover-side' : 'Camera-side'} chassis`, side, chassis,
      '5.2 mm half-body with mirror-finished Grade 5 titanium perimeter, structural ribs, ceramic-fiber antenna splits and miniature mounting features. Small internal mounting locations are inferred.',
      chassisOffset(side))
  }
  if (!sideButton) throw new Error('Side button was not created')

  const cover = new THREE.Group()
  const coverBase = slab(halfShape('left', 0.067), 0.014, m.black, 0.004)
  coverBase.position.set(-DUO.halfCenter, 0, -0.251)
  cover.add(coverBase)
  const coverShape = halfShape('left', 0.19)
  const coverGeometry = new THREE.ShapeGeometry(coverShape, 40)
  coverGeometry.scale(1, DUO.coverHeight / (DUO.height - 0.38), 1)
  const position = coverGeometry.getAttribute('position')
  const uv = coverGeometry.getAttribute('uv')
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, 1 - (position.getX(i) / DUO.coverWidth + 0.5), position.getY(i) / DUO.coverHeight + 0.5)
  }
  const coverScreen = new THREE.Mesh(coverGeometry, coverMaterial)
  coverScreen.position.set(-DUO.halfCenter, 0, -0.260)
  cover.add(coverScreen)
  disc(cover, 0.21, 0.002, m.black, -7.20, 4.83, -0.262)
  disc(cover, 0.13, 0.002, m.lens, -7.20, 4.83, -0.264)
  const coverBack = panel(cover, 7.45, 10.86, 0.006, m.graphite, -DUO.halfCenter, 0, -0.244, 0.40)
  coverBack.name = 'Cover OLED graphite backing'
  panel(cover, 0.26, 0.70, 0.015, m.graphite, -1.53, -2.78, -0.228, 0.025)
  microLabel(cover, ['1398 x 2034 / 460 PPI', 'COVER DISPLAY FPC'], -DUO.halfCenter, -4.80, -0.235, 1.4)
  batchGroup(cover)
  addPart('cover-display', '5.4″ cover display', 'left', cover,
    'Ceramic Shield 2 over the 1398 × 2034 OLED, with a Center Stage camera in the rounded corner. The outer surface faces forward when the phone is closed.',
    new THREE.Vector3(-2.0, -0.3, -3.0))

  const rear = new THREE.Group()
  const backShape = halfShape('right', 0.064)
  for (const [x, r] of [[4.6, 0.57], [6.75, 0.53]]) {
    backShape.holes.push(new THREE.Path().absarc(x - DUO.halfCenter, 4.35, r, 0, Math.PI * 2, true))
  }
  const back = slab(backShape, 0.019, backMaterial, 0.005)
  back.position.set(DUO.halfCenter, 0, -0.251)
  rear.add(back)
  const plateauShape = new THREE.Shape()
    .moveTo(1.68, 3.46).quadraticCurveTo(1.68, 3.12, 2.02, 3.12)
    .lineTo(7.10, 3.12).quadraticCurveTo(7.96, 3.12, 7.96, 3.98)
    .lineTo(7.96, 4.94).quadraticCurveTo(7.96, 5.62, 7.26, 5.62)
    .lineTo(2.02, 5.62).quadraticCurveTo(1.68, 5.62, 1.68, 5.28).closePath()
  for (const [x, r] of [[4.6, 0.57], [6.75, 0.53]]) plateauShape.holes.push(new THREE.Path().absarc(x, 4.35, r, 0, Math.PI * 2, true))
  const plateau = slab(plateauShape, 0.21, backMaterial, 0.027)
  plateau.position.z = -0.352
  rear.add(plateau)
  for (const [x, r] of [[4.6, 0.64], [6.75, 0.60]]) {
    ring(rear, r, r - 0.10, 0.17, m.titanium, x, 4.35, -0.522)
    ring(rear, r - 0.093, r - 0.13, 0.014, m.black, x, 4.35, -0.613)
    const lensCover = new THREE.Mesh(new THREE.CircleGeometry(r - 0.112, 64), new THREE.MeshPhysicalMaterial({
      color: 0xa4b4c8, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.17, side: THREE.DoubleSide,
    }))
    lensCover.position.set(x, 4.35, -0.626)
    rear.add(lensCover)
  }
  disc(rear, 0.10, 0.008, m.black, 2.33, 4.64, -0.465)
  disc(rear, 0.14, 0.01, new THREE.MeshStandardMaterial({ color: 0xd7d2bb, roughness: 0.48 }), 2.33, 4.03, -0.465)
  const logo = new THREE.Mesh(new THREE.ShapeGeometry(appleMark(), 24), logoMaterial)
  logo.scale.x = -1
  logo.position.set(DUO.halfCenter, -0.38, -0.273)
  rear.add(logo)
  panel(rear, 7.47, 7.45, 0.007, m.graphite, DUO.halfCenter, -1.43, -0.242, 0.32)
  microLabel(rear, ['DUO / REAR CERAMIC SHIELD', 'NIGHT SKY / STAR WHITE'], DUO.halfCenter, -4.82, -0.234, 1.6)
  batchGroup(rear)
  addPart('rear-glass', 'Camera plateau & rear glass', 'right', rear,
    'Ceramic Shield back with a raised plateau and exactly two rear optical windows. The 2× telephoto mode is a crop from the Main camera, not a third lens.',
    new THREE.Vector3(2.4, 0.4, -3.1))

  const display = createFoldingDisplay()
  const hinge = createHinge(m)
  parts.unshift(display.part)
  parts.push(...createDuoInternals(m), ...hinge.parts)
  const leftPivot = new THREE.Group()
  leftPivot.position.z = DUO.pivotZ
  const leftMount = new THREE.Group()
  leftMount.position.z = -DUO.pivotZ
  leftPivot.add(leftMount)
  const rightMount = new THREE.Group()
  phone.add(leftPivot, rightMount)
  for (const part of parts) {
    part.group.name = part.name
    part.group.userData.partId = part.id
    part.group.traverse(child => { child.userData.partId = part.id })
    if (part.side === 'left') leftMount.add(part.group)
    else if (part.side === 'right') rightMount.add(part.group)
    else phone.add(part.group)
  }
  let finish: DuoFinish = 'white'
  const customWallpapers = createWallpaperLibrary(true)
  let selectedWallpaper: WallpaperId = 'original'
  let screenOn = true
  let previousFold = -1
  let previousExplosion = -1
  function setPose(pose: DuoPose) {
    const t = THREE.MathUtils.clamp(pose.explosion, 0, 1)
    const angle = t > 0 ? 180 : THREE.MathUtils.clamp(pose.fold, 0, 180)
    if (angle !== previousFold) {
      leftPivot.rotation.y = foldRadians(angle)
      display.setFold(angle)
      hinge.setFold(angle)
      previousFold = angle
    }
    if (t !== previousExplosion) {
      for (const part of parts) part.group.position.copy(part.offset).multiplyScalar(t)
      hinge.setExplosion(t)
      previousExplosion = t
    }
  }
  function updateCover() {
    const background = customWallpapers(selectedWallpaper) ?? coverMaps[finish]
    background.repeat.set(0.48, 1)
    background.offset.set(0.26, 0)
    coverMaterial.map = screenOn ? background : null
    coverMaterial.emissiveMap = screenOn ? background : null
    coverMaterial.emissiveIntensity = screenOn ? 0.45 : 0
    coverMaterial.color.setHex(screenOn ? 0xffffff : 0x05080b)
    coverMaterial.needsUpdate = true
  }
  setPose({ fold: 130, explosion: 0 })
  return {
    phone,
    parts,
    display,
    sideButton,
    setPose,
    setSideButtonPress(amount: number) {
      sideButton.position.x = sideButtonRestX - THREE.MathUtils.clamp(amount, 0, 1) * 0.045
    },
    setColor(value: string) {
      m.titanium.color.set(value)
      backMaterial.color.set(value)
      logoMaterial.color.set(value).multiplyScalar(0.65)
      hinge.setColor(value)
    },
    setWallpaper(value: WallpaperId) {
      selectedWallpaper = value
      display.setWallpaper(value)
      updateCover()
    },
    setFinish(value: DuoFinish) {
      finish = value
      m.titanium.color.setHex(value === 'white' ? 0xb8b5b0 : 0x38495e)
      backMaterial.color.setHex(value === 'white' ? 0xe6e6e0 : 0x263748)
      logoMaterial.color.setHex(value === 'white' ? 0xc3c5bf : 0x101e2b)
      hinge.setFinish(value)
      display.setFinish(value)
      updateCover()
    },
    setScreen(value: boolean) {
      screenOn = value
      display.setScreen(value)
      updateCover()
    },
  }
}
