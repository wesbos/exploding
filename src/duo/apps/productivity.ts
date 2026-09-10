import type { PhoneApp } from './types'
import './productivity.css'

interface CalendarEvent {
  id: string
  date: string
  title: string
  time: string
  notes: string
  createdAt: number
}

interface ReminderItem {
  id: string
  text: string
  done: boolean
  createdAt: number
}

interface ReminderList {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  items: ReminderItem[]
}

interface WorldClock {
  id: string
  city: string
  timeZone: string
}

const calendarStorageKey = 'duo-productivity-calendar'
const remindersStorageKey = 'duo-productivity-reminders'
const clocksStorageKey = 'duo-productivity-clocks'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const worldClockOptions: Array<{ city: string; timeZone: string }> = [
  { city: 'New York', timeZone: 'America/New_York' },
  { city: 'Chicago', timeZone: 'America/Chicago' },
  { city: 'Los Angeles', timeZone: 'America/Los_Angeles' },
  { city: 'London', timeZone: 'Europe/London' },
  { city: 'Paris', timeZone: 'Europe/Paris' },
  { city: 'Dubai', timeZone: 'Asia/Dubai' },
  { city: 'Tokyo', timeZone: 'Asia/Tokyo' },
  { city: 'Sydney', timeZone: 'Australia/Sydney' },
]

function safeRead<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    return JSON.parse(saved) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function formatFullDate(value: string) {
  return parseDateInputValue(value).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTimeLabel(value: string) {
  if (!value) return 'All day'
  const [hours, minutes] = value.split(':').map(Number)
  return new Date(2000, 0, 1, hours ?? 0, minutes ?? 0).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function normalizeMonthCursor(date: Date) {
  return startOfMonth(new Date(date.getFullYear(), date.getMonth(), 1))
}

function compareDateTime(a: CalendarEvent, b: CalendarEvent) {
  const left = `${a.date}T${a.time || '99:99'}`
  const right = `${b.date}T${b.time || '99:99'}`
  return left.localeCompare(right) || a.createdAt - b.createdAt
}

function createDefaultCalendarEvents(): CalendarEvent[] {
  const today = toDateInputValue()
  const tomorrow = toDateInputValue(new Date(Date.now() + 86_400_000))
  return [
    {
      id: crypto.randomUUID(),
      date: today,
      title: 'Team check-in',
      time: '09:30',
      notes: 'Sketch the day and confirm the handoff.',
      createdAt: Date.now() - 100_000,
    },
    {
      id: crypto.randomUUID(),
      date: tomorrow,
      title: 'Dinner reservation',
      time: '19:00',
      notes: 'Leave a little extra time for traffic.',
      createdAt: Date.now() - 50_000,
    },
  ]
}

function readCalendarEvents() {
  const fallback = createDefaultCalendarEvents()
  const value = safeRead<unknown>(calendarStorageKey, fallback)
  if (!Array.isArray(value)) return fallback
  return value.filter((event): event is CalendarEvent => (
    typeof event === 'object'
    && event !== null
    && typeof event.id === 'string'
    && typeof event.date === 'string'
    && typeof event.title === 'string'
    && typeof event.time === 'string'
    && typeof event.notes === 'string'
    && typeof event.createdAt === 'number'
  ))
}

function createDefaultReminderLists(): ReminderList[] {
  const now = Date.now()
  return [
    {
      id: crypto.randomUUID(),
      name: 'Inbox',
      createdAt: now,
      updatedAt: now,
      items: [
        { id: crypto.randomUUID(), text: 'Buy sparkling water', done: false, createdAt: now - 60_000 },
        { id: crypto.randomUUID(), text: 'Water the plants', done: true, createdAt: now - 30_000 },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Errands',
      createdAt: now - 86_400_000,
      updatedAt: now - 10_000,
      items: [
        { id: crypto.randomUUID(), text: 'Mail the package', done: false, createdAt: now - 20_000 },
      ],
    },
  ]
}

function readReminderLists() {
  const fallback = createDefaultReminderLists()
  const value = safeRead<unknown>(remindersStorageKey, fallback)
  if (!Array.isArray(value)) return fallback
  return value.filter((list): list is ReminderList => (
    typeof list === 'object'
    && list !== null
    && typeof list.id === 'string'
    && typeof list.name === 'string'
    && typeof list.createdAt === 'number'
    && typeof list.updatedAt === 'number'
    && Array.isArray(list.items)
  )).map(list => ({
    ...list,
    items: list.items.filter((item): item is ReminderItem => (
      typeof item === 'object'
      && item !== null
      && typeof item.id === 'string'
      && typeof item.text === 'string'
      && typeof item.done === 'boolean'
      && typeof item.createdAt === 'number'
    )),
  }))
}

function createDefaultWorldClocks(): WorldClock[] {
  return [
    { id: crypto.randomUUID(), city: 'New York', timeZone: 'America/New_York' },
    { id: crypto.randomUUID(), city: 'London', timeZone: 'Europe/London' },
    { id: crypto.randomUUID(), city: 'Tokyo', timeZone: 'Asia/Tokyo' },
  ]
}

function readWorldClocks() {
  const fallback = createDefaultWorldClocks()
  const value = safeRead<unknown>(clocksStorageKey, fallback)
  if (!Array.isArray(value)) return fallback
  return value.filter((clock): clock is WorldClock => (
    typeof clock === 'object'
    && clock !== null
    && typeof clock.id === 'string'
    && typeof clock.city === 'string'
    && typeof clock.timeZone === 'string'
  ))
}

function formatClockTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

function formatClockDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(date)
}

function formatElapsed(ms: number) {
  const safe = Math.max(0, Math.floor(ms))
  const minutes = Math.floor(safe / 60_000)
  const seconds = Math.floor((safe % 60_000) / 1000)
  const centiseconds = Math.floor((safe % 1000) / 10)
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`
}

function createCalendarApp(): PhoneApp {
  return {
    id: 'calendar',
    name: 'Calendar',
    icon: '31',
    color: '#ff3b30',
    create() {
      const left = document.createElement('section')
      left.className = 'productivity-shell productivity-calendar-panel'
      left.innerHTML = `
        <div class="productivity-header">
          <div>
            <h2>Calendar</h2>
          </div>
          <button class="productivity-chip productivity-today" type="button">Today</button>
        </div>
        <div class="productivity-calendar-toolbar" aria-label="Month controls">
          <button class="productivity-chip" type="button" data-action="prev-month" aria-label="Previous month">‹</button>
          <strong class="productivity-month-label" aria-live="polite"></strong>
          <button class="productivity-chip" type="button" data-action="next-month" aria-label="Next month">›</button>
        </div>
        <div class="productivity-calendar-grid" role="grid" aria-label="Month view"></div>
        <section class="productivity-calendar-agenda" aria-label="Selected day">
          <div class="productivity-calendar-footer">
            <strong class="productivity-selected-date"></strong>
            <span class="productivity-selected-count"></span>
          </div>
          <div class="productivity-agenda-preview"></div>
        </section>
      `
      const right = document.createElement('section')
      right.className = 'productivity-shell productivity-calendar-editor'
      right.innerHTML = `
        <div class="productivity-header">
          <div>
            <h2>New Event</h2>
          </div>
          <button class="productivity-chip productivity-add-today" type="button">Selected Date</button>
        </div>
        <form class="productivity-form">
          <label class="productivity-field">
            <span>Date</span>
            <input class="productivity-input" type="date" required>
          </label>
          <label class="productivity-field">
            <span>Title</span>
            <input class="productivity-input" type="text" maxlength="80" placeholder="Lunch with Maya" required>
          </label>
          <div class="productivity-form-row">
            <label class="productivity-field">
              <span>Time</span>
              <input class="productivity-input" type="time">
            </label>
            <label class="productivity-field productivity-field--wide">
              <span>Notes</span>
              <input class="productivity-input" type="text" maxlength="140" placeholder="Location, prep, reminder">
            </label>
          </div>
          <button class="productivity-primary" type="submit">Add Event</button>
        </form>
        <div class="productivity-list-header">
          <strong>Events</strong>
        </div>
        <ol class="productivity-event-list" aria-live="polite"></ol>
        <p class="productivity-empty" hidden>No Events</p>
      `

      const events = readCalendarEvents()
      let currentMonth = normalizeMonthCursor(new Date())
      let selectedDate = toDateInputValue()

      const monthLabel = left.querySelector<HTMLElement>('.productivity-month-label')!
      const grid = left.querySelector<HTMLElement>('.productivity-calendar-grid')!
      const selectedDateLabel = left.querySelector<HTMLElement>('.productivity-selected-date')!
      const selectedCountLabel = left.querySelector<HTMLElement>('.productivity-selected-count')!
      const eventList = right.querySelector<HTMLOListElement>('.productivity-event-list')!
      const empty = right.querySelector<HTMLElement>('.productivity-empty')!
      const dateInput = right.querySelector<HTMLInputElement>('input[type="date"]')!
      const titleInput = right.querySelector<HTMLInputElement>('input[type="text"]')!
      const timeInput = right.querySelector<HTMLInputElement>('input[type="time"]')!
      const notesInput = right.querySelector<HTMLInputElement>('input[placeholder="Location, prep, reminder"]')!

      function persist() {
        safeWrite(calendarStorageKey, events)
      }

      function eventsForSelectedDate() {
        return [...events]
          .filter(event => event.date === selectedDate)
          .sort(compareDateTime)
      }

      function selectDate(nextDate: string) {
        selectedDate = nextDate
        dateInput.value = nextDate
        currentMonth = normalizeMonthCursor(parseDateInputValue(nextDate))
        render()
      }

      function removeEvent(id: string) {
        const index = events.findIndex(event => event.id === id)
        if (index < 0) return
        events.splice(index, 1)
        persist()
        render()
      }

      function renderCalendarGrid() {
        grid.replaceChildren()
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        monthLabel.textContent = currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })

        for (const day of weekdayLabels) {
          const label = document.createElement('div')
          label.className = 'productivity-weekday'
          label.textContent = day
          grid.append(label)
        }

        const firstDay = new Date(year, month, 1)
        const offset = firstDay.getDay()
        const totalDays = daysInMonth(year, month)
        const totalCells = Math.ceil((offset + totalDays) / 7) * 7
        const today = toDateInputValue()

        for (let index = 0; index < totalCells; index += 1) {
          const dayNumber = index - offset + 1
          if (dayNumber < 1 || dayNumber > totalDays) {
            const emptyCell = document.createElement('div')
            emptyCell.className = 'productivity-day is-empty'
            emptyCell.setAttribute('aria-hidden', 'true')
            grid.append(emptyCell)
            continue
          }

          const value = `${year}-${pad(month + 1)}-${pad(dayNumber)}`
          const dayEvents = events.filter(event => event.date === value)
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'productivity-day'
          button.dataset.date = value
          button.setAttribute('aria-label', `${parseDateInputValue(value).toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`)
          button.setAttribute('aria-pressed', String(value === selectedDate))
          if (value === today) button.setAttribute('aria-current', 'date')
          button.innerHTML = `
            <strong>${dayNumber}</strong>
            <span class="productivity-day-badge" aria-hidden="true">${dayEvents.length || ''}</span>
          `
          button.addEventListener('click', () => selectDate(value))
          grid.append(button)
        }
      }

      function renderEventList() {
        const selectedEvents = eventsForSelectedDate()
        eventList.replaceChildren()
        empty.hidden = selectedEvents.length > 0
        selectedDateLabel.textContent = formatFullDate(selectedDate)
        selectedCountLabel.textContent = `${selectedEvents.length} ${selectedEvents.length === 1 ? 'event' : 'events'}`
        const agenda = left.querySelector<HTMLElement>('.productivity-agenda-preview')!
        agenda.replaceChildren()
        if (!selectedEvents.length) agenda.textContent = 'No Events'
        for (const event of selectedEvents) {
          const row = document.createElement('div')
          row.className = 'productivity-agenda-row'
          const time = document.createElement('span')
          time.textContent = formatTimeLabel(event.time)
          const title = document.createElement('strong')
          title.textContent = event.title
          row.append(time, title)
          agenda.append(row)
        }

        for (const event of selectedEvents) {
          const item = document.createElement('li')
          item.className = 'productivity-event'
          item.innerHTML = `
            <div>
              <strong></strong>
              <span class="productivity-event-meta"></span>
              <p class="productivity-event-notes"></p>
            </div>
            <button class="productivity-icon-button" type="button" aria-label="Delete event">✕</button>
          `
          item.querySelector('strong')!.textContent = event.title
          item.querySelector('.productivity-event-meta')!.textContent = formatTimeLabel(event.time)
          item.querySelector('.productivity-event-notes')!.textContent = event.notes || 'No notes'
          item.querySelector('button')!.addEventListener('click', () => removeEvent(event.id))
          eventList.append(item)
        }
      }

      function render() {
        dateInput.value = selectedDate
        renderCalendarGrid()
        renderEventList()
      }

      left.querySelector<HTMLButtonElement>('[data-action="prev-month"]')!.addEventListener('click', () => {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        render()
      })
      left.querySelector<HTMLButtonElement>('[data-action="next-month"]')!.addEventListener('click', () => {
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        render()
      })
      left.querySelector<HTMLButtonElement>('.productivity-today')!.addEventListener('click', () => {
        selectDate(toDateInputValue())
      })
      right.querySelector<HTMLButtonElement>('.productivity-add-today')!.addEventListener('click', () => {
        dateInput.value = selectedDate
        dateInput.focus()
      })
      dateInput.addEventListener('change', () => {
        if (!dateInput.value) return
        selectDate(dateInput.value)
      })
      right.querySelector('form')!.addEventListener('submit', event => {
        event.preventDefault()
        const title = titleInput.value.trim()
        if (!title || !dateInput.value) return
        events.push({
          id: crypto.randomUUID(),
          date: dateInput.value,
          title,
          time: timeInput.value,
          notes: notesInput.value.trim(),
          createdAt: Date.now(),
        })
        persist()
        selectedDate = dateInput.value
        currentMonth = normalizeMonthCursor(parseDateInputValue(selectedDate))
        titleInput.value = ''
        timeInput.value = ''
        notesInput.value = ''
        render()
        titleInput.focus()
      })

      render()
      return { left, right }
    },
  }
}

function createRemindersApp(): PhoneApp {
  return {
    id: 'reminders',
    name: 'Reminders',
    icon: '✓',
    color: '#007aff',
    create() {
      const left = document.createElement('section')
      left.className = 'productivity-shell productivity-reminders-panel'
      left.innerHTML = `
        <div class="productivity-header">
          <div>
            <h2>Reminders</h2>
          </div>
          <button class="productivity-chip productivity-new-list" type="button">Add List</button>
        </div>
        <label class="productivity-search">
          <span class="visually-hidden">Search lists</span>
          <input class="productivity-input productivity-search-lists" type="search" placeholder="Search">
        </label>
        <div class="productivity-list-header">
          <strong>My Lists</strong>
        </div>
        <div class="productivity-reminder-lists" role="listbox" aria-label="Reminder lists"></div>
        <form class="productivity-inline-form productivity-new-list-form">
          <label class="visually-hidden" for="new-list-name">List name</label>
          <input id="new-list-name" class="productivity-input" type="text" maxlength="30" placeholder="New List">
          <button class="productivity-primary" type="submit">Add</button>
        </form>
      `
      const right = document.createElement('section')
      right.className = 'productivity-shell productivity-reminders-editor'
      right.innerHTML = `
        <div class="productivity-header">
          <div>
            <h2 class="productivity-selected-list-name"></h2>
          </div>
          <button class="productivity-chip productivity-delete-list" type="button">Delete list</button>
        </div>
        <div class="productivity-stats">
          <span><strong class="productivity-stat-count"></strong> remaining</span>
          <span><strong class="productivity-stat-total"></strong> total</span>
        </div>
        <ol class="productivity-reminder-items" aria-live="polite"></ol>
        <p class="productivity-empty" hidden>No Reminders</p>
        <form class="productivity-inline-form">
          <label class="visually-hidden" for="new-reminder-text">New reminder</label>
          <input id="new-reminder-text" class="productivity-input" type="text" maxlength="80" placeholder="Add a reminder">
          <button class="productivity-primary" type="submit">Add</button>
        </form>
      `

      let lists = readReminderLists()
      let selectedListId = lists[0]?.id ?? null

      const listContainer = left.querySelector<HTMLElement>('.productivity-reminder-lists')!
      const listNameInput = left.querySelector<HTMLInputElement>('#new-list-name')!
      const selectedListName = right.querySelector<HTMLElement>('.productivity-selected-list-name')!
      const statCount = right.querySelector<HTMLElement>('.productivity-stat-count')!
      const statTotal = right.querySelector<HTMLElement>('.productivity-stat-total')!
      const itemList = right.querySelector<HTMLOListElement>('.productivity-reminder-items')!
      const empty = right.querySelector<HTMLElement>('.productivity-empty')!
      const newReminderInput = right.querySelector<HTMLInputElement>('#new-reminder-text')!
      const searchListsInput = left.querySelector<HTMLInputElement>('.productivity-search-lists')!

      function persist() {
        safeWrite(remindersStorageKey, lists)
      }

      function selectedList() {
        return lists.find(list => list.id === selectedListId) ?? null
      }

      function ensureList() {
        if (lists.length) return
        const now = Date.now()
        lists = [{
          id: crypto.randomUUID(),
          name: 'Inbox',
          createdAt: now,
          updatedAt: now,
          items: [],
        }]
        selectedListId = lists[0].id
      }

      function selectList(id: string) {
        selectedListId = id
        render()
      }

      function addList(name: string) {
        const trimmed = name.trim()
        if (!trimmed) return
        const now = Date.now()
        const list: ReminderList = {
          id: crypto.randomUUID(),
          name: trimmed,
          createdAt: now,
          updatedAt: now,
          items: [],
        }
        lists.unshift(list)
        selectedListId = list.id
        persist()
        render()
      }

      function deleteList(id: string) {
        const index = lists.findIndex(list => list.id === id)
        if (index < 0) return
        lists.splice(index, 1)
        ensureList()
        selectedListId = lists[Math.min(index, lists.length - 1)]?.id ?? lists[0].id
        persist()
        render()
      }

      function toggleItem(listId: string, itemId: string) {
        const list = lists.find(entry => entry.id === listId)
        const item = list?.items.find(entry => entry.id === itemId)
        if (!list || !item) return
        item.done = !item.done
        list.updatedAt = Date.now()
        persist()
        render()
      }

      function deleteItem(listId: string, itemId: string) {
        const list = lists.find(entry => entry.id === listId)
        if (!list) return
        const index = list.items.findIndex(item => item.id === itemId)
        if (index < 0) return
        list.items.splice(index, 1)
        list.updatedAt = Date.now()
        persist()
        render()
      }

      function addItem(text: string) {
        const list = selectedList()
        const trimmed = text.trim()
        if (!list || !trimmed) return
        list.items.unshift({
          id: crypto.randomUUID(),
          text: trimmed,
          done: false,
          createdAt: Date.now(),
        })
        list.updatedAt = Date.now()
        persist()
        render()
      }

      function renderListSidebar() {
        listContainer.replaceChildren()
        for (const list of [...lists].sort((a, b) => b.updatedAt - a.updatedAt)) {
          if (!list.name.toLowerCase().includes(searchListsInput.value.trim().toLowerCase())) continue
          const todoCount = list.items.filter(item => !item.done).length
          const row = document.createElement('div')
          row.className = 'productivity-list-item'
          const colors = ['#007aff', '#ff9500', '#34c759', '#af52de', '#ff3b30']
          row.style.setProperty('--list-color', colors[lists.indexOf(list) % colors.length])
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'productivity-list-button'
          button.setAttribute('role', 'option')
          button.setAttribute('aria-selected', String(list.id === selectedListId))
          button.innerHTML = `
            <span class="productivity-list-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg></span>
            <div>
              <strong></strong>
            </div>
            <span class="productivity-list-badge"></span>
          `
          button.querySelector('strong')!.textContent = list.name
          button.querySelector('.productivity-list-badge')!.textContent = `${todoCount}`
          button.addEventListener('click', () => selectList(list.id))

          const deleteButton = document.createElement('button')
          deleteButton.type = 'button'
          deleteButton.className = 'productivity-icon-button productivity-delete-list-item'
          deleteButton.setAttribute('aria-label', `Delete ${list.name}`)
          deleteButton.textContent = '✕'
          deleteButton.addEventListener('click', () => deleteList(list.id))
          row.append(button, deleteButton)
          listContainer.append(row)
        }
      }

      function renderItems() {
        const list = selectedList()
        itemList.replaceChildren()
        empty.hidden = Boolean(list?.items.length)
        selectedListName.textContent = list?.name ?? 'Inbox'
        const items = list?.items ?? []
        const remaining = items.filter(item => !item.done).length
        statCount.textContent = String(remaining)
        statTotal.textContent = String(items.length)

        if (!list) return

        for (const item of [...items].sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt)) {
          const li = document.createElement('li')
          li.className = 'productivity-reminder-item'
          li.innerHTML = `
            <label class="productivity-reminder-toggle">
              <input type="checkbox" aria-label="Complete reminder">
              <span></span>
            </label>
            <div class="productivity-reminder-copy">
              <strong></strong>
              <span></span>
            </div>
            <button class="productivity-icon-button" type="button" aria-label="Delete reminder">✕</button>
          `
          const checkbox = li.querySelector<HTMLInputElement>('input[type="checkbox"]')!
          checkbox.checked = item.done
          checkbox.addEventListener('change', () => toggleItem(list.id, item.id))
          li.querySelector('strong')!.textContent = item.text
          li.querySelector('.productivity-reminder-copy span')!.textContent = item.done ? 'Completed' : ''
          li.classList.toggle('is-done', item.done)
          li.querySelector('button')!.addEventListener('click', () => deleteItem(list.id, item.id))
          itemList.append(li)
        }
      }

      function render() {
        ensureList()
        if (!lists.some(list => list.id === selectedListId)) selectedListId = lists[0].id
        renderListSidebar()
        renderItems()
      }

      searchListsInput.addEventListener('input', renderListSidebar)
      left.querySelector('form')!.addEventListener('submit', event => {
        event.preventDefault()
        addList(listNameInput.value)
        listNameInput.value = ''
        listNameInput.focus()
      })
      left.querySelector<HTMLButtonElement>('.productivity-new-list')!.addEventListener('click', () => {
        listNameInput.focus()
      })
      right.querySelector<HTMLButtonElement>('.productivity-delete-list')!.addEventListener('click', () => {
        if (selectedListId) deleteList(selectedListId)
      })
      right.querySelector('form')!.addEventListener('submit', event => {
        event.preventDefault()
        addItem(newReminderInput.value)
        newReminderInput.value = ''
        newReminderInput.focus()
      })

      render()
      return { left, right }
    },
  }
}

function createClockApp(): PhoneApp {
  return {
    id: 'clock',
    name: 'Clock',
    icon: '◷',
    color: '#ff9500',
    create() {
      const left = document.createElement('section')
      left.className = 'productivity-shell productivity-clock-panel'
      left.innerHTML = `
        <div class="productivity-header">
          <div>
            <h2>World Clock</h2>
          </div>
          <button class="productivity-chip productivity-clock-today" type="button">Now</button>
        </div>
        <div class="productivity-local-clock">
          <span class="productivity-label">Local time</span>
          <strong class="productivity-local-time" aria-live="polite"></strong>
          <span class="productivity-local-date"></span>
        </div>
        <div class="productivity-clock-chooser">
          <label class="visually-hidden" for="world-clock-city">Add a city</label>
          <select id="world-clock-city" class="productivity-input"></select>
          <button class="productivity-primary" type="button" aria-label="Add city">+</button>
        </div>
        <div class="productivity-clock-list" aria-live="polite"></div>
      `
      const right = document.createElement('section')
      right.className = 'productivity-shell productivity-clock-timer'
      right.innerHTML = `
        <div class="productivity-header">
          <div>
            <h2>Stopwatch</h2>
          </div>
          <button class="productivity-chip productivity-lap" type="button">Lap</button>
        </div>
        <div class="productivity-stopwatch">
          <strong class="productivity-stopwatch-value" aria-live="polite">00:00.00</strong>
          <span class="productivity-stopwatch-state"></span>
        </div>
        <div class="productivity-stopwatch-controls">
          <button class="productivity-primary productivity-start-stop" type="button">Start</button>
          <button class="productivity-chip productivity-reset" type="button">Reset</button>
        </div>
        <div class="productivity-list-header">
          <strong>Laps</strong>
          <span class="productivity-label">Space toggles the stopwatch</span>
        </div>
        <ol class="productivity-lap-list" aria-live="polite"></ol>
      `

      let worldClocks = readWorldClocks()
      let stopwatchRunning = false
      let stopwatchStart = 0
      let stopwatchElapsed = 0
      let stopwatchLaps: number[] = []

      const localTime = left.querySelector<HTMLElement>('.productivity-local-time')!
      const localDate = left.querySelector<HTMLElement>('.productivity-local-date')!
      const clockList = left.querySelector<HTMLElement>('.productivity-clock-list')!
      const citySelect = left.querySelector<HTMLSelectElement>('#world-clock-city')!
      const stopwatchValue = right.querySelector<HTMLElement>('.productivity-stopwatch-value')!
      const stopwatchState = right.querySelector<HTMLElement>('.productivity-stopwatch-state')!
      const lapList = right.querySelector<HTMLOListElement>('.productivity-lap-list')!
      const startStopButton = right.querySelector<HTMLButtonElement>('.productivity-start-stop')!

      function persistClocks() {
        safeWrite(clocksStorageKey, worldClocks)
      }

      function currentElapsed() {
        return stopwatchRunning ? stopwatchElapsed + (performance.now() - stopwatchStart) : stopwatchElapsed
      }

      function renderLocalClock() {
        const now = new Date()
        localTime.textContent = new Intl.DateTimeFormat([], {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        }).format(now)
        localDate.textContent = now.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      }

      function renderWorldClocks() {
        citySelect.replaceChildren()
        const unavailableZones = new Set(worldClocks.map(clock => clock.timeZone))
        for (const option of worldClockOptions) {
          if (unavailableZones.has(option.timeZone)) continue
          const opt = document.createElement('option')
          opt.value = option.timeZone
          opt.textContent = option.city
          citySelect.append(opt)
        }
        citySelect.disabled = !citySelect.options.length
        if (citySelect.options.length && !citySelect.value) citySelect.selectedIndex = 0

        clockList.replaceChildren()
        for (const clock of worldClocks) {
          const now = new Date()
          const card = document.createElement('article')
          card.className = 'productivity-clock-card'
          card.dataset.timeZone = clock.timeZone
          card.innerHTML = `
            <div>
              <strong></strong>
              <span class="productivity-label"></span>
            </div>
            <div class="productivity-clock-card-time"></div>
            <button class="productivity-icon-button" type="button" aria-label="Remove city">✕</button>
          `
          card.querySelector('strong')!.textContent = clock.city
          card.querySelector('.productivity-label')!.textContent = formatClockDate(now, clock.timeZone)
          card.querySelector('.productivity-clock-card-time')!.textContent = formatClockTime(now, clock.timeZone)
          card.querySelector('button')!.addEventListener('click', () => {
            worldClocks = worldClocks.filter(entry => entry.id !== clock.id)
            if (!worldClocks.length) {
              worldClocks = createDefaultWorldClocks()
            }
            persistClocks()
            renderWorldClocks()
          })
          clockList.append(card)
        }
      }

      function renderStopwatch() {
        const elapsed = currentElapsed()
        stopwatchValue.textContent = formatElapsed(elapsed)
        stopwatchState.textContent = stopwatchRunning ? 'Running' : 'Paused'
        startStopButton.textContent = stopwatchRunning ? 'Stop' : stopwatchElapsed ? 'Resume' : 'Start'
        startStopButton.classList.toggle('is-running', stopwatchRunning)

        lapList.replaceChildren()
        const laps = [...stopwatchLaps].reverse()
        for (const [index, lap] of laps.entries()) {
          const previous = laps[index + 1] ?? 0
          const li = document.createElement('li')
          li.className = 'productivity-lap-item'
          li.innerHTML = `
            <span>Lap ${laps.length - index}</span>
            <strong></strong>
            <span class="productivity-label"></span>
          `
          li.querySelector('strong')!.textContent = formatElapsed(lap)
          li.querySelector('.productivity-label')!.textContent = `+${formatElapsed(lap - previous)}`
          lapList.append(li)
        }
      }

      function render() {
        renderLocalClock()
        renderWorldClocks()
        renderStopwatch()
      }

      function tick() {
        renderLocalClock()
        const now = new Date()
        for (const card of clockList.querySelectorAll<HTMLElement>('.productivity-clock-card')) {
          const label = card.querySelector<HTMLElement>('.productivity-clock-card-time')
          const city = card.dataset.timeZone
          if (label && city) {
            label.textContent = formatClockTime(now, city)
            card.querySelector('.productivity-label')!.textContent = formatClockDate(now, city)
          }
        }
        stopwatchValue.textContent = formatElapsed(currentElapsed())
      }

      left.querySelector<HTMLButtonElement>('.productivity-clock-today')!.addEventListener('click', () => {
        renderLocalClock()
      })
      left.querySelector<HTMLButtonElement>('.productivity-clock-chooser button')!.addEventListener('click', () => {
        const option = worldClockOptions.find(entry => entry.timeZone === citySelect.value)
        if (!option || worldClocks.some(clock => clock.timeZone === option.timeZone)) return
        worldClocks.unshift({
          id: crypto.randomUUID(),
          city: option.city,
          timeZone: option.timeZone,
        })
        persistClocks()
        renderWorldClocks()
        citySelect.value = worldClockOptions.find(entry => !worldClocks.some(clock => clock.timeZone === entry.timeZone))?.timeZone ?? citySelect.value
      })
      right.querySelector<HTMLButtonElement>('.productivity-start-stop')!.addEventListener('click', () => {
        if (stopwatchRunning) {
          stopwatchElapsed = currentElapsed()
          stopwatchRunning = false
        } else {
          stopwatchRunning = true
          stopwatchStart = performance.now()
        }
        renderStopwatch()
      })
      right.querySelector<HTMLButtonElement>('.productivity-reset')!.addEventListener('click', () => {
        stopwatchRunning = false
        stopwatchElapsed = 0
        stopwatchLaps = []
        renderStopwatch()
      })
      right.querySelector<HTMLButtonElement>('.productivity-lap')!.addEventListener('click', () => {
        if (!stopwatchRunning) return
        stopwatchLaps.push(currentElapsed())
        renderStopwatch()
      })

      for (const pane of [left, right]) {
        const tabs = document.createElement('nav')
        tabs.className = 'productivity-clock-tabs'
        tabs.setAttribute('aria-label', 'Clock views')
        tabs.innerHTML = `
          <button type="button" data-view="world" aria-pressed="${pane === left}"><svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11"/><ellipse cx="14" cy="14" rx="5" ry="11"/><path d="M3 14h22M5 8h18M5 20h18"/></svg>World Clock</button>
          <button type="button" data-view="stopwatch" aria-pressed="${pane === right}"><svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="16" r="9"/><path d="M11 2h6M14 2v5M21 7l2-2M14 10v6l3 2"/></svg>Stopwatch</button>
        `
        tabs.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
          button.addEventListener('click', () => {
            const target = button.dataset.view === 'world' ? left : right
            if (target === pane) return
            const sourceHost = pane.parentElement
            const targetHost = target.parentElement
            if (!sourceHost || !targetHost) return
            sourceHost.replaceChildren(target)
            targetHost.replaceChildren(pane)
            target.querySelector<HTMLButtonElement>('.productivity-clock-tabs [aria-pressed=true]')?.focus({ preventScroll: true })
          })
        })
        pane.append(tabs)
      }
      window.setInterval(tick, 250)
      render()
      return {
        left,
        right,
        onKey(event) {
          if (event.ctrlKey || event.metaKey || event.altKey) return false
          if (event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault()
            right.querySelector<HTMLButtonElement>('.productivity-start-stop')!.click()
            return true
          }
          if (event.key.toLowerCase() === 'r') {
            event.preventDefault()
            right.querySelector<HTMLButtonElement>('.productivity-reset')!.click()
            return true
          }
          if (event.key.toLowerCase() === 'l') {
            event.preventDefault()
            right.querySelector<HTMLButtonElement>('.productivity-lap')!.click()
            return true
          }
          return false
        },
      }
    },
  }
}

export const productivityApps: PhoneApp[] = [
  createCalendarApp(),
  createRemindersApp(),
  createClockApp(),
]
