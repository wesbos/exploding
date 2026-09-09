import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createInternals, type InternalPart } from './internals'

export const finishes = {
  black: { name: 'Natural titanium', rim: 0x99938b, back: 0x8c877f },
  blue: { name: 'Blue titanium', rim: 0x626e7c, back: 0x354352 },
  white: { name: 'White titanium', rim: 0xc6c4bf, back: 0xd8d6cf },
}
export type Finish = keyof typeof finishes
export type PhonePart = InternalPart

function batchPart(group: THREE.Group) {
  group.updateMatrixWorld(true)
  const inverse = group.matrixWorld.clone().invert()
  const batches = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>()
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || Array.isArray(object.material)) return
    const attributes = Object.keys(object.geometry.attributes).sort().join(',')
    const key = `${object.material.uuid}:${attributes}`
    let batch = batches.get(key)
    if (!batch) {
      batch = { material: object.material, geometries: [], meshes: [] }
      batches.set(key, batch)
    }
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()
    geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld))
    batch.geometries.push(geometry)
    batch.meshes.push(object)
  })
  // A machined assembly may contain hundreds of contacts and fasteners. Batch
  // static surfaces per material, keeping each exploded component independent.
  for (const batch of batches.values()) {
    const merged = mergeGeometries(batch.geometries)
    if (!merged) throw new Error(`Could not batch ${group.name} geometry`)
    for (const mesh of batch.meshes) mesh.removeFromParent()
    batch.geometries.forEach(geometry => geometry.dispose())
    group.add(new THREE.Mesh(merged, batch.material))
  }
}

function roundedRect(w: number, h: number, r: number) {
  return new THREE.Shape()
    .moveTo(-w / 2 + r, -h / 2).lineTo(w / 2 - r, -h / 2)
    .quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r).lineTo(w / 2, h / 2 - r)
    .quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2).lineTo(-w / 2 + r, h / 2)
    .quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r).lineTo(-w / 2, -h / 2 + r)
    .quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
}

function circleHole(x: number, y: number, radius: number) {
  return new THREE.Path().absarc(x, y, radius, 0, Math.PI * 2, true)
}

function solid(shape: THREE.Shape, depth: number, material: THREE.Material, bevel = 0) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: 3, curveSegments: 32,
  })
  geometry.translate(0, 0, -depth / 2 + bevel)
  return new THREE.Mesh(geometry, material)
}

function face(shape: THREE.Shape, material: THREE.Material) {
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 32), material)
}

function panel(parent: THREE.Group, w: number, h: number, depth: number, material: THREE.Material, x = 0, y = 0, z = 0, radius = 0.03) {
  const mesh = solid(roundedRect(w, h, radius), depth, material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

function surfaceTexture(kind: 'brushed' | 'graphite') {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(512, 512)
  let seed = 7381
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let y = 0; y < 512; y++) {
    const row = random() * 22
    for (let x = 0; x < 512; x++) {
      const value = kind === 'brushed' ? 128 + row + random() * 5 : 127 + random() * 32
      const i = (y * 512 + x) * 4
      image.data[i] = image.data[i + 1] = image.data[i + 2] = value
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1.5, 1.5)
  return texture
}

function gasket(w: number, h: number, radius: number, thickness: number, material: THREE.Material) {
  const shape = roundedRect(w, h, radius)
  shape.holes.push(roundedRect(w - thickness * 2, h - thickness * 2, radius - thickness))
  return solid(shape, 0.009, material)
}

function microprint(parent: THREE.Group, lines: string[], x: number, y: number, z: number, width: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#8e928f'
  ctx.font = '18px monospace'
  lines.forEach((line, i) => ctx.fillText(line, 110, 30 + i * 25))
  // An original matrix-style manufacturing mark, not a functional barcode.
  for (let row = 0; row < 17; row++) {
    for (let col = 0; col < 17; col++) {
      if (row === 0 || col === 0 || ((row * 19 + col * 31 + row * col) % 7 < 3)) {
        ctx.fillRect(8 + col * 5, 16 + row * 5, 4, 4)
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }))
  mark.rotation.y = Math.PI
  mark.position.set(x, y, z)
  parent.add(mark)
}

export function createPhone() {
  const phone = new THREE.Group()
  phone.name = 'iPhone 15 Pro'
  phone.scale.x = (70.6 / 146.6 * 6.36) / 3.03
  const brushed = surfaceTexture('brushed')
  const grain = surfaceTexture('graphite')
  const rim = new THREE.MeshStandardMaterial({
    color: finishes.black.rim, metalness: 0.88, roughness: 0.36, bumpMap: brushed, bumpScale: 0.0015,
  })
  const backGlass = new THREE.MeshPhysicalMaterial({
    color: finishes.black.back, roughness: 0.48, metalness: 0.12,
    clearcoat: 0.2, clearcoatRoughness: 0.35, bumpMap: grain, bumpScale: 0.0007,
  })
  const aluminum = new THREE.MeshStandardMaterial({
    color: 0xb0b0a5, metalness: 0.78, roughness: 0.43, bumpMap: brushed, bumpScale: 0.0008,
  })
  const steel = new THREE.MeshStandardMaterial({ color: 0xb7bbc0, metalness: 0.92, roughness: 0.23 })
  const graphite = new THREE.MeshStandardMaterial({
    color: 0x222327, roughness: 0.65, metalness: 0.15, bumpMap: grain, bumpScale: 0.001,
  })
  const black = new THREE.MeshStandardMaterial({ color: 0x090b0d, roughness: 0.5, metalness: 0.18 })
  const gold = new THREE.MeshStandardMaterial({ color: 0xb7a273, metalness: 0.75, roughness: 0.36 })
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x0b1422, roughness: 0.07, metalness: 0.25, clearcoat: 1,
    iridescence: 0.4, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 350],
  })
  const frame = new THREE.Group()
  const display = new THREE.Group()
  const rear = new THREE.Group()
  const charging = new THREE.Group()

  // The Pro chassis has a structural aluminum midplate behind the battery,
  // with apertures for the camera assembly and inductive charging.
  const rimShape = roundedRect(3.03, 6.36, 0.43)
  rimShape.holes.push(roundedRect(2.84, 6.17, 0.35))
  frame.add(solid(rimShape, 0.334, rim, 0.012))
  for (const z of [-0.163, 0.163]) {
    const lip = gasket(2.98, 6.31, 0.413, 0.045, steel)
    lip.position.z = z
    frame.add(lip)
  }
  const midplateShape = roundedRect(2.88, 6.20, 0.36)
  midplateShape.holes.push(circleHole(0, -0.38, 0.94))
  for (const [x, y, r] of [[0.96, 2.55, 0.34], [0.96, 1.76, 0.35], [0.28, 2.155, 0.32]]) {
    midplateShape.holes.push(circleHole(x, y, r))
  }
  const midplate = solid(midplateShape, 0.025, aluminum)
  midplate.position.z = -0.132
  frame.add(midplate)
  const apertureRim = new THREE.Mesh(new THREE.TorusGeometry(0.955, 0.008, 6, 96), steel)
  apertureRim.position.set(0, -0.38, -0.115)
  frame.add(apertureRim)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const y = -2.67 + i * 0.48
      panel(frame, 0.07, 0.17, 0.06, steel, side * 1.39, y, -0.04, 0.012)
      panel(frame, 0.05, 0.055, 0.016, black, side * 1.385, y, 0.002, 0.007)
    }
  }

  const screwGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.014, 20)
  screwGeometry.rotateX(Math.PI / 2)
  const screwLocations: [number, number][] = [
    [-1.3, 2.86], [-0.85, 2.91], [0.61, 2.95], [1.30, 2.9],
    [-1.33, 1.99], [-0.42, 1.17], [1.34, 1.36], [-1.34, -0.22],
    [1.34, -0.64], [-1.33, -1.41], [1.33, -2.34], [-1.27, -2.91],
    [-0.79, -2.59], [0.47, -2.65], [1.23, -2.93],
  ]
  for (const [x, y] of screwLocations) {
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.055, 20), aluminum)
    boss.rotation.x = Math.PI / 2
    boss.position.set(x, y, -0.07)
    frame.add(boss)
    const screw = new THREE.Mesh(screwGeometry, steel)
    screw.position.set(x, y, -0.034)
    frame.add(screw)
    for (let arm = 0; arm < 3; arm++) {
      const slot = panel(frame, 0.006, 0.035, 0.001, black, x, y, -0.026, 0.001)
      slot.rotation.z = arm * Math.PI * 2 / 3
    }
  }
  for (const [x, y, w, h] of [[-1.02, -1.82, 0.26, 0.7], [-0.8, 2.49, 0.6, 0.22], [0.52, -2.8, 0.6, 0.18]]) {
    panel(frame, w, h, 0.002, graphite, x, y, -0.115)
  }
  function sideButton(side: number, y: number, length: number) {
    const socket = solid(roundedRect(0.135, length + 0.035, 0.055), 0.012, black)
    socket.rotation.y = side * Math.PI / 2
    socket.position.set(side * 1.516, y, 0)
    frame.add(socket)
    const button = solid(roundedRect(0.11, length, 0.045), 0.018, rim, 0.004)
    button.rotation.y = side * Math.PI / 2
    button.position.set(side * 1.529, y, 0)
    frame.add(button)
  }
  sideButton(-1, 1.99, 0.29)
  sideButton(-1, 1.25, 0.59)
  sideButton(-1, 0.47, 0.59)
  sideButton(1, 1, 0.87)
  for (const side of [-1, 1]) {
    for (const y of [-2.43, 2.44]) {
      panel(frame, 0.008, 0.045, 0.29, graphite, side * 1.516, y, 0, 0.002)
    }
  }
  const bottom = new THREE.Group()
  bottom.rotation.x = Math.PI / 2
  bottom.position.y = -3.182
  frame.add(bottom)
  panel(bottom, 0.48, 0.145, 0.003, steel, 0, 0, 0, 0.069)
  panel(bottom, 0.44, 0.112, 0.003, black, 0, 0, 0.003, 0.052)
  panel(bottom, 0.30, 0.026, 0.003, graphite, 0, 0, 0.006, 0.012)
  for (let pin = 0; pin < 12; pin++) {
    panel(bottom, 0.009, 0.026, 0.001, gold, -0.132 + pin * 0.024, 0, 0.008, 0.001)
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.032, 24), black)
      hole.position.set(side * (0.64 + i * 0.115), 0, 0.002)
      bottom.add(hole)
    }
    const screw = new THREE.Mesh(screwGeometry, steel)
    screw.position.set(side * 0.4, 0, 0)
    bottom.add(screw)
    panel(bottom, 0.02, 0.005, 0.002, black, side * 0.4, 0, 0.008, 0.001)
  }

  // The display's graphite and steel backing stay with the display, not a
  // fictitious full-size loose shield between it and the internal components.
  panel(display, 2.95, 6.28, 0.024, black, 0, 0, 0.171, 0.395)
  const displayGlass = new THREE.MeshPhysicalMaterial({
    color: 0x06090d, roughness: 0.13, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.06,
  })
  const screen = face(roundedRect(2.81, 6.11, 0.335), displayGlass)
  screen.position.z = 0.185
  display.add(screen)
  panel(display, 0.84, 0.225, 0.003, black, 0, 2.775, 0.19, 0.112)
  const selfie = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), glass)
  selfie.position.set(0.28, 2.775, 0.193)
  display.add(selfie)
  panel(display, 0.54, 0.016, 0.002, aluminum, 0, -2.97, 0.187, 0.007)
  panel(display, 0.43, 0.022, 0.003, black, 0, 3.09, 0.185, 0.01)
  panel(display, 2.85, 6.17, 0.006, aluminum, 0, 0, 0.155, 0.36)
  const graphiteShape = new THREE.Shape()
    .moveTo(-1.24, -2.55).lineTo(1.22, -2.55).lineTo(1.22, 1.7)
    .lineTo(0.86, 1.7).lineTo(0.86, 2.40).lineTo(-0.60, 2.40)
    .lineTo(-0.60, 2.82).lineTo(-1.23, 2.82).closePath()
  const graphiteFoil = solid(graphiteShape, 0.003, graphite)
  graphiteFoil.position.z = 0.150
  display.add(graphiteFoil)
  for (const x of [-1.38, 1.38]) {
    for (const y of [-2.66, -1.57, -0.2, 1.35, 2.65]) {
      panel(display, 0.05, 0.095, 0.008, gold, x, y, 0.145, 0.006)
    }
  }
  for (const [x, y, width] of [[-0.85, -0.2, 0.18], [-0.7, 2.36, 0.1]]) {
    const cable = new THREE.Mesh(new THREE.BoxGeometry(width, 0.50, 0.008), graphite)
    cable.position.set(x, y, 0.096)
    cable.rotation.x = -0.28
    display.add(cable)
    panel(display, width + 0.045, 0.13, 0.015, black, x, y - 0.24, 0.04, 0.012)
    for (let i = 0; i < 8; i++) {
      panel(display, 0.008, 0.07, 0.002, gold, x - width * 0.4 + i * width * 0.11, y - 0.24, 0.029, 0.001)
    }
  }
  const seal = gasket(2.98, 6.31, 0.411, 0.02, aluminum)
  seal.position.z = 0.151
  display.add(seal)
  microprint(display, ['D83 / OLED LAMINATE', '6.1  SUPER RETINA', 'DISPLAY ASSEMBLY'], 0, -2.80, 0.145, 0.88)
  microprint(display, ['FPC / 02', 'DISPLAY'], -0.93, -0.18, 0.137, 0.32)

  const rearLocal = new THREE.Group()
  rearLocal.rotation.y = Math.PI
  rearLocal.position.z = -0.182
  rear.add(rearLocal)
  const rearShape = roundedRect(2.95, 6.28, 0.399)
  const cameraCenters = [[-0.96, 2.55], [-0.96, 1.76], [-0.28, 2.155]]
  cameraCenters.forEach(([x, y]) => rearShape.holes.push(circleHole(x, y, 0.276)))
  rearLocal.add(solid(rearShape, 0.018, backGlass))
  const cameraIsland = roundedRect(1.64, 1.82, 0.31)
  cameraCenters.forEach(([x, y]) => cameraIsland.holes.push(circleHole(x + 0.61, y - 2.12, 0.276)))
  const island = solid(cameraIsland, 0.075, backGlass)
  island.position.set(-0.61, 2.12, 0.043)
  rearLocal.add(island)
  for (const [x, y] of cameraCenters) {
    const annulus = new THREE.Shape().absarc(0, 0, 0.308, 0, Math.PI * 2, false)
    annulus.holes.push(circleHole(0, 0, 0.264))
    const lensRing = solid(annulus, 0.12, rim, 0.003)
    lensRing.position.set(x, y, 0.13)
    rearLocal.add(lensRing)
    const lensCover = new THREE.Mesh(new THREE.CircleGeometry(0.26, 64),
      new THREE.MeshPhysicalMaterial({ color: 0x899aaf, metalness: 0.05, roughness: 0.06, transparent: true, opacity: 0.24, side: THREE.DoubleSide }))
    lensCover.position.set(x, y, 0.192)
    rearLocal.add(lensCover)
    const gasketRing = new THREE.Mesh(new THREE.TorusGeometry(0.263, 0.009, 8, 64), black)
    gasketRing.position.set(x, y, 0.18)
    rearLocal.add(gasketRing)
  }
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.097, 32), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.4 }))
  flash.position.set(-0.28, 2.71, 0.084)
  rearLocal.add(flash)
  const lidar = new THREE.Mesh(new THREE.CircleGeometry(0.095, 32), black)
  lidar.position.set(-0.28, 1.59, 0.084)
  rearLocal.add(lidar)
  const mic = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), black)
  mic.position.set(0.015, 1.78, 0.084)
  rearLocal.add(mic)

  const rearFoilShape = new THREE.Shape()
    .moveTo(-1.05, -3.05).lineTo(1.05, -3.05)
    .quadraticCurveTo(1.385, -3.05, 1.385, -2.72)
    .lineTo(1.385, 1.08).lineTo(-0.30, 1.08).lineTo(-0.30, 3.05)
    .lineTo(-1.05, 3.05).quadraticCurveTo(-1.385, 3.05, -1.385, 2.72)
    .lineTo(-1.385, -2.72).quadraticCurveTo(-1.385, -3.05, -1.05, -3.05)
  const rearFoil = solid(rearFoilShape, 0.004, graphite)
  rearFoil.position.z = -0.168
  rear.add(rearFoil)
  for (const x of [-1.35, 1.35]) {
    for (const y of [-2.63, -1.7, 0.1, 1.3]) {
      panel(rear, 0.045, 0.13, 0.019, steel, x, y, -0.145, 0.005)
    }
    microprint(rearLocal, ['D83  REAR GLASS', 'NFC / INDUCTION', 'ASSEMBLY 03'], 0.10, -2.35, -0.026, 0.8)
  }

  // The MagSafe coil is a black ferrite-backed assembly. Fine copper windings
  // are exposed only at its edge, not oversized orange rings.
  const ferrite = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.016, 96), graphite)
  ferrite.rotation.x = Math.PI / 2
  ferrite.position.set(0, -0.38, -0.148)
  charging.add(ferrite)
  const copper = new THREE.MeshStandardMaterial({ color: 0x82694c, metalness: 0.78, roughness: 0.42 })
  for (let i = 0; i < 10; i++) {
    const winding = new THREE.Mesh(new THREE.TorusGeometry(0.81 + i * 0.01, 0.0028, 5, 96), copper)
    winding.position.set(0, -0.38, -0.136)
    charging.add(winding)
  }
  const coilCap = new THREE.Mesh(new THREE.CircleGeometry(0.80, 96), graphite)
  coilCap.position.set(0, -0.38, -0.134)
  charging.add(coilCap)
  for (let i = 0; i < 18; i++) {
    const magnetShape = new THREE.Shape()
    const start = i / 18 * Math.PI * 2 + 0.018
    const end = (i + 1) / 18 * Math.PI * 2 - 0.018
    magnetShape.absarc(0, 0, 1.06, start, end, false)
    magnetShape.absarc(0, 0, 0.977, end, start, true).closePath()
    const magnet = solid(magnetShape, 0.016, black)
    magnet.position.set(0, -0.38, -0.143)
    charging.add(magnet)
  }
  panel(charging, 0.15, 0.44, 0.014, black, 0, -1.65, -0.15, 0.025)
  const coilFlex = new THREE.Shape().moveTo(-0.15, -0.15).lineTo(-0.75, 0.35)
    .lineTo(-0.75, 0.95).lineTo(-0.55, 0.95).lineTo(-0.55, 0.48).lineTo(0.1, 0).closePath()
  const cable = solid(coilFlex, 0.008, graphite)
  cable.position.z = -0.122
  charging.add(cable)
  panel(charging, 0.22, 0.13, 0.018, black, -0.65, 0.96, -0.121, 0.014)
  for (let i = 0; i < 8; i++) {
    panel(charging, 0.011, 0.075, 0.002, gold, -0.726 + i * 0.022, 0.96, -0.11, 0.001)
  }

  const internals = createInternals()
  const parts: PhonePart[] = [
    { id: 'display', name: 'OLED display', detail: 'Ceramic Shield glass, OLED laminate, steel backplate, graphite film and display flex connectors.', group: display, offset: new THREE.Vector3(-3.5, 0.1, 2.25) },
    { id: 'frame', name: 'Titanium chassis', detail: 'Titanium perimeter around an aluminum structural midframe. Machined camera and charging apertures, mounting bosses and perimeter clips.', group: frame, offset: new THREE.Vector3() },
    ...internals,
    { id: 'charging', name: 'MagSafe assembly', detail: 'Ferrite-backed induction coil, segmented alignment magnets and NFC / charging flex. Windings are modeled beneath the outer graphite film.', group: charging, offset: new THREE.Vector3(2.0, -0.3, -0.85) },
    { id: 'rear-glass', name: 'Rear glass', detail: 'Removable matte glass with graphite lining, raised camera bezels, three optical windows, LiDAR window and flash diffuser.', group: rear, offset: new THREE.Vector3(3.4, 0.1, -1.8) },
  ]
  for (const part of parts) {
    part.group.name = part.name
    batchPart(part.group)
    part.group.userData.partId = part.id
    part.group.traverse(child => { child.userData.partId = part.id })
    phone.add(part.group)
  }
  return {
    phone,
    parts,
    setExplosion(amount: number) {
      const t = THREE.MathUtils.clamp(amount, 0, 1)
      for (const part of parts) part.group.position.copy(part.offset).multiplyScalar(t)
      // Turn the detached display to expose its graphite-lined back and connectors.
      display.rotation.y = -2.35 * t
      rear.rotation.y = 0.14 * t
    },
    setFinish(finish: Finish) {
      rim.color.setHex(finishes[finish].rim)
      backGlass.color.setHex(finishes[finish].back)
    },
  }
}
