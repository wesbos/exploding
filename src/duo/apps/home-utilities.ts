import './home-utilities.css'
import type { PhoneApp } from './types'

type WalletView = 'card' | 'pass'
type FindMyGroup = 'people' | 'devices' | 'items'
type HomeScene = 'morning' | 'evening' | 'away' | 'movie' | 'custom'
type StoreCategory = 'all' | 'music' | 'movies' | 'tv' | 'podcasts'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function formatMoney(value: number | undefined) {
  return value === undefined ? '—' : currencyFormatter.format(value)
}

function formatAgo(timestamp: number) {
  const diff = Math.max(0, Date.now() - timestamp)
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatShortDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readStorage<T>(key: string, fallback: T, guard: (value: unknown) => value is T) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    return guard(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can fail in private mode; treat it as optional.
  }
}

function createButton(label: string, className: string, onClick: () => void, options?: {
  ariaLabel?: string
  pressed?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const button = document.createElement('button')
  button.type = options?.type ?? 'button'
  button.className = className
  button.textContent = label
  if (options?.ariaLabel) button.setAttribute('aria-label', options.ariaLabel)
  if (options?.pressed !== undefined) button.setAttribute('aria-pressed', String(options.pressed))
  if (options?.disabled) button.disabled = true
  button.addEventListener('click', onClick)
  return button
}

function createPill(label: string, className = 'home-utility-pill') {
  const pill = document.createElement('span')
  pill.className = className
  pill.textContent = label
  return pill
}

function utilitySymbol(name: string) {
  const paths: Record<string, string> = {
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    device: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M10 19h4"/>',
    item: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
    home: '<path d="m2 11 10-9 10 9M5 9v13h14V9M10 22v-8h4v8"/>',
    light: '<path d="M8 16c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8ZM9 20h6M10 23h4"/>',
    shade: '<path d="M3 3h18v15H3zM3 7h18M3 11h18M3 15h18M20 18v5"/>',
    speaker: '<rect x="5" y="2" width="14" height="20" rx="4"/><circle cx="12" cy="15" r="4"/><circle cx="12" cy="6" r="1"/>',
    tv: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8M12 17v5"/>',
    fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10C4 2 18-3 15 7L13 10M14 12c12-3 8 12 2 5l-3-3M11 14c-4 12-14 0-5-1l4-1"/>',
    lock: '<rect x="4" y="10" width="16" height="12" rx="3"/><path d="M7 10V6a5 5 0 0 1 10 0v4M12 15v3"/>',
    coffee: '<path d="M3 7h14v10a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5ZM17 8h2a3 3 0 0 1 0 6h-2M7 1v3M12 1v3"/>',
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.home}</svg>`
}

const findMyMapArtwork = `
  <svg class="findmy-map-art" viewBox="0 0 480 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="480" height="280" fill="#e9e8df"/>
    <path d="M360-20c-100 80 65 155-35 220s-35 85-35 100h200V-20" fill="#a7d7ee"/>
    <path d="M17 12h119v75H17zM163 166h96v112h-96zM367 40h103v73H367z" fill="#c3ddad"/>
    <g fill="none" stroke="#d1cec2" stroke-width="13">
      <path d="M-20 120 350 85M85-20l47 320M210-20l55 320M-20 217l350-34M-20 30l363 20"/>
    </g>
    <g fill="none" stroke="#fff" stroke-width="9">
      <path d="M-20 120 350 85M85-20l47 320M210-20l55 320M-20 217l350-34M-20 30l363 20"/>
    </g>
    <path d="M-20 275 455-20" fill="none" stroke="#dfcf9d" stroke-width="13"/>
    <path d="M-20 275 455-20" fill="none" stroke="#fff5d9" stroke-width="8"/>
    <g fill="#758174" font-size="11" font-family="-apple-system, sans-serif">
      <text x="29" y="48">Riverside Park</text><text x="181" y="221">North Club</text>
      <text x="151" y="141" fill="#8b887f">Market Street</text><text x="372" y="181" fill="#608da1">River</text>
    </g>
  </svg>`

interface WalletActivity {
  id: string
  title: string
  detail: string
  location: string
  time: number
  amount?: number
  status: string
}

interface WalletEntry {
  id: string
  kind: 'card' | 'pass'
  name: string
  subtitle: string
  chip: string
  accent: string
  gradient: string
  headlineLabel: string
  headlineValue: string
  summaryLabel: string
  summaryValue: string
  activityLabel: string
  activities: WalletActivity[]
}

interface WalletState {
  view: WalletView
  selectedId: string
  selectedActivityId: string
}

function createWalletEntries(now: number): WalletEntry[] {
  return [
    {
      id: 'daily-card',
      kind: 'card',
      name: 'Daily Card',
      subtitle: 'Everyday spending',
      chip: 'Mastercard',
      accent: '#f7b267',
      gradient: '#deddd8',
      headlineLabel: 'Available balance',
      headlineValue: '$4,128.42',
      summaryLabel: 'Cash back',
      summaryValue: '$41.28',
      activityLabel: 'Recent purchases',
      activities: [
        { id: 'daily-1', title: 'Crescent Coffee', detail: 'Latte, croissant, and a tip.', location: 'Riverside Ave', time: now - 19 * 60_000, amount: -12.48, status: 'Completed' },
        { id: 'daily-2', title: 'Corner Market', detail: 'Groceries for dinner.', location: 'North Loop', time: now - 2 * 60 * 60_000, amount: -37.21, status: 'Settled' },
        { id: 'daily-3', title: 'City Garage', detail: 'Parking for the afternoon.', location: 'Market St', time: now - 5 * 60 * 60_000, amount: -18, status: 'Completed' },
      ],
    },
    {
      id: 'travel-card',
      kind: 'card',
      name: 'Travel Card',
      subtitle: 'Restaurants and transit',
      chip: 'Visa',
      accent: '#8fd3ff',
      gradient: '#213e60',
      headlineLabel: 'Available credit',
      headlineValue: '$8,240.00',
      summaryLabel: 'Rewards',
      summaryValue: '2.1% back',
      activityLabel: 'Approved charges',
      activities: [
        { id: 'travel-1', title: 'Metro', detail: 'Express ride downtown.', location: 'Central Station', time: now - 55 * 60_000, amount: -2.75, status: 'Tapped in' },
        { id: 'travel-2', title: 'Oda Sushi', detail: 'Dinner for two.', location: 'Old Port', time: now - 22 * 60 * 60_000, amount: -68.34, status: 'Settled' },
        { id: 'travel-3', title: 'Hotel North', detail: 'One night stay deposit.', location: 'Harbor District', time: now - 3 * 24 * 60 * 60_000, amount: -150, status: 'Pending' },
      ],
    },
    {
      id: 'transit-pass',
      kind: 'pass',
      name: 'Transit Pass',
      subtitle: 'Express Transit',
      chip: 'Ready to tap',
      accent: '#62d4a4',
      gradient: '#e5b632',
      headlineLabel: 'Rides left',
      headlineValue: '17',
      summaryLabel: 'Next ride',
      summaryValue: 'Weekday commute',
      activityLabel: 'Pass activity',
      activities: [
        { id: 'pass-1', title: 'Downtown Line', detail: 'Turnstile validation.', location: 'Riverside Station', time: now - 14 * 60_000, status: 'Used' },
        { id: 'pass-2', title: 'Tram to the pier', detail: 'Fare covered by your pass.', location: 'Pier 7', time: now - 18 * 60 * 60_000, status: 'Used' },
        { id: 'pass-3', title: 'Airport shuttle', detail: 'Last scanned at boarding.', location: 'Terminal B', time: now - 2 * 24 * 60 * 60_000, status: 'Used' },
      ],
    },
    {
      id: 'concert-pass',
      kind: 'pass',
      name: 'Concert Pass',
      subtitle: 'Floor entry tonight',
      chip: 'Ticket',
      accent: '#f47ad7',
      gradient: '#553e78',
      headlineLabel: 'Seat',
      headlineValue: 'Floor • Row 6',
      summaryLabel: 'Showtime',
      summaryValue: '8:30 PM',
      activityLabel: 'Ticket details',
      activities: [
        { id: 'concert-1', title: 'Ticket checked', detail: 'Gate B scan passed.', location: 'The Meridian', time: now - 4 * 60_000, status: 'Valid' },
        { id: 'concert-2', title: 'Merch pre-order', detail: 'T-shirt and poster bundle.', location: 'Online', time: now - 6 * 60 * 60_000, amount: -34, status: 'Paid' },
      ],
    },
  ]
}

function isWalletState(value: unknown): value is WalletState {
  return isRecord(value)
    && (value.view === 'card' || value.view === 'pass')
    && typeof value.selectedId === 'string'
    && typeof value.selectedActivityId === 'string'
}

const walletStorageKey = 'duo-home-utilities-wallet'

const walletApp: PhoneApp = {
  id: 'wallet',
  name: 'Wallet',
  icon: '◫',
  color: '#ffb16b',
  create() {
    const now = Date.now()
    const entries = createWalletEntries(now)
    const state = readStorage<WalletState>(walletStorageKey, {
      view: 'card',
      selectedId: entries.find(entry => entry.kind === 'card')?.id ?? entries[0].id,
      selectedActivityId: entries[0].activities[0]?.id ?? '',
    }, isWalletState)

    const left = document.createElement('section')
    left.className = 'home-utility-app wallet-app wallet-app--left'
    left.innerHTML = `
      <div class="home-utility-header">
        <div>
          <h2>Wallet</h2>
          <p class="home-utility-copy">Sample cards and passes · No payments</p>
        </div>
        <div class="home-utility-stat wallet-summary" role="status">
          <span class="wallet-summary-label">Cash back</span>
          <strong class="wallet-summary-value">—</strong>
          <span class="wallet-summary-subtitle">Select an item</span>
        </div>
      </div>
      <div class="home-utility-tabs wallet-tabs" role="group" aria-label="Wallet categories"></div>
      <div class="home-utility-list wallet-list" role="listbox" aria-label="Wallet items"></div>
    `

    const right = document.createElement('section')
    right.className = 'home-utility-app wallet-app wallet-app--right'
    right.innerHTML = `
      <article class="home-utility-card wallet-hero">
        <div class="wallet-hero-top">
          <div>
            <p class="wallet-hero-label">Wallet</p>
            <h3 class="wallet-hero-name"></h3>
          </div>
          <span class="wallet-chip"></span>
        </div>
        <div class="wallet-card-face">
          <div class="wallet-card-symbol" aria-hidden="true">◫</div>
          <div>
            <span class="wallet-card-meta"></span>
            <strong class="wallet-card-value"></strong>
          </div>
        </div>
        <div class="wallet-hero-pills" aria-label="Wallet details"></div>
      </article>
      <section class="home-utility-card wallet-activity-detail" aria-live="polite">
        <div class="wallet-detail-header">
          <div>
            <p class="wallet-detail-label"></p>
            <h3 class="wallet-detail-title"></h3>
          </div>
          <span class="wallet-detail-status"></span>
        </div>
        <dl class="wallet-detail-meta"></dl>
      </section>
      <section class="home-utility-card wallet-activity-panel">
        <div class="wallet-panel-header">
          <h4></h4>
          <span class="wallet-panel-subtitle"></span>
        </div>
        <div class="home-utility-list wallet-activity-list" role="listbox" aria-label="Wallet activity"></div>
      </section>
    `

    const walletSummaryValue = left.querySelector<HTMLElement>('.wallet-summary-value')!
    const walletSummarySubtitle = left.querySelector<HTMLElement>('.wallet-summary-subtitle')!
    const tabs = left.querySelector<HTMLElement>('.wallet-tabs')!
    const list = left.querySelector<HTMLElement>('.wallet-list')!
    const heroName = right.querySelector<HTMLElement>('.wallet-hero-name')!
    const heroChip = right.querySelector<HTMLElement>('.wallet-chip')!
    const heroMeta = right.querySelector<HTMLElement>('.wallet-card-meta')!
    const heroValue = right.querySelector<HTMLElement>('.wallet-card-value')!
    const heroFace = right.querySelector<HTMLElement>('.wallet-card-face')!
    const heroPills = right.querySelector<HTMLElement>('.wallet-hero-pills')!
    const detailLabel = right.querySelector<HTMLElement>('.wallet-detail-label')!
    const detailTitle = right.querySelector<HTMLElement>('.wallet-detail-title')!
    const detailStatus = right.querySelector<HTMLElement>('.wallet-detail-status')!
    const detailMeta = right.querySelector<HTMLElement>('.wallet-detail-meta')!
    const panelTitle = right.querySelector<HTMLElement>('.wallet-panel-header h4')!
    const panelSubtitle = right.querySelector<HTMLElement>('.wallet-panel-subtitle')!
    const activityList = right.querySelector<HTMLElement>('.wallet-activity-list')!

    function selectedEntry() {
      return entries.find(entry => entry.id === state.selectedId) ?? entries.find(entry => entry.kind === state.view) ?? entries[0]
    }

    function visibleEntries() {
      return entries.filter(entry => entry.kind === state.view)
    }

    function selectedActivity(entry: WalletEntry) {
      return entry.activities.find(activity => activity.id === state.selectedActivityId) ?? entry.activities[0]
    }

    function persist() {
      writeStorage(walletStorageKey, state)
    }

    function renderTabs() {
      tabs.replaceChildren()
      for (const view of ['cards', 'passes'] as const) {
        const kind = view === 'cards' ? 'card' : 'pass'
        const button = createButton(view === 'cards' ? 'Cards' : 'Passes', 'home-utility-tab', () => {
          if (state.view === kind) return
          state.view = kind
          const first = visibleEntries()[0]
          if (first) {
            state.selectedId = first.id
            state.selectedActivityId = first.activities[0]?.id ?? ''
          }
          persist()
          render()
        }, { pressed: state.view === kind })
        tabs.append(button)
      }
    }

    function renderList() {
      list.replaceChildren()
      const current = visibleEntries()
      for (const entry of current) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `home-utility-row wallet-row${entry.id === state.selectedId ? ' is-selected' : ''}`
        button.setAttribute('role', 'option')
        button.setAttribute('aria-selected', String(entry.id === state.selectedId))
        button.style.background = entry.gradient
        button.style.color = entry.id === 'daily-card' || entry.id === 'transit-pass' ? '#1c1c1e' : '#fff'
        button.innerHTML = `
          <div class="wallet-pass-brand"></div>
          <div class="home-utility-row-copy">
            <strong></strong>
            <span class="home-utility-muted"></span>
          </div>
          <div class="home-utility-row-meta">
            <span></span>
            <small></small>
          </div>
        `
        button.querySelector('.wallet-pass-brand')!.textContent = entry.chip
        button.querySelector('strong')!.textContent = entry.name
        button.querySelector('.home-utility-muted')!.textContent = entry.subtitle
        button.querySelector('.home-utility-row-meta span')!.textContent = entry.summaryValue
        button.querySelector('.home-utility-row-meta small')!.textContent = entry.summaryLabel
        button.addEventListener('click', () => {
          state.selectedId = entry.id
          state.selectedActivityId = entry.activities[0]?.id ?? ''
          persist()
          render()
        })
        list.append(button)
      }
    }

    function renderHero(entry: WalletEntry) {
      heroName.textContent = entry.name
      heroChip.textContent = entry.chip
      heroMeta.textContent = entry.headlineLabel
      heroValue.textContent = entry.headlineValue
      heroFace.style.background = entry.gradient
      heroFace.style.color = entry.id === 'daily-card' || entry.id === 'transit-pass' ? '#1c1c1e' : '#fff'
      heroPills.replaceChildren(
        createPill(entry.kind === 'card' ? 'Card' : 'Pass'),
        createPill(entry.summaryLabel),
        createPill(entry.summaryValue),
      )
      left.style.setProperty('--wallet-accent', entry.accent)
      right.style.setProperty('--wallet-accent', entry.accent)
    }

    function renderDetail(entry: WalletEntry, activity: WalletActivity) {
      detailLabel.textContent = entry.activityLabel
      detailTitle.textContent = activity.title
      detailStatus.textContent = activity.status
      detailMeta.replaceChildren()

      const rows: Array<[string, string]> = [
        ['Merchant', activity.title],
        ['Location', activity.location],
        ['Time', formatShortDate(activity.time)],
      ]
      if (activity.amount !== undefined) rows.splice(1, 0, ['Amount', formatMoney(activity.amount)])
      else rows.splice(1, 0, ['Amount', '—'])

      for (const [label, value] of rows) {
        const dt = document.createElement('div')
        dt.textContent = label
        const dd = document.createElement('div')
        dd.textContent = value
        detailMeta.append(dt, dd)
      }
    }

    function renderActivityList(entry: WalletEntry) {
      activityList.replaceChildren()
      panelTitle.textContent = entry.activityLabel
      panelSubtitle.textContent = `${entry.activities.length} items`
      for (const activity of entry.activities) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `home-utility-row wallet-activity-row${activity.id === state.selectedActivityId ? ' is-selected' : ''}`
        button.setAttribute('role', 'option')
        button.setAttribute('aria-selected', String(activity.id === state.selectedActivityId))
        button.innerHTML = `
          <div class="home-utility-row-copy">
            <strong></strong>
            <span class="home-utility-muted"></span>
          </div>
          <div class="home-utility-row-meta">
            <span></span>
            <small></small>
          </div>
        `
        button.querySelector('strong')!.textContent = activity.title
        button.querySelector('.home-utility-muted')!.textContent = activity.detail
        button.querySelector('.home-utility-row-meta span')!.textContent = activity.amount === undefined ? activity.status : formatMoney(activity.amount)
        button.querySelector('.home-utility-row-meta small')!.textContent = formatAgo(activity.time)
        button.addEventListener('click', () => {
          state.selectedActivityId = activity.id
          persist()
          render()
        })
        activityList.append(button)
      }
    }

    function render() {
      const entry = selectedEntry()
      const activity = selectedActivity(entry)
      if (!entry.activities.some(item => item.id === state.selectedActivityId)) {
        state.selectedActivityId = activity.id
        persist()
      }
      walletSummaryValue.textContent = entry.summaryValue
      walletSummarySubtitle.textContent = entry.summaryLabel
      renderTabs()
      renderList()
      renderHero(entry)
      renderDetail(entry, activity)
      renderActivityList(entry)
    }

    render()
    return { left, right }
  },
}

interface FindMyItem {
  id: string
  group: FindMyGroup
  name: string
  subtitle: string
  location: string
  status: string
  note: string
  distance: string
  battery?: number
  x: number
  y: number
  accent: string
  soundable: boolean
  lastSeen: number
}

interface FindMyState {
  group: FindMyGroup
  selectedId: string
}

function createFindMyItems(now: number): FindMyItem[] {
  return [
    {
      id: 'ava',
      group: 'people',
      name: 'Ava Moreno',
      subtitle: 'Shared location',
      location: 'Riverside Market',
      status: 'On the move',
      note: 'Shared 6 minutes ago',
      distance: '0.4 mi away',
      x: 18,
      y: 22,
      accent: '#7dd3fc',
      soundable: false,
      lastSeen: now - 6 * 60_000,
    },
    {
      id: 'ben',
      group: 'people',
      name: 'Ben Carter',
      subtitle: 'At the gym',
      location: 'North Club',
      status: 'Arrived 12 minutes ago',
      note: 'Hiking later this afternoon',
      distance: '1.2 mi away',
      x: 36,
      y: 44,
      accent: '#93c5fd',
      soundable: false,
      lastSeen: now - 12 * 60_000,
    },
    {
      id: 'mac',
      group: 'devices',
      name: 'MacBook Pro',
      subtitle: 'Charging on desk',
      location: 'Home Office',
      status: 'At home',
      note: 'Connected to power and Wi‑Fi',
      distance: 'At home',
      battery: 84,
      x: 54,
      y: 33,
      accent: '#86efac',
      soundable: true,
      lastSeen: now - 3 * 60_000,
    },
    {
      id: 'airpods',
      group: 'devices',
      name: 'AirPods Pro',
      subtitle: 'Case nearby',
      location: 'Gym Locker',
      status: 'Nearby',
      note: 'Open the case to reconnect',
      distance: '0.1 mi away',
      battery: 63,
      x: 74,
      y: 56,
      accent: '#c4b5fd',
      soundable: true,
      lastSeen: now - 28 * 60_000,
    },
    {
      id: 'keys',
      group: 'items',
      name: 'Keys',
      subtitle: 'Tagged with sound',
      location: 'Kitchen Counter',
      status: 'Found with you',
      note: 'The ring helps if they wander',
      distance: '2 ft away',
      x: 44,
      y: 72,
      accent: '#fbbf24',
      soundable: true,
      lastSeen: now - 11 * 60_000,
    },
    {
      id: 'backpack',
      group: 'items',
      name: 'Backpack',
      subtitle: 'Left in the studio',
      location: 'Studio Lobby',
      status: 'Last seen yesterday',
      note: 'Near the front desk and bike racks',
      distance: '0.8 mi away',
      x: 28,
      y: 77,
      accent: '#f472b6',
      soundable: true,
      lastSeen: now - 24 * 60 * 60_000,
    },
  ]
}

function isFindMyState(value: unknown): value is FindMyState {
  return isRecord(value)
    && (value.group === 'people' || value.group === 'devices' || value.group === 'items')
    && typeof value.selectedId === 'string'
}

const findMyStorageKey = 'duo-home-utilities-find-my'

const findMyApp: PhoneApp = {
  id: 'find-my',
  name: 'Find My',
  icon: '⌖',
  color: '#68d5ab',
  create() {
    const now = Date.now()
    const items = createFindMyItems(now)
    const state = readStorage<FindMyState>(findMyStorageKey, {
      group: 'people',
      selectedId: items.find(item => item.group === 'people')?.id ?? items[0].id,
    }, isFindMyState)
    let soundTimer: number | null = null
    let soundTargetId: string | null = null

    const left = document.createElement('section')
    left.className = 'home-utility-app findmy-app findmy-app--left'
    left.innerHTML = `
      <section class="findmy-map findmy-overview" aria-label="Illustrative map of sample locations">
        ${findMyMapArtwork}
        <div class="findmy-overview-pins"></div>
      </section>
      <div class="home-utility-header">
        <div>
          <h2>Find My</h2>
          <p class="home-utility-copy">Sample locations · Not live tracking</p>
        </div>
        <div class="home-utility-stat findmy-summary" role="status">
          <span class="findmy-summary-label">Selected</span>
          <strong class="findmy-summary-value">—</strong>
          <span class="findmy-summary-subtitle">Tap a pin</span>
        </div>
      </div>
      <div class="home-utility-list findmy-list" role="listbox" aria-label="Find My items"></div>
      <div class="home-utility-tabs findmy-tabs" role="group" aria-label="Find My categories"></div>
    `

    const right = document.createElement('section')
    right.className = 'home-utility-app findmy-app findmy-app--right'
    right.innerHTML = `
      <section class="findmy-map" aria-label="Illustrative map of sample locations">
        ${findMyMapArtwork}
        <div class="findmy-map-label">
          <span class="findmy-map-zone"></span>
          <strong class="findmy-map-title"></strong>
          <span class="findmy-map-subtitle"></span>
        </div>
        <div class="findmy-map-pins" aria-label="Location pins"></div>
      </section>
      <section class="home-utility-card findmy-detail" aria-live="polite">
        <div class="findmy-detail-top">
          <div>
            <p class="findmy-detail-group"></p>
            <h3 class="findmy-detail-title"></h3>
          </div>
          <span class="findmy-detail-status"></span>
        </div>
        <dl class="findmy-detail-meta"></dl>
        <p class="findmy-note"></p>
        <div class="findmy-actions"></div>
      </section>
    `

    const summaryValue = left.querySelector<HTMLElement>('.findmy-summary-value')!
    const summarySubtitle = left.querySelector<HTMLElement>('.findmy-summary-subtitle')!
    const tabs = left.querySelector<HTMLElement>('.findmy-tabs')!
    const list = left.querySelector<HTMLElement>('.findmy-list')!
    const mapTitle = right.querySelector<HTMLElement>('.findmy-map-title')!
    const mapSubtitle = right.querySelector<HTMLElement>('.findmy-map-subtitle')!
    const mapZone = right.querySelector<HTMLElement>('.findmy-map-zone')!
    const pins = right.querySelector<HTMLElement>('.findmy-map-pins')!
    const overviewPins = left.querySelector<HTMLElement>('.findmy-overview-pins')!
    const detailGroup = right.querySelector<HTMLElement>('.findmy-detail-group')!
    const detailTitle = right.querySelector<HTMLElement>('.findmy-detail-title')!
    const detailStatus = right.querySelector<HTMLElement>('.findmy-detail-status')!
    const detailMeta = right.querySelector<HTMLElement>('.findmy-detail-meta')!
    const detailNote = right.querySelector<HTMLElement>('.findmy-note')!
    const actions = right.querySelector<HTMLElement>('.findmy-actions')!

    function visibleItems() {
      return items.filter(item => item.group === state.group)
    }

    function selectedItem() {
      return items.find(item => item.id === state.selectedId) ?? visibleItems()[0] ?? items[0]
    }

    function persist() {
      writeStorage(findMyStorageKey, state)
    }

    function renderTabs() {
      tabs.replaceChildren()
      for (const group of ['people', 'devices', 'items'] as const) {
        const label = group === 'people' ? 'People' : group === 'devices' ? 'Devices' : 'Items'
        const button = createButton(label, 'home-utility-tab', () => {
          if (state.group === group) return
          state.group = group
          const first = visibleItems()[0]
          if (first) state.selectedId = first.id
          persist()
          render()
        }, { pressed: state.group === group })
        button.innerHTML = `${utilitySymbol(group === 'people' ? 'person' : group === 'devices' ? 'device' : 'item')}<span>${label}</span>`
        tabs.append(button)
      }
    }

    function renderList() {
      list.replaceChildren()
      for (const item of visibleItems()) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `home-utility-row findmy-row${item.id === state.selectedId ? ' is-selected' : ''}`
        button.setAttribute('role', 'option')
        button.setAttribute('aria-selected', String(item.id === state.selectedId))
        button.innerHTML = `
          <div class="home-utility-row-icon">${utilitySymbol(item.group === 'people' ? 'person' : item.group === 'devices' ? 'device' : 'item')}</div>
          <div class="home-utility-row-copy">
            <strong></strong>
            <span class="home-utility-muted"></span>
          </div>
          <div class="home-utility-row-meta">
            <span></span>
            <small></small>
          </div>
        `
        button.querySelector('strong')!.textContent = item.name
        button.querySelector('.home-utility-muted')!.textContent = item.subtitle
        button.querySelector('.home-utility-row-meta span')!.textContent = item.distance
        button.querySelector('.home-utility-row-meta small')!.textContent = item.battery === undefined ? item.status : `${item.battery}%`
        button.addEventListener('click', () => {
          state.selectedId = item.id
          persist()
          render()
        })
        list.append(button)
      }
    }

    function renderMap(current: FindMyItem) {
      mapTitle.textContent = current.location
      mapSubtitle.textContent = current.note
      mapZone.textContent = current.group === 'people' ? 'Shared location' : current.group === 'devices' ? 'Device ping' : 'Item tracker'
      for (const pinLayer of [pins, overviewPins]) {
        pinLayer.replaceChildren()
        for (const item of visibleItems()) {
          const pin = createButton('', `findmy-pin findmy-pin--${item.group}${item.id === state.selectedId ? ' is-selected' : ''}${soundTargetId === item.id ? ' is-ringing' : ''}`, () => {
            state.selectedId = item.id
            persist()
            render()
          }, { ariaLabel: `${item.name}, ${item.location}` })
          pin.style.left = `${item.x}%`
          pin.style.top = `${item.y}%`
          pin.style.setProperty('--pin-accent', item.accent)
          pin.innerHTML = `
            <span aria-hidden="true">${item.group === 'people' ? item.name.split(' ').map(part => part[0]).join('') : utilitySymbol(item.group === 'devices' ? 'device' : 'item')}</span>
            <small></small>
          `
          pin.querySelector('small')!.textContent = item.name.split(' ')[0]
          pinLayer.append(pin)
        }
      }
    }

    function renderDetail(current: FindMyItem) {
      detailGroup.textContent = current.group === 'people' ? 'People' : current.group === 'devices' ? 'Devices' : 'Items'
      detailTitle.textContent = current.name
      detailStatus.textContent = current.status
      detailMeta.replaceChildren()
      const rows: Array<[string, string]> = [
        ['Location', current.location],
        ['Distance', current.distance],
        ['Last seen', formatAgo(current.lastSeen)],
      ]
      if (current.battery !== undefined) rows.push(['Battery', `${current.battery}%`])
      for (const [label, value] of rows) {
        const dt = document.createElement('div')
        dt.textContent = label
        const dd = document.createElement('div')
        dd.textContent = value
        detailMeta.append(dt, dd)
      }
      detailNote.textContent = current.note
      actions.replaceChildren()
      actions.append(
        createButton('Directions', 'home-utility-action', () => {
          state.selectedId = current.id
          persist()
          render()
          detailNote.textContent = `Demo directions to ${current.location}. No route or live location is available.`
        }),
      )
      actions.append(
        createButton(current.group === 'people' ? 'Message' : 'Notify', 'home-utility-action', () => {
          state.selectedId = current.id
          persist()
          render()
          detailNote.textContent = current.group === 'people'
            ? 'Demo only. No message was sent.'
            : 'Demo only. Location notifications are not enabled.'
        }),
      )
      if (current.soundable) {
        actions.append(
          createButton(soundTargetId === current.id ? 'Stop Sound' : 'Play Sound', 'home-utility-action home-utility-action--primary', () => {
            if (soundTargetId === current.id) {
              if (soundTimer !== null) window.clearTimeout(soundTimer)
              soundTimer = null
              soundTargetId = null
              render()
              return
            }
            if (soundTimer !== null) window.clearTimeout(soundTimer)
            soundTargetId = current.id
            render()
            detailNote.textContent = 'Simulating Play Sound. No real device will ring.'
            soundTimer = window.setTimeout(() => {
              soundTargetId = null
              soundTimer = null
              render()
            }, 4_000)
          }, { pressed: soundTargetId === current.id }),
        )
      }
    }

    function render() {
      const current = selectedItem()
      if (!visibleItems().some(item => item.id === state.selectedId)) {
        state.selectedId = current.id
        persist()
      }
      summaryValue.textContent = current.name
      summarySubtitle.textContent = current.status
      left.querySelector('h2')!.textContent = state.group === 'people' ? 'People' : state.group === 'devices' ? 'Devices' : 'Items'
      renderTabs()
      renderList()
      renderMap(current)
      renderDetail(current)
      left.style.setProperty('--findmy-accent', current.accent)
      right.style.setProperty('--findmy-accent', current.accent)
    }

    render()
    return { left, right }
  },
}

interface HomeAccessory {
  id: string
  roomId: string
  name: string
  icon: string
  description: string
  onLabel: string
  offLabel: string
  state: boolean
}

interface HomeRoom {
  id: string
  name: string
  summary: string
  climate: string
  accent: string
  sceneHint: string
}

interface HomeState {
  roomId: string
  scene: HomeScene
  accessories: Record<string, boolean>
}

function createHomeData() {
  const accessories: HomeAccessory[] = [
    { id: 'living-light', roomId: 'living', name: 'Ceiling lights', icon: '☼', description: 'Warm white across the room', onLabel: 'On', offLabel: 'Off', state: true },
    { id: 'living-shade', roomId: 'living', name: 'Shades', icon: '▤', description: 'Open for daylight', onLabel: 'Closed', offLabel: 'Open', state: false },
    { id: 'living-speaker', roomId: 'living', name: 'Speaker', icon: '♪', description: 'Soft background music', onLabel: 'Playing', offLabel: 'Paused', state: false },
    { id: 'living-tv', roomId: 'living', name: 'TV', icon: '▭', description: 'Ready for a movie night', onLabel: 'On', offLabel: 'Off', state: false },
    { id: 'kitchen-light', roomId: 'kitchen', name: 'Kitchen lights', icon: '☼', description: 'Counter lighting', onLabel: 'On', offLabel: 'Off', state: true },
    { id: 'coffee-maker', roomId: 'kitchen', name: 'Coffee maker', icon: '◔', description: 'Brewing something strong', onLabel: 'Brewing', offLabel: 'Idle', state: false },
    { id: 'kitchen-fan', roomId: 'kitchen', name: 'Vent fan', icon: '≋', description: 'Clearing the air', onLabel: 'On', offLabel: 'Off', state: false },
    { id: 'bed-light', roomId: 'bedroom', name: 'Bedside lamps', icon: '☾', description: 'Dimmed for the evening', onLabel: 'On', offLabel: 'Off', state: false },
    { id: 'bed-shade', roomId: 'bedroom', name: 'Blackout shades', icon: '▤', description: 'Sleep mode engaged', onLabel: 'Closed', offLabel: 'Open', state: true },
    { id: 'bed-fan', roomId: 'bedroom', name: 'Fan', icon: '≋', description: 'Quiet overnight breeze', onLabel: 'On', offLabel: 'Off', state: false },
    { id: 'alarm', roomId: 'entry', name: 'Security alarm', icon: '◆', description: 'Armed when no one is home', onLabel: 'Armed', offLabel: 'Disarmed', state: true },
    { id: 'entry-lock', roomId: 'entry', name: 'Front door lock', icon: '▣', description: 'Locked from the app', onLabel: 'Locked', offLabel: 'Unlocked', state: true },
  ]
  const rooms: HomeRoom[] = [
    { id: 'living', name: 'Living Room', summary: 'Comfortable and bright', climate: '72°', accent: '#f59e0b', sceneHint: 'Movie nights, music, and open shades' },
    { id: 'kitchen', name: 'Kitchen', summary: 'Ready for coffee', climate: '71°', accent: '#fb7185', sceneHint: 'Morning routine and quick prep' },
    { id: 'bedroom', name: 'Bedroom', summary: 'Night mode ready', climate: '68°', accent: '#8b5cf6', sceneHint: 'Quiet, dim, and cool' },
    { id: 'entry', name: 'Entryway', summary: 'Security first', climate: '69°', accent: '#38bdf8', sceneHint: 'Locks, alarm, and arrivals' },
  ]
  return { accessories, rooms }
}

function isHomeState(value: unknown): value is HomeState {
  return isRecord(value)
    && typeof value.roomId === 'string'
    && (value.scene === 'morning' || value.scene === 'evening' || value.scene === 'away' || value.scene === 'movie' || value.scene === 'custom')
    && isRecord(value.accessories)
}

const homeStorageKey = 'duo-home-utilities-home'

const homeApp: PhoneApp = {
  id: 'home',
  name: 'Home',
  icon: '⌂',
  color: '#ffd166',
  create() {
    const { accessories, rooms } = createHomeData()
    const accessoryDefaults = Object.fromEntries(accessories.map(accessory => [accessory.id, accessory.state])) as Record<string, boolean>
    const state = readStorage<HomeState>(homeStorageKey, {
      roomId: 'living',
      scene: 'evening',
      accessories: accessoryDefaults,
    }, isHomeState)

    state.accessories = { ...accessoryDefaults, ...state.accessories }
    if (!rooms.some(room => room.id === state.roomId)) state.roomId = 'living'
    let accessoryCategory = 'all'
    const accessoryCategories = [
      { id: 'all', label: 'All', symbol: 'home' },
      { id: 'lighting', label: 'Lights', symbol: 'light' },
      { id: 'climate', label: 'Climate', symbol: 'fan' },
      { id: 'security', label: 'Security', symbol: 'lock' },
      { id: 'media', label: 'Media', symbol: 'speaker' },
    ]

    const sceneDefinitions: Array<{ id: Exclude<HomeScene, 'custom'>; label: string; description: string; roomId: string; apply: Partial<Record<string, boolean>> }> = [
      {
        id: 'morning',
        label: 'Morning',
        description: 'Wake the kitchen and open the shades.',
        roomId: 'kitchen',
        apply: {
          'kitchen-light': true,
          'coffee-maker': true,
          'kitchen-fan': false,
          'living-light': true,
          'living-shade': false,
          'living-speaker': false,
          'living-tv': false,
          'bed-light': false,
          'bed-shade': false,
          'bed-fan': false,
          alarm: false,
          'entry-lock': false,
        },
      },
      {
        id: 'evening',
        label: 'Evening',
        description: 'Settle into the living room and lock up.',
        roomId: 'living',
        apply: {
          'living-light': true,
          'living-shade': false,
          'living-speaker': true,
          'living-tv': false,
          'kitchen-light': false,
          'coffee-maker': false,
          'kitchen-fan': false,
          'bed-light': false,
          'bed-shade': true,
          'bed-fan': false,
          alarm: true,
          'entry-lock': true,
        },
      },
      {
        id: 'away',
        label: 'Away',
        description: 'Power down and secure the house.',
        roomId: 'entry',
        apply: {
          'living-light': false,
          'living-shade': true,
          'living-speaker': false,
          'living-tv': false,
          'kitchen-light': false,
          'coffee-maker': false,
          'kitchen-fan': false,
          'bed-light': false,
          'bed-shade': true,
          'bed-fan': false,
          alarm: true,
          'entry-lock': true,
        },
      },
      {
        id: 'movie',
        label: 'Movie',
        description: 'Dim the room and close the shades.',
        roomId: 'living',
        apply: {
          'living-light': true,
          'living-shade': true,
          'living-speaker': true,
          'living-tv': true,
          'kitchen-light': false,
          'coffee-maker': false,
          'kitchen-fan': false,
          'bed-light': false,
          'bed-shade': true,
          'bed-fan': false,
          alarm: true,
          'entry-lock': true,
        },
      },
    ]

    const left = document.createElement('section')
    left.className = 'home-utility-app home-app home-app--left'
    left.innerHTML = `
      <div class="home-utility-header">
        <div>
          <h2>My Home</h2>
          <p class="home-utility-copy">Demo home · No accessories connected</p>
        </div>
        <div class="home-utility-stat home-summary" role="status">
          <span class="home-summary-label">Scene</span>
          <strong class="home-summary-value">—</strong>
          <span class="home-summary-subtitle">Tap a preset</span>
        </div>
      </div>
      <h3 class="home-section-title">Scenes</h3>
      <div class="home-utility-tabs home-scenes" role="group" aria-label="Home scenes"></div>
      <h3 class="home-section-title">Rooms</h3>
      <div class="home-utility-list home-rooms" role="listbox" aria-label="Rooms"></div>
    `

    const right = document.createElement('section')
    right.className = 'home-utility-app home-app home-app--right'
    right.innerHTML = `
      <article class="home-hero home-utility-card">
        <div class="home-hero-top">
          <div>
            <p class="home-hero-label">Selected room</p>
            <h3 class="home-hero-title"></h3>
          </div>
          <span class="home-hero-chip"></span>
        </div>
        <div class="home-hero-panel">
          <div>
            <span class="home-hero-panel-label">Climate</span>
            <strong class="home-hero-climate"></strong>
          </div>
          <div>
            <span class="home-hero-panel-label">Status</span>
            <strong class="home-hero-summary"></strong>
          </div>
        </div>
        <p class="home-hero-note"></p>
      </article>
      <div class="home-accessory-categories" role="group" aria-label="Accessory categories"></div>
      <section class="home-utility-card home-accessories">
        <div class="home-accessories-top">
          <div>
            <p class="home-accessories-label">Accessories</p>
            <h4 class="home-accessories-title"></h4>
          </div>
          <span class="home-accessories-count"></span>
        </div>
        <div class="home-accessories-list"></div>
      </section>
    `

    const sceneValue = left.querySelector<HTMLElement>('.home-summary-value')!
    const sceneSubtitle = left.querySelector<HTMLElement>('.home-summary-subtitle')!
    const scenesContainer = left.querySelector<HTMLElement>('.home-scenes')!
    const roomsList = left.querySelector<HTMLElement>('.home-rooms')!
    const heroTitle = right.querySelector<HTMLElement>('.home-hero-title')!
    const heroChip = right.querySelector<HTMLElement>('.home-hero-chip')!
    const heroClimate = right.querySelector<HTMLElement>('.home-hero-climate')!
    const heroSummary = right.querySelector<HTMLElement>('.home-hero-summary')!
    const heroNote = right.querySelector<HTMLElement>('.home-hero-note')!
    const accessoriesTitle = right.querySelector<HTMLElement>('.home-accessories-title')!
    const accessoriesCount = right.querySelector<HTMLElement>('.home-accessories-count')!
    const accessoriesList = right.querySelector<HTMLElement>('.home-accessories-list')!
    const accessoryFilters = right.querySelector<HTMLElement>('.home-accessory-categories')!

    function selectedRoom() {
      return rooms.find(room => room.id === state.roomId) ?? rooms[0]
    }

    function applyScene(sceneId: Exclude<HomeScene, 'custom'>) {
      const scene = sceneDefinitions.find(item => item.id === sceneId)
      if (!scene) return
      for (const accessory of accessories) {
        if (scene.apply[accessory.id] !== undefined) state.accessories[accessory.id] = Boolean(scene.apply[accessory.id])
      }
      state.scene = sceneId
      state.roomId = scene.roomId
      accessoryCategory = 'all'
      persist()
      render()
    }

    function persist() {
      writeStorage(homeStorageKey, state)
    }

    function renderScenes() {
      scenesContainer.replaceChildren()
      for (const scene of sceneDefinitions) {
        const button = createButton(scene.label, 'home-utility-tab', () => applyScene(scene.id), {
          pressed: state.scene === scene.id,
        })
        button.title = scene.description
        scenesContainer.append(button)
      }
      const custom = createButton('Custom', 'home-utility-tab', () => {
        state.scene = 'custom'
        persist()
        render()
      }, { pressed: state.scene === 'custom' })
      custom.title = 'Manual adjustments'
      scenesContainer.append(custom)
    }

    function renderRooms() {
      roomsList.replaceChildren()
      for (const room of rooms) {
        const roomAccessories = accessories.filter(accessory => accessory.roomId === room.id)
        const onCount = roomAccessories.filter(accessory => state.accessories[accessory.id]).length
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `home-utility-row home-room-row${room.id === state.roomId ? ' is-selected' : ''}`
        button.setAttribute('role', 'option')
        button.setAttribute('aria-selected', String(room.id === state.roomId))
        button.innerHTML = `
          <div class="home-utility-row-icon">${utilitySymbol('home')}</div>
          <div class="home-utility-row-copy">
            <strong></strong>
            <span class="home-utility-muted"></span>
          </div>
          <div class="home-utility-row-meta">
            <span></span>
            <small></small>
          </div>
        `
        button.querySelector('strong')!.textContent = room.name
        button.querySelector('.home-utility-muted')!.textContent = room.summary
        button.querySelector('.home-utility-row-meta span')!.textContent = `${onCount}/${roomAccessories.length} on`
        button.querySelector('.home-utility-row-meta small')!.textContent = room.climate
        button.addEventListener('click', () => {
          state.roomId = room.id
          accessoryCategory = 'all'
          persist()
          render()
        })
        roomsList.append(button)
      }
    }

    function renderHero(room: HomeRoom) {
      heroTitle.textContent = room.name
      heroChip.textContent = state.scene === 'custom'
        ? 'Custom scene'
        : state.scene === 'away'
          ? 'Away mode'
          : state.scene === 'movie'
            ? 'Movie night'
            : state.scene === 'morning'
              ? 'Morning'
              : 'Evening'
      heroClimate.textContent = room.climate
      heroSummary.textContent = room.summary
      heroNote.textContent = room.sceneHint
      left.style.setProperty('--home-accent', room.accent)
      right.style.setProperty('--home-accent', room.accent)
      sceneValue.textContent = state.scene === 'custom' ? 'Custom' : sceneDefinitions.find(scene => scene.id === state.scene)?.label ?? 'Custom'
      sceneSubtitle.textContent = room.name
    }

    function renderAccessories(room: HomeRoom) {
      accessoryFilters.replaceChildren()
      for (const category of accessoryCategories) {
        const button = createButton('', 'home-accessory-category', () => {
          accessoryCategory = category.id
          renderAccessories(selectedRoom())
        }, { pressed: accessoryCategory === category.id })
        button.innerHTML = `${utilitySymbol(category.symbol)}<span>${category.label}</span>`
        accessoryFilters.append(button)
      }
      const roomAccessories = accessories.filter(accessory => {
        if (accessory.roomId !== room.id) return false
        if (accessoryCategory === 'all') return true
        if (accessoryCategory === 'lighting') return accessory.id.includes('light') || accessory.id.includes('shade')
        if (accessoryCategory === 'climate') return accessory.id.includes('fan')
        if (accessoryCategory === 'security') return accessory.id === 'alarm' || accessory.id.includes('lock')
        return accessory.id.includes('speaker') || accessory.id.includes('tv')
      })
      accessoriesTitle.textContent = room.name
      accessoriesCount.textContent = `${roomAccessories.length} devices`
      accessoriesList.replaceChildren()
      if (!roomAccessories.length) {
        const empty = document.createElement('p')
        empty.className = 'home-utility-empty'
        empty.textContent = 'No accessories in this category.'
        accessoriesList.append(empty)
      }
      for (const accessory of roomAccessories) {
        const button = createButton('', 'home-accessory-toggle', () => {
          state.accessories[accessory.id] = !state.accessories[accessory.id]
          state.scene = 'custom'
          persist()
          render()
        }, { pressed: state.accessories[accessory.id] })
        button.setAttribute('aria-label', `${accessory.name}, ${state.accessories[accessory.id] ? accessory.onLabel : accessory.offLabel}`)
        button.innerHTML = `
          <span class="home-accessory-icon" aria-hidden="true">${utilitySymbol(accessory.id.includes('light') ? 'light' : accessory.id.includes('shade') ? 'shade' : accessory.id.includes('fan') ? 'fan' : accessory.id.includes('speaker') ? 'speaker' : accessory.id.includes('tv') ? 'tv' : accessory.id.includes('coffee') ? 'coffee' : 'lock')}</span>
          <span class="home-accessory-copy">
            <strong></strong>
            <span></span>
          </span>
        `
        button.querySelector('strong')!.textContent = accessory.name
        button.querySelector('span span')!.textContent = state.accessories[accessory.id] ? accessory.onLabel : accessory.offLabel
        accessoriesList.append(button)
      }
    }

    function render() {
      const room = selectedRoom()
      renderScenes()
      renderRooms()
      renderHero(room)
      renderAccessories(room)
    }

    render()
    return { left, right }
  },
}

interface StoreItem {
  id: string
  category: Exclude<StoreCategory, 'all'>
  title: string
  artist: string
  description: string
  highlights: string[]
  price: number
  badge: string
  artLabel: string
  artGradient: string
  year: number
  length: string
}

interface StoreState {
  category: StoreCategory
  query: string
  selectedId: string
  purchasedIds: string[]
}

function createStoreItems(): StoreItem[] {
  return [
    {
      id: 'midnight-drive',
      category: 'music',
      title: 'Midnight Drive',
      artist: 'Luna Coast',
      description: 'A neon-lit album for late-night drives and bright reflections.',
      highlights: ['10 tracks', 'Synth-pop', 'New stereo mix'],
      price: 9.99,
      badge: 'Album',
      artLabel: 'Luna Coast',
      artGradient: 'linear-gradient(135deg, #1f1c4d 0%, #4b257c 50%, #0b1020 100%)',
      year: 2026,
      length: '42 min',
    },
    {
      id: 'golden-hour',
      category: 'music',
      title: 'Golden Hour',
      artist: 'Arlo Stone',
      description: 'A polished single with warm vocals and a bright hook.',
      highlights: ['1 track', 'Lyrics included', '3 previews'],
      price: 1.29,
      badge: 'Single',
      artLabel: 'Arlo Stone',
      artGradient: 'linear-gradient(135deg, #ffb86b 0%, #f06f5b 50%, #5b2d86 100%)',
      year: 2026,
      length: '3 min',
    },
    {
      id: 'sunroom-echo',
      category: 'music',
      title: 'Sunroom Echo',
      artist: 'The Lanterns',
      description: 'Guitar-led songs with room-filling chorus lines.',
      highlights: ['12 tracks', 'Indie rock', 'High resolution'],
      price: 11.99,
      badge: 'Album',
      artLabel: 'The Lanterns',
      artGradient: 'linear-gradient(135deg, #f7c948 0%, #ef7d57 48%, #592c88 100%)',
      year: 2025,
      length: '47 min',
    },
    {
      id: 'skyline-run',
      category: 'movies',
      title: 'Skyline Run',
      artist: 'Northlight Pictures',
      description: 'A fast-moving heist film with bonus scenes and commentary.',
      highlights: ['1080p', 'Bonus scenes', 'Commentary track'],
      price: 14.99,
      badge: 'Movie',
      artLabel: 'Skyline Run',
      artGradient: 'linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #7c3aed 100%)',
      year: 2025,
      length: '1h 54m',
    },
    {
      id: 'after-hours',
      category: 'tv',
      title: 'After Hours',
      artist: 'Nightline Studios',
      description: 'The complete second season, ready to queue from the couch.',
      highlights: ['10 episodes', 'Season pass', 'Downloads included'],
      price: 19.99,
      badge: 'TV Season',
      artLabel: 'After Hours',
      artGradient: 'linear-gradient(135deg, #111827 0%, #1d4ed8 52%, #ec4899 100%)',
      year: 2024,
      length: '7h 20m',
    },
    {
      id: 'signal-boost',
      category: 'podcasts',
      title: 'Signal Boost',
      artist: 'Maren Bell',
      description: 'Weekly interviews about design, software, and the making of things.',
      highlights: ['New every Friday', 'Free episodes', 'Bonus members feed'],
      price: 0,
      badge: 'Podcast',
      artLabel: 'Signal Boost',
      artGradient: 'linear-gradient(135deg, #064e3b 0%, #0f766e 52%, #0ea5e9 100%)',
      year: 2026,
      length: '25 min',
    },
    {
      id: 'city-stories',
      category: 'podcasts',
      title: 'City Stories',
      artist: 'Jules Harper',
      description: 'Short documentary episodes about neighborhoods and the people in them.',
      highlights: ['Stories near you', 'Free preview', 'Ad-free option'],
      price: 0,
      badge: 'Podcast',
      artLabel: 'City Stories',
      artGradient: 'linear-gradient(135deg, #312e81 0%, #7c3aed 48%, #ec4899 100%)',
      year: 2025,
      length: '31 min',
    },
    {
      id: 'harbor-lights',
      category: 'movies',
      title: 'Harbor Lights',
      artist: 'Cinewave',
      description: 'A quiet coastal drama with rich color grading and commentary.',
      highlights: ['4K', 'Director cut', 'Audio descriptions'],
      price: 12.99,
      badge: 'Movie',
      artLabel: 'Harbor Lights',
      artGradient: 'linear-gradient(135deg, #083344 0%, #0f766e 50%, #7c2d12 100%)',
      year: 2024,
      length: '2h 08m',
    },
  ]
}

function isStoreState(value: unknown): value is StoreState {
  return isRecord(value)
    && (value.category === 'all' || value.category === 'music' || value.category === 'movies' || value.category === 'tv' || value.category === 'podcasts')
    && typeof value.query === 'string'
    && typeof value.selectedId === 'string'
    && Array.isArray(value.purchasedIds)
    && value.purchasedIds.every(id => typeof id === 'string')
}

const storeStorageKey = 'duo-home-utilities-itunes-store'

const itunesStoreApp: PhoneApp = {
  id: 'itunes-store',
  name: 'iTunes Store',
  icon: '♪',
  color: '#8b5cf6',
  create() {
    const items = createStoreItems()
    const state = readStorage<StoreState>(storeStorageKey, {
      category: 'all',
      query: '',
      selectedId: items[0].id,
      purchasedIds: ['signal-boost'],
    }, isStoreState)

    const left = document.createElement('section')
    left.className = 'home-utility-app itunes-app itunes-app--left'
    left.innerHTML = `
      <div class="home-utility-header">
        <div>
          <h2>iTunes Store</h2>
          <p class="home-utility-copy">Demo catalog · Purchases are simulated</p>
        </div>
        <div class="home-utility-stat itunes-summary" role="status">
          <span class="itunes-summary-label">Owned</span>
          <strong class="itunes-summary-value">—</strong>
          <span class="itunes-summary-subtitle">Search the store</span>
        </div>
      </div>
      <label class="itunes-search">
        <span class="visually-hidden">Search the store</span>
        <input class="itunes-search-input" type="search" placeholder="Search music, movies, and podcasts" autocomplete="off" spellcheck="false">
      </label>
      <div class="home-utility-tabs itunes-categories" role="group" aria-label="Store categories"></div>
      <div class="home-utility-list itunes-results" role="listbox" aria-label="Store results"></div>
    `

    const right = document.createElement('section')
    right.className = 'home-utility-app itunes-app itunes-app--right'
    right.innerHTML = `
      <article class="itunes-hero home-utility-card">
        <div class="itunes-art">
          <div class="itunes-art-label"></div>
        </div>
        <div class="itunes-hero-copy">
          <p class="itunes-hero-kicker"></p>
          <h3 class="itunes-hero-title"></h3>
          <p class="itunes-hero-artist"></p>
        </div>
      </article>
      <section class="home-utility-card itunes-detail" aria-live="polite">
        <div class="itunes-detail-top">
          <div>
            <p class="itunes-detail-badge"></p>
            <h4 class="itunes-detail-title"></h4>
          </div>
          <span class="itunes-detail-price"></span>
        </div>
        <p class="itunes-detail-description"></p>
        <div class="itunes-detail-meta"></div>
        <button class="itunes-buy home-utility-action home-utility-action--primary" type="button"></button>
      </section>
      <section class="home-utility-card itunes-highlights">
        <div class="itunes-highlights-top">
          <h4>What’s included</h4>
          <span class="itunes-owned-count"></span>
        </div>
        <div class="itunes-highlights-list"></div>
      </section>
    `

    const summaryValue = left.querySelector<HTMLElement>('.itunes-summary-value')!
    const summarySubtitle = left.querySelector<HTMLElement>('.itunes-summary-subtitle')!
    const searchInput = left.querySelector<HTMLInputElement>('.itunes-search-input')!
    const categories = left.querySelector<HTMLElement>('.itunes-categories')!
    const results = left.querySelector<HTMLElement>('.itunes-results')!
    const artLabel = right.querySelector<HTMLElement>('.itunes-art-label')!
    const heroKicker = right.querySelector<HTMLElement>('.itunes-hero-kicker')!
    const heroTitle = right.querySelector<HTMLElement>('.itunes-hero-title')!
    const heroArtist = right.querySelector<HTMLElement>('.itunes-hero-artist')!
    const detailBadge = right.querySelector<HTMLElement>('.itunes-detail-badge')!
    const detailTitle = right.querySelector<HTMLElement>('.itunes-detail-title')!
    const detailPrice = right.querySelector<HTMLElement>('.itunes-detail-price')!
    const detailDescription = right.querySelector<HTMLElement>('.itunes-detail-description')!
    const detailMeta = right.querySelector<HTMLElement>('.itunes-detail-meta')!
    const buyButton = right.querySelector<HTMLButtonElement>('.itunes-buy')!
    const ownedCount = right.querySelector<HTMLElement>('.itunes-owned-count')!
    const highlightsList = right.querySelector<HTMLElement>('.itunes-highlights-list')!

    searchInput.value = state.query

    function visibleItems() {
      const query = state.query.trim().toLowerCase()
      return items.filter(item => {
        const categoryMatch = state.category === 'all' || item.category === state.category
        if (!categoryMatch) return false
        if (!query) return true
        return [item.title, item.artist, item.description, item.badge, ...item.highlights].some(value => value.toLowerCase().includes(query))
      })
    }

    function selectedItem() {
      return items.find(item => item.id === state.selectedId) ?? visibleItems()[0] ?? items[0]
    }

    function persist() {
      writeStorage(storeStorageKey, state)
    }

    function renderCategories() {
      categories.replaceChildren()
      for (const category of ['all', 'music', 'movies', 'tv', 'podcasts'] as const) {
        const label = category === 'all' ? 'All' : category === 'music' ? 'Music' : category === 'movies' ? 'Movies' : category === 'tv' ? 'TV' : 'Podcasts'
        const button = createButton(label, 'home-utility-tab', () => {
          if (state.category === category) return
          state.category = category
          const first = visibleItems()[0]
          if (first) state.selectedId = first.id
          persist()
          render()
        }, { pressed: state.category === category })
        categories.append(button)
      }
    }

    function renderResults() {
      const current = visibleItems()
      results.replaceChildren()
      if (!current.length) {
        const empty = document.createElement('p')
        empty.className = 'home-utility-empty'
        empty.textContent = 'No results match this search.'
        results.append(empty)
        return
      }
      for (const item of current) {
        const owned = state.purchasedIds.includes(item.id)
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `home-utility-row itunes-row${item.id === state.selectedId ? ' is-selected' : ''}`
        button.setAttribute('role', 'option')
        button.setAttribute('aria-selected', String(item.id === state.selectedId))
        button.innerHTML = `
          <div class="itunes-row-art" style="background:${item.artGradient}" aria-hidden="true"><span></span></div>
          <div class="home-utility-row-copy">
            <strong></strong>
            <span class="home-utility-muted"></span>
          </div>
          <div class="home-utility-row-meta">
            <span></span>
            <small></small>
          </div>
        `
        button.querySelector('strong')!.textContent = item.title
        button.querySelector('.itunes-row-art span')!.textContent = item.artLabel
        button.querySelector('.home-utility-muted')!.textContent = item.artist
        button.querySelector('.home-utility-row-meta span')!.textContent = owned ? 'Purchased' : item.price === 0 ? 'Get' : formatMoney(item.price)
        button.querySelector('.home-utility-row-meta small')!.textContent = item.badge
        button.addEventListener('click', () => {
          state.selectedId = item.id
          persist()
          render()
        })
        results.append(button)
      }
    }

    function renderHero(item: StoreItem) {
      artLabel.textContent = item.artLabel
      heroKicker.textContent = item.badge
      heroTitle.textContent = item.title
      heroArtist.textContent = item.artist
      right.style.setProperty('--itunes-accent', item.artGradient)
      left.style.setProperty('--itunes-accent', item.artGradient)
    }

    function renderDetail(item: StoreItem) {
      const owned = state.purchasedIds.includes(item.id)
      detailBadge.textContent = `${item.category === 'music' ? 'Music' : item.category === 'movies' ? 'Movie' : item.category === 'tv' ? 'TV' : 'Podcast'} • ${item.badge}`
      detailTitle.textContent = item.title
      detailPrice.textContent = owned ? 'Purchased' : item.price === 0 ? 'Get' : formatMoney(item.price)
      detailDescription.textContent = item.description
      detailMeta.replaceChildren()
      const rows: Array<[string, string]> = [
        ['Artist', item.artist],
        ['Year', String(item.year)],
        ['Length', item.length],
      ]
      for (const [label, value] of rows) {
        const dt = document.createElement('div')
        dt.textContent = label
        const dd = document.createElement('div')
        dd.textContent = value
        detailMeta.append(dt, dd)
      }
      buyButton.textContent = owned ? 'Purchased' : item.price === 0 ? 'Get' : `Buy ${formatMoney(item.price)}`
      buyButton.disabled = owned
      buyButton.setAttribute('aria-label', owned ? `${item.title} already purchased` : `Purchase ${item.title}`)
      ownedCount.textContent = `${state.purchasedIds.length} owned`
      highlightsList.replaceChildren()
      for (const highlight of item.highlights) {
        highlightsList.append(createPill(highlight, 'home-utility-pill home-utility-pill--strong'))
      }
    }

    function render() {
      const current = selectedItem()
      if (!visibleItems().some(item => item.id === state.selectedId)) {
        state.selectedId = current.id
        persist()
      }
      summaryValue.textContent = `${state.purchasedIds.length} items`
      summarySubtitle.textContent = state.query ? 'Filtered' : 'Browse and buy'
      searchInput.value = state.query
      renderCategories()
      renderResults()
      renderHero(current)
      renderDetail(current)
    }

    searchInput.addEventListener('input', () => {
      state.query = searchInput.value
      const first = visibleItems()[0]
      if (first) state.selectedId = first.id
      persist()
      render()
    })

    buyButton.addEventListener('click', () => {
      const current = selectedItem()
      if (!state.purchasedIds.includes(current.id)) {
        state.purchasedIds = [...state.purchasedIds, current.id]
        persist()
        render()
      }
    })

    render()
    return { left, right }
  },
}

export const homeUtilityApps: PhoneApp[] = [walletApp, findMyApp, homeApp, itunesStoreApp]
