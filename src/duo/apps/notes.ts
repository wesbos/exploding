import type { PhoneApp } from './types'

interface Note {
  id: string
  title: string
  body: string
  updatedAt: number
}

const storageKey = 'phone-notes'

function createStarterNotes(): Note[] {
  const now = Date.now()
  return [
    {
      id: crypto.randomUUID(),
      title: 'Welcome to Notes',
      body: 'A little more room for your thoughts.\n\nChoose a note on the left, then write across the fold.',
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      title: 'Weekend ideas',
      body: 'Walk by the water\nTry the new coffee place\nCall Mom',
      updatedAt: now - 86_400_000,
    },
  ]
}

function readNotes() {
  const saved = localStorage.getItem(storageKey)
  if (!saved) return createStarterNotes()
  const value: unknown = JSON.parse(saved)
  if (!Array.isArray(value)) throw new Error('Saved notes are not an array')
  return value.filter((note): note is Note => (
    typeof note === 'object'
    && note !== null
    && typeof note.id === 'string'
    && typeof note.title === 'string'
    && typeof note.body === 'string'
    && typeof note.updatedAt === 'number'
  ))
}

function noteSummary(note: Note) {
  return note.body.trim().replace(/\s+/g, ' ') || 'No additional text'
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  const today = new Date()
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export const notesApp: PhoneApp = {
  id: 'notes',
  name: 'Notes',
  icon: '\u270e',
  color: '#e3b341',
  create() {
    const left = document.createElement('section')
    left.className = 'notes-sidebar'
    left.innerHTML = `
      <div class="notes-heading">
        <h2>Notes</h2>
        <button class="notes-new" type="button" aria-label="Create a new note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M10 14l1-4L20 1l3 3-9 9z"/></svg></button>
      </div>
      <label class="notes-search"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="m12 12 5 5"/></svg><span class="visually-hidden">Search notes</span><input type="search" placeholder="Search" autocomplete="off"></label>
      <h3 class="notes-section-title">All Notes</h3>
      <div class="notes-list" role="listbox" aria-label="Notes"></div>
      <p class="notes-count"></p>
    `
    const right = document.createElement('section')
    right.className = 'notes-editor'
    right.innerHTML = `
      <div class="notes-editor-toolbar">
        <span class="notes-saved" role="status">Saved</span>
        <button class="notes-delete" type="button" aria-label="Delete note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg></button>
      </div>
      <label class="notes-title-label">
        <span class="visually-hidden">Note title</span>
        <input class="notes-title" type="text" maxlength="80" placeholder="Title">
      </label>
      <label class="notes-body-label">
        <span class="visually-hidden">Note text</span>
        <textarea class="notes-body" placeholder="Start writing..." spellcheck="true"></textarea>
      </label>
      <p class="notes-empty">Create a note to start writing.</p>
    `

    const list = left.querySelector<HTMLElement>('.notes-list')!
    const title = right.querySelector<HTMLInputElement>('.notes-title')!
    const body = right.querySelector<HTMLTextAreaElement>('.notes-body')!
    const editor = right.querySelector<HTMLElement>('.notes-editor') ?? right
    const empty = right.querySelector<HTMLElement>('.notes-empty')!
    const deleteButton = right.querySelector<HTMLButtonElement>('.notes-delete')!
    const saved = right.querySelector<HTMLElement>('.notes-saved')!
    const search = left.querySelector<HTMLInputElement>('.notes-search input')!
    let notes = readNotes()
    let selectedId = notes[0]?.id ?? null

    function selectedNote() {
      return notes.find(note => note.id === selectedId)
    }

    function persist() {
      localStorage.setItem(storageKey, JSON.stringify(notes))
      saved.textContent = 'Saved'
    }

    function renderList() {
      list.replaceChildren()
      const query = search.value.trim().toLowerCase()
      const sorted = notes.filter(note => `${note.title}\n${note.body}`.toLowerCase().includes(query)).sort((a, b) => b.updatedAt - a.updatedAt)
      left.querySelector('.notes-count')!.textContent = `${sorted.length} ${sorted.length === 1 ? 'Note' : 'Notes'}`
      for (const note of sorted) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'notes-list-item'
        button.setAttribute('role', 'option')
        button.setAttribute('aria-selected', String(note.id === selectedId))
        button.innerHTML = `
          <strong></strong>
          <span class="notes-list-meta"><time></time><span></span></span>
        `
        button.querySelector('strong')!.textContent = note.title.trim() || 'New note'
        button.querySelector('time')!.textContent = formatDate(note.updatedAt)
        button.querySelector('.notes-list-meta span')!.textContent = noteSummary(note)
        button.addEventListener('click', () => {
          selectedId = note.id
          render()
          title.focus()
        })
        list.append(button)
      }
    }

    function renderEditor() {
      const note = selectedNote()
      right.classList.toggle('is-empty', !note)
      title.disabled = !note
      body.disabled = !note
      deleteButton.disabled = !note
      title.value = note?.title ?? ''
      body.value = note?.body ?? ''
      editor.hidden = false
      empty.hidden = Boolean(note)
    }

    function render() {
      renderList()
      renderEditor()
    }

    function updateNote() {
      const note = selectedNote()
      if (!note) return
      note.title = title.value
      note.body = body.value
      note.updatedAt = Date.now()
      saved.textContent = 'Saving\u2026'
      persist()
      renderList()
    }

    left.querySelector<HTMLButtonElement>('.notes-new')!.addEventListener('click', () => {
      const note: Note = {
        id: crypto.randomUUID(),
        title: '',
        body: '',
        updatedAt: Date.now(),
      }
      notes.push(note)
      search.value = ''
      selectedId = note.id
      persist()
      render()
      title.focus()
    })
    title.addEventListener('input', updateNote)
    search.addEventListener('input', renderList)
    body.addEventListener('input', updateNote)
    deleteButton.addEventListener('click', () => {
      const index = notes.findIndex(note => note.id === selectedId)
      if (index < 0) return
      notes.splice(index, 1)
      selectedId = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? null
      persist()
      render()
    })

    render()
    return { left, right }
  },
}
