import * as THREE from 'three'
import { batchGroup, roundedShape, type DuoMaterials } from './geometry'
import { DUO, chassisOffset, foldRadians, type DuoFinish, type DuoPart, type DuoSide } from './types'

type Bore = { x: number; y: number; radius: number }
type Window = { x: number; y: number; width: number; height: number }

function plate(
  parent: THREE.Group, material: THREE.Material, width: number, height: number, depth: number,
  x: number, y: number, z: number, holes: Bore[] = [], windows: Window[] = [], radius = 0.025,
) {
  const shape = roundedShape(width, height, radius)
  for (const hole of holes) {
    shape.holes.push(new THREE.Path().absarc(hole.x, hole.y, hole.radius, 0, Math.PI * 2, true))
  }
  for (const window of windows) {
    const path = new THREE.Path()
    const l = window.x - window.width / 2
    const r = window.x + window.width / 2
    const b = window.y - window.height / 2
    const t = window.y + window.height / 2
    path.moveTo(l, b).lineTo(l, t).lineTo(r, t).lineTo(r, b).closePath()
    shape.holes.push(path)
  }
  const bevel = Math.min(0.003, depth / 4)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: 1, curveSegments: 6, steps: 1,
  })
  geometry.translate(0, 0, -depth / 2 + bevel)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

function bar(
  parent: THREE.Group, material: THREE.Material, width: number, height: number, depth: number,
  x: number, y: number, z: number,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

function shaft(
  parent: THREE.Group, material: THREE.Material, radius: number, length: number,
  x: number, y: number, z: number, segments = 24,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

function washer(
  parent: THREE.Group, material: THREE.Material, outer: number, inner: number,
  depth: number, x: number, y: number, z: number, axis: 'y' | 'z' = 'z',
) {
  const shape = new THREE.Shape().absarc(0, 0, outer, 0, Math.PI * 2, false)
  shape.holes.push(new THREE.Path().absarc(0, 0, inner, 0, Math.PI * 2, true))
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: false, curveSegments: 8, steps: 1,
  })
  geometry.translate(0, 0, -depth / 2)
  const mesh = new THREE.Mesh(geometry, material)
  if (axis === 'y') mesh.rotation.x = Math.PI / 2
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

function fastener(parent: THREE.Group, m: DuoMaterials, x: number, y: number, z: number, radius = 0.04) {
  washer(parent, m.black, radius * 1.25, radius * 0.65, 0.011, x, y, z - 0.004)
  const shape = new THREE.Shape().absarc(0, 0, radius, 0, Math.PI * 2, false)
  const recess = new THREE.Path()
  for (let i = 0; i < 6; i++) {
    const angle = -i * Math.PI / 3
    const px = Math.cos(angle) * radius * 0.44
    const py = Math.sin(angle) * radius * 0.44
    if (i === 0) recess.moveTo(px, py)
    else recess.lineTo(px, py)
  }
  shape.holes.push(recess.closePath())
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.013, bevelEnabled: false, curveSegments: 6,
  })
  const head = new THREE.Mesh(geometry, m.steel)
  head.position.set(x, y, z)
  parent.add(head)
  bar(parent, m.black, radius * 0.7, radius * 0.7, 0.004, x, y, z - 0.004)
}

/** Small helical ridges, not oversized spur gears: the tooth form is illustrative. */
function helicalSleeve(parent: THREE.Group, m: DuoMaterials, center: number, handedness: number) {
  const turns = 11
  const length = 0.73
  const steps = turns * 24
  const section = [[-0.025, 0.059], [-0.013, 0.087], [0.013, 0.087], [0.025, 0.059]]
  const positions: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= steps; i++) {
    const angle = handedness * i / steps * turns * Math.PI * 2
    for (const [axial, radial] of section) {
      positions.push(Math.cos(angle) * radial, center - length / 2 + i / steps * length + axial, Math.sin(angle) * radial)
    }
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < 3; j++) {
    const a = i * 4 + j
    indices.push(a, a + 4, a + 1, a + 1, a + 4, a + 5)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const ridges = new THREE.Mesh(geometry, m.steel)
  // Mirrored windings need their surface winding reversed, not a double-sided material.
  if (handedness > 0) {
    const index = geometry.getIndex()!
    for (let i = 0; i < index.count; i += 3) {
      const first = index.getX(i)
      index.setX(i, index.getX(i + 2))
      index.setX(i + 2, first)
    }
    geometry.computeVertexNormals()
  }
  parent.add(ridges)
  shaft(parent, m.graphite, 0.061, length + 0.065, 0, center, 0)
  for (const end of [-1, 1]) {
    washer(parent, m.steel, 0.093, 0.049, 0.029, 0, center + end * (length / 2 + 0.048), 0, 'y')
    washer(parent, m.black, 0.077, 0.048, 0.014, 0, center + end * (length / 2 + 0.072), 0, 'y')
  }
}

function toothedCollar(parent: THREE.Group, m: DuoMaterials, y: number) {
  const shape = new THREE.Shape()
  const teeth = 24
  for (let i = 0; i < teeth * 4; i++) {
    const angle = i * Math.PI * 2 / (teeth * 4)
    const radius = i % 4 === 1 || i % 4 === 2 ? 0.102 : 0.086
    if (i === 0) shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  shape.closePath()
  shape.holes.push(new THREE.Path().absarc(0, 0, 0.048, 0, Math.PI * 2, true))
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.038, bevelEnabled: false, curveSegments: 8 })
  geometry.translate(0, 0, -0.019)
  const mesh = new THREE.Mesh(geometry, m.steel)
  mesh.rotation.x = Math.PI / 2
  mesh.position.y = y
  parent.add(mesh)
}

function spineShell(parent: THREE.Group, metal: THREE.Material, seal: THREE.Material) {
  const segments = 40
  const geometry = new THREE.BufferGeometry()
  const positions = new THREE.Float32BufferAttribute((segments + 1) * 4 * 3, 3)
  const indices: number[] = []
  for (let i = 0; i < segments; i++) {
    const a = i * 4
    for (const [p, q] of [[0, 1], [1, 3], [3, 2], [2, 0]]) {
      indices.push(a + p, a + q, a + p + 4, a + q, a + q + 4, a + p + 4)
    }
  }
  geometry.setAttribute('position', positions)
  geometry.setIndex(indices)
  parent.add(new THREE.Mesh(geometry, metal))
  const caps = [-1, 1].map(sign => {
    const cap = new THREE.Mesh(new THREE.BufferGeometry(), seal)
    cap.position.y = sign * 5.825
    parent.add(cap)
    return cap
  })

  return (angle: number) => {
    const half = angle / 2
    const outward = new THREE.Vector3(-Math.sin(half), 0, -Math.cos(half))
    const fold = (x: number, z: number) => new THREE.Vector3(
      Math.cos(angle) * x + Math.sin(angle) * (z - DUO.pivotZ), 0,
      DUO.pivotZ - Math.sin(angle) * x + Math.cos(angle) * (z - DUO.pivotZ),
    )
    // Both lips stay seated on the rear edges; the crown wraps the outside of the fold.
    const left = fold(-0.145, -0.245)
    const right = new THREE.Vector3(0.145, 0, -0.245)
    const contour: THREE.Vector2[] = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const crown = THREE.MathUtils.smoothstep(t, 0, 0.16) * THREE.MathUtils.smoothstep(1 - t, 0, 0.16)
      const point = left.clone().lerp(right, t)
        .addScaledVector(outward, 0.31 * Math.sin(half) * crown)
      const inner = point.clone().addScaledVector(outward, -0.024)
      positions.setXYZ(i * 4, point.x, -5.825, point.z)
      positions.setXYZ(i * 4 + 1, point.x, 5.825, point.z)
      positions.setXYZ(i * 4 + 2, inner.x, -5.825, inner.z)
      positions.setXYZ(i * 4 + 3, inner.x, 5.825, inner.z)
      contour.push(new THREE.Vector2(point.x - outward.x * 0.004, point.z - outward.z * 0.004))
    }
    const frontLeft = fold(-0.145, 0.225)
    const frontRight = new THREE.Vector3(0.145, 0, 0.225)
    const handle = THREE.MathUtils.lerp(0.29 / 3, (DUO.pivotZ - 0.225) * 4 / 3, angle / Math.PI)
    const innerCurve = new THREE.CubicBezierCurve3(frontLeft,
      frontLeft.clone().add(new THREE.Vector3(Math.cos(angle) * handle, 0, -Math.sin(angle) * handle)),
      frontRight.clone().add(new THREE.Vector3(-handle, 0, 0)), frontRight)
    for (let i = segments; i >= 0; i--) {
      const point = innerCurve.getPoint(i / segments)
      contour.push(new THREE.Vector2(point.x, point.z))
    }
    const shape = new THREE.Shape(contour)
    const capGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, steps: 1 })
    capGeometry.translate(0, 0, -0.0175)
    capGeometry.rotateX(Math.PI / 2)
    for (const cap of caps) {
      cap.geometry.dispose()
      cap.geometry = capGeometry.clone()
    }
    capGeometry.dispose()
    positions.needsUpdate = true
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
  }
}

/**
 * Photo-referenced arrangement, not an engineering reconstruction. Housing motion
 * uses a retracting bisector so the fixed-right display pivot can close cleanly.
 */
export function createHinge(materials: DuoMaterials): {
  parts: DuoPart[]
  setFold: (degrees: number) => void
  setExplosion: (amount: number) => void
  setFinish: (finish: DuoFinish) => void
  setColor: (color: string) => void
} {
  const m = materials
  const parts: DuoPart[] = []
  const rotatingShafts: { group: THREE.Group; direction: number; phase: number }[] = []
  const cartridges: { group: THREE.Group; y: number }[] = []
  const links: { mesh: THREE.Mesh; pins: THREE.Mesh[]; side: number; y: number }[] = []
  let currentAngle = 0
  let explosion = 0
  const register = (
    id: string, name: string, side: DuoSide, detail: string, offset: THREE.Vector3,
  ) => {
    const group = new THREE.Group()
    group.name = name
    parts.push({ id, name, side, detail, evidence: 'approximation', group, offset })
    return group
  }

  const coverRoot = register(
    'hinge-cover', 'Micro-blasted titanium hinge cover', 'center',
    'The supplied close-up shows a crowned titanium spine seated between both rear frame edges, with dark end seals below the flexible display. This shell stays joined to those edges throughout folding; its thickness and swept profile are visual approximations.',
    new THREE.Vector3(0, 0, -2.3),
  )
  const cover = new THREE.Group()
  cover.name = 'Frame-seated titanium spine'
  coverRoot.add(cover)
  const blastedTitanium = m.titanium.clone()
  blastedTitanium.roughness = 0.56
  blastedTitanium.metalness = 0.86
  const updateSpine = spineShell(cover, blastedTitanium, m.black)

  const mechanismOffset = new THREE.Vector3(0, 0, 1.1)
  const mechanismRoot = register(
    'hinge-mechanism', 'Twin variable-torque hinge cartridges', 'center',
    'Reference video shows two main gear/cam cartridges, parallel shafts, repeated bearing blocks and central rectangular openings. Apple documents more than 100 precision parts and variable torque; individual teeth, cams, bores and the animated linkage are an original visual approximation, not certified mechanical geometry.',
    mechanismOffset,
  )
  const mechanism = new THREE.Group()
  mechanism.name = 'Bisector-mounted precision mechanism'
  mechanismRoot.add(mechanism)
  const backbone = new THREE.Group()
  mechanism.add(backbone)

  plate(backbone, m.steel, 0.56, 2.74, 0.045, 0, 0, -0.071, [], [
    { x: -0.139, y: 0, width: 0.174, height: 2.27 },
    { x: 0.139, y: 0, width: 0.174, height: 2.27 },
  ], 0.045)
  for (const x of [-0.257, 0.257]) {
    bar(backbone, m.graphite, 0.028, 10.98, 0.064, x, 0, -0.093)
    for (let i = 0; i < 24; i++) {
      bar(backbone, m.steel, 0.018, 0.036, 0.005, x, -5.22 + i * 0.454, -0.057)
    }
  }
  for (const sign of [-1, 1]) {
    plate(backbone, m.steel, 0.53, 0.64, 0.069, 0, sign * 5.36, -0.031, [
      { x: -0.171, y: 0.195, radius: 0.039 },
      { x: 0.171, y: 0.195, radius: 0.039 },
      { x: 0, y: -0.19, radius: 0.071 },
    ], [{ x: 0, y: 0.087, width: 0.093, height: 0.185 }])
    for (const x of [-0.168, 0.168]) {
      fastener(backbone, m, x, sign * 5.57, 0.012, 0.031)
      plate(backbone, m.graphite, 0.096, 0.085, 0.072, x, sign * 5.76, -0.011)
    }
    washer(backbone, m.steel, 0.088, 0.053, 0.031, 0, sign * 1.31, -0.012)
    for (const y of [1.52, 5.03]) {
      plate(backbone, m.steel, 0.5, 0.16, 0.055, 0, sign * y, -0.048,
        [{ x: 0, y: 0, radius: 0.055 }])
    }
  }
  batchGroup(backbone)

  for (const sign of [-1, 1]) {
    const cartridge = new THREE.Group()
    cartridge.name = `${sign > 0 ? 'Upper' : 'Lower'} paired-shaft torque cartridge`
    cartridge.position.y = sign * 3.29
    mechanism.add(cartridge)
    cartridges.push({ group: cartridge, y: sign * 3.29 })
    const cage = new THREE.Group()
    cartridge.add(cage)

    for (const x of [-0.239, 0.239]) {
      plate(cage, m.shield, 0.066, 3.21, 0.052, x, 0, -0.03)
      for (const y of [-1.39, -0.23, 0.23, 1.39]) {
        plate(cage, m.steel, 0.093, 0.12, 0.024, x, y, 0.064,
          [{ x: 0, y: 0, radius: 0.024 }], [], 0.006)
      }
    }
    for (const y of [-1.51, -1.25, -0.23, 0.23, 1.25, 1.51]) {
      plate(cage, m.steel, 0.51, 0.1, 0.038, 0, y, -0.061,
        [{ x: 0, y: 0, radius: 0.03 }])
      for (const x of [-0.121, 0.121]) {
        washer(cage, m.steel, 0.103, 0.054, 0.082, x, y, 0.024, 'y')
        washer(cage, m.black, 0.095, 0.057, 0.01, x, y + 0.046, 0.024, 'y')
        for (const direction of [-1, 1]) {
          bar(cage, m.steel, 0.034, 0.086, 0.083, x + direction * 0.087, y, -0.015)
        }
      }
    }
    plate(cage, m.steel, 0.35, 0.17, 0.043, 0, 0, 0.119,
      [{ x: 0, y: 0, radius: 0.053 }], [], 0.047)
    for (const x of [-0.12, 0.12]) fastener(cage, m, x, 0, 0.144, 0.025)
    for (const y of [-1.67, 1.67]) {
      plate(cage, m.shield, 0.26, 0.2, 0.052, 0, y, -0.021,
        [{ x: 0, y: 0, radius: 0.042 }])
      washer(cage, m.steel, 0.063, 0.036, 0.016, 0, y, 0.019)
    }
    batchGroup(cage)

    for (const direction of [-1, 1]) {
      const axle = new THREE.Group()
      axle.name = `${direction < 0 ? 'Left' : 'Right'} helical shaft`
      axle.position.set(direction * 0.121, 0, 0.024)
      cartridge.add(axle)
      shaft(axle, m.steel, 0.049, 3.34, 0, 0, 0)
      helicalSleeve(axle, m, -0.73, direction)
      helicalSleeve(axle, m, 0.73, direction)
      for (const y of [-1.48, -0.13, 0.13, 1.48]) {
        toothedCollar(axle, m, y)
        for (let i = 0; i < 3; i++) {
          washer(axle, i % 2 ? m.graphite : m.steel, 0.085, 0.05, 0.017, 0, y + 0.038 + i * 0.025, 0, 'y')
        }
      }
      // Eccentric cam discs suggest the documented angle-dependent torque profile.
      for (const y of [-1.18, 1.15]) {
        const cam = washer(axle, m.shield, 0.089, 0.051, 0.027, 0.012, y, 0, 'y')
        cam.scale.x = 0.87
        washer(axle, m.steel, 0.073, 0.051, 0.018, 0, y + 0.036, 0, 'y')
      }
      batchGroup(axle)
      rotatingShafts.push({ group: axle, direction, phase: sign * 0.27 })
    }
  }

  for (const side of ['left', 'right'] as const) {
    const sign = side === 'left' ? -1 : 1
    const carrier = register(
      `hinge-carriers-${side}`, `${side === 'left' ? 'Left' : 'Right'} linked hinge carrier`,
      side,
      'Machined carrier strips, relieved mounting lands, dark side rails and small fasteners follow the supplied internal video frames. Their exact dimensions and linkage are approximated; the carrier follows its own phone half.',
      chassisOffset(side),
    )
    const mounting = new THREE.Group()
    carrier.add(mounting)
    plate(mounting, m.graphite, 0.095, 11.41, 0.125, sign * 0.799, 0, -0.028, [], [], 0.035)
    bar(mounting, m.steel, 0.018, 11.25, 0.014, sign * 0.75, 0, 0.029)
    plate(mounting, m.aluminum, 0.46, 11.15, 0.038, sign * 0.513, 0, -0.098, [], [
      { x: 0, y: 0, width: 0.275, height: 2.41 },
      { x: 0, y: 3.32, width: 0.243, height: 1.82 },
      { x: 0, y: -3.32, width: 0.243, height: 1.82 },
    ])
    for (const end of [-1, 1]) {
      plate(mounting, m.steel, 0.45, 0.36, 0.11, sign * 0.516, end * 5.48, -0.022,
        [{ x: sign * 0.08, y: 0, radius: 0.052 }], [], 0.028)
      fastener(mounting, m, sign * 0.597, end * 5.48, 0.038, 0.037)
    }
    for (const end of [-1, 1]) for (const y of [1.68, 2.22, 3.26, 4.30, 4.86]) {
      const globalY = end * y
      const width = y === 3.26 ? 0.39 : 0.49
      const height = y === 3.26 ? 0.38 : 0.46
      plate(mounting, m.steel, width, height, 0.065, sign * 0.501, globalY, 0.028,
        [
          { x: sign * 0.098, y: -0.119, radius: 0.045 },
          { x: -sign * 0.022, y: -0.119, radius: 0.033 },
        ],
        [{ x: -sign * 0.06, y: 0.085, width: 0.182, height: 0.09 }], 0.013)
      fastener(mounting, m, sign * 0.599, globalY - 0.119, 0.07, 0.033)
      // Short interleaving links leave the axial mechanism visible between halves.
      plate(mounting, m.shield, 0.235, 0.125, 0.037, sign * 0.298, globalY + 0.094, -0.037,
        [{ x: -sign * 0.061, y: 0, radius: 0.032 }], [], 0.026)
      washer(mounting, m.steel, 0.051, 0.027, 0.021, sign * 0.237, globalY + 0.094, -0.008)
      for (let line = 0; line < 5; line++) {
        bar(mounting, m.aluminum, 0.20, 0.003, 0.002, sign * 0.55, globalY - 0.012 + line * 0.012, 0.062)
      }
    }
    for (const end of [-1, 1]) {
      plate(mounting, m.steel, 0.47, 0.115, 0.06, sign * 0.50, end * 1.30, -0.044,
        [{ x: sign * 0.105, y: 0, radius: 0.035 }])
      fastener(mounting, m, sign * 0.605, end * 1.30, -0.005, 0.027)
    }
    for (let i = 0; i < 29; i++) {
      bar(mounting, m.black, 0.02, 0.022, 0.009, sign * 0.788, -5.16 + i * 0.369, 0.038)
    }
    batchGroup(mounting)
    for (const y of [-4.30, -2.22, 2.22, 4.30]) {
      const mesh = bar(mechanismRoot, m.shield, 1, 0.105, 0.032, 0, y, 0)
      const pins = [-1, 1].map(() => shaft(mechanismRoot, m.steel, 0.043, 0.135, 0, y, 0))
      links.push({ mesh, pins, side: sign, y })
    }
  }

  function updateLinks() {
    mechanism.updateMatrix()
    for (const link of links) {
      const start = new THREE.Vector3(link.side * 0.48, link.y, -0.037)
      if (link.side < 0) {
        start.z -= DUO.pivotZ
        start.applyAxisAngle(new THREE.Vector3(0, 1, 0), currentAngle)
        start.z += DUO.pivotZ
      }
      start.addScaledVector(chassisOffset(link.side < 0 ? 'left' : 'right'), explosion)
        .addScaledVector(mechanismOffset, -explosion)
      const end = new THREE.Vector3(link.side * 0.237, link.y, -0.037 + 0.19 * explosion)
        .applyMatrix4(mechanism.matrix)
      link.mesh.position.copy(start).lerp(end, 0.5)
      link.mesh.scale.x = start.distanceTo(end)
      link.mesh.rotation.y = -Math.atan2(end.z - start.z, end.x - start.x)
      link.pins[0].position.copy(start)
      link.pins[1].position.copy(end)
    }
  }

  function setFold(degrees: number) {
    const angle = foldRadians(Number.isFinite(degrees) ? degrees : 180)
    currentAngle = angle
    const bisector = angle / 2
    const closing = Math.sin(bisector)
    // Root positions belong to the parent's exploded-view system.
    updateSpine(angle)
    mechanism.rotation.y = bisector
    // Follow the continuous display's symmetric cubic bend from underneath.
    // Retracting the cartridge depth avoids piercing the small closed bend.
    const backingZ = 0.249
    const gap = DUO.gap / 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const handle = THREE.MathUtils.lerp(DUO.gap / 3, (DUO.pivotZ - backingZ) * 4 / 3, angle / Math.PI)
    const creaseX = (-gap * cos + (backingZ - DUO.pivotZ) * sin + gap) / 2 + 0.375 * handle * (cos - 1)
    const creaseZ = (DUO.pivotZ + gap * sin + (backingZ - DUO.pivotZ) * cos + backingZ) / 2 - 0.375 * handle * sin
    const clearance = THREE.MathUtils.lerp(0.261, 0.121, closing)
    mechanism.scale.z = THREE.MathUtils.lerp(1, 0.74, closing)
    mechanism.position.set(creaseX - closing * clearance, 0, creaseZ - Math.cos(bisector) * clearance)
    for (const axle of rotatingShafts) axle.group.rotation.y = axle.phase + axle.direction * angle * 0.76
    updateLinks()
  }

  function setExplosion(amount: number) {
    const t = THREE.MathUtils.clamp(Number.isFinite(amount) ? amount : 0, 0, 1)
    explosion = t
    for (const cartridge of cartridges) {
      cartridge.group.position.set(0, cartridge.y, 0.19 * t)
    }
    for (const axle of rotatingShafts) axle.group.position.x = axle.direction * (0.121 + 0.045 * t)
    updateLinks()
  }

  function setFinish(finish: DuoFinish) {
    blastedTitanium.color.setHex(finish === 'night' ? 0x38495e : 0xb8b5b0)
  }

  setFold(180)
  setExplosion(0)
  return { parts, setFold, setExplosion, setFinish, setColor(color: string) { blastedTitanium.color.set(color) } }
}
