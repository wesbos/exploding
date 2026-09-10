import './internet.css'
import type { PhoneApp } from './types'

type MailFolder = 'inbox' | 'sent' | 'drafts' | 'archive'
type BrowserView = { kind: 'page'; url: string } | { kind: 'results'; query: string }
type TravelMode = 'walk' | 'drive' | 'transit'

interface MailMessage {
  id: string
  from: string
  to: string
  body: string
  createdAt: number
  direction: 'inbound' | 'outbound'
  read: boolean
}

interface MailThread {
  id: string
  contact: string
  email: string
  subject: string
  archived: boolean
  messages: MailMessage[]
}

interface MailDraft {
  to: string
  subject: string
  body: string
  threadId: string | null
  updatedAt: number
}

interface MailState {
  threads: MailThread[]
  draft: MailDraft
  selectedThreadId: string | null
  folder: MailFolder
  search: string
}

interface BrowserPage {
  id: string
  url: string
  title: string
  subtitle: string
  summary: string
  sections: Array<{ heading: string; body: string; bullets?: string[] }>
  links: Array<{ label: string; target: string }>
  tags: string[]
}

interface BrowserState {
  bookmarks: string[]
  history: string[]
  historyIndex: number
  search: string
  view: BrowserView
}

interface Place {
  id: string
  name: string
  category: string
  address: string
  neighborhood: string
  summary: string
  hours: string
  tags: string[]
  x: number
  y: number
}

interface MapState {
  search: string
  selectedPlaceId: string
  originId: string
  mode: TravelMode
  favorites: string[]
}

interface Origin {
  id: string
  name: string
  x: number
  y: number
}

interface CityForecastDay {
  day: string
  condition: string
  icon: string
  high: number
  low: number
  precipitation: string
}

interface HourForecast {
  time: string
  condition: string
  icon: string
  temp: number
}

interface CityWeather {
  id: string
  name: string
  region: string
  condition: string
  icon: string
  temp: number
  feelsLike: number
  humidity: number
  wind: number
  uv: number
  summary: string
  hourly: HourForecast[]
  forecast: CityForecastDay[]
}

interface WeatherState {
  selectedCityId: string
  search: string
  favorites: string[]
}

const MAIL_KEY = 'phone-duo-mail'
const BROWSER_KEY = 'phone-duo-safari'
const MAPS_KEY = 'phone-duo-maps'
const WEATHER_KEY = 'phone-duo-weather'

const START = Date.now()
const HOUR = 3_600_000
const DAY = 86_400_000

function uid() {
  return crypto.randomUUID()
}

function formatShortDate(timestamp: number) {
  const date = new Date(timestamp)
  const today = new Date()
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatMiles(miles: number) {
  return miles < 1 ? `${Math.max(1, Math.round(miles * 5280))} ft` : `${miles.toFixed(miles < 10 ? 1 : 0)} mi`
}

function formatMinutes(minutes: number) {
  return `${Math.max(1, Math.round(minutes))} min`
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] ?? char)
  )
}

function escapeAttr(value: string) {
  return escapeHtml(value)
}

function safeRead<T>(key: string, fallback: T, guard: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const value: unknown = JSON.parse(raw)
    return guard(value) ? value : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function hasNonEmptyText(value: string) {
  return value.trim().length > 0
}

function internetSymbol(name: 'back' | 'forward' | 'reload' | 'bookmark' | 'compose' | 'reply' | 'archive' | 'plus' | 'check') {
  const paths = {
    back: '<path d="m15 4-8 8 8 8"/>',
    forward: '<path d="m9 4 8 8-8 8"/>',
    reload: '<path d="M20 10a8 8 0 1 0-1 7M20 3v7h-7"/>',
    bookmark: '<path d="M12 5c-3-2-6-2-10-1v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v16"/>',
    compose: '<path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8M10 14l1-4L20 1l3 3-9 9Z"/>',
    reply: '<path d="m10 5-8 7 8 7v-5c7 0 10 2 12 6-1-9-5-12-12-12Z"/>',
    archive: '<path d="M4 8v13h16V8M2 3h20v5H2Zm7 9h6"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
  }
  return `<svg class="internet-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`
}

function weatherSymbol(icon: string, condition: string) {
  const sun = '<g stroke="#ffd75e" fill="#ffd75e"><circle cx="16" cy="15" r="5"/><path d="M16 5V2m0 26v-3M6 15H3m26 0h-3M9 8 7 6m18 18-2-2M9 22l-2 2M25 6l-2 2" fill="none"/></g>'
  const cloud = '<path d="M8 24a6 6 0 0 1-1-12 8 8 0 0 1 15-2 7 7 0 1 1 3 14Z" fill="#fff" stroke="none"/>'
  let shape = cloud
  if (icon === '🌙') shape = '<path d="M25 22A13 13 0 0 1 11 3a13 13 0 1 0 14 19" fill="#fff" stroke="none"/>'
  else if (['☀️', '🔥'].includes(icon)) shape = sun
  else if (['💨', '🌬️'].includes(icon)) shape = '<path d="M2 10h20a4 4 0 1 0-4-4M2 16h27a3 3 0 1 1-3 3M4 23h12a3 3 0 1 1-3 3" stroke="#fff" fill="none"/>'
  else if (['🌫️', '🌁'].includes(icon)) shape = `${cloud}<path d="M4 28h24M8 32h17" stroke="#d5e4f1"/>`
  else if (['🌤️', '⛅'].includes(icon)) shape = `${sun}<g transform="translate(3 4) scale(.85)">${cloud}</g>`
  else if (['🌦️', '🌧️', '⛈️'].includes(icon)) shape = `${cloud}<path d="m10 28-2 4m10-4-2 4m10-4-2 4" stroke="#89d7ff"/>${icon === '⛈️' ? '<path d="m18 19-6 9h5l-3 7 10-12h-6Z" fill="#ffdb63" stroke="none"/>' : ''}`
  return `<svg class="internet-weather-symbol" viewBox="0 0 36 36" role="img" aria-label="${escapeAttr(condition)}" stroke-width="2" stroke-linecap="round">${shape}</svg>`
}

function preserveSearchFocus(root: HTMLElement, render: () => void) {
  const input = root.querySelector<HTMLInputElement>('input[type="search"]')
  const focused = input === document.activeElement
  const start = input?.selectionStart ?? null
  const end = input?.selectionEnd ?? null
  render()
  if (focused) {
    const next = root.querySelector<HTMLInputElement>('input[type="search"]')
    next?.focus({ preventScroll: true })
    if (start !== null && end !== null) next?.setSelectionRange(start, end)
  }
}

function createMailSeed(): MailState {
  const now = START
  return {
    folder: 'inbox',
    search: '',
    selectedThreadId: null,
    draft: { to: '', subject: '', body: '', threadId: null, updatedAt: now },
    threads: [
      {
        id: uid(),
        contact: 'Avery Park',
        email: 'avery@duo.local',
        subject: 'Your Duo is ready',
        archived: false,
        messages: [
          {
            id: uid(),
            from: 'Avery Park <avery@duo.local>',
            to: 'you@duo.local',
            body: 'Welcome aboard. Your little pocket computer is set up and waiting on the desk.\n\nTry Mail first, then leave yourself a note so you can see how the fold feels.',
            createdAt: now - 5 * DAY,
            direction: 'inbound',
            read: false,
          },
        ],
      },
      {
        id: uid(),
        contact: 'Mina Ray',
        email: 'mina@duo.local',
        subject: 'Dinner later?',
        archived: false,
        messages: [
          {
            id: uid(),
            from: 'Mina Ray <mina@duo.local>',
            to: 'you@duo.local',
            body: 'I found a new noodle spot near the river. If you are free tonight, I will book the corner table.',
            createdAt: now - 2 * DAY,
            direction: 'inbound',
            read: true,
          },
          {
            id: uid(),
            from: 'You <you@duo.local>',
            to: 'Mina Ray <mina@duo.local>',
            body: 'Count me in. Send the time and I will be there.',
            createdAt: now - 2 * DAY + 14 * HOUR,
            direction: 'outbound',
            read: true,
          },
        ],
      },
      {
        id: uid(),
        contact: 'Theo Lane',
        email: 'theo@studio.local',
        subject: 'Photo walk picks',
        archived: false,
        messages: [
          {
            id: uid(),
            from: 'Theo Lane <theo@studio.local>',
            to: 'you@duo.local',
            body: 'I sorted the gallery from Saturday. The last three frames are the strongest; I dropped the rest into the archive.',
            createdAt: now - DAY,
            direction: 'inbound',
            read: true,
          },
          {
            id: uid(),
            from: 'You <you@duo.local>',
            to: 'Theo Lane <theo@studio.local>',
            body: 'Perfect. I will review them after lunch and send notes back.',
            createdAt: now - DAY + 5 * HOUR,
            direction: 'outbound',
            read: true,
          },
        ],
      },
      {
        id: uid(),
        contact: 'Build Bot',
        email: 'build@duo.local',
        subject: 'Weekly status',
        archived: true,
        messages: [
          {
            id: uid(),
            from: 'Build Bot <build@duo.local>',
            to: 'you@duo.local',
            body: 'All checks are green. The release preview was generated overnight and the staging badge is still smiling.',
            createdAt: now - 8 * DAY,
            direction: 'inbound',
            read: true,
          },
        ],
      },
    ],
  }
}

function isMailState(value: unknown): value is MailState {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return Array.isArray(record.threads) && typeof record.folder === 'string' && typeof record.search === 'string' && typeof record.selectedThreadId !== 'undefined' && typeof record.draft === 'object' && record.draft !== null
}

function loadMailState() {
  const state = safeRead(MAIL_KEY, createMailSeed(), isMailState)
  if (!state.draft.updatedAt) state.draft.updatedAt = START
  return state
}

function saveMailState(state: MailState) {
  safeWrite(MAIL_KEY, state)
}

function threadPreview(thread: MailThread) {
  const lastMessage = thread.messages[thread.messages.length - 1]
  return lastMessage?.body.replace(/\s+/g, ' ').slice(0, 92) || 'No messages yet'
}

function createBrowserPages(): BrowserPage[] {
  return [
    {
      id: 'home',
      url: 'duo://home',
      title: 'Duo Start',
      subtitle: 'Your local web, organized',
      summary: 'A tiny browser with no network and plenty of room for curiosity.',
      sections: [
        { heading: 'What this browser does', body: 'It keeps a local page cache, history, bookmarks, and search. Every page you visit lives right here on the device.' },
        { heading: 'Try these pages', body: 'Open the local atlas, a recipe notebook, or the help desk without ever leaving the machine.', bullets: ['duo://atlas', 'duo://recipes', 'duo://support'] },
      ],
      links: [
        { label: 'Open Atlas', target: 'duo://atlas' },
        { label: 'Recipes', target: 'duo://recipes' },
        { label: 'Support', target: 'duo://support' },
      ],
      tags: ['home', 'start', 'local'],
    },
    {
      id: 'atlas',
      url: 'duo://atlas',
      title: 'Local Atlas',
      subtitle: 'Tiny guides for a nearby life',
      summary: 'Neighborhood notes, transit hints, and a clean place to browse around.',
      sections: [
        { heading: 'Morning loop', body: 'Start at the river, stop for coffee, then come back through the market before the crowds wake up.' },
        { heading: 'Quick facts', body: 'The whole atlas is offline-first, so every link opens instantly and the search box keeps a visit trail.' },
      ],
      links: [
        { label: 'Recipes', target: 'duo://recipes' },
        { label: 'Garden guide', target: 'duo://garden' },
        { label: 'Support', target: 'duo://support' },
      ],
      tags: ['maps', 'guide', 'travel', 'local'],
    },
    {
      id: 'recipes',
      url: 'duo://recipes',
      title: 'Weeknight Recipes',
      subtitle: 'Fast meals, calm evenings',
      summary: 'A compact page of dinner ideas with just enough detail to get cooking.',
      sections: [
        { heading: 'Tonight', body: 'Lemon rice, blistered greens, and a pan of tofu or chicken seasoned with garlic and ginger.' },
        { heading: 'Make it easy', body: 'Keep a short grocery list, reuse the same pan, and store leftovers in one labeled box.' },
      ],
      links: [
        { label: 'Home', target: 'duo://home' },
        { label: 'Garden guide', target: 'duo://garden' },
        { label: 'Support', target: 'duo://support' },
      ],
      tags: ['food', 'dinner', 'cook', 'guide'],
    },
    {
      id: 'garden',
      url: 'duo://garden',
      title: 'Garden Guide',
      subtitle: 'Light, water, repeat',
      summary: 'A small reference page for herbs, windowsills, and the sort of things that like attention.',
      sections: [
        { heading: 'Best starter plants', body: 'Basil, mint, thyme, and parsley all forgive the occasional missed watering.' },
        { heading: 'Habit', body: 'Check the leaves in the morning, trim what is growing too fast, and rotate the pot toward the light.' },
      ],
      links: [
        { label: 'Atlas', target: 'duo://atlas' },
        { label: 'Home', target: 'duo://home' },
        { label: 'Support', target: 'duo://support' },
      ],
      tags: ['plants', 'home', 'care', 'growth'],
    },
    {
      id: 'support',
      url: 'duo://support',
      title: 'Offline Support',
      subtitle: 'Help that fits in your pocket',
      summary: 'A local help page for the browser, with no remote calls and a tidy trail of recent pages.',
      sections: [
        { heading: 'Search tips', body: 'Use exact page names for instant opens or type a topic to get a local list of matches.' },
        { heading: 'History', body: 'Back and forward stay in memory, and bookmarks can be pinned with one tap.' },
      ],
      links: [
        { label: 'Home', target: 'duo://home' },
        { label: 'Atlas', target: 'duo://atlas' },
        { label: 'Recipes', target: 'duo://recipes' },
      ],
      tags: ['help', 'browser', 'history', 'bookmarks'],
    },
  ]
}

const browserPages = createBrowserPages()
const browserPageMap = new Map(browserPages.map(page => [page.id, page]))
const browserUrlMap = new Map(browserPages.map(page => [page.url, page]))

function isBrowserState(value: unknown): value is BrowserState {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return Array.isArray(record.bookmarks) && Array.isArray(record.history) && typeof record.historyIndex === 'number' && typeof record.search === 'string' && typeof record.view === 'object' && record.view !== null
}

function loadBrowserState(): BrowserState {
  const state = safeRead(BROWSER_KEY, {
    bookmarks: ['home'],
    history: ['duo://home'],
    historyIndex: 0,
    search: '',
    view: { kind: 'page', url: 'duo://home' },
  }, isBrowserState)
  state.bookmarks = state.bookmarks.map(url => browserPageMap.get(url)?.url ?? url)
  return state
}

function saveBrowserState(state: BrowserState) {
  safeWrite(BROWSER_KEY, state)
}

function resolveBrowserPage(input: string) {
  const value = normalize(input)
  if (!value) return null
  const direct = browserUrlMap.get(input.trim()) ?? browserPageMap.get(value)
  if (direct) return direct
  for (const page of browserPages) {
    if (normalize(page.title) === value || normalize(page.subtitle) === value) return page
  }
  return browserPages.find(page => page.tags.some(tag => normalize(tag) === value)) ?? browserPages.find(page => normalize(page.title).includes(value) || normalize(page.summary).includes(value) || page.tags.some(tag => normalize(tag).includes(value))) ?? null
}

function searchBrowserPages(query: string) {
  const value = normalize(query)
  if (!value) return browserPages
  return browserPages
    .map(page => {
      let score = 0
      if (normalize(page.title) === value) score += 100
      if (normalize(page.url) === value) score += 100
      if (normalize(page.title).includes(value)) score += 40
      if (normalize(page.subtitle).includes(value)) score += 20
      if (normalize(page.summary).includes(value)) score += 15
      score += page.tags.filter(tag => normalize(tag).includes(value)).length * 12
      score += page.sections.reduce((total, section) => total + (normalize(section.heading).includes(value) ? 10 : 0) + (normalize(section.body).includes(value) ? 4 : 0), 0)
      return { page, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.page)
}

function createMapState(): MapState {
  return {
    search: '',
    selectedPlaceId: places[0].id,
    originId: origins[0].id,
    mode: 'walk',
    favorites: [places[0].id],
  }
}

const origins: Origin[] = [
  { id: 'studio', name: 'Studio', x: 34, y: 22 },
  { id: 'home', name: 'Home Base', x: 18, y: 68 },
  { id: 'station', name: 'Central Station', x: 51, y: 49 },
  { id: 'loft', name: 'Harbor Loft', x: 74, y: 62 },
]

const places: Place[] = [
  { id: 'riverwalk', name: 'Riverwalk Park', category: 'Park', address: '12 River St', neighborhood: 'North Bend', summary: 'A broad path with benches, shade, and a clean view of the water.', hours: 'Open daily · dawn to 10 pm', tags: ['walk', 'water', 'green'], x: 67, y: 73 },
  { id: 'market', name: 'Green Street Market', category: 'Market', address: '41 Green St', neighborhood: 'Old Quarter', summary: 'Produce, flowers, and a small bakery counter that smells impossible to ignore.', hours: 'Tue–Sun · 8 am to 6 pm', tags: ['food', 'shopping', 'local'], x: 41, y: 46 },
  { id: 'library', name: 'City Library', category: 'Library', address: '8 Archive Ave', neighborhood: 'Civic Center', summary: 'Quiet reading rooms and a sunny corner table made for afternoon work.', hours: 'Mon–Sat · 9 am to 8 pm', tags: ['books', 'quiet', 'study'], x: 53, y: 39 },
  { id: 'pier', name: 'Sunset Pier', category: 'Viewpoint', address: 'Pier 7', neighborhood: 'Harbor', summary: 'Long light, open sky, and a place to stand still for a minute.', hours: 'Open daily · all hours', tags: ['view', 'sunset', 'water'], x: 84, y: 88 },
  { id: 'garden', name: 'Garden District', category: 'Neighborhood', address: '10 Laurel Walk', neighborhood: 'West Side', summary: 'Tree-lined streets with bright porches and a good chance of finding a snack.', hours: 'Always open', tags: ['neighborhood', 'trees', 'stroll'], x: 24, y: 61 },
  { id: 'cafe', name: 'Skyline Cafe', category: 'Cafe', address: '19 Highline Rd', neighborhood: 'South Ridge', summary: 'A bright counter, a strong espresso machine, and enough outlets to stay a while.', hours: 'Daily · 7 am to 4 pm', tags: ['coffee', 'work', 'wifi'], x: 61, y: 31 },
  { id: 'station', name: 'Transit Hub', category: 'Transit', address: '100 Platform Ln', neighborhood: 'Central', summary: 'The busiest transfer point in town with easy connections in every direction.', hours: 'Daily · 5 am to midnight', tags: ['train', 'bus', 'transfer'], x: 50, y: 51 },
  { id: 'mosaic', name: 'Mosaic Gallery', category: 'Gallery', address: '27 Frame Ct', neighborhood: 'Arts Row', summary: 'Small, quiet rooms with rotating exhibits and a shop full of art books.', hours: 'Wed–Sun · 11 am to 6 pm', tags: ['art', 'indoor', 'gallery'], x: 74, y: 40 },
]

function isMapState(value: unknown): value is MapState {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.search === 'string' && typeof record.selectedPlaceId === 'string' && typeof record.originId === 'string' && typeof record.mode === 'string' && Array.isArray(record.favorites)
}

function loadMapState() {
  const state = safeRead(MAPS_KEY, createMapState(), isMapState)
  if (!places.some(place => place.id === state.selectedPlaceId)) state.selectedPlaceId = places[0].id
  if (!origins.some(origin => origin.id === state.originId)) state.originId = origins[0].id
  if (!['walk', 'drive', 'transit'].includes(state.mode)) state.mode = 'walk'
  state.favorites = state.favorites.filter(id => places.some(place => place.id === id))
  if (!state.favorites.length) state.favorites = [state.selectedPlaceId]
  return state
}

function saveMapState(state: MapState) {
  safeWrite(MAPS_KEY, state)
}

function createWeatherCities(): CityWeather[] {
  const baseDay = new Date(START)
  const dayNames = Array.from({ length: 5 }, (_, index) => new Date(baseDay.getTime() + index * DAY).toLocaleDateString([], { weekday: 'short' }))
  return [
    {
      id: 'seattle',
      name: 'Seattle',
      region: 'Washington',
      condition: 'Light rain',
      icon: '🌦️',
      temp: 63,
      feelsLike: 61,
      humidity: 74,
      wind: 8,
      uv: 2,
      summary: 'Clouds break late in the day with a cool breeze and a bright patch near sunset.',
      hourly: [
        { time: 'Now', condition: 'Rain', icon: '🌦️', temp: 63 },
        { time: '3 PM', condition: 'Cloudy', icon: '☁️', temp: 64 },
        { time: '6 PM', condition: 'Clear', icon: '🌤️', temp: 61 },
        { time: '9 PM', condition: 'Clear', icon: '🌙', temp: 57 },
        { time: '12 AM', condition: 'Fog', icon: '🌫️', temp: 55 },
        { time: '3 AM', condition: 'Fog', icon: '🌫️', temp: 53 },
      ],
      forecast: [
        { day: dayNames[0], condition: 'Rain', icon: '🌦️', high: 65, low: 56, precipitation: '42%' },
        { day: dayNames[1], condition: 'Partly cloudy', icon: '⛅', high: 68, low: 55, precipitation: '18%' },
        { day: dayNames[2], condition: 'Sunny break', icon: '🌤️', high: 71, low: 57, precipitation: '8%' },
        { day: dayNames[3], condition: 'Drizzle', icon: '🌦️', high: 67, low: 54, precipitation: '35%' },
        { day: dayNames[4], condition: 'Cloudy', icon: '☁️', high: 66, low: 53, precipitation: '14%' },
      ],
    },
    {
      id: 'san-francisco',
      name: 'San Francisco',
      region: 'California',
      condition: 'Fog lifting',
      icon: '🌁',
      temp: 68,
      feelsLike: 67,
      humidity: 62,
      wind: 12,
      uv: 5,
      summary: 'A cool morning gives way to clear blue by midafternoon with brisk bay air.',
      hourly: [
        { time: 'Now', condition: 'Fog', icon: '🌁', temp: 66 },
        { time: '3 PM', condition: 'Clear', icon: '🌤️', temp: 69 },
        { time: '6 PM', condition: 'Sunny', icon: '☀️', temp: 68 },
        { time: '9 PM', condition: 'Windy', icon: '💨', temp: 63 },
        { time: '12 AM', condition: 'Clear', icon: '🌙', temp: 60 },
        { time: '3 AM', condition: 'Fog', icon: '🌁', temp: 58 },
      ],
      forecast: [
        { day: dayNames[0], condition: 'Fog', icon: '🌁', high: 69, low: 58, precipitation: '5%' },
        { day: dayNames[1], condition: 'Sunny', icon: '☀️', high: 72, low: 57, precipitation: '0%' },
        { day: dayNames[2], condition: 'Breezy', icon: '💨', high: 70, low: 56, precipitation: '2%' },
        { day: dayNames[3], condition: 'Clear', icon: '🌤️', high: 73, low: 58, precipitation: '0%' },
        { day: dayNames[4], condition: 'Mild', icon: '☀️', high: 71, low: 57, precipitation: '3%' },
      ],
    },
    {
      id: 'austin',
      name: 'Austin',
      region: 'Texas',
      condition: 'Hot and bright',
      icon: '☀️',
      temp: 92,
      feelsLike: 97,
      humidity: 41,
      wind: 10,
      uv: 9,
      summary: 'Heat sticks around through the afternoon with a possible pop-up storm after dinner.',
      hourly: [
        { time: 'Now', condition: 'Sunny', icon: '☀️', temp: 92 },
        { time: '3 PM', condition: 'Hot', icon: '🔥', temp: 95 },
        { time: '6 PM', condition: 'Clouds building', icon: '⛅', temp: 91 },
        { time: '9 PM', condition: 'Storm chance', icon: '⛈️', temp: 85 },
        { time: '12 AM', condition: 'Warm', icon: '🌙', temp: 80 },
        { time: '3 AM', condition: 'Clear', icon: '🌙', temp: 77 },
      ],
      forecast: [
        { day: dayNames[0], condition: 'Sunny', icon: '☀️', high: 94, low: 77, precipitation: '8%' },
        { day: dayNames[1], condition: 'Hot', icon: '🔥', high: 96, low: 78, precipitation: '12%' },
        { day: dayNames[2], condition: 'Storm chance', icon: '⛈️', high: 91, low: 75, precipitation: '41%' },
        { day: dayNames[3], condition: 'Sunny', icon: '☀️', high: 93, low: 76, precipitation: '9%' },
        { day: dayNames[4], condition: 'Warm', icon: '🌤️', high: 89, low: 74, precipitation: '10%' },
      ],
    },
    {
      id: 'chicago',
      name: 'Chicago',
      region: 'Illinois',
      condition: 'Breezy',
      icon: '🌬️',
      temp: 71,
      feelsLike: 69,
      humidity: 55,
      wind: 19,
      uv: 4,
      summary: 'A lively wind keeps the lake air moving while clouds drift through the afternoon.',
      hourly: [
        { time: 'Now', condition: 'Breezy', icon: '🌬️', temp: 71 },
        { time: '3 PM', condition: 'Partly cloudy', icon: '⛅', temp: 72 },
        { time: '6 PM', condition: 'Clear', icon: '🌤️', temp: 68 },
        { time: '9 PM', condition: 'Windy', icon: '💨', temp: 64 },
        { time: '12 AM', condition: 'Cool', icon: '🌙', temp: 61 },
        { time: '3 AM', condition: 'Clear', icon: '🌙', temp: 59 },
      ],
      forecast: [
        { day: dayNames[0], condition: 'Breezy', icon: '🌬️', high: 72, low: 61, precipitation: '9%' },
        { day: dayNames[1], condition: 'Clouds', icon: '☁️', high: 70, low: 58, precipitation: '14%' },
        { day: dayNames[2], condition: 'Sunny', icon: '☀️', high: 74, low: 60, precipitation: '5%' },
        { day: dayNames[3], condition: 'Windy', icon: '💨', high: 73, low: 59, precipitation: '7%' },
        { day: dayNames[4], condition: 'Clear', icon: '🌤️', high: 71, low: 58, precipitation: '4%' },
      ],
    },
    {
      id: 'new-york',
      name: 'New York',
      region: 'New York',
      condition: 'Humid sun',
      icon: '🌤️',
      temp: 79,
      feelsLike: 84,
      humidity: 66,
      wind: 7,
      uv: 7,
      summary: 'Warm and muggy with bright spells, a quick evening shower, and a calmer night.',
      hourly: [
        { time: 'Now', condition: 'Humid', icon: '🌤️', temp: 79 },
        { time: '3 PM', condition: 'Bright', icon: '☀️', temp: 82 },
        { time: '6 PM', condition: 'Showers', icon: '🌧️', temp: 76 },
        { time: '9 PM', condition: 'Cloudy', icon: '☁️', temp: 73 },
        { time: '12 AM', condition: 'Clear', icon: '🌙', temp: 70 },
        { time: '3 AM', condition: 'Fog', icon: '🌫️', temp: 68 },
      ],
      forecast: [
        { day: dayNames[0], condition: 'Humid sun', icon: '🌤️', high: 82, low: 71, precipitation: '20%' },
        { day: dayNames[1], condition: 'Showers', icon: '🌧️', high: 78, low: 69, precipitation: '43%' },
        { day: dayNames[2], condition: 'Clear', icon: '🌙', high: 80, low: 68, precipitation: '12%' },
        { day: dayNames[3], condition: 'Warm', icon: '☀️', high: 84, low: 72, precipitation: '15%' },
        { day: dayNames[4], condition: 'Cloudy', icon: '☁️', high: 79, low: 70, precipitation: '24%' },
      ],
    },
    {
      id: 'denver',
      name: 'Denver',
      region: 'Colorado',
      condition: 'High clouds',
      icon: '⛅',
      temp: 75,
      feelsLike: 73,
      humidity: 34,
      wind: 14,
      uv: 8,
      summary: 'Dry air, long light, and a thundercloud building somewhere over the foothills.',
      hourly: [
        { time: 'Now', condition: 'Bright', icon: '☀️', temp: 75 },
        { time: '3 PM', condition: 'Clouds', icon: '⛅', temp: 76 },
        { time: '6 PM', condition: 'Storm hint', icon: '⛈️', temp: 72 },
        { time: '9 PM', condition: 'Clear', icon: '🌙', temp: 66 },
        { time: '12 AM', condition: 'Clear', icon: '🌙', temp: 61 },
        { time: '3 AM', condition: 'Cool', icon: '🌙', temp: 57 },
      ],
      forecast: [
        { day: dayNames[0], condition: 'Sunny', icon: '☀️', high: 77, low: 58, precipitation: '6%' },
        { day: dayNames[1], condition: 'Windy', icon: '💨', high: 74, low: 55, precipitation: '9%' },
        { day: dayNames[2], condition: 'Storm hint', icon: '⛈️', high: 72, low: 54, precipitation: '31%' },
        { day: dayNames[3], condition: 'Sunny', icon: '☀️', high: 76, low: 56, precipitation: '4%' },
        { day: dayNames[4], condition: 'Mild', icon: '⛅', high: 73, low: 55, precipitation: '7%' },
      ],
    },
  ]
}

const weatherCities = createWeatherCities()
const weatherCityMap = new Map(weatherCities.map(city => [city.id, city]))

function isWeatherState(value: unknown): value is WeatherState {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.selectedCityId === 'string' && typeof record.search === 'string' && Array.isArray(record.favorites)
}

function loadWeatherState() {
  const state = safeRead(WEATHER_KEY, {
    selectedCityId: weatherCities[0].id,
    search: '',
    favorites: [weatherCities[0].id],
  }, isWeatherState)
  if (!weatherCityMap.has(state.selectedCityId)) state.selectedCityId = weatherCities[0].id
  state.favorites = state.favorites.filter(id => weatherCityMap.has(id))
  if (!state.favorites.length) state.favorites = [state.selectedCityId]
  return state
}

function saveWeatherState(state: WeatherState) {
  safeWrite(WEATHER_KEY, state)
}

function createMailApp(): PhoneApp {
  return {
    id: 'mail',
    name: 'Mail',
    icon: '✉',
    color: '#007aff',
    create() {
      const state = loadMailState()
      let status = 'Ready'
      const left = document.createElement('section')
      left.className = 'internet-app internet-mail-left'
      const right = document.createElement('section')
      right.className = 'internet-app internet-mail-right'

      function selectedThread() {
        return state.threads.find(thread => thread.id === state.selectedThreadId) ?? null
      }

      function unreadCount(thread: MailThread) {
        return thread.messages.filter(message => message.direction === 'inbound' && !message.read).length
      }

      function filteredThreads() {
        const value = normalize(state.search)
        return state.threads.filter(thread => {
          const mode = state.folder
          const matchesFolder = mode === 'archive'
            ? thread.archived
            : mode === 'sent'
              ? thread.messages.some(message => message.direction === 'outbound')
              : mode === 'drafts'
                ? false
                : !thread.archived
          const matchesSearch = !value || [thread.contact, thread.email, thread.subject, ...thread.messages.map(message => message.body)].some(text => normalize(text).includes(value))
          return matchesFolder && matchesSearch
        })
      }

      function persist() {
        saveMailState(state)
      }

      function setStatus(next: string) {
        status = next
        render()
      }

      function selectThread(id: string) {
        state.selectedThreadId = id
        const thread = selectedThread()
        if (thread) thread.messages.forEach(message => { if (message.direction === 'inbound') message.read = true })
        const lastDirection = thread?.messages[thread.messages.length - 1]?.direction
        state.folder = thread?.archived ? 'archive' : lastDirection === 'outbound' ? 'sent' : 'inbox'
        persist()
        render()
      }

      function openReply(thread: MailThread) {
        state.draft = {
          to: thread.email,
          subject: thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
          body: '',
          threadId: thread.id,
          updatedAt: Date.now(),
        }
        state.selectedThreadId = thread.id
        const lastDirection = thread.messages[thread.messages.length - 1]?.direction
        state.folder = thread.archived ? 'archive' : lastDirection === 'outbound' ? 'sent' : 'inbox'
        persist()
        render()
      }

      function startNewMessage() {
        state.selectedThreadId = null
        state.folder = 'drafts'
        state.draft = { to: '', subject: '', body: '', threadId: null, updatedAt: Date.now() }
        persist()
        render()
      }

      function updateDraft(field: keyof Omit<MailDraft, 'updatedAt'>, value: string) {
        state.draft = { ...state.draft, [field]: value, updatedAt: Date.now() }
        persist()
      }

      function sendDraft() {
        if (!hasNonEmptyText(state.draft.to) || !hasNonEmptyText(state.draft.body)) {
          setStatus('Add a recipient and message first')
          return
        }
        const now = Date.now()
        const to = state.draft.to.trim()
        const subject = state.draft.subject.trim() || 'No subject'
        const from = 'You <you@duo.local>'
        const message: MailMessage = {
          id: uid(),
          from,
          to,
          body: state.draft.body.trim(),
          createdAt: now,
          direction: 'outbound',
          read: true,
        }
        const thread = state.draft.threadId ? state.threads.find(item => item.id === state.draft.threadId) : null
        if (thread) {
          thread.subject = subject
          thread.email = to
          thread.messages.push(message)
          thread.archived = false
          state.selectedThreadId = thread.id
        } else {
          const contact = to.includes('@') ? to.split('@')[0].replace(/[._-]+/g, ' ') : to
          const threadId = uid()
          state.threads.unshift({
            id: threadId,
            contact: contact.replace(/\b\w/g, letter => letter.toUpperCase()),
            email: to,
            subject,
            archived: false,
            messages: [message],
          })
          state.selectedThreadId = threadId
        }
        state.folder = 'sent'
        state.draft = { to: '', subject: '', body: '', threadId: null, updatedAt: now }
        status = 'Sent'
        persist()
        render()
      }

      function toggleArchive() {
        const thread = selectedThread()
        if (!thread) return
        thread.archived = !thread.archived
        state.folder = thread.archived ? 'archive' : 'inbox'
        persist()
        render()
      }

      function renderLeft() {
        const inbox = state.threads.filter(thread => !thread.archived && thread.messages.some(message => message.direction === 'inbound')).length
        const sent = state.threads.filter(thread => thread.messages.some(message => message.direction === 'outbound')).length
        const archived = state.threads.filter(thread => thread.archived).length
        const draft = hasNonEmptyText(state.draft.to) || hasNonEmptyText(state.draft.subject) || hasNonEmptyText(state.draft.body)
        const threads = filteredThreads()
        left.innerHTML = `
          <div class="internet-hero">
            <span class="internet-nav-label">Mailboxes</span>
            <h2>${({ inbox: 'Inbox', sent: 'Sent', drafts: 'Drafts', archive: 'Archive' })[state.folder]}</h2>
          </div>
          <label class="internet-field internet-search-field">
            <span class="visually-hidden">Search mail</span>
            <input class="internet-input" type="search" placeholder="Search" value="${escapeAttr(state.search)}">
          </label>
          <div class="internet-pill-row" role="tablist" aria-label="Mail folders">
            <button class="internet-pill${state.folder === 'inbox' ? ' is-active' : ''}" type="button" data-folder="inbox">Inbox <span>${inbox}</span></button>
            <button class="internet-pill${state.folder === 'sent' ? ' is-active' : ''}" type="button" data-folder="sent">Sent <span>${sent}</span></button>
            <button class="internet-pill${state.folder === 'drafts' ? ' is-active' : ''}" type="button" data-folder="drafts">Drafts <span>${draft ? 1 : 0}</span></button>
            <button class="internet-pill${state.folder === 'archive' ? ' is-active' : ''}" type="button" data-folder="archive">Archive <span>${archived}</span></button>
          </div>
          <div class="internet-summary-row">
            <span>${threads.length} message${threads.length === 1 ? '' : 's'}</span>
            <span>${status} · Local demo</span>
          </div>
          <div class="internet-list internet-mail-list" role="listbox" aria-label="Mail threads">
            ${draft ? `
              <button class="internet-list-item internet-draft-card${state.folder === 'drafts' ? ' is-selected' : ''}" type="button" data-action="draft">
                <strong>Draft</strong>
                <span>${escapeHtml(state.draft.to || 'No recipient yet')}</span>
                <small>${escapeHtml(state.draft.subject || 'Ready to compose')}</small>
              </button>
            ` : ''}
            ${threads.map(thread => `
              <button class="internet-list-item${thread.id === state.selectedThreadId ? ' is-selected' : ''}${unreadCount(thread) ? ' is-unread' : ''}" type="button" data-thread-id="${thread.id}">
                <div class="internet-list-item-top">
                  <strong>${escapeHtml(thread.contact)}</strong>
                  <time>${formatShortDate(thread.messages[thread.messages.length - 1]?.createdAt ?? START)}</time>
                </div>
                  <span class="internet-list-meta">${escapeHtml(thread.subject)}</span>
                  <small>${escapeHtml(threadPreview(thread))}</small>
                ${unreadCount(thread) ? `<span class="internet-unread-label visually-hidden">${unreadCount(thread)} unread</span>` : ''}
                ${thread.archived ? '<span class="internet-badge">Archived</span>' : ''}
              </button>
            `).join('') || '<p class="internet-empty">No threads match this folder right now.</p>'}
          </div>
        `
        left.querySelector<HTMLInputElement>('.internet-input')!.addEventListener('input', event => {
          state.search = (event.currentTarget as HTMLInputElement).value
          persist()
          render()
        })
        left.querySelectorAll<HTMLButtonElement>('[data-folder]').forEach(button => {
          button.addEventListener('click', () => {
            state.folder = button.dataset.folder as MailFolder
            if (state.folder === 'drafts') state.selectedThreadId = null
            persist()
            render()
          })
        })
        left.querySelectorAll<HTMLButtonElement>('[data-thread-id]').forEach(button => {
          button.addEventListener('click', () => selectThread(button.dataset.threadId!))
        })
        left.querySelector<HTMLButtonElement>('[data-action="draft"]')?.addEventListener('click', () => {
          state.folder = 'drafts'
          state.selectedThreadId = null
          persist()
          render()
        })
      }

      function renderRight() {
        const thread = selectedThread()
        const messages = thread?.messages ?? []
        const conversation = thread ? messages.map(message => `
          <article class="internet-bubble ${message.direction === 'outbound' ? 'is-outbound' : 'is-inbound'}">
            <div class="internet-bubble-meta">
              <div><strong>${escapeHtml(message.direction === 'outbound' ? 'You' : thread.contact)}</strong><span>To: ${escapeHtml(message.to)}</span></div>
              <time>${formatTime(message.createdAt)}</time>
            </div>
            <p>${escapeHtml(message.body).replace(/\n/g, '<br>')}</p>
          </article>
        `).join('') : '<p class="internet-empty internet-empty-wide">Choose a message on the left or start a new draft.</p>'

        right.innerHTML = `
          <div class="internet-toolbar">
            <div>
              <h3>${escapeHtml(thread ? thread.subject : 'New message')}</h3>
            </div>
            <div class="internet-toolbar-actions">
              <button class="internet-button secondary" type="button" data-action="new" aria-label="New message">${internetSymbol('compose')}</button>
              <button class="internet-button secondary" type="button" data-action="reply" aria-label="Reply" ${thread ? '' : 'disabled'}>${internetSymbol('reply')}</button>
              <button class="internet-button secondary" type="button" data-action="archive" aria-label="${thread?.archived ? 'Unarchive' : 'Archive'}" ${thread ? '' : 'disabled'}>${internetSymbol('archive')}</button>
            </div>
          </div>
          <div class="internet-message-shell">
            <div class="internet-conversation" aria-label="Conversation">
              ${conversation}
            </div>
            <form class="internet-compose" aria-label="Compose message" ${thread && state.draft.threadId !== thread.id ? 'hidden' : ''}>
              <div class="internet-compose-grid">
                <label>
                  <span>To</span>
                  <input class="internet-input" name="to" type="text" autocomplete="off" placeholder="name@example.com" value="${escapeAttr(state.draft.to)}">
                </label>
                <label>
                  <span>Subject</span>
                  <input class="internet-input" name="subject" type="text" autocomplete="off" placeholder="Subject" value="${escapeAttr(state.draft.subject)}">
                </label>
              </div>
              <label class="internet-compose-body">
                <span class="visually-hidden">Message</span>
                <textarea class="internet-textarea" name="body" placeholder="Write your message…"></textarea>
              </label>
              <div class="internet-compose-actions">
                <span class="internet-compose-status">${state.draft.threadId ? 'Reply' : 'Draft'} · Saved on this device</span>
                <button class="internet-button primary" type="submit">Send</button>
              </div>
            </form>
          </div>
        `

        right.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
          button.addEventListener('click', () => {
            const action = button.dataset.action
            if (action === 'new') startNewMessage()
            if (action === 'reply' && thread) openReply(thread)
            if (action === 'archive') toggleArchive()
          })
        })
        const form = right.querySelector<HTMLFormElement>('.internet-compose')!
        form.addEventListener('submit', event => {
          event.preventDefault()
          sendDraft()
        })
        form.querySelector<HTMLInputElement>('[name="to"]')!.addEventListener('input', event => updateDraft('to', (event.currentTarget as HTMLInputElement).value))
        form.querySelector<HTMLInputElement>('[name="subject"]')!.addEventListener('input', event => updateDraft('subject', (event.currentTarget as HTMLInputElement).value))
        form.querySelector<HTMLTextAreaElement>('[name="body"]')!.addEventListener('input', event => updateDraft('body', (event.currentTarget as HTMLTextAreaElement).value))
        form.querySelector<HTMLTextAreaElement>('[name="body"]')!.value = state.draft.body
      }

      function render() {
        preserveSearchFocus(left, renderLeft)
        renderRight()
        persist()
      }

      render()
      return { left, right }
    },
  }
}

function createSafariApp(): PhoneApp {
  return {
    id: 'safari',
    name: 'Safari',
    icon: '⌘',
    color: '#007aff',
    create() {
      const state = loadBrowserState()
      const left = document.createElement('section')
      left.className = 'internet-app internet-safari-left'
      const right = document.createElement('section')
      right.className = 'internet-app internet-safari-right'

      function currentPage() {
        return state.view.kind === 'page' ? browserUrlMap.get(state.view.url) ?? browserPageMap.get(state.view.url) ?? browserPages[0] : null
      }

      function persist() {
        saveBrowserState(state)
      }

      function pushHistory(url: string) {
        const next = state.history.slice(0, state.historyIndex + 1)
        if (next[next.length - 1] !== url) next.push(url)
        state.history = next.slice(-24)
        state.historyIndex = state.history.length - 1
      }

      function openPage(url: string, replace = false) {
        const page = browserUrlMap.get(url) ?? browserPageMap.get(url)
        if (!page) return false
        state.view = { kind: 'page', url: page.url }
        state.search = page.url
        if (replace) {
          state.history[state.historyIndex] = page.url
        } else {
          pushHistory(page.url)
        }
        persist()
        render()
        return true
      }

      function openSearch(query: string) {
        state.search = query
        const exact = resolveBrowserPage(query)
        if (exact) {
          openPage(exact.url)
          return
        }
        state.view = { kind: 'results', query }
        persist()
        render()
      }

      function goBack() {
        if (state.historyIndex <= 0) return
        state.historyIndex -= 1
        state.view = { kind: 'page', url: state.history[state.historyIndex] }
        state.search = state.history[state.historyIndex]
        persist()
        render()
      }

      function goForward() {
        if (state.historyIndex >= state.history.length - 1) return
        state.historyIndex += 1
        state.view = { kind: 'page', url: state.history[state.historyIndex] }
        state.search = state.history[state.historyIndex]
        persist()
        render()
      }

      function reloadPage() {
        if (state.view.kind === 'page') openPage(state.view.url, true)
      }

      function toggleBookmark(url = currentPage()?.url ?? 'duo://home') {
        const index = state.bookmarks.indexOf(url)
        if (index >= 0) state.bookmarks.splice(index, 1)
        else state.bookmarks.unshift(url)
        persist()
        render()
      }

      function renderLeft() {
        const exactResults = searchBrowserPages(state.search)
        const historyPages = state.history.map(url => browserUrlMap.get(url)).filter((page): page is BrowserPage => Boolean(page)).reverse()
        const bookmarks = state.bookmarks.map(url => browserUrlMap.get(url)).filter((page): page is BrowserPage => Boolean(page))
        left.innerHTML = `
          <div class="internet-hero">
            <h2>Safari</h2>
            <span class="internet-demo-label">Local pages</span>
          </div>
          <form class="internet-browser-bar" aria-label="Address and search bar">
            <div class="internet-browser-controls">
              <button class="internet-button secondary" type="button" data-nav="back" aria-label="Back" ${state.historyIndex <= 0 ? 'disabled' : ''}>${internetSymbol('back')}</button>
              <button class="internet-button secondary" type="button" data-nav="forward" aria-label="Forward" ${state.historyIndex >= state.history.length - 1 ? 'disabled' : ''}>${internetSymbol('forward')}</button>
              <button class="internet-button secondary" type="button" data-nav="reload" aria-label="Reload">${internetSymbol('reload')}</button>
            </div>
            <label class="internet-field">
              <span class="visually-hidden">Search or enter address</span>
              <input class="internet-input" type="search" name="query" placeholder="Search or enter website name" value="${escapeAttr(state.search)}">
            </label>
            <button class="internet-button primary" type="submit">Go</button>
          </form>
          <div class="internet-summary-row">
            <span>${state.history.length} pages in history</span>
            <span>${state.bookmarks.length} bookmarks</span>
          </div>
          <section class="internet-browser-sidebar">
            <div>
              <p class="internet-section-label">Search results</p>
              <div class="internet-list internet-search-results" role="listbox" aria-label="Search results">
                ${exactResults.slice(0, 5).map(page => `
                  <button class="internet-list-item" type="button" data-page-url="${page.url}">
                    <strong>${escapeHtml(page.title)}</strong>
                    <span class="internet-list-meta">${escapeHtml(page.subtitle)}</span>
                    <small>${escapeHtml(page.summary)}</small>
                  </button>
                `).join('') || '<p class="internet-empty">No local pages match. Try a title, topic, or page URL.</p>'}
              </div>
            </div>
            <div>
              <p class="internet-section-label">${internetSymbol('bookmark')} Bookmarks</p>
              <div class="internet-mini-list" role="list">
                ${bookmarks.map(page => `
                  <button class="internet-mini-row" type="button" data-page-url="${page.url}">
                    <span>${escapeHtml(page.title)}</span>
                    <small>${escapeHtml(page.url)}</small>
                  </button>
                `).join('') || '<p class="internet-empty">Bookmark a page to keep it here.</p>'}
              </div>
            </div>
            <div>
              <p class="internet-section-label">History</p>
              <div class="internet-mini-list" role="list">
                ${historyPages.map(page => `
                  <button class="internet-mini-row" type="button" data-page-url="${page.url}">
                    <span>${escapeHtml(page.title)}</span>
                    <small>${escapeHtml(page.subtitle)}</small>
                  </button>
                `).join('') || '<p class="internet-empty">Nothing in history yet.</p>'}
              </div>
            </div>
          </section>
        `
        left.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(button => {
          button.addEventListener('click', () => {
            const action = button.dataset.nav
            if (action === 'back') goBack()
            if (action === 'forward') goForward()
            if (action === 'reload') reloadPage()
          })
        })
        left.querySelectorAll<HTMLButtonElement>('[data-page-url]').forEach(button => {
          button.addEventListener('click', () => openPage(button.dataset.pageUrl!))
        })
        left.querySelector<HTMLInputElement>('.internet-input')!.addEventListener('input', event => {
          state.search = (event.currentTarget as HTMLInputElement).value
          persist()
          render()
        })
        left.querySelector<HTMLFormElement>('.internet-browser-bar')!.addEventListener('submit', event => {
          event.preventDefault()
          openSearch(state.search)
        })
      }

      function renderRight() {
        const view = state.view.kind === 'page' ? currentPage() : null
        if (state.view.kind === 'results') {
          const matches = searchBrowserPages(state.view.query)
          right.innerHTML = `
            <div class="internet-toolbar">
              <div>
                <p class="internet-kicker">Search results</p>
                <h3>${matches.length ? `${matches.length} match${matches.length === 1 ? '' : 'es'} for “${escapeHtml(state.view.query)}”` : `No matches for “${escapeHtml(state.view.query)}”`}</h3>
              </div>
              <button class="internet-button secondary" type="button" data-action="bookmark" disabled>Bookmark</button>
            </div>
            <div class="internet-page-card internet-results-view">
              ${matches.map(page => `
                <button class="internet-result-card" type="button" data-page-url="${page.url}">
                  <span class="internet-result-url">${escapeHtml(page.url)}</span>
                  <strong>${escapeHtml(page.title)}</strong>
                  <p>${escapeHtml(page.summary)}</p>
                </button>
              `).join('') || '<p class="internet-empty internet-empty-wide">Try a title like Atlas or a topic like food.</p>'}
            </div>
          `
          right.querySelectorAll<HTMLButtonElement>('[data-page-url]').forEach(button => {
            button.addEventListener('click', () => openPage(button.dataset.pageUrl!))
          })
          return
        }

        const page = view ?? browserPages[0]
        const bookmarked = state.bookmarks.includes(page.url)
        right.innerHTML = `
          <div class="internet-toolbar">
            <div>
              <h3>${escapeHtml(page.title)}</h3>
            </div>
            <button class="internet-button secondary" type="button" data-action="bookmark" aria-label="${bookmarked ? 'Remove bookmark' : 'Bookmark page'}" aria-pressed="${bookmarked}">${internetSymbol('bookmark')}</button>
          </div>
          <article class="internet-page-card">
            <p class="internet-page-url">${escapeHtml(page.url)}</p>
            <h4>${escapeHtml(page.subtitle)}</h4>
            <p class="internet-page-summary">${escapeHtml(page.summary)}</p>
            <div class="internet-page-body">
              ${page.sections.map(section => `
                <section>
                  <h5>${escapeHtml(section.heading)}</h5>
                  <p>${escapeHtml(section.body)}</p>
                  ${section.bullets ? `<ul>${section.bullets.map(bullet => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''}
                </section>
              `).join('')}
            </div>
            <div class="internet-tag-row">
              ${page.tags.map(tag => `<span class="internet-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="internet-link-grid" aria-label="Related pages">
              ${page.links.map(link => `<button class="internet-link-card" type="button" data-page-url="${escapeAttr(link.target)}">${escapeHtml(link.label)}</button>`).join('')}
            </div>
          </article>
        `
        right.querySelector<HTMLButtonElement>('[data-action="bookmark"]')!.addEventListener('click', () => toggleBookmark(page.url))
        right.querySelectorAll<HTMLButtonElement>('[data-page-url]').forEach(button => {
          button.addEventListener('click', () => openPage(button.dataset.pageUrl!))
        })
      }

      function render() {
        preserveSearchFocus(left, renderLeft)
        renderRight()
        persist()
      }

      if (state.view.kind === 'page') openPage(state.view.url, true)
      else render()
      return { left, right }
    },
  }
}

function createMapsApp(): PhoneApp {
  return {
    id: 'maps',
    name: 'Maps',
    icon: '⌖',
    color: '#34c759',
    create() {
      const state = loadMapState()
      const left = document.createElement('section')
      left.className = 'internet-app internet-maps-left'
      const right = document.createElement('section')
      right.className = 'internet-app internet-maps-right'

      function selectedPlace() {
        return places.find(place => place.id === state.selectedPlaceId) ?? places[0]
      }

      function origin() {
        return origins.find(place => place.id === state.originId) ?? origins[0]
      }

      function persist() {
        saveMapState(state)
      }

      function toggleFavorite(placeId: string) {
        const index = state.favorites.indexOf(placeId)
        if (index >= 0) state.favorites.splice(index, 1)
        else state.favorites.unshift(placeId)
        persist()
        render()
      }

      function setMode(mode: TravelMode) {
        state.mode = mode
        persist()
        render()
      }

      function routeInfo() {
        const place = selectedPlace()
        const start = origin()
        const dx = place.x - start.x
        const dy = place.y - start.y
        const distance = Math.hypot(dx, dy) * 0.06
        const speed = state.mode === 'walk' ? 3 : state.mode === 'drive' ? 18 : 11
        const minutes = Math.max(3, (distance / speed) * 60)
        const horiz = Math.abs(dx) > 3 ? `${dx > 0 ? 'east' : 'west'} ${formatMiles(Math.abs(dx) * 0.06)}` : null
        const vert = Math.abs(dy) > 3 ? `${dy > 0 ? 'south' : 'north'} ${formatMiles(Math.abs(dy) * 0.06)}` : null
        const steps = [
          `Start at ${start.name}.`,
          horiz ? `Head ${horiz} along the main street.` : null,
          vert ? `Continue ${vert} toward ${place.neighborhood}.` : null,
          `Arrive at ${place.name}.`,
        ].filter((step): step is string => Boolean(step))
        return { distance, minutes, steps }
      }

      function filteredPlaces() {
        const value = normalize(state.search)
        const list = places.filter(place => !value || [place.name, place.category, place.address, place.neighborhood, place.summary, ...place.tags].some(text => normalize(text).includes(value)))
        return [
          ...list.filter(place => state.favorites.includes(place.id)),
          ...list.filter(place => !state.favorites.includes(place.id)),
        ]
      }

      function renderLeft() {
        const list = filteredPlaces()
        left.innerHTML = `
          <div class="internet-hero">
            <h2>Maps</h2>
            <span class="internet-demo-label">Local map</span>
          </div>
          <label class="internet-field internet-search-field">
            <span class="visually-hidden">Search places</span>
            <input class="internet-input" type="search" placeholder="Search Maps" value="${escapeAttr(state.search)}">
          </label>
          <div class="internet-stack">
            <label class="internet-field">
              <span>Route from</span>
              <select class="internet-select" name="origin">
                ${origins.map(item => `<option value="${item.id}"${item.id === state.originId ? ' selected' : ''}>${item.name}</option>`).join('')}
              </select>
            </label>
            <div class="internet-mode-row" role="tablist" aria-label="Travel mode">
              <button class="internet-pill${state.mode === 'walk' ? ' is-active' : ''}" type="button" data-mode="walk">Walk</button>
              <button class="internet-pill${state.mode === 'drive' ? ' is-active' : ''}" type="button" data-mode="drive">Drive</button>
              <button class="internet-pill${state.mode === 'transit' ? ' is-active' : ''}" type="button" data-mode="transit">Transit</button>
            </div>
          </div>
          <div class="internet-summary-row">
            <span>${list.length} place${list.length === 1 ? '' : 's'} shown</span>
            <span>${state.favorites.length} favorite${state.favorites.length === 1 ? '' : 's'}</span>
          </div>
          <div class="internet-list internet-place-list" role="listbox" aria-label="Places">
            ${list.map(place => {
              const route = place.id === state.selectedPlaceId ? routeInfo() : null
              return `
                <button class="internet-list-item${place.id === state.selectedPlaceId ? ' is-selected' : ''}" type="button" data-place-id="${place.id}">
                  <div class="internet-list-item-top">
                    <strong>${escapeHtml(place.name)}</strong>
                    <span class="internet-category">${escapeHtml(place.category)}</span>
                  </div>
                  <span class="internet-list-meta">${escapeHtml(place.address)}</span>
                  <small>${escapeHtml(place.summary)}</small>
                  <div class="internet-badge-row">
                    <span class="internet-badge">${escapeHtml(place.neighborhood)}</span>
                    ${state.favorites.includes(place.id) ? '<span class="internet-badge">Saved</span>' : ''}
                    ${route ? `<span class="internet-badge">${formatMinutes(route.minutes)}</span>` : ''}
                  </div>
                </button>
              `
            }).join('') || '<p class="internet-empty">No places match that search. Try a neighborhood or tag.</p>'}
          </div>
        `
        left.querySelector<HTMLInputElement>('.internet-input')!.addEventListener('input', event => {
          state.search = (event.currentTarget as HTMLInputElement).value
          persist()
          render()
        })
        left.querySelector<HTMLSelectElement>('.internet-select')!.addEventListener('change', event => {
          state.originId = (event.currentTarget as HTMLSelectElement).value
          persist()
          render()
        })
        left.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => {
          button.addEventListener('click', () => setMode(button.dataset.mode as TravelMode))
        })
        left.querySelectorAll<HTMLButtonElement>('[data-place-id]').forEach(button => {
          button.addEventListener('click', () => {
            state.selectedPlaceId = button.dataset.placeId!
            persist()
            render()
          })
        })
      }

      function renderRight() {
        const place = selectedPlace()
        const start = origin()
        const route = routeInfo()
        const markerStyle = (x: number, y: number) => `left:${x}%;top:${y}%;`
        right.innerHTML = `
          <div class="internet-toolbar">
            <div>
              <p class="internet-kicker">${escapeHtml(place.category)}</p>
              <h3>${escapeHtml(place.name)}</h3>
            </div>
            <button class="internet-button secondary" type="button" data-action="favorite" aria-label="${state.favorites.includes(place.id) ? 'Unsave place' : 'Save place'}">${internetSymbol(state.favorites.includes(place.id) ? 'check' : 'plus')}</button>
          </div>
          <div class="internet-map-card">
            <div class="internet-map-canvas" role="img" aria-label="Illustrated local demo map from ${escapeAttr(start.name)} to ${escapeAttr(place.name)}">
              <svg class="internet-map-art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <rect width="100" height="100" fill="#efede6"/>
                <path d="M74-5C62 24 94 26 75 53S64 81 86 107H110V-5Z" fill="#a9d9ee"/>
                <path d="m48 58 19 2 6 24-27 4Zm-38-50 18 2-3 20-17-3ZM9 69h19v25H9Z" fill="#c8dfa9"/>
                <g stroke="#ddd9cf" stroke-width="4"><path d="M0 20h100M0 40h100M0 60h100M0 80h100M18 0v100M38 0v100M58 0v100M0 100 100 0"/></g>
                <g fill="none" stroke="#fff" stroke-width="2.5"><path d="M0 20h100M0 40h100M0 60h100M0 80h100M18 0v100M38 0v100M58 0v100M0 100 100 0"/></g>
                <path d="M0 49 100 52" stroke="#eed28b" stroke-width="3"/><path d="M0 49 100 52" stroke="#fff4c7" stroke-width="1.6"/>
                <path d="M${start.x} ${start.y}H${place.x}V${place.y}" fill="none" stroke="#fff" stroke-width="3.2" stroke-linejoin="round"/>
                <path d="M${start.x} ${start.y}H${place.x}V${place.y}" fill="none" stroke="#007aff" stroke-width="1.6" stroke-linejoin="round"/>
              </svg>
              <span class="internet-map-label internet-map-label--north">North Bend</span>
              <span class="internet-map-label internet-map-label--center">Civic Center</span>
              <span class="internet-map-label internet-map-label--water">River</span>
              <span class="internet-map-marker origin" style="${markerStyle(start.x, start.y)}">
              <span>${escapeHtml(start.name)}</span>
              </span>
              <span class="internet-map-marker destination" style="${markerStyle(place.x, place.y)}">
              <span>${escapeHtml(place.name)}</span>
              </span>
              <small class="internet-map-demo">Illustrated demo map</small>
            </div>
            <div class="internet-route-summary">
              <div>
                <strong>${formatMinutes(route.minutes)}</strong>
                <span>${formatMiles(route.distance)} · ${state.mode}</span>
              </div>
              <p>${escapeHtml(place.address)} · ${escapeHtml(place.hours)}</p>
            </div>
          </div>
          <div class="internet-page-card internet-map-details">
            <p class="internet-page-url">${escapeHtml(place.neighborhood)}</p>
            <p class="internet-page-summary">${escapeHtml(place.summary)}</p>
            <div class="internet-tag-row">
              ${place.tags.map(tag => `<span class="internet-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <ol class="internet-step-list">
              ${route.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
            </ol>
          </div>
        `
        right.querySelector<HTMLButtonElement>('[data-action="favorite"]')!.addEventListener('click', () => toggleFavorite(place.id))
      }

      function render() {
        preserveSearchFocus(left, renderLeft)
        renderRight()
        persist()
      }

      render()
      return { left, right }
    },
  }
}

function createWeatherApp(): PhoneApp {
  return {
    id: 'weather',
    name: 'Weather',
    icon: '☼',
    color: '#2679bd',
    create() {
      const state = loadWeatherState()
      const left = document.createElement('section')
      left.className = 'internet-app internet-weather-left'
      const right = document.createElement('section')
      right.className = 'internet-app internet-weather-right'

      function selectedCity() {
        return weatherCityMap.get(state.selectedCityId) ?? weatherCities[0]
      }

      function persist() {
        saveWeatherState(state)
      }

      function toggleFavorite(cityId: string) {
        const index = state.favorites.indexOf(cityId)
        if (index >= 0) state.favorites.splice(index, 1)
        else state.favorites.unshift(cityId)
        persist()
        render()
      }

      function filteredCities() {
        const value = normalize(state.search)
        const list = weatherCities.filter(city => !value || [city.name, city.region, city.condition, city.summary].some(text => normalize(text).includes(value)))
        return [
          ...list.filter(city => state.favorites.includes(city.id)),
          ...list.filter(city => !state.favorites.includes(city.id)),
        ]
      }

      function renderLeft() {
        const list = filteredCities()
        left.innerHTML = `
          <div class="internet-hero">
            <h2>Weather</h2>
            <span class="internet-demo-label">Sample forecast</span>
          </div>
          <label class="internet-field internet-search-field">
            <span class="visually-hidden">Search city</span>
            <input class="internet-input" type="search" placeholder="Search cities or regions" value="${escapeAttr(state.search)}">
          </label>
          <div class="internet-summary-row">
            <span>${list.length} ${list.length === 1 ? 'city' : 'cities'}</span>
            <span>${state.favorites.length} favorite${state.favorites.length === 1 ? '' : 's'}</span>
          </div>
          <div class="internet-list internet-city-list" role="listbox" aria-label="Cities">
            ${list.map(city => `
              <button class="internet-list-item${city.id === state.selectedCityId ? ' is-selected' : ''}" type="button" data-city-id="${city.id}">
                <div class="internet-list-item-top">
                  <strong>${escapeHtml(city.name)}</strong>
                  <span class="internet-city-temp">${city.temp}°</span>
                </div>
                <span class="internet-city-region">${escapeHtml(city.region)}</span>
                <span class="internet-list-meta">${escapeHtml(city.condition)}</span>
                <span class="internet-city-range">H:${city.forecast[0].high}° L:${city.forecast[0].low}° ${state.favorites.includes(city.id) ? ' · Saved' : ''}</span>
              </button>
            `).join('') || '<p class="internet-empty">No cities found.</p>'}
          </div>
        `
        left.querySelector<HTMLInputElement>('.internet-input')!.addEventListener('input', event => {
          state.search = (event.currentTarget as HTMLInputElement).value
          persist()
          render()
        })
        left.querySelectorAll<HTMLButtonElement>('[data-city-id]').forEach(button => {
          button.addEventListener('click', () => {
            state.selectedCityId = button.dataset.cityId!
            persist()
            render()
          })
        })
      }

      function renderRight() {
        const city = selectedCity()
        right.innerHTML = `
          <div class="internet-toolbar">
            <div>
              <h3>${escapeHtml(city.name)}</h3>
            </div>
            <button class="internet-button secondary" type="button" data-action="favorite" aria-label="${state.favorites.includes(city.id) ? 'Unsave city' : 'Save city'}">${internetSymbol(state.favorites.includes(city.id) ? 'check' : 'plus')}</button>
          </div>
          <article class="internet-weather-hero">
            <div>
              <p class="internet-page-url">${escapeHtml(city.region)}</p>
              <div class="internet-weather-temp-row">
                <strong>${city.temp}°</strong>
              </div>
              <p class="internet-weather-condition">${escapeHtml(city.condition)}</p>
              <p>H:${city.forecast[0].high}° L:${city.forecast[0].low}°</p>
            </div>
          </article>
          <section class="internet-weather-strip">
            <p class="internet-weather-summary">${escapeHtml(city.summary)}</p>
            <div class="internet-hourly-list">
              ${city.hourly.map(hour => `
                <article class="internet-hour-card">
                  <span>${escapeHtml(hour.time)}</span>
                  ${weatherSymbol(hour.icon, hour.condition)}
                  <span>${hour.temp}°</span>
                </article>
              `).join('')}
            </div>
          </section>
          <section class="internet-weather-strip">
            <p class="internet-section-label">5-day forecast</p>
            <div class="internet-forecast-list">
              ${city.forecast.map(day => `
                <article class="internet-forecast-card">
                  <div>
                    <strong>${escapeHtml(day.day)}</strong>
                  </div>
                  <div class="internet-forecast-icon">${weatherSymbol(day.icon, day.condition)}<small>${escapeHtml(day.precipitation)}</small></div>
                  <div class="internet-forecast-range">
                    <span>${day.low}°</span>
                    <span class="internet-temperature-track"><i style="left:${Math.round((day.low - Math.min(...city.forecast.map(item => item.low))) / 50 * 100)}%;right:${Math.max(0, Math.round((Math.max(...city.forecast.map(item => item.high)) - day.high) / 50 * 100))}%"></i></span>
                    <span>${day.high}°</span>
                  </div>
                </article>
              `).join('')}
            </div>
          </section>
          <div class="internet-weather-metrics">
            <div><span>Feels Like</span><strong>${city.feelsLike}°</strong></div>
            <div><span>Humidity</span><strong>${city.humidity}%</strong></div>
            <div><span>Wind</span><strong>${city.wind} mph</strong></div>
            <div><span>UV Index</span><strong>${city.uv}</strong></div>
          </div>
        `
        right.querySelector<HTMLButtonElement>('[data-action="favorite"]')!.addEventListener('click', () => toggleFavorite(city.id))
      }

      function render() {
        preserveSearchFocus(left, renderLeft)
        renderRight()
        persist()
      }

      render()
      return { left, right }
    },
  }
}

export const internetApps: PhoneApp[] = [
  createMailApp(),
  createSafariApp(),
  createMapsApp(),
  createWeatherApp(),
]
