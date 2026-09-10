import './media-capture.css'

import type { PhoneApp } from './types'

type CameraMode = 'photo' | 'portrait' | 'night' | 'macro'
type FlashMode = 'off' | 'auto' | 'on'
type Facing = 'rear' | 'front'

interface CameraState {
  mode: CameraMode
  flash: FlashMode
  facing: Facing
}

interface MediaPhoto {
  id: string
  title: string
  createdAt: number
  mode: CameraMode
  flash: FlashMode
  facing: Facing
  favorite: boolean
  seed: number
  dataUrl?: string
}

interface MediaCaptureState {
  camera: CameraState
  photos: MediaPhoto[]
  selectedIds: string[]
  detailId: string | null
}

const storageKey = 'duo-media-capture'

const cameraModes: Array<{
  id: CameraMode
  label: string
  hint: string
}> = [
  { id: 'photo', label: 'Photo', hint: 'Balanced everyday capture' },
  { id: 'portrait', label: 'Portrait', hint: 'Soft subject separation' },
  { id: 'night', label: 'Night', hint: 'Brightened low light' },
  { id: 'macro', label: 'Macro', hint: 'Close detail and texture' },
]

const modeBank: Record<CameraMode, { titlePool: string[]; palette: [string, string, string, string]; subtitle: string }> = {
  photo: {
    titlePool: ['Golden Hours', 'Open Road', 'Sunlit Street', 'Coastline Shift', 'Quiet Horizon', 'Window Light'],
    palette: ['#13304d', '#3f76aa', '#f3a66b', '#f5e7ca'],
    subtitle: 'balanced color and contrast',
  },
  portrait: {
    titlePool: ['Portrait Study', 'Soft Focus', 'After Light', 'Kind Eyes', 'Warm Skin', 'Studio Walk'],
    palette: ['#2a163f', '#7a4fb9', '#f3b0b6', '#fff1e1'],
    subtitle: 'gentle separation and tone',
  },
  night: {
    titlePool: ['Moonline', 'After Dark', 'Neon Alley', 'Late Street', 'City Drift', 'Star Trace'],
    palette: ['#08111f', '#233e6d', '#7f4ae6', '#6fe0ff'],
    subtitle: 'lifted shadows and glow',
  },
  macro: {
    titlePool: ['Tiny World', 'Leaf Vein', 'Petal Edge', 'Texture Study', 'Small Details', 'Close Up'],
    palette: ['#1c351d', '#558a53', '#c2d77b', '#f0ecd5'],
    subtitle: 'tight framing and crisp detail',
  },
}

const photoCountFormatter = new Intl.NumberFormat([], { maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const timeFormatter = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' })

function createRng(seed: number) {
  let value = (seed >>> 0) || 1
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function formatMode(mode: CameraMode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

function formatFlash(flash: FlashMode) {
  return flash === 'off' ? 'Flash Off' : flash === 'auto' ? 'Flash Auto' : 'Flash On'
}

function formatFacing(facing: Facing) {
  return facing === 'rear' ? 'Rear Camera' : 'Front Camera'
}

function makeTitle(mode: CameraMode, seed: number) {
  const bank = modeBank[mode].titlePool
  return bank[Math.abs(seed) % bank.length]
}

function createPhoto(mode: CameraMode, flash: FlashMode, facing: Facing, seed: number, createdAt = Date.now(), dataUrl?: string): MediaPhoto {
  return {
    id: crypto.randomUUID(),
    title: makeTitle(mode, seed),
    createdAt,
    mode,
    flash,
    facing,
    favorite: false,
    seed,
    dataUrl,
  }
}

function createStarterState(): MediaCaptureState {
  return {
    camera: { mode: 'photo', flash: 'auto', facing: 'rear' },
    photos: [],
    selectedIds: [],
    detailId: null,
  }
}

function isMediaCaptureState(value: unknown): value is MediaCaptureState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<MediaCaptureState>
  if (!candidate.camera || !candidate.photos || !Array.isArray(candidate.photos)) return false
  if (candidate.detailId !== null && typeof candidate.detailId !== 'string') return false
  if (!Array.isArray(candidate.selectedIds)) return false
  if (!cameraModes.some(mode => mode.id === candidate.camera?.mode)) return false
  if (!['off', 'auto', 'on'].includes(candidate.camera.flash)) return false
  if (!['rear', 'front'].includes(candidate.camera.facing)) return false
  return candidate.photos.every(photo => (
    typeof photo === 'object'
    && photo !== null
    && typeof photo.id === 'string'
    && typeof photo.title === 'string'
    && typeof photo.createdAt === 'number'
    && cameraModes.some(mode => mode.id === photo.mode)
    && ['off', 'auto', 'on'].includes(photo.flash)
    && ['rear', 'front'].includes(photo.facing)
    && typeof photo.favorite === 'boolean'
    && typeof photo.seed === 'number'
    && (photo.dataUrl === undefined || typeof photo.dataUrl === 'string')
  ))
}

function readState(): MediaCaptureState {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return createStarterState()
    const parsed: unknown = JSON.parse(saved)
    if (!isMediaCaptureState(parsed)) return createStarterState()
    return normalizeState(parsed)
  } catch {
    return createStarterState()
  }
}

function normalizeState(state: MediaCaptureState) {
  if (!cameraModes.some(mode => mode.id === state.camera.mode)) state.camera.mode = 'photo'
  state.camera.facing = state.camera.facing === 'front' ? 'front' : 'rear'
  state.camera.flash = state.camera.flash === 'on' ? 'on' : 'off'
  const ids = new Set(state.photos.map(photo => photo.id))
  state.selectedIds = state.selectedIds.filter(id => ids.has(id))
  if (!state.photos.length) {
    state.selectedIds = []
    state.detailId = null
    return state
  }
  if (state.detailId && ids.has(state.detailId)) return state
  const fallback = state.selectedIds[0] ?? state.photos[0].id
  state.detailId = fallback
  if (!state.selectedIds.length) state.selectedIds = [fallback]
  return state
}

let state = readState()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // Persisting is best-effort; the in-memory gallery remains functional.
  }
}

function notify() {
  persist()
  for (const listener of listeners) listener()
}

function update(mutator: (draft: MediaCaptureState) => void) {
  mutator(state)
  normalizeState(state)
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function summarizeSelection() {
  return state.selectedIds.length
    ? `${photoCountFormatter.format(state.selectedIds.length)} selected`
    : `${photoCountFormatter.format(state.photos.length)} photos`
}

function getPhoto(id: string | null) {
  return id ? state.photos.find(photo => photo.id === id) ?? null : null
}

function toggleSelection(id: string) {
  update(draft => {
    const next = new Set(draft.selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    draft.selectedIds = [...next]
    draft.detailId = id
  })
}

function selectOnly(id: string) {
  update(draft => {
    draft.selectedIds = [id]
    draft.detailId = id
  })
}

function toggleFavorite(id: string) {
  update(draft => {
    const photo = draft.photos.find(item => item.id === id)
    if (photo) photo.favorite = !photo.favorite
  })
}

function deletePhotos(ids: string[]) {
  if (!ids.length) return
  update(draft => {
    const removal = new Set(ids)
    draft.photos = draft.photos.filter(photo => !removal.has(photo.id))
    draft.selectedIds = draft.selectedIds.filter(id => !removal.has(id))
    if (draft.detailId && removal.has(draft.detailId)) draft.detailId = null
    if (!draft.photos.length) {
      draft.selectedIds = []
      draft.detailId = null
      return
    }
    const next = draft.photos[0].id
    if (!draft.detailId) draft.detailId = draft.selectedIds[0] ?? next
    if (!draft.selectedIds.length) draft.selectedIds = [draft.detailId ?? next]
  })
}

function selectAllPhotos() {
  update(draft => {
    draft.selectedIds = draft.photos.map(photo => photo.id)
    draft.detailId = draft.selectedIds[0] ?? draft.detailId
  })
}

function clearSelection() {
  update(draft => {
    draft.selectedIds = []
  })
}

function createSnapshotSvg(
  photo: Pick<MediaPhoto, 'mode' | 'flash' | 'facing' | 'seed' | 'title' | 'createdAt'>,
  variant: 'live' | 'gallery' = 'gallery',
) {
  const theme = modeBank[photo.mode]
  const rng = createRng(photo.seed + (variant === 'live' ? 917 : 0))
  const [c1, c2, c3, c4] = theme.palette
  const flashBoost = photo.flash === 'on' || (photo.flash === 'auto' && photo.mode !== 'macro')
  const frontMirror = photo.facing === 'front'
  const label = variant === 'live' ? 'LIVE VIEW' : photo.title
  const timeLabel = variant === 'live'
    ? `${formatMode(photo.mode)} • ${formatFacing(photo.facing)}`
    : `${dateFormatter.format(photo.createdAt)} • ${formatFlash(photo.flash)}`

  const starFields = Array.from({ length: 14 }, (_, index) => {
    const x = 60 + rng() * 840
    const y = 60 + rng() * 380
    const size = 2 + rng() * 4 + (index % 3)
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${size.toFixed(2)}" fill="#fff" opacity="${0.4 + rng() * 0.5}" />`
  }).join('')

  const bubbleFields = Array.from({ length: 9 }, () => {
    const x = 70 + rng() * 800
    const y = 110 + rng() * 820
    const r = 26 + rng() * 88
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="#ffffff" opacity="${0.08 + rng() * 0.14}" />`
  }).join('')

  const petals = Array.from({ length: 5 }, (_, index) => {
    const angle = index * 72 + rng() * 24
    const radius = 220 + rng() * 180
    const x = 480 + Math.cos((angle * Math.PI) / 180) * radius
    const y = 640 + Math.sin((angle * Math.PI) / 180) * radius
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(120 + rng() * 100).toFixed(1)}" ry="${(50 + rng() * 35).toFixed(1)}" fill="${index % 2 ? c3 : c2}" opacity="${0.28 + rng() * 0.22}" transform="rotate(${angle.toFixed(2)} ${x.toFixed(1)} ${y.toFixed(1)})" />`
  }).join('')

  const mirrorTransform = frontMirror ? 'translate(960 0) scale(-1 1)' : ''
  const scene = (() => {
    switch (photo.mode) {
      case 'photo':
        return `
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${c1}" />
              <stop offset="58%" stop-color="${c2}" />
              <stop offset="100%" stop-color="#111827" />
            </linearGradient>
          </defs>
          <rect width="960" height="1280" fill="url(#sky)" />
          <circle cx="${(160 + rng() * 120).toFixed(1)}" cy="${(130 + rng() * 70).toFixed(1)}" r="124" fill="${c3}" opacity=".32" />
          <path d="M0,760 C110,700 210,720 320,680 C410,648 520,596 650,628 C760,656 840,720 960,690 L960,1280 L0,1280 Z" fill="${c4}" opacity=".92" />
          <path d="M0,820 C120,758 240,788 340,738 C440,690 542,646 680,682 C790,710 864,780 960,756 L960,1280 L0,1280 Z" fill="${c2}" opacity=".92" />
          <path d="M0,930 C152,866 320,930 430,900 C574,860 730,818 960,886 L960,1280 L0,1280 Z" fill="${c1}" opacity=".98" />
          <path d="M500,610 l110,58 l-38,170 l-112,-56 z" fill="${c3}" opacity=".34" />
          <path d="M-20,760 C140,710 274,740 390,692 C520,638 666,672 820,622 C888,599 934,580 980,570" fill="none" stroke="${c4}" stroke-width="10" stroke-linecap="round" opacity=".45" />
          <path d="M-10,1140 C140,1050 260,1048 390,1108 C510,1160 654,1180 960,1098" fill="none" stroke="#f9fbf7" stroke-width="18" stroke-linecap="round" opacity=".14" />
          <rect x="0" y="0" width="960" height="1280" fill="#fff" opacity="${flashBoost ? 0.12 : 0.03}" />
        `
      case 'portrait':
        return `
          <defs>
            <linearGradient id="porch" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="${c1}" />
              <stop offset="55%" stop-color="${c2}" />
              <stop offset="100%" stop-color="${c4}" />
            </linearGradient>
            <radialGradient id="halo" cx="50%" cy="42%" r="55%">
              <stop offset="0%" stop-color="${c4}" stop-opacity=".94" />
              <stop offset="70%" stop-color="${c3}" stop-opacity=".14" />
              <stop offset="100%" stop-color="#000" stop-opacity="0" />
            </radialGradient>
          </defs>
          <rect width="960" height="1280" fill="url(#porch)" />
          <ellipse cx="480" cy="540" rx="360" ry="500" fill="url(#halo)" />
          ${bubbleFields}
          <g transform="${mirrorTransform}">
            <ellipse cx="480" cy="630" rx="160" ry="198" fill="${c4}" opacity=".92" />
            <circle cx="480" cy="498" r="112" fill="${c4}" opacity=".93" />
            <path d="M320,732 C348,640 380,604 480,604 C580,604 612,640 640,732 C632,830 560,874 480,874 C400,874 328,830 320,732 Z" fill="${c4}" opacity=".92" />
            <path d="M370,502 C410,456 452,440 480,440 C508,440 550,458 590,502" fill="none" stroke="${c3}" stroke-width="26" stroke-linecap="round" opacity=".4" />
            <circle cx="428" cy="503" r="12" fill="${c1}" opacity=".35" />
            <circle cx="532" cy="503" r="12" fill="${c1}" opacity=".35" />
            <path d="M424,548 C450,576 510,576 536,548" fill="none" stroke="${c1}" stroke-width="16" stroke-linecap="round" opacity=".36" />
          </g>
          <rect x="114" y="910" width="732" height="132" rx="66" fill="${c3}" opacity=".2" />
          <rect x="214" y="984" width="532" height="76" rx="38" fill="${c2}" opacity=".18" />
          <rect x="0" y="0" width="960" height="1280" fill="#fff" opacity="${flashBoost ? 0.15 : 0.04}" />
        `
      case 'night':
        return `
          <defs>
            <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${c1}" />
              <stop offset="65%" stop-color="${c2}" />
              <stop offset="100%" stop-color="#04070d" />
            </linearGradient>
            <radialGradient id="moon" cx="50%" cy="38%" r="24%">
              <stop offset="0%" stop-color="${c4}" stop-opacity=".95" />
              <stop offset="100%" stop-color="${c4}" stop-opacity="0" />
            </radialGradient>
          </defs>
          <rect width="960" height="1280" fill="url(#night)" />
          <rect x="0" y="900" width="960" height="380" fill="#030408" opacity=".88" />
          ${starFields}
          <circle cx="728" cy="236" r="146" fill="url(#moon)" />
          <circle cx="730" cy="236" r="64" fill="${c4}" opacity=".92" />
          <path d="M0,1010 C200,940 360,972 480,920 C620,860 744,900 960,820 L960,1280 L0,1280 Z" fill="${c1}" opacity=".88" />
          <path d="M0,1082 C180,1022 342,1066 470,1020 C606,972 748,1008 960,938 L960,1280 L0,1280 Z" fill="${c2}" opacity=".82" />
          <rect x="180" y="790" width="600" height="88" rx="44" fill="${c3}" opacity=".18" />
          <rect x="250" y="834" width="460" height="18" rx="9" fill="${c4}" opacity=".32" />
          <rect x="0" y="0" width="960" height="1280" fill="#fff" opacity="${flashBoost ? 0.12 : 0.02}" />
        `
      case 'macro':
        return `
          <defs>
            <linearGradient id="macro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="${c1}" />
              <stop offset="58%" stop-color="${c2}" />
              <stop offset="100%" stop-color="${c4}" />
            </linearGradient>
            <radialGradient id="dew" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff" stop-opacity=".95" />
              <stop offset="100%" stop-color="#fff" stop-opacity="0" />
            </radialGradient>
          </defs>
          <rect width="960" height="1280" fill="url(#macro)" />
          <path d="M-50,1220 C120,1060 252,936 430,906 C574,882 712,934 1000,1070 L1000,1280 L-50,1280 Z" fill="${c1}" opacity=".92" />
          ${petals}
          <g transform="${mirrorTransform}">
            <path d="M252,430 C318,268 476,206 618,250 C726,284 782,392 748,510 C720,606 648,724 526,802 C436,860 328,822 272,742 C194,626 174,516 252,430 Z" fill="${c3}" opacity=".55" />
            <path d="M310,456 C386,350 496,322 600,358 C680,386 724,476 700,558 C674,646 604,726 518,776 C438,824 354,790 322,724 C282,644 266,548 310,456 Z" fill="${c4}" opacity=".52" />
            <path d="M360,520 C408,456 480,430 540,448 C592,464 626,516 616,572 C602,644 548,708 494,742 C440,776 390,758 368,714 C338,658 334,588 360,520 Z" fill="${c2}" opacity=".48" />
          </g>
          ${Array.from({ length: 12 }, () => {
            const x = 110 + rng() * 740
            const y = 180 + rng() * 860
            const r = 8 + rng() * 24
            return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#dew)" opacity="${0.18 + rng() * 0.22}" />`
          }).join('')}
          <rect x="0" y="0" width="960" height="1280" fill="#fff" opacity="${flashBoost ? 0.13 : 0.03}" />
        `
    }
  })()

  const grain = `
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${photo.seed % 50}" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0 .05 .12"/>
      </feComponentTransfer>
    </filter>
  `

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1280" role="img" aria-label="${escapeXml(label)}">
      <defs>
        ${grain}
      </defs>
      ${scene}
      <rect width="960" height="1280" fill="#000" opacity=".08" />
      <rect width="960" height="1280" filter="url(#grain)" opacity=".34" />
      <rect x="54" y="56" width="852" height="1168" rx="68" fill="none" stroke="#ffffff" stroke-opacity=".2" stroke-width="6" />
      <rect x="82" y="86" width="796" height="1108" rx="48" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="2" />
      <g fill="#fff">
        <text x="86" y="138" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="42" font-weight="700" letter-spacing=".18em">${escapeXml(variant === 'live' ? 'LIVE' : formatMode(photo.mode).toUpperCase())}</text>
        <text x="86" y="188" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="26" font-weight="500" opacity=".8">${escapeXml(theme.subtitle)}</text>
        <text x="86" y="1160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="28" font-weight="600">${escapeXml(timeLabel)}</text>
        <text x="86" y="1200" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="22" opacity=".82">${escapeXml(label)}</text>
        <text x="874" y="1160" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="24" font-weight="600">${escapeXml(formatFacing(photo.facing))}</text>
        <text x="874" y="1200" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="20" opacity=".75">${escapeXml(photo.flash === 'off' ? 'No flash' : formatFlash(photo.flash))}</text>
      </g>
      <g fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="5" stroke-linecap="round">
        <path d="M122,236 h90" />
        <path d="M122,236 v90" />
        <path d="M838,236 h-90" />
        <path d="M838,236 v90" />
        <path d="M122,1044 h90" />
        <path d="M122,1044 v-90" />
        <path d="M838,1044 h-90" />
        <path d="M838,1044 v-90" />
      </g>
      <circle cx="480" cy="640" r="172" fill="none" stroke="#fff" stroke-opacity=".27" stroke-width="5" />
      <circle cx="480" cy="640" r="84" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3" />
      <circle cx="480" cy="640" r="14" fill="#fff" opacity=".6" />
      <rect x="386" y="622" width="188" height="36" rx="18" fill="#fff" opacity="${flashBoost ? 0.18 : 0.08}" />
    </svg>
  `
}

function legacySnapshotUri(photo: Pick<MediaPhoto, 'mode' | 'flash' | 'facing' | 'seed' | 'title' | 'createdAt'>, variant: 'live' | 'gallery' = 'gallery') {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createSnapshotSvg(photo, variant))}`
}

function photoUri(photo: MediaPhoto, variant: 'live' | 'gallery' = 'gallery') {
  return photo.dataUrl ?? legacySnapshotUri(photo, variant)
}

function cameraSymbol(name: 'camera' | 'flip' | 'flash' | 'heart' | 'check' | 'trash' | 'photos') {
  const shapes = {
    camera: '<path d="m8 5 2-3h4l2 3h5a1 1 0 0 1 1 1v14H2V6a1 1 0 0 1 1-1z"/><circle cx="12" cy="12" r="5"/>',
    flip: '<path d="M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5"/>',
    flash: '<path d="m14 2-10 12h7l-1 8L21 9h-8z"/>',
    heart: '<path d="M12 21 3 12C-3 4 7-1 12 6c5-7 15-2 9 6z"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    photos: '<rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m3 18 6-5 4 3 4-6 5 7"/>',
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]}</svg>`
}

function renderCameraApp(left: HTMLElement, right: HTMLElement) {
  type AccessStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error'

  left.className = 'media-capture-screen media-capture-camera'
  left.setAttribute('aria-label', 'Camera viewfinder')
  left.innerHTML = `
    <div class="media-capture-camera-shell">
      <div class="media-capture-camera-header">
        <h2>${cameraSymbol('camera')}Camera</h2>
        <p class="media-capture-camera-count" aria-live="polite"></p>
      </div>
      <div class="media-capture-viewfinder" data-status="idle">
        <video class="media-capture-preview" autoplay muted playsinline aria-label="Live camera preview"></video>
        <div class="media-capture-viewfinder-overlay" aria-hidden="true">
          <div class="media-capture-grid"></div>
          <div class="media-capture-focus-ring"></div>
          <div class="media-capture-flash-overlay"></div>
        </div>
        <div class="media-capture-access-panel" role="alert" aria-live="assertive">
          <p class="media-capture-access-kicker"></p>
          <strong class="media-capture-access-title"></strong>
          <p class="media-capture-access-body"></p>
          <div class="media-capture-access-actions">
            <button class="media-capture-access-primary" type="button"></button>
          </div>
        </div>
      </div>
      <div class="media-capture-filmstrip" aria-label="Recent captures"></div>
    </div>
  `

  right.className = 'media-capture-screen media-capture-controls'
  right.setAttribute('aria-label', 'Camera controls')
  right.innerHTML = `
    <div class="media-capture-controls-shell">
      <div class="media-capture-controls-header">
        <h2>Camera</h2>
        <div class="media-capture-state-pill" aria-live="polite"></div>
      </div>
      <button class="media-capture-camera-toggle" type="button"></button>
      <p class="media-capture-hint">Space captures a real frame. F flips cameras. X toggles flash when supported.</p>
      <div class="media-capture-status" role="status" aria-live="polite"></div>
      <div class="media-capture-mode-group" role="group" aria-label="Camera mode"></div>
      <div class="media-capture-switch-row">
        <button class="media-capture-switch" type="button"></button>
        <button class="media-capture-shutter" type="button" aria-label="Shutter — take photo">
          <span class="media-capture-shutter-ring" aria-hidden="true"></span>
        </button>
        <button class="media-capture-switch" type="button"></button>
      </div>
    </div>
  `

  const video = left.querySelector<HTMLVideoElement>('.media-capture-preview')!
  const count = left.querySelector<HTMLElement>('.media-capture-camera-count')!
  const accessPanel = left.querySelector<HTMLElement>('.media-capture-access-panel')!
  const accessKicker = left.querySelector<HTMLElement>('.media-capture-access-kicker')!
  const accessTitle = left.querySelector<HTMLElement>('.media-capture-access-title')!
  const accessBody = left.querySelector<HTMLElement>('.media-capture-access-body')!
  const accessPrimary = left.querySelector<HTMLButtonElement>('.media-capture-access-primary')!
  const filmstrip = left.querySelector<HTMLElement>('.media-capture-filmstrip')!
  const viewfinder = left.querySelector<HTMLElement>('.media-capture-viewfinder')!
  const flashOverlay = left.querySelector<HTMLElement>('.media-capture-flash-overlay')!
  const statePill = right.querySelector<HTMLElement>('.media-capture-state-pill')!
  const cameraToggle = right.querySelector<HTMLButtonElement>('.media-capture-camera-toggle')!
  const modeGroup = right.querySelector<HTMLElement>('.media-capture-mode-group')!
  const facingButton = right.querySelectorAll<HTMLButtonElement>('.media-capture-switch')[0]
  const flashButton = right.querySelectorAll<HTMLButtonElement>('.media-capture-switch')[1]
  const shutter = right.querySelector<HTMLButtonElement>('.media-capture-shutter')!
  const status = right.querySelector<HTMLElement>('.media-capture-status')!

  let stream: MediaStream | null = null
  let torchSupported = false
  let accessStatus: AccessStatus = 'idle'
  let statusTitle = 'Camera paused'
  let statusBody = 'Camera is stopped until you start it.'
  let userPaused = false
  let requestVersion = 0
  let frameVersion = 0
  let rafHandle: number | null = null

  function dispatchPaintSignal() {
    left.dispatchEvent(new CustomEvent('phone-request-paint', { bubbles: true, composed: true }))
  }

  function stopFrameLoop() {
    frameVersion += 1
    if (rafHandle !== null) {
      window.cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
  }

  function stopStream() {
    stopFrameLoop()
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
      stream = null
    }
    video.pause()
    video.srcObject = null
    torchSupported = false
  }

  function setStatus(nextStatus: AccessStatus, title: string, body: string) {
    accessStatus = nextStatus
    statusTitle = title
    statusBody = body
    render()
  }

  function classifyError(error: unknown): { status: AccessStatus; title: string; body: string } {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return {
          status: 'denied',
          title: 'Camera access denied',
          body: 'Allow camera permissions in your browser, then try again.',
        }
      }
      if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        return {
          status: 'unsupported',
          title: 'No usable camera found',
          body: 'This device could not provide the requested front or rear camera.',
        }
      }
      if (error.name === 'NotReadableError' || error.name === 'AbortError') {
        return {
          status: 'error',
          title: 'Camera busy',
          body: 'Another app or system feature may already be using the camera.',
        }
      }
    }
    return {
      status: 'error',
      title: 'Camera unavailable',
      body: error instanceof Error ? error.message : 'The camera could not be started.',
    }
  }

  function supportsTorch(track: MediaStreamTrack) {
    const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined
    return Boolean(capabilities?.torch)
  }

  async function applyTorch(track: MediaStreamTrack, enabled: boolean) {
    if (!supportsTorch(track)) return false
    try {
      await track.applyConstraints({ advanced: [{ torch: enabled } as MediaTrackConstraintSet] })
      return true
    } catch {
      return false
    }
  }

  function startFrameLoop() {
    const currentVersion = ++frameVersion
    const videoWithFrames = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: (now: number, metadata: unknown) => void) => number
    }
    if (typeof videoWithFrames.requestVideoFrameCallback === 'function') {
      const onFrame = () => {
        if (currentVersion !== frameVersion || !stream || accessStatus !== 'active') return
        dispatchPaintSignal()
        videoWithFrames.requestVideoFrameCallback(onFrame)
      }
      videoWithFrames.requestVideoFrameCallback(onFrame)
      return
    }
    let lastPaint = 0
    const tick = (time: number) => {
      if (currentVersion !== frameVersion || !stream || accessStatus !== 'active') return
      if (time - lastPaint >= 33) {
        lastPaint = time
        dispatchPaintSignal()
      }
      rafHandle = window.requestAnimationFrame(tick)
    }
    rafHandle = window.requestAnimationFrame(tick)
  }

  async function startCamera(reason: 'initial' | 'manual' | 'switch' | 'resume') {
    const version = ++requestVersion
    userPaused = false
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      stopStream()
      setStatus('unsupported', 'Camera unavailable', 'Real camera access is not available in this browser or context.')
      return
    }

    if (stream) stopStream()
    setStatus(
      'requesting',
      reason === 'switch' ? 'Reacquiring camera' : 'Requesting camera access',
      reason === 'switch'
        ? 'Switching to the other lens. Please allow the browser to reopen the camera.'
        : 'Approve camera access to see the live feed.',
    )

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: state.camera.facing === 'rear' ? 'environment' : 'user' },
        },
        audio: false,
      }
      const nextStream = await navigator.mediaDevices.getUserMedia(constraints)
      if (version !== requestVersion) {
        for (const track of nextStream.getTracks()) track.stop()
        return
      }

      stream = nextStream
      video.srcObject = nextStream
      video.muted = true
      video.autoplay = true
      video.playsInline = true
      await video.play()
      await new Promise<void>(resolve => {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0) {
          resolve()
          return
        }
        video.addEventListener('loadedmetadata', () => resolve(), { once: true })
      })
      if (version !== requestVersion) {
        stopStream()
        return
      }

      const track = nextStream.getVideoTracks()[0]
      torchSupported = Boolean(track && state.camera.facing === 'rear' && supportsTorch(track))
      if (!torchSupported && state.camera.flash !== 'off') {
        update(draft => {
          draft.camera.flash = 'off'
        })
      } else if (torchSupported && state.camera.flash === 'on') {
        if (!(await applyTorch(track, true))) {
          torchSupported = false
          update(draft => {
            draft.camera.flash = 'off'
          })
        }
      } else if (torchSupported) {
        await applyTorch(track, false)
      }

      if (version !== requestVersion) {
        stopStream()
        return
      }

      accessStatus = 'active'
      statusTitle = 'Camera live'
      statusBody = `${formatFacing(state.camera.facing)} · ${torchSupported ? (state.camera.flash === 'on' ? 'Flash on' : 'Flash off') : 'Flash unavailable'}`
      startFrameLoop()
      render()
    } catch (error) {
      if (version !== requestVersion) return
      stopStream()
      const failure = classifyError(error)
      accessStatus = failure.status
      statusTitle = failure.title
      statusBody = failure.body
      render()
    }
  }

  function stopCamera(manual = false, body = manual ? 'Camera stopped. Tap Start camera to resume.' : 'Camera paused while this app is inactive.') {
    requestVersion += 1
    stopStream()
    accessStatus = 'idle'
    statusTitle = manual ? 'Camera stopped' : 'Camera paused'
    statusBody = body
    if (manual) userPaused = true
    render()
  }

  function cameraActionLabel() {
    if (accessStatus === 'active') return 'Stop camera'
    if (accessStatus === 'requesting') return 'Starting…'
    if (accessStatus === 'denied' || accessStatus === 'error') return 'Retry camera'
    if (accessStatus === 'unsupported') return 'Camera unavailable'
    return userPaused ? 'Start camera' : 'Start camera'
  }

  function cameraActionDisabled() {
    return accessStatus === 'requesting' || accessStatus === 'unsupported'
  }

  async function toggleFlash() {
    if (!stream || !torchSupported) return
    const nextFlash = state.camera.flash === 'on' ? 'off' : 'on'
    update(draft => {
      draft.camera.flash = nextFlash
    })
    const track = stream.getVideoTracks()[0]
    if (!(await applyTorch(track, nextFlash === 'on'))) {
      torchSupported = false
      update(draft => {
        draft.camera.flash = 'off'
      })
    } else {
      statusBody = `${formatFacing(state.camera.facing)} · ${nextFlash === 'on' ? 'Flash on' : 'Flash off'}`
      render()
    }
  }

  function toggleFacing(nextFacing: Facing) {
    if (state.camera.facing === nextFacing) return
    update(draft => {
      draft.camera.facing = nextFacing
    })
    if (!left.isConnected || document.visibilityState !== 'visible' || userPaused) {
      render()
      return
    }
    void startCamera('switch')
  }

  function captureFrame() {
    if (accessStatus !== 'active' || !stream || video.videoWidth === 0 || video.videoHeight === 0) {
      statusBody = 'Camera is not ready yet.'
      render()
      return
    }
    const canvas = document.createElement('canvas')
    const width = video.videoWidth
    const height = video.videoHeight
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      statusBody = 'Capture is unavailable in this browser.'
      render()
      return
    }
    if (state.camera.facing === 'front') {
      context.translate(width, 0)
      context.scale(-1, 1)
    }
    context.imageSmoothingQuality = 'high'
    context.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    const seed = Date.now() ^ Math.round(width * 13 + height * 17)
    const photo = createPhoto(state.camera.mode, state.camera.flash, state.camera.facing, seed, Date.now(), dataUrl)
    update(draft => {
      draft.photos = [photo, ...draft.photos]
      draft.selectedIds = [photo.id]
      draft.detailId = photo.id
    })
    flashOverlay.dataset.flash = 'on'
    video.classList.add('is-flashing')
    window.setTimeout(() => {
      video.classList.remove('is-flashing')
      flashOverlay.dataset.flash = torchSupported && state.camera.flash === 'on' ? 'on' : 'off'
      render()
    }, 180)
    statusBody = `Captured ${photo.title}.`
    render()
  }

  function syncLifecycle() {
    const mounted = left.isConnected && right.isConnected
    const visible = document.visibilityState === 'visible'
    if (!mounted || !visible) {
      if (stream || accessStatus === 'requesting' || accessStatus === 'active') {
        stopCamera(false, mounted ? 'Camera paused while this app is hidden.' : 'Camera paused while the app is closed.')
      }
      return
    }
    if (!userPaused && accessStatus !== 'active' && accessStatus !== 'requesting' && accessStatus !== 'unsupported' && accessStatus !== 'denied' && accessStatus !== 'error') {
      void startCamera('resume')
    }
  }

  function render() {
    const photosCount = state.photos.length
    count.textContent = `${photoCountFormatter.format(photosCount)} ${photosCount === 1 ? 'photo' : 'photos'}`
    statePill.textContent = accessStatus === 'active'
      ? `${formatFacing(state.camera.facing)} · ${torchSupported ? (state.camera.flash === 'on' ? 'Flash on' : 'Flash off') : 'Flash unavailable'}`
      : accessStatus === 'requesting'
        ? 'Requesting access'
        : statusTitle

    viewfinder.dataset.status = accessStatus
    video.hidden = accessStatus !== 'active'
    flashOverlay.dataset.flash = accessStatus === 'active' && torchSupported && state.camera.flash === 'on' ? 'on' : 'off'

    accessPanel.hidden = accessStatus === 'active'
    accessPanel.setAttribute('aria-hidden', String(accessStatus === 'active'))
    accessPanel.dataset.status = accessStatus
    accessKicker.textContent = accessStatus === 'requesting' ? 'Permission' : accessStatus === 'active' ? 'Live' : 'Camera'
    accessTitle.textContent = accessStatus === 'requesting' ? 'Waiting for permission…' : statusTitle
    accessBody.textContent = statusBody
    accessPrimary.textContent = cameraActionLabel()
    accessPrimary.disabled = cameraActionDisabled()

    cameraToggle.textContent = cameraActionLabel()
    cameraToggle.disabled = cameraActionDisabled()

    for (const mode of cameraModes) {
      let button = modeGroup.querySelector<HTMLButtonElement>(`button[data-mode="${mode.id}"]`)
      if (!button) {
        button = document.createElement('button')
        button.type = 'button'
        button.className = 'media-capture-mode'
        button.dataset.mode = mode.id
        button.innerHTML = `<strong>${mode.label}</strong>`
        button.title = mode.hint
        button.addEventListener('click', () => update(draft => {
          draft.camera.mode = mode.id
        }))
        modeGroup.append(button)
      }
      button.setAttribute('aria-pressed', String(mode.id === state.camera.mode))
    }

    facingButton.innerHTML = `${cameraSymbol('flip')}<span>${state.camera.facing === 'rear' ? 'Rear' : 'Front'}</span>`
    facingButton.setAttribute('aria-label', state.camera.facing === 'rear' ? 'Switch to front camera' : 'Switch to rear camera')
    facingButton.onclick = () => toggleFacing(state.camera.facing === 'rear' ? 'front' : 'rear')

    flashButton.innerHTML = `${cameraSymbol('flash')}<span>${torchSupported ? (state.camera.flash === 'on' ? 'On' : 'Off') : 'Unavailable'}</span>`
    flashButton.setAttribute('aria-label', torchSupported ? 'Toggle flash' : 'Flash is not supported on this camera')
    flashButton.setAttribute('aria-pressed', String(torchSupported && state.camera.flash === 'on'))
    flashButton.disabled = accessStatus !== 'active' || !torchSupported
    flashButton.onclick = () => {
      void toggleFlash()
    }

    shutter.disabled = accessStatus !== 'active' || video.videoWidth === 0 || video.videoHeight === 0
    shutter.onclick = () => captureFrame()

    status.textContent = accessStatus === 'active'
      ? `${statusBody}. Tap Shutter to capture a real photo.`
      : statusBody

    filmstrip.replaceChildren()
    if (!state.photos.length) {
      const empty = document.createElement('p')
      empty.className = 'media-capture-empty-strip'
      empty.textContent = 'Captured photos will appear here.'
      filmstrip.append(empty)
    } else {
      for (const photo of state.photos.slice(0, 4)) {
        const item = document.createElement('button')
        item.type = 'button'
        item.className = 'media-capture-thumb'
        item.setAttribute('aria-label', `Open ${photo.title} in Photos`)
        item.innerHTML = `
          <img alt="" />
          <span>${timeFormatter.format(new Date(photo.createdAt))}</span>
        `
        const image = item.querySelector('img')!
        image.src = photoUri(photo)
        image.alt = photo.title
        item.addEventListener('click', () => {
          selectOnly(photo.id)
          statusBody = `Opened ${photo.title} in Photos.`
          render()
        })
        filmstrip.append(item)
      }
    }
  }

  const unsubscribe = subscribe(render)
  const bodyObserverTarget = document.body ?? document.documentElement
  const cameraObserver = new MutationObserver(() => syncLifecycle())
  cameraObserver.observe(bodyObserverTarget, { childList: true, subtree: true })
  document.addEventListener('visibilitychange', syncLifecycle)
  window.addEventListener('pagehide', () => stopCamera(false, 'Camera paused while the page is hidden.'))

  accessPrimary.addEventListener('click', () => {
    if (accessStatus === 'active') {
      stopCamera(true)
      return
    }
    void startCamera(accessStatus === 'requesting' ? 'resume' : 'manual')
  })
  cameraToggle.addEventListener('click', () => {
    if (accessStatus === 'active') {
      stopCamera(true)
      return
    }
    void startCamera(accessStatus === 'requesting' ? 'resume' : 'manual')
  })
  video.addEventListener('loadedmetadata', render)
  video.addEventListener('playing', render)

  queueMicrotask(syncLifecycle)
  render()

  return {
    left,
    right,
    onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return false
      if (event.key === ' ' || event.key === 'Enter') {
        shutter.click()
        return true
      }
      if (event.key === 'f' || event.key === 'F') {
        facingButton.click()
        return true
      }
      if (event.key === 'x' || event.key === 'X') {
        flashButton.click()
        return true
      }
      const keyedMode = event.key === '1' ? 'photo' : event.key === '2' ? 'portrait' : event.key === '3' ? 'night' : event.key === '4' ? 'macro' : null
      if (keyedMode) {
        update(draft => {
          draft.camera.mode = keyedMode
        })
        return true
      }
      return false
    },
    dispose() {
      unsubscribe()
      cameraObserver.disconnect()
      window.removeEventListener('visibilitychange', syncLifecycle)
    },
  }
}

function renderPhotosApp(left: HTMLElement, right: HTMLElement) {
  left.className = 'media-capture-screen media-capture-gallery-shell'
  left.setAttribute('aria-label', 'Photo gallery')
  left.innerHTML = `
    <div class="media-capture-gallery">
      <div class="media-capture-gallery-header">
        <div>
          <h2>Library</h2>
          <p class="media-capture-library-label">Photos</p>
        </div>
        <p class="media-capture-selection" aria-live="polite"></p>
      </div>
      <div class="media-capture-gallery-actions">
        <button type="button" class="media-capture-action">Select all</button>
        <button type="button" class="media-capture-action">Clear</button>
        <button type="button" class="media-capture-action media-capture-action-destructive">Delete selected</button>
      </div>
      <div class="media-capture-gallery-grid" role="list" aria-label="Photos"></div>
      <footer class="media-capture-library-footer">${cameraSymbol('photos')}<span>Library</span></footer>
    </div>
  `

  right.className = 'media-capture-screen media-capture-detail-shell'
  right.setAttribute('aria-label', 'Photo detail')
  right.innerHTML = `
    <div class="media-capture-detail">
      <div class="media-capture-detail-header">
        <div>
          <h2>Photo</h2>
        </div>
        <button type="button" class="media-capture-action media-capture-favorite"></button>
      </div>
      <div class="media-capture-detail-hero">
        <img alt="" />
      </div>
      <div class="media-capture-detail-meta"></div>
      <div class="media-capture-detail-actions">
        <button type="button" class="media-capture-action media-capture-select"></button>
        <button type="button" class="media-capture-action media-capture-delete media-capture-action-destructive"></button>
      </div>
      <p class="media-capture-detail-caption"></p>
    </div>
  `

  const selection = left.querySelector<HTMLElement>('.media-capture-selection')!
  const grid = left.querySelector<HTMLElement>('.media-capture-gallery-grid')!
  const selectAll = left.querySelectorAll<HTMLButtonElement>('.media-capture-action')[0]
  const clear = left.querySelectorAll<HTMLButtonElement>('.media-capture-action')[1]
  const deleteSelected = left.querySelectorAll<HTMLButtonElement>('.media-capture-action')[2]
  const hero = right.querySelector<HTMLImageElement>('.media-capture-detail-hero img')!
  const meta = right.querySelector<HTMLElement>('.media-capture-detail-meta')!
  const caption = right.querySelector<HTMLElement>('.media-capture-detail-caption')!
  const favorite = right.querySelector<HTMLButtonElement>('.media-capture-favorite')!
  const select = right.querySelector<HTMLButtonElement>('.media-capture-select')!
  const remove = right.querySelector<HTMLButtonElement>('.media-capture-delete')!

  function renderCard(photo: MediaPhoto) {
    const selected = state.selectedIds.includes(photo.id)
    const card = document.createElement('article')
    card.className = `media-capture-card${selected ? ' is-selected' : ''}${photo.favorite ? ' is-favorite' : ''}`
    card.setAttribute('role', 'listitem')
    card.innerHTML = `
      <button type="button" class="media-capture-card-main" aria-label="Open ${photo.title}">
        <img alt="" />
      </button>
      <div class="media-capture-card-actions">
        <button type="button" class="media-capture-icon" aria-label="${selected ? 'Unselect' : 'Select'} photo" aria-pressed="${String(selected)}">${cameraSymbol('check')}</button>
        <button type="button" class="media-capture-icon" aria-label="${photo.favorite ? 'Remove from favorites' : 'Add to favorites'}" aria-pressed="${String(photo.favorite)}">${cameraSymbol('heart')}</button>
      </div>
    `
    const image = card.querySelector('img')!
    image.src = photoUri(photo)
    image.alt = photo.title
    card.querySelector<HTMLButtonElement>('.media-capture-card-main')!.title = `${photo.title} · ${dateFormatter.format(photo.createdAt)}`

    const [openButton, actionButtons] = [card.querySelector<HTMLButtonElement>('.media-capture-card-main')!, [...card.querySelectorAll<HTMLButtonElement>('.media-capture-icon')]]
    openButton.addEventListener('click', () => selectOnly(photo.id))
    actionButtons[0].addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation()
      toggleSelection(photo.id)
    })
    actionButtons[1].addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation()
      toggleFavorite(photo.id)
    })
    return card
  }

  function render() {
    selection.textContent = summarizeSelection()
    selectAll.textContent = `Select all (${photoCountFormatter.format(state.photos.length)})`
    clear.textContent = 'Clear'
    deleteSelected.textContent = state.selectedIds.length ? `Delete selected (${photoCountFormatter.format(state.selectedIds.length)})` : 'Delete selected'
    grid.replaceChildren()
    if (!state.photos.length) {
      grid.innerHTML = `<div class="media-capture-empty-state">${cameraSymbol('photos')}<strong>No Photos</strong><span>Open Camera and tap Shutter to build your gallery.</span></div>`
    } else {
      for (const photo of state.photos) grid.append(renderCard(photo))
    }

    const detailPhoto = getPhoto(state.detailId) ?? state.photos[0] ?? null
    const hasDetail = Boolean(detailPhoto)
    right.querySelector('h2')!.textContent = detailPhoto ? dateFormatter.format(detailPhoto.createdAt) : 'Photo'
    right.classList.toggle('is-empty', !hasDetail)
    if (!detailPhoto) {
      hero.removeAttribute('src')
      hero.alt = ''
      meta.replaceChildren()
      caption.textContent = 'Captured photos will appear here.'
      favorite.disabled = true
      select.disabled = true
      remove.disabled = true
      favorite.innerHTML = cameraSymbol('heart')
      favorite.setAttribute('aria-label', 'Favorite photo')
      select.textContent = 'Select'
      remove.textContent = 'Delete'
      return
    }

    hero.src = photoUri(detailPhoto)
    hero.alt = detailPhoto.title
    favorite.disabled = false
    select.disabled = false
    remove.disabled = false
    favorite.innerHTML = cameraSymbol('heart')
    favorite.setAttribute('aria-label', detailPhoto.favorite ? 'Remove from favorites' : 'Favorite photo')
    favorite.setAttribute('aria-pressed', String(detailPhoto.favorite))
    select.textContent = state.selectedIds.includes(detailPhoto.id) ? 'Unselect' : 'Select'
    select.setAttribute('aria-pressed', String(state.selectedIds.includes(detailPhoto.id)))
    remove.textContent = state.selectedIds.includes(detailPhoto.id) ? 'Delete selected' : 'Delete photo'
    meta.replaceChildren()
    for (const [label, value] of [
      ['Mode', formatMode(detailPhoto.mode)],
      ['Flash', formatFlash(detailPhoto.flash)],
      ['Camera', formatFacing(detailPhoto.facing)],
      ['Taken', dateFormatter.format(detailPhoto.createdAt)],
    ]) {
      const chip = document.createElement('span')
      chip.className = 'media-capture-chip'
      chip.innerHTML = `<strong>${label}</strong><span>${value}</span>`
      meta.append(chip)
    }
    caption.textContent = detailPhoto.dataUrl
      ? `${detailPhoto.title} · Captured with your camera. Saved only on this device.`
      : `${detailPhoto.title} is a generated capture saved in your local gallery.`
  }

  selectAll.addEventListener('click', selectAllPhotos)
  clear.addEventListener('click', clearSelection)
  deleteSelected.addEventListener('click', () => deletePhotos(state.selectedIds.length ? state.selectedIds : state.detailId ? [state.detailId] : []))
  favorite.addEventListener('click', () => {
    const photo = getPhoto(state.detailId)
    if (photo) toggleFavorite(photo.id)
  })
  select.addEventListener('click', () => {
    const photo = getPhoto(state.detailId)
    if (photo) {
      if (state.selectedIds.includes(photo.id) && state.selectedIds.length === 1) clearSelection()
      else selectOnly(photo.id)
    }
  })
  remove.addEventListener('click', () => deletePhotos(state.selectedIds.includes(state.detailId ?? '') ? state.selectedIds : state.detailId ? [state.detailId] : []))

  render()
  const unsubscribe = subscribe(render)

  return {
    left,
    right,
    onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return false
      const index = state.photos.findIndex(photo => photo.id === state.detailId)
      if (event.key === 'ArrowLeft') {
        const target = state.photos[clamp(index + 1, 0, Math.max(0, state.photos.length - 1))]
        if (target) selectOnly(target.id)
        return true
      }
      if (event.key === 'ArrowRight') {
        const target = state.photos[clamp(index - 1, 0, Math.max(0, state.photos.length - 1))]
        if (target) selectOnly(target.id)
        return true
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deletePhotos(state.selectedIds.length ? state.selectedIds : state.detailId ? [state.detailId] : [])
        return true
      }
      if (event.key === 'f' || event.key === 'F') {
        const photo = getPhoto(state.detailId)
        if (photo) toggleFavorite(photo.id)
        return true
      }
      return false
    },
    dispose() {
      unsubscribe()
    },
  }
}

const cameraApp: PhoneApp = {
  id: 'camera',
  name: 'Camera',
  icon: '◉',
  color: '#8fd4ff',
  create() {
    return renderCameraApp(document.createElement('section'), document.createElement('section'))
  },
}

const photosApp: PhoneApp = {
  id: 'photos',
  name: 'Photos',
  icon: '▦',
  color: '#ffb86b',
  create() {
    return renderPhotosApp(document.createElement('section'), document.createElement('section'))
  },
}

window.addEventListener('storage', event => {
  if (event.key !== storageKey || !event.newValue) return
  try {
    const parsed: unknown = JSON.parse(event.newValue)
    if (isMediaCaptureState(parsed)) {
      state = normalizeState(parsed)
      for (const listener of listeners) listener()
    }
  } catch {
    // Ignore malformed cross-tab updates.
  }
})

export const mediaCaptureApps: PhoneApp[] = [cameraApp, photosApp]
