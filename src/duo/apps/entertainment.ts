import './entertainment.css'

import type { PhoneApp } from './types'

interface MusicTrack {
  id: string
  title: string
  duration: number
  vibe: string
  note: string
}

interface MusicAlbum {
  id: string
  title: string
  artist: string
  year: number
  art: string
  tracks: MusicTrack[]
}

interface MusicState {
  albumId: string
  trackId: string
  progressSeconds: number
  playing: boolean
  favoriteTrackIds: string[]
}

interface PodcastEpisode {
  id: string
  title: string
  duration: number
  guest: string
  note: string
  summary: string
}

interface PodcastShow {
  id: string
  title: string
  host: string
  art: string
  summary: string
  episodes: PodcastEpisode[]
}

interface PodcastState {
  showId: string
  episodeId: string
  progressByEpisode: Record<string, number>
  playing: boolean
  savedEpisodeIds: string[]
  completedEpisodeIds: string[]
}

interface TvEpisode {
  id: string
  title: string
  duration: number
  summary: string
  season: number
  episode: number
}

interface TvShow {
  id: string
  title: string
  network: string
  art: string
  summary: string
  episodes: TvEpisode[]
}

interface TvState {
  showId: string
  episodeId: string
  progressByEpisode: Record<string, number>
  playing: boolean
  watchlistIds: string[]
  watchedEpisodeIds: string[]
}

interface BookChapter {
  id: string
  title: string
  startPage: number
  endPage: number
  excerpt: string
}

interface Book {
  id: string
  title: string
  author: string
  pages: number
  genre: string
  art: string
  summary: string
  chapters: BookChapter[]
}

interface Bookmark {
  id: string
  bookId: string
  page: number
  label: string
}

interface BookState {
  bookId: string
  pageByBook: Record<string, number>
  bookmarks: Bookmark[]
}

interface Game {
  id: string
  title: string
  genre: string
  step: number
  art: string
  summary: string
  modes: string[]
}

interface GameState {
  gameId: string
  running: boolean
  sessionScore: number
  highScores: Record<string, number>
  favoriteGameIds: string[]
}

const storage = {
  music: 'duo-entertainment-music',
  podcasts: 'duo-entertainment-podcasts',
  tv: 'duo-entertainment-tv',
  books: 'duo-entertainment-books',
  games: 'duo-entertainment-games',
}

const musicAlbums: MusicAlbum[] = [
  {
    id: 'midnight-transit',
    title: 'Midnight Transit',
    artist: 'Lunar Coast',
    year: 2024,
    art: 'linear-gradient(150deg, #6c5ce7 0%, #00d4ff 100%)',
    tracks: [
      { id: 'open-line', title: 'Open Line', duration: 218, vibe: 'Warm synths · city lights', note: 'The train pulls out after sunset.' },
      { id: 'city-glow', title: 'City Glow', duration: 247, vibe: 'Electric pulse · late commute', note: 'Neon windows and a soft bassline.' },
      { id: 'after-the-rain', title: 'After the Rain', duration: 263, vibe: 'Airy piano · clean reflections', note: 'Everything sounds a little wider.' },
      { id: 'last-train-home', title: 'Last Train Home', duration: 231, vibe: 'Night ride · glowing chords', note: 'A patient closer with room to breathe.' },
    ],
  },
  {
    id: 'soft-signals',
    title: 'Soft Signals',
    artist: 'Field Notes',
    year: 2023,
    art: 'linear-gradient(150deg, #ff6b6b 0%, #ffd166 100%)',
    tracks: [
      { id: 'handshake', title: 'Handshake', duration: 205, vibe: 'Percussion sketch · friendly handshake', note: 'Feels like bumping into an old friend.' },
      { id: 'slow-bloom', title: 'Slow Bloom', duration: 238, vibe: 'Analog warmth · tender lift', note: 'A steady climb without the rush.' },
      { id: 'paper-sky', title: 'Paper Sky', duration: 254, vibe: 'Dusty keys · paper airplane loop', note: 'A little folded nostalgia.' },
      { id: 'signal-flare', title: 'Signal Flare', duration: 196, vibe: 'Bright drums · crisp edges', note: 'A spark to keep the album awake.' },
    ],
  },
  {
    id: 'static-bloom',
    title: 'Static Bloom',
    artist: 'Night Orchard',
    year: 2025,
    art: 'linear-gradient(150deg, #0f766e 0%, #22c55e 100%)',
    tracks: [
      { id: 'petal-noise', title: 'Petal Noise', duration: 224, vibe: 'Glitch petals · soft distortion', note: 'A small storm that still feels gentle.' },
      { id: 'mirror-field', title: 'Mirror Field', duration: 256, vibe: 'Wide stereo · reflective hush', note: 'A mirror that keeps changing shape.' },
      { id: 'sunroom-static', title: 'Sunroom Static', duration: 242, vibe: 'Morning hum · filtered light', note: 'Bright enough to wake the room.' },
      { id: 'night-garden', title: 'Night Garden', duration: 273, vibe: 'Moonlit pulse · slow petals', note: 'The longest walk through the album.' },
    ],
  },
]

const podcastShows: PodcastShow[] = [
  {
    id: 'city-that-talks',
    title: 'The City That Talks',
    host: 'Mina Reyes',
    art: 'linear-gradient(150deg, #0ea5e9 0%, #1d4ed8 100%)',
    summary: 'Street-level stories about neighborhoods, architecture, and the people who shape them.',
    episodes: [
      { id: 'talks-ep1', title: 'The Elevator That Listened', duration: 28 * 60, guest: 'Rory Vale', note: 'Season opener', summary: 'A building, its lobby regulars, and the stories they leave behind.' },
      { id: 'talks-ep2', title: 'Corner Store Cartography', duration: 34 * 60, guest: 'Nia Clarke', note: 'Field notes', summary: 'Mapping a block through the snacks, radios, and small talk inside it.' },
      { id: 'talks-ep3', title: 'Bridges After Dark', duration: 31 * 60, guest: 'Jonah Pike', note: 'Listener favorite', summary: 'How crossings, railings, and night winds become part of a city’s memory.' },
    ],
  },
  {
    id: 'build-better',
    title: 'Build Better',
    host: 'Avery Stone',
    art: 'linear-gradient(150deg, #8b5cf6 0%, #ec4899 100%)',
    summary: 'Practical conversations about shipping useful things without losing the plot.',
    episodes: [
      { id: 'build-ep1', title: 'Shipping the First Draft', duration: 26 * 60, guest: 'Kai Mercer', note: 'Product craft', summary: 'How to release work sooner without making it feel unfinished.' },
      { id: 'build-ep2', title: 'Designing for Tiny Habits', duration: 32 * 60, guest: 'Priya Shah', note: 'Behavior loop', summary: 'Small actions, clear cues, and interfaces that keep inviting a return.' },
      { id: 'build-ep3', title: 'Review Without the Drag', duration: 29 * 60, guest: 'Eli Park', note: 'Team systems', summary: 'A calmer approach to feedback, checkpoints, and code review.' },
    ],
  },
  {
    id: 'night-edit',
    title: 'Night Edit',
    host: 'Theo Grant',
    art: 'linear-gradient(150deg, #f97316 0%, #ef4444 100%)',
    summary: 'A cinematic mixtape of essays, interviews, and little rabbit holes worth finishing.',
    episodes: [
      { id: 'edit-ep1', title: 'Why We Revisit Old Maps', duration: 24 * 60, guest: 'Sana Reed', note: 'Archive hour', summary: 'Maps as memory, fiction, and an excuse to wander.' },
      { id: 'edit-ep2', title: 'The One Song Rule', duration: 30 * 60, guest: 'Noah Bell', note: 'Listening note', summary: 'A case for one track, one idea, and one focused pass.' },
      { id: 'edit-ep3', title: 'A Quiet Deadline', duration: 36 * 60, guest: 'Iris Lowe', note: 'Closing segment', summary: 'What happens when the last hour of a project turns meditative.' },
    ],
  },
]

const tvShows: TvShow[] = [
  {
    id: 'harbor-nine',
    title: 'Harbor Nine',
    network: 'Sunset Channel',
    art: 'linear-gradient(150deg, #0891b2 0%, #0f172a 100%)',
    summary: 'A moody dockside mystery where every episode peels back one more layer of the port.',
    episodes: [
      { id: 'harbor-1', season: 1, episode: 1, title: 'Pilot Light', duration: 44 * 60, summary: 'A missing manifest points to a ship that never docked.' },
      { id: 'harbor-2', season: 1, episode: 2, title: 'Salt Line', duration: 47 * 60, summary: 'The crew traces a late-night call through the harbor office.' },
      { id: 'harbor-3', season: 1, episode: 3, title: 'Low Tide', duration: 49 * 60, summary: 'The investigation reaches the breakwater just as the tide turns.' },
    ],
  },
  {
    id: 'habit-loop',
    title: 'The Habit Loop',
    network: 'North Star TV',
    art: 'linear-gradient(150deg, #2563eb 0%, #38bdf8 100%)',
    summary: 'A sharp comedy about routines, tiny rebellions, and the chaos inside a tidy schedule.',
    episodes: [
      { id: 'habit-1', season: 1, episode: 1, title: 'Monday Version', duration: 22 * 60, summary: 'A morning routine gets trapped in a calendar invite.' },
      { id: 'habit-2', season: 1, episode: 2, title: 'The Second Alarm', duration: 24 * 60, summary: 'One more notification turns breakfast into a negotiation.' },
      { id: 'habit-3', season: 1, episode: 3, title: 'Repeat, But Better', duration: 23 * 60, summary: 'The team tries to improve the week without adding another app.' },
    ],
  },
  {
    id: 'frame-rate',
    title: 'Frame Rate',
    network: 'Pulse One',
    art: 'linear-gradient(150deg, #14b8a6 0%, #1e293b 100%)',
    summary: 'A behind-the-scenes docu-series about the machines, crews, and editing rooms that make the spectacle happen.',
    episodes: [
      { id: 'frame-1', season: 2, episode: 1, title: 'The Cold Open', duration: 51 * 60, summary: 'A stunt coordinator builds an entire sequence around one cut.' },
      { id: 'frame-2', season: 2, episode: 2, title: 'The Last Pickup', duration: 48 * 60, summary: 'A set goes quiet while the editors chase a missing reaction shot.' },
      { id: 'frame-3', season: 2, episode: 3, title: 'Color Sunday', duration: 46 * 60, summary: 'The final grade reshapes the episode’s entire mood.' },
    ],
  },
  {
    id: 'night-shift',
    title: 'Night Shift',
    network: 'After Dark',
    art: 'linear-gradient(150deg, #7c3aed 0%, #111827 100%)',
    summary: 'A stylish thriller of dispatch calls, one-way glass, and people who work while the rest of the city sleeps.',
    episodes: [
      { id: 'shift-1', season: 1, episode: 1, title: 'Late Check-In', duration: 42 * 60, summary: 'The first hour on the desk is already off-script.' },
      { id: 'shift-2', season: 1, episode: 2, title: 'Signal Loss', duration: 45 * 60, summary: 'A dead zone in the city hides more than bad reception.' },
      { id: 'shift-3', season: 1, episode: 3, title: 'Blue Hour', duration: 50 * 60, summary: 'A call at dawn changes who the night belonged to.' },
    ],
  },
]

const books: Book[] = [
  {
    id: 'lanterns-edge',
    title: 'Lanterns at the Edge',
    author: 'Marin Holt',
    pages: 256,
    genre: 'Literary adventure',
    art: 'linear-gradient(150deg, #eab308 0%, #fb7185 100%)',
    summary: 'A measured travelogue about a coast road, a borrowed notebook, and the people you meet when you slow down enough to listen.',
    chapters: [
      { id: 'lanterns-1', title: 'The Road Out', startPage: 1, endPage: 54, excerpt: 'The first chapter opens with headlights, tide charts, and a town that looks different every time the fog returns.' },
      { id: 'lanterns-2', title: 'Salt Windows', startPage: 55, endPage: 108, excerpt: 'A guesthouse window becomes a frame for the harbor and a list of things to remember later.' },
      { id: 'lanterns-3', title: 'Maps in the Kitchen', startPage: 109, endPage: 176, excerpt: 'A handwritten atlas on the table keeps changing as the conversation shifts from lunch to weather.' },
      { id: 'lanterns-4', title: 'The Last Light', startPage: 177, endPage: 256, excerpt: 'The ending folds back toward the beginning, but the road feels larger the second time around.' },
    ],
  },
  {
    id: 'garden-arguments',
    title: 'Garden of Small Arguments',
    author: 'Tessa Quinn',
    pages: 312,
    genre: 'Character comedy',
    art: 'linear-gradient(150deg, #84cc16 0%, #22c55e 100%)',
    summary: 'Neighbors, seedlings, and the many ways a fence can become a negotiation.',
    chapters: [
      { id: 'garden-1', title: 'The Fence Post', startPage: 1, endPage: 72, excerpt: 'Two gardeners disagree on where a path should begin, and both are convinced they are being helpful.' },
      { id: 'garden-2', title: 'The Tomato Plan', startPage: 73, endPage: 148, excerpt: 'A shared notebook turns into a battlefield of tiny notes and better tomatoes.' },
      { id: 'garden-3', title: 'Rain Day Protocol', startPage: 149, endPage: 232, excerpt: 'The porch becomes a parliament when the weather refuses to cooperate.' },
      { id: 'garden-4', title: 'Harvest Notes', startPage: 233, endPage: 312, excerpt: 'By the end, everyone has a better recipe and a better way to argue kindly.' },
    ],
  },
  {
    id: 'atlas-quiet-places',
    title: 'Atlas of Quiet Places',
    author: 'Junie Adler',
    pages: 198,
    genre: 'Essay collection',
    art: 'linear-gradient(150deg, #38bdf8 0%, #818cf8 100%)',
    summary: 'Small essays on libraries, overlooks, empty trains, and the comfort of being somewhere unclaimed.',
    chapters: [
      { id: 'atlas-1', title: 'Libraries After Lunch', startPage: 1, endPage: 38, excerpt: 'The air changes once the lunch crowd leaves and the shelves get their own weather back.' },
      { id: 'atlas-2', title: 'Platform Twelve', startPage: 39, endPage: 92, excerpt: 'A train platform can be quiet without being empty, and that difference matters.' },
      { id: 'atlas-3', title: 'Rooftops for One', startPage: 93, endPage: 143, excerpt: 'A rooftop at dusk feels less like a location and more like an agreement.' },
      { id: 'atlas-4', title: 'Bench in Winter', startPage: 144, endPage: 198, excerpt: 'The last essay ends with a bench, a coat, and a remarkably warm pocket of sun.' },
    ],
  },
  {
    id: 'last-long-summer',
    title: 'The Last Long Summer',
    author: 'Evan Sloane',
    pages: 278,
    genre: 'Coming-of-age',
    art: 'linear-gradient(150deg, #f97316 0%, #facc15 100%)',
    summary: 'A bright, reflective novel about one season that seems to hold an entire life in it.',
    chapters: [
      { id: 'summer-1', title: 'Heat Index', startPage: 1, endPage: 63, excerpt: 'The opening pages feel like pavement, lemonade, and a time you know will vanish too fast.' },
      { id: 'summer-2', title: 'Pool Rules', startPage: 64, endPage: 133, excerpt: 'A public pool becomes the map for all the friendships that matter this year.' },
      { id: 'summer-3', title: 'The Road to South Bay', startPage: 134, endPage: 206, excerpt: 'A weekend trip turns into a quiet inventory of who is leaving and who is staying.' },
      { id: 'summer-4', title: 'Thunder Season', startPage: 207, endPage: 278, excerpt: 'The final chapter gathers every summer sound into one last storm of memory.' },
    ],
  },
]

const games: Game[] = [
  {
    id: 'skyline-circuit',
    title: 'Skyline Circuit',
    genre: 'Arcade racer',
    step: 24,
    art: 'linear-gradient(150deg, #22d3ee 0%, #2563eb 100%)',
    summary: 'A sleek sprint through rooftop lanes, neon tunnels, and perfect corners.',
    modes: ['Time attack', 'Endless chase', 'Ghost lap'],
  },
  {
    id: 'moon-garden',
    title: 'Moon Garden',
    genre: 'Puzzle relaxer',
    step: 18,
    art: 'linear-gradient(150deg, #a78bfa 0%, #ec4899 100%)',
    summary: 'Grow matching constellations in a tiny garden that only blooms after dark.',
    modes: ['Daily bloom', 'Seed swap', 'Night mode'],
  },
  {
    id: 'neon-raiders',
    title: 'Neon Raiders',
    genre: 'Top-down action',
    step: 31,
    art: 'linear-gradient(150deg, #f97316 0%, #ef4444 100%)',
    summary: 'A fast arcade scramble with combo chains, power cores, and reckless style points.',
    modes: ['Combo run', 'Boss raid', 'Score chase'],
  },
  {
    id: 'pocket-dungeon',
    title: 'Pocket Dungeon',
    genre: 'Rogue-lite',
    step: 27,
    art: 'linear-gradient(150deg, #16a34a 0%, #0f172a 100%)',
    summary: 'A handheld dungeon crawl full of relics, shortcuts, and one more room than expected.',
    modes: ['Run builder', 'Treasure mode', 'Favorites'],
  },
]

function readState<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeState<T>(key: string, value: T) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures in private / disabled storage modes.
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatTime(totalSeconds: number) {
  const value = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const seconds = value % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatPages(page: number, total: number) {
  return `${Math.min(page, total)} / ${total} pages`
}

function percent(value: number, total: number) {
  return `${Math.round((value / Math.max(1, total)) * 100)}%`
}

function unique(values: string[]) {
  return [...new Set(values)]
}

function pickFirst<T extends { id: string }>(items: T[], id?: string | null) {
  return items.find(item => item.id === id) ?? items[0]
}

function cycleIndex(index: number, total: number, delta: number) {
  return (index + delta + total) % total
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter(item => item !== id) : [...list, id]
}

function chapterForPage(book: Book, page: number) {
  return book.chapters.find(chapter => page >= chapter.startPage && page <= chapter.endPage) ?? book.chapters[book.chapters.length - 1]
}

function currentChapterIndex(book: Book, page: number) {
  return Math.max(0, book.chapters.findIndex(chapter => page >= chapter.startPage && page <= chapter.endPage))
}

type EntertainmentKind = 'music' | 'podcasts' | 'tv' | 'books' | 'games'

function mediaSymbol(name: string) {
  const paths: Record<string, string> = {
    music: '<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
    podcasts: '<circle cx="12" cy="10" r="2"/><path d="M9 16a3 3 0 0 1 6 0l-1 6h-4zM6 17a9 9 0 1 1 12 0M8 13a5 5 0 1 1 8 0"/>',
    tv: '<rect x="2" y="4" width="20" height="14" rx="3"/><path d="M8 22h8M12 18v4"/>',
    books: '<path d="M12 5v16M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-2-10 1z"/>',
    games: '<path d="M7 6h10c4 0 6 11 4 13-2 2-5-3-6-3H9c-1 0-4 5-6 3C1 17 3 6 7 6zM7 9v6M4 12h6M16 10h.01M19 13h.01"/>',
    play: '<path fill="currentColor" stroke="none" d="M6 3v18l16-9z"/>',
    pause: '<path fill="currentColor" stroke="none" d="M5 3h5v18H5zm9 0h5v18h-5z"/>',
    prev: '<path fill="currentColor" stroke="none" d="M11 4v16L1 12zm11 0v16L12 12z"/>',
    next: '<path fill="currentColor" stroke="none" d="M2 4v16l10-8zm11 0v16l10-8z"/>',
    favorite: '<path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z"/>',
    bookmark: '<path d="M6 3h12v19l-6-4-6 4z"/>',
    library: '<path d="M3 4v17M8 4v17M13 4v17M18 4l4 17"/>',
    list: '<path d="M8 5h14M8 12h14M8 19h14M2 5h.01M2 12h.01M2 19h.01"/>',
    check: '<path d="m4 12 5 5L21 5"/>',
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.list}</svg>`
}

function prepareMediaLayout(left: HTMLElement, right: HTMLElement, kind: EntertainmentKind) {
  const labels = {
    music: ['Library', 'Albums', 'Songs'],
    podcasts: ['Library', 'Shows', 'Episodes'],
    tv: ['Home', 'Watchlist', 'Series'],
    books: ['Library', 'Books', 'Bookmarks'],
    games: ['Games', 'Library', 'Favorites'],
  }[kind]
  const title = left.querySelector('.ent-title')!
  title.replaceChildren()
  title.innerHTML = `<span class="ent-app-name">${mediaSymbol(kind)}${kind === 'tv' ? 'TV' : kind[0].toUpperCase() + kind.slice(1)}</span><h2>${labels[0]}</h2>`

  const navigation = document.createElement('nav')
  navigation.className = 'ent-navigation'
  navigation.setAttribute('aria-label', `${kind} library sections`)
  const sections = [...left.querySelectorAll<HTMLElement>('.ent-block')]
  sections.forEach((section, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.innerHTML = `${mediaSymbol(index === 0 ? 'library' : kind === 'games' ? 'favorite' : 'list')}<span>${labels[index + 1]}</span>`
    button.setAttribute('aria-current', String(index === 0))
    button.addEventListener('click', () => {
      section.scrollIntoView({ block: 'start', behavior: 'smooth' })
      navigation.querySelectorAll('button').forEach(item => item.setAttribute('aria-current', String(item === button)))
    })
    navigation.append(button)
  })
  const content = document.createElement('div')
  content.className = 'ent-library-content'
  content.append(...sections)
  left.append(content, navigation)

  const heading = document.createElement('header')
  heading.className = 'ent-player-heading'
  heading.innerHTML = `${mediaSymbol(kind)}<span>${kind === 'books' ? 'Reading Now' : kind === 'games' ? 'Game Details' : kind === 'tv' ? 'Continue Watching' : 'Now Playing'}</span>`
  right.prepend(heading)
  right.querySelectorAll('.phone-eyebrow').forEach(element => element.remove())
  if (kind === 'books') {
    const excerpt = right.querySelector('[data-role="excerpt"]')!.closest('.ent-block')!
    excerpt.classList.add('ent-reading-page')
    right.querySelector('.ent-now-card')!.after(excerpt)
  }
  const notice = document.createElement('p')
  notice.className = 'ent-demo-notice'
  notice.textContent = kind === 'books'
    ? 'Sample library · Reading progress and bookmarks are saved on this device.'
    : kind === 'games'
      ? 'Demo games · Rounds simulate scores. No game downloads or live connection.'
      : 'Demo library · Playback controls simulate progress. No audio or video stream.'
  right.append(notice)
}

function refreshMediaChrome(left: HTMLElement, right: HTMLElement, kind: EntertainmentKind) {
  for (const art of [...left.querySelectorAll<HTMLElement>('.ent-art'), ...right.querySelectorAll<HTMLElement>('.ent-art')]) {
    const item = art.closest('.ent-card')
    const title = item?.querySelector('strong')?.textContent
      ?? left.querySelector('[aria-current="true"] .ent-card-body strong')?.textContent
      ?? right.querySelector('[data-role="title"]')?.textContent
      ?? ''
    art.replaceChildren()
    const illustration = document.createElement('span')
    illustration.className = `ent-cover-illustration ent-cover-${kind}`
    illustration.innerHTML = kind === 'tv'
      ? '<svg viewBox="0 0 300 180" aria-hidden="true"><circle cx="225" cy="45" r="26" fill="#fff" opacity=".6"/><path d="M0 145 60 55 115 135 195 70 300 150v30H0z" fill="#000" opacity=".55"/><path d="M0 160 100 110 170 145 235 108 300 150v30H0z" fill="#000" opacity=".5"/></svg>'
      : kind === 'music'
        ? '<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="76" fill="#101018" opacity=".65"/><circle cx="100" cy="100" r="52" fill="none" stroke="#fff" opacity=".3"/><circle cx="100" cy="100" r="24" fill="#fff" opacity=".85"/><circle cx="100" cy="100" r="5" fill="#222"/></svg>'
        : mediaSymbol(kind)
    const coverTitle = document.createElement('span')
    coverTitle.className = 'ent-cover-title'
    coverTitle.textContent = title
    art.append(illustration, coverTitle)
  }
  right.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
    const label = button.textContent?.trim() ?? ''
    const action = button.dataset.action!
    const symbol = action === 'toggle' ? (button.getAttribute('aria-pressed') === 'true' ? 'pause' : 'play')
      : action === 'launch' ? (button.getAttribute('aria-pressed') === 'true' ? 'pause' : 'play')
        : ({ prev: 'prev', next: 'next', favorite: 'favorite', bookmark: 'bookmark', save: 'bookmark', watchlist: 'bookmark', finish: 'check' } as Record<string, string>)[action]
    if (!symbol) return
    button.setAttribute('aria-label', label)
    button.replaceChildren()
    button.insertAdjacentHTML('afterbegin', mediaSymbol(symbol))
    const text = document.createElement('span')
    text.textContent = label
    button.append(text)
    button.classList.toggle('ent-transport', ['prev', 'next', 'toggle'].includes(action))
  })
}

function createMusicApp(): PhoneApp {
  const state = readState<MusicState>(storage.music, {
    albumId: musicAlbums[0].id,
    trackId: musicAlbums[0].tracks[0].id,
    progressSeconds: 64,
    playing: false,
    favoriteTrackIds: [musicAlbums[1].tracks[1].id],
  })

  return {
    id: 'music',
    name: 'Music',
    icon: '♪',
    color: '#9b7dff',
    create() {
      const left = document.createElement('section')
      left.className = 'ent-pane ent-music-pane'
      left.innerHTML = `
        <div class="ent-title">
          <p class="phone-eyebrow">ALBUMS, QUEUES, AND FAVORITES</p>
          <h2>Music</h2>
          <p class="ent-summary">Browse the library, pick a track, then drive the progress with a few deliberate taps.</p>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Albums</span>
            <span data-role="album-count"></span>
          </div>
          <div class="ent-album-grid" data-role="albums"></div>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Tracks</span>
            <span data-role="track-count"></span>
          </div>
          <div class="ent-list" data-role="tracks"></div>
        </div>
      `

      const right = document.createElement('section')
      right.className = 'ent-pane ent-music-now'
      right.innerHTML = `
        <div class="ent-now-card">
          <div class="ent-art" data-role="art" aria-hidden="true"></div>
          <div class="ent-now-copy">
            <p class="phone-eyebrow">NOW PLAYING</p>
            <h3 data-role="title"></h3>
            <p data-role="subtitle"></p>
            <p class="ent-status" data-role="status"></p>
          </div>
        </div>
        <div class="ent-progress-wrap">
          <div class="ent-progress-track" aria-hidden="true"><span data-role="progress"></span></div>
          <div class="ent-progress-meta"><span data-role="elapsed"></span><span data-role="remaining"></span></div>
        </div>
        <div class="ent-controls" aria-label="Music controls">
          <button type="button" class="ent-control" data-action="prev">Prev</button>
          <button type="button" class="ent-control" data-action="rewind">-15s</button>
          <button type="button" class="ent-control ent-control-primary" data-action="toggle" data-role="toggle">Play</button>
          <button type="button" class="ent-control" data-action="forward">+30s</button>
          <button type="button" class="ent-control" data-action="next">Next</button>
          <button type="button" class="ent-control" data-action="favorite" data-role="favorite">Favorite</button>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Up next</span>
            <span data-role="queue-count"></span>
          </div>
          <div class="ent-queue" data-role="queue"></div>
        </div>
      `

      prepareMediaLayout(left, right, 'music')
      const albumCount = left.querySelector<HTMLElement>('[data-role="album-count"]')!
      const trackCount = left.querySelector<HTMLElement>('[data-role="track-count"]')!
      const albumGrid = left.querySelector<HTMLElement>('[data-role="albums"]')!
      const trackList = left.querySelector<HTMLElement>('[data-role="tracks"]')!
      const art = right.querySelector<HTMLElement>('[data-role="art"]')!
      const title = right.querySelector<HTMLElement>('[data-role="title"]')!
      const subtitle = right.querySelector<HTMLElement>('[data-role="subtitle"]')!
      const status = right.querySelector<HTMLElement>('[data-role="status"]')!
      const progress = right.querySelector<HTMLElement>('[data-role="progress"]')!
      const elapsed = right.querySelector<HTMLElement>('[data-role="elapsed"]')!
      const remaining = right.querySelector<HTMLElement>('[data-role="remaining"]')!
      const queue = right.querySelector<HTMLElement>('[data-role="queue"]')!
      const queueCount = right.querySelector<HTMLElement>('[data-role="queue-count"]')!
      const toggle = right.querySelector<HTMLButtonElement>('[data-role="toggle"]')!
      const favorite = right.querySelector<HTMLButtonElement>('[data-role="favorite"]')!

      function normalize() {
        const album = pickFirst(musicAlbums, state.albumId)
        state.albumId = album.id
        const track = pickFirst(album.tracks, state.trackId)
        state.trackId = track.id
        state.progressSeconds = clamp(state.progressSeconds, 0, track.duration)
        state.favoriteTrackIds = unique(state.favoriteTrackIds.filter(trackId => musicAlbums.some(albumItem => albumItem.tracks.some(item => item.id === trackId))))
      }

      function selectedAlbum() {
        return pickFirst(musicAlbums, state.albumId)
      }

      function selectedTrack() {
        const album = selectedAlbum()
        return pickFirst(album.tracks, state.trackId)
      }

      function commit() {
        normalize()
        writeState(storage.music, state)
        render()
        refreshMediaChrome(left, right, 'music')
      }

      function setTrack(trackId: string, keepPlaying = false) {
        const album = musicAlbums.find(albumItem => albumItem.tracks.some(track => track.id === trackId)) ?? musicAlbums[0]
        state.albumId = album.id
        state.trackId = trackId
        state.progressSeconds = 0
        state.playing = keepPlaying
        commit()
      }

      function stepProgress(delta: number) {
        const track = selectedTrack()
        state.progressSeconds = clamp(state.progressSeconds + delta, 0, track.duration)
        if (state.progressSeconds >= track.duration) state.playing = false
        commit()
      }

      function toggleFavorite(trackId: string = state.trackId) {
        state.favoriteTrackIds = toggleId(state.favoriteTrackIds, trackId)
        commit()
      }

      function togglePlaying() {
        state.playing = !state.playing
        commit()
      }

      function moveTrack(delta: number) {
        const album = selectedAlbum()
        const index = album.tracks.findIndex(track => track.id === state.trackId)
        const next = album.tracks[cycleIndex(Math.max(0, index), album.tracks.length, delta)]
        setTrack(next.id, state.playing)
      }

      function render() {
        normalize()
        const album = selectedAlbum()
        const track = selectedTrack()
        const trackIndex = album.tracks.findIndex(item => item.id === track.id)
        const trackProgress = track.duration === 0 ? 0 : state.progressSeconds / track.duration
        const favoriteTrack = state.favoriteTrackIds.includes(track.id)
        const queueTracks = album.tracks.slice(trackIndex + 1).concat(album.tracks.slice(0, trackIndex)).slice(0, 3)

        albumCount.textContent = `${musicAlbums.length} albums`
        trackCount.textContent = `${album.tracks.length} tracks`
        queueCount.textContent = `${queueTracks.length} queued`

        albumGrid.replaceChildren()
        for (const albumItem of musicAlbums) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-card ent-album-card'
          button.setAttribute('aria-current', String(albumItem.id === album.id))
          button.innerHTML = `
            <span class="ent-art ent-art-small" aria-hidden="true"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
              <small></small>
            </span>
          `
          button.querySelector<HTMLElement>('.ent-art')!.style.setProperty('--ent-art', albumItem.art)
          button.querySelector('strong')!.textContent = albumItem.title
          button.querySelector('.ent-card-body span')!.textContent = albumItem.artist
          button.querySelector('small')!.textContent = `${albumItem.year} · ${albumItem.tracks.length} tracks`
          button.addEventListener('click', () => {
            const targetTrack = albumItem.tracks.find(item => item.id === state.trackId) ?? albumItem.tracks[0]
            state.albumId = albumItem.id
            state.trackId = targetTrack.id
            state.progressSeconds = clamp(state.progressSeconds, 0, targetTrack.duration)
            commit()
          })
          albumGrid.append(button)
        }

        trackList.replaceChildren()
        for (const item of album.tracks) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-list-item ent-track-item'
          button.setAttribute('aria-current', String(item.id === track.id))
          button.innerHTML = `
            <span class="ent-track-number"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
            </span>
            <span class="ent-track-meta"></span>
          `
          button.querySelector('.ent-track-number')!.textContent = String(album.tracks.findIndex(trackItem => trackItem.id === item.id) + 1).padStart(2, '0')
          button.querySelector('strong')!.textContent = item.title
          button.querySelector('.ent-card-body span')!.textContent = item.note
          button.querySelector('.ent-track-meta')!.textContent = `${formatTime(item.duration)}`
          if (state.favoriteTrackIds.includes(item.id)) button.classList.add('is-favorite')
          button.addEventListener('click', () => setTrack(item.id))
          trackList.append(button)
        }

        art.style.setProperty('--ent-art', album.art)
        title.textContent = track.title
        subtitle.textContent = `${album.artist} · ${album.year} · ${track.vibe}`
        status.textContent = state.playing ? 'Playing now' : 'Paused and ready'
        progress.style.width = `${trackProgress * 100}%`
        elapsed.textContent = formatTime(state.progressSeconds)
        remaining.textContent = `-${formatTime(track.duration - state.progressSeconds)}`
        toggle.textContent = state.playing ? 'Pause' : 'Play'
        toggle.setAttribute('aria-pressed', String(state.playing))
        favorite.textContent = favoriteTrack ? 'Loved' : 'Favorite'
        favorite.setAttribute('aria-pressed', String(favoriteTrack))

        queue.replaceChildren()
        for (const nextTrack of queueTracks) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-queue-item'
          button.innerHTML = `
            <strong></strong>
            <span></span>
            <small></small>
          `
          button.querySelector('strong')!.textContent = nextTrack.title
          button.querySelector('span')!.textContent = album.artist
          button.querySelector('small')!.textContent = `${formatTime(nextTrack.duration)} · ${nextTrack.note}`
          button.addEventListener('click', () => setTrack(nextTrack.id, state.playing))
          queue.append(button)
        }
      }

      right.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
          const action = button.dataset.action
          if (action === 'toggle') togglePlaying()
          if (action === 'prev') moveTrack(-1)
          if (action === 'next') moveTrack(1)
          if (action === 'rewind') stepProgress(-15)
          if (action === 'forward') stepProgress(30)
          if (action === 'favorite') toggleFavorite()
        })
      })

      render()
      refreshMediaChrome(left, right, 'music')
      return { left, right }
    },
  }
}

function createPodcastApp(): PhoneApp {
  const state = readState<PodcastState>(storage.podcasts, {
    showId: podcastShows[0].id,
    episodeId: podcastShows[0].episodes[0].id,
    progressByEpisode: { [podcastShows[0].episodes[0].id]: 7 * 60 },
    playing: false,
    savedEpisodeIds: [podcastShows[1].episodes[1].id],
    completedEpisodeIds: [podcastShows[2].episodes[0].id],
  })

  return {
    id: 'podcasts',
    name: 'Podcasts',
    icon: '◔',
    color: '#61d4f0',
    create() {
      const left = document.createElement('section')
      left.className = 'ent-pane ent-podcasts-pane'
      left.innerHTML = `
        <div class="ent-title">
          <p class="phone-eyebrow">SHOWS, EPISODES, AND RESUMES</p>
          <h2>Podcasts</h2>
          <p class="ent-summary">Choose a show, switch episodes, and keep a tidy memory of what you saved or finished.</p>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Shows</span>
            <span data-role="show-count"></span>
          </div>
          <div class="ent-album-grid" data-role="shows"></div>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Episodes</span>
            <span data-role="episode-count"></span>
          </div>
          <div class="ent-list" data-role="episodes"></div>
        </div>
      `

      const right = document.createElement('section')
      right.className = 'ent-pane ent-podcasts-now'
      right.innerHTML = `
        <div class="ent-now-card">
          <div class="ent-art" data-role="art" aria-hidden="true"></div>
          <div class="ent-now-copy">
            <p class="phone-eyebrow">RESUME LISTENING</p>
            <h3 data-role="title"></h3>
            <p data-role="subtitle"></p>
            <p class="ent-status" data-role="status"></p>
          </div>
        </div>
        <div class="ent-progress-wrap">
          <div class="ent-progress-track" aria-hidden="true"><span data-role="progress"></span></div>
          <div class="ent-progress-meta"><span data-role="elapsed"></span><span data-role="remaining"></span></div>
        </div>
        <div class="ent-controls" aria-label="Podcast controls">
          <button type="button" class="ent-control" data-action="prev">Prev</button>
          <button type="button" class="ent-control" data-action="rewind">-1m</button>
          <button type="button" class="ent-control ent-control-primary" data-action="toggle" data-role="toggle">Play</button>
          <button type="button" class="ent-control" data-action="skip">+5m</button>
          <button type="button" class="ent-control" data-action="next">Next</button>
          <button type="button" class="ent-control" data-action="save" data-role="save">Save</button>
          <button type="button" class="ent-control" data-action="finish">Mark played</button>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Show notes</span>
            <span data-role="meta"></span>
          </div>
          <p class="ent-summary" data-role="summary"></p>
        </div>
      `

      prepareMediaLayout(left, right, 'podcasts')
      const showCount = left.querySelector<HTMLElement>('[data-role="show-count"]')!
      const episodeCount = left.querySelector<HTMLElement>('[data-role="episode-count"]')!
      const showGrid = left.querySelector<HTMLElement>('[data-role="shows"]')!
      const episodeList = left.querySelector<HTMLElement>('[data-role="episodes"]')!
      const art = right.querySelector<HTMLElement>('[data-role="art"]')!
      const title = right.querySelector<HTMLElement>('[data-role="title"]')!
      const subtitle = right.querySelector<HTMLElement>('[data-role="subtitle"]')!
      const status = right.querySelector<HTMLElement>('[data-role="status"]')!
      const progress = right.querySelector<HTMLElement>('[data-role="progress"]')!
      const elapsed = right.querySelector<HTMLElement>('[data-role="elapsed"]')!
      const remaining = right.querySelector<HTMLElement>('[data-role="remaining"]')!
      const summary = right.querySelector<HTMLElement>('[data-role="summary"]')!
      const meta = right.querySelector<HTMLElement>('[data-role="meta"]')!
      const toggle = right.querySelector<HTMLButtonElement>('[data-role="toggle"]')!
      const save = right.querySelector<HTMLButtonElement>('[data-role="save"]')!

      function normalize() {
        const show = pickFirst(podcastShows, state.showId)
        state.showId = show.id
        const episode = pickFirst(show.episodes, state.episodeId)
        state.episodeId = episode.id
        state.progressByEpisode[episode.id] = clamp(state.progressByEpisode[episode.id] ?? 0, 0, episode.duration)
        state.savedEpisodeIds = unique(state.savedEpisodeIds.filter(id => podcastShows.some(showItem => showItem.episodes.some(episodeItem => episodeItem.id === id))))
        state.completedEpisodeIds = unique(state.completedEpisodeIds.filter(id => podcastShows.some(showItem => showItem.episodes.some(episodeItem => episodeItem.id === id))))
      }

      function selectedShow() {
        return pickFirst(podcastShows, state.showId)
      }

      function selectedEpisode() {
        const show = selectedShow()
        return pickFirst(show.episodes, state.episodeId)
      }

      function commit() {
        normalize()
        writeState(storage.podcasts, state)
        render()
        refreshMediaChrome(left, right, 'podcasts')
      }

      function setEpisode(episodeId: string) {
        const show = podcastShows.find(showItem => showItem.episodes.some(episode => episode.id === episodeId)) ?? podcastShows[0]
        state.showId = show.id
        state.episodeId = episodeId
        state.playing = false
        state.progressByEpisode[episodeId] = clamp(state.progressByEpisode[episodeId] ?? 0, 0, show.episodes.find(episode => episode.id === episodeId)?.duration ?? 0)
        commit()
      }

      function togglePlaying() {
        state.playing = !state.playing
        commit()
      }

      function setProgress(delta: number) {
        const episode = selectedEpisode()
        const next = clamp((state.progressByEpisode[episode.id] ?? 0) + delta, 0, episode.duration)
        state.progressByEpisode[episode.id] = next
        if (next >= episode.duration) state.playing = false
        commit()
      }

      function finishEpisode() {
        const episode = selectedEpisode()
        state.progressByEpisode[episode.id] = episode.duration
        state.completedEpisodeIds = unique([...state.completedEpisodeIds, episode.id])
        state.playing = false
        commit()
      }

      function toggleSaved() {
        state.savedEpisodeIds = toggleId(state.savedEpisodeIds, state.episodeId)
        commit()
      }

      function moveEpisode(delta: number) {
        const show = selectedShow()
        const index = show.episodes.findIndex(episode => episode.id === state.episodeId)
        const next = show.episodes[cycleIndex(Math.max(0, index), show.episodes.length, delta)]
        setEpisode(next.id)
      }

      function render() {
        normalize()
        const show = selectedShow()
        const episode = selectedEpisode()
        const currentProgress = state.progressByEpisode[episode.id] ?? 0
        const episodeIndex = show.episodes.findIndex(item => item.id === episode.id)
        const progressRatio = currentProgress / episode.duration
        const saved = state.savedEpisodeIds.includes(episode.id)
        const completed = state.completedEpisodeIds.includes(episode.id)
        showCount.textContent = `${podcastShows.length} shows`
        episodeCount.textContent = `${show.episodes.length} episodes`
        meta.textContent = `${show.host} · ${episode.guest}`
        summary.textContent = show.summary

        showGrid.replaceChildren()
        for (const showItem of podcastShows) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-card ent-album-card'
          button.setAttribute('aria-current', String(showItem.id === show.id))
          button.innerHTML = `
            <span class="ent-art ent-art-small" aria-hidden="true"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
              <small></small>
            </span>
          `
          button.querySelector<HTMLElement>('.ent-art')!.style.setProperty('--ent-art', showItem.art)
          button.querySelector('strong')!.textContent = showItem.title
          button.querySelector('.ent-card-body span')!.textContent = showItem.host
          button.querySelector('small')!.textContent = `${showItem.episodes.length} episodes · ${showItem.summary}`
          button.addEventListener('click', () => {
            state.showId = showItem.id
            state.episodeId = showItem.episodes[0].id
            state.playing = false
            commit()
          })
          showGrid.append(button)
        }

        episodeList.replaceChildren()
        for (const item of show.episodes) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-list-item ent-track-item'
          button.setAttribute('aria-current', String(item.id === episode.id))
          button.innerHTML = `
            <span class="ent-track-number"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
            </span>
            <span class="ent-track-meta"></span>
          `
          button.querySelector('.ent-track-number')!.textContent = String(show.episodes.findIndex(episodeItem => episodeItem.id === item.id) + 1).padStart(2, '0')
          button.querySelector('strong')!.textContent = item.title
          button.querySelector('.ent-card-body span')!.textContent = `${item.note} · ${item.summary}`
          button.querySelector('.ent-track-meta')!.textContent = `${formatTime(item.duration)}${state.completedEpisodeIds.includes(item.id) ? ' · played' : ''}`
          if (saved) button.classList.add('is-saved')
          if (completed) button.classList.add('is-complete')
          button.addEventListener('click', () => setEpisode(item.id))
          episodeList.append(button)
        }

        art.style.setProperty('--ent-art', show.art)
        title.textContent = episode.title
        subtitle.textContent = `${show.title} · ${formatTime(episode.duration)} · ${episode.note}`
        status.textContent = completed ? 'Finished and filed' : state.playing ? 'Playing now' : 'Paused at the last checkpoint'
        progress.style.width = `${progressRatio * 100}%`
        elapsed.textContent = formatTime(currentProgress)
        remaining.textContent = `-${formatTime(episode.duration - currentProgress)}`
        toggle.textContent = state.playing ? 'Pause' : 'Play'
        toggle.setAttribute('aria-pressed', String(state.playing))
        save.textContent = saved ? 'Saved' : 'Save'
        save.setAttribute('aria-pressed', String(saved))

        const queue = right.querySelector<HTMLElement>('[data-role="queue"]')
        if (!queue) {
          const queueBlock = document.createElement('div')
          queueBlock.className = 'ent-block'
          queueBlock.innerHTML = `<div class="ent-block-head"><span>Up next</span><span></span></div><div class="ent-queue" data-role="queue"></div>`
          right.append(queueBlock)
        }
        const queueContainer = right.querySelector<HTMLElement>('[data-role="queue"]')!
        const queueCount = right.querySelector<HTMLElement>('[data-role="queue-count"]')
        if (queueCount) queueCount.textContent = ''
        const queueEpisodes = show.episodes.slice(episodeIndex + 1).concat(show.episodes.slice(0, episodeIndex)).slice(0, 2)
        queueContainer.replaceChildren()
        for (const item of queueEpisodes) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-queue-item'
          button.innerHTML = `
            <strong></strong>
            <span></span>
            <small></small>
          `
          button.querySelector('strong')!.textContent = item.title
          button.querySelector('span')!.textContent = `${show.title} · ${item.guest ? item.guest : show.host}`
          button.querySelector('small')!.textContent = `${formatTime(item.duration)} · ${item.summary}`
          button.addEventListener('click', () => setEpisode(item.id))
          queueContainer.append(button)
        }
      }

      right.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
          const action = button.dataset.action
          if (action === 'toggle') togglePlaying()
          if (action === 'prev') moveEpisode(-1)
          if (action === 'next') moveEpisode(1)
          if (action === 'rewind') setProgress(-60)
          if (action === 'skip') setProgress(5 * 60)
          if (action === 'save') toggleSaved()
          if (action === 'finish') finishEpisode()
        })
      })

      render()
      refreshMediaChrome(left, right, 'podcasts')
      return { left, right }
    },
  }
}

function createTvApp(): PhoneApp {
  const state = readState<TvState>(storage.tv, {
    showId: tvShows[0].id,
    episodeId: tvShows[0].episodes[0].id,
    progressByEpisode: { [tvShows[0].episodes[0].id]: 19 * 60 },
    playing: false,
    watchlistIds: [tvShows[0].id, tvShows[2].id],
    watchedEpisodeIds: [tvShows[1].episodes[0].id],
  })

  return {
    id: 'tv',
    name: 'TV',
    icon: '▣',
    color: '#57b7ff',
    create() {
      const left = document.createElement('section')
      left.className = 'ent-pane ent-tv-pane'
      left.innerHTML = `
        <div class="ent-title">
          <p class="phone-eyebrow">WATCHLIST, EPISODES, AND RESUME POINTS</p>
          <h2>TV</h2>
          <p class="ent-summary">Keep a watchlist, jump episodes, and manage your place without needing a real stream.</p>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Watchlist</span>
            <span data-role="watchlist-count"></span>
          </div>
          <div class="ent-album-grid" data-role="watchlist"></div>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Series guide</span>
            <span data-role="series-count"></span>
          </div>
          <div class="ent-list" data-role="series"></div>
        </div>
      `

      const right = document.createElement('section')
      right.className = 'ent-pane ent-tv-now'
      right.innerHTML = `
        <div class="ent-now-card">
          <div class="ent-art" data-role="art" aria-hidden="true"></div>
          <div class="ent-now-copy">
            <p class="phone-eyebrow">CONTINUE WATCHING</p>
            <h3 data-role="title"></h3>
            <p data-role="subtitle"></p>
            <p class="ent-status" data-role="status"></p>
          </div>
        </div>
        <div class="ent-progress-wrap">
          <div class="ent-progress-track" aria-hidden="true"><span data-role="progress"></span></div>
          <div class="ent-progress-meta"><span data-role="elapsed"></span><span data-role="remaining"></span></div>
        </div>
        <div class="ent-controls" aria-label="TV controls">
          <button type="button" class="ent-control" data-action="prev">Prev</button>
          <button type="button" class="ent-control" data-action="rewind">-5m</button>
          <button type="button" class="ent-control ent-control-primary" data-action="toggle" data-role="toggle">Play</button>
          <button type="button" class="ent-control" data-action="skip">+10m</button>
          <button type="button" class="ent-control" data-action="next">Next</button>
          <button type="button" class="ent-control" data-action="watchlist" data-role="watchlist-toggle">Watchlist</button>
          <button type="button" class="ent-control" data-action="finish">Mark watched</button>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Episode guide</span>
            <span data-role="meta"></span>
          </div>
          <div class="ent-list" data-role="episodes"></div>
        </div>
      `

      prepareMediaLayout(left, right, 'tv')
      const watchlistCount = left.querySelector<HTMLElement>('[data-role="watchlist-count"]')!
      const seriesCount = left.querySelector<HTMLElement>('[data-role="series-count"]')!
      const watchlist = left.querySelector<HTMLElement>('[data-role="watchlist"]')!
      const series = left.querySelector<HTMLElement>('[data-role="series"]')!
      const art = right.querySelector<HTMLElement>('[data-role="art"]')!
      const title = right.querySelector<HTMLElement>('[data-role="title"]')!
      const subtitle = right.querySelector<HTMLElement>('[data-role="subtitle"]')!
      const status = right.querySelector<HTMLElement>('[data-role="status"]')!
      const progress = right.querySelector<HTMLElement>('[data-role="progress"]')!
      const elapsed = right.querySelector<HTMLElement>('[data-role="elapsed"]')!
      const remaining = right.querySelector<HTMLElement>('[data-role="remaining"]')!
      const meta = right.querySelector<HTMLElement>('[data-role="meta"]')!
      const toggle = right.querySelector<HTMLButtonElement>('[data-role="toggle"]')!
      const watchlistToggle = right.querySelector<HTMLButtonElement>('[data-role="watchlist-toggle"]')!
      const episodeList = right.querySelector<HTMLElement>('[data-role="episodes"]')!

      function normalize() {
        const show = pickFirst(tvShows, state.showId)
        state.showId = show.id
        const episode = pickFirst(show.episodes, state.episodeId)
        state.episodeId = episode.id
        state.progressByEpisode[episode.id] = clamp(state.progressByEpisode[episode.id] ?? 0, 0, episode.duration)
        state.watchlistIds = unique(state.watchlistIds.filter(id => tvShows.some(showItem => showItem.id === id)))
        state.watchedEpisodeIds = unique(state.watchedEpisodeIds.filter(id => tvShows.some(showItem => showItem.episodes.some(episodeItem => episodeItem.id === id))))
      }

      function selectedShow() {
        return pickFirst(tvShows, state.showId)
      }

      function selectedEpisode() {
        const show = selectedShow()
        return pickFirst(show.episodes, state.episodeId)
      }

      function commit() {
        normalize()
        writeState(storage.tv, state)
        render()
        refreshMediaChrome(left, right, 'tv')
      }

      function setEpisode(episodeId: string) {
        const show = tvShows.find(showItem => showItem.episodes.some(episode => episode.id === episodeId)) ?? tvShows[0]
        state.showId = show.id
        state.episodeId = episodeId
        state.playing = false
        state.progressByEpisode[episodeId] = clamp(state.progressByEpisode[episodeId] ?? 0, 0, show.episodes.find(episode => episode.id === episodeId)?.duration ?? 0)
        commit()
      }

      function togglePlaying() {
        state.playing = !state.playing
        commit()
      }

      function stepProgress(delta: number) {
        const episode = selectedEpisode()
        const next = clamp((state.progressByEpisode[episode.id] ?? 0) + delta, 0, episode.duration)
        state.progressByEpisode[episode.id] = next
        if (next >= episode.duration) state.playing = false
        commit()
      }

      function finishEpisode() {
        const episode = selectedEpisode()
        state.progressByEpisode[episode.id] = episode.duration
        state.watchedEpisodeIds = unique([...state.watchedEpisodeIds, episode.id])
        state.playing = false
        commit()
      }

      function toggleWatchlist(showId: string = state.showId) {
        state.watchlistIds = toggleId(state.watchlistIds, showId)
        commit()
      }

      function moveEpisode(delta: number) {
        const show = selectedShow()
        const index = show.episodes.findIndex(episode => episode.id === state.episodeId)
        const next = show.episodes[cycleIndex(Math.max(0, index), show.episodes.length, delta)]
        setEpisode(next.id)
      }

      function render() {
        normalize()
        const show = selectedShow()
        const episode = selectedEpisode()
        const currentProgress = state.progressByEpisode[episode.id] ?? 0
        const episodeIndex = show.episodes.findIndex(item => item.id === episode.id)
        const progressRatio = currentProgress / episode.duration
        const nextEpisode = show.episodes[cycleIndex(Math.max(0, episodeIndex), show.episodes.length, 1)]
        const watchlisted = state.watchlistIds.includes(show.id)
        const watched = state.watchedEpisodeIds.includes(episode.id)
        watchlistCount.textContent = `${state.watchlistIds.length} shows`
        seriesCount.textContent = `${tvShows.length} series`
        meta.textContent = `${show.network} · ${episode.season}x${String(episode.episode).padStart(2, '0')}`
        title.textContent = episode.title
        subtitle.textContent = `${show.title} · ${formatTime(episode.duration)}`
        status.textContent = watched ? 'Filed as watched' : state.playing ? 'Playing now' : 'Paused in the guide'
        progress.style.width = `${progressRatio * 100}%`
        elapsed.textContent = formatTime(currentProgress)
        remaining.textContent = `-${formatTime(episode.duration - currentProgress)}`
        toggle.textContent = state.playing ? 'Pause' : 'Play'
        toggle.setAttribute('aria-pressed', String(state.playing))
        watchlistToggle.textContent = watchlisted ? 'Remove watchlist' : 'Watchlist'
        watchlistToggle.setAttribute('aria-pressed', String(watchlisted))
        art.style.setProperty('--ent-art', show.art)

        watchlist.replaceChildren()
        for (const showItem of tvShows.filter(item => state.watchlistIds.includes(item.id))) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-card ent-album-card'
          button.setAttribute('aria-current', String(showItem.id === show.id))
          button.innerHTML = `
            <span class="ent-art ent-art-small" aria-hidden="true"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
              <small></small>
            </span>
          `
          button.querySelector<HTMLElement>('.ent-art')!.style.setProperty('--ent-art', showItem.art)
          button.querySelector('strong')!.textContent = showItem.title
          button.querySelector('.ent-card-body span')!.textContent = showItem.network
          button.querySelector('small')!.textContent = `${showItem.episodes.length} episodes · ${showItem.summary}`
          button.addEventListener('click', () => {
            state.showId = showItem.id
            state.episodeId = showItem.episodes[0].id
            state.playing = false
            commit()
          })
          watchlist.append(button)
        }

        series.replaceChildren()
        for (const showItem of tvShows) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-list-item ent-track-item'
          button.setAttribute('aria-current', String(showItem.id === show.id))
          button.innerHTML = `
            <span class="ent-track-number"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
            </span>
            <span class="ent-track-meta"></span>
          `
          button.querySelector('.ent-track-number')!.textContent = showItem.id === show.id ? 'ON' : 'TV'
          button.querySelector('strong')!.textContent = showItem.title
          button.querySelector('.ent-card-body span')!.textContent = showItem.summary
          button.querySelector('.ent-track-meta')!.textContent = `${showItem.network}`
          button.addEventListener('click', () => {
            state.showId = showItem.id
            state.episodeId = showItem.episodes[0].id
            state.playing = false
            commit()
          })
          series.append(button)
        }

        episodeList.replaceChildren()
        for (const item of show.episodes) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-list-item ent-track-item'
          button.setAttribute('aria-current', String(item.id === episode.id))
          button.innerHTML = `
            <span class="ent-track-number"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
            </span>
            <span class="ent-track-meta"></span>
          `
          button.querySelector('.ent-track-number')!.textContent = `${item.season}.${item.episode}`
          button.querySelector('strong')!.textContent = item.title
          button.querySelector('.ent-card-body span')!.textContent = item.summary
          button.querySelector('.ent-track-meta')!.textContent = `${formatTime(item.duration)}${state.watchedEpisodeIds.includes(item.id) ? ' · watched' : ''}`
          if (watched) button.classList.add('is-watched')
          button.addEventListener('click', () => setEpisode(item.id))
          episodeList.append(button)
        }

        const queue = right.querySelector<HTMLElement>('[data-role="queue"]')
        if (!queue) {
          const queueBlock = document.createElement('div')
          queueBlock.className = 'ent-block'
          queueBlock.innerHTML = `<div class="ent-block-head"><span>Next up</span><span></span></div><div class="ent-queue" data-role="queue"></div>`
          right.append(queueBlock)
        }
        const queueContainer = right.querySelector<HTMLElement>('[data-role="queue"]')!
        queueContainer.replaceChildren()
        for (const item of [nextEpisode]) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-queue-item'
          button.innerHTML = `
            <strong></strong>
            <span></span>
            <small></small>
          `
          button.querySelector('strong')!.textContent = item.title
          button.querySelector('span')!.textContent = `${show.title} · ${item.season}x${String(item.episode).padStart(2, '0')}`
          button.querySelector('small')!.textContent = item.summary
          button.addEventListener('click', () => setEpisode(item.id))
          queueContainer.append(button)
        }
      }

      right.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
          const action = button.dataset.action
          if (action === 'toggle') togglePlaying()
          if (action === 'prev') moveEpisode(-1)
          if (action === 'next') moveEpisode(1)
          if (action === 'rewind') stepProgress(-5 * 60)
          if (action === 'skip') stepProgress(10 * 60)
          if (action === 'watchlist') toggleWatchlist()
          if (action === 'finish') finishEpisode()
        })
      })

      render()
      refreshMediaChrome(left, right, 'tv')
      return { left, right }
    },
  }
}

function createBooksApp(): PhoneApp {
  const state = readState<BookState>(storage.books, {
    bookId: books[0].id,
    pageByBook: { [books[0].id]: 41, [books[1].id]: 122 },
    bookmarks: [
      { id: 'bookmark-1', bookId: books[0].id, page: 41, label: 'Lanterns · page 41' },
      { id: 'bookmark-2', bookId: books[1].id, page: 122, label: 'Garden · page 122' },
    ],
  })

  return {
    id: 'books',
    name: 'Books',
    icon: '⌘',
    color: '#d39a58',
    create() {
      const left = document.createElement('section')
      left.className = 'ent-pane ent-books-pane'
      left.innerHTML = `
        <div class="ent-title">
          <p class="phone-eyebrow">BOOKS, CHAPTERS, AND BOOKMARKS</p>
          <h2>Books</h2>
          <p class="ent-summary">Carry a shelf, jump chapters, and pin the pages you want to find again quickly.</p>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Bookshelf</span>
            <span data-role="book-count"></span>
          </div>
          <div class="ent-album-grid" data-role="books"></div>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Bookmarks</span>
            <span data-role="bookmark-count"></span>
          </div>
          <div class="ent-list" data-role="bookmarks"></div>
        </div>
      `

      const right = document.createElement('section')
      right.className = 'ent-pane ent-books-now'
      right.innerHTML = `
        <div class="ent-now-card">
          <div class="ent-art" data-role="art" aria-hidden="true"></div>
          <div class="ent-now-copy">
            <p class="phone-eyebrow">READING NOW</p>
            <h3 data-role="title"></h3>
            <p data-role="subtitle"></p>
            <p class="ent-status" data-role="status"></p>
          </div>
        </div>
        <div class="ent-progress-wrap">
          <div class="ent-progress-track" aria-hidden="true"><span data-role="progress"></span></div>
          <div class="ent-progress-meta"><span data-role="elapsed"></span><span data-role="remaining"></span></div>
        </div>
        <div class="ent-controls" aria-label="Book controls">
          <button type="button" class="ent-control" data-action="prevChapter">Prev chapter</button>
          <button type="button" class="ent-control" data-action="back">-10 pages</button>
          <button type="button" class="ent-control ent-control-primary" data-action="forward">+10 pages</button>
          <button type="button" class="ent-control" data-action="nextChapter">Next chapter</button>
          <button type="button" class="ent-control" data-action="bookmark" data-role="bookmark">Bookmark</button>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Chapters</span>
            <span data-role="chapter-meta"></span>
          </div>
          <div class="ent-chip-row" data-role="chapters"></div>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Current page</span>
            <span data-role="page-meta"></span>
          </div>
          <p class="ent-summary" data-role="excerpt"></p>
        </div>
      `

      prepareMediaLayout(left, right, 'books')
      const bookCount = left.querySelector<HTMLElement>('[data-role="book-count"]')!
      const bookmarkCount = left.querySelector<HTMLElement>('[data-role="bookmark-count"]')!
      const bookGrid = left.querySelector<HTMLElement>('[data-role="books"]')!
      const bookmarkList = left.querySelector<HTMLElement>('[data-role="bookmarks"]')!
      const art = right.querySelector<HTMLElement>('[data-role="art"]')!
      const title = right.querySelector<HTMLElement>('[data-role="title"]')!
      const subtitle = right.querySelector<HTMLElement>('[data-role="subtitle"]')!
      const status = right.querySelector<HTMLElement>('[data-role="status"]')!
      const progress = right.querySelector<HTMLElement>('[data-role="progress"]')!
      const elapsed = right.querySelector<HTMLElement>('[data-role="elapsed"]')!
      const remaining = right.querySelector<HTMLElement>('[data-role="remaining"]')!
      const chapterMeta = right.querySelector<HTMLElement>('[data-role="chapter-meta"]')!
      const chapters = right.querySelector<HTMLElement>('[data-role="chapters"]')!
      const excerpt = right.querySelector<HTMLElement>('[data-role="excerpt"]')!
      const pageMeta = right.querySelector<HTMLElement>('[data-role="page-meta"]')!
      const bookmarkButton = right.querySelector<HTMLButtonElement>('[data-role="bookmark"]')!

      function normalize() {
        const book = pickFirst(books, state.bookId)
        state.bookId = book.id
        state.pageByBook[book.id] = clamp(state.pageByBook[book.id] ?? 1, 1, book.pages)
        state.bookmarks = state.bookmarks.filter(bookmark => books.some(bookItem => bookItem.id === bookmark.bookId))
      }

      function selectedBook() {
        return pickFirst(books, state.bookId)
      }

      function currentPage(book: Book) {
        return clamp(state.pageByBook[book.id] ?? 1, 1, book.pages)
      }

      function commit() {
        normalize()
        writeState(storage.books, state)
        render()
        refreshMediaChrome(left, right, 'books')
      }

      function setBook(bookId: string, page?: number) {
        const book = pickFirst(books, bookId)
        state.bookId = book.id
        state.pageByBook[book.id] = clamp(page ?? state.pageByBook[book.id] ?? 1, 1, book.pages)
        commit()
      }

      function turnPages(delta: number) {
        const book = selectedBook()
        state.pageByBook[book.id] = clamp(currentPage(book) + delta, 1, book.pages)
        commit()
      }

      function addBookmark() {
        const book = selectedBook()
        const page = currentPage(book)
        const chapter = chapterForPage(book, page)
        const label = `${book.title} · ${chapter.title} · page ${page}`
        const exists = state.bookmarks.find(bookmark => bookmark.bookId === book.id && bookmark.page === page)
        if (exists) {
          exists.label = label
        } else {
          state.bookmarks = [{ id: `bookmark-${Date.now()}`, bookId: book.id, page, label }, ...state.bookmarks].slice(0, 12)
        }
        commit()
      }

      function jumpChapter(delta: number) {
        const book = selectedBook()
        const page = currentPage(book)
        const index = currentChapterIndex(book, page)
        const chapter = book.chapters[cycleIndex(index, book.chapters.length, delta)]
        state.pageByBook[book.id] = chapter.startPage
        commit()
      }

      function render() {
        normalize()
        const book = selectedBook()
        const page = currentPage(book)
        const chapter = chapterForPage(book, page)
        const chapterIndex = book.chapters.findIndex(item => item.id === chapter.id)
        const progressRatio = page / book.pages

        bookCount.textContent = `${books.length} books`
        bookmarkCount.textContent = `${state.bookmarks.length} saved`
        chapterMeta.textContent = `${chapterIndex + 1}/${book.chapters.length}`
        pageMeta.textContent = formatPages(page, book.pages)
        subtitle.textContent = `${book.author} · ${book.genre} · ${book.summary}`
        status.textContent = `On ${chapter.title}`
        progress.style.width = `${progressRatio * 100}%`
        elapsed.textContent = `${page} pages`
        remaining.textContent = `-${book.pages - page} pages`
        bookmarkButton.textContent = 'Bookmark'
        art.style.setProperty('--ent-art', book.art)
        title.textContent = book.title
        excerpt.textContent = chapter.excerpt

        bookGrid.replaceChildren()
        for (const bookItem of books) {
          const pageForBook = clamp(state.pageByBook[bookItem.id] ?? 1, 1, bookItem.pages)
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-card ent-album-card'
          button.setAttribute('aria-current', String(bookItem.id === book.id))
          button.innerHTML = `
            <span class="ent-art ent-art-small" aria-hidden="true"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
              <small></small>
            </span>
          `
          button.querySelector<HTMLElement>('.ent-art')!.style.setProperty('--ent-art', bookItem.art)
          button.querySelector('strong')!.textContent = bookItem.title
          button.querySelector('.ent-card-body span')!.textContent = bookItem.author
          button.querySelector('small')!.textContent = `${percent(pageForBook, bookItem.pages)} read · ${bookItem.genre}`
          button.addEventListener('click', () => setBook(bookItem.id))
          bookGrid.append(button)
        }

        bookmarkList.replaceChildren()
        for (const bookmark of state.bookmarks.filter(item => item.bookId === book.id).concat(state.bookmarks.filter(item => item.bookId !== book.id))) {
          const bookmarkBook = books.find(bookItem => bookItem.id === bookmark.bookId) ?? book
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-list-item ent-bookmark-item'
          button.innerHTML = `
            <span class="ent-track-number"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
            </span>
            <span class="ent-track-meta"></span>
          `
          button.querySelector('.ent-track-number')!.textContent = String(bookmark.page).padStart(3, '0')
          button.querySelector('strong')!.textContent = bookmarkBook.title
          button.querySelector('.ent-card-body span')!.textContent = bookmark.label
          button.querySelector('.ent-track-meta')!.textContent = 'Jump'
          button.addEventListener('click', () => setBook(bookmark.bookId, bookmark.page))
          bookmarkList.append(button)
        }

        chapters.replaceChildren()
        for (const chapterItem of book.chapters) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-chip'
          button.setAttribute('aria-current', String(chapterItem.id === chapter.id))
          button.innerHTML = `<span></span><small></small>`
          button.querySelector('span')!.textContent = chapterItem.title
          button.querySelector('small')!.textContent = `${chapterItem.startPage}–${chapterItem.endPage}`
          button.addEventListener('click', () => setBook(book.id, chapterItem.startPage))
          chapters.append(button)
        }
      }

      right.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
          const action = button.dataset.action
          if (action === 'bookmark') addBookmark()
          if (action === 'back') turnPages(-10)
          if (action === 'forward') turnPages(10)
          if (action === 'prevChapter') jumpChapter(-1)
          if (action === 'nextChapter') jumpChapter(1)
        })
      })

      render()
      refreshMediaChrome(left, right, 'books')
      return { left, right }
    },
  }
}

function createGamesApp(): PhoneApp {
  const state = readState<GameState>(storage.games, {
    gameId: games[0].id,
    running: false,
    sessionScore: 120,
    highScores: { [games[0].id]: 420, [games[2].id]: 980 },
    favoriteGameIds: [games[2].id],
  })

  return {
    id: 'games',
    name: 'Games',
    icon: '◉',
    color: '#7c5cff',
    create() {
      const left = document.createElement('section')
      left.className = 'ent-pane ent-games-pane'
      left.innerHTML = `
        <div class="ent-title">
          <p class="phone-eyebrow">ARCADE, FAVORITES, AND HIGH SCORES</p>
          <h2>Games</h2>
          <p class="ent-summary">Browse the cabinet, launch a run, and chase a better score without a live connection.</p>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Game cabinet</span>
            <span data-role="game-count"></span>
          </div>
          <div class="ent-album-grid" data-role="games"></div>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Favorites</span>
            <span data-role="favorite-count"></span>
          </div>
          <div class="ent-list" data-role="favorites"></div>
        </div>
      `

      const right = document.createElement('section')
      right.className = 'ent-pane ent-games-now'
      right.innerHTML = `
        <div class="ent-now-card">
          <div class="ent-art" data-role="art" aria-hidden="true"></div>
          <div class="ent-now-copy">
            <p class="phone-eyebrow">CABINET STATUS</p>
            <h3 data-role="title"></h3>
            <p data-role="subtitle"></p>
            <p class="ent-status" data-role="status"></p>
          </div>
        </div>
        <div class="ent-scoreboard">
          <div>
            <span>Session score</span>
            <strong data-role="session-score"></strong>
          </div>
          <div>
            <span>High score</span>
            <strong data-role="high-score"></strong>
          </div>
        </div>
        <div class="ent-controls" aria-label="Game controls">
          <button type="button" class="ent-control ent-control-primary" data-action="launch" data-role="launch">Launch</button>
          <button type="button" class="ent-control" data-action="round" data-role="round">Play round</button>
          <button type="button" class="ent-control" data-action="bank">Bank score</button>
          <button type="button" class="ent-control" data-action="favorite" data-role="favorite">Favorite</button>
          <button type="button" class="ent-control" data-action="reset">Reset run</button>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Modes</span>
            <span data-role="mode-count"></span>
          </div>
          <div class="ent-chip-row" data-role="modes"></div>
        </div>
        <div class="ent-block">
          <div class="ent-block-head">
            <span>Quick notes</span>
            <span data-role="note-meta"></span>
          </div>
          <p class="ent-summary" data-role="summary"></p>
        </div>
      `

      prepareMediaLayout(left, right, 'games')
      const gameCount = left.querySelector<HTMLElement>('[data-role="game-count"]')!
      const favoriteCount = left.querySelector<HTMLElement>('[data-role="favorite-count"]')!
      const gameGrid = left.querySelector<HTMLElement>('[data-role="games"]')!
      const favoriteList = left.querySelector<HTMLElement>('[data-role="favorites"]')!
      const art = right.querySelector<HTMLElement>('[data-role="art"]')!
      const title = right.querySelector<HTMLElement>('[data-role="title"]')!
      const subtitle = right.querySelector<HTMLElement>('[data-role="subtitle"]')!
      const status = right.querySelector<HTMLElement>('[data-role="status"]')!
      const sessionScore = right.querySelector<HTMLElement>('[data-role="session-score"]')!
      const highScore = right.querySelector<HTMLElement>('[data-role="high-score"]')!
      const launch = right.querySelector<HTMLButtonElement>('[data-role="launch"]')!
      const round = right.querySelector<HTMLButtonElement>('[data-role="round"]')!
      const favorite = right.querySelector<HTMLButtonElement>('[data-role="favorite"]')!
      const modeCount = right.querySelector<HTMLElement>('[data-role="mode-count"]')!
      const modes = right.querySelector<HTMLElement>('[data-role="modes"]')!
      const noteMeta = right.querySelector<HTMLElement>('[data-role="note-meta"]')!
      const summary = right.querySelector<HTMLElement>('[data-role="summary"]')!

      function normalize() {
        const game = pickFirst(games, state.gameId)
        state.gameId = game.id
        state.sessionScore = Math.max(0, state.sessionScore)
        state.highScores = Object.fromEntries(Object.entries(state.highScores).filter(([id]) => games.some(item => item.id === id)))
        state.favoriteGameIds = unique(state.favoriteGameIds.filter(id => games.some(item => item.id === id)))
      }

      function selectedGame() {
        return pickFirst(games, state.gameId)
      }

      function commit() {
        normalize()
        writeState(storage.games, state)
        render()
        refreshMediaChrome(left, right, 'games')
      }

      function selectGame(gameId: string) {
        if (state.running) bankScore()
        state.gameId = gameId
        state.running = false
        state.sessionScore = 0
        commit()
      }

      function launchGame() {
        state.running = true
        state.sessionScore = 0
        commit()
      }

      function scoreRound() {
        if (!state.running) return
        state.sessionScore += selectedGame().step
        state.highScores[state.gameId] = Math.max(state.highScores[state.gameId] ?? 0, state.sessionScore)
        commit()
      }

      function bankScore() {
        state.highScores[state.gameId] = Math.max(state.highScores[state.gameId] ?? 0, state.sessionScore)
        state.running = false
        commit()
      }

      function resetRun() {
        state.running = false
        state.sessionScore = 0
        commit()
      }

      function toggleFavorite() {
        state.favoriteGameIds = toggleId(state.favoriteGameIds, state.gameId)
        commit()
      }

      function render() {
        normalize()
        const game = selectedGame()
        const favorited = state.favoriteGameIds.includes(game.id)
        const best = state.highScores[game.id] ?? 0

        gameCount.textContent = `${games.length} games`
        favoriteCount.textContent = `${state.favoriteGameIds.length} favorites`
        noteMeta.textContent = state.running ? 'Live session' : 'Library mode'
        summary.textContent = game.summary
        art.style.setProperty('--ent-art', game.art)
        title.textContent = game.title
        subtitle.textContent = `${game.genre} · ${game.modes.join(' · ')}`
        status.textContent = state.running ? 'Running a live session' : 'Ready to launch'
        sessionScore.textContent = String(state.sessionScore)
        highScore.textContent = String(best)
        launch.textContent = state.running ? 'Stop' : 'Launch'
        launch.setAttribute('aria-pressed', String(state.running))
        round.disabled = !state.running
        favorite.textContent = favorited ? 'Favorited' : 'Favorite'
        favorite.setAttribute('aria-pressed', String(favorited))
        modeCount.textContent = `${game.modes.length} modes`

        gameGrid.replaceChildren()
        for (const gameItem of games) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-card ent-album-card'
          button.setAttribute('aria-current', String(gameItem.id === game.id))
          button.innerHTML = `
            <span class="ent-art ent-art-small" aria-hidden="true"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
              <small></small>
            </span>
          `
          button.querySelector<HTMLElement>('.ent-art')!.style.setProperty('--ent-art', gameItem.art)
          button.querySelector('strong')!.textContent = gameItem.title
          button.querySelector('.ent-card-body span')!.textContent = gameItem.genre
          button.querySelector('small')!.textContent = `High ${state.highScores[gameItem.id] ?? 0}${state.favoriteGameIds.includes(gameItem.id) ? ' · Favorite' : ''}`
          button.addEventListener('click', () => selectGame(gameItem.id))
          gameGrid.append(button)
        }

        favoriteList.replaceChildren()
        for (const gameItem of games.filter(item => state.favoriteGameIds.includes(item.id))) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'ent-list-item ent-track-item'
          button.setAttribute('aria-current', String(gameItem.id === game.id))
          button.innerHTML = `
            <span class="ent-track-number"></span>
            <span class="ent-card-body">
              <strong></strong>
              <span></span>
            </span>
            <span class="ent-track-meta"></span>
          `
          button.querySelector('.ent-track-number')!.textContent = '★'
          button.querySelector('strong')!.textContent = gameItem.title
          button.querySelector('.ent-card-body span')!.textContent = gameItem.summary
          button.querySelector('.ent-track-meta')!.textContent = `${state.highScores[gameItem.id] ?? 0}`
          button.addEventListener('click', () => selectGame(gameItem.id))
          favoriteList.append(button)
        }

        modes.replaceChildren()
        for (const mode of game.modes) {
          const chip = document.createElement('button')
          chip.type = 'button'
          chip.className = 'ent-chip'
          chip.innerHTML = `<span></span><small>Mode</small>`
          chip.querySelector('span')!.textContent = mode
          chip.addEventListener('click', () => launchGame())
          modes.append(chip)
        }
      }

      right.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
          const action = button.dataset.action
          if (action === 'launch') state.running ? bankScore() : launchGame()
          if (action === 'round') scoreRound()
          if (action === 'bank') bankScore()
          if (action === 'favorite') toggleFavorite()
          if (action === 'reset') resetRun()
        })
      })

      render()
      refreshMediaChrome(left, right, 'games')
      return { left, right }
    },
  }
}

export const entertainmentApps: PhoneApp[] = [
  createMusicApp(),
  createPodcastApp(),
  createTvApp(),
  createBooksApp(),
  createGamesApp(),
]
