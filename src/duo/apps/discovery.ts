import './discovery.css'

import type { PhoneApp } from './types'

type StoreCategory = 'All' | 'Productivity' | 'Creativity' | 'Travel' | 'Wellness' | 'Utilities'

interface StoreApp {
  id: string
  name: string
  category: Exclude<StoreCategory, 'All'>
  developer: string
  icon: string
  accent: string
  tagline: string
  description: string
  details: string
  size: string
  rating: number
  reviews: number
  price: string
  featured?: boolean
  tags: string[]
}

interface StoreState {
  search: string
  category: StoreCategory
  selectedId: string
  installed: string[]
}

type ShortcutKind = 'timer' | 'note' | 'message' | 'open-app' | 'translate'

type ShortcutCategory = 'All' | 'Morning' | 'Work' | 'Home' | 'Travel' | 'Play'

interface Shortcut {
  id: string
  name: string
  emoji: string
  category: Exclude<ShortcutCategory, 'All'>
  kind: ShortcutKind
  payload: string
  description: string
  builtIn?: boolean
  createdAt: number
}

interface ShortcutUsage {
  runs: number
  lastRunAt: number | null
}

interface ShortcutRun {
  id: string
  shortcutId: string
  title: string
  result: string
  at: number
}

interface ShortcutsState {
  selectedId: string
  category: ShortcutCategory
  custom: Shortcut[]
  usage: Record<string, ShortcutUsage>
  recentRuns: ShortcutRun[]
  draft: {
    name: string
    emoji: string
    category: Exclude<ShortcutCategory, 'All'>
    kind: ShortcutKind
    payload: string
  }
}

type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko'

interface TranslationEntry {
  id: string
  phrase: string
  category: string
  translations: Record<LanguageCode, string>
  note: string
}

interface FavoriteTranslation {
  id: string
  entryId: string
  source: LanguageCode
  target: LanguageCode
  phrase: string
  translation: string
  savedAt: number
}

interface TranslateState {
  source: LanguageCode
  target: LanguageCode
  phrase: string
  favorites: FavoriteTranslation[]
}

type TipCategory = 'All' | 'Setup' | 'Shortcuts' | 'Productivity' | 'Travel' | 'Comfort' | 'Wellbeing'

interface Tip {
  id: string
  category: Exclude<TipCategory, 'All'>
  title: string
  summary: string
  details: string
  steps: string[]
  time: string
  effort: string
  accent: string
}

interface TipsState {
  category: TipCategory
  selectedId: string
  completed: string[]
  saved: string[]
}

const STORE_KEY = 'duo-discovery-store-v1'
const SHORTCUTS_KEY = 'duo-discovery-shortcuts-v1'
const TRANSLATE_KEY = 'duo-discovery-translate-v1'
const TIPS_KEY = 'duo-discovery-tips-v1'

const storeApps: StoreApp[] = [
  {
    id: 'focus-flow',
    name: 'Focus Flow',
    category: 'Productivity',
    developer: 'Duo Labs',
    icon: '◌',
    accent: '#89a7ff',
    tagline: 'Keep the next step obvious.',
    description: 'A calm task list for quick wins, timers, and gentle momentum.',
    details: 'Designed for busy days: smart reminders, one-tap timers, and a single view that stays out of the way.',
    size: '24 MB',
    rating: 4.9,
    reviews: 128,
    price: 'Free',
    featured: true,
    tags: ['timers', 'tasks', 'clarity'],
  },
  {
    id: 'frame-maker',
    name: 'Frame Maker',
    category: 'Creativity',
    developer: 'North Studio',
    icon: '◔',
    accent: '#ff8e72',
    tagline: 'Shape a layout in a minute.',
    description: 'A tiny tool for sketching screens, collecting references, and saving inspiration.',
    details: 'Drop in notes, reuse palettes, and save mood boards that feel good across the fold.',
    size: '31 MB',
    rating: 4.8,
    reviews: 84,
    price: '$2.99',
    tags: ['design', 'sketching', 'boards'],
  },
  {
    id: 'trail-notes',
    name: 'Trail Notes',
    category: 'Travel',
    developer: 'Field Kit',
    icon: '⌁',
    accent: '#66d0c0',
    tagline: 'Offline plans for moving around.',
    description: 'Map stops, packing lists, and route notes that work before you get a signal.',
    details: 'Handy for trips, errands, and weekends away when the only thing you need is a clear plan.',
    size: '19 MB',
    rating: 4.7,
    reviews: 203,
    price: 'Free',
    tags: ['routes', 'lists', 'offline'],
  },
  {
    id: 'quiet-space',
    name: 'Quiet Space',
    category: 'Wellness',
    developer: 'Stillness Co.',
    icon: '☾',
    accent: '#b38cff',
    tagline: 'Lower the volume on the day.',
    description: 'Breathing cues, mindful resets, and quick check-ins for between tasks.',
    details: 'A lightweight companion for a short pause, a few deep breaths, or a reset before the next meeting.',
    size: '17 MB',
    rating: 4.9,
    reviews: 156,
    price: 'Free',
    tags: ['breathing', 'rest', 'reset'],
  },
  {
    id: 'metered',
    name: 'Metered',
    category: 'Utilities',
    developer: 'Pocket Tools',
    icon: '⌘',
    accent: '#f5c44e',
    tagline: 'Tiny conversions, fast.',
    description: 'A clean set of converters, counters, and small tools that are always nearby.',
    details: 'Great for checking measurements, quick math, and the kind of small tasks that interrupt the day.',
    size: '12 MB',
    rating: 4.6,
    reviews: 92,
    price: '$0.99',
    tags: ['conversion', 'math', 'fast'],
  },
  {
    id: 'skyline-mail',
    name: 'Skyline Mail',
    category: 'Productivity',
    developer: 'Open Inbox',
    icon: '✉',
    accent: '#5fd3ff',
    tagline: 'Inbox triage that stays readable.',
    description: 'Smart sorting, a distraction-free reader, and a good home for messages that matter.',
    details: 'Built for quick replies and quick wins when you only want to get through the list once.',
    size: '29 MB',
    rating: 4.8,
    reviews: 317,
    price: 'Free',
    tags: ['mail', 'focus', 'sort'],
  },
  {
    id: 'rest-stop',
    name: 'Rest Stop',
    category: 'Travel',
    developer: 'Route Atlas',
    icon: '⤴',
    accent: '#79e3a3',
    tagline: 'Stops, fuel, and the next checkpoint.',
    description: 'A simple trip assistant for finding breaks, sharing directions, and planning the next leg.',
    details: 'Use it for road trips, day trips, or a quick idea of what is nearby before you leave.',
    size: '22 MB',
    rating: 4.5,
    reviews: 67,
    price: 'Free',
    tags: ['trip', 'stops', 'routing'],
  },
  {
    id: 'palette-pins',
    name: 'Palette Pins',
    category: 'Creativity',
    developer: 'Color Field',
    icon: '▣',
    accent: '#ffb1cc',
    tagline: 'Collect a mood in color.',
    description: 'Save palettes, pin references, and pull together a clear visual direction.',
    details: 'A small creative notebook for designers, makers, and anyone collecting ideas for later.',
    size: '26 MB',
    rating: 4.7,
    reviews: 111,
    price: '$1.99',
    tags: ['colors', 'inspiration', 'mood'],
  },
]

const shortcutTemplates: Shortcut[] = [
  {
    id: 'focus-25',
    name: 'Focus 25',
    emoji: '◌',
    category: 'Work',
    kind: 'timer',
    payload: '25',
    description: 'Start a 25-minute timer and keep the next block simple.',
    builtIn: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'quick-note',
    name: 'Quick Note',
    emoji: '✎',
    category: 'Home',
    kind: 'note',
    payload: 'Capture the idea before it disappears.',
    description: 'Save a note draft for whatever you just remembered.',
    builtIn: true,
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'eta-text',
    name: 'ETA Text',
    emoji: '↗',
    category: 'Travel',
    kind: 'message',
    payload: 'Leaving now. I will be there in about 15 minutes.',
    description: 'Prepare a friendly status text for the road.',
    builtIn: true,
    createdAt: Date.now() - 5400000,
  },
  {
    id: 'open-mail',
    name: 'Open Mail',
    emoji: '✉',
    category: 'Work',
    kind: 'open-app',
    payload: 'Skyline Mail',
    description: 'Jump straight into the inbox and clear a few messages.',
    builtIn: true,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'spanish-hello',
    name: 'Spanish Hello',
    emoji: '¡',
    category: 'Play',
    kind: 'translate',
    payload: 'Hello, where is the station?',
    description: 'Translate a common phrase before you head out.',
    builtIn: true,
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'evening-reset',
    name: 'Evening Reset',
    emoji: '☾',
    category: 'Morning',
    kind: 'timer',
    payload: '10',
    description: 'A short timer for wrapping up and taking a breath.',
    builtIn: true,
    createdAt: Date.now() - 900000,
  },
]

const languageOptions: Array<{ code: LanguageCode; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'ko', label: 'Korean', native: '한국어' },
]

const translationEntries: TranslationEntry[] = [
  {
    id: 'hello',
    phrase: 'Hello',
    category: 'greeting',
    translations: { en: 'Hello', es: 'Hola', fr: 'Bonjour', de: 'Hallo', it: 'Ciao', pt: 'Olá', ja: 'こんにちは', ko: '안녕하세요' },
    note: 'A simple greeting for almost any context.',
  },
  {
    id: 'thank-you',
    phrase: 'Thank you',
    category: 'polite',
    translations: { en: 'Thank you', es: 'Gracias', fr: 'Merci', de: 'Danke', it: 'Grazie', pt: 'Obrigado', ja: 'ありがとうございます', ko: '감사합니다' },
    note: 'Use for quick appreciation and polite replies.',
  },
  {
    id: 'good-morning',
    phrase: 'Good morning',
    category: 'greeting',
    translations: { en: 'Good morning', es: 'Buenos días', fr: 'Bonjour', de: 'Guten Morgen', it: 'Buongiorno', pt: 'Bom dia', ja: 'おはようございます', ko: '좋은 아침입니다' },
    note: 'A friendly way to start the day.',
  },
  {
    id: 'where-is-the-station',
    phrase: 'Where is the station?',
    category: 'travel',
    translations: { en: 'Where is the station?', es: '¿Dónde está la estación?', fr: 'Où est la gare ?', de: 'Wo ist der Bahnhof?', it: 'Dov’è la stazione?', pt: 'Onde fica a estação?', ja: '駅はどこですか？', ko: '역이 어디예요?' },
    note: 'Useful when asking for directions.',
  },
  {
    id: 'i-need-help',
    phrase: 'I need help',
    category: 'help',
    translations: { en: 'I need help', es: 'Necesito ayuda', fr: 'J’ai besoin d’aide', de: 'Ich brauche Hilfe', it: 'Ho bisogno di aiuto', pt: 'Preciso de ajuda', ja: '助けが必要です', ko: '도움이 필요해요' },
    note: 'Handy in a pinch.',
  },
  {
    id: 'one-coffee-please',
    phrase: 'One coffee, please',
    category: 'travel',
    translations: { en: 'One coffee, please', es: 'Un café, por favor', fr: 'Un café, s’il vous plaît', de: 'Einen Kaffee, bitte', it: 'Un caffè, per favore', pt: 'Um café, por favor', ja: 'コーヒーを1つお願いします', ko: '커피 한 잔 주세요' },
    note: 'For cafés, kiosks, and very good mornings.',
  },
  {
    id: 'can-you-repeat-that',
    phrase: 'Can you repeat that?',
    category: 'help',
    translations: { en: 'Can you repeat that?', es: '¿Puede repetir eso?', fr: 'Pouvez-vous répéter ?', de: 'Können Sie das wiederholen?', it: 'Puoi ripetere?', pt: 'Pode repetir isso?', ja: 'もう一度言っていただけますか？', ko: '다시 말씀해 주실 수 있나요?' },
    note: 'Use it when you want one more pass.',
  },
  {
    id: 'see-you-soon',
    phrase: 'See you soon',
    category: 'greeting',
    translations: { en: 'See you soon', es: 'Hasta pronto', fr: 'À bientôt', de: 'Bis bald', it: 'A presto', pt: 'Até logo', ja: 'またすぐに', ko: '곧 봐요' },
    note: 'A warm sign-off.',
  },
  {
    id: 'happy-birthday',
    phrase: 'Happy birthday',
    category: 'celebration',
    translations: { en: 'Happy birthday', es: 'Feliz cumpleaños', fr: 'Joyeux anniversaire', de: 'Alles Gute zum Geburtstag', it: 'Buon compleanno', pt: 'Feliz aniversário', ja: 'お誕生日おめでとう', ko: '생일 축하해요' },
    note: 'Good for cards and messages.',
  },
  {
    id: 'how-much-is-it',
    phrase: 'How much is it?',
    category: 'travel',
    translations: { en: 'How much is it?', es: '¿Cuánto cuesta?', fr: 'Combien ça coûte ?', de: 'Wie viel kostet das?', it: 'Quanto costa?', pt: 'Quanto custa?', ja: 'いくらですか？', ko: '얼마예요?' },
    note: 'Use when the price tag is unclear.',
  },
  {
    id: 'i-love-this',
    phrase: 'I love this',
    category: 'greeting',
    translations: { en: 'I love this', es: 'Me encanta esto', fr: 'J’adore ça', de: 'Ich liebe das', it: 'Lo adoro', pt: 'Eu adoro isso', ja: 'これが大好きです', ko: '이거 정말 좋아해요' },
    note: 'A simple enthusiastic response.',
  },
  {
    id: 'i-am-running-late',
    phrase: 'I am running late',
    category: 'help',
    translations: { en: 'I am running late', es: 'Llego tarde', fr: 'Je suis en retard', de: 'Ich komme zu spät', it: 'Sono in ritardo', pt: 'Estou atrasado', ja: '遅れています', ko: '늦고 있어요' },
    note: 'Handy when your timing slips.',
  },
]

const tipCards: Tip[] = [
  {
    id: 'set-home-screen',
    category: 'Setup',
    title: 'Set a home screen that feels calm',
    summary: 'Keep the first screen focused on the things you actually tap.',
    details: 'Move the most-used apps to the first page, and keep the second page for tools you only need sometimes. The result is less hunting and more doing.',
    steps: ['Long-press the home screen', 'Drag your most-used apps to the first page', 'Leave one page for extras'],
    time: '2 min',
    effort: 'Easy',
    accent: '#8fd6ff',
  },
  {
    id: 'pin-shortcuts',
    category: 'Shortcuts',
    title: 'Pin one shortcut to every routine',
    summary: 'A tiny launcher can replace a long chain of taps.',
    details: 'Try one shortcut for morning, one for work, and one for winding down. The goal is fewer decisions at the moments you repeat every day.',
    steps: ['Open Shortcuts', 'Create one launcher for a repeated task', 'Run it once a day for a week'],
    time: '4 min',
    effort: 'Easy',
    accent: '#ffb47d',
  },
  {
    id: 'travel-kit',
    category: 'Travel',
    title: 'Build a travel kit before you leave',
    summary: 'Offline notes, saved maps, and a quick translation phrase go a long way.',
    details: 'Use the apps you already have to prepare for the moments that are harder on the move: directions, messages, and small reminders.',
    steps: ['Save a place or route', 'Keep one key phrase ready in Translate', 'Pin a packing list or note'],
    time: '5 min',
    effort: 'Medium',
    accent: '#74e6c0',
  },
  {
    id: 'reset-between-tasks',
    category: 'Wellbeing',
    title: 'Take a reset between tasks',
    summary: 'A short pause can make the next block easier.',
    details: 'Before starting something new, look away from the screen for a moment, take a breath, and clear the mental queue. Small resets add up fast.',
    steps: ['Set a short timer', 'Take three slow breaths', 'Return with one clear next step'],
    time: '1 min',
    effort: 'Easy',
    accent: '#cab0ff',
  },
  {
    id: 'message-template',
    category: 'Productivity',
    title: 'Write one reusable message template',
    summary: 'A good default text saves a surprising amount of effort.',
    details: 'Keep a simple version of “I am on my way” or “Can we move this later?” in a shortcut so you never have to rewrite it from scratch.',
    steps: ['Pick a repeated message', 'Save it in a shortcut or note', 'Use it the next time you need it'],
    time: '3 min',
    effort: 'Easy',
    accent: '#f4cf66',
  },
  {
    id: 'save-favorites',
    category: 'Comfort',
    title: 'Save the small things you keep reaching for',
    summary: 'Favorites are a quiet form of productivity.',
    details: 'Whether it is a translation, a tip, or a shortcut, saving the useful bit now keeps it close later. Make the future version of you do less searching.',
    steps: ['Star one useful item', 'Return to it later today', 'Keep only the things you really use'],
    time: '1 min',
    effort: 'Easy',
    accent: '#8bf0aa',
  },
  {
    id: 'app-store-review',
    category: 'Productivity',
    title: 'Review installed apps once a month',
    summary: 'A short cleanup keeps the phone lighter and easier to browse.',
    details: 'Open the App Store, check what you actually use, and remove the extras. A cleaner home screen makes every session feel simpler.',
    steps: ['Open App Store', 'Look at your installed apps', 'Remove one thing you have not touched'],
    time: '2 min',
    effort: 'Easy',
    accent: '#9ea0ff',
  },
  {
    id: 'translate-before-go',
    category: 'Travel',
    title: 'Translate the phrase before you need it',
    summary: 'A saved phrase is better than a rushed search at the counter.',
    details: 'Keep the phrase ready while you still have time to read it. Then the app becomes a pocket reference instead of a scramble.',
    steps: ['Type a phrase you expect to use', 'Pick the language pair now', 'Save it to favorites'],
    time: '2 min',
    effort: 'Easy',
    accent: '#67d7ff',
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures; the app still works in memory.
  }
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function createProgressLabel(done: number, total: number) {
  return `${done}/${total}`
}

function formatRating(value: number) {
  return value.toFixed(1)
}

function getStoreState(): StoreState {
  const fallback: StoreState = {
    search: '',
    category: 'All',
    selectedId: storeApps[0]?.id ?? '',
    installed: ['focus-flow', 'quiet-space', 'skyline-mail'],
  }
  const raw = safeRead<unknown>(STORE_KEY, fallback)
  if (!isRecord(raw)) return fallback
  const installed = Array.isArray(raw.installed)
    ? unique(raw.installed.filter((item): item is string => typeof item === 'string'))
    : fallback.installed
  const category = typeof raw.category === 'string' && ['All', 'Productivity', 'Creativity', 'Travel', 'Wellness', 'Utilities'].includes(raw.category)
    ? raw.category as StoreCategory
    : fallback.category
  const selectedId = typeof raw.selectedId === 'string' && storeApps.some(app => app.id === raw.selectedId)
    ? raw.selectedId
    : fallback.selectedId
  const search = typeof raw.search === 'string' ? raw.search : fallback.search
  return { search, category, selectedId, installed }
}

function saveStoreState(state: StoreState) {
  safeWrite(STORE_KEY, state)
}

function getShortcutsState(): ShortcutsState {
  const fallback: ShortcutsState = {
    selectedId: shortcutTemplates[0]?.id ?? '',
    category: 'All',
    custom: [
      {
        id: 'morning-check',
        name: 'Morning Check',
        emoji: '☀',
        category: 'Morning',
        kind: 'note',
        payload: 'Open weather, calendar, and a fresh task list.',
        description: 'A gentle opener for the first few minutes of the day.',
        createdAt: Date.now() - 86400000,
      },
    ],
    usage: {},
    recentRuns: [
      { id: crypto.randomUUID(), shortcutId: 'focus-25', title: 'Focus 25', result: 'Started a 25-minute timer', at: Date.now() - 3600000 },
      { id: crypto.randomUUID(), shortcutId: 'quick-note', title: 'Quick Note', result: 'Saved a note draft', at: Date.now() - 5400000 },
    ],
    draft: {
      name: '',
      emoji: '✦',
      category: 'Work',
      kind: 'timer',
      payload: '',
    },
  }
  const raw = safeRead<unknown>(SHORTCUTS_KEY, fallback)
  if (!isRecord(raw)) return fallback
  const custom = Array.isArray(raw.custom)
    ? raw.custom.flatMap(item => parseShortcut(item, false))
    : fallback.custom
  const usage: Record<string, ShortcutUsage> = {}
  if (isRecord(raw.usage)) {
    for (const [key, value] of Object.entries(raw.usage)) {
      if (!isRecord(value)) continue
      usage[key] = {
        runs: typeof value.runs === 'number' ? value.runs : 0,
        lastRunAt: typeof value.lastRunAt === 'number' ? value.lastRunAt : null,
      }
    }
  }
  const recentRuns = Array.isArray(raw.recentRuns)
    ? raw.recentRuns.flatMap(item => {
      if (!isRecord(item) || typeof item.id !== 'string' || typeof item.shortcutId !== 'string' || typeof item.title !== 'string' || typeof item.result !== 'string') return []
      return [{
        id: item.id,
        shortcutId: item.shortcutId,
        title: item.title,
        result: item.result,
        at: typeof item.at === 'number' ? item.at : Date.now(),
      }]
    })
    : fallback.recentRuns
  const category = typeof raw.category === 'string' && ['All', 'Morning', 'Work', 'Home', 'Travel', 'Play'].includes(raw.category)
    ? raw.category as ShortcutCategory
    : fallback.category
  const selectedId = typeof raw.selectedId === 'string' ? raw.selectedId : fallback.selectedId
  const draft = isRecord(raw.draft)
    ? {
        name: typeof raw.draft.name === 'string' ? raw.draft.name : fallback.draft.name,
        emoji: typeof raw.draft.emoji === 'string' ? raw.draft.emoji : fallback.draft.emoji,
        category: typeof raw.draft.category === 'string' && ['Morning', 'Work', 'Home', 'Travel', 'Play'].includes(raw.draft.category)
          ? raw.draft.category as Exclude<ShortcutCategory, 'All'>
          : fallback.draft.category,
        kind: typeof raw.draft.kind === 'string' && ['timer', 'note', 'message', 'open-app', 'translate'].includes(raw.draft.kind)
          ? raw.draft.kind as ShortcutKind
          : fallback.draft.kind,
        payload: typeof raw.draft.payload === 'string' ? raw.draft.payload : fallback.draft.payload,
      }
    : fallback.draft
  return { selectedId, category, custom, usage, recentRuns, draft }
}

function saveShortcutsState(state: ShortcutsState) {
  safeWrite(SHORTCUTS_KEY, state)
}

function parseShortcut(value: unknown, builtIn: boolean): Shortcut[] {
  if (!isRecord(value)) return []
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const emoji = typeof value.emoji === 'string' && value.emoji.trim() ? value.emoji : '✦'
  const category = typeof value.category === 'string' && ['Morning', 'Work', 'Home', 'Travel', 'Play'].includes(value.category)
    ? value.category as Exclude<ShortcutCategory, 'All'>
    : 'Work'
  const kind = typeof value.kind === 'string' && ['timer', 'note', 'message', 'open-app', 'translate'].includes(value.kind)
    ? value.kind as ShortcutKind
    : 'note'
  const payload = typeof value.payload === 'string' ? value.payload : ''
  if (!name) return []
  return [{
    id: typeof value.id === 'string' ? value.id : crypto.randomUUID(),
    name,
    emoji,
    category,
    kind,
    payload,
    description: typeof value.description === 'string' ? value.description : '',
    builtIn,
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
  }]
}

function getTranslateState(): TranslateState {
  const fallback: TranslateState = {
    source: 'en',
    target: 'es',
    phrase: 'Hello',
    favorites: [],
  }
  const raw = safeRead<unknown>(TRANSLATE_KEY, fallback)
  if (!isRecord(raw)) return fallback
  const isLanguage = (value: unknown): value is LanguageCode => typeof value === 'string' && ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko'].includes(value)
  const favorites = Array.isArray(raw.favorites)
    ? raw.favorites.flatMap(item => {
      if (!isRecord(item)) return []
      if (typeof item.id !== 'string' || typeof item.entryId !== 'string' || typeof item.phrase !== 'string' || typeof item.translation !== 'string' || typeof item.savedAt !== 'number') return []
      return [{
        id: item.id,
        entryId: item.entryId,
        source: isLanguage(item.source) ? item.source : 'en',
        target: isLanguage(item.target) ? item.target : 'es',
        phrase: item.phrase,
        translation: item.translation,
        savedAt: item.savedAt,
      }]
    })
    : fallback.favorites
  const source = isLanguage(raw.source) ? raw.source : fallback.source
  const target = isLanguage(raw.target) ? raw.target : fallback.target
  const phrase = typeof raw.phrase === 'string' ? raw.phrase : fallback.phrase
  return source === target
    ? { source, target: source === 'en' ? 'es' : 'en', phrase, favorites }
    : { source, target, phrase, favorites }
}

function saveTranslateState(state: TranslateState) {
  safeWrite(TRANSLATE_KEY, state)
}

function getTipsState(): TipsState {
  const fallback: TipsState = {
    category: 'All',
    selectedId: tipCards[0]?.id ?? '',
    completed: ['set-home-screen'],
    saved: ['pin-shortcuts'],
  }
  const raw = safeRead<unknown>(TIPS_KEY, fallback)
  if (!isRecord(raw)) return fallback
  const allowedCategories: TipCategory[] = ['All', 'Setup', 'Shortcuts', 'Productivity', 'Travel', 'Comfort', 'Wellbeing']
  const category = typeof raw.category === 'string' && allowedCategories.includes(raw.category as TipCategory)
    ? raw.category as TipCategory
    : fallback.category
  const selectedId = typeof raw.selectedId === 'string' && tipCards.some(tip => tip.id === raw.selectedId)
    ? raw.selectedId
    : fallback.selectedId
  const completed = Array.isArray(raw.completed) ? unique(raw.completed.filter((item): item is string => typeof item === 'string' && tipCards.some(tip => tip.id === item))) : fallback.completed
  const saved = Array.isArray(raw.saved) ? unique(raw.saved.filter((item): item is string => typeof item === 'string' && tipCards.some(tip => tip.id === item))) : fallback.saved
  return { category, selectedId, completed, saved }
}

function saveTipsState(state: TipsState) {
  safeWrite(TIPS_KEY, state)
}

function formatDateTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatLongDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function renderPillList(container: HTMLElement, labels: string[]) {
  container.replaceChildren()
  for (const label of labels) {
    const pill = document.createElement('span')
    pill.className = 'discovery-pill'
    pill.textContent = label
    container.append(pill)
  }
}

function getTranslationEntry(phrase: string, source: LanguageCode) {
  const normalized = normalizeText(phrase)
  if (!normalized) return null
  for (const entry of translationEntries) {
    const sourceText = source === 'en' ? entry.phrase : entry.translations[source]
    if (normalizeText(sourceText) === normalized) return entry
  }
  for (const entry of translationEntries) {
    for (const language of languageOptions) {
      const text = language.code === 'en' ? entry.phrase : entry.translations[language.code]
      if (normalizeText(text) === normalized) return entry
    }
  }
  return null
}

function translatePhrase(phrase: string, source: LanguageCode, target: LanguageCode) {
  const entry = getTranslationEntry(phrase, source)
  if (!entry) return null
  return {
    entry,
    translation: target === 'en' ? entry.phrase : entry.translations[target],
    sourceText: source === 'en' ? entry.phrase : entry.translations[source],
  }
}

function runShortcut(shortcut: Shortcut) {
  const now = Date.now()
  let title = shortcut.name
  let result = ''
  let steps: string[] = []

  switch (shortcut.kind) {
    case 'timer': {
      const minutes = Math.max(1, Number.parseInt(shortcut.payload, 10) || 15)
      title = `${shortcut.name} started`
      result = `${minutes}-minute timer started`
      steps = [`Set timer to ${minutes} minutes`, 'Silence distractions', 'Return to the first task']
      break
    }
    case 'note': {
      title = `${shortcut.name} saved`
      result = shortcut.payload.trim() || 'Saved an empty draft'
      steps = ['Open a note surface', 'Drop in the draft text', 'Keep it for later']
      break
    }
    case 'message': {
      title = `${shortcut.name} prepared`
      result = shortcut.payload.trim() || 'Prepared an empty message'
      steps = ['Create a text draft', 'Review the phrasing', 'Send when ready']
      break
    }
    case 'open-app': {
      title = `${shortcut.name} opened`
      result = `Opened ${shortcut.payload.trim() || 'the selected app'}`
      steps = ['Bring the app forward', 'Show the first useful view', 'Keep the next step obvious']
      break
    }
    case 'translate': {
      const translated = translatePhrase(shortcut.payload || 'Hello', 'en', 'es')
      title = `${shortcut.name} translated`
      result = translated ? translated.translation : 'No exact match in the dictionary'
      steps = ['Look up the phrase', 'Swap to Spanish', 'Save the result if it is useful']
      break
    }
  }

  return {
    title,
    result,
    steps,
    at: now,
  }
}

function getFilteredStoreApps(state: StoreState) {
  const query = normalizeText(state.search)
  return storeApps.filter(app => {
    const categoryMatch = state.category === 'All' || app.category === state.category
    const searchMatch = !query || normalizeText([app.name, app.developer, app.category, app.tagline, app.description, app.details, ...app.tags].join(' ')).includes(query)
    return categoryMatch && searchMatch
  })
}

function getStoreSelectedApp(state: StoreState) {
  return storeApps.find(app => app.id === state.selectedId) ?? storeApps[0] ?? null
}

function getStoreFeaturedApp(state: StoreState) {
  return storeApps.find(app => app.featured) ?? getStoreSelectedApp(state)
}

function createStoreApp(): PhoneApp {
  return {
    id: 'discovery-app-store',
    name: 'App Store',
    icon: '▣',
    color: '#79b8ff',
    create() {
      const state = getStoreState()
      const left = document.createElement('section')
      left.className = 'discovery-screen discovery-screen-store discovery-theme-store'
      left.innerHTML = `
        <div class="discovery-header">
          <p class="discovery-date">${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h2>Today</h2>
        </div>
        <article class="discovery-hero-card">
          <div class="discovery-store-feature">
            <span class="discovery-kicker">App of the Day</span>
            <h3>A little focus.<br>A lot of possibility.</h3>
            <div class="discovery-hero-art" aria-hidden="true"></div>
          </div>
          <div class="discovery-hero-copy">
            <strong class="discovery-hero-name"></strong>
            <p class="discovery-hero-tagline"></p>
            <p class="discovery-hero-details"></p>
          </div>
        </article>
        <div class="discovery-install-row">
          <button type="button" class="discovery-primary-button"></button>
          <span class="discovery-status" aria-live="polite"></span>
        </div>
        <dl class="discovery-stat-grid">
          <div><dt>Installed</dt><dd class="discovery-installed-count"></dd></div>
          <div><dt>Available</dt><dd class="discovery-total-count"></dd></div>
          <div><dt>Featured</dt><dd class="discovery-featured-count"></dd></div>
        </dl>
        <p class="discovery-footnote">Demo catalog · Installs are saved locally, not downloaded from the App Store.</p>
      `
      const right = document.createElement('section')
      right.className = 'discovery-screen discovery-screen-store discovery-theme-store'
      right.innerHTML = `
        <div class="discovery-header"><h2>Apps</h2></div>
        <div class="discovery-toolbar">
          <label class="discovery-search">
            <span class="visually-hidden">Search apps</span>
            <input class="discovery-search-input" type="search" placeholder="Games, Apps, Stories and More">
          </label>
          <div class="discovery-filter-row" role="toolbar" aria-label="App categories"></div>
        </div>
        <div class="discovery-scroll-area">
          <div class="discovery-card-list" role="list" aria-label="Apps"></div>
        </div>
        <div class="discovery-footnote">
          <span class="discovery-small-status"></span>
          <div class="discovery-pill-row"></div>
        </div>
      `

      const heroArt = left.querySelector<HTMLElement>('.discovery-hero-art')!
      const heroName = left.querySelector<HTMLElement>('.discovery-hero-name')!
      const heroTagline = left.querySelector<HTMLElement>('.discovery-hero-tagline')!
      const heroDetails = left.querySelector<HTMLElement>('.discovery-hero-details')!
      const installButton = left.querySelector<HTMLButtonElement>('.discovery-primary-button')!
      const status = left.querySelector<HTMLElement>('.discovery-status')!
      const installedCount = left.querySelector<HTMLElement>('.discovery-installed-count')!
      const totalCount = left.querySelector<HTMLElement>('.discovery-total-count')!
      const featuredCount = left.querySelector<HTMLElement>('.discovery-featured-count')!
      const searchInput = right.querySelector<HTMLInputElement>('.discovery-search-input')!
      const filters = right.querySelector<HTMLElement>('.discovery-filter-row')!
      const list = right.querySelector<HTMLElement>('.discovery-card-list')!
      const smallStatus = right.querySelector<HTMLElement>('.discovery-small-status')!
      const pills = right.querySelector<HTMLElement>('.discovery-pill-row')!

      function writeState() {
        saveStoreState(state)
      }

      function toggleInstall(appId: string) {
        if (state.installed.includes(appId)) state.installed = state.installed.filter(id => id !== appId)
        else state.installed = [...state.installed, appId]
        writeState()
        render()
      }

      function selectApp(appId: string) {
        state.selectedId = appId
        writeState()
        render()
      }

      function renderFilters() {
        filters.replaceChildren()
        const counts: Record<string, number> = { All: storeApps.length }
        for (const category of ['Productivity', 'Creativity', 'Travel', 'Wellness', 'Utilities']) {
          counts[category] = storeApps.filter(app => app.category === category).length
        }
        for (const category of ['All', 'Productivity', 'Creativity', 'Travel', 'Wellness', 'Utilities'] as StoreCategory[]) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'discovery-filter'
          button.textContent = `${category} ${counts[category] ?? 0}`
          button.dataset.active = String(state.category === category)
          button.setAttribute('aria-pressed', String(state.category === category))
          button.addEventListener('click', () => {
            state.category = category
            writeState()
            render()
          })
          filters.append(button)
        }
      }

      function renderList() {
        const visible = getFilteredStoreApps(state)
        list.replaceChildren()
        if (!visible.length) {
          const empty = document.createElement('p')
          empty.className = 'discovery-empty'
          empty.textContent = 'No apps match this search. Try a broader category or a different word.'
          list.append(empty)
          return
        }

        for (const app of visible) {
          const card = document.createElement('div')
          card.className = 'discovery-card'
          card.setAttribute('role', 'button')
          card.setAttribute('tabindex', '0')
          card.setAttribute('aria-pressed', String(state.selectedId === app.id))
          card.dataset.selected = String(state.selectedId === app.id)
          card.innerHTML = `
            <div class="discovery-card-art" aria-hidden="true"></div>
            <div class="discovery-card-copy">
              <div class="discovery-card-topline">
                <strong class="discovery-card-name"></strong>
                <span class="discovery-card-price"></span>
              </div>
              <p class="discovery-card-subtitle"></p>
              <p class="discovery-card-meta"></p>
              <div class="discovery-card-tags"></div>
            </div>
            <button type="button" class="discovery-card-action"></button>
          `
          const art = card.querySelector<HTMLElement>('.discovery-card-art')!
          art.style.setProperty('--accent', app.accent)
          art.textContent = app.icon
          card.querySelector<HTMLElement>('.discovery-card-name')!.textContent = app.name
          card.querySelector<HTMLElement>('.discovery-card-price')!.textContent = app.price
          card.querySelector<HTMLElement>('.discovery-card-subtitle')!.textContent = app.tagline
          card.querySelector<HTMLElement>('.discovery-card-meta')!.textContent = `${app.category} • ${app.developer} • ${formatRating(app.rating)} ★ (${app.reviews})`
          const tagContainer = card.querySelector<HTMLElement>('.discovery-card-tags')!
          renderPillList(tagContainer, app.tags)
          const action = card.querySelector<HTMLButtonElement>('.discovery-card-action')!
          action.textContent = state.installed.includes(app.id) ? 'Remove' : 'Get'
          action.setAttribute('aria-label', `${state.installed.includes(app.id) ? 'Remove' : 'Install'} ${app.name}`)
          action.dataset.installed = String(state.installed.includes(app.id))
          action.addEventListener('click', event => {
            event.stopPropagation()
            toggleInstall(app.id)
          })
          card.addEventListener('click', () => selectApp(app.id))
          card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              selectApp(app.id)
            }
          })
          list.append(card)
        }
      }

      function renderSelected() {
        const selected = getStoreSelectedApp(state) ?? getStoreFeaturedApp(state)
        if (!selected) return
        heroArt.textContent = selected.icon
        heroArt.style.setProperty('--accent', selected.accent)
        heroName.textContent = selected.name
        heroTagline.textContent = `${selected.category} · ${formatRating(selected.rating)} ★`
        heroDetails.textContent = selected.details
        left.querySelector('.discovery-store-feature h3')!.textContent = selected.tagline
        installButton.textContent = state.installed.includes(selected.id) ? 'Remove' : 'Get'
        installButton.dataset.installed = String(state.installed.includes(selected.id))
        installButton.style.setProperty('--accent', selected.accent)
        installButton.onclick = () => toggleInstall(selected.id)
        status.textContent = state.installed.includes(selected.id) ? 'Installed on this Duo' : 'Ready to install'
        installedCount.textContent = String(state.installed.length)
        totalCount.textContent = String(storeApps.length)
        featuredCount.textContent = String(storeApps.filter(app => app.featured).length)
        const installedNames = state.installed.map(id => storeApps.find(app => app.id === id)?.name).filter((name): name is string => Boolean(name))
        renderPillList(pills, installedNames.slice(0, 5))
        smallStatus.textContent = state.search.trim() ? `${getFilteredStoreApps(state).length} matches for “${state.search.trim()}”` : `${getFilteredStoreApps(state).length} apps in view`
      }

      function render() {
        renderFilters()
        renderList()
        renderSelected()
        searchInput.value = state.search
      }

      searchInput.addEventListener('input', () => {
        state.search = searchInput.value
        writeState()
        renderList()
        renderSelected()
      })

      render()
      return { left, right }
    },
  }
}

function shortcutActionLabel(kind: ShortcutKind) {
  switch (kind) {
    case 'timer': return 'Timer'
    case 'note': return 'Note'
    case 'message': return 'Message'
    case 'open-app': return 'Open app'
    case 'translate': return 'Translate'
  }
}

function shortcutCategoryList() {
  return ['All', 'Morning', 'Work', 'Home', 'Travel', 'Play'] as ShortcutCategory[]
}

function getShortcutDisplayKind(shortcut: Shortcut) {
  return shortcut.builtIn ? 'Template' : 'Custom'
}

function getShortcuts(kind: ShortcutCategory, custom: Shortcut[]) {
  const all = [...shortcutTemplates, ...custom]
  return kind === 'All' ? all : all.filter(shortcut => shortcut.category === kind)
}

function createShortcutsApp(): PhoneApp {
  return {
    id: 'discovery-shortcuts',
    name: 'Shortcuts',
    icon: '⚡',
    color: '#9b7dff',
    create() {
      const state = getShortcutsState()
      const left = document.createElement('section')
      left.className = 'discovery-screen discovery-screen-shortcuts discovery-theme-shortcuts'
      left.innerHTML = `
        <div class="discovery-header">
          <p class="discovery-back-label">Shortcuts</p>
          <h2>Shortcut</h2>
        </div>
        <article class="discovery-detail-card">
          <div class="discovery-detail-topline">
            <span class="discovery-kicker">Selected shortcut</span>
            <span class="discovery-detail-type"></span>
          </div>
          <div class="discovery-detail-art" aria-hidden="true"></div>
          <strong class="discovery-detail-name"></strong>
          <p class="discovery-detail-description"></p>
          <div class="discovery-detail-meta"></div>
          <button type="button" class="discovery-primary-button"></button>
        </article>
        <section class="discovery-run-log" aria-label="Shortcut activity">
          <div class="discovery-section-heading">
            <h3>Recent runs</h3>
            <span class="discovery-small-status"></span>
          </div>
          <div class="discovery-log-list"></div>
        </section>
      `
      const right = document.createElement('section')
      right.className = 'discovery-screen discovery-screen-shortcuts discovery-theme-shortcuts'
      right.innerHTML = `
        <div class="discovery-header discovery-header-actions">
          <h2>All Shortcuts</h2>
          <button type="button" class="discovery-add-button" data-new-shortcut aria-label="Create shortcut">+</button>
        </div>
        <div class="discovery-toolbar discovery-toolbar-stack">
          <div class="discovery-filter-row discovery-filter-row-wrap" role="toolbar" aria-label="Shortcut categories"></div>
          <div class="discovery-section-heading">
            <h3>Starter Shortcuts</h3>
            <span class="discovery-small-status">Built-in shortcuts</span>
          </div>
          <div class="discovery-gallery"></div>
        </div>
        <div class="discovery-scroll-area discovery-scroll-area-shortcuts">
          <section class="discovery-library-section">
            <div class="discovery-section-heading">
              <h3>My shortcuts</h3>
              <span class="discovery-small-status"></span>
            </div>
            <div class="discovery-library-list"></div>
          </section>
          <section class="discovery-form-card">
            <div class="discovery-section-heading">
              <h3>Create a shortcut</h3>
              <span class="discovery-small-status">Saved locally</span>
            </div>
            <form class="discovery-form">
              <label class="discovery-field">
                <span>Name</span>
                <input class="discovery-input discovery-shortcut-name" type="text" maxlength="30" placeholder="Evening reset">
              </label>
              <div class="discovery-form-grid">
                <label class="discovery-field discovery-field-inline">
                  <span>Emoji</span>
                  <input class="discovery-input discovery-shortcut-emoji" type="text" maxlength="2" placeholder="✦">
                </label>
                <label class="discovery-field discovery-field-inline">
                  <span>Category</span>
                  <select class="discovery-input discovery-shortcut-category"></select>
                </label>
              </div>
              <label class="discovery-field">
                <span>Action</span>
                <select class="discovery-input discovery-shortcut-kind"></select>
              </label>
              <label class="discovery-field">
                <span class="discovery-shortcut-payload-label">Details</span>
                <textarea class="discovery-input discovery-shortcut-payload" rows="3" placeholder="What should this shortcut do?"></textarea>
              </label>
              <div class="discovery-form-actions">
                <button type="submit" class="discovery-primary-button">Create shortcut</button>
                <span class="discovery-small-status discovery-form-status"></span>
              </div>
            </form>
          </section>
        </div>
      `

      const selectedType = left.querySelector<HTMLElement>('.discovery-detail-type')!
      const selectedArt = left.querySelector<HTMLElement>('.discovery-detail-art')!
      const selectedName = left.querySelector<HTMLElement>('.discovery-detail-name')!
      const selectedDescription = left.querySelector<HTMLElement>('.discovery-detail-description')!
      const selectedMeta = left.querySelector<HTMLElement>('.discovery-detail-meta')!
      const runButton = left.querySelector<HTMLButtonElement>('.discovery-primary-button')!
      const runStatus = left.querySelector<HTMLElement>('.discovery-small-status')!
      const runLog = left.querySelector<HTMLElement>('.discovery-log-list')!
      const categories = right.querySelector<HTMLElement>('.discovery-filter-row')!
      const gallery = right.querySelector<HTMLElement>('.discovery-gallery')!
      const libraryStatus = right.querySelector<HTMLElement>('.discovery-library-section .discovery-small-status')!
      const libraryList = right.querySelector<HTMLElement>('.discovery-library-list')!
      const form = right.querySelector<HTMLFormElement>('.discovery-form')!
      const nameInput = right.querySelector<HTMLInputElement>('.discovery-shortcut-name')!
      const emojiInput = right.querySelector<HTMLInputElement>('.discovery-shortcut-emoji')!
      const categorySelect = right.querySelector<HTMLSelectElement>('.discovery-shortcut-category')!
      const kindSelect = right.querySelector<HTMLSelectElement>('.discovery-shortcut-kind')!
      const payloadLabel = right.querySelector<HTMLElement>('.discovery-shortcut-payload-label')!
      const payloadInput = right.querySelector<HTMLTextAreaElement>('.discovery-shortcut-payload')!
      const formStatus = right.querySelector<HTMLElement>('.discovery-form-status')!
      right.querySelector('[data-new-shortcut]')!.addEventListener('click', () => {
        form.scrollIntoView({ block: 'start', behavior: 'instant' })
        nameInput.focus({ preventScroll: true })
      })

      function populateFormSelects() {
        categorySelect.replaceChildren()
        for (const category of ['Morning', 'Work', 'Home', 'Travel', 'Play'] as Array<Exclude<ShortcutCategory, 'All'>>) {
          const option = document.createElement('option')
          option.value = category
          option.textContent = category
          categorySelect.append(option)
        }
        kindSelect.replaceChildren()
        const kindLabels: Record<ShortcutKind, string> = {
          timer: 'Timer',
          note: 'Note',
          message: 'Message',
          'open-app': 'Open app',
          translate: 'Translate',
        }
        for (const kind of ['timer', 'note', 'message', 'open-app', 'translate'] as ShortcutKind[]) {
          const option = document.createElement('option')
          option.value = kind
          option.textContent = kindLabels[kind]
          kindSelect.append(option)
        }
      }

            function findShortcut(id: string) {
              return [...shortcutTemplates, ...state.custom].find(shortcut => shortcut.id === id) ?? shortcutTemplates[0] ?? null
            }

      function updateUsage(shortcut: Shortcut, run: ShortcutRun) {
        const usage = state.usage[shortcut.id] ?? { runs: 0, lastRunAt: null }
        state.usage[shortcut.id] = {
          runs: usage.runs + 1,
          lastRunAt: run.at,
        }
        state.recentRuns = [run, ...state.recentRuns].slice(0, 6)
        saveShortcutsState(state)
      }

      function selectShortcut(id: string) {
        state.selectedId = id
        saveShortcutsState(state)
        renderSelected()
        renderLibrary()
      }

      function renderCategories() {
        categories.replaceChildren()
        for (const category of shortcutCategoryList()) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'discovery-filter'
          button.textContent = category
          button.dataset.active = String(state.category === category)
          button.setAttribute('aria-pressed', String(state.category === category))
          button.addEventListener('click', () => {
            state.category = category
            saveShortcutsState(state)
            renderCategories()
            renderGallery()
            renderLibrary()
          })
          categories.append(button)
        }
      }

      function renderSelected() {
        const selected = findShortcut(state.selectedId) ?? shortcutTemplates[0]
        if (!selected) return
        const usage = state.usage[selected.id] ?? { runs: 0, lastRunAt: null }
        selectedType.textContent = `${getShortcutDisplayKind(selected)} • ${selected.category} • ${shortcutActionLabel(selected.kind)}`
        selectedArt.textContent = selected.emoji
        selectedName.textContent = selected.name
        selectedDescription.textContent = selected.description
        selectedMeta.textContent = `${selected.payload || 'No payload'} · ${usage.runs} runs${usage.lastRunAt ? ` · last run ${formatDateTime(usage.lastRunAt)}` : ''}`
        runButton.textContent = `Run ${selected.name}`
        runButton.onclick = () => {
          const run = runShortcut(selected)
          updateUsage(selected, {
            id: crypto.randomUUID(),
            shortcutId: selected.id,
            title: run.title,
            result: run.result,
            at: run.at,
          })
          runStatus.textContent = `Ran ${selected.name} just now`
          renderSelected()
          renderRunLog()
          renderLibrary()
        }
        runStatus.textContent = usage.lastRunAt ? `Last run ${formatLongDate(usage.lastRunAt)} at ${formatDateTime(usage.lastRunAt)}` : 'Ready to run'
      }

      function createShortcutCard(shortcut: Shortcut, builtIn: boolean) {
        const usage = state.usage[shortcut.id] ?? { runs: 0, lastRunAt: null }
        const card = document.createElement('div')
        card.className = 'discovery-card discovery-shortcut-card'
        card.setAttribute('role', 'button')
        card.setAttribute('tabindex', '0')
        card.setAttribute('aria-pressed', String(state.selectedId === shortcut.id))
        card.dataset.selected = String(state.selectedId === shortcut.id)
        card.dataset.kind = shortcut.kind
        card.innerHTML = `
          <div class="discovery-card-art discovery-shortcut-art" aria-hidden="true"></div>
          <div class="discovery-card-copy">
            <div class="discovery-card-topline">
              <strong class="discovery-card-name"></strong>
              <span class="discovery-card-price"></span>
            </div>
            <p class="discovery-card-subtitle"></p>
            <p class="discovery-card-meta"></p>
          </div>
          <button type="button" class="discovery-card-action"></button>
        `
        const art = card.querySelector<HTMLElement>('.discovery-card-art')!
        art.textContent = shortcut.emoji
        art.style.setProperty('--accent', builtIn ? '#9b7dff' : '#66d0c0')
        card.querySelector<HTMLElement>('.discovery-card-name')!.textContent = shortcut.name
        card.querySelector<HTMLElement>('.discovery-card-price')!.textContent = shortcut.kind
        card.querySelector<HTMLElement>('.discovery-card-subtitle')!.textContent = shortcut.description
        card.querySelector<HTMLElement>('.discovery-card-meta')!.textContent = `${shortcut.category} • ${usage.runs} runs${usage.lastRunAt ? ` • ${formatDateTime(usage.lastRunAt)}` : ''}`
        const action = card.querySelector<HTMLButtonElement>('.discovery-card-action')!
        action.textContent = '▶'
        action.setAttribute('aria-label', `Run ${shortcut.name}`)
        action.addEventListener('click', event => {
          event.stopPropagation()
          const run = runShortcut(shortcut)
          updateUsage(shortcut, {
            id: crypto.randomUUID(),
            shortcutId: shortcut.id,
            title: run.title,
            result: run.result,
            at: run.at,
          })
          renderSelected()
          renderRunLog()
          renderLibrary()
        })
        card.addEventListener('click', () => selectShortcut(shortcut.id))
        card.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            selectShortcut(shortcut.id)
          }
        })
        return card
      }

      function renderGallery() {
        gallery.replaceChildren()
        const templates = getShortcuts(state.category, [])
        for (const shortcut of templates) gallery.append(createShortcutCard(shortcut, true))
        if (!templates.length) {
          const empty = document.createElement('p')
          empty.className = 'discovery-empty'
          empty.textContent = 'No templates match this category.'
          gallery.append(empty)
        }
      }

      function renderLibrary() {
        libraryList.replaceChildren()
        const customs = getShortcuts(state.category, state.custom).filter(shortcut => !shortcut.builtIn)
        libraryStatus.textContent = `${customs.length} custom shortcuts`
        for (const shortcut of customs) libraryList.append(createShortcutCard(shortcut, false))
        if (!customs.length) {
          const empty = document.createElement('p')
          empty.className = 'discovery-empty discovery-empty-small'
          empty.textContent = 'Create a shortcut and it will appear here.'
          libraryList.append(empty)
        }
      }

      function renderRunLog() {
        runLog.replaceChildren()
        if (!state.recentRuns.length) {
          const empty = document.createElement('p')
          empty.className = 'discovery-empty discovery-empty-small'
          empty.textContent = 'Run a shortcut to build your activity log.'
          runLog.append(empty)
          return
        }
        for (const run of state.recentRuns) {
          const item = document.createElement('article')
          item.className = 'discovery-log-item'
          item.innerHTML = `
            <div>
              <strong></strong>
              <p></p>
            </div>
            <time></time>
          `
          item.querySelector('strong')!.textContent = run.title
          item.querySelector('p')!.textContent = run.result
          item.querySelector('time')!.textContent = formatDateTime(run.at)
          runLog.append(item)
        }
      }

      function updatePayloadLabel() {
        const labels: Record<ShortcutKind, string> = {
          timer: 'Minutes',
          note: 'Note text',
          message: 'Message text',
          'open-app': 'App name',
          translate: 'Phrase to translate',
        }
        payloadLabel.textContent = labels[state.draft.kind]
        payloadInput.placeholder = labels[state.draft.kind]
      }

      function hydrateForm() {
        nameInput.value = state.draft.name
        emojiInput.value = state.draft.emoji
        payloadInput.value = state.draft.payload
        categorySelect.value = state.draft.category
        kindSelect.value = state.draft.kind
        updatePayloadLabel()
      }

      function render() {
        populateFormSelects()
        renderCategories()
        renderGallery()
        renderLibrary()
        renderSelected()
        renderRunLog()
        hydrateForm()
      }

      function persistDraft() {
        saveShortcutsState(state)
      }

      nameInput.addEventListener('input', () => {
        state.draft.name = nameInput.value
        persistDraft()
      })
      emojiInput.addEventListener('input', () => {
        state.draft.emoji = emojiInput.value.slice(0, 2) || '✦'
        persistDraft()
      })
      categorySelect.addEventListener('change', () => {
        state.draft.category = categorySelect.value as Exclude<ShortcutCategory, 'All'>
        persistDraft()
      })
      kindSelect.addEventListener('change', () => {
        state.draft.kind = kindSelect.value as ShortcutKind
        updatePayloadLabel()
        persistDraft()
      })
      payloadInput.addEventListener('input', () => {
        state.draft.payload = payloadInput.value
        persistDraft()
      })
      form.addEventListener('submit', event => {
        event.preventDefault()
        const name = state.draft.name.trim()
        if (!name) {
          formStatus.textContent = 'Give the shortcut a name.'
          return
        }
        const shortcut: Shortcut = {
          id: crypto.randomUUID(),
          name,
          emoji: state.draft.emoji.trim() || '✦',
          category: state.draft.category,
          kind: state.draft.kind,
          payload: state.draft.payload.trim(),
          description: shortcutActionLabel(state.draft.kind),
          createdAt: Date.now(),
        }
        state.custom = [shortcut, ...state.custom]
        state.selectedId = shortcut.id
        state.draft = {
          name: '',
          emoji: '✦',
          category: state.draft.category,
          kind: state.draft.kind,
          payload: '',
        }
        formStatus.textContent = 'Shortcut created.'
        saveShortcutsState(state)
        render()
      })

      render()
      return { left: right, right: left }
    },
  }
}

function getTranslationMatches(state: TranslateState) {
  const phrase = state.phrase.trim()
  if (!phrase) return null
  const match = translatePhrase(phrase, state.source, state.target)
  if (!match) return null
  const key = `${match.entry.id}:${state.source}:${state.target}`
  const favorite = state.favorites.find(item => item.entryId === match.entry.id && item.source === state.source && item.target === state.target)
  return {
    key,
    entry: match.entry,
    sourceText: match.sourceText,
    translation: match.translation,
    favorite,
  }
}

function createTranslateApp(): PhoneApp {
  return {
    id: 'discovery-translate',
    name: 'Translate',
    icon: '⇄',
    color: '#65d4ff',
    create() {
      const state = getTranslateState()
      const left = document.createElement('section')
      left.className = 'discovery-screen discovery-screen-translate discovery-theme-translate'
      left.innerHTML = `
        <div class="discovery-header">
          <h2>Translate</h2>
        </div>
        <div class="discovery-translation-panel">
          <div class="discovery-language-row">
            <label class="discovery-field discovery-field-inline">
              <span class="visually-hidden">From</span>
              <select class="discovery-input discovery-language-source"></select>
            </label>
            <button type="button" class="discovery-swap-button" aria-label="Swap languages">⇄</button>
            <label class="discovery-field discovery-field-inline">
              <span class="visually-hidden">To</span>
              <select class="discovery-input discovery-language-target"></select>
            </label>
          </div>
          <label class="discovery-field discovery-phrase-field">
            <span class="visually-hidden">Phrase</span>
            <textarea class="discovery-input discovery-phrase-input" rows="3" placeholder="Enter text"></textarea>
          </label>
          <article class="discovery-result-card" aria-live="polite">
            <div class="discovery-result-topline">
              <span class="discovery-kicker">Translation</span>
              <span class="discovery-result-status"></span>
            </div>
            <strong class="discovery-result-translation"></strong>
            <p class="discovery-result-source"></p>
            <p class="discovery-result-note"></p>
          </article>
          <div class="discovery-form-actions">
            <button type="button" class="discovery-primary-button discovery-favorite-button"></button>
            <span class="discovery-small-status discovery-translate-status"></span>
          </div>
        </div>
        <p class="discovery-footnote">Offline demo · Built-in phrase dictionary only</p>
      `
      const right = document.createElement('section')
      right.className = 'discovery-screen discovery-screen-translate discovery-theme-translate'
      right.innerHTML = `
        <div class="discovery-header"><h2>Favorites</h2></div>
        <section class="discovery-section-block">
          <div class="discovery-section-heading">
            <h3>Common phrases</h3>
            <span class="discovery-small-status">Tap to load</span>
          </div>
          <div class="discovery-gallery discovery-gallery-phrases"></div>
        </section>
        <section class="discovery-section-block discovery-favorites-block">
          <div class="discovery-section-heading">
            <h3>Favorites</h3>
            <span class="discovery-small-status discovery-favorite-count"></span>
          </div>
          <div class="discovery-favorites-list"></div>
        </section>
      `

      const sourceSelect = left.querySelector<HTMLSelectElement>('.discovery-language-source')!
      const targetSelect = left.querySelector<HTMLSelectElement>('.discovery-language-target')!
      const swapButton = left.querySelector<HTMLButtonElement>('.discovery-swap-button')!
      const phraseInput = left.querySelector<HTMLTextAreaElement>('.discovery-phrase-input')!
      const resultStatus = left.querySelector<HTMLElement>('.discovery-result-status')!
      const resultTranslation = left.querySelector<HTMLElement>('.discovery-result-translation')!
      const resultSource = left.querySelector<HTMLElement>('.discovery-result-source')!
      const resultNote = left.querySelector<HTMLElement>('.discovery-result-note')!
      const favoriteButton = left.querySelector<HTMLButtonElement>('.discovery-favorite-button')!
      const translateStatus = left.querySelector<HTMLElement>('.discovery-translate-status')!
      const phraseGallery = right.querySelector<HTMLElement>('.discovery-gallery-phrases')!
      const favoritesList = right.querySelector<HTMLElement>('.discovery-favorites-list')!
      const favoriteCount = right.querySelector<HTMLElement>('.discovery-favorite-count')!

      function persist() {
        saveTranslateState(state)
      }

      function populateLanguageSelect(select: HTMLSelectElement, selected: LanguageCode) {
        select.replaceChildren()
        for (const option of languageOptions) {
          const element = document.createElement('option')
          element.value = option.code
          element.textContent = option.label
          if (option.code === selected) element.selected = true
          select.append(element)
        }
      }

      function updateLanguageSummary() {
        const sourceOption = languageOptions.find(option => option.code === state.source)
        const targetOption = languageOptions.find(option => option.code === state.target)
        translateStatus.textContent = sourceOption && targetOption ? `${sourceOption.label} → ${targetOption.label}` : 'Choose a language pair'
      }

      function isFavorite(match: ReturnType<typeof getTranslationMatches>) {
        return Boolean(match?.favorite)
      }

      function renderResult() {
        const match = getTranslationMatches(state)
        updateLanguageSummary()
        if (!match) {
          resultStatus.textContent = 'No exact match'
          resultTranslation.textContent = 'Type a phrase from the built-in dictionary.'
          resultSource.textContent = 'Try a phrase like “Hello”, “Thank you”, or “Where is the station?”'
          resultNote.textContent = 'The app translates from the phrase book below and keeps your favorites locally.'
          favoriteButton.disabled = true
          favoriteButton.textContent = 'Save translation'
          favoriteButton.setAttribute('aria-pressed', 'false')
          return
        }
        resultStatus.textContent = `${languageOptions.find(option => option.code === state.source)?.label ?? state.source} → ${languageOptions.find(option => option.code === state.target)?.label ?? state.target}`
        resultTranslation.textContent = match.translation
        resultSource.textContent = match.sourceText
        resultNote.textContent = match.entry.note
        favoriteButton.disabled = false
        favoriteButton.textContent = isFavorite(match) ? 'Saved to favorites' : 'Save to favorites'
        favoriteButton.setAttribute('aria-pressed', String(isFavorite(match)))
      }

      function renderPhraseGallery() {
        phraseGallery.replaceChildren()
        for (const entry of translationEntries.slice(0, 8)) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'discovery-phrase-card'
          button.innerHTML = `
            <strong></strong>
            <span></span>
          `
          button.querySelector('strong')!.textContent = entry.phrase
          button.querySelector('span')!.textContent = entry.category
          button.addEventListener('click', () => {
            state.source = 'en'
            if (state.target === state.source) state.target = 'es'
            state.phrase = entry.phrase
            persist()
            sourceSelect.value = state.source
            targetSelect.value = state.target
            phraseInput.value = state.phrase
            renderResult()
          })
          phraseGallery.append(button)
        }
      }

      function renderFavorites() {
        favoritesList.replaceChildren()
        favoriteCount.textContent = `${state.favorites.length} saved`
        if (!state.favorites.length) {
          const empty = document.createElement('p')
          empty.className = 'discovery-empty discovery-empty-small'
          empty.textContent = 'Save translations here to keep them handy.'
          favoritesList.append(empty)
          return
        }
        for (const favorite of state.favorites.slice().sort((a, b) => b.savedAt - a.savedAt)) {
          const item = document.createElement('article')
          item.className = 'discovery-favorite-card'
          item.innerHTML = `
            <div>
              <strong></strong>
              <p></p>
            </div>
            <button type="button"></button>
          `
          item.querySelector('strong')!.textContent = favorite.phrase
          item.querySelector('p')!.textContent = `${favorite.translation} • ${languageOptions.find(option => option.code === favorite.source)?.label ?? favorite.source} → ${languageOptions.find(option => option.code === favorite.target)?.label ?? favorite.target}`
          const button = item.querySelector<HTMLButtonElement>('button')!
          button.textContent = 'Remove'
          button.addEventListener('click', () => {
            state.favorites = state.favorites.filter(saved => saved.id !== favorite.id)
            persist()
            renderFavorites()
            renderResult()
          })
          favoritesList.append(item)
        }
      }

      function addOrRemoveFavorite() {
        const match = getTranslationMatches(state)
        if (!match) return
        const existing = state.favorites.find(item => item.entryId === match.entry.id && item.source === state.source && item.target === state.target)
        if (existing) {
          state.favorites = state.favorites.filter(item => item.id !== existing.id)
        } else {
          state.favorites = [
            {
              id: crypto.randomUUID(),
              entryId: match.entry.id,
              source: state.source,
              target: state.target,
              phrase: match.sourceText,
              translation: match.translation,
              savedAt: Date.now(),
            },
            ...state.favorites,
          ]
        }
        persist()
        renderFavorites()
        renderResult()
      }

      function syncControls() {
        populateLanguageSelect(sourceSelect, state.source)
        populateLanguageSelect(targetSelect, state.target)
        phraseInput.value = state.phrase
      }

      function render() {
        syncControls()
        renderPhraseGallery()
        renderFavorites()
        renderResult()
      }

      sourceSelect.addEventListener('change', () => {
        state.source = sourceSelect.value as LanguageCode
        if (state.source === state.target) {
          state.target = state.source === 'en' ? 'es' : 'en'
          populateLanguageSelect(targetSelect, state.target)
        }
        persist()
        renderResult()
        renderFavorites()
      })
      targetSelect.addEventListener('change', () => {
        state.target = targetSelect.value as LanguageCode
        if (state.target === state.source) {
          state.source = state.target === 'en' ? 'es' : 'en'
          populateLanguageSelect(sourceSelect, state.source)
        }
        persist()
        renderResult()
        renderFavorites()
      })
      swapButton.addEventListener('click', () => {
        const nextSource = state.target
        state.target = state.source
        state.source = nextSource
        persist()
        syncControls()
        renderResult()
        renderFavorites()
      })
      phraseInput.addEventListener('input', () => {
        state.phrase = phraseInput.value
        persist()
        renderResult()
      })
      favoriteButton.addEventListener('click', addOrRemoveFavorite)

      render()
      return { left, right }
    },
  }
}

function getTipsProgress(state: TipsState) {
  const total = tipCards.length
  const completed = state.completed.length
  const saved = state.saved.length
  return {
    total,
    completed,
    saved,
    percentage: Math.round((completed / Math.max(1, total)) * 100),
  }
}

function getFilteredTips(state: TipsState) {
  return state.category === 'All' ? tipCards : tipCards.filter(tip => tip.category === state.category)
}

function createTipsApp(): PhoneApp {
  return {
    id: 'discovery-tips',
    name: 'Tips',
    icon: '✦',
    color: '#ffbf6a',
    create() {
      const state = getTipsState()
      const left = document.createElement('section')
      left.className = 'discovery-screen discovery-screen-tips discovery-theme-tips'
      left.innerHTML = `
        <div class="discovery-header">
          <h2>Tips</h2>
          <p class="discovery-lead">Get more from your iPhone</p>
        </div>
        <h3 class="discovery-collections-title">Collections</h3>
        <div class="discovery-category-list" aria-label="Tip categories"></div>
        <article class="discovery-progress-card">
          <span class="discovery-kicker">Your progress</span>
          <strong class="discovery-progress-number"></strong>
          <p class="discovery-progress-copy"></p>
          <progress class="discovery-progress-bar" max="100" value="0"></progress>
        </article>
        <div class="discovery-summary-row">
          <div><span>Completed</span><strong class="discovery-completed-count"></strong></div>
          <div><span>Saved</span><strong class="discovery-saved-count"></strong></div>
          <div><span>Tips</span><strong class="discovery-total-tip-count"></strong></div>
        </div>
      `
      const right = document.createElement('section')
      right.className = 'discovery-screen discovery-screen-tips discovery-theme-tips'
      right.innerHTML = `
        <div class="discovery-header"><p class="discovery-back-label">Collections</p><h2>Discover more</h2></div>
        <article class="discovery-tip-detail">
          <div class="discovery-detail-topline">
            <span class="discovery-kicker">Selected tip</span>
            <span class="discovery-tip-status"></span>
          </div>
          <strong class="discovery-tip-title"></strong>
          <p class="discovery-tip-summary"></p>
          <p class="discovery-tip-details"></p>
          <div class="discovery-tip-meta"></div>
          <div class="discovery-form-actions">
            <button type="button" class="discovery-primary-button discovery-complete-button"></button>
            <button type="button" class="discovery-secondary-button discovery-save-tip-button"></button>
          </div>
          <ul class="discovery-tip-steps"></ul>
        </article>
        <section class="discovery-scroll-area discovery-scroll-area-tips">
          <div class="discovery-section-heading">
            <h3>Tip cards</h3>
            <span class="discovery-small-status discovery-tip-count"></span>
          </div>
          <div class="discovery-tip-list"></div>
        </section>
      `

      const progressNumber = left.querySelector<HTMLElement>('.discovery-progress-number')!
      const progressCopy = left.querySelector<HTMLElement>('.discovery-progress-copy')!
      const progressBar = left.querySelector<HTMLProgressElement>('.discovery-progress-bar')!
      const categories = left.querySelector<HTMLElement>('.discovery-category-list')!
      const completedCount = left.querySelector<HTMLElement>('.discovery-completed-count')!
      const savedCount = left.querySelector<HTMLElement>('.discovery-saved-count')!
      const totalTipCount = left.querySelector<HTMLElement>('.discovery-total-tip-count')!
      const tipStatus = right.querySelector<HTMLElement>('.discovery-tip-status')!
      const tipTitle = right.querySelector<HTMLElement>('.discovery-tip-title')!
      const tipSummary = right.querySelector<HTMLElement>('.discovery-tip-summary')!
      const tipDetails = right.querySelector<HTMLElement>('.discovery-tip-details')!
      const tipMeta = right.querySelector<HTMLElement>('.discovery-tip-meta')!
      const completeButton = right.querySelector<HTMLButtonElement>('.discovery-complete-button')!
      const saveButton = right.querySelector<HTMLButtonElement>('.discovery-save-tip-button')!
      const tipSteps = right.querySelector<HTMLElement>('.discovery-tip-steps')!
      const tipCount = right.querySelector<HTMLElement>('.discovery-tip-count')!
      const tipList = right.querySelector<HTMLElement>('.discovery-tip-list')!

      function persist() {
        saveTipsState(state)
      }

      function selectedTip() {
        return tipCards.find(tip => tip.id === state.selectedId) ?? getFilteredTips(state)[0] ?? tipCards[0] ?? null
      }

      function renderCategories() {
        categories.replaceChildren()
        for (const category of ['All', 'Setup', 'Shortcuts', 'Productivity', 'Travel', 'Comfort', 'Wellbeing'] as TipCategory[]) {
          const filtered = category === 'All' ? tipCards : tipCards.filter(tip => tip.category === category)
          const done = filtered.filter(tip => state.completed.includes(tip.id)).length
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'discovery-category-card'
          button.dataset.active = String(state.category === category)
          button.setAttribute('aria-pressed', String(state.category === category))
          button.innerHTML = `
            <div class="discovery-collection-art" aria-hidden="true">
              <svg viewBox="0 0 160 120"><rect x="53" y="8" width="54" height="106" rx="11" fill="#18181a"/><rect x="57" y="12" width="46" height="98" rx="8" fill="white"/><rect x="69" y="16" width="22" height="5" rx="3" fill="#18181a"/><rect x="63" y="33" width="34" height="23" rx="5" fill="currentColor"/><path d="M63 66h34M63 76h34M63 86h22" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M73 104h14" stroke="#18181a" stroke-width="2" stroke-linecap="round"/></svg>
            </div>
            <div class="discovery-category-topline">
              <strong></strong>
              <span></span>
            </div>
            <progress max="100" value="0"></progress>
          `
          button.dataset.category = category.toLowerCase()
          button.querySelector('strong')!.textContent = category === 'All' ? 'Get Started' : category
          button.querySelector('span')!.textContent = `${filtered.length} tips · ${done} tried`
          const progress = button.querySelector<HTMLProgressElement>('progress')!
          progress.value = Math.round((done / Math.max(1, filtered.length)) * 100)
          button.addEventListener('click', () => {
            state.category = category
            const filteredTips = getFilteredTips(state)
            if (filteredTips.length && !filteredTips.some(tip => tip.id === state.selectedId)) state.selectedId = filteredTips[0].id
            persist()
            render()
          })
          categories.append(button)
        }
      }

      function renderLeftSummary() {
        const progress = getTipsProgress(state)
        progressNumber.textContent = `${progress.completed}`
        progressCopy.textContent = `${progress.completed} of ${progress.total} tips tried • ${progress.saved} saved`
        progressBar.value = progress.percentage
        completedCount.textContent = createProgressLabel(progress.completed, progress.total)
        savedCount.textContent = String(progress.saved)
        totalTipCount.textContent = String(progress.total)
      }

      function renderTipDetail() {
        const tip = selectedTip()
        if (!tip) return
        const completed = state.completed.includes(tip.id)
        const saved = state.saved.includes(tip.id)
        tipStatus.textContent = `${tip.category} • ${tip.time} • ${tip.effort}`
        tipTitle.textContent = tip.title
        tipSummary.textContent = tip.summary
        tipDetails.textContent = tip.details
        tipMeta.textContent = completed ? 'Tried already' : saved ? 'Saved for later' : 'Not tried yet'
        completeButton.textContent = completed ? 'Undo tried' : 'Mark tried'
        completeButton.onclick = () => {
          if (state.completed.includes(tip.id)) state.completed = state.completed.filter(id => id !== tip.id)
          else state.completed = [tip.id, ...state.completed]
          persist()
          render()
        }
        saveButton.textContent = saved ? 'Saved' : 'Save tip'
        saveButton.classList.toggle('is-active', saved)
        saveButton.onclick = () => {
          if (state.saved.includes(tip.id)) state.saved = state.saved.filter(id => id !== tip.id)
          else state.saved = [tip.id, ...state.saved]
          persist()
          render()
        }
        tipSteps.replaceChildren()
        for (const step of tip.steps) {
          const item = document.createElement('li')
          item.textContent = step
          tipSteps.append(item)
        }
      }

      function renderTipList() {
        tipList.replaceChildren()
        const visible = getFilteredTips(state)
        tipCount.textContent = `${visible.length} cards`
        if (!visible.length) {
          const empty = document.createElement('p')
          empty.className = 'discovery-empty discovery-empty-small'
          empty.textContent = 'No tips in this category yet.'
          tipList.append(empty)
          return
        }
        for (const tip of visible) {
          const completed = state.completed.includes(tip.id)
          const saved = state.saved.includes(tip.id)
          const card = document.createElement('button')
          card.type = 'button'
          card.className = 'discovery-tip-card'
          card.dataset.selected = String(state.selectedId === tip.id)
          card.setAttribute('aria-pressed', String(state.selectedId === tip.id))
          card.innerHTML = `
            <div class="discovery-tip-card-topline">
              <strong></strong>
              <span></span>
            </div>
            <p></p>
            <div class="discovery-tip-card-meta"></div>
            <progress max="100" value="0"></progress>
          `
          card.querySelector('strong')!.textContent = tip.title
          card.querySelector('span')!.textContent = completed ? 'Tried' : saved ? 'Saved' : tip.category
          card.querySelector('p')!.textContent = tip.summary
          card.querySelector<HTMLElement>('.discovery-tip-card-meta')!.textContent = `${tip.time} • ${tip.effort}`
          const progress = card.querySelector<HTMLProgressElement>('progress')!
          progress.value = completed ? 100 : saved ? 60 : 20
          progress.style.setProperty('--accent', tip.accent)
          card.style.setProperty('--accent', tip.accent)
          card.addEventListener('click', () => {
            state.selectedId = tip.id
            persist()
            renderTipDetail()
            renderTipList()
          })
          tipList.append(card)
        }
      }

      function render() {
        renderCategories()
        renderLeftSummary()
        renderTipDetail()
        renderTipList()
      }

      render()
      return { left, right }
    },
  }
}

export const discoveryApps: PhoneApp[] = [
  createStoreApp(),
  createShortcutsApp(),
  createTranslateApp(),
  createTipsApp(),
]
