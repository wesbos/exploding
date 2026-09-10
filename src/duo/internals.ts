import * as THREE from 'three'
import type { DuoPart, DuoSide, Evidence } from './types'
import {
  batchGroup, canvasTexture, disc, microLabel, panel, polygon, randomSource,
  ring, roundedShape, screw, slab,
} from './geometry'
import type { DuoMaterials } from './geometry'

type Point = [number, number]

const unitBox = new THREE.BoxGeometry(1, 1, 1)

function box(g: THREE.Group, m: THREE.Material, x: number, y: number, z: number,
  w: number, h: number, d: number, angle = 0) {
  const mesh = new THREE.Mesh(unitBox, m)
  mesh.position.set(x, y, z)
  mesh.scale.set(w, h, d)
  mesh.rotation.z = angle
  g.add(mesh)
  return mesh
}

function plate(g: THREE.Group, shape: THREE.Shape, m: THREE.Material, depth: number, z: number) {
  const mesh = slab(shape, depth, m)
  mesh.position.z = z
  g.add(mesh)
  return mesh
}

function trace(g: THREE.Group, m: THREE.Material, points: THREE.Vector3[], width = 0.009) {
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].clone().sub(points[i - 1])
    const mesh = new THREE.Mesh(unitBox, m)
    mesh.position.copy(points[i - 1]).addScaledVector(delta, 0.5)
    mesh.scale.set(width, delta.length(), width)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize())
    g.add(mesh)
  }
}

function localMaterials(m: DuoMaterials) {
  const foilTexture = canvasTexture(512, 512, ctx => {
    const rand = randomSource(2718)
    const data = ctx.createImageData(512, 512)
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const crease = Math.sin(x * 0.029 + Math.sin(y * 0.037) * 0.6) * 3
      const shade = 35 + crease + rand() * 6
      const i = (y * 512 + x) * 4
      data.data[i] = shade
      data.data[i + 1] = shade + 1
      data.data[i + 2] = shade + 2
      data.data[i + 3] = 255
    }
    ctx.putImageData(data, 0, 0)
  })
  foilTexture.wrapS = foilTexture.wrapT = THREE.RepeatWrapping
  foilTexture.repeat.set(0.7, 0.7)
  const wickTexture = canvasTexture(512, 512, ctx => {
    const rand = randomSource(12314)
    ctx.fillStyle = '#626564'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 18000; i++) {
      const v = 72 + Math.floor(rand() * 95)
      ctx.fillStyle = `rgba(${v},${v + 2},${v + 1},0.22)`
      ctx.beginPath()
      ctx.ellipse(rand() * 512, rand() * 512, 1 + rand() * 6, 1 + rand() * 3, rand() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let y = 0; y < 512; y += 5) for (let x = 0; x < 512; x += 5) {
      ctx.fillStyle = '#363a39'
      ctx.fillRect(x + (y % 10 ? 2 : 0), y, 1, 1)
    }
  })
  wickTexture.wrapS = wickTexture.wrapT = THREE.RepeatWrapping
  wickTexture.repeat.set(0.6, 0.6)
  const foil = new THREE.MeshStandardMaterial({
    color: 0xb0b2b4, map: foilTexture, bumpMap: foilTexture, bumpScale: 0.003,
    metalness: 0.34, roughness: 0.7,
  })
  const wick = new THREE.MeshStandardMaterial({
    map: wickTexture, bumpMap: wickTexture, bumpScale: 0.008,
    metalness: 0.58, roughness: 0.79,
  })
  const flex = new THREE.MeshStandardMaterial({ color: 0x49331f, metalness: 0.27, roughness: 0.62 })
  const solder = m.steel.clone()
  solder.color.setHex(0x929c97)
  const mask = m.pcb.clone()
  mask.color.setHex(0x111315)
  const magnet = m.graphite.clone()
  magnet.color.setHex(0x525759)
  return { foil, wick, flex, solder, mask, magnet }
}

type DetailMaterials = ReturnType<typeof localMaterials>

function passive(g: THREE.Group, m: DuoMaterials, d: DetailMaterials,
  x: number, y: number, z: number, length: number, vertical: boolean, rear: boolean, type: number) {
  const width = length * 0.47
  const angle = vertical ? Math.PI / 2 : 0
  const sign = rear ? -1 : 1
  box(g, type === 0 ? m.black : m.ceramic, x, y, z, length, width, 0.027, angle)
  for (const side of [-1, 1]) {
    const dx = vertical ? 0 : side * length * 0.4
    const dy = vertical ? side * length * 0.4 : 0
    box(g, d.solder, x + dx, y + dy, z + sign * 0.003, length * 0.18, width * 1.07, 0.029, angle)
  }
}

function populate(g: THREE.Group, m: DuoMaterials, d: DetailMaterials,
  x: number, y: number, w: number, h: number, z: number, seed: number, rear = false) {
  const rand = randomSource(seed)
  const columns = Math.floor(w / 0.17)
  const rows = Math.floor(h / 0.17)
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    if (rand() < 0.23) continue
    const px = x - w / 2 + 0.1 + col * 0.17
    const py = y - h / 2 + 0.1 + row * 0.17
    passive(g, m, d, px, py, z, 0.08 + rand() * 0.035, rand() > 0.65, rear, rand() > 0.6 ? 0 : 1)
    if (rand() > 0.86) {
      disc(g, 0.022, 0.004, m.gold, px + 0.063, py + 0.055, z + (rear ? -0.018 : 0.018))
    }
  }
}

function connector(g: THREE.Group, m: DuoMaterials, x: number, y: number, z: number,
  w: number, count = 16, rear = false) {
  const sign = rear ? -1 : 1
  panel(g, w, 0.24, 0.062, m.black, x, y, z, 0.025)
  panel(g, w - 0.08, 0.08, 0.012, m.graphite, x, y, z + sign * 0.036, 0.007)
  for (const edge of [-1, 1]) {
    box(g, m.steel, x + edge * (w / 2 - 0.018), y, z, 0.035, 0.28, 0.074)
    for (let i = 0; i < count; i++) {
      box(g, m.gold, x - w / 2 + 0.07 + i * (w - 0.14) / (count - 1),
        y + edge * 0.092, z + sign * 0.035, 0.018, 0.073, 0.009)
    }
  }
}

function flex(g: THREE.Group, m: DuoMaterials, d: DetailMaterials, points: Point[], z: number,
  paths: Point[][] = []) {
  plate(g, polygon(points), d.flex, 0.018, z)
  for (const path of paths) {
    trace(g, m.copper, path.map(([x, y]) => new THREE.Vector3(x, y, z + 0.012)), 0.009)
  }
}

function chip(g: THREE.Group, m: DuoMaterials, d: DetailMaterials, x: number, y: number,
  w: number, h: number, label: string[], rear = false) {
  const sign = rear ? -1 : 1
  const z = rear ? -0.083 : 0.061
  panel(g, w + 0.07, h + 0.07, 0.024, d.mask, x, y, z - sign * 0.03, 0.025)
  panel(g, w, h, 0.067, m.black, x, y, z, 0.03)
  microLabel(g, label, x, y, z + sign * 0.035, w * 0.85, rear)
  disc(g, 0.02, 0.003, m.graphite, x - w / 2 + 0.07, y + h / 2 - 0.07, z + sign * 0.035)
}

function battery(g: THREE.Group, m: DuoMaterials, d: DetailMaterials, side: 'left' | 'right') {
  const left = side === 'left'
  const x = left ? -4.325 : 4.65
  const y = left ? 0 : -0.645
  const w = left ? 6.35 : 6.06
  const h = left ? 7.8 : 6.75
  const shape = left
    ? new THREE.Shape().moveTo(-3.005, -3.9).lineTo(3.005, -3.9)
      .quadraticCurveTo(3.175, -3.9, 3.175, -3.73).lineTo(3.175, 3.73)
      .quadraticCurveTo(3.175, 3.9, 3.005, 3.9).lineTo(-2.35, 3.9)
      .quadraticCurveTo(-2.52, 3.9, -2.52, 3.73).lineTo(-2.52, 3.08)
      .quadraticCurveTo(-2.52, 2.9, -2.7, 2.9).lineTo(-3.015, 2.9)
      .quadraticCurveTo(-3.175, 2.9, -3.175, 2.73).lineTo(-3.175, -3.73)
      .quadraticCurveTo(-3.175, -3.9, -3.005, -3.9).closePath()
    : new THREE.Shape().moveTo(-2.85, -3.375).lineTo(2.85, -3.375)
      .quadraticCurveTo(3.03, -3.375, 3.03, -3.195).lineTo(3.03, 3.195)
      .quadraticCurveTo(3.03, 3.375, 2.85, 3.375).lineTo(-0.4, 3.375)
      .quadraticCurveTo(-0.58, 3.375, -0.58, 3.195).lineTo(-0.58, -0.305)
      .quadraticCurveTo(-0.58, -0.525, -0.8, -0.525).lineTo(-2.85, -0.525)
      .quadraticCurveTo(-3.03, -0.525, -3.03, -0.705).lineTo(-3.03, -3.195)
      .quadraticCurveTo(-3.03, -3.375, -2.85, -3.375).closePath()
  const margin = slab(shape, 0.037, m.graphite, 0.009)
  margin.position.set(x, y, -0.018)
  g.add(margin)
  const pouch = slab(shape, 0.195, d.foil, 0.018)
  pouch.scale.set((w - 0.14) / w, (h - 0.15) / h, 1)
  pouch.position.set(x, y, -0.024)
  g.add(pouch)
  const perimeter = shape.getSpacedPoints(190)
  for (let i = 0; i < perimeter.length - 1; i++) {
    const p = perimeter[i]
    const next = perimeter[i + 1]
    box(g, m.graphite, x + p.x * (w - 0.05) / w, y + p.y * (h - 0.05) / h,
      0.002, 0.044, 0.012, 0.007, Math.atan2(next.y - p.y, next.x - p.x))
  }
  microLabel(g, ['Li-ion  /  CELL ' + (left ? 'A' : 'B'), 'CAPACITY NOT PUBLISHED', 'DO NOT PUNCTURE  /  RECYCLE'],
    left ? x - 0.55 : 5.82, y + 0.4, 0.077, left ? 3.4 : 2.85)
  microLabel(g, ['DUAL-CELL POWER SYSTEM', 'ENCLOSURE SHAPE APPROXIMATION'],
    x, y - h / 2 + 0.65, 0.078, 2.8)
  microLabel(g, ['Li-ion  /  CELL ' + (left ? 'A' : 'B'), 'CAPACITY NOT PUBLISHED'],
    left ? x : 5.82, y, -0.124, left ? 2.9 : 2.7, true)
  const bottom = y - h / 2
  panel(g, 1.18, 0.29, 0.08, m.black, x + 0.75, bottom - 0.08, -0.01, 0.04)
  for (let i = 0; i < 8; i++) {
    passive(g, m, d, x + 0.32 + i * 0.12, bottom - 0.075, 0.048, 0.07, false, false, i % 2)
  }
  flex(g, m, d, [
    [x - 0.08, bottom + 0.08], [x + 0.24, bottom + 0.08], [x + 0.24, bottom - 0.31],
    [x + 1.45, bottom - 0.31], [x + 1.45, bottom - 0.56], [x - 0.08, bottom - 0.56],
  ], -0.035, Array.from({ length: 5 }, (_, i) => [
    [x - 0.025 + i * 0.042, bottom], [x - 0.025 + i * 0.042, bottom - 0.37 - i * 0.027],
    [x + 1.36, bottom - 0.37 - i * 0.027],
  ]))
  connector(g, m, x + 1.09, bottom - 0.46, -0.001, 0.66, 10)
  for (const dx of [-1.6, 1.8]) {
    panel(g, 0.39, 0.32, 0.012, m.black, x + dx, bottom + 0.16, -0.13, 0.07)
    box(g, m.graphite, x + dx, bottom + 0.13, -0.14, 0.27, 0.024, 0.004)
  }
}

function logicBoard(g: THREE.Group, m: DuoMaterials, d: DetailMaterials) {
  const outline: Point[] = [
    [1.12, -4.71], [1.12, 5.35], [2.14, 5.35], [2.14, 4.55], [3.35, 4.55],
    [3.35, 3.01], [3.97, 3.01], [3.97, -0.88], [3.81, -1.07],
    [1.44, -1.07], [1.44, -4.43], [4.12, -4.43], [4.12, -5.39],
    [1.35, -5.39], [1.35, -4.71],
  ]
  const shape = polygon(outline)
  const mounts = [[1.3, 4.84], [2.54, -0.87], [1.29, -3.93], [3.82, -5.14]]
  for (const [x, y] of mounts) {
    shape.holes.push(new THREE.Path().absarc(x, y, 0.069, 0, Math.PI * 2, true))
  }
  plate(g, shape, m.pcb, 0.065, -0.028)
  const edge = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(outline.map(([x, y]) => new THREE.Vector3(x, y, 0.006))),
    new THREE.LineBasicMaterial({ color: 0x45494c }),
  )
  g.add(edge)
  chip(g, m, d, 3.1, 0.84, 1.45, 1.54, ['A20 PRO', '2 nm'])
  // The die/package construction is explanatory, not a published package drawing.
  panel(g, 1.22, 1.28, 0.013, m.shield, 3.1, 0.84, 0.091, 0.06)
  microLabel(g, ['A20 PRO', 'THERMAL INTERFACE'], 3.1, 0.84, 0.099, 1.04)
  chip(g, m, d, 1.77, 0.15, 0.86, 1.3, ['C2', 'MODEM'])
  chip(g, m, d, 3.26, -0.62, 0.64, 0.54, ['N1'])
  chip(g, m, d, 2.91, 2.5, 1.54, 0.64, ['RF / POWER', 'APPROXIMATION'])
  chip(g, m, d, 2.75, 3.76, 0.94, 0.96, ['SHIELDED PACKAGE', 'APPROXIMATION'])
  chip(g, m, d, 1.69, 1.96, 0.76, 0.46, ['RF'])
  chip(g, m, d, 2.74, -4.87, 0.79, 0.43, ['POWER'])
  chip(g, m, d, 3.1, 0.84, 1.39, 1.48, ['PACKAGE BACK', 'LAYOUT APPROX.'], true)
  chip(g, m, d, 1.77, 0.15, 0.76, 1.16, ['RF'], true)
  for (const rear of [false, true]) {
    const z = rear ? -0.084 : 0.033
    populate(g, m, d, 1.7, 3.24, 0.83, 1.62, z, rear ? 448 : 77, rear)
    populate(g, m, d, 1.29, -2.7, 0.24, 2.96, z, rear ? 218 : 992, rear)
    populate(g, m, d, 2.56, 1.91, 0.57, 0.31, z, rear ? 555 : 88, rear)
    populate(g, m, d, 3.8, 2.26, 0.22, 1.17, z, rear ? 5551 : 882, rear)
    populate(g, m, d, 2.65, 3.03, 1.17, 0.3, z, rear ? 557 : 884, rear)
    populate(g, m, d, 3.86, -0.49, 0.19, 0.69, z, rear ? 181 : 194, rear)
    populate(g, m, d, 2.58, -0.33, 0.32, 0.35, z, rear ? 943 : 391, rear)
    populate(g, m, d, 1.74, -0.82, 0.94, 0.29, z, rear ? 94 : 39, rear)
    populate(g, m, d, 1.72, -4.87, 0.83, 0.79, z, rear ? 849 : 191, rear)
    populate(g, m, d, 3.54, -4.88, 0.85, 0.69, z, rear ? 589 : 745, rear)
    populate(g, m, d, 1.78, 4.59, 0.44, 1.02, z, rear ? 930 : 394, rear)
    for (let i = 0; i < 31; i++) {
      const y = -3.59 + i * 0.2
      ring(g, 0.026, 0.012, 0.005, m.gold, 1.18, y, rear ? -0.063 : 0.009)
    }
    for (let i = 0; i < 7; i++) {
      const x = 1.25 + i * 0.019
      trace(g, m.copper, [
        new THREE.Vector3(x, -3.75, rear ? -0.063 : 0.009),
        new THREE.Vector3(x, 1.29 - i * 0.025, rear ? -0.063 : 0.009),
        new THREE.Vector3(x + 0.77, 1.56 - i * 0.025, rear ? -0.063 : 0.009),
      ], 0.006)
    }
  }
  for (const [x, y, w] of [[2.73, 4.39, 1], [2.73, -0.64, 0.33], [2.78, -5.22, 1.54]]) {
    connector(g, m, x, y, 0.033, w, w < 0.5 ? 6 : 16)
  }
  for (const [x, y] of mounts) {
    ring(g, 0.112, 0.071, 0.009, m.gold, x, y, 0.01)
    screw(g, m, x, y, 0.024, 0.044)
  }
  // Folded shield edges leave the populated board exposed in the isolated inspector.
  for (const [x, y, w, h] of [[3.1, 0.84, 1.67, 1.75], [1.77, 0.15, 1.02, 1.47], [2.91, 2.5, 1.73, 0.83]]) {
    for (const side of [-1, 1]) {
      box(g, m.shield, x + side * w / 2, y, 0.044, 0.022, h, 0.09)
      box(g, m.shield, x, y + side * h / 2, 0.044, w, 0.022, 0.09)
    }
  }
  microLabel(g, ['DUO / eSIM ONLY', 'BOARD ROUTING APPROXIMATION'], 2.73, -4.57, 0.044, 1.47)
}

function chamberShape(inset = 0) {
  const l = 1.8 + inset
  const r = 5.9 - inset
  const neck = 3.4 - inset
  const tail = 4.5 + inset
  return new THREE.Shape().moveTo(l + 0.19, 4.1 - inset)
    .lineTo(neck - 0.2, 4.1 - inset).quadraticCurveTo(neck, 4.1 - inset, neck, 3.88 - inset)
    .lineTo(neck, 3.03).quadraticCurveTo(neck, 2.5 - inset, neck + 0.48, 2.5 - inset)
    .lineTo(r - 0.31, 2.5 - inset).quadraticCurveTo(r, 2.5 - inset, r, 2.19)
    .lineTo(r, -3.48 + inset).quadraticCurveTo(r, -3.7 + inset, r - 0.23, -3.7 + inset)
    .lineTo(tail + 0.16, -3.7 + inset).quadraticCurveTo(tail, -3.7 + inset, tail, -3.53 + inset)
    .lineTo(tail, -1.27).quadraticCurveTo(tail, -0.7 + inset, tail - 0.55, -0.7 + inset)
    .lineTo(l + 0.47, -0.7 + inset).quadraticCurveTo(l, -0.7 + inset, l, -0.22)
    .lineTo(l, 3.87 - inset).quadraticCurveTo(l, 4.1 - inset, l + 0.19, 4.1 - inset).closePath()
}

function vaporChamber(g: THREE.Group, m: DuoMaterials, d: DetailMaterials) {
  plate(g, chamberShape(-0.095), m.graphite, 0.018, 0.109)
  plate(g, chamberShape(), m.steel, 0.043, 0.134)
  plate(g, chamberShape(0.115), d.wick, 0.009, 0.159)
  plate(g, chamberShape(0.05), m.graphite, 0.006, 0.11)
  const perimeter = chamberShape(0.035).getPoints(14)
  const curve = new THREE.CatmullRomCurve3(perimeter.map(p => new THREE.Vector3(p.x, p.y, 0.161)), true)
  const weld = new THREE.Mesh(new THREE.TubeGeometry(curve, 280, 0.007, 5, true), m.shield)
  g.add(weld)
  for (let i = 0; i < 190; i++) {
    const p = curve.getPointAt(i / 190)
    disc(g, 0.012, 0.003, m.graphite, p.x, p.y, 0.163)
  }
  panel(g, 1.22, 1.28, 0.011, m.copper, 3.1, 0.84, 0.108, 0.05)
  panel(g, 1.1, 1.16, 0.003, m.graphite, 3.1, 0.84, 0.101, 0.05)
  panel(g, 0.38, 0.15, 0.035, m.steel, 5.18, -3.73, 0.136, 0.04)
  for (let i = 0; i < 5; i++) box(g, m.graphite, 5.07 + i * 0.053, -3.72, 0.156, 0.018, 0.08, 0.003)
  microLabel(g, ['VAPOR CHAMBER', 'SURFACE / WICK APPROXIMATION'], 3.46, 0.59, 0.168, 2.0)
}

function rearCameras(g: THREE.Group, m: DuoMaterials, d: DetailMaterials) {
  plate(g, polygon([
    [3.54, 3.06], [7.65, 3.06], [7.93, 3.42], [7.93, 5.15],
    [7.57, 5.43], [3.63, 5.43], [3.42, 5.13], [3.42, 3.3],
  ]), m.graphite, 0.039, -0.041)
  for (const [x, radius, w, h, main] of [[4.6, 0.58, 1.95, 2.1, 1], [6.75, 0.5, 1.65, 1.75, 0]]) {
    const y = 4.35
    panel(g, w, h, 0.15, m.black, x, y, -0.143, 0.17)
    panel(g, w - 0.13, h - 0.13, 0.08, m.graphite, x, y, -0.25, 0.13)
    const housing = polygon([
      [-w / 2 + 0.25, -h / 2 + 0.04], [w / 2 - 0.25, -h / 2 + 0.04],
      [w / 2 - 0.04, -h / 2 + 0.25], [w / 2 - 0.04, h / 2 - 0.25],
      [w / 2 - 0.25, h / 2 - 0.04], [-w / 2 + 0.25, h / 2 - 0.04],
      [-w / 2 + 0.04, h / 2 - 0.25], [-w / 2 + 0.04, -h / 2 + 0.25],
    ])
    const shield = slab(housing, 0.085, m.black)
    shield.position.set(x, y, -0.329)
    g.add(shield)
    ring(g, radius + 0.17, radius + 0.095, 0.11, m.graphite, x, y, -0.378)
    ring(g, radius + 0.09, radius + 0.019, 0.077, m.black, x, y, -0.461)
    ring(g, radius + 0.025, radius - 0.035, 0.026, m.steel, x, y, -0.51)
    disc(g, radius - 0.035, 0.015, m.lens, x, y, -0.528)
    ring(g, radius * 0.74, radius * 0.69, 0.004, m.graphite, x, y, -0.538)
    disc(g, radius * 0.4, 0.005, m.lens, x, y, -0.54)
    panel(g, w - 0.17, h - 0.17, 0.033, m.shield, x, y, -0.047, 0.07)
    panel(g, w - 0.28, h - 0.3, 0.012, m.graphite, x, y, -0.025, 0.06)
    microLabel(g, [main ? '48MP FUSION MAIN' : '48MP ULTRA WIDE', main ? 'SENSOR-SHIFT OIS' : 'MACRO'], x, y + 0.05, -0.017, w * 0.76)
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      screw(g, m, x + sx * (w / 2 - 0.12), y + sy * (h / 2 - 0.14), -0.019, 0.035)
      if (main) {
        box(g, m.copper, x + sx * 0.73, y + sy * 0.61, -0.229, 0.08, 0.35, 0.09)
        for (let i = 0; i < 7; i++) {
          box(g, m.gold, x + sx * 0.73, y + sy * 0.61 - 0.13 + i * 0.042, -0.278, 0.085, 0.01, 0.005)
        }
      }
    }
    const bottom = y - h / 2
    flex(g, m, d, [
      [x - 0.3, bottom + 0.14], [x + 0.3, bottom + 0.14], [x + 0.3, bottom - 0.4],
      [x - 0.63, bottom - 0.4], [x - 0.63, bottom - 0.15], [x - 0.3, bottom - 0.15],
    ], -0.031, Array.from({ length: 8 }, (_, i) => [
      [x - 0.23 + i * 0.055, bottom], [x - 0.23 + i * 0.055, bottom - 0.2 - i * 0.015],
      [x - 0.55, bottom - 0.2 - i * 0.015],
    ]))
    connector(g, m, x - 0.2, bottom - 0.31, 0.009, 0.77, 12)
  }
}

function selfieCamera(g: THREE.Group, m: DuoMaterials, d: DetailMaterials, cover: boolean) {
  const x = cover ? -7.2 : 3.16
  const y = cover ? 4.83 : 4.98
  const direction = cover ? -1 : 1
  panel(g, 0.66, 0.65, 0.18, m.black, x, y, -0.01, 0.095)
  panel(g, 0.57, 0.56, 0.016, m.shield, x, y, -direction * 0.103, 0.055)
  ring(g, 0.235, 0.16, 0.06, m.graphite, x, y, direction * 0.105)
  disc(g, 0.156, 0.015, m.lens, x, y, direction * 0.144)
  ring(g, 0.143, 0.12, 0.008, m.black, x, y, direction * 0.156)
  disc(g, 0.075, 0.004, m.lens, x, y, direction * 0.163)
  flex(g, m, d, [
    [x - 0.23, y - 0.2], [x + 0.23, y - 0.2], [x + 0.23, y - 0.62],
    [x + 0.59, y - 0.62], [x + 0.59, y - 0.83], [x - 0.23, y - 0.83],
  ], -0.06)
  connector(g, m, x + 0.16, y - 0.75, -0.017, 0.61, 10)
  microLabel(g, [cover ? '12MP CENTER STAGE' : 'UNDER-DISPLAY', 'PLACEMENT APPROX.'],
    x, y, -direction * 0.115, 0.49, !cover)
}

function acousticMesh(g: THREE.Group, m: DuoMaterials, x: number, y: number, z: number, w: number, h: number) {
  panel(g, w, h, 0.012, m.black, x, y, z, 0.055)
  const countX = Math.floor(w / 0.038)
  const countY = Math.floor(h / 0.041)
  for (let col = 1; col < countX; col++) {
    box(g, m.graphite, x - w / 2 + col * 0.038, y, z + 0.009, 0.011, h - 0.05, 0.008)
  }
  for (let row = 1; row < countY; row++) {
    box(g, m.graphite, x, y - h / 2 + row * 0.041, z + 0.012, w - 0.04, 0.009, 0.006)
  }
}

function speaker(g: THREE.Group, m: DuoMaterials, d: DetailMaterials, upper: boolean) {
  const x = upper ? -4.52 : 6.43
  const y = upper ? 4.73 : -4.98
  const w = upper ? 2.93 : 2.24
  const h = upper ? 0.94 : 1.02
  panel(g, w, h, 0.22, m.black, x, y, -0.012, 0.14)
  panel(g, w - 0.14, h - 0.15, 0.019, m.graphite, x, y, 0.104, 0.11)
  panel(g, upper ? 1.87 : 1.36, 0.65, 0.038, m.steel, x - 0.2, y, 0.106, 0.15)
  panel(g, upper ? 1.69 : 1.18, 0.51, 0.015, m.black, x - 0.2, y, 0.134, 0.12)
  acousticMesh(g, m, x - 0.2, y, 0.146, upper ? 1.5 : 1.03, 0.39)
  panel(g, 0.77, 0.37, 0.027, m.steel, x + 0.15, y, -0.137, 0.08)
  for (const side of [-1, 1]) {
    panel(g, 0.21, 0.22, 0.041, m.black, x + side * (w / 2 - 0.015), y + side * 0.21, 0.018, 0.08)
    screw(g, m, x + side * (w / 2 - 0.015), y + side * 0.21, 0.059, 0.043)
  }
  const outletY = upper ? 5.45 : -5.46
  panel(g, 1.13, 0.27, 0.16, m.black, x, outletY, -0.025, 0.05)
  acousticMesh(g, m, x, outletY, 0.063, 0.94, 0.16)
  for (let i = 0; i < 2; i++) {
    box(g, m.gold, x + w / 2 - 0.15 - i * 0.14, y - h / 2 + 0.1, 0.115, 0.085, 0.15, 0.014)
  }
  microLabel(g, [upper ? 'UPPER SPEAKER' : 'LOWER SPEAKER'], x, y + 0.32, 0.14, 1.01)
  if (upper) {
    plate(g, polygon([
      [-2.97, 4.15], [-1.16, 4.15], [-1.16, 5.36], [-2.37, 5.36], [-2.37, 5.02], [-2.97, 5.02],
    ]), m.pcb, 0.037, -0.028)
    populate(g, m, d, -1.72, 4.61, 0.94, 0.7, 0.013, 922)
    panel(g, 0.54, 0.53, 0.034, m.shield, -2.51, 4.51, 0.019, 0.04)
    connector(g, m, -1.79, 5.17, 0.018, 0.8, 12)
  }
}

function taptic(g: THREE.Group, m: DuoMaterials, d: DetailMaterials) {
  const outline = polygon([
    [-7.46, -4.31], [-5.21, -4.31], [-4.75, -4.72], [-3.78, -4.72],
    [-3.78, -4.34], [-1.28, -4.34], [-1.28, -5.29], [-3.41, -5.29],
    [-3.67, -5.51], [-6.83, -5.51], [-7.46, -5.03],
  ])
  plate(g, outline, m.pcb, 0.035, -0.034)
  populate(g, m, d, -2.12, -4.91, 1.42, 0.61, 0.006, 782)
  populate(g, m, d, -6.56, -4.55, 1.19, 0.34, 0.006, 675)
  panel(g, 2.5, 0.82, 0.19, m.steel, -5.73, -4.95, -0.015, 0.09)
  panel(g, 2.37, 0.7, 0.013, m.shield, -5.73, -4.95, 0.09, 0.06)
  for (const side of [-1, 1]) {
    panel(g, 0.21, 0.48, 0.12, m.black, -5.73 + side * 1.18, -4.95, -0.012, 0.05)
    screw(g, m, -5.73 + side * 1.38, -4.95, 0.015, 0.049)
    for (let i = 0; i < 5; i++) box(g, m.graphite, -5.73 + side * 1.07,
      -5.17 + i * 0.1, 0.1, 0.035, 0.043, 0.004)
  }
  microLabel(g, ['TAPTIC ENGINE', 'ASSEMBLY APPROXIMATION'], -5.76, -4.95, 0.099, 1.6)
  panel(g, 1.08, 0.61, 0.056, m.shield, -3.99, -5.08, 0.022, 0.05)
  for (let i = 0; i < 6; i++) disc(g, 0.017, 0.003, m.graphite, -4.4 + i * 0.164, -4.87, 0.053)
  connector(g, m, -2.48, -4.47, 0.014, 1.28, 18)
  flex(g, m, d, [[-4.69, -4.66], [-4.23, -4.66], [-4.23, -4.37], [-3.5, -4.37],
    [-3.5, -4.21], [-4.69, -4.21]], 0.014)
}

function usbC(g: THREE.Group, m: DuoMaterials, d: DetailMaterials) {
  const x = 3.04
  const y = -5.595
  const crossSection = roundedShape(0.92, 0.3, 0.14)
  crossSection.holes.push(new THREE.Path(roundedShape(0.8, 0.207, 0.095).getPoints(16)))
  const shell = slab(crossSection, 0.59, m.steel, 0.003)
  shell.rotation.x = Math.PI / 2
  shell.position.set(x, y, 0)
  g.add(shell)
  panel(g, 0.97, 0.12, 0.3, m.black, x, y + 0.26, 0, 0.035)
  box(g, m.black, x, y - 0.01, 0, 0.67, 0.41, 0.056)
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
    box(g, m.gold, x - 0.286 + i * 0.052, y - 0.06, side * 0.031, 0.021, 0.28, 0.008)
  }
  for (const side of [-1, 1]) {
    panel(g, 0.23, 0.33, 0.06, m.steel, x + side * 0.6, y, 0, 0.06)
    screw(g, m, x + side * 0.62, y, 0.043, 0.047)
  }
  flex(g, m, d, [
    [x - 0.55, y + 0.14], [x + 0.55, y + 0.14], [x + 0.55, y + 0.53],
    [x + 0.01, y + 0.53], [x + 0.01, y + 0.99], [x - 0.54, y + 0.99],
  ], -0.042, Array.from({ length: 10 }, (_, i) => [
    [x - 0.36 + i * 0.054, y + 0.21], [x - 0.36 + i * 0.054, y + 0.38 + i * 0.015],
    [x - 0.45 + i * 0.038, y + 0.56 + i * 0.015], [x - 0.45 + i * 0.038, y + 0.87],
  ]))
  connector(g, m, x - 0.23, y + 0.89, -0.008, 0.69, 12)
  panel(g, 0.31, 0.31, 0.05, m.shield, x + 0.64, y - 0.05, 0.047, 0.04)
  disc(g, 0.041, 0.004, m.black, x + 0.64, y - 0.05, 0.075)
}

function magSafe(g: THREE.Group, m: DuoMaterials, d: DetailMaterials) {
  const x = 4.3
  const y = -0.9
  disc(g, 2.5, 0.017, m.black, x, y, -0.187)
  ring(g, 2.42, 2.02, 0.025, m.graphite, x, y, -0.209)
  for (let i = 0; i < 36; i++) {
    const start = i * Math.PI * 2 / 36 + 0.009
    const end = (i + 1) * Math.PI * 2 / 36 - 0.009
    const shape = new THREE.Shape().absarc(x, y, 2.37, start, end, false)
      .absarc(x, y, 2.08, end, start, true).closePath()
    plate(g, shape, d.magnet, 0.027, -0.217)
  }
  for (let i = 0; i < 19; i++) {
    ring(g, 1.97 - i * 0.047, 1.95 - i * 0.047, 0.007, m.copper, x, y, -0.216)
  }
  disc(g, 0.97, 0.014, m.graphite, x, y, -0.21)
  panel(g, 0.49, 1.02, 0.018, m.black, x, y - 2.95, -0.187, 0.04)
  for (let i = 0; i < 4; i++) panel(g, 0.37, 0.19, 0.024, d.magnet, x, y - 2.6 - i * 0.21, -0.212, 0.012)
  flex(g, m, d, [
    [x + 0.18, y - 1.7], [x + 0.5, y - 1.7], [x + 0.5, y - 3.5],
    [x - 0.78, y - 3.5], [x - 0.78, y - 3.27], [x + 0.18, y - 3.27],
  ], -0.179)
  connector(g, m, x - 0.49, y - 3.38, -0.191, 0.6, 10, true)
  microLabel(g, ['MagSafe / Qi2', '25W  /  PLACEMENT APPROX.'], x, y, -0.222, 1.65, true)
}

function support(g: THREE.Group, m: DuoMaterials, left: boolean) {
  const center = left ? -4.33 : 4.33
  const outline = roundedShape(7.52, 10.73, 0.57)
  for (const [x, y] of [[-3.4, -4.8], [3.36, -4.8], [-3.4, 4.78], [3.36, 4.78]]) {
    outline.holes.push(new THREE.Path().absarc(x, y, 0.065, 0, Math.PI * 2, true))
  }
  if (!left) outline.holes.push(new THREE.Path().absarc(3.16 - center, 4.98, 0.258, 0, Math.PI * 2, true))
  const sheet = slab(outline, 0.022, m.carbon, 0.0015)
  sheet.position.set(center, 0, 0.206)
  g.add(sheet)
  for (const side of [-1, 1]) {
    panel(g, 0.07, 8.5, 0.009, m.graphite, center + side * 3.69, -0.02, 0.222, 0.015)
    panel(g, 5.7, 0.052, 0.007, m.graphite, center, side * 5.28, 0.222, 0.009)
  }
  for (const [x, y] of [[-3.4, -4.8], [3.36, -4.8], [-3.4, 4.78], [3.36, 4.78]]) {
    ring(g, 0.108, 0.065, 0.009, m.titanium, center + x, y, 0.222)
  }
  for (let i = 0; i < 6; i++) {
    panel(g, 0.15, 0.27, 0.016, m.titanium, center + (left ? 3.68 : -3.68), -4.1 + i * 1.65, 0.211, 0.026)
  }
  microLabel(g, ['CARBON-FIBER SUPPORT', 'OUTLINE APPROXIMATION'], center, -4.7, 0.22, 1.72)
}

/**
 * Announcement-frame proportions, in the open phone's coordinates.
 * Unpublished packaging, circuits and laminations are deliberately labeled as approximations.
 */
export function createDuoInternals(materials: DuoMaterials): DuoPart[] {
  const d = localMaterials(materials)
  const parts: DuoPart[] = []
  function add(id: string, name: string, detail: string, side: DuoSide, offset: [number, number, number],
    build: (group: THREE.Group) => void, evidence: Evidence = 'approximation') {
    const group = new THREE.Group()
    group.name = name
    group.userData.side = side
    group.userData.evidence = evidence
    build(group)
    batchGroup(group)
    parts.push({ id, name, detail, evidence, side, group, offset: new THREE.Vector3(...offset) })
  }
  add('battery-left', 'Left lithium-ion cell',
    'One of two lithium-ion cells managed as a single pack. The broad left pouch and small upper-outboard notch follow the unobscured power-section announcement frame; seals, protection flex and exact thickness are approximations. Apple has not published capacity, energy or voltage.',
    'left', [-1, -0.3, 2], g => battery(g, materials, d, 'left'))
  add('battery-right', 'Right lithium-ion cell',
    'The power-section announcement frame reveals an L-shaped right cell: a tall outer column below the cameras and a broad lower foot extending toward the hinge beneath the logic board. This contour is reference-backed; thickness, seals, tabs and exact dimensions remain approximations. Capacity is unpublished.',
    'right', [1, -0.3, 2], g => battery(g, materials, d, 'right'))
  add('logic-board', 'A20 Pro logic board · C2 · N1',
    'The unobscured power-section announcement frame shows the tall stepped right logic board beside the L-shaped cell, with the large A20 Pro package near its lower middle. A20 Pro (2 nm), C2 and N1 are documented; exact chip identities beyond the SoC, routing, two-sided passives, connectors and lower daughterboard details are approximations. No RAM specification is assumed. eSIM only.',
    'right', [0.5, 0.4, 1.3], g => logicBoard(g, materials, d))
  add('vapor-chamber', 'Dogleg vapor chamber',
    'The announcement reveal shows this distinctive upper neck, broad middle and long lower tail on the right half. A20 Pro is coupled to the chamber. Silver surface, perimeter welds, wick-like finish and contact construction are approximations; no unverified internal fluid channels are claimed.',
    'right', [0.5, 0.3, 3], g => vaporChamber(g, materials, d))
  add('cameras', 'Dual 48MP rear camera assembly',
    'Exactly two rear modules: 48MP Fusion Main with sensor-shift OIS, and 48MP Ultra Wide with macro. The 2× view is a main-sensor crop, not a third lens. Module positions follow the exterior and announcement; stepped shields, OIS details and flex routing are approximations.',
    'right', [0.8, 1.8, 1.3], g => rearCameras(g, materials, d))
  add('cover-camera', '12MP cover Center Stage camera',
    'The documented 12MP cover camera sits in the rounded corner. This rear-facing-in-open-coordinates module aligns with the outer screen; sensor enclosure and flex are approximations. No Face ID or TrueDepth assembly.',
    'left', [-1.2, 1.7, 1.6], g => selfieCamera(g, materials, d, true))
  add('inner-camera', 'Under-display FaceTime camera',
    'A single camera beneath the inner OLED, near the upper right half as suggested by the reveal. Its resolution is unpublished. Optics, housing and flex packaging are approximations; no Face ID components.',
    'right', [0.4, 2.4, 1.7], g => selfieCamera(g, materials, d, false))
  add('upper-speaker', 'Upper speaker & interconnect board',
    'Upper-left acoustic chamber follows the announcement reveal. Stereo audio is documented; acoustic mesh, contacts, driver backplate and nearby interconnect circuitry are approximations.',
    'left', [-0.8, 1.9, 1.6], g => speaker(g, materials, d, true))
  add('lower-speaker', 'Lower stereo speaker',
    'Lower-right speaker chamber follows the announcement reveal. Fine protective mesh, sealed outlet duct and contact terminals are teardown-informed approximations. Stereo tuning adapts to the fold position.',
    'right', [1.1, -1.5, 1.5], g => speaker(g, materials, d, false))
  add('taptic', 'Haptic actuator & lower daughterboard',
    'Compact sealed linear haptic actuator beside the left lower interconnect electronics. The lower metal-shielded region is visible in the reveal; actuator identification, exact placement, shield outlines and circuitry are approximations.',
    'left', [-1, -1.8, 1.4], g => taptic(g, materials, d))
  add('usb-c', 'USB-C receptacle & charging flex',
    'Physical hollow USB-C shell with double-sided tongue contacts, mounting ears, charging flex and microphone package. USB-C charging is documented; connector interior and local electronics are approximations.',
    'right', [0.2, -2, 1.3], g => usbC(g, materials, d))
  add('magsafe', 'MagSafe / Qi2 charging assembly',
    'MagSafe and Qi2 charging up to 25W are documented. The coil, segmented magnet ring, alignment magnets, ferrite backing and placement behind the right cell under the opaque camera-side glass are an explanatory approximation, not a published antenna or coil layout.',
    'right', [0.8, 0, -2], g => magSafe(g, materials, d))
  add('support-left', 'Left carbon-fiber support plate',
    'Carbon-fiber support beneath the flexible inner display is documented and shown in the announcement. Woven finish, removable plate outline, titanium inserts and mounting details are approximations.',
    'left', [-8, -3, 3.5], g => support(g, materials, true))
  add('support-right', 'Right carbon-fiber support plate',
    'The second carbon-fiber support supports the right inner-display half above the cooling assembly. Camera clearance, weave, outline and mounting inserts are approximations; display lamination is a separate assembly.',
    'right', [10, -3, 3.5], g => support(g, materials, false))
  return parts
}
