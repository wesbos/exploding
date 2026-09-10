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
        <div>
          <p class="phone-eyebrow">YOUR THOUGHTS, UNFOLDED</p>
          <h2>Notes</h2>
        </div>
        <button class="notes-new" type="button" aria-label="Create a new note">+</button>
      </div>
      <div class="notes-list" role="listbox" aria-label="Notes"></div>
    `
    const right = document.createElement('section')
    right.className = 'notes-editor'
    right.innerHTML = `
      <div class="notes-editor-toolbar">
        <span class="notes-saved" role="status">Saved</span>
        <button class="notes-delete" type="button">Delete</button>
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
      const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
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
      selectedId = note.id
      persist()
      render()
      title.focus()
    })
    title.addEventListener('input', updateNote)
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
