import './wellness.css'

import type { PhoneApp } from './types'

type HealthCategory = 'All' | 'Movement' | 'Recovery' | 'Mind'

interface HealthMetric {
  id: string
  category: Exclude<HealthCategory, 'All'>
  label: string
  unit: string
  goal: number
  accent: string
  emoji: string
  description: string
  precision?: number
}

interface HealthLog {
  id: string
  metricId: string
  value: number
  note: string
  at: number
}

interface HealthState {
  selectedCategory: HealthCategory
  selectedMetricId: string
  logs: HealthLog[]
}

interface WorkoutType {
  id: string
  name: string
  subtitle: string
  emoji: string
  calorieRate: number
  tone: string
  description: string
}

interface WorkoutSummary {
  id: string
  workoutId: string
  name: string
  startedAt: number
  finishedAt: number
  durationMs: number
  calories: number
  effort: string
  distance: number
}

interface ActiveWorkout {
  id: string
  workoutId: string
  startedAt: number
}

interface FitnessState {
  selectedWorkoutId: string
  activeWorkout: ActiveWorkout | null
  dailyMove: number
  dailyExercise: number
  dailyStand: number
  history: WorkoutSummary[]
}

interface WatchDevice {
  id: string
  name: string
  model: string
  battery: number
  tone: string
  details: string
}

interface WatchFace {
  id: string
  name: string
  subtitle: string
  color: string
  complication: string
}

interface WatchState {
  pairedDeviceId: string | null
  selectedFaceId: string
  toggles: Record<string, boolean>
  lastSyncAt: number
}

const dayMs = 86_400_000

const healthMetrics: HealthMetric[] = [
  {
    id: 'steps',
    category: 'Movement',
    label: 'Steps',
    unit: 'steps',
    goal: 10_000,
    accent: '#ff9500',
    emoji: '⇡',
    description: 'Walks, errands, and all the little moves that keep the day going.',
  },
  {
    id: 'workoutMinutes',
    category: 'Movement',
    label: 'Workout minutes',
    unit: 'min',
    goal: 45,
    accent: '#ff3b30',
    emoji: '◌',
    description: 'Active minutes from training, classes, or a quick sweat.',
  },
  {
    id: 'sleep',
    category: 'Recovery',
    label: 'Sleep',
    unit: 'h',
    goal: 8,
    accent: '#8a8dff',
    emoji: '☾',
    description: 'A simple view of how rested you felt when you woke up.',
    precision: 1,
  },
  {
    id: 'hydration',
    category: 'Recovery',
    label: 'Hydration',
    unit: 'cups',
    goal: 8,
    accent: '#007aff',
    emoji: '◍',
    description: 'A steady stream of water through the day.',
  },
  {
    id: 'mindfulMinutes',
    category: 'Mind',
    label: 'Mindful minutes',
    unit: 'min',
    goal: 20,
    accent: '#32ade6',
    emoji: '✦',
    description: 'Breathing, journaling, and anything that slows the mind down.',
  },
  {
    id: 'standHours',
    category: 'Mind',
    label: 'Stand hours',
    unit: 'h',
    goal: 12,
    accent: '#ffbf55',
    emoji: '▣',
    description: 'A reminder to get up, stretch, and keep the body online.',
    precision: 1,
  },
]

const workoutTypes: WorkoutType[] = [
  {
    id: 'run',
    name: 'Run',
    subtitle: 'Tempo and intervals',
    emoji: '🏃',
    calorieRate: 11,
    tone: '#ff8a7a',
    description: 'A high-energy session with distance and pace baked in.',
  },
  {
    id: 'ride',
    name: 'Ride',
    subtitle: 'Road or studio',
    emoji: '🚴',
    calorieRate: 9,
    tone: '#67d5ff',
    description: 'Smooth cardio with a steady climb in effort.',
  },
  {
    id: 'hiit',
    name: 'HIIT',
    subtitle: 'Intervals and bursts',
    emoji: '⚡',
    calorieRate: 13,
    tone: '#ffbf55',
    description: 'Short, intense work with a strong finish.',
  },
  {
    id: 'walk',
    name: 'Walk',
    subtitle: 'Easy recovery',
    emoji: '🚶',
    calorieRate: 5,
    tone: '#8be2a5',
    description: 'A lighter session to keep the streak alive.',
  },
]

const watchDevices: WatchDevice[] = [
  {
    id: 'iphone-15-pro',
    name: 'Wes’s iPhone',
    model: 'iPhone 15 Pro',
    battery: 82,
    tone: '#62d6ff',
    details: 'Primary paired device for notifications, syncs, and health data.',
  },
  {
    id: 'iphone-16',
    name: 'Work iPhone',
    model: 'iPhone 16',
    battery: 58,
    tone: '#ff9f6d',
    details: 'A second pairing option for travel or a shared setup.',
  },
  {
    id: 'ipad',
    name: 'iPad Studio',
    model: 'iPad Pro',
    battery: 91,
    tone: '#9f8dff',
    details: 'A loose local pairing for demoing the watch face layout.',
  },
]

const watchFaces: WatchFace[] = [
  {
    id: 'wayfinder',
    name: 'Wayfinder',
    subtitle: 'Bold numerals with one strong complication.',
    color: '#67d5ff',
    complication: 'Weather + calendar',
  },
  {
    id: 'modular',
    name: 'Modular',
    subtitle: 'Dense, practical, and easy to scan.',
    color: '#8be2a5',
    complication: 'Heart rate + rings',
  },
  {
    id: 'solar',
    name: 'Solar',
    subtitle: 'Gradient time with a quiet motion feel.',
    color: '#ffbf55',
    complication: 'Sunrise + sunset',
  },
  {
    id: 'portrait',
    name: 'Portrait',
    subtitle: 'Soft depth with a favorite photo look.',
    color: '#ff8a7a',
    complication: 'Photos + reminders',
  },
]

function safeParse<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    return JSON.parse(saved) as T
  } catch {
    return fallback
  }
}

function saveState<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures in private browsing or full quotas.
  }
}

function startOfDay(timestamp = Date.now()) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function sameDay(a: number, b: number) {
  return startOfDay(a) === startOfDay(b)
}

function formatShortTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatShortDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatRelative(timestamp: number) {
  const delta = Date.now() - timestamp
  if (delta < 60_000) return 'Just now'
  if (delta < 3_600_000) return `${Math.max(1, Math.round(delta / 60_000))} min ago`
  if (delta < dayMs) return `${Math.max(1, Math.round(delta / 3_600_000))} hr ago`
  return formatShortDate(timestamp)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatMetricValue(metric: HealthMetric, value: number) {
  const formatted = metric.precision === 1
    ? value.toFixed(1).replace(/\.0$/, '')
    : String(Math.round(value))
  return `${formatted} ${metric.unit}`
}

function daysAgo(days: number) {
  return Date.now() - days * dayMs
}

function createHealthStarterState(): HealthState {
  return {
    selectedCategory: 'All',
    selectedMetricId: 'steps',
    logs: [
      { id: crypto.randomUUID(), metricId: 'steps', value: 8_420, note: 'Morning walk before coffee.', at: daysAgo(0) - 5_800_000 },
      { id: crypto.randomUUID(), metricId: 'workoutMinutes', value: 34, note: 'Upper-body circuit and a finisher.', at: daysAgo(0) - 3_900_000 },
      { id: crypto.randomUUID(), metricId: 'sleep', value: 7.8, note: 'Solid sleep after an early night.', at: daysAgo(1) - 3_600_000 },
      { id: crypto.randomUUID(), metricId: 'hydration', value: 6, note: 'Kept the bottle nearby.', at: daysAgo(1) - 1_900_000 },
      { id: crypto.randomUUID(), metricId: 'mindfulMinutes', value: 14, note: 'Breathing break between meetings.', at: daysAgo(2) - 900_000 },
      { id: crypto.randomUUID(), metricId: 'standHours', value: 10, note: 'A full stretch of standing breaks.', at: daysAgo(2) - 400_000 },
    ],
  }
}

function normalizeHealthState(value: unknown): HealthState {
  const fallback = createHealthStarterState()
  if (typeof value !== 'object' || value === null) return fallback
  const candidate = value as Partial<HealthState> & { logs?: unknown }
  const logs = Array.isArray(candidate.logs)
    ? candidate.logs.flatMap((entry): HealthLog[] => {
      if (typeof entry !== 'object' || entry === null) return []
      const log = entry as Partial<HealthLog>
      if (
        typeof log.id !== 'string'
        || typeof log.metricId !== 'string'
        || typeof log.value !== 'number'
        || typeof log.note !== 'string'
        || typeof log.at !== 'number'
      ) return []
      return [{ id: log.id, metricId: log.metricId, value: log.value, note: log.note, at: log.at }]
    })
    : fallback.logs

  const selectedCategory = candidate.selectedCategory === 'All'
    || candidate.selectedCategory === 'Movement'
    || candidate.selectedCategory === 'Recovery'
    || candidate.selectedCategory === 'Mind'
    ? candidate.selectedCategory
    : fallback.selectedCategory

  const selectedMetricId = typeof candidate.selectedMetricId === 'string' && healthMetrics.some(metric => metric.id === candidate.selectedMetricId)
    ? candidate.selectedMetricId
    : fallback.selectedMetricId

  return { selectedCategory, selectedMetricId, logs }
}

function createFitnessStarterState(): FitnessState {
  return {
    selectedWorkoutId: 'run',
    activeWorkout: null,
    dailyMove: 482,
    dailyExercise: 16,
    dailyStand: 8,
    history: [
      {
        id: crypto.randomUUID(),
        workoutId: 'ride',
        name: 'Ride',
        startedAt: daysAgo(1) - 6_600_000,
        finishedAt: daysAgo(1) - 6_600_000 + 32 * 60_000,
        durationMs: 32 * 60_000,
        calories: 287,
        effort: 'Steady',
        distance: 12.8,
      },
      {
        id: crypto.randomUUID(),
        workoutId: 'walk',
        name: 'Walk',
        startedAt: daysAgo(2) - 4_200_000,
        finishedAt: daysAgo(2) - 4_200_000 + 26 * 60_000,
        durationMs: 26 * 60_000,
        calories: 143,
        effort: 'Easy',
        distance: 2.1,
      },
    ],
  }
}

function normalizeFitnessState(value: unknown): FitnessState {
  const fallback = createFitnessStarterState()
  if (typeof value !== 'object' || value === null) return fallback
  const candidate = value as Partial<FitnessState> & { history?: unknown }

  const selectedWorkoutId = typeof candidate.selectedWorkoutId === 'string' && workoutTypes.some(workout => workout.id === candidate.selectedWorkoutId)
    ? candidate.selectedWorkoutId
    : fallback.selectedWorkoutId

  const activeWorkout = candidate.activeWorkout && typeof candidate.activeWorkout === 'object'
    ? (() => {
      const workout = candidate.activeWorkout as Partial<ActiveWorkout>
      if (
        typeof workout.id !== 'string'
        || typeof workout.workoutId !== 'string'
        || typeof workout.startedAt !== 'number'
      ) return null
      return { id: workout.id, workoutId: workout.workoutId, startedAt: workout.startedAt }
    })()
    : null

  const history = Array.isArray(candidate.history)
    ? candidate.history.flatMap((entry): WorkoutSummary[] => {
      if (typeof entry !== 'object' || entry === null) return []
      const summary = entry as Partial<WorkoutSummary>
      if (
        typeof summary.id !== 'string'
        || typeof summary.workoutId !== 'string'
        || typeof summary.name !== 'string'
        || typeof summary.startedAt !== 'number'
        || typeof summary.finishedAt !== 'number'
        || typeof summary.durationMs !== 'number'
        || typeof summary.calories !== 'number'
        || typeof summary.effort !== 'string'
        || typeof summary.distance !== 'number'
      ) return []
      return [{
        id: summary.id,
        workoutId: summary.workoutId,
        name: summary.name,
        startedAt: summary.startedAt,
        finishedAt: summary.finishedAt,
        durationMs: summary.durationMs,
        calories: summary.calories,
        effort: summary.effort,
        distance: summary.distance,
      }]
    })
    : fallback.history

  return {
    selectedWorkoutId,
    activeWorkout,
    dailyMove: typeof candidate.dailyMove === 'number' ? candidate.dailyMove : fallback.dailyMove,
    dailyExercise: typeof candidate.dailyExercise === 'number' ? candidate.dailyExercise : fallback.dailyExercise,
    dailyStand: typeof candidate.dailyStand === 'number' ? candidate.dailyStand : fallback.dailyStand,
    history,
  }
}

function createWatchStarterState(): WatchState {
  return {
    pairedDeviceId: 'iphone-15-pro',
    selectedFaceId: 'wayfinder',
    toggles: {
      notifications: true,
      haptics: true,
      wristDetection: true,
      alwaysOn: false,
      sleepFocus: false,
      mirrorPhone: true,
    },
    lastSyncAt: Date.now() - 22 * 60_000,
  }
}

function normalizeWatchState(value: unknown): WatchState {
  const fallback = createWatchStarterState()
  if (typeof value !== 'object' || value === null) return fallback
  const candidate = value as Partial<WatchState> & { toggles?: unknown }

  const pairedDeviceId = candidate.pairedDeviceId === null
    ? null
    : typeof candidate.pairedDeviceId === 'string' && watchDevices.some(device => device.id === candidate.pairedDeviceId)
    ? candidate.pairedDeviceId
    : fallback.pairedDeviceId

  const selectedFaceId = typeof candidate.selectedFaceId === 'string' && watchFaces.some(face => face.id === candidate.selectedFaceId)
    ? candidate.selectedFaceId
    : fallback.selectedFaceId

  const toggles: Record<string, boolean> = { ...fallback.toggles }
  if (candidate.toggles && typeof candidate.toggles === 'object') {
    for (const [key, value2] of Object.entries(candidate.toggles as Record<string, unknown>)) {
      if (typeof value2 === 'boolean') toggles[key] = value2
    }
  }

  return {
    pairedDeviceId,
    selectedFaceId,
    toggles,
    lastSyncAt: typeof candidate.lastSyncAt === 'number' ? candidate.lastSyncAt : fallback.lastSyncAt,
  }
}

function createHealthChart(metric: HealthMetric, logs: HealthLog[]) {
  const chart = document.createElement('div')
  chart.className = 'health-chart'
  chart.style.setProperty('--metric-color', metric.accent)
  const dailyValues = Array.from({ length: 7 }, (_, index) => {
    const at = startOfDay() - (6 - index) * dayMs
    const dayLogs = logs.filter(log => sameDay(log.at, at))
    return { at, value: dayLogs.length ? dayLogs.reduce((sum, log) => sum + log.value, 0) / dayLogs.length : null }
  })
  const max = Math.max(metric.goal, ...dailyValues.map(day => day.value ?? 0), 1)
  chart.setAttribute('role', 'img')
  chart.setAttribute('aria-label', `Daily average ${metric.label}, past seven days. ${dailyValues.map(day => `${formatShortDate(day.at)}: ${day.value === null ? 'no data' : formatMetricValue(metric, day.value)}`).join('; ')}`)
  for (const day of dailyValues) {
    const column = document.createElement('div')
    column.className = 'health-chart-day'
    column.setAttribute('aria-hidden', 'true')
    const bar = document.createElement('i')
    bar.style.height = `${((day.value ?? 0) / max) * 100}%`
    const label = document.createElement('span')
    label.textContent = new Date(day.at).toLocaleDateString([], { weekday: 'narrow' })
    column.append(bar, label)
    chart.append(column)
  }
  return chart
}

export const wellnessApps: PhoneApp[] = [
  {
    id: 'health',
    name: 'Health',
    icon: '♥',
    color: '#ff2d55',
    create() {
      const state = normalizeHealthState(safeParse('duo-health-state', createHealthStarterState()))
      const left = document.createElement('section')
      left.className = 'wellness-panel health-panel'
      left.innerHTML = `
        <article class="wellness-card health-hero">
          <h2>Summary <span class="health-profile" aria-label="Health profile">♥</span></h2>
          <p class="wellness-demo">Sample health data · Saved on this device</p>
          <div class="health-category-strip" aria-label="Health categories"></div>
        </article>
        <h3 class="wellness-section-title">Pinned</h3>
        <article class="wellness-card health-metrics" aria-label="Metric list"></article>
      `

      const right = document.createElement('section')
      right.className = 'wellness-panel health-panel'
      right.innerHTML = `
        <article class="wellness-card health-summary">
          <div class="health-summary-head">
            <div>
              <div class="wellness-kicker">Past 7 days</div>
              <h3></h3>
            </div>
            <div class="health-summary-badge"></div>
          </div>
          <div class="health-summary-body"></div>
          <div class="health-summary-foot">
            <div class="health-stat">
              <span>Latest</span>
              <strong></strong>
            </div>
            <div class="health-stat">
              <span>7-day avg</span>
              <strong></strong>
            </div>
            <div class="health-stat">
              <span>Updated</span>
              <strong></strong>
            </div>
          </div>
        </article>
        <article class="wellness-card health-log">
          <div class="wellness-card-head">
            <div>
              <h3>Add Data</h3>
            </div>
            <button class="health-fill-goal" type="button">Use goal</button>
          </div>
          <form class="health-form" novalidate>
            <label class="wellness-field">
              <span>Value</span>
              <input class="health-value" type="number" min="0" step="1" required>
            </label>
            <label class="wellness-field">
              <span>Note</span>
              <textarea class="health-note" rows="3" placeholder="Add context, location, or how it felt..."></textarea>
            </label>
            <button class="wellness-action health-save" type="submit">Save reading</button>
          </form>
        </article>
        <article class="wellness-card health-history">
          <div class="wellness-card-head">
            <div>
              <h3>All Recorded Data</h3>
            </div>
            <span class="health-history-count"></span>
          </div>
          <div class="health-history-list" role="list"></div>
        </article>
      `

      const categoryStrip = left.querySelector<HTMLElement>('.health-category-strip')!
      const metricList = left.querySelector<HTMLElement>('.health-metrics')!
      const summaryTitle = right.querySelector<HTMLElement>('.health-summary h3')!
      const summaryBadge = right.querySelector<HTMLElement>('.health-summary-badge')!
      const summaryBody = right.querySelector<HTMLElement>('.health-summary-body')!
      const latestValue = right.querySelector<HTMLElement>('.health-summary-foot .health-stat:nth-child(1) strong')!
      const averageValue = right.querySelector<HTMLElement>('.health-summary-foot .health-stat:nth-child(2) strong')!
      const updatedValue = right.querySelector<HTMLElement>('.health-summary-foot .health-stat:nth-child(3) strong')!
      const historyCount = right.querySelector<HTMLElement>('.health-history-count')!
      const historyList = right.querySelector<HTMLElement>('.health-history-list')!
      const form = right.querySelector<HTMLFormElement>('.health-form')!
      const valueInput = right.querySelector<HTMLInputElement>('.health-value')!
      const noteInput = right.querySelector<HTMLTextAreaElement>('.health-note')!
      const fillGoal = right.querySelector<HTMLButtonElement>('.health-fill-goal')!

      let draftValue = ''
      let draftNote = ''

      function selectedCategory() {
        return state.selectedCategory === 'All'
          ? healthMetrics
          : healthMetrics.filter(metric => metric.category === state.selectedCategory)
      }

      function selectedMetric() {
        return healthMetrics.find(metric => metric.id === state.selectedMetricId) ?? healthMetrics[0]
      }

      function metricLogs(metricId: string) {
        return state.logs
          .filter(log => log.metricId === metricId)
          .sort((a, b) => b.at - a.at)
      }

      function latestFor(metricId: string) {
        return metricLogs(metricId)[0] ?? null
      }

      function averageFor(metricId: string) {
        const logs = metricLogs(metricId).filter(log => Date.now() - log.at < 7 * dayMs)
        if (!logs.length) return null
        return logs.reduce((sum, log) => sum + log.value, 0) / logs.length
      }

      function setActiveMetric(metricId: string) {
        state.selectedMetricId = metricId
        const metric = selectedMetric()
        draftValue = String(latestFor(metricId)?.value ?? metric.goal)
        draftNote = ''
        saveState('duo-health-state', state)
        render()
        valueInput.focus({ preventScroll: true })
      }

      function renderCategories() {
        categoryStrip.replaceChildren()
        const categories: HealthCategory[] = ['All', 'Movement', 'Recovery', 'Mind']
        for (const category of categories) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'health-chip'
          button.textContent = category
          button.setAttribute('aria-pressed', String(state.selectedCategory === category))
          button.addEventListener('click', () => {
            state.selectedCategory = category
            const options = category === 'All' ? healthMetrics : healthMetrics.filter(metric => metric.category === category)
            if (!options.some(metric => metric.id === state.selectedMetricId)) {
              state.selectedMetricId = options[0]?.id ?? healthMetrics[0].id
              draftValue = String(latestFor(state.selectedMetricId)?.value ?? selectedMetric().goal)
            }
            saveState('duo-health-state', state)
            render()
          })
          categoryStrip.append(button)
        }
      }

      function renderMetrics() {
        metricList.replaceChildren()
        const metrics = selectedCategory()
        const currentMetric = selectedMetric()
        for (const metric of metrics) {
          const latest = latestFor(metric.id)
          const value = latest?.value ?? 0
          const progress = clamp((latest?.value ?? 0) / metric.goal, 0, 1)
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'health-metric'
          button.style.setProperty('--metric-color', metric.accent)
          button.setAttribute('aria-pressed', String(metric.id === currentMetric.id))
          button.innerHTML = `
            <span class="health-metric-emoji" aria-hidden="true"></span>
            <span class="health-metric-copy">
              <strong></strong>
              <span></span>
            </span>
            <span class="health-metric-value"></span>
            <span class="health-metric-chevron" aria-hidden="true">›</span>
            <span class="health-metric-bar" aria-hidden="true"><i></i></span>
          `
          button.querySelector('.health-metric-emoji')!.textContent = metric.emoji
          button.querySelector('strong')!.textContent = metric.label
          button.querySelector('.health-metric-copy span')!.textContent = latest ? `${formatRelative(latest.at)} · goal ${formatMetricValue(metric, metric.goal)}` : `Goal ${formatMetricValue(metric, metric.goal)}`
          button.querySelector('.health-metric-value')!.textContent = latest ? formatMetricValue(metric, value) : 'No logs yet'
          button.querySelector<HTMLElement>('.health-metric-bar i')!.style.width = `${Math.round(progress * 100)}%`
          button.querySelector<HTMLElement>('.health-metric-bar i')!.style.background = metric.accent
          button.addEventListener('click', () => setActiveMetric(metric.id))
          metricList.append(button)
        }
      }

      function renderSummary() {
        const metric = selectedMetric()
        const latest = latestFor(metric.id)
        const average = averageFor(metric.id)
        summaryTitle.textContent = metric.label
        summaryBadge.textContent = metric.category
        summaryBody.replaceChildren(createHealthChart(metric, metricLogs(metric.id)))

        latestValue.textContent = latest ? formatMetricValue(metric, latest.value) : '—'
        averageValue.textContent = average ? formatMetricValue(metric, average) : '—'
        updatedValue.textContent = latest ? formatShortTime(latest.at) : 'Never'

        historyCount.textContent = `${metricLogs(metric.id).length} entries`

        valueInput.min = '0'
        valueInput.step = metric.precision === 1 ? '0.1' : '1'
        valueInput.placeholder = metric.unit
        valueInput.value = draftValue
        noteInput.value = draftNote
        fillGoal.textContent = `Use ${formatMetricValue(metric, metric.goal)}`

        historyList.replaceChildren()
        for (const log of metricLogs(metric.id).slice(0, 6)) {
          const item = document.createElement('article')
          item.className = 'health-history-item'
          item.setAttribute('role', 'listitem')
          item.innerHTML = `
            <div>
              <strong></strong>
              <span></span>
            </div>
            <time></time>
          `
          item.querySelector('strong')!.textContent = formatMetricValue(metric, log.value)
          item.querySelector('span')!.textContent = log.note || 'No note added'
          item.querySelector('time')!.textContent = sameDay(log.at, Date.now())
            ? formatShortTime(log.at)
            : formatShortDate(log.at)
          historyList.append(item)
        }
      }

      function render() {
        renderCategories()
        renderMetrics()
        renderSummary()
      }

      fillGoal.addEventListener('click', () => {
        draftValue = String(selectedMetric().goal)
        valueInput.value = draftValue
        valueInput.focus({ preventScroll: true })
      })

      valueInput.addEventListener('input', () => {
        draftValue = valueInput.value
      })

      noteInput.addEventListener('input', () => {
        draftNote = noteInput.value
      })

      form.addEventListener('submit', event => {
        event.preventDefault()
        const metric = selectedMetric()
        const numericValue = Number.parseFloat(valueInput.value)
        if (!Number.isFinite(numericValue)) return
        state.logs.unshift({
          id: crypto.randomUUID(),
          metricId: metric.id,
          value: numericValue,
          note: noteInput.value.trim(),
          at: Date.now(),
        })
        draftValue = String(latestFor(metric.id)?.value ?? metric.goal)
        draftNote = ''
        saveState('duo-health-state', state)
        render()
      })

      if (!healthMetrics.some(metric => metric.id === state.selectedMetricId)) {
        state.selectedMetricId = healthMetrics[0].id
      }
      if (state.selectedCategory !== 'All' && !healthMetrics.some(metric => metric.category === state.selectedCategory)) {
        state.selectedCategory = 'Movement'
      }

      draftValue = String(latestFor(state.selectedMetricId)?.value ?? selectedMetric().goal)
      render()

      return { left, right }
    },
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: '◔',
    color: '#ff8a7a',
    create() {
      const state = normalizeFitnessState(safeParse('duo-fitness-state', createFitnessStarterState()))
      const left = document.createElement('section')
      left.className = 'wellness-panel fitness-panel'
      left.innerHTML = `
        <article class="wellness-card fitness-ringboard">
          <div class="fitness-head">
            <div>
              <div class="wellness-kicker">${new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
              <h2>Summary</h2>
            </div>
            <span class="fitness-streak"></span>
          </div>
          <p class="wellness-demo">Sample activity · Workouts are simulated</p>
          <h3 class="wellness-section-title">Activity Rings</h3>
          <div class="fitness-rings" aria-label="Daily rings"></div>
          <div class="fitness-stats"></div>
        </article>
        <article class="wellness-card fitness-history">
          <div class="wellness-card-head">
            <div>
              <h3>Sessions</h3>
            </div>
            <span class="fitness-history-count"></span>
          </div>
          <div class="fitness-history-list" role="list"></div>
        </article>
      `

      const right = document.createElement('section')
      right.className = 'wellness-panel fitness-panel'
      right.innerHTML = `
        <article class="wellness-card fitness-studio">
          <div class="wellness-card-head">
            <div>
              <div class="wellness-kicker">Workout</div>
              <h3></h3>
            </div>
            <span class="fitness-status"></span>
          </div>
          <p class="fitness-description"></p>
          <div class="fitness-types" role="group" aria-label="Workout type"></div>
          <div class="fitness-session">
            <div class="fitness-session-clock">00:00</div>
            <div class="fitness-session-label"></div>
            <div class="fitness-session-meta"></div>
            <div class="fitness-session-actions">
              <button class="wellness-action fitness-primary" type="button"></button>
              <button class="fitness-secondary" type="button"></button>
            </div>
          </div>
        </article>
        <article class="wellness-card fitness-summary">
          <div class="wellness-card-head">
            <div>
              <h3>Last Workout</h3>
            </div>
          </div>
          <div class="fitness-summary-grid"></div>
        </article>
      `

      const streak = left.querySelector<HTMLElement>('.fitness-streak')!
      const rings = left.querySelector<HTMLElement>('.fitness-rings')!
      const stats = left.querySelector<HTMLElement>('.fitness-stats')!
      const historyCount = left.querySelector<HTMLElement>('.fitness-history-count')!
      const historyList = left.querySelector<HTMLElement>('.fitness-history-list')!
      const studioTitle = right.querySelector<HTMLElement>('.fitness-studio h3')!
      const status = right.querySelector<HTMLElement>('.fitness-status')!
      const description = right.querySelector<HTMLElement>('.fitness-description')!
      const types = right.querySelector<HTMLElement>('.fitness-types')!
      const sessionClock = right.querySelector<HTMLElement>('.fitness-session-clock')!
      const sessionLabel = right.querySelector<HTMLElement>('.fitness-session-label')!
      const sessionMeta = right.querySelector<HTMLElement>('.fitness-session-meta')!
      const primary = right.querySelector<HTMLButtonElement>('.fitness-primary')!
      const secondary = right.querySelector<HTMLButtonElement>('.fitness-secondary')!
      const summaryGrid = right.querySelector<HTMLElement>('.fitness-summary-grid')!

      function selectedWorkout() {
        return workoutTypes.find(workout => workout.id === state.selectedWorkoutId) ?? workoutTypes[0]
      }

      function activeWorkoutType() {
        return state.activeWorkout
          ? workoutTypes.find(workout => workout.id === state.activeWorkout!.workoutId) ?? workoutTypes[0]
          : null
      }

      function elapsedMs() {
        return state.activeWorkout ? Date.now() - state.activeWorkout.startedAt : 0
      }

      function currentMove() {
        const liveWorkout = activeWorkoutType() ?? selectedWorkout()
        const live = state.activeWorkout
          ? Math.max(0, Math.round((elapsedMs() / 60_000) * liveWorkout.calorieRate * 0.6))
          : 0
        return state.dailyMove + live
      }

      function currentExercise() {
        const live = state.activeWorkout ? Math.max(0, Math.round(elapsedMs() / 60_000)) : 0
        return state.dailyExercise + live
      }

      function currentStand() {
        const live = state.activeWorkout ? Math.min(4, Math.max(0, Math.round(elapsedMs() / 30_000) / 4)) : 0
        return state.dailyStand + live
      }

      function durationText(ms: number) {
        const total = Math.max(0, Math.round(ms / 1_000))
        const minutes = Math.floor(total / 60)
        const seconds = total % 60
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }

      function renderRings() {
        const values = [
          { label: 'Move', value: currentMove(), goal: 600, tone: '#fa114f', detail: `${Math.round(currentMove())}/600 CAL` },
          { label: 'Exercise', value: currentExercise(), goal: 30, tone: '#a6ff00', detail: `${Math.round(currentExercise())}/30 MIN` },
          { label: 'Stand', value: currentStand(), goal: 12, tone: '#00e3de', detail: `${currentStand().toFixed(1).replace(/\.0$/, '')}/12 HR` },
        ]
        rings.replaceChildren()
        const graphic = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        graphic.setAttribute('viewBox', '0 0 220 220')
        graphic.setAttribute('class', 'fitness-activity-rings')
        graphic.setAttribute('aria-hidden', 'true')
        const legend = document.createElement('div')
        legend.className = 'fitness-ring-legend'
        for (const [index, ring] of values.entries()) {
          const progress = clamp(ring.value / ring.goal, 0, 1)
          const radius = 92 - index * 27
          const circumference = 2 * Math.PI * radius
          for (const track of [true, false]) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
            circle.setAttribute('cx', '110')
            circle.setAttribute('cy', '110')
            circle.setAttribute('r', String(radius))
            circle.setAttribute('fill', 'none')
            circle.setAttribute('stroke', ring.tone)
            circle.setAttribute('stroke-width', '23')
            if (track) circle.setAttribute('opacity', '.18')
            else {
              circle.setAttribute('stroke-linecap', 'round')
              circle.setAttribute('stroke-dasharray', `${progress * circumference} ${circumference}`)
              circle.setAttribute('transform', 'rotate(-90 110 110)')
              if (!progress) circle.setAttribute('opacity', '0')
            }
            graphic.append(circle)
          }
          const element = document.createElement('div')
          element.className = 'fitness-ring'
          element.style.setProperty('--tone', ring.tone)
          element.innerHTML = `
            <div class="fitness-ring-inner">
              <strong></strong>
              <span></span>
            </div>
          `
          element.querySelector('strong')!.textContent = ring.label
          element.querySelector('span')!.textContent = ring.detail
          legend.append(element)
        }
        rings.append(graphic, legend)
      }

      function renderStats() {
        const weeklyMinutes = state.history.reduce((sum, workout) => {
          return Date.now() - workout.finishedAt < 7 * dayMs ? sum + Math.round(workout.durationMs / 60_000) : sum
        }, 0)
        const workoutCount = state.history.filter(workout => Date.now() - workout.finishedAt < 7 * dayMs).length
        const streakDays = new Set(
          state.history
            .filter(workout => Date.now() - workout.finishedAt < 10 * dayMs)
            .map(workout => startOfDay(workout.finishedAt))
        ).size

        streak.textContent = `${streakDays} day streak`
        stats.replaceChildren()
        const items: Array<[string, string]> = [
          ['Week minutes', String(weeklyMinutes)],
          ['Workouts', String(workoutCount)],
          ['Calories', String(Math.round(state.history.reduce((sum, workout) => sum + workout.calories, 0)))],
        ]
        for (const [label, value] of items) {
          const item = document.createElement('div')
          item.className = 'fitness-stat'
          item.innerHTML = `
            <span></span>
            <strong></strong>
          `
          item.querySelector('span')!.textContent = label
          item.querySelector('strong')!.textContent = value
          stats.append(item)
        }
      }

      function renderHistory() {
        const history = state.history.slice(0, 5)
        historyCount.textContent = `${history.length} recent`
        historyList.replaceChildren()
        for (const workout of history) {
          const item = document.createElement('article')
          item.className = 'fitness-history-item'
          item.setAttribute('role', 'listitem')
          item.innerHTML = `
            <div class="fitness-history-icon" aria-hidden="true"></div>
            <div class="fitness-history-copy">
              <strong></strong>
              <span></span>
            </div>
            <div class="fitness-history-meta"></div>
          `
          const workoutType = workoutTypes.find(entry => entry.id === workout.workoutId) ?? workoutTypes[0]
          item.querySelector('.fitness-history-icon')!.textContent = workoutType.emoji
          item.querySelector('strong')!.textContent = `${workout.name} · ${formatShortDate(workout.finishedAt)}`
          item.querySelector('span')!.textContent = `${durationText(workout.durationMs)} · ${workout.calories} cal · ${workout.effort}`
          item.querySelector('.fitness-history-meta')!.textContent = `${workout.distance.toFixed(1)} mi`
          historyList.append(item)
        }
      }

      function renderSummary() {
        const latest = state.history[0]
        summaryGrid.replaceChildren()
        if (!latest) {
          const empty = document.createElement('p')
          empty.className = 'fitness-empty'
          empty.textContent = 'Complete a workout and the summary will land here.'
          summaryGrid.append(empty)
          return
        }
        const summaryItems: Array<[string, string]> = [
          ['Time', `${durationText(latest.durationMs)} · ${formatShortTime(latest.finishedAt)}`],
          ['Calories', `${latest.calories}`],
          ['Distance', `${latest.distance.toFixed(1)} mi`],
          ['Effort', latest.effort],
        ]
        for (const [label, value] of summaryItems) {
          const item = document.createElement('div')
          item.className = 'fitness-summary-item'
          item.innerHTML = `
            <span></span>
            <strong></strong>
          `
          item.querySelector('span')!.textContent = label
          item.querySelector('strong')!.textContent = value
          summaryGrid.append(item)
        }
      }

      function updateStudio() {
        const workout = selectedWorkout()
        studioTitle.textContent = workout.name
        description.textContent = workout.description
        status.textContent = state.activeWorkout ? 'In Progress' : 'Ready'
        sessionLabel.textContent = state.activeWorkout
          ? `Tracking ${activeWorkoutType()?.name ?? workout.name}`
          : `Set up ${workout.name.toLowerCase()} and start when you're ready.`
        sessionClock.textContent = state.activeWorkout ? durationText(elapsedMs()) : '00:00'
        sessionMeta.textContent = state.activeWorkout
          ? `${Math.round(currentMove())} cal · ${Math.round(currentExercise())} min`
          : `${workout.calorieRate} cal/min · ${workout.subtitle}`
        primary.textContent = state.activeWorkout ? 'Finish workout' : 'Start workout'
        secondary.hidden = !state.activeWorkout
        secondary.textContent = 'Switch workout'
      }

      function renderWorkoutTypes() {
        types.replaceChildren()
        for (const workout of workoutTypes) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'fitness-type'
          button.setAttribute('aria-pressed', String(workout.id === state.selectedWorkoutId))
          button.innerHTML = `
            <span class="fitness-type-emoji" aria-hidden="true"></span>
            <span class="fitness-type-copy">
              <strong></strong>
              <span></span>
            </span>
          `
          button.querySelector('.fitness-type-emoji')!.textContent = workout.emoji
          button.querySelector('strong')!.textContent = workout.name
          button.querySelector('span span')!.textContent = workout.subtitle
          button.addEventListener('click', () => {
            state.selectedWorkoutId = workout.id
            saveState('duo-fitness-state', state)
            render()
          })
          types.append(button)
        }
      }

      function startWorkout() {
        state.activeWorkout = {
          id: crypto.randomUUID(),
          workoutId: state.selectedWorkoutId,
          startedAt: Date.now(),
        }
        saveState('duo-fitness-state', state)
        render()
      }

      function finishWorkout() {
        if (!state.activeWorkout) return
        const workout = workoutTypes.find(entry => entry.id === state.activeWorkout!.workoutId) ?? workoutTypes[0]
        const durationMs = Math.max(8 * 60_000, Date.now() - state.activeWorkout.startedAt)
        const minutes = Math.max(8, Math.round(durationMs / 60_000))
        const calories = Math.max(60, Math.round(minutes * workout.calorieRate))
        const distance = workout.id === 'run'
          ? +(minutes * 0.11).toFixed(1)
          : workout.id === 'ride'
            ? +(minutes * 0.35).toFixed(1)
            : workout.id === 'walk'
              ? +(minutes * 0.08).toFixed(1)
              : +(minutes * 0.05).toFixed(1)
        const effort = minutes < 20 ? 'Light' : minutes < 35 ? 'Steady' : 'Strong'

        state.history.unshift({
          id: crypto.randomUUID(),
          workoutId: workout.id,
          name: workout.name,
          startedAt: state.activeWorkout.startedAt,
          finishedAt: Date.now(),
          durationMs,
          calories,
          effort,
          distance,
        })
        state.dailyMove += calories
        state.dailyExercise += minutes
        state.dailyStand += clamp(minutes / 15, 1, 4)
        state.activeWorkout = null
        saveState('duo-fitness-state', state)
        render()
      }

      function render() {
        if (!state.history.length) state.history = createFitnessStarterState().history
        renderRings()
        renderStats()
        renderHistory()
        renderSummary()
        renderWorkoutTypes()
        updateStudio()
      }

      primary.addEventListener('click', () => {
        if (state.activeWorkout) finishWorkout()
        else startWorkout()
      })

      secondary.addEventListener('click', () => {
        state.selectedWorkoutId = workoutTypes[(workoutTypes.findIndex(workout => workout.id === state.selectedWorkoutId) + 1) % workoutTypes.length].id
        saveState('duo-fitness-state', state)
        render()
      })

      window.setInterval(() => {
        if (!state.activeWorkout) return
        sessionClock.textContent = durationText(elapsedMs())
        sessionMeta.textContent = `${Math.round(currentMove())} cal · ${Math.round(currentExercise())} min`
        renderRings()
      }, 1000)

      render()

      return {
        left,
        right,
      }
    },
  },
  {
    id: 'watch',
    name: 'Watch',
    icon: '◉',
    color: '#67d5ff',
    create() {
      const state = normalizeWatchState(safeParse('duo-watch-state', createWatchStarterState()))
      const left = document.createElement('section')
      left.className = 'wellness-panel watch-panel'
      left.innerHTML = `
        <article class="wellness-card watch-device">
          <h2>My Watch</h2>
          <p class="wellness-demo">Demo pairing · No Apple Watch connected</p>
          <div class="watch-device-illustration" aria-hidden="true"><span>9:41</span></div>
          <div class="watch-device-copy"></div>
          <div class="watch-device-actions">
            <button class="wellness-action watch-sync" type="button">Sync now</button>
            <button class="watch-unpair" type="button">Unpair</button>
          </div>
        </article>
        <article class="wellness-card watch-device-list">
          <div class="wellness-card-head">
            <div>
              <h3>Demo Devices</h3>
            </div>
          </div>
          <div class="watch-devices" role="radiogroup" aria-label="Paired devices"></div>
        </article>
      `

      const right = document.createElement('section')
      right.className = 'wellness-panel watch-panel'
      right.innerHTML = `
        <article class="wellness-card watch-face">
          <div class="wellness-card-head">
            <div>
              <h3>My Faces</h3>
            </div>
            <span class="watch-face-name"></span>
          </div>
          <div class="watch-face-preview">
            <div class="watch-face-time">9:41</div>
            <div class="watch-face-glance"></div>
          </div>
          <div class="watch-faces" role="group" aria-label="Watch faces"></div>
        </article>
        <article class="wellness-card watch-settings">
          <div class="wellness-card-head">
            <div>
              <h3>Settings</h3>
            </div>
            <span class="watch-sync-state"></span>
          </div>
          <div class="watch-toggle-list"></div>
        </article>
      `

      const deviceCopy = left.querySelector<HTMLElement>('.watch-device-copy')!
      const sync = left.querySelector<HTMLButtonElement>('.watch-sync')!
      const unpair = left.querySelector<HTMLButtonElement>('.watch-unpair')!
      const deviceList = left.querySelector<HTMLElement>('.watch-devices')!
      const faceName = right.querySelector<HTMLElement>('.watch-face-name')!
      const facePreview = right.querySelector<HTMLElement>('.watch-face-preview')!
      const faceGlance = right.querySelector<HTMLElement>('.watch-face-glance')!
      const faces = right.querySelector<HTMLElement>('.watch-faces')!
      const toggleList = right.querySelector<HTMLElement>('.watch-toggle-list')!
      const syncState = right.querySelector<HTMLElement>('.watch-sync-state')!

      const toggleDefinitions = [
        { key: 'notifications', label: 'Notifications', detail: 'Mirror phone alerts to the wrist.' },
        { key: 'haptics', label: 'Haptic alerts', detail: 'Use taps for timers, alarms, and prompts.' },
        { key: 'wristDetection', label: 'Wrist detection', detail: 'Lock the watch when it is off-wrist.' },
        { key: 'alwaysOn', label: 'Always on', detail: 'Keep the display visible at a glance.' },
        { key: 'sleepFocus', label: 'Sleep focus', detail: 'Reduce interruptions after bedtime.' },
        { key: 'mirrorPhone', label: 'Mirror iPhone', detail: 'Keep app shortcuts aligned with the phone.' },
      ]

      function selectedDevice() {
        return watchDevices.find(device => device.id === state.pairedDeviceId) ?? null
      }

      function selectedFace() {
        return watchFaces.find(face => face.id === state.selectedFaceId) ?? watchFaces[0]
      }

      function renderDevices() {
        deviceList.replaceChildren()
        for (const device of watchDevices) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'watch-device-option'
          button.setAttribute('role', 'radio')
          button.setAttribute('aria-checked', String(device.id === state.pairedDeviceId))
          button.innerHTML = `
            <span class="watch-device-dot" aria-hidden="true"></span>
            <span class="watch-device-copy">
              <strong></strong>
              <span></span>
            </span>
            <small></small>
          `
          button.querySelector('strong')!.textContent = device.name
          button.querySelector('.watch-device-copy span')!.textContent = device.model
          button.querySelector('small')!.textContent = `${device.battery}% battery`
          button.style.setProperty('--device-tone', device.tone)
          button.addEventListener('click', () => {
            state.pairedDeviceId = device.id
            state.lastSyncAt = Date.now()
            saveState('duo-watch-state', state)
            render()
          })
          deviceList.append(button)
        }
      }

      function renderFaceGallery() {
        faces.replaceChildren()
        for (const face of watchFaces) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'watch-face-option'
          button.setAttribute('aria-pressed', String(face.id === state.selectedFaceId))
          button.innerHTML = `
            <span class="watch-face-swatch" aria-hidden="true"></span>
            <span class="watch-face-option-copy">
              <strong></strong>
              <span></span>
            </span>
          `
          button.querySelector('strong')!.textContent = face.name
          button.querySelector('.watch-face-option-copy span')!.textContent = face.subtitle
          button.querySelector<HTMLElement>('.watch-face-swatch')!.style.background = face.color
          button.addEventListener('click', () => {
            state.selectedFaceId = face.id
            state.lastSyncAt = Date.now()
            saveState('duo-watch-state', state)
            render()
          })
          faces.append(button)
        }
      }

      function renderToggles() {
        toggleList.replaceChildren()
        for (const toggle of toggleDefinitions) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'watch-toggle'
          button.setAttribute('aria-pressed', String(Boolean(state.toggles[toggle.key])))
          button.innerHTML = `
            <span class="watch-toggle-copy">
              <strong></strong>
              <span></span>
            </span>
            <span class="watch-toggle-state"></span>
          `
          button.querySelector('strong')!.textContent = toggle.label
          button.querySelector('span span')!.textContent = toggle.detail
          button.querySelector('.watch-toggle-state')!.textContent = state.toggles[toggle.key] ? 'On' : 'Off'
          button.addEventListener('click', () => {
            state.toggles[toggle.key] = !state.toggles[toggle.key]
            state.lastSyncAt = Date.now()
            saveState('duo-watch-state', state)
            render()
          })
          toggleList.append(button)
        }
      }

      function renderDevicePanel() {
        const device = selectedDevice()
        if (!device) {
          deviceCopy.textContent = 'No device paired yet.'
          syncState.textContent = 'Idle'
          unpair.disabled = true
        } else {
          deviceCopy.replaceChildren()
          const title = document.createElement('strong')
          title.textContent = device.name
          const detail = document.createElement('span')
          detail.textContent = `${device.model} · ${device.details}`
          const meta = document.createElement('span')
          meta.textContent = `${device.battery}% battery · last sync ${formatRelative(state.lastSyncAt)}`
          deviceCopy.append(title, detail, meta)
          syncState.textContent = `${formatRelative(state.lastSyncAt)} synced`
          unpair.disabled = false
        }

        faceName.textContent = selectedFace().name
        facePreview.style.setProperty('--face-color', selectedFace().color)
        faceGlance.textContent = selectedFace().complication
        sync.textContent = device ? 'Sync now' : 'Pair device'
      }

      function syncNow() {
        if (!state.pairedDeviceId) {
          state.pairedDeviceId = watchDevices[0].id
        }
        state.lastSyncAt = Date.now()
        saveState('duo-watch-state', state)
        render()
      }

      function render() {
        renderDevices()
        renderFaceGallery()
        renderToggles()
        renderDevicePanel()
      }

      sync.addEventListener('click', () => syncNow())
      unpair.addEventListener('click', () => {
        state.pairedDeviceId = null
        state.lastSyncAt = Date.now()
        saveState('duo-watch-state', state)
        render()
      })

      if (state.pairedDeviceId !== null && !watchDevices.some(device => device.id === state.pairedDeviceId)) {
        state.pairedDeviceId = watchDevices[0].id
      }
      if (!watchFaces.some(face => face.id === state.selectedFaceId)) {
        state.selectedFaceId = watchFaces[0].id
      }

      render()

      return { left, right }
    },
  },
]
