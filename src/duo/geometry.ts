import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function roundedShape(w: number, h: number, r = 0.08) {
  r = Math.min(r, w / 2, h / 2)
  return new THREE.Shape().moveTo(-w / 2 + r, -h / 2).lineTo(w / 2 - r, -h / 2)
    .quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r).lineTo(w / 2, h / 2 - r)
    .quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2).lineTo(-w / 2 + r, h / 2)
    .quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r).lineTo(-w / 2, -h / 2 + r)
    .quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
}

export function polygon(points: [number, number][]) {
  const shape = new THREE.Shape()
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y))
  return shape.closePath()
}

export function slab(shape: THREE.Shape, depth: number, material: THREE.Material, bevel = 0.006) {
  const b = Math.min(bevel, depth / 3)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * b, bevelEnabled: b > 0, bevelThickness: b,
    bevelSize: b, bevelSegments: 3, curveSegments: 20,
  })
  geometry.translate(0, 0, -depth / 2 + b)
  return new THREE.Mesh(geometry, material)
}

export function panel(parent: THREE.Group, w: number, h: number, depth: number, material: THREE.Material,
  x = 0, y = 0, z = 0, radius = 0.06) {
  const mesh = slab(roundedShape(w, h, radius), depth, material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function disc(parent: THREE.Group, radius: number, depth: number, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 48), material)
  mesh.rotation.x = Math.PI / 2
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function ring(parent: THREE.Group, outer: number, inner: number, depth: number, material: THREE.Material, x = 0, y = 0, z = 0) {
  const shape = new THREE.Shape().absarc(0, 0, outer, 0, Math.PI * 2, false)
  shape.holes.push(new THREE.Path().absarc(0, 0, inner, 0, Math.PI * 2, true))
  const mesh = slab(shape, depth, material, 0)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

export function canvasTexture(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is required to construct model surfaces.')
  paint(context)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function microLabel(parent: THREE.Group, lines: string[], x: number, y: number, z: number, width: number, rear = false) {
  const texture = canvasTexture(768, 192, ctx => {
    ctx.fillStyle = '#a5aaa7'
    ctx.font = '22px monospace'
    lines.forEach((line, i) => ctx.fillText(line, 126, 35 + i * 33))
    const rand = randomSource(76 + lines.join('').length)
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
      if (x === 0 || y === 19 || rand() > 0.5) ctx.fillRect(10 + x * 5, 16 + y * 5, 4, 4)
    }
  })
  const material = new THREE.MeshStandardMaterial({
    map: texture, roughness: 0.8, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), material)
  mesh.position.set(x, y, z)
  if (rear) mesh.rotation.y = Math.PI
  parent.add(mesh)
  return mesh
}

export function makeMaterials() {
  const grain = canvasTexture(512, 512, ctx => {
    const rand = randomSource(932)
    const image = ctx.createImageData(512, 512)
    for (let y = 0; y < 512; y++) {
      const row = rand() * 12
      for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4
        image.data[i] = image.data[i + 1] = image.data[i + 2] = 180 + row + rand() * 20
        image.data[i + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  })
  grain.colorSpace = THREE.NoColorSpace
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  const metal = (color: number, roughness: number, metalness = 0.8) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, roughnessMap: grain, bumpMap: grain, bumpScale: 0.001 })
  const carbonTexture = canvasTexture(256, 256, ctx => {
    ctx.fillStyle = '#16191b'
    ctx.fillRect(0, 0, 256, 256)
    for (let y = 0; y < 256; y += 8) for (let x = 0; x < 256; x += 8) {
      const horizontal = (x / 8 + y / 8) % 2 === 0
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = ['#22272a', '#2a3033', '#1b2023', '#14191c'][i]
        ctx.fillRect(x + (horizontal ? 0 : i * 2), y + (horizontal ? i * 2 : 0), horizontal ? 8 : 1, horizontal ? 1 : 8)
      }
    }
  })
  carbonTexture.wrapS = carbonTexture.wrapT = THREE.RepeatWrapping
  carbonTexture.repeat.set(4, 4)
  return {
    steel: metal(0xa8acac, 0.28),
    aluminum: metal(0x9b9e98, 0.44),
    titanium: metal(0xb8b5b0, 0.20, 0.96),
    graphite: metal(0x24282b, 0.74, 0.16),
    black: metal(0x0b0d10, 0.56, 0.18),
    pcb: metal(0x080a0c, 0.72, 0.08),
    shield: metal(0xb0ab96, 0.47),
    copper: metal(0x977451, 0.35),
    gold: metal(0xc1ab79, 0.3),
    ceramic: metal(0x605e53, 0.75, 0.1),
    carbon: new THREE.MeshStandardMaterial({ map: carbonTexture, roughness: 0.53, metalness: 0.3, bumpMap: carbonTexture, bumpScale: 0.002 }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0x07111c, metalness: 0.24, roughness: 0.14, clearcoat: 0.45, iridescence: 0.3, envMapIntensity: 0.25 }),
  }
}

export type DuoMaterials = ReturnType<typeof makeMaterials>

export function screw(parent: THREE.Group, m: DuoMaterials, x: number, y: number, z: number, radius = 0.055) {
  disc(parent, radius * 1.34, 0.022, m.black, x, y, z - 0.012)
  disc(parent, radius, 0.024, m.steel, x, y, z)
  for (let i = 0; i < 3; i++) {
    const slot = panel(parent, radius * 0.16, radius * 0.98, 0.002, m.black, x, y, z + 0.013, 0.001)
    slot.rotation.z = i * Math.PI * 2 / 3
  }
}

/** Only call on static subassemblies; articulated children must stay separate. */
export function batchGroup(group: THREE.Group) {
  group.updateMatrixWorld(true)
  const inverse = group.matrixWorld.clone().invert()
  const batches = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>()
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || Array.isArray(object.material)) return
    const key = `${object.material.uuid}:${Object.keys(object.geometry.attributes).sort().join(',')}`
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
  for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.geometries)
    if (!geometry) throw new Error(`Cannot batch ${group.name}`)
    batch.meshes.forEach(mesh => mesh.removeFromParent())
    batch.geometries.forEach(item => item.dispose())
    group.add(new THREE.Mesh(geometry, batch.material))
  }
}
