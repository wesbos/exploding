import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export interface InternalPart {
  id: string
  name: string
  detail: string
  group: THREE.Group
  offset: THREE.Vector3
}

type Point = [number, number]

function polygon(points: Point[]) {
  const shape = new THREE.Shape()
  points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y))
  shape.closePath()
  return shape
}

function rounded(width: number, height: number, radius = 0.025) {
  const x = width / 2
  const y = height / 2
  const r = Math.min(radius, x, y)
  return new THREE.Shape().moveTo(-x + r, -y).lineTo(x - r, -y)
    .quadraticCurveTo(x, -y, x, -y + r).lineTo(x, y - r)
    .quadraticCurveTo(x, y, x - r, y).lineTo(-x + r, y)
    .quadraticCurveTo(-x, y, -x, y - r).lineTo(-x, -y + r)
    .quadraticCurveTo(-x, -y, -x + r, -y)
}

function extrude(shape: THREE.Shape, depth: number, bevel = 0.003) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelSize: bevel,
    bevelThickness: bevel, bevelSegments: 2, steps: 1, curveSegments: 12,
  })
  geometry.translate(0, 0, -depth / 2 + bevel)
  return geometry
}

function canvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('A 2D canvas is required for the component surface details.')
  paint(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function matrixCode(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number) {
  const rand = randomSource(seed)
  const unit = size / 18
  ctx.fillStyle = '#9b9c8d'
  for (let row = 0; row < 18; row++) {
    for (let col = 0; col < 18; col++) {
      if (row === 17 || col === 0 || (row === 0 && col % 2 === 0) ||
        (col === 17 && row % 2 === 0) || rand() > 0.51) {
        ctx.fillRect(x + col * unit, y + row * unit, unit * 0.85, unit * 0.85)
      }
    }
  }
}

function materials() {
  const grain = canvasTexture(256, 256, ctx => {
    const rand = randomSource(9481)
    const data = ctx.createImageData(256, 256)
    for (let y = 0; y < 256; y++) {
      const line = rand() * 8
      for (let x = 0; x < 256; x++) {
        const i = (y * 256 + x) * 4
        const shade = 192 + line + rand() * 22
        data.data[i] = data.data[i + 1] = data.data[i + 2] = shade
        data.data[i + 3] = 255
      }
    }
    ctx.putImageData(data, 0, 0)
  })
  grain.colorSpace = THREE.NoColorSpace
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  const metal = (color: number, roughness = 0.45, metalness = 0.8) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, roughnessMap: grain })
  return {
    silver: metal(0xa8aaa5, 0.42),
    shield: metal(0xaaa795, 0.58),
    darkMetal: metal(0x343631, 0.56),
    gold: metal(0xb19a60, 0.36),
    copper: metal(0x855032, 0.56),
    ceramic: metal(0x8a8170, 0.83, 0.1),
    solder: metal(0x91978b, 0.36),
    black: metal(0x111413, 0.76, 0.12),
    graphite: metal(0x222422, 0.7, 0.19),
    board: metal(0x132019, 0.68, 0.16),
    amber: metal(0x57351c, 0.65, 0.13),
    lens: new THREE.MeshPhysicalMaterial({
      color: 0x101923, roughness: 0.11, metalness: 0.32,
      clearcoat: 1, clearcoatRoughness: 0.03,
    }),
    coating: new THREE.MeshStandardMaterial({
      color: 0x17332f, roughness: 0.2, metalness: 0.62,
    }),
  }
}

type Materials = ReturnType<typeof materials>

// Bake the repeated contacts, shield folds and fasteners into material batches.
// Every part remains independent, but a row of 40 contacts costs one draw call.
class Assembly {
  readonly group = new THREE.Group()
  private batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  private transform = new THREE.Matrix4()
  private position = new THREE.Vector3()
  private scale = new THREE.Vector3()
  private rotation = new THREE.Quaternion()
  private boxGeometry: THREE.BoxGeometry
  private cylinderGeometry: THREE.CylinderGeometry
  constructor(boxGeometry: THREE.BoxGeometry, cylinderGeometry: THREE.CylinderGeometry) {
    this.boxGeometry = boxGeometry
    this.cylinderGeometry = cylinderGeometry
  }

  add(geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0,
    sx = 1, sy = 1, sz = 1, angle = 0) {
    this.position.set(x, y, z)
    this.scale.set(sx, sy, sz)
    this.rotation.setFromEuler(new THREE.Euler(0, 0, angle))
    this.transform.compose(this.position, this.rotation, this.scale)
    const copy = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    copy.applyMatrix4(this.transform)
    const batch = this.batches.get(material) ?? []
    batch.push(copy)
    this.batches.set(material, batch)
  }

  box(material: THREE.Material, x: number, y: number, z: number,
    width: number, height: number, depth: number, angle = 0) {
    this.add(this.boxGeometry, material, x, y, z, width, height, depth, angle)
  }

  disc(material: THREE.Material, x: number, y: number, z: number, radius: number, depth: number) {
    this.add(this.cylinderGeometry, material, x, y, z, radius, radius, depth)
  }

  shape(shape: THREE.Shape, material: THREE.Material, depth: number, z: number, bevel = 0.003,
    x = 0, y = 0) {
    const geometry = extrude(shape, depth, bevel)
    this.add(geometry, material, x, y, z)
    geometry.dispose()
  }

  panel(material: THREE.Material, x: number, y: number, z: number,
    width: number, height: number, depth: number, radius = 0.025) {
    this.shape(rounded(width, height, radius), material, depth, z, Math.min(0.003, depth / 4), x, y)
  }

  ring(material: THREE.Material, x: number, y: number, z: number,
    radius: number, inner: number, depth: number) {
    const shape = new THREE.Shape().absarc(0, 0, radius, 0, Math.PI * 2, false)
    shape.holes.push(new THREE.Path().absarc(0, 0, inner, 0, Math.PI * 2, true))
    this.shape(shape, material, depth, z, 0, x, y)
  }

  finish(name: string) {
    this.group.name = name
    for (const [material, geometries] of this.batches) {
      const geometry = mergeGeometries(geometries)
      if (!geometry) throw new Error(`Unable to merge ${name} component geometry`)
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = !material.transparent
      mesh.receiveShadow = true
      this.group.add(mesh)
      geometries.forEach(item => item.dispose())
    }
    this.batches.clear()
    return this.group
  }
}

function screw(a: Assembly, m: Materials, x: number, y: number, z: number, radius = 0.035, rear = false) {
  const direction = rear ? -1 : 1
  a.ring(m.darkMetal, x, y, z - direction * 0.008, radius * 1.32, radius * 0.52, 0.017)
  a.disc(m.silver, x, y, z, radius, 0.018)
  a.disc(m.darkMetal, x, y, z + direction * 0.0095, radius * 0.18, 0.001)
  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI * 2 / 3 + x
    a.box(m.black, x + Math.cos(angle) * radius * 0.24, y + Math.sin(angle) * radius * 0.24,
      z + direction * 0.01, radius * 0.60, radius * 0.14, 0.002, angle)
  }
}

function tab(a: Assembly, m: Materials, x: number, y: number, z: number) {
  a.panel(m.shield, x, y, z - 0.026, 0.115, 0.105, 0.022, 0.04)
  screw(a, m, x, y, z)
}

function pins(a: Assembly, m: Materials, x: number, y: number, z: number,
  count: number, spacing: number, vertical = false) {
  for (let i = 0; i < count; i++) {
    a.box(m.gold, x + (vertical ? 0 : i * spacing), y + (vertical ? i * spacing : 0),
      z, vertical ? 0.039 : 0.010, vertical ? 0.010 : 0.039, 0.009)
  }
}

function connector(a: Assembly, m: Materials, x: number, y: number, width: number, height: number, z = 0.048) {
  a.panel(m.silver, x, y, z, width + 0.026, height + 0.027, 0.027, 0.013)
  a.box(m.black, x, y, z + 0.017, width, height, 0.016)
  a.box(m.graphite, x, y, z + 0.027, width * 0.84, height * 0.51, 0.009)
  if (width > height) {
    const count = Math.max(3, Math.floor((width - 0.035) / 0.021))
    pins(a, m, x - width / 2 + 0.02, y - height / 2 - 0.010, z + 0.01, count, 0.021)
    pins(a, m, x - width / 2 + 0.02, y + height / 2 + 0.010, z + 0.01, count, 0.021)
  } else {
    const count = Math.max(3, Math.floor((height - 0.035) / 0.021))
    pins(a, m, x - width / 2 - 0.010, y - height / 2 + 0.02, z + 0.01, count, 0.021, true)
    pins(a, m, x + width / 2 + 0.010, y - height / 2 + 0.02, z + 0.01, count, 0.021, true)
  }
}

function marking(a: Assembly, text: string[], x: number, y: number, z: number, width: number, height: number,
  code = false, rear = false) {
  const texture = canvasTexture(512, 128, ctx => {
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = '#a2a294'
    ctx.font = '20px monospace'
    text.forEach((line, i) => ctx.fillText(line, code ? 126 : 12, 31 + i * 29))
    if (code) matrixCode(ctx, 14, 15, 90, 813 + text[0]!.length)
  })
  const material = new THREE.MeshStandardMaterial({
    map: texture, transparent: true, depthWrite: false, roughness: 0.77,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  })
  const plane = new THREE.PlaneGeometry(width, height)
  if (rear) plane.rotateY(Math.PI)
  a.add(plane, material, x, y, z)
  plane.dispose()
}

function battery(a: Assembly, m: Materials) {
  // The single-cell pouch has a rounded re-entrant corner, not two stacked cells.
  const outline = new THREE.Shape().moveTo(-0.19, 1.15).lineTo(1.19, 1.15)
    .quadraticCurveTo(1.27, 1.15, 1.27, 1.07).lineTo(1.27, -2.29)
    .quadraticCurveTo(1.27, -2.36, 1.17, -2.43).lineTo(-1.12, -2.43)
    .quadraticCurveTo(-1.20, -2.43, -1.20, -2.35).lineTo(-1.20, -1.34)
    .quadraticCurveTo(-1.20, -1.27, -1.13, -1.27).lineTo(-0.36, -1.27)
    .quadraticCurveTo(-0.25, -1.27, -0.25, -1.16).lineTo(-0.25, 1.09)
    .quadraticCurveTo(-0.25, 1.15, -0.19, 1.15)
  a.shape(outline, m.black, 0.125, -0.004, 0.014)
  const texture = canvasTexture(1024, 1536, ctx => {
    const rand = randomSource(151503)
    ctx.fillStyle = '#272928'
    ctx.fillRect(0, 0, 1024, 1536)
    for (let i = 0; i < 48000; i++) {
      const gray = 36 + Math.floor(rand() * 16)
      ctx.fillStyle = `rgba(${gray},${gray + 1},${gray},0.25)`
      ctx.fillRect(rand() * 1024, rand() * 1536, 1 + rand() * 3, 1)
    }
    const x = (value: number) => (value + 1.20) / 2.47 * 1024
    const y = (value: number) => (1.15 - value) / 3.58 * 1536
    ctx.strokeStyle = '#383a37'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(x(-0.19), y(1.085)); ctx.lineTo(x(1.205), y(1.085))
    ctx.lineTo(x(1.205), y(-2.30)); ctx.lineTo(x(1.13), y(-2.36))
    ctx.lineTo(x(-1.135), y(-2.36))
    ctx.lineTo(x(-1.135), y(-1.335)); ctx.lineTo(x(-0.37), y(-1.335))
    ctx.quadraticCurveTo(x(-0.185), y(-1.335), x(-0.185), y(-1.135))
    ctx.lineTo(x(-0.185), y(1.085))
    ctx.stroke()
    ctx.strokeStyle = '#191c1a'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(x(-0.34), y(-1.35))
    ctx.bezierCurveTo(x(-0.12), y(-1.35), x(-0.12), y(-1.08), x(-0.20), y(-0.94))
    ctx.stroke()
    // Subtle folded-foil wrinkles along the welded margin.
    for (let i = 0; i < 85; i++) {
      const yy = rand() * 1536
      ctx.strokeStyle = `rgba(135,139,131,${0.025 + rand() * 0.075})`
      ctx.lineWidth = 1 + rand() * 2
      ctx.beginPath()
      ctx.moveTo(1004, yy)
      ctx.quadraticCurveTo(984 - rand() * 15, yy + 10, 957 - rand() * 35, yy + 6 + rand() * 14)
      ctx.stroke()
    }
    ctx.fillStyle = '#737771'
    ctx.font = '12px Arial, sans-serif'
    const lines = [
      'Li-ion Battery   3.87 V   12.70 Wh',
      'Rechargeable lithium-ion polymer battery',
      'Do not disassemble, puncture, crush, heat or burn.',
      'Authorized service only. Recycle according to local regulations.',
    ]
    lines.forEach((line, i) => ctx.fillText(line, 165, 1338 + i * 21))
    ctx.font = '17px Arial, sans-serif'
    ctx.fillText('Li-ion', 166, 1298)
    matrixCode(ctx, 103, 1325, 43, 1515)
  })
  const surface = new THREE.MeshStandardMaterial({
    map: texture, roughness: 0.86, metalness: 0.05, bumpMap: texture, bumpScale: 0.0015,
  })
  const face = new THREE.ShapeGeometry(outline, 24)
  const positions = face.getAttribute('position')
  const uv = face.getAttribute('uv')
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, (positions.getX(i) + 1.20) / 2.47, (positions.getY(i) + 2.43) / 3.58)
  }
  a.add(face, surface, 0, 0, 0.060)
  face.dispose()
  a.shape(polygon([[-0.48, -1.26], [-0.49, -1.00], [-0.37, -0.92],
    [-0.34, -1.03], [-0.35, -1.26]]), m.amber, 0.018, -0.015, 0.001)
  a.panel(m.black, -0.42, -1.06, 0.018, 0.115, 0.20, 0.028, 0.014)
  pins(a, m, -0.461, -0.977, 0.035, 5, 0.02)
  for (const x of [-0.87, 0.88]) {
    a.panel(m.graphite, x, -2.436, -0.028, 0.22, 0.086, 0.018, 0.025)
    a.box(m.black, x, -2.45, -0.016, 0.17, 0.025, 0.006)
  }
  marking(a, ['Rechargeable Li-ion Battery', '3.87 V   12.70 Wh', 'Do not puncture or disassemble.'],
    0.46, -0.55, -0.068, 0.90, 0.17, false, true)
  marking(a, ['Li-ion • Recycle', 'Authorized service only'],
    0.46, -0.79, -0.068, 0.72, 0.12, true, true)
}

function logicBoard(a: Assembly, m: Materials) {
  const contour: Point[] = [
    [-1.27, -1.18], [-0.44, -1.18], [-0.31, -1.08], [-0.31, 0.98],
    [-0.27, 1.06], [-0.27, 1.82], [-0.41, 1.98], [-1.24, 1.98],
    [-1.30, 1.84], [-1.30, 1.60], [-1.25, 1.60],
    [-1.25, 0.74], [-1.30, 0.74], [-1.30, -0.78], [-1.27, -0.78],
  ]
  a.shape(polygon(contour), m.darkMetal, 0.026, -0.072, 0.006)
  a.shape(polygon(contour), m.board, 0.044, -0.043, 0.004)
  const shields: [number, number, number, number][] = [
    [-0.94, -0.82, 0.49, 0.58], [-0.46, -0.60, 0.245, 0.35],
    [-1.00, 0.39, 0.46, 0.33], [-0.60, 0.55, 0.30, 0.46],
    [-0.43, 0.30, 0.13, 0.21], [-0.52, 1.04, 0.30, 0.23],
    [-1.03, 1.85, 0.37, 0.15], [-0.73, 1.86, 0.145, 0.16],
  ]
  shields.forEach(([x, y, w, h], index) => {
    a.panel(m.silver, x, y, 0.015, w + 0.035, h + 0.035, 0.064, 0.027)
    a.panel(m.shield, x, y, 0.049, w, h, 0.012, 0.023)
    for (const direction of [-1, 1]) {
      a.box(m.silver, x + direction * (w / 2 + 0.009), y, 0.038, 0.01, h * 0.76, 0.028)
    }
    for (let i = 0; i < 3; i++) {
      a.box(m.darkMetal, x - w / 2 + 0.055 + i * (w - 0.11) / 2, y - h / 2 - 0.012,
        0.021, 0.026, 0.009, 0.018)
    }
    if (index % 2 === 0) {
      a.disc(m.black, x + w / 2 - 0.038, y + h / 2 - 0.04, 0.056, 0.009, 0.002)
    }
  })
  const broadShield = polygon([[-1.25, 1.51], [-0.64, 1.51], [-0.64, 1.16],
    [-0.41, 1.16], [-0.41, 0.89], [-0.71, 0.89], [-0.71, 0.76],
    [-1.08, 0.76], [-1.08, 0.72], [-1.25, 0.72]])
  a.shape(broadShield, m.silver, 0.066, 0.016)
  a.shape(polygon([[-1.226, 1.486], [-0.664, 1.486], [-0.664, 1.136],
    [-0.434, 1.136], [-0.434, 0.914], [-0.734, 0.914], [-0.734, 0.784],
    [-1.104, 0.784], [-1.104, 0.744], [-1.226, 0.744]]), m.shield, 0.008, 0.053)
  a.panel(m.darkMetal, -1.03, 1.64, 0.016, 0.34, 0.115, 0.050, 0.009)
  a.box(m.black, -0.83, -0.81, 0.063, 0.24, 0.66, 0.010)
  a.box(m.graphite, -0.81, -0.80, 0.071, 0.17, 0.61, 0.009)
  connector(a, m, -0.525, -0.11, 0.087, 0.47)
  connector(a, m, -0.39, -0.10, 0.079, 0.48)
  connector(a, m, -0.512, -0.94, 0.23, 0.067)
  connector(a, m, -0.455, 1.43, 0.085, 0.31)
  connector(a, m, -1.12, 1.50, 0.19, 0.055)
  const rand = randomSource(98151)
  const componentStrip = (x: number, y: number, columns: number, rows: number, stepX: number, stepY: number) => {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (rand() < 0.16) continue
        const px = x + col * stepX
        const py = y + row * stepY
        const width = 0.021 + rand() * 0.018
        const height = 0.035 + rand() * 0.026
        a.box(rand() > 0.46 ? m.ceramic : m.black, px, py, 0.000, width, height, 0.027)
        for (const sign of [-1, 1]) {
          a.box(m.solder, px, py + sign * height * 0.39, 0.002, width + 0.005, 0.010, 0.030)
        }
      }
    }
  }
  componentStrip(-1.263, -0.70, 1, 20, 0.055, 0.073)
  componentStrip(-0.66, -0.98, 1, 13, 0.050, 0.081)
  componentStrip(-1.13, -0.44, 6, 1, 0.067, 0.05)
  componentStrip(-1.115, -0.30, 5, 2, 0.073, 0.075)
  componentStrip(-1.10, 0.14, 7, 1, 0.068, 0.05)
  componentStrip(-0.69, 1.63, 5, 1, 0.057, 0.079)
  componentStrip(-1.23, 1.68, 1, 3, 0.06, 0.081)
  componentStrip(-1.14, -1.135, 8, 1, 0.076, 0.06)
  for (let i = 0; i < 14; i++) {
    a.disc(m.gold, -0.89 + (i % 2) * 0.045, -0.32 + Math.floor(i / 2) * 0.060,
      -0.018, 0.009, 0.002)
  }
  for (const [x, y] of [[-1.19, -0.08], [-0.38, -1.07], [-0.37, 0.86],
    [-0.35, 0.23], [-0.49, 1.83]]) tab(a, m, x!, y!, 0.059)
  marking(a, ['820 • 15P', 'ASSEMBLY'], -1.01, 0.41, 0.057, 0.30, 0.085, true)
  marking(a, ['RF', '15P'], -0.46, -0.59, 0.057, 0.19, 0.13, true)
  a.shape(polygon([[-0.64, -0.33], [-0.46, -0.33], [-0.29, -0.39],
    [-0.29, -0.57], [-0.40, -0.57], [-0.43, -0.46], [-0.64, -0.46]]),
  m.black, 0.015, 0.090, 0.002)
  a.box(m.amber, -0.635, -0.395, 0.092, 0.023, 0.11, 0.008)
  // The hidden sandwich-board face is intentionally unlabelled at chip level:
  // package construction is approximated rather than inventing an IC pinout.
  const rearShields: [number, number, number, number][] = [
    [-0.82, 1.52, 0.77, 0.65], [-0.91, 0.84, 0.55, 0.55],
    [-0.75, 0.22, 0.82, 0.50], [-0.84, -0.49, 0.66, 0.55],
    [-0.82, -0.96, 0.65, 0.21],
  ]
  rearShields.forEach(([x, y, width, height], index) => {
    a.panel(m.silver, x, y, -0.089, width, height, 0.030, 0.025)
    a.panel(index % 2 ? m.graphite : m.darkMetal, x, y, -0.107,
      width - 0.032, height - 0.030, 0.007, 0.022)
    for (let i = 0; i < 4; i++) {
      a.box(m.solder, x - width / 2 + 0.055 + i * (width - 0.11) / 3,
        y + height / 2 + 0.005, -0.088, 0.029, 0.013, 0.009)
    }
  })
  for (let i = 0; i < 22; i++) {
    const y = -0.89 + i * 0.12
    a.box(m.black, -1.246, y, -0.090, 0.024, 0.049, 0.017)
    a.box(m.solder, -1.246, y + 0.020, -0.091, 0.028, 0.011, 0.020)
    a.disc(m.gold, -0.349, y, -0.086, 0.009, 0.004)
  }
  for (const [x, y] of [[-1.17, 1.88], [-0.37, 1.76], [-0.40, -1.09]]) {
    screw(a, m, x!, y!, -0.098, 0.025, true)
  }
  marking(a, ['STACKED PCB', '15P'], -0.82, 1.52, -0.112, 0.33, 0.095, true, true)
}

function cameras(a: Assembly, m: Materials) {
  a.shape(polygon([[-0.085, 1.80], [0.27, 1.80], [0.27, 1.30], [1.34, 1.30],
    [1.34, 2.91], [0.74, 2.94], [0.59, 2.80], [0.59, 2.48], [-0.085, 2.48]]),
  m.darkMetal, 0.027, -0.068, 0.006)
  const lensUnits: [number, number, number, number][] = [
    [0.96, 2.55, 0.245, 0.65], [0.96, 1.76, 0.307, 0.83], [0.28, 2.155, 0.232, 0.61],
  ]
  lensUnits.forEach(([x, y, radius, size], index) => {
    a.panel(m.black, x, y, -0.081, size, size, 0.150, 0.065)
    a.ring(m.darkMetal, x, y, -0.158, radius + 0.045, radius - 0.008, 0.042)
    a.disc(m.black, x, y, -0.227, radius, 0.150)
    a.ring(m.darkMetal, x, y, -0.296, radius + 0.007, radius - 0.027, 0.020)
    a.ring(m.black, x, y, -0.322, radius - 0.018, radius * 0.64, 0.024)
    a.disc(m.lens, x, y, -0.329, radius * 0.64, 0.004)
    a.ring(m.coating, x, y, -0.332, radius * 0.60, radius * 0.53, 0.002)
    a.disc(m.black, x, y, -0.3325, radius * 0.33, 0.001)
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2
      a.box(m.graphite, x + Math.cos(angle) * (radius + 0.006),
        y + Math.sin(angle) * (radius + 0.006), -0.245, 0.010, 0.024, 0.079, angle)
    }
    if (index !== 1) {
      const chamfer = index === 0 ? 0.105 : 0.035
      const half = size / 2
      const plate = polygon([
        [x - half + chamfer, y - half], [x + half - chamfer, y - half],
        [x + half, y - half + chamfer], [x + half, y + half - chamfer],
        [x + half - chamfer, y + half], [x - half + chamfer, y + half],
        [x - half, y + half - chamfer], [x - half, y - half + chamfer],
      ])
      a.shape(plate, m.silver, 0.032, 0.021)
      const inset = plate.clone()
      const geo = extrude(inset, 0.010)
      geo.translate(-x, -y, 0)
      a.add(geo, m.graphite, x, y, 0.042, 0.945, 0.945, 1)
      geo.dispose()
    }
  })
  // The large lower module has a stepped shield to clear its neighbouring camera.
  const mainPlate = polygon([[0.38, 1.33], [1.34, 1.33], [1.34, 2.13], [0.63, 2.13],
    [0.63, 1.87], [0.38, 1.87]])
  a.shape(mainPlate, m.silver, 0.044, 0.026)
  a.shape(polygon([[0.406, 1.36], [1.313, 1.36], [1.313, 2.103], [0.655, 2.103],
    [0.655, 1.845], [0.406, 1.845]]), m.graphite, 0.009, 0.052)
  for (let i = 0; i < 14; i++) {
    a.box(m.silver, 0.45 + i * 0.06, 1.353, 0.057, 0.024, 0.072, 0.008)
  }
  for (const [x, y] of [[-0.047, 2.51], [0.57, 2.91], [1.32, 2.19], [0.31, 1.36]]) {
    tab(a, m, x!, y!, 0.030)
  }
  a.shape(polygon([[0.10, 1.88], [0.10, 1.67], [-0.10, 1.62], [-0.36, 1.70],
    [-0.36, 1.92], [-0.12, 1.87], [-0.03, 1.93], [-0.03, 2.08], [0.16, 2.08]]),
  m.amber, 0.016, 0.070, 0.002)
  a.shape(polygon([[0.087, 1.89], [0.087, 1.684], [-0.10, 1.635], [-0.349, 1.714],
    [-0.349, 1.903], [-0.12, 1.854], [-0.016, 1.922], [-0.016, 2.065], [0.147, 2.065]]),
  m.black, 0.010, 0.083, 0.001)
  marking(a, ['CAMERA', '15 PRO'], -0.24, 1.792, 0.090, 0.13, 0.14, true)
  marking(a, ['MODULE • 48 MP'], 0.83, 1.48, 0.058, 0.39, 0.065, true)
  for (const [x, y] of [[0.635, 1.42], [1.255, 2.845], [0.035, 1.91]]) {
    a.panel(m.graphite, x!, y!, -0.159, 0.09, 0.062, 0.008, 0.007)
    for (let i = 0; i < 3; i++) {
      a.box(m.gold, x! - 0.025 + i * 0.025, y!, -0.164, 0.009, 0.030, 0.003)
    }
  }
  marking(a, ['15P'], 0.98, 1.385, -0.159, 0.14, 0.042, true, true)
}

function trueDepth(a: Assembly, m: Materials) {
  // Apple's top-down service image shows a large irregular earpiece to the
  // left of two compact optical packages, not a row of equally spaced lenses.
  const earpiece = polygon([[-1.16, 2.03], [-0.28, 2.03], [-0.28, 2.32],
    [-0.45, 2.48], [-0.45, 2.94], [-1.25, 2.94], [-1.31, 2.86],
    [-1.31, 2.58], [-1.22, 2.58], [-1.22, 2.24], [-1.16, 2.24]])
  a.shape(earpiece, m.black, 0.138, -0.015, 0.009)
  a.shape(polygon([[-1.13, 2.08], [-0.325, 2.08], [-0.325, 2.30],
    [-0.495, 2.465], [-0.495, 2.898], [-1.22, 2.898],
    [-1.26, 2.84], [-1.26, 2.63], [-1.175, 2.63],
    [-1.175, 2.28], [-1.13, 2.28]]), m.graphite, 0.012, 0.062, 0.004)
  a.shape(polygon([[-0.96, 2.90], [-0.47, 2.90], [-0.47, 2.48], [-0.31, 2.31],
    [-0.31, 2.095], [-0.87, 2.095], [-0.87, 2.66], [-1.14, 2.66],
    [-1.14, 2.37], [-1.235, 2.37], [-1.235, 2.69], [-1.045, 2.69],
    [-0.96, 2.77]]), m.silver, 0.023, 0.076, 0.004)
  a.shape(polygon([[-0.931, 2.872], [-0.496, 2.872], [-0.496, 2.468], [-0.337, 2.298],
    [-0.337, 2.121], [-0.844, 2.121], [-0.844, 2.70], [-0.931, 2.78]]),
  m.shield, 0.005, 0.090, 0.001)
  a.box(m.black, -1.20, 2.76, 0.086, 0.13, 0.20, 0.009)
  a.panel(m.darkMetal, -0.075, 3.012, -0.012, 1.01, 0.065, 0.080, 0.019)
  a.box(m.black, -0.075, 3.028, 0.031, 0.82, 0.028, 0.006)
  for (let i = 0; i < 32; i++) {
    a.box(m.graphite, -0.47 + i * 0.025, 3.029, 0.036, 0.010, 0.022, 0.002)
  }
  a.panel(m.silver, -0.16, 2.825, 0.014, 0.48, 0.275, 0.090, 0.023)
  a.panel(m.black, -0.16, 2.825, 0.066, 0.43, 0.225, 0.020, 0.022)
  a.panel(m.silver, 0.285, 2.827, 0.014, 0.355, 0.30, 0.090, 0.020)
  a.panel(m.graphite, 0.285, 2.827, 0.065, 0.299, 0.252, 0.020, 0.017)
  for (const [x, radius] of [[-0.065, 0.086], [0.285, 0.098]]) {
    a.ring(m.darkMetal, x!, 2.834, 0.082, radius! + 0.013, radius!, 0.014)
    a.disc(m.lens, x!, 2.834, 0.091, radius!, 0.006)
    a.disc(m.coating, x! - radius! * 0.2, 2.854, 0.095, radius! * 0.18, 0.001)
  }
  a.panel(m.ceramic, -0.295, 2.834, 0.080, 0.114, 0.098, 0.012, 0.013)
  a.panel(m.lens, -0.185, 2.834, 0.080, 0.061, 0.089, 0.012, 0.011)
  a.panel(m.silver, 0.082, 2.655, 0.016, 0.53, 0.09, 0.029, 0.015)
  a.box(m.black, 0.082, 2.669, 0.032, 0.37, 0.025, 0.008)
  a.shape(polygon([[-0.98, 2.12], [-0.82, 2.12], [-0.82, 1.955],
    [-0.98, 1.955]]), m.amber, 0.012, -0.018, 0.001)
  connector(a, m, -0.90, 2.01, 0.12, 0.050, -0.005)
  tab(a, m, -0.97, 2.92, 0.081)
  tab(a, m, -1.23, 2.25, 0.057)
  tab(a, m, -0.32, 2.58, 0.050)
  tab(a, m, 0.47, 2.97, 0.045)
}

function taptic(a: Assembly, m: Materials) {
  a.panel(m.darkMetal, -0.78, -2.73, -0.010, 1.06, 0.42, 0.145, 0.049)
  a.panel(m.silver, -0.78, -2.73, 0.013, 1.015, 0.375, 0.125, 0.034)
  a.panel(m.graphite, -0.78, -2.73, 0.080, 0.907, 0.324, 0.012, 0.023)
  a.box(m.darkMetal, -0.78, -2.91, 0.014, 0.73, 0.016, 0.080)
  a.box(m.silver, -0.78, -2.92, 0.020, 0.59, 0.012, 0.030)
  for (const x of [-1.306, -0.244]) {
    a.panel(m.silver, x, -2.69, 0.018, 0.125, 0.22, 0.045, 0.022)
    screw(a, m, x, -2.64, 0.067, 0.033)
    a.box(m.black, x, -2.76, 0.044, 0.061, 0.043, 0.006)
  }
  a.shape(polygon([[-0.50, -2.55], [-0.40, -2.55], [-0.40, -2.48],
    [-0.14, -2.48], [-0.14, -2.63], [-0.23, -2.63], [-0.23, -2.56], [-0.50, -2.56]]),
  m.amber, 0.015, -0.032, 0.001)
  marking(a, ['TAPTIC ENGINE'], -0.80, -2.72, 0.087, 0.68, 0.11)
  marking(a, ['15P'], -1.13, -2.80, 0.087, 0.12, 0.046, true)
}

function speaker(a: Assembly, m: Materials) {
  const outline = polygon([[0.36, -2.50], [1.22, -2.50], [1.34, -2.61], [1.34, -2.90],
    [1.25, -3.035], [0.53, -3.035], [0.53, -2.95], [0.31, -2.95], [0.31, -2.73], [0.36, -2.73]])
  a.shape(outline, m.black, 0.145, -0.013, 0.018)
  a.shape(polygon([[0.40, -2.55], [1.17, -2.55], [1.285, -2.65], [1.285, -2.89],
    [1.22, -2.965], [0.57, -2.965], [0.57, -2.90], [0.365, -2.90],
    [0.365, -2.77], [0.40, -2.77]]), m.graphite, 0.014, 0.067, 0.008)
  a.panel(m.darkMetal, 0.88, -2.73, 0.078, 0.61, 0.22, 0.010, 0.045)
  a.panel(m.black, 0.88, -2.73, 0.085, 0.55, 0.167, 0.006, 0.045)
  for (let i = 0; i < 8; i++) {
    a.box(m.graphite, 0.68 + i * 0.055, -2.73, 0.089, 0.016, 0.13, 0.004)
  }
  a.box(m.black, 0.91, -3.012, -0.018, 0.51, 0.091, 0.092)
  for (let i = 0; i < 14; i++) {
    a.box(m.darkMetal, 0.69 + i * 0.034, -3.059, -0.020, 0.012, 0.004, 0.062)
  }
  tab(a, m, 0.40, -2.61, 0.065)
  tab(a, m, 1.275, -2.92, 0.065)
  pins(a, m, 0.41, -2.918, 0.047, 4, 0.028)
  marking(a, ['ACOUSTIC', '15P'], 0.91, -2.89, 0.079, 0.27, 0.071, true)
}

function usbC(a: Assembly, m: Materials) {
  const flex = polygon([[-1.23, -2.975], [-1.23, -3.08], [-0.32, -3.08], [-0.23, -3.12],
    [0.28, -3.12], [0.36, -3.075], [1.24, -3.075], [1.24, -2.975],
    [0.27, -2.975], [0.20, -2.72], [-0.03, -2.67], [-0.03, -2.45],
    [-0.18, -2.45], [-0.18, -2.76], [-0.30, -2.975]])
  a.shape(flex, m.amber, 0.016, -0.070, 0.002)
  a.shape(polygon([[-1.21, -3.002], [-1.21, -3.06], [-0.29, -3.06], [-0.20, -3.097],
    [0.26, -3.097], [0.34, -3.056], [1.20, -3.056], [1.20, -2.99],
    [0.25, -2.99], [0.17, -2.74], [-0.06, -2.70], [-0.06, -2.47],
    [-0.15, -2.47], [-0.15, -2.785], [-0.29, -3.002]]), m.black, 0.012, -0.057, 0.001)
  // Rounded open metal shell; unlike a solid block, the tongue is visible from below.
  const shell = rounded(0.43, 0.148, 0.055)
  const hole = rounded(0.376, 0.104, 0.040)
  shell.holes.push(new THREE.Path(hole.getPoints(16).reverse()))
  const shellGeometry = extrude(shell, 0.24, 0.002)
  shellGeometry.rotateX(Math.PI / 2)
  a.add(shellGeometry, m.silver, 0, -3.018, -0.010)
  shellGeometry.dispose()
  a.panel(m.black, 0, -2.912, -0.011, 0.36, 0.027, 0.10, 0.015)
  a.box(m.graphite, 0, -3.037, -0.014, 0.29, 0.16, 0.026)
  for (let i = 0; i < 12; i++) {
    for (const sign of [-1, 1]) {
      a.box(m.gold, -0.122 + i * 0.022, -3.05, -0.014 + sign * 0.014,
        0.010, 0.088, 0.003)
    }
  }
  for (const x of [-0.31, 0.31]) {
    a.panel(m.silver, x, -2.985, 0.006, 0.145, 0.225, 0.028, 0.030)
    screw(a, m, x, -2.937, 0.028, 0.028)
    a.box(m.copper, x, -3.06, 0.022, 0.073, 0.040, 0.007)
  }
  for (const x of [-1.16, 1.16]) {
    a.panel(m.silver, x, -3.026, -0.020, 0.13, 0.105, 0.057, 0.016)
    a.disc(m.black, x, -3.026, 0.010, 0.025, 0.007)
    a.disc(m.darkMetal, x, -3.026, 0.014, 0.011, 0.002)
  }
  for (let i = 0; i < 7; i++) {
    a.box(i % 3 ? m.black : m.ceramic, -0.94 + i * 0.078, -3.025, -0.027, 0.040, 0.057, 0.038)
    a.box(m.solder, -0.94 + i * 0.078, -3.056, -0.028, 0.044, 0.012, 0.038)
  }
  connector(a, m, -0.105, -2.51, 0.073, 0.11, -0.025)
}

/**
 * Photo-informed iPhone 15 Pro assemblies, front view: cameras on the right,
 * stacked logic board on the left. Component dimensions and concealed surfaces
 * are visual approximations, not CAD measurements or a service schematic.
 */
export function createInternals(): InternalPart[] {
  const m = materials()
  const box = new THREE.BoxGeometry(1, 1, 1)
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 40)
  cylinder.rotateX(Math.PI / 2)
  const definitions: {
    id: string; name: string; detail: string; offset: [number, number, number];
    build: (assembly: Assembly, material: Materials) => void
  }[] = [
    {
      id: 'battery', name: 'L-shaped battery',
      detail: 'Single L-shaped lithium-ion pouch, with folded seal, pull tabs and a flex connection.',
      offset: [0.4, -0.15, 1.4], build: battery,
    },
    {
      id: 'logic-board', name: 'Stacked logic board',
      detail: 'Compact stepped board with EMI shields, fine-pitch connectors and surface-mount components.',
      offset: [-1.05, 0.15, 1.25], build: logicBoard,
    },
    {
      id: 'cameras', name: 'Triple rear cameras',
      detail: '48 MP Main, Ultra Wide and 3× Telephoto modules. Shield backs face the display; lenses face rearward.',
      offset: [0.4, 0.9, 0.75], build: cameras,
    },
    {
      id: 'true-depth', name: 'TrueDepth & earpiece',
      detail: 'Paired front optical packages beside the irregular shielded earpiece; simplified infrared internals.',
      offset: [0, 1.1, 0.8], build: trueDepth,
    },
    {
      id: 'taptic', name: 'Taptic Engine',
      detail: 'Sealed linear haptic actuator, with stamped steel casing, mounting ears and a flex connection.',
      offset: [-0.65, -0.9, 0.9], build: taptic,
    },
    {
      id: 'speaker', name: 'Lower loudspeaker',
      detail: 'Moulded acoustic enclosure, bottom-facing outlet, spring contacts and mounting screws.',
      offset: [0.65, -0.9, 0.65], build: speaker,
    },
    {
      id: 'usb-c', name: 'USB-C and lower flex',
      detail: 'Open USB-C receptacle with contact tongue, lower interconnect flex and microphone packages.',
      offset: [0, -1.45, 0.4], build: usbC,
    },
  ]
  const parts = definitions.map(({ id, name, detail, offset, build }) => {
    const assembly = new Assembly(box, cylinder)
    build(assembly, m)
    return { id, name, detail, group: assembly.finish(name), offset: new THREE.Vector3(...offset) }
  })
  box.dispose()
  cylinder.dispose()
  return parts
}
