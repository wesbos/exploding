import * as THREE from 'three'
import { canvasTexture, randomSource } from './duo/geometry'

export const wallpaperPresets = [
  { id: 'original', name: 'Original', preview: 'linear-gradient(155deg, #739cac, #e1cdb0, #4b493e)' },
  { id: 'ocean', name: 'Ocean', preview: 'linear-gradient(155deg, #092e56, #168eae, #6adad2)' },
  { id: 'aurora', name: 'Aurora', preview: 'linear-gradient(135deg, #10263e, #44d9ad, #7352c6, #10263e)' },
  { id: 'sunset', name: 'Sunset', preview: 'linear-gradient(160deg, #43245d, #ed817a, #ffc27d)' },
  { id: 'midnight', name: 'Midnight', preview: 'linear-gradient(150deg, #090d24, #344677, #111b32)' },
] as const
export type WallpaperId = typeof wallpaperPresets[number]['id']
type ArtworkId = Exclude<WallpaperId, 'original'>

const images = new Map<ArtworkId, HTMLCanvasElement>()
const urls = new Map<ArtworkId, string>()

function image(id: ArtworkId) {
  const cached = images.get(id)
  if (cached) return cached
  const texture = canvasTexture(1536, 1080, ctx => {
    const w = ctx.canvas.width
    const h = ctx.canvas.height
    const palettes = {
      ocean: ['#092e56', '#168eae', '#6adad2'],
      aurora: ['#071b30', '#183e53', '#10142e'],
      sunset: ['#43245d', '#ed817a', '#ffc27d'],
      midnight: ['#090d24', '#344677', '#111b32'],
    }
    const sky = ctx.createLinearGradient(0, 0, w * 0.3, h)
    palettes[id].forEach((color, index) => sky.addColorStop(index / 2, color))
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    const random = randomSource(419)
    if (id === 'midnight' || id === 'aurora') {
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle = `rgba(235,244,255,${0.2 + random() * 0.7})`
        const size = 1 + random() * 2
        ctx.fillRect(random() * w, random() * h * 0.75, size, size)
      }
    }
    if (id === 'sunset') {
      const sun = ctx.createRadialGradient(w * 0.55, h * 0.44, 0, w * 0.55, h * 0.44, h * 0.3)
      sun.addColorStop(0, '#ffecc0')
      sun.addColorStop(0.48, '#ffdaa2')
      sun.addColorStop(0.5, '#ffdaa260')
      sun.addColorStop(1, '#ffdaa200')
      ctx.fillStyle = sun
      ctx.fillRect(0, 0, w, h)
    }
    if (id === 'aurora') {
      for (let layer = 0; layer < 4; layer++) {
        const glow = ctx.createLinearGradient(0, 120 + layer * 100, 0, 650 + layer * 100)
        glow.addColorStop(0, '#44d9ad00')
        glow.addColorStop(0.55, layer % 2 ? '#976ef09a' : '#44d9adba')
        glow.addColorStop(1, '#44d9ad00')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.moveTo(-100, 280 + layer * 100)
        ctx.bezierCurveTo(400, -200, 750, 820, w + 100, 180 + layer * 110)
        ctx.lineTo(w + 100, 560 + layer * 100)
        ctx.bezierCurveTo(750, 1100, 400, 150, -100, 660 + layer * 100)
        ctx.fill()
      }
    } else {
      for (let layer = 0; layer < 6; layer++) {
        ctx.fillStyle = id === 'ocean' ? `hsla(${185 + layer * 4}, 65%, ${48 - layer * 5}%, 0.65)` :
          id === 'sunset' ? `hsla(${275 + layer * 5}, 32%, ${39 - layer * 4}%, 0.7)` : `rgba(8,17,39,${0.25 + layer * 0.1})`
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w; x += 8) {
          ctx.lineTo(x, h * 0.57 + layer * 72 + Math.sin(x / 240 + layer * 0.9) * 75 + Math.sin(x / 550 + layer) * 50)
        }
        ctx.lineTo(w, h)
        ctx.fill()
      }
    }
  })
  const canvas = texture.image as HTMLCanvasElement
  images.set(id, canvas)
  texture.dispose()
  return canvas
}

export function drawLockScreen(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f0f2ed'
  ctx.textAlign = 'center'
  ctx.font = '300 96px system-ui, sans-serif'
  ctx.fillText('9:41', 768, 223)
  ctx.font = '24px system-ui, sans-serif'
  ctx.fillText('Wednesday, September 9', 768, 273)
  ctx.fillStyle = 'rgba(240,245,248,0.8)'
  ctx.beginPath()
  ctx.roundRect(627, 1045, 282, 7, 4)
  ctx.fill()
}

export function createWallpaperTexture(id: ArtworkId, lockScreen = false) {
  if (lockScreen) {
    return canvasTexture(1536, 1080, ctx => {
      ctx.drawImage(image(id), 0, 0)
      drawLockScreen(ctx)
    })
  }
  const texture = new THREE.CanvasTexture(image(id))
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function wallpaperImage(id: ArtworkId) {
  let url = urls.get(id)
  if (!url) { url = image(id).toDataURL(); urls.set(id, url) }
  return url
}

export function createWallpaperLibrary(lockScreen = false) {
  const textures = new Map<ArtworkId, THREE.Texture>()
  return (id: WallpaperId) => {
    if (id === 'original') return null
    let texture = textures.get(id)
    if (!texture) { texture = createWallpaperTexture(id, lockScreen); textures.set(id, texture) }
    return texture
  }
}
