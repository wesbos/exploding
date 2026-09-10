import './communications.css'

import type { PhoneApp } from './types'

type Contact = {
  id: string
  name: string
  phone: string
  email: string
  facetime: string
  note: string
  favorite: boolean
  updatedAt: number
}

type PhoneLog = {
  id: string
  contactId?: string
  label: string
  number: string
  startedAt: number
  duration: number
  status: 'connected' | 'missed'
}

type FaceTimeLog = {
  id: string
  contactId?: string
  label: string
  handle: string
  mode: 'audio' | 'video'
  startedAt: number
  duration: number
  status: 'connected' | 'missed'
}

type Message = {
  id: string
  from: 'me' | 'them'
  text: string
  at: number
}

type Thread = {
  id: string
  contactId?: string
  label: string
  address: string
  messages: Message[]
  unread: number
  draft: string
  updatedAt: number
}

const UPDATE_EVENT = 'duo-communications:update'
const CONTACTS_KEY = 'duo-communications.contacts.v1'
const PHONE_KEY = 'duo-communications.phone.v1'
const FACETIME_KEY = 'duo-communications.facetime.v1'
const THREADS_KEY = 'duo-communications.messages.v1'

const now = () => Date.now()
const uuid = () => crypto.randomUUID()

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeRead<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent<string>(UPDATE_EVENT, { detail: key }))
  } catch {
    // Ignore storage failures; the UI still works in-memory.
  }
}

function listen(keys: string[], render: () => void) {
  const handler = (event: Event) => {
    if (event.type === 'storage') {
      const key = (event as StorageEvent).key
      if (key && keys.includes(key)) render()
      return
    }
    const key = (event as CustomEvent<string>).detail
    if (keys.includes(key)) render()
  }
  window.addEventListener('storage', handler)
  window.addEventListener(UPDATE_EVENT, handler as EventListener)
}

function cleanText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function cleanBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function cleanNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+#*]/g, '')
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  const today = new Date()
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatDuration(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  const remainder = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${remainder}`
}

function matchContact(contact: Contact, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [
    contact.name,
    contact.phone,
    contact.email,
    contact.facetime,
    contact.note,
  ].some(value => value.toLowerCase().includes(needle))
}

function resolveContact(contacts: Contact[], value: string) {
  const needle = normalizePhone(value)
  const lower = value.trim().toLowerCase()
  return contacts.find(contact => (
    contact.id === value
    || normalizePhone(contact.phone) === needle
    || contact.name.trim().toLowerCase() === lower
    || contact.facetime.trim().toLowerCase() === lower
  ))
}

function parseContacts(): Contact[] {
  const raw = safeRead<unknown>(CONTACTS_KEY)
  if (raw === null) {
    const starters = [
      { name: 'Avery Stone', phone: '555-0142', email: 'avery@duo.dev', facetime: 'avery', note: 'Always down for a quick call.', favorite: true },
      { name: 'Mina Park', phone: '555-0188', email: 'mina@duo.dev', facetime: 'mina', note: 'Prefers messages before meetings.', favorite: false },
      { name: 'Jordan Blake', phone: '555-0199', email: 'jordan@duo.dev', facetime: 'jordan', note: 'The person to call when plans change.', favorite: true },
      { name: 'Noah Patel', phone: '555-0117', email: 'noah@duo.dev', facetime: 'noah', note: 'Audio first, video when the lighting is right.', favorite: false },
    ].map(contact => ({ ...contact, id: uuid(), updatedAt: now() }))
    safeWrite(CONTACTS_KEY, starters)
    return starters
  }
  if (!Array.isArray(raw)) return []
  return raw.flatMap(contact => {
    if (!isObject(contact)) return []
    const name = cleanText(contact.name, '').trim()
    const phone = cleanText(contact.phone, '').trim()
    if (!name && !phone) return []
    return [{
      id: cleanText(contact.id, uuid()),
      name: name || 'Unnamed contact',
      phone: phone || '—',
      email: cleanText(contact.email, ''),
      facetime: cleanText(contact.facetime, ''),
      note: cleanText(contact.note, ''),
      favorite: cleanBoolean(contact.favorite, false),
      updatedAt: cleanNumber(contact.updatedAt, now()),
    }]
  })
}

function saveContacts(contacts: Contact[]) {
  safeWrite(CONTACTS_KEY, contacts)
}

function parsePhoneLog(): PhoneLog[] {
  const raw = safeRead<unknown>(PHONE_KEY)
  if (raw === null) {
    const contacts = parseContacts()
    const starters = contacts.slice(0, 3).map((contact, index) => ({
      id: uuid(),
      contactId: contact.id,
      label: contact.name,
      number: contact.phone,
      startedAt: now() - (index + 1) * 7_200_000,
      duration: (index + 1) * 41_000,
      status: 'connected' as const,
    }))
    safeWrite(PHONE_KEY, starters)
    return starters
  }
  if (!Array.isArray(raw)) return []
  return raw.flatMap(log => {
    if (!isObject(log)) return []
    const number = cleanText(log.number, '').trim()
    const label = cleanText(log.label, '').trim()
    if (!number && !label) return []
    return [{
      id: cleanText(log.id, uuid()),
      contactId: typeof log.contactId === 'string' ? log.contactId : undefined,
      label: label || number || 'Unknown caller',
      number: number || 'Unknown',
      startedAt: cleanNumber(log.startedAt, now()),
      duration: cleanNumber(log.duration, 0),
      status: log.status === 'missed' ? 'missed' : 'connected',
    }]
  })
}

function savePhoneLog(logs: PhoneLog[]) {
  safeWrite(PHONE_KEY, logs)
}

function parseFaceTimeLog(): FaceTimeLog[] {
  const raw = safeRead<unknown>(FACETIME_KEY)
  if (raw === null) {
    const contacts = parseContacts()
    const starters = contacts.slice(0, 3).map((contact, index) => ({
      id: uuid(),
      contactId: contact.id,
      label: contact.name,
      handle: contact.facetime || contact.phone,
      mode: index === 0 ? 'video' as const : 'audio' as const,
      startedAt: now() - (index + 1) * 5_400_000,
      duration: (index + 1) * 62_000,
      status: 'connected' as const,
    }))
    safeWrite(FACETIME_KEY, starters)
    return starters
  }
  if (!Array.isArray(raw)) return []
  return raw.flatMap(log => {
    if (!isObject(log)) return []
    const handle = cleanText(log.handle, '').trim()
    const label = cleanText(log.label, '').trim()
    if (!handle && !label) return []
    return [{
      id: cleanText(log.id, uuid()),
      contactId: typeof log.contactId === 'string' ? log.contactId : undefined,
      label: label || handle || 'FaceTime',
      handle: handle || 'Unknown',
      mode: log.mode === 'audio' ? 'audio' : 'video',
      startedAt: cleanNumber(log.startedAt, now()),
      duration: cleanNumber(log.duration, 0),
      status: log.status === 'missed' ? 'missed' : 'connected',
    }]
  })
}

function saveFaceTimeLog(logs: FaceTimeLog[]) {
  safeWrite(FACETIME_KEY, logs)
}

function parseThreads(): Thread[] {
  const raw = safeRead<unknown>(THREADS_KEY)
  if (raw === null) {
    const contacts = parseContacts()
    const starters: Thread[] = contacts.slice(0, 3).map((contact, index): Thread => {
      const messages = [
        { id: uuid(), from: 'them' as const, text: index === 0 ? 'Want to grab coffee after work?' : 'I sent the revised plan.', at: now() - (index + 1) * 3_900_000 },
        { id: uuid(), from: 'me' as const, text: index === 0 ? 'Absolutely. I can make it after 5.' : 'Perfect — thanks for the update.', at: now() - (index + 1) * 3_700_000 },
      ] as Thread['messages']
      return {
        id: uuid(),
        contactId: contact.id,
        label: contact.name,
        address: contact.phone,
        unread: index === 0 ? 2 : 0,
        draft: '',
        updatedAt: now() - (index + 1) * 3_600_000,
        messages,
      } as Thread
    })
    safeWrite(THREADS_KEY, starters)
    return starters
  }
  if (!Array.isArray(raw)) return []
  return raw.flatMap(thread => {
    if (!isObject(thread)) return []
    const address = cleanText(thread.address, '').trim()
    const label = cleanText(thread.label, '').trim()
    const messages: Message[] = Array.isArray(thread.messages)
      ? thread.messages.flatMap((message): Message[] => {
        if (!isObject(message)) return []
        const text = cleanText(message.text, '').trim()
        if (!text) return []
        return [{
          id: cleanText(message.id, uuid()),
          from: message.from === 'them' ? 'them' : 'me',
          text,
          at: cleanNumber(message.at, now()),
        }]
      })
      : []
    if (!address && !label && messages.length === 0) return []
    return [{
      id: cleanText(thread.id, uuid()),
      contactId: typeof thread.contactId === 'string' ? thread.contactId : undefined,
      label: label || address || 'Conversation',
      address: address || 'Unknown',
      messages,
      unread: cleanNumber(thread.unread, 0),
      draft: cleanText(thread.draft, ''),
      updatedAt: cleanNumber(thread.updatedAt, now()),
    }]
  })
}

function saveThreads(threads: Thread[]) {
  safeWrite(THREADS_KEY, threads)
}

function contactDisplay(contact: Contact) {
  return `${contact.name} · ${contact.phone}`
}

function commSymbol(name: 'phone' | 'video' | 'compose' | 'plus' | 'delete') {
  const paths = {
    phone: '<path d="m7 3 3 5-2.5 2.5a15 15 0 0 0 6 6L16 14l5 3-.7 3.2c-.2.8-1 1.3-1.8 1.2C10 20.5 3.5 14 2.6 5.5c-.1-.8.4-1.6 1.2-1.8Z" fill="currentColor" stroke="none"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="3" fill="currentColor" stroke="none"/><path d="m17 9 5-3v12l-5-3Z" fill="currentColor" stroke="none"/>',
    compose: '<path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8M10 14l1-4L20 1l3 3-9 9Z"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    delete: '<path d="M9 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-7-7ZM12 9l6 6m0-6-6 6"/>',
  }
  return `<svg class="comm-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`
}

function createPhoneApp(): PhoneApp {
  return {
    id: 'phone',
    name: 'Phone',
    icon: '◉',
    color: '#34c759',
    create() {
      const contacts = parseContacts()
      const left = document.createElement('section')
      left.className = 'comm-pane comm-phone-screen comm-phone-screen--left'
      left.innerHTML = `
        <header class="comm-header">
          <div>
            <h2>Phone</h2>
          </div>
          <span class="comm-demo-label">Local demo</span>
        </header>
        <article class="comm-card comm-call-card">
          <p class="comm-card-label">${commSymbol('phone')} Current call</p>
          <h3 class="comm-call-name">Ready to dial</h3>
          <output class="comm-call-number" aria-live="polite">—</output>
          <p class="comm-call-status" aria-live="polite">Type a number or pick a contact.</p>
          <div class="comm-call-meta">
            <span>Duration</span>
            <strong class="comm-call-duration">0:00</strong>
          </div>
        </article>
        <section class="comm-stack">
          <div class="comm-section-head">
            <h3>Recents</h3>
            <span class="comm-section-count"></span>
          </div>
          <div class="comm-list" role="listbox" aria-label="Recent calls"></div>
        </section>
      `
      const right = document.createElement('section')
      right.className = 'comm-pane comm-phone-screen comm-phone-screen--right'
      right.innerHTML = `
        <header class="comm-header">
          <div>
            <h2>Keypad</h2>
          </div>
          <button class="comm-button comm-button--ghost" type="button" data-action="clear">Clear</button>
        </header>
        <label class="comm-field">
          <span class="comm-visually-hidden">Dialed number</span>
          <input class="comm-input comm-dial-input" type="tel" inputmode="tel" readonly value="" placeholder="Enter a number">
        </label>
        <section class="comm-keypad" aria-label="Dial pad"></section>
        <div class="comm-action-row">
          <button class="comm-button comm-button--primary" type="button" data-action="call" aria-label="Call">${commSymbol('phone')}</button>
          <button class="comm-button" type="button" data-action="delete" aria-label="Delete last digit">${commSymbol('delete')}</button>
        </div>
        <section class="comm-stack comm-quick-stack">
          <div class="comm-chip-row comm-quick-contacts" aria-label="Favorite contacts"></div>
        </section>
      `

      const displayName = left.querySelector<HTMLElement>('.comm-call-name')!
      const displayNumber = left.querySelector<HTMLElement>('.comm-call-number')!
      const displayStatus = left.querySelector<HTMLElement>('.comm-call-status')!
      const displayDuration = left.querySelector<HTMLElement>('.comm-call-duration')!
      const recentList = left.querySelector<HTMLElement>('.comm-list')!
      const recentCount = left.querySelector<HTMLElement>('.comm-section-count')!
      const dialInput = right.querySelector<HTMLInputElement>('.comm-dial-input')!
      const keypad = right.querySelector<HTMLElement>('.comm-keypad')!
      const quickContacts = right.querySelector<HTMLElement>('.comm-quick-contacts')!
      const clearButton = right.querySelector<HTMLButtonElement>('[data-action="clear"]')!
      const callButton = right.querySelector<HTMLButtonElement>('[data-action="call"]')!
      const deleteButton = right.querySelector<HTMLButtonElement>('[data-action="delete"]')!

      let dialed = ''
      let logs = parsePhoneLog()
      let active:
        | { id: string; number: string; label: string; contactId?: string; startedAt: number; connectedAt: number | null }
        | null = null
      let connectTimer = 0
      let tickTimer = 0

      function syncActiveCall() {
        if (!active) return
        const elapsed = (active.connectedAt ?? now()) - active.startedAt
        displayDuration.textContent = formatDuration(elapsed)
        callButton.setAttribute('aria-label', 'End call')
        callButton.dataset.mode = 'end'
        displayName.textContent = active.label
        displayNumber.textContent = active.number
        displayStatus.textContent = active.connectedAt ? 'Connected locally.' : 'Connecting…'
      }

      function finishCall(status: PhoneLog['status']) {
        if (!active) return
        window.clearTimeout(connectTimer)
        window.clearInterval(tickTimer)
        const connectedAt = active.connectedAt ?? active.startedAt
        const duration = status === 'connected' ? now() - connectedAt : 0
        logs = [{
          id: uuid(),
          contactId: active.contactId,
          label: active.label,
          number: active.number,
          startedAt: active.startedAt,
          duration,
          status,
        }, ...logs].slice(0, 20)
        savePhoneLog(logs)
        active = null
        render()
      }

      function startCall() {
        const trimmed = dialed.trim()
        if (!trimmed) return
        const contact = resolveContact(contacts, trimmed)
        window.clearTimeout(connectTimer)
        window.clearInterval(tickTimer)
        active = {
          id: uuid(),
          number: contact?.phone ?? trimmed,
          label: contact ? contact.name : trimmed,
          contactId: contact?.id,
          startedAt: now(),
          connectedAt: null,
        }
        displayStatus.textContent = 'Dialing locally…'
        displayDuration.textContent = '0:00'
        callButton.setAttribute('aria-label', 'End call')
        callButton.dataset.mode = 'end'
        connectTimer = window.setTimeout(() => {
          if (!active) return
          active.connectedAt = now()
          displayStatus.textContent = 'Connected locally.'
          syncActiveCall()
        }, 700)
        tickTimer = window.setInterval(syncActiveCall, 1000)
        renderRecents()
      }

      function appendDigit(value: string) {
        if (active) return
        if (value === '.' && dialed.includes('.')) return
        if (dialed.replace(/[^\d+#*]/g, '').length >= 12 && /[\d]/.test(value)) return
        dialed += value
        renderDial()
      }

      function backspace() {
        if (active) return
        dialed = dialed.slice(0, -1)
        renderDial()
      }

      function fillDial(value: string) {
        if (active) return
        dialed = value
        renderDial()
      }

      function renderDial() {
        dialInput.value = dialed
        const contact = resolveContact(contacts, dialed)
        displayName.textContent = contact?.name ?? (active?.label ?? 'Ready to dial')
        displayNumber.textContent = dialed || '—'
        displayStatus.textContent = active
          ? displayStatus.textContent
          : contact
            ? contact.note || contact.phone || 'Ready to call this contact.'
            : 'Type a number or pick a contact.'
        displayDuration.textContent = active ? displayDuration.textContent : '0:00'
        callButton.setAttribute('aria-label', active ? 'End call' : 'Call')
        callButton.dataset.mode = active ? 'end' : 'call'
        callButton.disabled = !active && !dialed.trim()
        deleteButton.disabled = Boolean(active) || !dialed
      }

      function renderQuickContacts() {
        quickContacts.replaceChildren()
        for (const contact of contacts.filter(contact => contact.favorite).slice(0, 5).length
          ? contacts.filter(contact => contact.favorite).slice(0, 5)
          : contacts.slice(0, 5)) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'comm-chip'
          button.innerHTML = `
            <span class="comm-avatar" aria-hidden="true">${initials(contact.name)}</span>
            <span>
              <strong></strong>
              <small></small>
            </span>
          `
          button.querySelector('strong')!.textContent = contact.name
          button.querySelector('small')!.textContent = contact.phone
          button.addEventListener('click', () => fillDial(contact.phone))
          quickContacts.append(button)
        }
      }

      function renderRecents() {
        recentList.replaceChildren()
        recentCount.textContent = `${logs.length} saved`
        for (const log of logs.slice(0, 8)) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'comm-list-item'
          button.innerHTML = `
            <span class="comm-avatar" aria-hidden="true">${initials(log.label)}</span>
            <span class="comm-list-copy">
              <strong></strong>
              <small></small>
            </span>
            <span class="comm-list-meta"></span>
          `
          button.querySelector('strong')!.textContent = log.label
          button.querySelector('small')!.textContent = log.number
          button.querySelector('.comm-list-meta')!.textContent = log.status === 'missed'
            ? 'missed'
            : formatDuration(log.duration)
          button.addEventListener('click', () => fillDial(log.number))
          recentList.append(button)
        }
      }

      function renderKeypad() {
        keypad.replaceChildren()
        const keys: Array<[string, string]> = [
          ['1', '1'], ['2', '2'], ['3', '3'],
          ['4', '4'], ['5', '5'], ['6', '6'],
          ['7', '7'], ['8', '8'], ['9', '9'],
          ['*', '*'], ['0', '0'], ['#', '#'],
        ]
        for (const [value, label] of keys) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'comm-key'
          const letters: Record<string, string> = { '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL', '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ', '0': '+' }
          button.innerHTML = `<span>${label}</span><small>${letters[value] ?? ''}</small>`
          button.setAttribute('aria-label', `Dial ${label}`)
          button.addEventListener('click', () => appendDigit(value))
          keypad.append(button)
        }
      }

      function render() {
        renderDial()
        renderQuickContacts()
        renderRecents()
        renderKeypad()
        callButton.disabled = !active && !dialed.trim()
        clearButton.disabled = Boolean(active)
        deleteButton.disabled = Boolean(active) || !dialed
      }

      clearButton.addEventListener('click', () => {
        if (active) return
        dialed = ''
        render()
      })
      deleteButton.addEventListener('click', backspace)
      callButton.addEventListener('click', () => {
        if (active) {
          finishCall(active.connectedAt ? 'connected' : 'missed')
        } else {
          startCall()
        }
      })
      listen([CONTACTS_KEY, PHONE_KEY], () => {
        const nextContacts = parseContacts()
        contacts.splice(0, contacts.length, ...nextContacts)
        logs = parsePhoneLog()
        render()
      })

      render()
      return {
        left,
        right,
        onKey(event) {
          if (event.ctrlKey || event.metaKey || event.altKey) return false
          if (event.key >= '0' && event.key <= '9') { appendDigit(event.key); return true }
          if (event.key === '*' || event.key === '#') { appendDigit(event.key); return true }
          if (event.key === 'Backspace') { backspace(); return true }
          if (event.key === 'Delete' || event.key === 'Escape') { if (!active) { dialed = ''; render() }; return event.key !== 'Escape' }
          if (event.key === 'Enter') { active ? finishCall(active.connectedAt ? 'connected' : 'missed') : startCall(); return true }
          return false
        },
      }
    },
  }
}

function createContactsApp(): PhoneApp {
  return {
    id: 'contacts',
    name: 'Contacts',
    icon: '◫',
    color: '#8e8e93',
    create() {
      let contacts = parseContacts()
      let selectedId = contacts[0]?.id ?? null
      let query = ''

      const left = document.createElement('section')
      left.className = 'comm-pane comm-contacts-screen comm-contacts-screen--left'
      left.innerHTML = `
        <header class="comm-header">
          <div>
            <h2>Contacts</h2>
          </div>
          <button class="comm-button comm-button--ghost comm-icon-button" type="button" aria-label="New contact">${commSymbol('plus')}</button>
        </header>
        <label class="comm-field">
          <span class="comm-visually-hidden">Search contacts</span>
          <input class="comm-input comm-search" type="search" placeholder="Search">
        </label>
        <section class="comm-stack">
          <div class="comm-section-head">
            <h3>All Contacts</h3>
            <span class="comm-section-count"></span>
          </div>
          <div class="comm-list" role="listbox" aria-label="Contacts"></div>
        </section>
      `
      const right = document.createElement('section')
      right.className = 'comm-pane comm-contacts-screen comm-contacts-screen--right'
      right.innerHTML = `
        <header class="comm-header">
          <div>
            <h2 class="comm-contact-title">Select a contact</h2>
          </div>
          <button class="comm-button comm-button--ghost" type="button">Delete</button>
        </header>
        <article class="comm-card comm-contact-card">
          <div class="comm-contact-ribbon">
            <span class="comm-avatar comm-avatar--large" aria-hidden="true"></span>
            <div>
              <p class="comm-contact-summary"></p>
            </div>
          </div>
          <form class="comm-form" novalidate>
            <label class="comm-field">
              <span>Name</span>
              <input class="comm-input comm-contact-name" type="text" maxlength="80" required>
            </label>
            <div class="comm-form-grid">
              <label class="comm-field">
                <span>Phone</span>
                <input class="comm-input comm-contact-phone" type="tel" inputmode="tel">
              </label>
              <label class="comm-field">
                <span>FaceTime</span>
                <input class="comm-input comm-contact-facetime" type="text" maxlength="40">
              </label>
            </div>
            <label class="comm-field">
              <span>Email</span>
              <input class="comm-input comm-contact-email" type="email" maxlength="120">
            </label>
            <label class="comm-field">
              <span>Note</span>
              <textarea class="comm-textarea comm-contact-note" rows="2" maxlength="240" placeholder="Add a note"></textarea>
            </label>
            <label class="comm-switch">
              <input class="comm-contact-favorite" type="checkbox">
              <span>Favorite contact</span>
            </label>
            <p class="comm-save-status" role="status">Changes save instantly.</p>
          </form>
        </article>
      `

      const searchInput = left.querySelector<HTMLInputElement>('.comm-search')!
      const list = left.querySelector<HTMLElement>('.comm-list')!
      const count = left.querySelector<HTMLElement>('.comm-section-count')!
      const addButton = left.querySelector<HTMLButtonElement>('button')!
      const title = right.querySelector<HTMLElement>('.comm-contact-title')!
      const summary = right.querySelector<HTMLElement>('.comm-contact-summary')!
      const avatar = right.querySelector<HTMLElement>('.comm-avatar')!
      const deleteButton = right.querySelector<HTMLButtonElement>('button')!
      const nameInput = right.querySelector<HTMLInputElement>('.comm-contact-name')!
      const phoneInput = right.querySelector<HTMLInputElement>('.comm-contact-phone')!
      const facetimeInput = right.querySelector<HTMLInputElement>('.comm-contact-facetime')!
      const emailInput = right.querySelector<HTMLInputElement>('.comm-contact-email')!
      const noteInput = right.querySelector<HTMLTextAreaElement>('.comm-contact-note')!
      const favoriteInput = right.querySelector<HTMLInputElement>('.comm-contact-favorite')!
      const status = right.querySelector<HTMLElement>('.comm-save-status')!

      function selectedContact() {
        return contacts.find(contact => contact.id === selectedId) ?? null
      }

      function persist() {
        saveContacts(contacts)
        status.textContent = 'Saved.'
      }

      function upsertContact(contact: Contact) {
        const index = contacts.findIndex(item => item.id === contact.id)
        if (index >= 0) contacts[index] = contact
        else contacts.unshift(contact)
        contacts.sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name))
        selectedId = contact.id
        persist()
      }

      function renderList() {
        list.replaceChildren()
        const filtered = contacts.filter(contact => matchContact(contact, query))
        count.textContent = `${filtered.length} shown`
        if (filtered.length === 0) {
          const empty = document.createElement('p')
          empty.className = 'comm-empty'
          empty.textContent = 'No contacts match that search.'
          list.append(empty)
          return
        }
        for (const contact of filtered) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'comm-list-item'
          button.setAttribute('aria-selected', String(contact.id === selectedId))
          button.innerHTML = `
            <span class="comm-avatar" aria-hidden="true"></span>
            <span class="comm-list-copy">
              <strong></strong>
              <small></small>
            </span>
            <span class="comm-list-meta">${contact.favorite ? '★' : ''}</span>
          `
          const avatar = button.querySelector('.comm-avatar')!
          avatar.textContent = initials(contact.name)
          button.querySelector('strong')!.textContent = contact.name
          button.querySelector('small')!.textContent = contactDisplay(contact)
          button.addEventListener('click', () => {
            selectedId = contact.id
            render()
            nameInput.focus()
          })
          list.append(button)
        }
      }

      function renderEditor() {
        const contact = selectedContact()
        const hasContact = Boolean(contact)
        title.textContent = hasContact ? 'Contact' : 'No contact selected'
        deleteButton.disabled = !hasContact
        nameInput.disabled = !hasContact
        phoneInput.disabled = !hasContact
        facetimeInput.disabled = !hasContact
        emailInput.disabled = !hasContact
        noteInput.disabled = !hasContact
        favoriteInput.disabled = !hasContact
        if (!contact) {
          summary.textContent = 'Create a contact to start building your address book.'
          avatar.textContent = '—'
          nameInput.value = ''
          phoneInput.value = ''
          facetimeInput.value = ''
          emailInput.value = ''
          noteInput.value = ''
          favoriteInput.checked = false
          return
        }
        summary.textContent = contactDisplay(contact)
        avatar.textContent = initials(contact.name)
        nameInput.value = contact.name
        phoneInput.value = contact.phone
        facetimeInput.value = contact.facetime
        emailInput.value = contact.email
        noteInput.value = contact.note
        favoriteInput.checked = contact.favorite
      }

      function render() {
        contacts = parseContacts()
        contacts.sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name))
        if (selectedId && !contacts.some(contact => contact.id === selectedId)) {
          selectedId = contacts[0]?.id ?? null
        }
        renderList()
        renderEditor()
      }

      function saveSelection() {
        const contact = selectedContact()
        if (!contact) return
        upsertContact({
          ...contact,
          name: nameInput.value.trim() || 'Unnamed contact',
          phone: phoneInput.value.trim(),
          facetime: facetimeInput.value.trim(),
          email: emailInput.value.trim(),
          note: noteInput.value.trim(),
          favorite: favoriteInput.checked,
          updatedAt: now(),
        })
        render()
      }

      addButton.addEventListener('click', () => {
        const contact: Contact = {
          id: uuid(),
          name: 'New contact',
          phone: '',
          facetime: '',
          email: '',
          note: '',
          favorite: false,
          updatedAt: now(),
        }
        contacts = [contact, ...contacts]
        selectedId = contact.id
        persist()
        render()
        nameInput.focus()
        nameInput.select()
      })
      deleteButton.addEventListener('click', () => {
        const contact = selectedContact()
        if (!contact) return
        contacts = contacts.filter(item => item.id !== contact.id)
        selectedId = contacts[0]?.id ?? null
        persist()
        render()
      })
      for (const input of [nameInput, phoneInput, facetimeInput, emailInput, noteInput, favoriteInput]) {
        input.addEventListener('input', saveSelection)
        input.addEventListener('change', saveSelection)
      }
      searchInput.addEventListener('input', () => {
        query = searchInput.value
        renderList()
      })
      listen([CONTACTS_KEY], () => {
        contacts = parseContacts()
        if (selectedId && !contacts.some(contact => contact.id === selectedId)) {
          selectedId = contacts[0]?.id ?? null
        }
        render()
      })

      render()
      return { left, right }
    },
  }
}

function createFaceTimeApp(): PhoneApp {
  return {
    id: 'facetime',
    name: 'FaceTime',
    icon: '◔',
    color: '#34c759',
    create() {
      let contacts = parseContacts()
      let recents = parseFaceTimeLog()
      let query = ''
      let selectedContactId: string | null = contacts[0]?.id ?? null
      let active:
        | { id: string; contactId?: string; label: string; handle: string; mode: 'audio' | 'video'; startedAt: number; connectedAt: number | null }
        | null = null
      let connectTimer = 0
      let tickTimer = 0

      const left = document.createElement('section')
      left.className = 'comm-pane comm-facetime-screen comm-facetime-screen--left'
      left.innerHTML = `
        <header class="comm-header">
          <div>
            <h2>FaceTime</h2>
          </div>
          <span class="comm-demo-label">Local demo</span>
        </header>
        <article class="comm-card comm-facetime-hero">
          <div class="comm-facetime-orb" aria-hidden="true">${commSymbol('video')}</div>
          <h3 class="comm-facetime-name">Ready when you are</h3>
          <p class="comm-facetime-status">Choose a person, then start a local call.</p>
        </article>
        <section class="comm-stack">
          <div class="comm-section-head">
            <h3>Recent calls</h3>
            <span class="comm-section-count"></span>
          </div>
          <div class="comm-list" role="listbox" aria-label="FaceTime recents"></div>
        </section>
      `
      const right = document.createElement('section')
      right.className = 'comm-pane comm-facetime-screen comm-facetime-screen--right'
      right.innerHTML = `
        <header class="comm-header">
          <div>
            <h2>New FaceTime</h2>
          </div>
          <div class="comm-segmented" role="tablist" aria-label="Call mode">
            <button class="comm-button comm-button--ghost" type="button" data-mode="video" aria-pressed="true">Video</button>
            <button class="comm-button comm-button--ghost" type="button" data-mode="audio" aria-pressed="false">Audio</button>
          </div>
        </header>
        <label class="comm-field">
          <span class="comm-visually-hidden">Search person or handle</span>
          <input class="comm-input comm-facetime-search" type="search" placeholder="To: Name, email, or number">
        </label>
        <section class="comm-stack">
          <div class="comm-section-head">
            <h3>Suggestions</h3>
          </div>
          <div class="comm-chip-row comm-facetime-chips"></div>
        </section>
        <article class="comm-card comm-facetime-preview">
          <div class="comm-facetime-preview-top">
            <span class="comm-avatar comm-avatar--large" aria-hidden="true"></span>
            <div>
              <h3 class="comm-facetime-target">No one selected</h3>
            </div>
          </div>
          <p class="comm-facetime-copy">Demo call. No camera, microphone, or network connection.</p>
          <div class="comm-call-meta">
            <span>Mode</span>
            <strong class="comm-facetime-mode">Video</strong>
          </div>
          <p class="comm-facetime-live" aria-live="polite">Pick a contact and press start.</p>
        </article>
        <div class="comm-action-row">
          <button class="comm-button comm-button--primary" type="button" data-action="start">Start FaceTime</button>
          <button class="comm-button" type="button" data-action="end">End</button>
        </div>
      `

      const heroName = left.querySelector<HTMLElement>('.comm-facetime-name')!
      const heroStatus = left.querySelector<HTMLElement>('.comm-facetime-status')!
      const recentList = left.querySelector<HTMLElement>('.comm-list')!
      const recentCount = left.querySelector<HTMLElement>('.comm-section-count')!
      const searchInput = right.querySelector<HTMLInputElement>('.comm-facetime-search')!
      const chips = right.querySelector<HTMLElement>('.comm-facetime-chips')!
      const target = right.querySelector<HTMLElement>('.comm-facetime-target')!
      const previewAvatar = right.querySelector<HTMLElement>('.comm-avatar')!
      const previewMode = right.querySelector<HTMLElement>('.comm-facetime-mode')!
      const previewLive = right.querySelector<HTMLElement>('.comm-facetime-live')!
      const modeButtons = [...right.querySelectorAll<HTMLButtonElement>('[data-mode]')]
      const startButton = right.querySelector<HTMLButtonElement>('[data-action="start"]')!
      const endButton = right.querySelector<HTMLButtonElement>('[data-action="end"]')!

      function selectedContact() {
        return selectedContactId ? contacts.find(contact => contact.id === selectedContactId) ?? null : null
      }

      function renderSuggestions() {
        chips.replaceChildren()
        const list = contacts.filter(contact => matchContact(contact, query)).slice(0, 6)
        for (const contact of list) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'comm-chip'
          button.setAttribute('aria-pressed', String(contact.id === selectedContactId))
          button.innerHTML = `
            <span class="comm-avatar" aria-hidden="true"></span>
            <span>
              <strong></strong>
              <small></small>
            </span>
          `
          button.querySelector('.comm-avatar')!.textContent = initials(contact.name)
          button.querySelector('strong')!.textContent = contact.name
          button.querySelector('small')!.textContent = contact.facetime || contact.phone
          button.addEventListener('click', () => {
            selectedContactId = contact.id
            query = contact.name
            searchInput.value = query
            render()
          })
          chips.append(button)
        }
      }

      function renderRecents() {
        recentList.replaceChildren()
        recentCount.textContent = `${recents.length} saved`
        for (const log of recents.slice(0, 8)) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'comm-list-item'
          button.innerHTML = `
            <span class="comm-avatar" aria-hidden="true"></span>
            <span class="comm-list-copy">
              <strong></strong>
              <small></small>
            </span>
            <span class="comm-list-meta"></span>
          `
          button.querySelector('.comm-avatar')!.textContent = initials(log.label)
          button.querySelector('strong')!.textContent = log.label
          button.querySelector('small')!.textContent = log.handle
          button.querySelector('.comm-list-meta')!.textContent = `${log.mode} · ${log.status === 'missed' ? 'missed' : formatDuration(log.duration)}`
          button.addEventListener('click', () => {
            query = log.label
            searchInput.value = query
            selectedContactId = log.contactId ?? selectedContactId
            render()
          })
          recentList.append(button)
        }
      }

      function renderPreview() {
        const contact = selectedContact()
        const label = active?.label ?? contact?.name ?? 'No one selected'
        const handle = active?.handle ?? contact?.facetime ?? contact?.phone ?? 'Pick a contact and press start.'
        heroName.textContent = active ? `Calling ${label}` : label
        heroStatus.textContent = active
          ? (active.connectedAt ? 'Connected locally.' : 'Ringing locally.')
          : contact?.note || 'Choose a person, then start a local call.'
        target.textContent = label
        previewAvatar.textContent = initials(label || 'FT')
        previewMode.textContent = active?.mode ?? (modeButtons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.mode === 'audio' ? 'Audio' : 'Video')
        previewLive.textContent = active
          ? `${handle} · ${formatDuration((active.connectedAt ?? now()) - active.startedAt)}`
          : contact ? `${handle}` : 'Pick a contact and press start.'
        startButton.innerHTML = `${commSymbol(previewMode.textContent.toLowerCase() === 'audio' ? 'phone' : 'video')} ${active ? 'Calling…' : 'FaceTime'}`
        startButton.disabled = Boolean(active)
        endButton.disabled = !active
      }

      function finishCall(status: FaceTimeLog['status']) {
        if (!active) return
        window.clearTimeout(connectTimer)
        window.clearInterval(tickTimer)
        const connectedAt = active.connectedAt ?? active.startedAt
        const duration = status === 'connected' ? now() - connectedAt : 0
        recents = [{
          id: uuid(),
          contactId: active.contactId,
          label: active.label,
          handle: active.handle,
          mode: active.mode,
          startedAt: active.startedAt,
          duration,
          status,
        }, ...recents].slice(0, 20)
        saveFaceTimeLog(recents)
        active = null
        render()
      }

      function startCall() {
        if (active) return
        const contact = selectedContact() ?? resolveContact(contacts, query)
        if (!contact && !query.trim()) return
        const label = contact?.name ?? query.trim()
        const handle = contact?.facetime || contact?.phone || query.trim()
        const mode = (modeButtons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.mode ?? 'video') as 'audio' | 'video'
        window.clearTimeout(connectTimer)
        window.clearInterval(tickTimer)
        active = { id: uuid(), contactId: contact?.id, label, handle, mode, startedAt: now(), connectedAt: null }
        connectTimer = window.setTimeout(() => {
          if (!active) return
          active.connectedAt = now()
          renderPreview()
        }, 600)
        tickTimer = window.setInterval(renderPreview, 1000)
        render()
      }

      for (const button of modeButtons) {
        button.addEventListener('click', () => {
          for (const item of modeButtons) item.setAttribute('aria-pressed', String(item === button))
          renderPreview()
        })
      }
      searchInput.addEventListener('input', () => {
        query = searchInput.value
        const match = resolveContact(contacts, query)
        if (match) selectedContactId = match.id
        renderSuggestions()
        renderPreview()
      })
      startButton.addEventListener('click', startCall)
      endButton.addEventListener('click', () => finishCall(active?.connectedAt ? 'connected' : 'missed'))
      listen([CONTACTS_KEY, FACETIME_KEY], () => {
        contacts = parseContacts()
        recents = parseFaceTimeLog()
        if (selectedContactId && !contacts.some(contact => contact.id === selectedContactId)) {
          selectedContactId = contacts[0]?.id ?? null
        }
        render()
      })

      function render() {
        contacts = parseContacts()
        recents = parseFaceTimeLog()
        renderSuggestions()
        renderRecents()
        renderPreview()
      }

      render()
      return { left, right }
    },
  }
}

function createMessagesApp(): PhoneApp {
  return {
    id: 'messages',
    name: 'Messages',
    icon: '◌',
    color: '#34c759',
    create() {
      let contacts = parseContacts()
      let threads = parseThreads()
      let query = ''
      let selectedThreadId = threads[0]?.id ?? null

      const left = document.createElement('section')
      left.className = 'comm-pane comm-messages-screen comm-messages-screen--left'
      left.innerHTML = `
        <header class="comm-header">
          <div>
            <h2>Messages</h2>
          </div>
          <button class="comm-button comm-button--ghost comm-icon-button" type="button" aria-label="New message">${commSymbol('compose')}</button>
        </header>
        <label class="comm-field">
          <span class="comm-visually-hidden">Search conversations</span>
          <input class="comm-input comm-search" type="search" placeholder="Search">
        </label>
        <form class="comm-inline-form">
          <label class="comm-field">
            <span class="comm-visually-hidden">Start a conversation</span>
            <input class="comm-input comm-new-thread" type="search" placeholder="To: Name, phone, or handle">
          </label>
          <button class="comm-button" type="submit">Start</button>
        </form>
        <section class="comm-stack">
          <div class="comm-section-head">
            <h3>All Messages</h3>
            <span class="comm-section-count"></span>
          </div>
          <div class="comm-list" role="listbox" aria-label="Conversations"></div>
        </section>
      `
      const right = document.createElement('section')
      right.className = 'comm-pane comm-messages-screen comm-messages-screen--right'
      right.innerHTML = `
        <header class="comm-header">
          <div>
            <span class="comm-avatar comm-thread-avatar" aria-hidden="true"></span>
            <h2 class="comm-thread-name">Select a conversation</h2>
          </div>
          <span class="comm-pill comm-thread-meta">Local only</span>
        </header>
        <article class="comm-card comm-thread-card">
          <div class="comm-thread-stream" aria-live="polite"></div>
          <form class="comm-composer">
            <label class="comm-field">
              <span class="comm-visually-hidden">Message</span>
              <textarea class="comm-textarea comm-message-input" rows="1" placeholder="iMessage (local demo)"></textarea>
            </label>
            <button class="comm-button comm-button--primary" type="submit" aria-label="Send message"><svg class="comm-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button>
          </form>
        </article>
      `

      const searchInput = left.querySelector<HTMLInputElement>('.comm-search')!
      const newThreadInput = left.querySelector<HTMLInputElement>('.comm-new-thread')!
      const newThreadForm = left.querySelector<HTMLFormElement>('.comm-inline-form')!
      const newChatButton = left.querySelector<HTMLButtonElement>('button')!
      const list = left.querySelector<HTMLElement>('.comm-list')!
      const count = left.querySelector<HTMLElement>('.comm-section-count')!
      const threadName = right.querySelector<HTMLElement>('.comm-thread-name')!
      const threadMeta = right.querySelector<HTMLElement>('.comm-thread-meta')!
      const stream = right.querySelector<HTMLElement>('.comm-thread-stream')!
      const composer = right.querySelector<HTMLFormElement>('.comm-composer')!
      const messageInput = right.querySelector<HTMLTextAreaElement>('.comm-message-input')!
      const sendButton = right.querySelector<HTMLButtonElement>('.comm-composer .comm-button')!

      function selectedThread() {
        return threads.find(thread => thread.id === selectedThreadId) ?? null
      }

      function resolveThreadLabel(thread: Thread) {
        return resolveContact(contacts, thread.address)?.name ?? thread.label
      }

      function upsertThread(thread: Thread) {
        const index = threads.findIndex(item => item.id === thread.id)
        if (index >= 0) threads[index] = thread
        else threads.unshift(thread)
        threads.sort((a, b) => b.updatedAt - a.updatedAt)
        saveThreads(threads)
      }

      function renderList() {
        list.replaceChildren()
        const filtered = threads
          .filter(thread => {
            const matchText = [thread.label, thread.address, ...thread.messages.map(message => message.text)].join(' ')
            return matchText.toLowerCase().includes(query.trim().toLowerCase())
          })
          .sort((a, b) => b.updatedAt - a.updatedAt)
        count.textContent = `${filtered.length} threads`
        if (filtered.length === 0) {
          const empty = document.createElement('p')
          empty.className = 'comm-empty'
          empty.textContent = 'No conversations match that search.'
          list.append(empty)
          return
        }
        for (const thread of filtered) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'comm-list-item'
          button.setAttribute('aria-selected', String(thread.id === selectedThreadId))
          const lastMessage = thread.messages[thread.messages.length - 1]
          button.innerHTML = `
            <span class="comm-avatar" aria-hidden="true"></span>
            <span class="comm-list-copy">
              <strong></strong>
              <small></small>
            </span>
            <span class="comm-list-meta">
              <time>${formatTime(thread.updatedAt)}</time>
              <span class="comm-badge">${thread.unread || ''}</span>
            </span>
          `
          button.querySelector('.comm-avatar')!.textContent = initials(resolveThreadLabel(thread))
          button.querySelector('strong')!.textContent = resolveThreadLabel(thread)
          button.querySelector('small')!.textContent = lastMessage?.text ?? thread.address
          const badge = button.querySelector<HTMLElement>('.comm-badge')!
          badge.hidden = !thread.unread
          badge.textContent = thread.unread ? String(thread.unread) : ''
          button.addEventListener('click', () => {
            selectedThreadId = thread.id
            thread.unread = 0
            thread.draft = ''
            saveThreads(threads)
            render()
            messageInput.focus()
          })
          list.append(button)
        }
      }

      function renderThread() {
        const thread = selectedThread()
        const hasThread = Boolean(thread)
        threadName.textContent = hasThread ? resolveThreadLabel(thread!) : 'Select a conversation'
        right.querySelector('.comm-thread-avatar')!.textContent = hasThread ? initials(resolveThreadLabel(thread!)) : ''
        threadMeta.textContent = hasThread ? thread!.address : 'Local only'
        messageInput.disabled = !hasThread
        sendButton.disabled = !hasThread
        if (!thread) {
          stream.innerHTML = `
            <p class="comm-empty comm-thread-empty">Pick a conversation to read the latest messages, or start a new one from the inbox.</p>
          `
          messageInput.value = ''
          return
        }
        messageInput.value = thread.draft
        stream.replaceChildren()
        for (const message of thread.messages) {
          const bubble = document.createElement('article')
          bubble.className = `comm-bubble comm-bubble--${message.from}`
          bubble.innerHTML = `
            <p></p>
            <time></time>
          `
          bubble.querySelector('p')!.textContent = message.text
          bubble.querySelector('time')!.textContent = formatTime(message.at)
          stream.append(bubble)
        }
        requestAnimationFrame(() => {
          stream.scrollTop = stream.scrollHeight
        })
      }

      function render() {
        contacts = parseContacts()
        threads = parseThreads()
        if (selectedThreadId && !threads.some(thread => thread.id === selectedThreadId)) {
          selectedThreadId = threads[0]?.id ?? null
        }
        renderList()
        renderThread()
      }

      function sendMessage(text: string) {
        const thread = selectedThread()
        if (!thread) return
        const message: Message = { id: uuid(), from: 'me', text, at: now() }
        thread.messages = [...thread.messages, message]
        thread.draft = ''
        thread.updatedAt = message.at
        thread.unread = 0
        upsertThread(thread)
        render()
        window.setTimeout(() => {
          const current = threads.find(item => item.id === thread.id)
          if (!current) return
          const replies = [
            'Perfect — thanks.',
            'Got it locally.',
            'That works for me.',
            'Sounds good.',
          ]
          const replyText = text.includes('?')
            ? 'Yes — absolutely.'
            : replies[text.length % replies.length]
          current.messages = [...current.messages, { id: uuid(), from: 'them', text: replyText, at: now() }]
          current.updatedAt = now()
          if (current.id !== selectedThreadId) current.unread += 1
          upsertThread(current)
          render()
        }, 700)
      }

      newChatButton.addEventListener('click', () => {
        newThreadInput.focus()
        newThreadInput.select()
      })
      newThreadForm.addEventListener('submit', event => {
        event.preventDefault()
        const entry = newThreadInput.value.trim()
        if (!entry) return
        const contact = resolveContact(contacts, entry)
        const existing = threads.find(thread => thread.contactId === contact?.id || normalizePhone(thread.address) === normalizePhone(entry) || thread.label.trim().toLowerCase() === entry.toLowerCase())
        if (existing) {
          selectedThreadId = existing.id
          render()
          messageInput.focus()
          return
        }
        const thread: Thread = {
          id: uuid(),
          contactId: contact?.id,
          label: contact?.name ?? entry,
          address: contact?.phone ?? entry,
          messages: [],
          unread: 0,
          draft: '',
          updatedAt: now(),
        }
        threads = [thread, ...threads]
        selectedThreadId = thread.id
        saveThreads(threads)
        newThreadInput.value = ''
        render()
        messageInput.focus()
      })
      searchInput.addEventListener('input', () => {
        query = searchInput.value
        renderList()
      })
      composer.addEventListener('submit', event => {
        event.preventDefault()
        const text = messageInput.value.trim()
        if (!text) return
        sendMessage(text)
      })
      messageInput.addEventListener('input', () => {
        const thread = selectedThread()
        if (!thread) return
        thread.draft = messageInput.value
        thread.updatedAt = now()
        saveThreads(threads)
      })
      listen([CONTACTS_KEY, THREADS_KEY], () => {
        contacts = parseContacts()
        threads = parseThreads()
        if (selectedThreadId && !threads.some(thread => thread.id === selectedThreadId)) {
          selectedThreadId = threads[0]?.id ?? null
        }
        render()
      })

      render()
      return { left, right }
    },
  }
}

export const phoneApp = createPhoneApp()
export const contactsApp = createContactsApp()
export const faceTimeApp = createFaceTimeApp()
export const messagesApp = createMessagesApp()

export const communicationApps: PhoneApp[] = [
  phoneApp,
  contactsApp,
  faceTimeApp,
  messagesApp,
]
