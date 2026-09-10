import * as THREE from 'three'
import { canvasTexture, randomSource } from './geometry'
import { DUO, foldRadians, type DuoFinish, type DuoPart } from './types'
import { createWallpaperLibrary, drawLockScreen, type WallpaperId } from '../wallpapers'

export function wallpaper(finish: DuoFinish, cover = false) {
  const night = finish === 'night'
  return canvasTexture(1536, 1080, ctx => {
    const width = 1536
    const height = 1080
    const rand = randomSource(20260909)
    const sky = ctx.createLinearGradient(0, 0, 0, height)
    sky.addColorStop(0, night ? '#162a42' : '#739cac')
    sky.addColorStop(0.47, night ? '#735863' : '#e1cdb0')
    sky.addColorStop(1, night ? '#201e29' : '#a39170')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, width, height)
    if (night) {
      for (let i = 0; i < 120; i++) {
        ctx.fillStyle = `rgba(220,226,239,${0.08 + rand() * 0.4})`
        const size = rand() < 0.08 ? 2 : 1
        ctx.fillRect(rand() * width, rand() * 390, size, size)
      }
    }
    for (let layer = 0; layer < 7; layer++) {
      const top = 540 + layer * 48
      const gradient = ctx.createLinearGradient(0, top - 100, 0, top + 380)
      const shade = (night ? 93 : 164) - layer * 12
      gradient.addColorStop(0, `rgb(${shade + (night ? 0 : 9)},${shade},${shade - (night ? -4 : 15)})`)
      gradient.addColorStop(1, night ? '#171d26' : '#4b493e')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.moveTo(-20, height)
      for (let x = -20; x < width + 30; x += 9) {
        const ridge = Math.sin(x * 0.006 + layer * 1.7) * 48 + Math.sin(x * 0.023 + layer) * 20 + Math.sin(x * 0.075) * 6
        ctx.lineTo(x, top + ridge + rand() * 7)
      }
      ctx.lineTo(width + 30, height)
      ctx.closePath()
      ctx.fill()
    }
    const dune = ctx.createLinearGradient(0, 600, 180, height)
    dune.addColorStop(0, night ? '#6b6069' : '#e9d9b8')
    dune.addColorStop(0.4, night ? '#3f3742' : '#bca785')
    dune.addColorStop(1, night ? '#211e2c' : '#7f715b')
    ctx.fillStyle = dune
    ctx.beginPath()
    ctx.moveTo(0, 694)
    ctx.bezierCurveTo(390, 763, 563, 1030, width, 675)
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
    ctx.save()
    ctx.clip()
    for (let i = 0; i < 400; i++) {
      ctx.strokeStyle = `rgba(${night ? '161,148,154' : '255,244,219'},${0.015 + rand() * 0.095})`
      ctx.lineWidth = 0.5 + rand()
      ctx.beginPath()
      const y = 600 + i * 2
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(470, y + 12, 700, y + 215, width, y - 122)
      ctx.stroke()
    }
    ctx.restore()
    if (cover) drawLockScreen(ctx)
  })
}

export function createFoldingDisplay() {
  const group = new THREE.Group()
  const halfWidth = DUO.innerWidth / 2
  const halfHeight = DUO.innerHeight / 2
  const corner = 0.84
  const rows = 20
  const columns: number[] = []
  for (let i = 0; i <= 56; i++) columns.push(-halfWidth + (halfWidth - DUO.gap / 2) * i / 56)
  for (let i = 1; i <= 32; i++) columns.push(-DUO.gap / 2 + DUO.gap * i / 32)
  for (let i = 1; i <= 56; i++) columns.push(DUO.gap / 2 + (halfWidth - DUO.gap / 2) * i / 56)
  const original: { x: number; y: number }[] = []
  const indices: number[] = []
  const uvs: number[] = []
  columns.forEach((x, col) => {
    const outer = Math.max(0, Math.abs(x) - (halfWidth - corner))
    const extent = outer > 0 ? halfHeight - corner + Math.sqrt(Math.max(0, corner * corner - outer * outer)) : halfHeight
    for (let row = 0; row <= rows; row++) {
      const y = -extent + 2 * extent * row / rows
      original.push({ x, y })
      uvs.push((x + halfWidth) / (halfWidth * 2), (y + halfHeight) / (halfHeight * 2))
      if (col < columns.length - 1 && row < rows) {
        const a = col * (rows + 1) + row
        const b = (col + 1) * (rows + 1) + row
        indices.push(a, b, b + 1, a, b + 1, a + 1)
      }
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(original.length * 3), 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  const maps = { white: wallpaper('white'), night: wallpaper('night') }
  const material = new THREE.MeshPhysicalMaterial({
    map: maps.white, emissiveMap: maps.white, emissive: 0xffffff, emissiveIntensity: 0.45,
    color: 0xffffff, metalness: 0.08, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.45,
  })
  const appMaterial = new THREE.MeshBasicMaterial({ toneMapped: false })
  const surface = new THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial>(geometry, material)
  group.add(surface)
  const backingGeometry = geometry.clone()
  const backing = new THREE.Mesh(backingGeometry, new THREE.MeshStandardMaterial({
    color: 0x303336, metalness: 0.6, roughness: 0.52, side: THREE.BackSide,
  }))
  group.add(backing)
  const crease = new THREE.Vector3()
  let lastAngle = -1
  let enabled = true
  let finish: DuoFinish = 'white'
  const customWallpapers = createWallpaperLibrary()
  let selectedWallpaper: WallpaperId = 'original'
  let appTexture: THREE.Texture | null = null

  function deform(target: THREE.BufferGeometry, angle: number, z: number) {
    const phi = foldRadians(angle)
    const cos = Math.cos(phi)
    const sin = Math.sin(phi)
    const gap = DUO.gap / 2
    const left = new THREE.Vector3(-gap * cos + (z - DUO.pivotZ) * sin, 0, DUO.pivotZ + gap * sin + (z - DUO.pivotZ) * cos)
    const right = new THREE.Vector3(gap, 0, z)
    const handle = THREE.MathUtils.lerp(DUO.gap / 3, (DUO.pivotZ - z) * 4 / 3, phi / Math.PI)
    const curve = new THREE.CubicBezierCurve3(left, left.clone().add(new THREE.Vector3(cos * handle, 0, -sin * handle)),
      right.clone().add(new THREE.Vector3(-handle, 0, 0)), right)
    const position = target.getAttribute('position')
    original.forEach(({ x, y }, i) => {
      if (x < -gap) {
        position.setXYZ(i, cos * x + sin * (z - DUO.pivotZ), y, DUO.pivotZ - sin * x + cos * (z - DUO.pivotZ))
      } else if (x > gap) {
        position.setXYZ(i, x, y, z)
      } else {
        curve.getPoint((x + gap) / (2 * gap), crease)
        position.setXYZ(i, crease.x, y, crease.z)
      }
    })
    position.needsUpdate = true
    target.computeVertexNormals()
    target.computeBoundingBox()
    target.computeBoundingSphere()
  }
  function setFold(angle: number) {
    if (Math.abs(angle - lastAngle) < 0.00001) return
    lastAngle = angle
    deform(geometry, angle, 0.26)
    deform(backingGeometry, angle, 0.249)
  }
  function updateScreen() {
    surface.material = enabled && appTexture ? appMaterial : material
    appMaterial.map = appTexture
    appMaterial.needsUpdate = true
    const background = customWallpapers(selectedWallpaper) ?? maps[finish]
    material.map = enabled ? appTexture ?? background : null
    material.emissiveMap = enabled ? appTexture ?? background : null
    material.emissiveIntensity = enabled ? 0.45 : 0
    material.color.setHex(enabled ? 0xffffff : 0x06090d)
    material.needsUpdate = true
  }
  setFold(180)
  const part: DuoPart = {
    id: 'inner-display', name: '7.6″ folding OLED', evidence: 'documented', side: 'center', group,
    detail: 'Continuous 2670 × 1878 OLED surface with a bending center, nano-textured polymer cover and thin backing. Layer construction follows the supplied keynote; the bend path is a visual approximation.',
    offset: new THREE.Vector3(0, 5.5, 8),
  }
  return {
    part,
    surface,
    setFold,
    setAppTexture(texture: THREE.Texture) { appTexture = texture; updateScreen() },
    // Map each flat half's DOM pixels to the deformed display, before projection.
    pixelTransform(left: boolean, width: number, height: number) {
      const pixels = new THREE.Matrix4().set(
        DUO.innerWidth / width, 0, 0, -DUO.innerWidth / 2,
        0, -DUO.innerHeight / height, 0, DUO.innerHeight / 2,
        0, 0, 1, 0.26,
        0, 0, 0, 1,
      )
      if (!left) return pixels
      return new THREE.Matrix4().makeTranslation(0, 0, DUO.pivotZ)
        .multiply(new THREE.Matrix4().makeRotationY(foldRadians(lastAngle)))
        .multiply(new THREE.Matrix4().makeTranslation(0, 0, -DUO.pivotZ))
        .multiply(pixels)
    },
    setFinish(value: DuoFinish) { finish = value; updateScreen() },
    setWallpaper(value: WallpaperId) { selectedWallpaper = value; updateScreen() },
    setScreen(value: boolean) { enabled = value; updateScreen() },
  }
}
