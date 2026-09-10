import './system.css'
import type { PhoneApp } from './types'

type CompassState = {
  heading: number
  calibration: number
}

type MeasurePoint = { x: number; y: number }
type MeasureState = { points: MeasurePoint[] }

type StockItem = {
  symbol: string
  name: string
  sector: string
  price: number
  change: number
  history: number[]
  summary: string
}

type StocksState = {
  watchlist: string[]
  selected: string
  search: string
  custom: StockItem[]
}

type NewsArticle = {
  id: string
  section: string
  title: string
  byline: string
  summary: string
  body: string[]
  time: string
}

type NewsState = {
  section: string
  selected: string
  saved: string[]
}

type PasswordEntry = {
  id: string
  site: string
  username: string
  password: string
  note: string
  createdAt: number
}

type PasswordState = {
  search: string
  selected: string
  revealed: string[]
  entries: PasswordEntry[]
  status: string
}

type SettingsState = {
  section: string
  prefs: Record<string, boolean | number>
}

type MagnifierState = {
  zoom: number
  contrast: number
  frozen: boolean
}

const compassKey = 'duo-system-compass'
const measureKey = 'duo-system-measure'
const stocksKey = 'duo-system-stocks'
const newsKey = 'duo-system-news'
const passwordsKey = 'duo-system-passwords'
const settingsKey = 'duo-system-settings'
const magnifierKey = 'duo-system-magnifier'

const COLORS = {
  compass: '#ffffff',
  measure: '#ffffff',
  stocks: '#30d158',
  news: '#f9364c',
  passwords: '#007aff',
  settings: '#007aff',
  magnifier: '#ffd60a',
}

const STOCK_CATALOG: StockItem[] = [
  {
    symbol: 'AAPL',
    name: 'Apple',
    sector: 'Consumer tech',
    price: 223.14,
    change: 1.42,
    history: [216, 217.3, 218.2, 219.6, 221.1, 220.4, 222.1, 223.14],
    summary: 'Hardware demand is steady and services continue to carry the story.',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft',
    sector: 'Software',
    price: 428.93,
    change: -0.38,
    history: [434, 433.4, 431.8, 430.7, 429.6, 429.3, 428.9],
    summary: 'Enterprise demand remains broad with cloud momentum holding firm.',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA',
    sector: 'Semiconductors',
    price: 118.76,
    change: 2.11,
    history: [112.1, 112.9, 114.4, 115.2, 116.9, 117.8, 118.76],
    summary: 'AI compute and datacenter chips keep the chart energetic.',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms',
    sector: 'Social media',
    price: 541.84,
    change: 0.74,
    history: [532, 534, 537, 539, 540.5, 541.2, 541.84],
    summary: 'Ads stay resilient while AI tooling expands the product surface.',
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase',
    sector: 'Financials',
    price: 209.11,
    change: -0.24,
    history: [210.1, 209.8, 210.2, 209.6, 209.4, 209.11],
    summary: 'A balanced book and sticky deposits keep the profile calm.',
  },
  {
    symbol: 'UBER',
    name: 'Uber',
    sector: 'Mobility',
    price: 74.28,
    change: 1.07,
    history: [69.2, 70.4, 71.3, 72.1, 72.9, 73.4, 74.28],
    summary: 'Trips and delivery volume continue to show healthy demand.',
  },
]

const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'orbit-launch',
    section: 'World',
    title: 'Orbit service expands as cities test micro transit loops',
    byline: 'By Rowan Chen',
    summary: 'Pilot routes are linking commuter hubs with short-range electric pods.',
    time: '12 min ago',
    body: [
      'Transit planners say the pilot routes are already changing peak-hour behavior by shaving several minutes off the most frustrating transfers.',
      'The electric pods are designed to keep dwell times short, with easy boarding, open sight lines, and more room for mobility devices and cargo.',
      'Officials say the first phase will focus on reliable service and rider feedback before the routes expand to adjacent neighborhoods later this year.',
    ],
  },
  {
    id: 'device-ai',
    section: 'Tech',
    title: 'Device makers lean into on-device AI for private shortcuts',
    byline: 'By Anika Shah',
    summary: 'Smaller local models are showing up in apps that need quick, private decisions.',
    time: '28 min ago',
    body: [
      'Manufacturers are highlighting local inference for tasks that benefit from low latency or better privacy, such as drafting, sorting, and search completion.',
      'Analysts say the trend is less about flashy demos and more about reducing the number of tasks that need a round trip to the cloud.',
      'The change is also reshaping app design because developers can lean on instant interactions without worrying as much about network quality.',
    ],
  },
  {
    id: 'markets-wrap',
    section: 'Business',
    title: 'Markets finish calm after a week of steady earnings updates',
    byline: 'By Devin Moore',
    summary: 'Investors rotated into defensives while watching a few surprise beats.',
    time: '42 min ago',
    body: [
      'Trading stayed measured as investors digested a cluster of earnings reports that mostly came in above expectations.',
      'Utilities and consumer staples found support while some growth names cooled after running ahead of their own guidance.',
      'Traders described the session as constructive rather than exciting, with a clear preference for balance sheets and recurring revenue.',
    ],
  },
  {
    id: 'design-week',
    section: 'Culture',
    title: 'A city gallery spotlights interfaces made for small screens',
    byline: 'By Tessa Lane',
    summary: 'The exhibition explores how compact devices can still feel generous.',
    time: '1 hr ago',
    body: [
      'Curators say the show was built around the idea that tiny screens can support meaningful gestures when the layout is intentional.',
      'Work on display ranges from early mobile experiments to tactile present-day tools that use motion, typography, and clear hierarchy to reduce friction.',
      'Visitors can interact with a few mock devices and compare how different patterns change the emotional feel of an interface.',
    ],
  },
  {
    id: 'finals-preview',
    section: 'Sports',
    title: 'Championship bracket narrows after a tense overtime finish',
    byline: 'By Mateo Ruiz',
    summary: 'A comeback in the final two minutes reset the path to the title.',
    time: '2 hr ago',
    body: [
      'The matchup swung late when the underdogs forced a turnover and converted a quick score to tie the game.',
      'Overtime belonged to the defense, with both teams protecting the paint and forcing difficult looks from the perimeter.',
      'The title series now moves to a venue known for loud crowds and a fast home start, setting up a dramatic finish.',
    ],
  },
]

const SETTINGS_SECTIONS = [
  {
    id: 'general',
    title: 'General',
    summary: 'Device basics and quick behaviors.',
    items: [
      { key: 'airplaneMode', label: 'Airplane Mode', help: 'Cuts radios for a focused session.' },
      { key: 'wifi', label: 'Wi‑Fi', help: 'Connects to nearby networks.' },
      { key: 'bluetooth', label: 'Bluetooth', help: 'Pairs accessories and speakers.' },
    ],
  },
  {
    id: 'display',
    title: 'Display & Brightness',
    summary: 'Themes and legibility.',
    items: [
      { key: 'darkMode', label: 'Dark Mode', help: 'Matches the Duo shell more closely.' },
      { key: 'largeText', label: 'Large Text', help: 'Improves readability at a glance.' },
      { key: 'reduceMotion', label: 'Reduce Motion', help: 'Softens animated transitions.' },
      { key: 'brightness', label: 'Brightness', help: 'Keeps the screen comfortable.' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    summary: 'Alerts and badges.',
    items: [
      { key: 'sounds', label: 'Sounds', help: 'Plays a tone for important alerts.' },
      { key: 'badges', label: 'Badges', help: 'Shows counts on app icons.' },
      { key: 'previews', label: 'Preview Content', help: 'Shows more detail in banners.' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    summary: 'Permissions and data handling.',
    items: [
      { key: 'location', label: 'Location Services', help: 'Allows apps to use rough position.' },
      { key: 'analytics', label: 'Share Analytics', help: 'Helps improve simulated diagnostics.' },
      { key: 'faceId', label: 'Face ID Unlock', help: 'Requires a glance to open supported apps.' },
    ],
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    summary: 'Comfort and control.',
    items: [
      { key: 'voiceOver', label: 'VoiceOver Hints', help: 'Adds richer labels to controls.' },
      { key: 'haptics', label: 'System Haptics', help: 'Simulates tactile feedback.' },
      { key: 'autoLock', label: 'Auto‑Lock Delay', help: 'Keeps the screen awake a little longer.' },
    ],
  },
] as const

const DEFAULT_COMPASS: CompassState = { heading: 42, calibration: 0 }
const DEFAULT_MEASURE: MeasureState = { points: [] }
const DEFAULT_STOCKS: StocksState = {
  watchlist: ['AAPL', 'NVDA', 'META'],
  selected: 'AAPL',
  search: '',
  custom: [],
}
const DEFAULT_NEWS: NewsState = {
  section: 'World',
  selected: 'orbit-launch',
  saved: [],
}
const DEFAULT_PASSWORDS: PasswordState = {
  search: '',
  selected: 'mail',
  revealed: [],
  status: 'Simulated vault ready.',
  entries: [
    { id: 'mail', site: 'Mail', username: 'wesbos', password: 'sunrise-lamp-42', note: 'Primary inbox', createdAt: Date.now() - 86_400_000 },
    { id: 'bank', site: 'North Bank', username: 'wes', password: 'maple-7-coral', note: 'Demo finance login', createdAt: Date.now() - 43_200_000 },
    { id: 'video', site: 'Video Club', username: 'studio-wes', password: 'grainy-mountain', note: 'Shared family account', createdAt: Date.now() - 21_600_000 },
    { id: 'cloud', site: 'Cloud Notes', username: 'w.bos', password: 'paper-lantern', note: 'Work note archive', createdAt: Date.now() - 10_800_000 },
  ],
}
const DEFAULT_SETTINGS: SettingsState = {
  section: 'general',
  prefs: {
    airplaneMode: false,
    wifi: true,
    bluetooth: true,
    darkMode: true,
    largeText: false,
    reduceMotion: false,
    brightness: 76,
    sounds: true,
    badges: true,
    previews: true,
    location: true,
    analytics: false,
    faceId: true,
    voiceOver: false,
    haptics: true,
    autoLock: 2,
  },
}
const DEFAULT_MAGNIFIER: MagnifierState = { zoom: 2.2, contrast: 1.08, frozen: false }

function uid() {
  return crypto.randomUUID()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeAngle(value: number) {
  const result = Math.round(value) % 360
  return result < 0 ? result + 360 : result
}

function safeRead(key: string): unknown {
  try {
    if (typeof localStorage === 'undefined') return undefined
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // optional persistence
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatSigned(value: number, digits = 0) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(digits)}`
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

function formatMetric(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
}

function createCompassState(): CompassState {
  const saved = safeRead(compassKey)
  if (saved && typeof saved === 'object') {
    const value = saved as Partial<CompassState>
    if (typeof value.heading === 'number' && typeof value.calibration === 'number') {
      return {
        heading: normalizeAngle(value.heading),
        calibration: normalizeAngle(value.calibration),
      }
    }
  }
  return DEFAULT_COMPASS
}

function createMeasureState(): MeasureState {
  const saved = safeRead(measureKey)
  if (saved && typeof saved === 'object' && Array.isArray((saved as { points?: unknown }).points)) {
    const points = (saved as { points: unknown[] }).points.filter((point): point is MeasurePoint => (
      typeof point === 'object'
      && point !== null
      && typeof (point as MeasurePoint).x === 'number'
      && typeof (point as MeasurePoint).y === 'number'
    ))
    return { points: points.slice(0, 2) }
  }
  return DEFAULT_MEASURE
}

function createStockHistory(seed: number, direction: number) {
  const values: number[] = []
  let current = seed
  for (let index = 0; index < 8; index += 1) {
    current += direction * (0.4 + (index % 3) * 0.2)
    values.push(Number(current.toFixed(2)))
  }
  return values
}

function createCustomStock(symbolRaw: string): StockItem {
  const symbol = symbolRaw.trim().toUpperCase()
  const base = 85 + symbol.length * 8
  const direction = symbol.charCodeAt(0) % 2 === 0 ? 1 : -1
  const price = Number((base + direction * (symbol.length * 1.23)).toFixed(2))
  return {
    symbol,
    name: `${symbol} Holdings`,
    sector: 'Simulated',
    price,
    change: Number((direction * (symbol.length % 4 + 0.4)).toFixed(2)),
    history: createStockHistory(price - direction * 4, direction),
    summary: 'User-added simulated stock with local chart data only.',
  }
}

function createStocksState(): StocksState {
  const saved = safeRead(stocksKey)
  if (saved && typeof saved === 'object') {
    const value = saved as Partial<StocksState>
    return {
      watchlist: Array.isArray(value.watchlist) ? value.watchlist.filter((item): item is string => typeof item === 'string') : DEFAULT_STOCKS.watchlist,
      selected: typeof value.selected === 'string' ? value.selected : DEFAULT_STOCKS.selected,
      search: typeof value.search === 'string' ? value.search : '',
      custom: Array.isArray(value.custom)
        ? value.custom.filter((item): item is StockItem => (
          typeof item === 'object'
          && item !== null
          && typeof (item as StockItem).symbol === 'string'
          && typeof (item as StockItem).name === 'string'
          && typeof (item as StockItem).sector === 'string'
          && typeof (item as StockItem).price === 'number'
          && typeof (item as StockItem).change === 'number'
          && Array.isArray((item as StockItem).history)
          && typeof (item as StockItem).summary === 'string'
        ))
        : [],
    }
  }
  return {
    watchlist: [...DEFAULT_STOCKS.watchlist],
    selected: DEFAULT_STOCKS.selected,
    search: '',
    custom: [],
  }
}

function createNewsState(): NewsState {
  const saved = safeRead(newsKey)
  if (saved && typeof saved === 'object') {
    const value = saved as Partial<NewsState>
    return {
      section: typeof value.section === 'string' ? value.section : DEFAULT_NEWS.section,
      selected: typeof value.selected === 'string' ? value.selected : DEFAULT_NEWS.selected,
      saved: Array.isArray(value.saved) ? value.saved.filter((item): item is string => typeof item === 'string') : [],
    }
  }
  return DEFAULT_NEWS
}

function createPasswordsState(): PasswordState {
  const saved = safeRead(passwordsKey)
  if (saved && typeof saved === 'object') {
    const value = saved as Partial<PasswordState>
    return {
      search: typeof value.search === 'string' ? value.search : '',
      selected: typeof value.selected === 'string' ? value.selected : DEFAULT_PASSWORDS.selected,
      revealed: Array.isArray(value.revealed) ? value.revealed.filter((item): item is string => typeof item === 'string') : [],
      status: typeof value.status === 'string' ? value.status : DEFAULT_PASSWORDS.status,
      entries: Array.isArray(value.entries)
        ? value.entries.filter((item): item is PasswordEntry => (
          typeof item === 'object'
          && item !== null
          && typeof (item as PasswordEntry).id === 'string'
          && typeof (item as PasswordEntry).site === 'string'
          && typeof (item as PasswordEntry).username === 'string'
          && typeof (item as PasswordEntry).password === 'string'
          && typeof (item as PasswordEntry).note === 'string'
          && typeof (item as PasswordEntry).createdAt === 'number'
        ))
        : [...DEFAULT_PASSWORDS.entries],
    }
  }
  return {
    search: DEFAULT_PASSWORDS.search,
    selected: DEFAULT_PASSWORDS.selected,
    revealed: [...DEFAULT_PASSWORDS.revealed],
    status: DEFAULT_PASSWORDS.status,
    entries: [...DEFAULT_PASSWORDS.entries],
  }
}

function createSettingsState(): SettingsState {
  const saved = safeRead(settingsKey)
  const prefs: Record<string, boolean | number> = { ...DEFAULT_SETTINGS.prefs }
  if (saved && typeof saved === 'object') {
    const value = saved as Partial<SettingsState>
    if (value.prefs && typeof value.prefs === 'object') {
      for (const [key, stored] of Object.entries(value.prefs)) {
        if (typeof stored === 'boolean' || typeof stored === 'number') {
          prefs[key] = stored
        }
      }
    }
    return {
      section: typeof value.section === 'string' ? value.section : DEFAULT_SETTINGS.section,
      prefs,
    }
  }
  return {
    section: DEFAULT_SETTINGS.section,
    prefs,
  }
}

function createMagnifierState(): MagnifierState {
  const saved = safeRead(magnifierKey)
  if (saved && typeof saved === 'object') {
    const value = saved as Partial<MagnifierState>
    return {
      zoom: typeof value.zoom === 'number' ? clamp(value.zoom, 1, 4) : DEFAULT_MAGNIFIER.zoom,
      contrast: typeof value.contrast === 'number' ? clamp(value.contrast, 0.6, 1.8) : DEFAULT_MAGNIFIER.contrast,
      frozen: typeof value.frozen === 'boolean' ? value.frozen : DEFAULT_MAGNIFIER.frozen,
    }
  }
  return DEFAULT_MAGNIFIER
}

function currentStocks(state: StocksState) {
  return [...STOCK_CATALOG, ...state.custom]
}

function resolveStock(state: StocksState, symbol: string) {
  const upper = symbol.toUpperCase()
  return currentStocks(state).find(stock => stock.symbol === upper)
}

function findSelectedStock(state: StocksState) {
  return resolveStock(state, state.selected) ?? currentStocks(state)[0]
}

function filterArticles(state: NewsState) {
  return NEWS_ARTICLES.filter(article => article.section === state.section)
}

function selectedNewsArticle(state: NewsState) {
  const articles = filterArticles(state)
  return articles.find(article => article.id === state.selected) ?? articles[0] ?? NEWS_ARTICLES[0]
}

function renderSparkline(values: number[], accent = '#7df0b2') {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return `
    <svg class="sys-chart" viewBox="-2 -4 104 108" preserveAspectRatio="none" role="img" aria-label="Simulated stock price history">
      <polyline points="${points}" fill="none" stroke="${accent}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `
}

function systemSymbol(name: string) {
  const paths: Record<string, string> = {
    general: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    display: '<path d="m3 18 5-12 5 12M5 14h6m3 4 4-9 4 9m-6-3h4"/>',
    notifications: '<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zm5 3h4"/>',
    privacy: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
    accessibility: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="6" r="1"/><path d="M6 10h12m-6-1v6m0 0-3 4m3-4 3 4"/>',
    all: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    passkeys: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 10-4m4 0v8m0-3h3"/><circle cx="17" cy="10" r="3"/>',
    codes: '<path d="M9 3 7 21M17 3l-2 18M3 9h18M2 15h18"/>',
    wifi: '<path d="M2 7a16 16 0 0 1 20 0M5 11a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0"/><circle cx="12" cy="19" r="1"/>',
    security: '<path d="m12 3 10 18H2zm0 6v5m0 3v1"/>',
    deleted: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.general}</svg>`
}

function compassScale() {
  const ticks = Array.from({ length: 120 }, (_, index) => {
    const angle = index * 3
    return `<path d="M180 14v${index % 10 === 0 ? 22 : index % 5 === 0 ? 15 : 9}" transform="rotate(${angle} 180 180)" stroke="${index === 0 ? '#ff453a' : '#fff'}" stroke-width="${index % 10 === 0 ? 2 : 1}" opacity="${index % 5 === 0 ? 1 : .55}"/>`
  }).join('')
  const labels = Array.from({ length: 12 }, (_, index) => {
    const degrees = index * 30
    const angle = degrees * Math.PI / 180
    return `<text x="${180 + Math.sin(angle) * 123}" y="${185 - Math.cos(angle) * 123}" text-anchor="middle" fill="#aaa" font-size="15">${degrees}</text>`
  }).join('')
  return `<svg class="sys-compass-scale" viewBox="0 0 360 360" aria-hidden="true">${ticks}${labels}</svg>`
}

function renderCompass() {
  const state = createCompassState()
  const left = document.createElement('section')
  left.className = 'sys-pane sys-compass-pane sys-compass-pane--left'
  const right = document.createElement('section')
  right.className = 'sys-pane sys-compass-pane sys-compass-pane--right'
  right.style.setProperty('--sys-compass-rotation', `${normalizeAngle(state.heading + state.calibration)}deg`)

  left.innerHTML = `
    <div class="sys-hero">
      <div>
        <h2>Compass</h2>
        <p class="sys-copy">Simulated heading · No location access</p>
      </div>
      <div class="sys-metric">
        <span>Bearing</span>
        <strong data-compass-heading>0°</strong>
      </div>
    </div>
    <div class="sys-card sys-stack">
      <label class="sys-field">
        <span>Rotation control</span>
        <input data-compass-slider type="range" min="0" max="359" step="1" aria-label="Compass heading">
      </label>
      <div class="sys-button-row">
        <button type="button" class="sys-button" data-compass-minus aria-label="Rotate 15 degrees counterclockwise">−15°</button>
        <button type="button" class="sys-button" data-compass-plus aria-label="Rotate 15 degrees clockwise">+15°</button>
      </div>
      <div class="sys-button-row">
        <button type="button" class="sys-button sys-button--primary" data-compass-calibrate>Calibrate north</button>
        <button type="button" class="sys-button" data-compass-reset>Reset</button>
      </div>
      <p class="sys-status" data-compass-status></p>
    </div>
    <div class="sys-card sys-note">
      <strong>Set a bearing</strong>
      <span>Tap the dial to snap to a bearing, or use the slider for fine control.</span>
    </div>
  `

  right.innerHTML = `
    <div class="sys-compass-wrap">
      <div class="sys-compass-dial" data-compass-dial role="button" tabindex="0" aria-label="Compass dial. Click to set a bearing.">
        ${compassScale()}
        <div class="sys-compass-rose">
          <span class="north">N</span>
          <span class="east">E</span>
          <span class="south">S</span>
          <span class="west">W</span>
        </div>
        <div class="sys-compass-needle"></div>
        <div class="sys-compass-hub"></div>
      </div>
      <div class="sys-card sys-compass-readout">
        <strong data-compass-readout>0°</strong>
        <span data-compass-calibration></span>
        <p>Location unavailable in this demo</p>
      </div>
    </div>
  `

  const headingLabel = left.querySelector<HTMLElement>('[data-compass-heading]')!
  const slider = left.querySelector<HTMLInputElement>('[data-compass-slider]')!
  const status = left.querySelector<HTMLElement>('[data-compass-status]')!
  const readout = right.querySelector<HTMLElement>('[data-compass-readout]')!
  const calibration = right.querySelector<HTMLElement>('[data-compass-calibration]')!
  const dial = right.querySelector<HTMLElement>('[data-compass-dial]')!

  function update() {
    const heading = normalizeAngle(state.heading)
    const display = normalizeAngle(state.heading + state.calibration)
    const calibrationOffset = state.calibration > 180 ? state.calibration - 360 : state.calibration
    headingLabel.textContent = `${display.toString().padStart(3, '0')}°`
    const direction = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(display / 45) % 8]
    readout.textContent = `${display}° ${direction}`
    calibration.textContent = state.calibration ? `Calibration offset ${formatSigned(calibrationOffset)}°` : 'Calibrated to north'
    status.textContent = `Dial is ${display}° from north.`
    slider.value = String(heading)
    right.style.setProperty('--sys-compass-rotation', `${display}deg`)
    safeWrite(compassKey, state)
  }

  slider.addEventListener('input', () => {
    state.heading = Number(slider.value)
    update()
  })

  left.querySelector('[data-compass-minus]')!.addEventListener('click', () => {
    state.heading = normalizeAngle(state.heading - 15)
    update()
  })
  left.querySelector('[data-compass-plus]')!.addEventListener('click', () => {
    state.heading = normalizeAngle(state.heading + 15)
    update()
  })
  left.querySelector('[data-compass-calibrate]')!.addEventListener('click', () => {
    state.calibration = normalizeAngle(360 - state.heading)
    update()
  })
  left.querySelector('[data-compass-reset]')!.addEventListener('click', () => {
    state.heading = DEFAULT_COMPASS.heading
    state.calibration = DEFAULT_COMPASS.calibration
    update()
  })

  function setHeadingFromPoint(clientX: number, clientY: number) {
    const rect = dial.getBoundingClientRect()
    const x = clientX - rect.left - rect.width / 2
    const y = clientY - rect.top - rect.height / 2
    const degrees = normalizeAngle((Math.atan2(y, x) * 180) / Math.PI + 90)
    state.heading = degrees
    update()
  }

  dial.addEventListener('pointerdown', event => {
    event.preventDefault()
    setHeadingFromPoint(event.clientX, event.clientY)
  })

  dial.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      state.heading = normalizeAngle(state.heading - 1)
      update()
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      state.heading = normalizeAngle(state.heading + 1)
      update()
    }
  })

  update()
  return { left, right }
}

function renderMeasure() {
  const state = createMeasureState()
  const left = document.createElement('section')
  left.className = 'sys-pane sys-measure-pane sys-measure-pane--left'
  const right = document.createElement('section')
  right.className = 'sys-pane sys-measure-pane sys-measure-pane--right'

  left.innerHTML = `
    <div class="sys-hero">
      <div>
        <h2>Measure</h2>
        <p class="sys-copy">Demo canvas · Not a camera measurement</p>
      </div>
      <div class="sys-metric">
        <span>Length</span>
        <strong data-measure-length>0.0 cm</strong>
      </div>
    </div>
    <div class="sys-card sys-stack">
      <p class="sys-status" data-measure-status>Tap the board to place the first point.</p>
      <div class="sys-button-row">
        <button type="button" class="sys-button sys-button--primary" data-measure-reset>Reset points</button>
      </div>
      <div class="sys-measure-stats">
        <div><span>Points</span><strong data-measure-count>0</strong></div>
        <div><span>ΔX</span><strong data-measure-dx>0.0</strong></div>
        <div><span>ΔY</span><strong data-measure-dy>0.0</strong></div>
      </div>
    </div>
    <div class="sys-card sys-note">
      <strong>Place two points</strong>
      <span>Click or tap the right screen twice. A third tap starts a new measurement.</span>
    </div>
  `

  right.innerHTML = `
    <div class="sys-measure-board" data-measure-board role="application" aria-label="Measurement board">
      <svg class="sys-measure-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
      <div class="sys-measure-grid"></div>
      <div class="sys-measure-reticle" aria-hidden="true">+</div>
      <p class="sys-measure-hint">Tap to add a point</p>
      <div class="sys-measure-legend">
        <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90</span><span>100</span>
      </div>
    </div>
  `

  const lengthLabel = left.querySelector<HTMLElement>('[data-measure-length]')!
  const status = left.querySelector<HTMLElement>('[data-measure-status]')!
  const count = left.querySelector<HTMLElement>('[data-measure-count]')!
  const dx = left.querySelector<HTMLElement>('[data-measure-dx]')!
  const dy = left.querySelector<HTMLElement>('[data-measure-dy]')!
  const board = right.querySelector<HTMLElement>('[data-measure-board]')!
  const svg = right.querySelector<SVGSVGElement>('.sys-measure-svg')!

  function distance(points: MeasurePoint[]) {
    if (points.length < 2) return 0
    const [a, b] = points
    const deltaX = ((b.x - a.x) / 100) * 18
    const deltaY = ((b.y - a.y) / 100) * 24
    return Math.hypot(deltaX, deltaY)
  }

  function render() {
    const [a, b] = state.points
    const hasTwo = Boolean(a && b)
    const length = distance(state.points)
    const deltaX = hasTwo ? (((b.x - a.x) / 100) * 18) : 0
    const deltaY = hasTwo ? (((b.y - a.y) / 100) * 24) : 0
    lengthLabel.textContent = `${formatMetric(length)} cm`
    count.textContent = String(state.points.length)
    dx.textContent = formatMetric(Math.abs(deltaX))
    dy.textContent = formatMetric(Math.abs(deltaY))
    status.textContent = state.points.length === 0
      ? 'Tap the board to place the first point.'
      : state.points.length === 1
        ? 'First point set. Place a second point to measure.'
        : `Distance recorded: ${formatMetric(length)} cm.`
    safeWrite(measureKey, state)

    const pointMarkup = state.points.map((point, index) => `
      <g transform="translate(${point.x} ${point.y})">
        <circle r="2.1" class="sys-measure-point sys-measure-point--${index + 1}"></circle>
        <text class="sys-measure-label" y="-4">${index + 1}</text>
      </g>
    `).join('')

    const lineMarkup = hasTwo
      ? `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="sys-measure-line"></line>`
      : ''

    const midPoint = hasTwo
      ? `<g transform="translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})"><rect x="-18" y="-10" rx="5" ry="5" width="36" height="20" class="sys-measure-tag"></rect><text class="sys-measure-tag-text" text-anchor="middle" y="4">${formatMetric(length)} cm</text></g>`
      : ''

    svg.innerHTML = `
      <rect width="100" height="100" class="sys-measure-surface"></rect>
      <path d="M 0 10 H 100 M 0 20 H 100 M 0 30 H 100 M 0 40 H 100 M 0 50 H 100 M 0 60 H 100 M 0 70 H 100 M 0 80 H 100 M 0 90 H 100" class="sys-measure-grid-lines"></path>
      <path d="M 10 0 V 100 M 20 0 V 100 M 30 0 V 100 M 40 0 V 100 M 50 0 V 100 M 60 0 V 100 M 70 0 V 100 M 80 0 V 100 M 90 0 V 100" class="sys-measure-grid-lines"></path>
      ${lineMarkup}
      ${midPoint}
      ${pointMarkup}
    `
  }

  board.addEventListener('pointerdown', event => {
    const rect = board.getBoundingClientRect()
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    if (state.points.length >= 2) {
      state.points = []
    }
    state.points = [...state.points, { x, y }].slice(0, 2)
    render()
  })

  left.querySelector('[data-measure-reset]')!.addEventListener('click', () => {
    state.points = []
    render()
  })

  render()
  return { left, right }
}

function renderStocks() {
  const state = createStocksState()
  const left = document.createElement('section')
  left.className = 'sys-pane sys-stocks-pane sys-stocks-pane--left'
  const right = document.createElement('section')
  right.className = 'sys-pane sys-stocks-pane sys-stocks-pane--right'

  left.innerHTML = `
    <div class="sys-hero">
      <div>
        <h2>Stocks</h2>
        <p class="sys-stock-date">${new Date().toLocaleDateString([], { month: 'long', day: 'numeric' })}</p>
      </div>
      <div class="sys-metric">
        <span>Tracked</span>
        <strong data-stocks-tracked>0</strong>
      </div>
    </div>
    <label class="sys-field">
      <span>Add symbol or company</span>
      <div class="sys-inline-field">
        <input data-stocks-search type="text" inputmode="text" autocomplete="off" placeholder="Search AAPL or type a new symbol">
        <button type="button" class="sys-button sys-button--primary" data-stocks-add>Add</button>
      </div>
    </label>
    <div class="sys-section">
      <div class="sys-section-head">
        <h3>My Symbols</h3>
        <span data-stocks-watch-count></span>
      </div>
      <div class="sys-list" data-stocks-watchlist></div>
    </div>
    <div class="sys-section">
      <div class="sys-section-head">
        <h3>Discover</h3>
        <span>Tap to add</span>
      </div>
      <div class="sys-list" data-stocks-discover></div>
    </div>
    <p class="sys-status">Simulated prices · Not live market data</p>
  `

  right.innerHTML = `
    <div class="sys-card sys-stock-detail" data-stocks-detail></div>
  `

  const search = left.querySelector<HTMLInputElement>('[data-stocks-search]')!
  const addButton = left.querySelector<HTMLButtonElement>('[data-stocks-add]')!
  const tracked = left.querySelector<HTMLElement>('[data-stocks-tracked]')!
  const watchCount = left.querySelector<HTMLElement>('[data-stocks-watch-count]')!
  const watchlist = left.querySelector<HTMLElement>('[data-stocks-watchlist]')!
  const discover = left.querySelector<HTMLElement>('[data-stocks-discover]')!
  const detail = right.querySelector<HTMLElement>('[data-stocks-detail]')!

  function select(symbol: string) {
    state.selected = symbol
    render()
  }

  function addSymbol(raw: string) {
    const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '')
    if (!cleaned) {
      return
    }
    const match = currentStocks(state).find(stock => stock.symbol === cleaned)
    if (match) {
      if (!state.watchlist.includes(match.symbol)) state.watchlist = [match.symbol, ...state.watchlist]
      state.selected = match.symbol
      state.search = ''
      render()
      return
    }
    const custom = createCustomStock(cleaned)
    state.custom = [custom, ...state.custom.filter(stock => stock.symbol !== custom.symbol)]
    if (!state.watchlist.includes(custom.symbol)) state.watchlist = [custom.symbol, ...state.watchlist]
    state.selected = custom.symbol
    state.search = ''
    render()
  }

  function filteredDiscover() {
    const query = state.search.trim().toLowerCase()
    return STOCK_CATALOG.filter(stock => !state.watchlist.includes(stock.symbol) && (
      !query
      || stock.symbol.toLowerCase().includes(query)
      || stock.name.toLowerCase().includes(query)
      || stock.sector.toLowerCase().includes(query)
    )).slice(0, 4)
  }

  function renderList() {
    const watchItems = state.watchlist.map(symbol => {
      const stock = resolveStock(state, symbol)
      if (!stock) return ''
      const active = stock.symbol === state.selected ? ' is-selected' : ''
      return `
        <button type="button" class="sys-list-item${active}" data-stock-select="${escapeHtml(stock.symbol)}">
          <div class="sys-list-copy">
            <strong>${escapeHtml(stock.symbol)}</strong>
            <span>${escapeHtml(stock.name)}</span>
          </div>
          <div class="sys-stock-spark">${renderSparkline(stock.history, stock.change >= 0 ? COLORS.stocks : '#ff453a')}</div>
          <div class="sys-list-price">
            <strong>${formatMoney(stock.price)}</strong>
            <span class="${stock.change >= 0 ? 'is-up' : 'is-down'}">${formatPercent(stock.change)}</span>
          </div>
        </button>
      `
    }).join('')

    const discoverItems = filteredDiscover().map(stock => `
      <button type="button" class="sys-list-item" data-stock-add="${escapeHtml(stock.symbol)}">
        <div class="sys-list-copy">
          <strong>${escapeHtml(stock.symbol)}</strong>
          <span>${escapeHtml(stock.name)}</span>
        </div>
        <div class="sys-stock-spark">${renderSparkline(stock.history, stock.change >= 0 ? COLORS.stocks : '#ff453a')}</div>
        <div class="sys-list-price">
          <strong>${formatMoney(stock.price)}</strong>
          <span>Tap to add</span>
        </div>
      </button>
    `).join('')

    watchlist.innerHTML = watchItems || '<p class="sys-empty">No symbols yet.</p>'
    discover.innerHTML = discoverItems || '<p class="sys-empty">No more suggestions right now.</p>'
    tracked.textContent = String(state.watchlist.length)
    watchCount.textContent = `${state.watchlist.length} symbols`

    watchlist.querySelectorAll<HTMLButtonElement>('[data-stock-select]').forEach(button => {
      button.addEventListener('click', () => select(button.dataset.stockSelect!))
    })
    discover.querySelectorAll<HTMLButtonElement>('[data-stock-add]').forEach(button => {
      button.addEventListener('click', () => addSymbol(button.dataset.stockAdd!))
    })
  }

  function renderDetail() {
    const stock = findSelectedStock(state)
    if (!stock) {
      detail.innerHTML = '<p class="sys-empty">Pick a symbol from the watchlist.</p>'
      return
    }
    const chartColor = stock.change >= 0 ? COLORS.stocks : '#ff453a'
    const series = [...stock.history]
    const high = Math.max(...series)
    const low = Math.min(...series)
    const latest = series[series.length - 1] ?? stock.price
    const delta = latest - (series[0] ?? latest)
    detail.innerHTML = `
      <div class="sys-stock-head">
        <div>
          <p class="sys-eyebrow">${escapeHtml(stock.sector)}</p>
          <h3>${escapeHtml(stock.symbol)}</h3>
          <p class="sys-copy">${escapeHtml(stock.name)}</p>
        </div>
        <div class="sys-stock-price">
          <strong>${formatMoney(latest)}</strong>
          <span class="${delta >= 0 ? 'is-up' : 'is-down'}">${formatSigned(delta, 2)} today</span>
        </div>
      </div>
      <div class="sys-stock-chart">${renderSparkline(series, chartColor)}</div>
      <div class="sys-chart-axis" aria-hidden="true"><span>9:30 AM</span><span>12 PM</span><span>4 PM</span></div>
      <p class="sys-status">Today · Simulated trading session</p>
      <div class="sys-stock-stats">
        <div><span>Open</span><strong>${formatMoney(series[0] ?? latest)}</strong></div>
        <div><span>High</span><strong>${formatMoney(high)}</strong></div>
        <div><span>Low</span><strong>${formatMoney(low)}</strong></div>
        <div><span>Change</span><strong class="${stock.change >= 0 ? 'is-up' : 'is-down'}">${formatPercent(stock.change)}</strong></div>
      </div>
      <p class="sys-copy">${escapeHtml(stock.summary)}</p>
      <div class="sys-button-row">
        <button type="button" class="sys-button" data-stock-focus="${escapeHtml(stock.symbol)}">Focus watchlist</button>
      </div>
    `

    detail.querySelector('[data-stock-focus]')!.addEventListener('click', () => {
      if (!state.watchlist.includes(stock.symbol)) {
        state.watchlist = [stock.symbol, ...state.watchlist]
      }
      state.selected = stock.symbol
      render()
    })
  }

  search.value = state.search
  search.addEventListener('input', () => {
    state.search = search.value
    safeWrite(stocksKey, state)
    renderList()
  })

  search.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addSymbol(search.value)
    }
  })

  addButton.addEventListener('click', () => addSymbol(search.value || state.search))

  function render() {
    search.value = state.search
    safeWrite(stocksKey, state)
    renderList()
    renderDetail()
  }

  render()
  return { left, right }
}

function renderNews() {
  const state = createNewsState()
  const left = document.createElement('section')
  left.className = 'sys-pane sys-news-pane sys-news-pane--left'
  const right = document.createElement('section')
  right.className = 'sys-pane sys-news-pane sys-news-pane--right'

  left.innerHTML = `
    <div class="sys-hero">
      <div>
        <h2>Today</h2>
        <p class="sys-news-date">${new Date().toLocaleDateString([], { month: 'long', day: 'numeric' })}</p>
      </div>
      <div class="sys-metric">
        <span>Saved</span>
        <strong data-news-saved>0</strong>
      </div>
    </div>
    <div class="sys-chip-row" data-news-sections></div>
    <div class="sys-section">
      <div class="sys-section-head">
        <h3>Top Stories</h3>
        <span data-news-count></span>
      </div>
      <div class="sys-list" data-news-list></div>
    </div>
    <p class="sys-status">Demo edition · Fictional stories</p>
  `

  right.innerHTML = `
    <div class="sys-card sys-news-article" data-news-article></div>
  `

  const savedCount = left.querySelector<HTMLElement>('[data-news-saved]')!
  const sections = left.querySelector<HTMLElement>('[data-news-sections]')!
  const count = left.querySelector<HTMLElement>('[data-news-count]')!
  const list = left.querySelector<HTMLElement>('[data-news-list]')!
  const article = right.querySelector<HTMLElement>('[data-news-article]')!

  function selectSection(section: string) {
    state.section = section
    const available = filterArticles(state)
    state.selected = available.find(item => item.id === state.selected)?.id ?? available[0]?.id ?? NEWS_ARTICLES[0].id
    render()
  }

  function selectArticle(id: string) {
    state.selected = id
    render()
  }

  function toggleSave(id: string) {
    state.saved = state.saved.includes(id)
      ? state.saved.filter(item => item !== id)
      : [id, ...state.saved]
    render()
  }

  function renderSections() {
    sections.innerHTML = ['World', 'Tech', 'Business', 'Culture', 'Sports'].map(section => {
      const active = section === state.section ? ' aria-pressed="true"' : ' aria-pressed="false"'
      return `<button type="button" class="sys-chip"${active} data-news-section="${escapeHtml(section)}">${escapeHtml(section)}</button>`
    }).join('')
    sections.querySelectorAll<HTMLButtonElement>('[data-news-section]').forEach(button => {
      button.addEventListener('click', () => selectSection(button.dataset.newsSection!))
    })
  }

  function renderList() {
    const articles = filterArticles(state)
    const items = articles.map(item => {
      const active = item.id === state.selected ? ' is-selected' : ''
      const saved = state.saved.includes(item.id) ? ' ★' : ''
      return `
        <button type="button" class="sys-list-item${active}" data-news-open="${escapeHtml(item.id)}">
          <div class="sys-news-publication">Duo Journal <span>${escapeHtml(item.section)}</span></div>
          <div class="sys-list-copy">
            <strong>${escapeHtml(item.title)}${saved}</strong>
            <span>${escapeHtml(item.byline)}</span>
          </div>
          <p class="sys-news-deck">${escapeHtml(item.summary)}</p>
          <time>${escapeHtml(item.time)}</time>
        </button>
      `
    }).join('')
    list.innerHTML = items || '<p class="sys-empty">No articles for this section.</p>'
    count.textContent = `${articles.length} stories`
    savedCount.textContent = String(state.saved.length)
    list.querySelectorAll<HTMLButtonElement>('[data-news-open]').forEach(button => {
      button.addEventListener('click', () => selectArticle(button.dataset.newsOpen!))
    })
  }

  function renderDetail() {
    const item = selectedNewsArticle(state)
    if (!item) {
      article.innerHTML = '<p class="sys-empty">Choose a story to read.</p>'
      return
    }
    const isSaved = state.saved.includes(item.id)
    article.innerHTML = `
      <div class="sys-news-detail-head">
        <div>
          <p class="sys-news-publication">Duo Journal · ${escapeHtml(item.section)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="sys-copy">${escapeHtml(item.byline)} · ${escapeHtml(item.time)}</p>
        </div>
        <button type="button" class="sys-button sys-button--primary" data-news-save>${isSaved ? 'Saved' : 'Save'}</button>
      </div>
      <div class="sys-news-summary">${escapeHtml(item.summary)}</div>
      <div class="sys-news-body">
        ${item.body.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </div>
      <div class="sys-button-row">
        <button type="button" class="sys-button" data-news-next>Next story</button>
      </div>
    `
    article.querySelector('[data-news-save]')!.addEventListener('click', () => toggleSave(item.id))
    article.querySelector('[data-news-next]')!.addEventListener('click', () => {
      const items = filterArticles(state)
      const index = items.findIndex(entry => entry.id === item.id)
      const next = items[(index + 1) % Math.max(1, items.length)]
      if (next) selectArticle(next.id)
    })
  }

  function render() {
    renderSections()
    renderList()
    renderDetail()
    safeWrite(newsKey, state)
  }

  render()
  return { left, right }
}

function renderPasswords() {
  const state = createPasswordsState()
  let category = 'all'
  const left = document.createElement('section')
  left.className = 'sys-pane sys-passwords-pane sys-passwords-pane--left'
  const right = document.createElement('section')
  right.className = 'sys-pane sys-passwords-pane sys-passwords-pane--right'

  left.innerHTML = `
    <div class="sys-hero">
      <div>
        <h2>Passwords</h2>
        <p class="sys-copy">Demo vault · Unencrypted local storage.<br>Do not enter real passwords.</p>
      </div>
      <div class="sys-metric">
        <span>Matches</span>
        <strong data-password-matches>0</strong>
      </div>
    </div>
    <label class="sys-field">
      <span class="visually-hidden">Search passwords</span>
      <input data-password-search type="search" autocomplete="off" placeholder="Search">
    </label>
    <div class="sys-password-categories" data-password-categories></div>
    <div class="sys-password-status">
      <p class="sys-status" data-password-status>Simulated vault ready.</p>
    </div>
    <div class="sys-section">
      <div class="sys-section-head">
        <h3 data-password-category-title>All</h3>
        <span data-password-count></span>
      </div>
      <div class="sys-list" data-password-list></div>
    </div>
  `

  right.innerHTML = `
    <div class="sys-card sys-password-detail" data-password-detail></div>
    <form class="sys-card sys-password-form" data-password-form>
      <div class="sys-section-head">
        <h3>Add account</h3>
        <span>Local only</span>
      </div>
      <label class="sys-field"><span>Site</span><input name="site" type="text" required placeholder="Example: Notes"></label>
      <label class="sys-field"><span>Username</span><input name="username" type="text" required placeholder="Example: wes"></label>
      <label class="sys-field"><span>Password</span><input name="password" type="text" required placeholder="Example: moon-river"></label>
      <label class="sys-field"><span>Note</span><input name="note" type="text" placeholder="Optional note"></label>
      <div class="sys-button-row">
        <button type="submit" class="sys-button sys-button--primary">Add entry</button>
      </div>
    </form>
  `

  const search = left.querySelector<HTMLInputElement>('[data-password-search]')!
  const matches = left.querySelector<HTMLElement>('[data-password-matches]')!
  const count = left.querySelector<HTMLElement>('[data-password-count]')!
  const status = left.querySelector<HTMLElement>('[data-password-status]')!
  const list = left.querySelector<HTMLElement>('[data-password-list]')!
  const detail = right.querySelector<HTMLElement>('[data-password-detail]')!
  const form = right.querySelector<HTMLFormElement>('[data-password-form]')!
  const categoryList = left.querySelector<HTMLElement>('[data-password-categories]')!

  function filteredEntries() {
    const query = state.search.trim().toLowerCase()
    return state.entries.filter(entry => (
      (category === 'all' || (category === 'security' && entry.password.length < 12))
    ) && (
      !query
      || entry.site.toLowerCase().includes(query)
      || entry.username.toLowerCase().includes(query)
      || entry.note.toLowerCase().includes(query)
    ))
  }

  function select(id: string) {
    state.selected = id
    render()
  }

  function toggleReveal(id: string) {
    state.revealed = state.revealed.includes(id)
      ? state.revealed.filter(item => item !== id)
      : [id, ...state.revealed]
    render()
  }

  async function copyPassword(entry: PasswordEntry) {
    const text = entry.password
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        state.status = `${entry.site} password copied.`
      } else {
        state.status = `${entry.site} password ready to copy.`
      }
    } catch {
      state.status = `${entry.site} password ready to copy.`
    }
    status.textContent = state.status
    safeWrite(passwordsKey, state)
        renderDetail()
  }

  function addEntry(data: FormData) {
    const site = String(data.get('site') ?? '').trim()
    const username = String(data.get('username') ?? '').trim()
    const password = String(data.get('password') ?? '').trim()
    const note = String(data.get('note') ?? '').trim()
    if (!site || !username || !password) {
      state.status = 'Fill the required fields first.'
      status.textContent = state.status
      renderDetail()
      return
    }
    const entry: PasswordEntry = {
      id: uid(),
      site,
      username,
      password,
      note,
      createdAt: Date.now(),
    }
    state.entries = [entry, ...state.entries]
    state.selected = entry.id
    state.status = `${site} added to the simulated vault.`
    form.reset()
    render()
  }

  function renderList() {
    const categories = [
      ['all', 'All', state.entries.length],
      ['passkeys', 'Passkeys', 0],
      ['codes', 'Codes', 0],
      ['wifi', 'Wi-Fi', 0],
      ['security', 'Security', state.entries.filter(entry => entry.password.length < 12).length],
      ['deleted', 'Deleted', 0],
    ] as const
    categoryList.innerHTML = categories.map(([id, title, total]) => `
      <button type="button" class="sys-password-category" data-password-category="${id}" aria-pressed="${category === id}">
        <span class="sys-category-symbol sys-category-symbol--${id}">${systemSymbol(id)}</span>
        <strong>${total}</strong><span>${title}</span>
      </button>
    `).join('')
    categoryList.querySelectorAll<HTMLButtonElement>('[data-password-category]').forEach(button => {
      button.addEventListener('click', () => {
        category = button.dataset.passwordCategory!
        renderList()
      })
    })
    left.querySelector('[data-password-category-title]')!.textContent = categories.find(([id]) => id === category)?.[1] ?? 'All'
    const entries = filteredEntries()
    matches.textContent = String(entries.length)
    count.textContent = `${state.entries.length} total`
    status.textContent = state.status
    const rows = entries.map(entry => {
      const selected = entry.id === state.selected ? ' is-selected' : ''
      const revealed = state.revealed.includes(entry.id)
      return `
        <button type="button" class="sys-list-item${selected}" data-password-open="${escapeHtml(entry.id)}">
          <div class="sys-list-icon">${escapeHtml(entry.site.slice(0, 2).toUpperCase())}</div>
          <div class="sys-list-copy">
            <strong>${escapeHtml(entry.site)}</strong>
            <span>${escapeHtml(entry.username)}</span>
          </div>
          <div class="sys-list-price">
            <strong>${revealed ? escapeHtml(entry.password) : '••••••••'}</strong>
            <span>${escapeHtml(entry.note || 'Simulated entry')}</span>
          </div>
        </button>
      `
    }).join('')
    list.innerHTML = rows || `<p class="sys-empty">${category === 'all' || category === 'security' ? 'No matching accounts.' : 'No entries in this demo category.'}</p>`
    list.querySelectorAll<HTMLButtonElement>('[data-password-open]').forEach(button => {
      button.addEventListener('click', () => select(button.dataset.passwordOpen!))
    })
  }

  function renderDetail() {
    const entry = state.entries.find(item => item.id === state.selected) ?? state.entries[0]
    if (!entry) {
      detail.innerHTML = '<p class="sys-empty">Add a simulated account to get started.</p>'
      return
    }
    const revealed = state.revealed.includes(entry.id)
    detail.innerHTML = `
      <div class="sys-password-head">
        <div>
          <p class="sys-eyebrow">SIMULATED VAULT</p>
          <h3>${escapeHtml(entry.site)}</h3>
          <p class="sys-copy">${escapeHtml(entry.username)}</p>
        </div>
        <div class="sys-password-secret">${revealed ? escapeHtml(entry.password) : '••••••••'}</div>
      </div>
      <div class="sys-password-meta">
        <div><span>Note</span><strong>${escapeHtml(entry.note || 'No note saved')}</strong></div>
        <div><span>Created</span><strong>${new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</strong></div>
      </div>
      <div class="sys-button-row">
        <button type="button" class="sys-button" data-password-reveal>${revealed ? 'Hide' : 'Reveal'}</button>
        <button type="button" class="sys-button sys-button--primary" data-password-copy>Copy</button>
      </div>
      <p class="sys-status">${escapeHtml(state.status)}</p>
    `
    detail.querySelector('[data-password-reveal]')!.addEventListener('click', () => toggleReveal(entry.id))
    detail.querySelector('[data-password-copy]')!.addEventListener('click', () => { void copyPassword(entry) })
  }

  search.value = state.search
  search.addEventListener('input', () => {
    state.search = search.value
    safeWrite(passwordsKey, state)
    renderList()
  })

  form.addEventListener('submit', event => {
    event.preventDefault()
    addEntry(new FormData(form))
  })

  function render() {
    search.value = state.search
    safeWrite(passwordsKey, state)
    renderList()
    renderDetail()
  }

  render()
  return { left, right }
}

function renderSettings() {
  const state = createSettingsState()
  const left = document.createElement('section')
  left.className = 'sys-pane sys-settings-pane sys-settings-pane--left'
  const right = document.createElement('section')
  right.className = 'sys-pane sys-settings-pane sys-settings-pane--right'

  left.innerHTML = `
    <div class="sys-hero">
      <div>
        <h2>Settings</h2>
        <span class="visually-hidden" data-settings-current>General</span>
      </div>
    </div>
    <div class="sys-settings-account">
      <span class="sys-settings-avatar" aria-hidden="true">D</span>
      <div><strong>Duo</strong><span>Local demo device</span></div>
    </div>
    <div class="sys-section">
      <div class="sys-list" data-settings-sections></div>
    </div>
    <p class="sys-status">Demo preferences are saved on this device. They do not change system settings.</p>
  `

  right.innerHTML = `
    <div class="sys-card sys-settings-detail" data-settings-detail></div>
  `

  const current = left.querySelector<HTMLElement>('[data-settings-current]')!
  const sections = left.querySelector<HTMLElement>('[data-settings-sections]')!
  const detail = right.querySelector<HTMLElement>('[data-settings-detail]')!

  function setSection(section: string) {
    state.section = section
    render()
  }

  function setPreference(key: string, value: boolean | number) {
    state.prefs[key] = value
    safeWrite(settingsKey, state)
  }

  function togglePreference(key: string) {
    const next = !(Boolean(state.prefs[key]))
    state.prefs[key] = next
    renderDetail()
  }

  function renderSections() {
    sections.innerHTML = SETTINGS_SECTIONS.map(section => {
      const active = section.id === state.section ? ' is-selected' : ''
      return `
        <button type="button" class="sys-list-item${active}" data-settings-section="${escapeHtml(section.id)}">
          <div class="sys-list-icon sys-settings-icon--${section.id}">${systemSymbol(section.id)}</div>
          <div class="sys-list-copy">
            <strong>${escapeHtml(section.title)}</strong>
          </div>
          <span class="sys-chevron" aria-hidden="true">›</span>
        </button>
      `
    }).join('')
    sections.querySelectorAll<HTMLButtonElement>('[data-settings-section]').forEach(button => {
      button.addEventListener('click', () => setSection(button.dataset.settingsSection!))
    })
  }

  function renderDetail() {
    const section = SETTINGS_SECTIONS.find(item => item.id === state.section) ?? SETTINGS_SECTIONS[0]
    current.textContent = section.title
    const rows = section.items.map(item => {
      const value = state.prefs[item.key]
      if (item.key === 'brightness' || item.key === 'autoLock') {
        const sliderValue = typeof value === 'number' ? value : Number(value)
        return `
          <div class="sys-setting-row">
            <div class="sys-setting-copy">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.help)}</span>
            </div>
            <div class="sys-setting-control">
              <input type="range" min="${item.key === 'brightness' ? 10 : 1}" max="${item.key === 'brightness' ? 100 : 5}" step="1" value="${sliderValue}" data-setting-range="${escapeHtml(item.key)}" aria-label="${escapeHtml(item.label)}">
              <strong>${item.key === 'brightness' ? `${Math.round(sliderValue)}%` : `${Math.round(sliderValue)} min`}</strong>
            </div>
          </div>
        `
      }
      const pressed = Boolean(value) ? 'true' : 'false'
      return `
        <button type="button" class="sys-setting-row" data-setting-toggle="${escapeHtml(item.key)}" role="switch" aria-checked="${pressed}">
          <div class="sys-setting-copy">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.help)}</span>
          </div>
          <span class="sys-setting-switch" aria-hidden="true"></span>
        </button>
      `
    }).join('')
    detail.innerHTML = `
      <div class="sys-settings-head">
        <div>
          <p class="sys-settings-parent">Settings</p>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
      </div>
      <div class="sys-settings-list">${rows}</div>
      <p class="sys-copy">${escapeHtml(section.summary)}</p>
    `
    detail.querySelectorAll<HTMLButtonElement>('[data-setting-toggle]').forEach(button => {
      button.addEventListener('click', () => togglePreference(button.dataset.settingToggle!))
    })
    detail.querySelectorAll<HTMLInputElement>('[data-setting-range]').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.dataset.settingRange!
        const value = Number(input.value)
        setPreference(key, value)
        input.parentElement!.querySelector('strong')!.textContent = key === 'brightness' ? `${value}%` : `${value} min`
      })
    })
    safeWrite(settingsKey, state)
  }

  function render() {
    renderSections()
    renderDetail()
  }

  render()
  return { left, right }
}

function renderMagnifier() {
  const state = createMagnifierState()
  const left = document.createElement('section')
  left.className = 'sys-pane sys-magnifier-pane sys-magnifier-pane--left'
  const right = document.createElement('section')
  right.className = 'sys-pane sys-magnifier-pane sys-magnifier-pane--right'

  left.innerHTML = `
    <div class="sys-hero">
      <div>
        <h2>Magnifier</h2>
        <p class="sys-copy">A simulated live view with zoom, contrast, and freeze controls.</p>
      </div>
      <div class="sys-metric">
        <span>Status</span>
        <strong data-magnifier-status>Live</strong>
      </div>
    </div>
    <div class="sys-card sys-stack">
      <label class="sys-field">
        <span>Zoom</span>
        <input data-magnifier-zoom type="range" min="1" max="4" step="0.1" aria-label="Magnifier zoom">
      </label>
      <label class="sys-field">
        <span>Contrast</span>
        <input data-magnifier-contrast type="range" min="0.6" max="1.8" step="0.02" aria-label="Magnifier contrast">
      </label>
      <div class="sys-button-row">
        <button type="button" class="sys-button sys-button--primary" data-magnifier-freeze>Freeze frame</button>
        <button type="button" class="sys-button" data-magnifier-reset>Reset</button>
      </div>
    </div>
    <div class="sys-card sys-note">
      <strong>Simulated view:</strong>
      <span>The scene is generated locally and the freeze control pauses motion.</span>
    </div>
  `

  right.innerHTML = `
    <div class="sys-magnifier-view" data-magnifier-view>
      <div class="sys-magnifier-scene">
        <article class="sys-magnifier-paper"><small>READING SAMPLE</small><strong>The small<br>things matter.</strong><p>Bring the details into focus.</p><p>Adjust zoom and contrast to make this sample easier to read.</p></article>
      </div>
      <div class="sys-magnifier-overlay" aria-hidden="true">
        <span></span><span></span>
      </div>
      <div class="sys-magnifier-label">Simulated live view</div>
    </div>
  `

  const status = left.querySelector<HTMLElement>('[data-magnifier-status]')!
  const zoom = left.querySelector<HTMLInputElement>('[data-magnifier-zoom]')!
  const contrast = left.querySelector<HTMLInputElement>('[data-magnifier-contrast]')!
  const freeze = left.querySelector<HTMLButtonElement>('[data-magnifier-freeze]')!
  const view = right.querySelector<HTMLElement>('[data-magnifier-view]')!

  function apply() {
    zoom.value = String(state.zoom)
    contrast.value = String(state.contrast)
    right.style.setProperty('--sys-zoom', String(state.zoom))
    right.style.setProperty('--sys-contrast', String(state.contrast))
    view.dataset.frozen = String(state.frozen)
    status.textContent = state.frozen ? 'Frozen' : 'Live'
    freeze.textContent = state.frozen ? 'Resume live view' : 'Freeze frame'
    safeWrite(magnifierKey, state)
  }

  zoom.addEventListener('input', () => {
    state.zoom = clamp(Number(zoom.value), 1, 4)
    apply()
  })

  contrast.addEventListener('input', () => {
    state.contrast = clamp(Number(contrast.value), 0.6, 1.8)
    apply()
  })

  freeze.addEventListener('click', () => {
    state.frozen = !state.frozen
    apply()
  })

  right.addEventListener('pointerdown', () => {
    if (!state.frozen) return
    state.frozen = true
    apply()
  })

  left.querySelector('[data-magnifier-reset]')!.addEventListener('click', () => {
    state.zoom = DEFAULT_MAGNIFIER.zoom
    state.contrast = DEFAULT_MAGNIFIER.contrast
    state.frozen = false
    apply()
  })

  view.addEventListener('pointerdown', () => {
    state.frozen = !state.frozen
    apply()
  })

  apply()
  return { left, right }
}

const compassApp: PhoneApp = {
  id: 'compass',
  name: 'Compass',
  icon: '🧭',
  color: COLORS.compass,
  create() {
    return renderCompass()
  },
}

const measureApp: PhoneApp = {
  id: 'measure',
  name: 'Measure',
  icon: '📏',
  color: COLORS.measure,
  create() {
    return renderMeasure()
  },
}

const stocksApp: PhoneApp = {
  id: 'stocks',
  name: 'Stocks',
  icon: '◴',
  color: COLORS.stocks,
  create() {
    return renderStocks()
  },
}

const newsApp: PhoneApp = {
  id: 'news',
  name: 'News',
  icon: '📰',
  color: COLORS.news,
  create() {
    return renderNews()
  },
}

const passwordsApp: PhoneApp = {
  id: 'passwords',
  name: 'Passwords',
  icon: '🔐',
  color: COLORS.passwords,
  create() {
    return renderPasswords()
  },
}

const settingsApp: PhoneApp = {
  id: 'settings',
  name: 'Settings',
  icon: '⚙︎',
  color: COLORS.settings,
  create() {
    return renderSettings()
  },
}

const magnifierApp: PhoneApp = {
  id: 'magnifier',
  name: 'Magnifier',
  icon: '🔍',
  color: COLORS.magnifier,
  create() {
    return renderMagnifier()
  },
}

export const systemApps: PhoneApp[] = [
  compassApp,
  measureApp,
  stocksApp,
  newsApp,
  passwordsApp,
  settingsApp,
  magnifierApp,
]
