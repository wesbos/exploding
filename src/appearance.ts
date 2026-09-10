import { wallpaperPresets, type WallpaperId } from './wallpapers'
import './appearance.css'

export function setupAppearance(options: {
  color: string
  onColor: (color: string) => void
  onWallpaper: (wallpaper: WallpaperId) => void
}) {
  const host = document.querySelector<HTMLElement>('#appearance')!
  host.innerHTML = `
    <details class="appearance" open>
      <summary>Appearance</summary>
      <label class="appearance-color">Body color <input type="color" aria-label="Custom iPhone body color" value="${options.color}" /></label>
      <p class="appearance-label">SCREEN WALLPAPER</p>
      <div class="wallpaper-options" role="group" aria-label="Screen wallpaper"></div>
    </details>
  `
  const colorInput = host.querySelector<HTMLInputElement>('input')!
  colorInput.addEventListener('input', () => options.onColor(colorInput.value))
  const wallpapers = host.querySelector<HTMLElement>('.wallpaper-options')!
  for (const preset of wallpaperPresets) {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.wallpaper = preset.id
    button.setAttribute('aria-pressed', String(preset.id === 'original'))
    const preview = document.createElement('span')
    preview.style.background = preset.preview
    preview.setAttribute('aria-hidden', 'true')
    button.append(preview, preset.name)
    button.addEventListener('click', () => {
      options.onWallpaper(preset.id)
      wallpapers.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)))
    })
    wallpapers.append(button)
  }
  return { setColor(value: string) { colorInput.value = value } }
}
