import type { AppInstance, PhoneApp } from './types'
import './creation.css'

type FileKind = 'folder' | 'file'
type FreeformKind = 'card' | 'doodle'
type Mood = 'energized' | 'focused' | 'calm' | 'reflective' | 'tired' | 'grateful'

interface FileNode {
  id: string
  parentId: string | null
  kind: FileKind
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

interface FreeformItem {
  id: string
  kind: FreeformKind
  x: number
  y: number
  width: number
  height: number
  color: string
  text: string
  glyph: string
  rotation: number
  updatedAt: number
}

interface JournalEntry {
  id: string
  title: string
  body: string
  mood: Mood
  createdAt: number
  updatedAt: number
}

interface VoiceMemo {
  id: string
  name: string
  duration: number
  createdAt: number
  updatedAt: number
}

const dateTimeFormatter = new Intl.DateTimeFormat([], {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const shortDateFormatter = new Intl.DateTimeFormat([], {
  month: 'short',
  day: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat([], {
  hour: 'numeric',
  minute: '2-digit',
})

function uid() {
  return crypto.randomUUID()
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function formatDateTime(value: number) {
  return dateTimeFormatter.format(new Date(value))
}

function formatShortDate(value: number) {
  return shortDateFormatter.format(new Date(value))
}

function formatTime(value: number) {
  return timeFormatter.format(new Date(value))
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const remainder = total % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, char => char.toUpperCase())
}

function safeParse<T>(storageKey: string, fallback: T, validate: (value: unknown) => value is T): T {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    return validate(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function persist<T>(storageKey: string, value: T) {
  localStorage.setItem(storageKey, JSON.stringify(value))
}

function ancestorIds(nodes: FileNode[], id: string | null) {
  const ids: string[] = []
  let current = id
  while (current) {
    ids.unshift(current)
    current = nodes.find(node => node.id === current)?.parentId ?? null
  }
  return ids
}

function pathParts(nodes: FileNode[], id: string) {
  return ancestorIds(nodes, id).map(nodeId => nodes.find(node => node.id === nodeId)?.name ?? 'Unknown')
}

function nextName(existing: string[], base: string) {
  if (!existing.includes(base)) return base
  let index = 2
  while (existing.includes(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

function fileIcon(node: FileNode) {
  return node.kind === 'folder'
    ? '<svg viewBox="0 0 40 32" aria-hidden="true"><path d="M2 7V5a3 3 0 0 1 3-3h10l4 4h16a3 3 0 0 1 3 3v2H2z" fill="#66b5ff"/><rect x="2" y="8" width="36" height="22" rx="3" fill="#007aff"/></svg>'
    : '<svg viewBox="0 0 32 38" aria-hidden="true"><path d="M5 1h15l8 8v28H5z" fill="#fff" stroke="#c7c7cc"/><path d="M20 1v9h8M10 18h13M10 23h13M10 28h9" fill="none" stroke="#a1a1a6" stroke-width="1.5"/></svg>'
}

function createStarterFiles(): FileNode[] {
  const now = Date.now()
  const rootProject = uid()
  const drafts = uid()
  const travel = uid()
  const images = uid()
  return [
    {
      id: rootProject,
      parentId: null,
      kind: 'folder',
      name: 'Projects',
      content: '',
      createdAt: now - 86_400_000,
      updatedAt: now - 60_000,
    },
    {
      id: drafts,
      parentId: rootProject,
      kind: 'folder',
      name: 'Drafts',
      content: '',
      createdAt: now - 85_000_000,
      updatedAt: now - 70_000,
    },
    {
      id: uid(),
      parentId: rootProject,
      kind: 'file',
      name: 'README.txt',
      content: 'Drop finished work here, then tap through to keep the stack tidy.',
      createdAt: now - 84_000_000,
      updatedAt: now - 10_000,
    },
    {
      id: uid(),
      parentId: drafts,
      kind: 'file',
      name: 'Launch notes.txt',
      content: '1. Clear the slate\n2. Add the work\n3. Ship the better version.',
      createdAt: now - 83_000_000,
      updatedAt: now - 12_000,
    },
    {
      id: travel,
      parentId: null,
      kind: 'folder',
      name: 'Travel',
      content: '',
      createdAt: now - 82_000_000,
      updatedAt: now - 30_000,
    },
    {
      id: images,
      parentId: travel,
      kind: 'file',
      name: 'Packing list.md',
      content: '- charger\n- headphones\n- one extra notebook',
      createdAt: now - 81_000_000,
      updatedAt: now - 20_000,
    },
    {
      id: uid(),
      parentId: null,
      kind: 'file',
      name: 'Inbox.txt',
      content: 'A tiny place for things that do not belong anywhere else yet.',
      createdAt: now - 80_000_000,
      updatedAt: now - 15_000,
    },
  ]
}

function validateFiles(value: unknown): value is FileNode[] {
  return Array.isArray(value) && value.every(entry => isRecord(entry)
    && typeof entry.id === 'string'
    && (entry.parentId === null || typeof entry.parentId === 'string')
    && (entry.kind === 'folder' || entry.kind === 'file')
    && typeof entry.name === 'string'
    && typeof entry.content === 'string'
    && typeof entry.createdAt === 'number'
    && typeof entry.updatedAt === 'number')
}

function createFilesApp(): AppInstance {
  const storageKey = 'duo-creation-files'
  let files = safeParse(storageKey, createStarterFiles(), validateFiles)
  let currentFolderId: string | null = null
  let selectedId: string | null = files[0]?.id ?? null
  let searchQuery = ''
  let gridView = false

  const left = document.createElement('section')
  left.className = 'creation-pane creation-files-pane'
  left.innerHTML = `
    <header class="creation-app-header">
      <h2>Browse</h2>
      <button class="creation-chip creation-view-toggle" type="button" aria-label="Show as icons" aria-pressed="false">▦</button>
    </header>
    <div class="creation-toolbar">
      <label class="creation-search">
        <span class="visually-hidden">Search files</span>
        <input class="creation-input creation-search-input" type="search" placeholder="Search" autocomplete="off">
      </label>
      <button class="creation-chip creation-new-folder" type="button">New Folder</button>
      <button class="creation-chip creation-new-file" type="button">New File</button>
    </div>
    <div class="creation-breadcrumbs" aria-label="Current folder"></div>
    <div class="creation-list" role="listbox" aria-label="Files and folders"></div>
    <p class="creation-local-note">On My iPhone · Demo files saved in this browser</p>
  `

  const right = document.createElement('section')
  right.className = 'creation-pane creation-files-pane creation-detail-pane'
  right.innerHTML = `
    <header class="creation-detail-header">
      <div>
        <p class="creation-eyebrow">Info</p>
        <h3 class="creation-detail-title"></h3>
        <p class="creation-detail-meta"></p>
      </div>
      <button class="creation-chip creation-secondary creation-open-folder" type="button">Open folder</button>
    </header>
    <div class="creation-detail-body"></div>
  `

  const searchInput = left.querySelector<HTMLInputElement>('.creation-search-input')!
  const list = left.querySelector<HTMLElement>('.creation-list')!
  const breadcrumbs = left.querySelector<HTMLElement>('.creation-breadcrumbs')!
  const newFolderButton = left.querySelector<HTMLButtonElement>('.creation-new-folder')!
  const newFileButton = left.querySelector<HTMLButtonElement>('.creation-new-file')!
  const detailTitle = right.querySelector<HTMLElement>('.creation-detail-title')!
  const detailMeta = right.querySelector<HTMLElement>('.creation-detail-meta')!
  const detailBody = right.querySelector<HTMLElement>('.creation-detail-body')!
  const openFolderButton = right.querySelector<HTMLButtonElement>('.creation-open-folder')!

  function nodeById(id: string | null) {
    return id ? files.find(node => node.id === id) ?? null : null
  }

  function childrenOf(parentId: string | null) {
    return files
      .filter(node => node.parentId === parentId)
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
        return b.updatedAt - a.updatedAt
      })
  }

  function searchResults() {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return childrenOf(currentFolderId)
    return files
      .filter(node => {
        const haystack = [node.name, node.content, pathParts(files, node.id).join(' / ')].join(' ').toLowerCase()
        return haystack.includes(query)
      })
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1
        return b.updatedAt - a.updatedAt
      })
  }

  function save() {
    persist(storageKey, files)
  }

  function renderBreadcrumbs() {
    const ids = ancestorIds(files, currentFolderId)
    breadcrumbs.replaceChildren()
    const crumbRoot = document.createElement('button')
    crumbRoot.type = 'button'
    crumbRoot.className = 'creation-breadcrumb'
    crumbRoot.textContent = 'On My iPhone'
    crumbRoot.addEventListener('click', () => {
      currentFolderId = null
      renderSidebar()
    })
    breadcrumbs.append(crumbRoot)
    for (const folderId of ids) {
      const separator = document.createElement('span')
      separator.className = 'creation-breadcrumb-separator'
      separator.textContent = '›'
      breadcrumbs.append(separator)
      const folder = nodeById(folderId)
      const crumb = document.createElement('button')
      crumb.type = 'button'
      crumb.className = 'creation-breadcrumb'
      crumb.textContent = folder?.name ?? 'Unknown folder'
      crumb.addEventListener('click', () => {
        currentFolderId = folderId
        renderSidebar()
      })
      breadcrumbs.append(crumb)
    }
  }

  function selectNode(nodeId: string) {
    selectedId = nodeId
    renderSidebar()
    renderDetail()
  }

  function createNode(kind: FileKind) {
    const siblingNames = childrenOf(currentFolderId).map(node => node.name)
    const baseName = kind === 'folder' ? 'New folder' : 'New file.txt'
    const name = nextName(siblingNames, baseName)
    const node: FileNode = {
      id: uid(),
      parentId: currentFolderId,
      kind,
      name,
      content: kind === 'file' ? 'Start writing here.' : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    files = [...files, node]
    selectedId = node.id
    save()
    renderSidebar()
    renderDetail()
  }

  function renderSidebar() {
    searchInput.value = searchQuery
    renderBreadcrumbs()
    const items = searchResults()
    list.replaceChildren()
    if (!items.length) {
      const empty = document.createElement('p')
      empty.className = 'creation-empty'
      empty.textContent = searchQuery.trim() ? 'No matches found.' : 'This folder is empty.'
      list.append(empty)
      return
    }
    for (const node of items) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `creation-list-item creation-list-item--${node.kind}`
      button.setAttribute('role', 'option')
      button.setAttribute('aria-selected', String(node.id === selectedId))
      const title = document.createElement('strong')
      title.textContent = node.name
      const meta = document.createElement('span')
      meta.className = 'creation-list-meta'
      if (searchQuery.trim()) {
        meta.textContent = `${node.kind === 'folder' ? 'Folder' : 'File'} · ${pathParts(files, node.id).join(' / ')}`
      } else if (node.kind === 'folder') {
        meta.textContent = `${childrenOf(node.id).length} item${childrenOf(node.id).length === 1 ? '' : 's'}`
      } else {
        meta.textContent = `${formatShortDate(node.updatedAt)} · ${new Blob([node.content]).size} bytes`
      }
      const icon = document.createElement('span')
      icon.className = 'creation-list-icon'
      icon.innerHTML = fileIcon(node)
      button.append(icon, title, meta)
      button.addEventListener('click', () => {
        if (node.kind === 'folder') currentFolderId = node.id
        selectedId = node.id
        renderSidebar()
        renderDetail()
      })
      list.append(button)
    }
  }

  function renderFolderDetail(folder: FileNode) {
    const children = childrenOf(folder.id)
    detailBody.innerHTML = `
      <label class="creation-field">
        <span>Folder name</span>
        <input class="creation-input creation-node-name" type="text" maxlength="80" value="${folder.name.replaceAll('"', '&quot;')}">
      </label>
      <div class="creation-summary-grid">
        <div class="creation-summary-card"><span>Items</span><strong>${children.length}</strong></div>
        <div class="creation-summary-card"><span>Updated</span><strong>${formatShortDate(folder.updatedAt)}</strong></div>
      </div>
      <div class="creation-subsection">
        <div class="creation-subsection-header">
          <h4>Inside this folder</h4>
          <button class="creation-link creation-open-folder-inline" type="button">Open</button>
        </div>
        <div class="creation-mini-list"></div>
      </div>
    `
    detailTitle.textContent = folder.name
    detailMeta.textContent = `Folder · ${pathParts(files, folder.id).join(' / ')}`
    openFolderButton.hidden = false
    openFolderButton.textContent = currentFolderId === folder.id ? 'Current folder' : 'Open folder'
    openFolderButton.disabled = currentFolderId === folder.id
    const nameInput = detailBody.querySelector<HTMLInputElement>('.creation-node-name')!
    const miniList = detailBody.querySelector<HTMLElement>('.creation-mini-list')!
    const openInline = detailBody.querySelector<HTMLButtonElement>('.creation-open-folder-inline')!
    openInline.addEventListener('click', () => {
      currentFolderId = folder.id
      renderSidebar()
    })
    nameInput.addEventListener('input', () => {
      folder.name = nameInput.value.trim() || 'Untitled folder'
      folder.updatedAt = Date.now()
      save()
      detailTitle.textContent = folder.name
      detailMeta.textContent = `Folder · ${pathParts(files, folder.id).join(' / ')}`
      renderSidebar()
    })
    miniList.replaceChildren()
    if (!children.length) {
      const empty = document.createElement('p')
      empty.className = 'creation-empty creation-empty--inline'
      empty.textContent = 'Drop files in here by creating them from this folder.'
      miniList.append(empty)
      return
    }
    for (const child of children) {
      const row = document.createElement('button')
      row.type = 'button'
      row.className = `creation-mini-row creation-mini-row--${child.kind}`
      row.innerHTML = `
        <span aria-hidden="true">${fileIcon(child)}</span>
        <span>
          <strong></strong>
          <small></small>
        </span>
      `
      row.querySelector('strong')!.textContent = child.name
      row.querySelector('small')!.textContent = child.kind === 'folder' ? 'Folder' : `${new Blob([child.content]).size} bytes`
      row.addEventListener('click', () => selectNode(child.id))
      miniList.append(row)
    }
  }

  function renderFileDetail(file: FileNode) {
    detailBody.innerHTML = `
      <label class="creation-field">
        <span>File name</span>
        <input class="creation-input creation-node-name" type="text" maxlength="120" value="${file.name.replaceAll('"', '&quot;')}">
      </label>
      <label class="creation-field creation-field--fill">
        <span>Content</span>
        <textarea class="creation-textarea creation-file-content" spellcheck="true"></textarea>
      </label>
      <div class="creation-summary-grid">
        <div class="creation-summary-card"><span>Size</span><strong>${file.content.length} chars</strong></div>
        <div class="creation-summary-card"><span>Updated</span><strong>${formatDateTime(file.updatedAt)}</strong></div>
      </div>
      <div class="creation-subsection">
        <div class="creation-subsection-header">
          <h4>Location</h4>
          <button class="creation-link creation-open-parent" type="button">Open parent</button>
        </div>
        <p class="creation-path"></p>
      </div>
    `
    detailTitle.textContent = file.name
    detailMeta.textContent = `File · ${pathParts(files, file.id).join(' / ')}`
    openFolderButton.hidden = true
    const nameInput = detailBody.querySelector<HTMLInputElement>('.creation-node-name')!
    const contentInput = detailBody.querySelector<HTMLTextAreaElement>('.creation-file-content')!
    const path = detailBody.querySelector<HTMLElement>('.creation-path')!
    const openParent = detailBody.querySelector<HTMLButtonElement>('.creation-open-parent')!
    const parent = nodeById(file.parentId)
    path.textContent = parent ? `${parent.name} / ${file.name}` : file.name
    contentInput.value = file.content
    nameInput.addEventListener('input', () => {
      file.name = nameInput.value.trim() || 'Untitled file.txt'
      file.updatedAt = Date.now()
      save()
      detailTitle.textContent = file.name
      detailMeta.textContent = `File · ${pathParts(files, file.id).join(' / ')}`
      renderSidebar()
    })
    contentInput.addEventListener('input', () => {
      file.content = contentInput.value
      file.updatedAt = Date.now()
      save()
      detailMeta.textContent = `File · ${pathParts(files, file.id).join(' / ')}`
      path.textContent = parent ? `${parent.name} / ${file.name}` : file.name
      renderSidebar()
    })
    openParent.addEventListener('click', () => {
      currentFolderId = file.parentId
      renderSidebar()
    })
  }

  function renderDetail() {
    const node = nodeById(selectedId)
    if (!node) {
      detailTitle.textContent = 'Select a file or folder'
      detailMeta.textContent = 'Choose something on the left to inspect or edit it.'
      openFolderButton.hidden = true
      detailBody.innerHTML = '<p class="creation-empty creation-empty--detail">Files open on the right so you can keep the drawer in view.</p>'
      return
    }
    if (node.kind === 'folder') renderFolderDetail(node)
    else renderFileDetail(node)
  }

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value
    renderSidebar()
  })
  left.querySelector<HTMLButtonElement>('.creation-view-toggle')!.addEventListener('click', event => {
    gridView = !gridView
    list.classList.toggle('creation-list--grid', gridView)
    const button = event.currentTarget as HTMLButtonElement
    button.textContent = gridView ? '☰' : '▦'
    button.setAttribute('aria-pressed', String(gridView))
    button.setAttribute('aria-label', gridView ? 'Show as list' : 'Show as icons')
  })
  newFolderButton.addEventListener('click', () => createNode('folder'))
  newFileButton.addEventListener('click', () => createNode('file'))
  openFolderButton.addEventListener('click', () => {
    const node = nodeById(selectedId)
    if (node?.kind === 'folder') {
      currentFolderId = node.id
      renderSidebar()
    }
  })

  renderSidebar()
  renderDetail()

  return {
    left,
    right,
  }
}

const freeformPalette = ['#f6d36b', '#f19c79', '#90c6ff', '#c9a7ff', '#9ed2b7', '#ffd1e8']
const freeformGlyphs = ['✦', '☁', '☼', '✎', '♪', '◌']

function createStarterFreeformItems(): FreeformItem[] {
  const now = Date.now()
  return [
    {
      id: uid(),
      kind: 'card',
      x: 58,
      y: 66,
      width: 162,
      height: 122,
      color: '#f6d36b',
      text: 'Make the map a little bigger than the plan.',
      glyph: '✎',
      rotation: -4,
      updatedAt: now - 40_000,
    },
    {
      id: uid(),
      kind: 'doodle',
      x: 252,
      y: 150,
      width: 124,
      height: 124,
      color: '#90c6ff',
      text: 'soft idea',
      glyph: '☁',
      rotation: 8,
      updatedAt: now - 30_000,
    },
    {
      id: uid(),
      kind: 'card',
      x: 164,
      y: 254,
      width: 172,
      height: 132,
      color: '#c9a7ff',
      text: 'Move things until the shape feels right.',
      glyph: '✦',
      rotation: 3,
      updatedAt: now - 20_000,
    },
  ]
}

function validateFreeform(value: unknown): value is FreeformItem[] {
  return Array.isArray(value) && value.every(entry => isRecord(entry)
    && typeof entry.id === 'string'
    && (entry.kind === 'card' || entry.kind === 'doodle')
    && typeof entry.x === 'number'
    && typeof entry.y === 'number'
    && typeof entry.width === 'number'
    && typeof entry.height === 'number'
    && typeof entry.color === 'string'
    && typeof entry.text === 'string'
    && typeof entry.glyph === 'string'
    && typeof entry.rotation === 'number'
    && typeof entry.updatedAt === 'number')
}

function createFreeformApp(): AppInstance {
  const storageKey = 'duo-creation-freeform'
  let items = safeParse(storageKey, createStarterFreeformItems(), validateFreeform)
  let selectedId: string | null = items[0]?.id ?? null
  let draftKind: FreeformKind = 'card'
  let draftColor = freeformPalette[0]
  let drag: {
    id: string
    offsetX: number
    offsetY: number
    pointerId: number
  } | null = null

  const left = document.createElement('section')
  left.className = 'creation-pane creation-freeform-pane'
  left.innerHTML = `
    <header class="creation-app-header">
      <h2>Untitled</h2>
      <span class="creation-board-app-name">Freeform</span>
    </header>
    <div class="creation-board" aria-label="Freeform board"></div>
    <div class="creation-toolbar creation-toolbar--stacked">
      <div class="creation-kind-toggle" role="group" aria-label="New item type">
        <button class="creation-chip creation-kind-button is-active" type="button" data-kind="card" aria-pressed="true">Note</button>
        <button class="creation-chip creation-kind-button" type="button" data-kind="doodle" aria-pressed="false">Shape</button>
      </div>
      <div class="creation-palette" aria-label="Color palette"></div>
      <div class="creation-toolbar-actions">
        <button class="creation-chip creation-add-item" type="button" aria-label="Add to board">+</button>
        <button class="creation-chip creation-secondary creation-randomize" type="button">Shuffle</button>
      </div>
    </div>
  `

  const right = document.createElement('section')
  right.className = 'creation-pane creation-freeform-pane creation-detail-pane'
  right.innerHTML = `
    <header class="creation-detail-header">
      <div>
        <p class="creation-eyebrow">Format</p>
        <h3 class="creation-detail-title"></h3>
        <p class="creation-detail-meta"></p>
      </div>
      <button class="creation-chip creation-secondary creation-delete-item" type="button">Delete</button>
    </header>
    <div class="creation-detail-body"></div>
  `

  const board = left.querySelector<HTMLElement>('.creation-board')!
  const kindButtons = [...left.querySelectorAll<HTMLButtonElement>('.creation-kind-button')]
  const palette = left.querySelector<HTMLElement>('.creation-palette')!
  const addButton = left.querySelector<HTMLButtonElement>('.creation-add-item')!
  const randomizeButton = left.querySelector<HTMLButtonElement>('.creation-randomize')!
  const detailTitle = right.querySelector<HTMLElement>('.creation-detail-title')!
  const detailMeta = right.querySelector<HTMLElement>('.creation-detail-meta')!
  const detailBody = right.querySelector<HTMLElement>('.creation-detail-body')!
  const deleteButton = right.querySelector<HTMLButtonElement>('.creation-delete-item')!

  function save() {
    persist(storageKey, items)
  }

  function selectedItem() {
    return items.find(item => item.id === selectedId) ?? null
  }

  function selectItem(id: string) {
    selectedId = id
    renderSelectionState()
    renderInspector()
  }

  function renderSelectionState() {
    board.querySelectorAll<HTMLElement>('.creation-board-item').forEach(element => {
      element.classList.toggle('is-selected', element.dataset.id === selectedId)
      element.setAttribute('aria-selected', String(element.dataset.id === selectedId))
    })
  }

  function itemMarkup(item: FreeformItem) {
    const content = item.kind === 'card'
      ? `<span class="creation-board-item-text"></span>`
      : `<span class="creation-board-item-glyph" aria-hidden="true"></span><span class="creation-board-item-caption"></span>`
    return content
  }

  function renderBoard() {
    board.replaceChildren()
    for (const item of items) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `creation-board-item creation-board-item--${item.kind}`
      button.dataset.id = item.id
      button.dataset.kind = item.kind
      button.style.left = `${item.x}px`
      button.style.top = `${item.y}px`
      button.style.width = `${item.width}px`
      button.style.height = `${item.height}px`
      button.style.background = item.color
      button.style.transform = `rotate(${item.rotation}deg)`
      button.setAttribute('aria-label', `${titleCase(item.kind)}: ${item.text || 'Untitled item'}`)
      button.setAttribute('aria-selected', String(item.id === selectedId))
      button.innerHTML = itemMarkup(item)
      if (item.kind === 'card') {
        button.querySelector<HTMLElement>('.creation-board-item-text')!.textContent = item.text || 'Empty card'
      } else {
        button.querySelector<HTMLElement>('.creation-board-item-glyph')!.textContent = item.glyph
        button.querySelector<HTMLElement>('.creation-board-item-caption')!.textContent = item.text || 'Doodle'
      }
      button.addEventListener('click', () => selectItem(item.id))
      button.addEventListener('pointerdown', event => {
        if (event.button !== 0) return
        event.preventDefault()
        const target = event.currentTarget as HTMLElement
        selectItem(item.id)
        const rect = board.getBoundingClientRect()
        drag = {
          id: item.id,
          offsetX: event.clientX - rect.left - item.x,
          offsetY: event.clientY - rect.top - item.y,
          pointerId: event.pointerId,
        }
        target.setPointerCapture(event.pointerId)
      })
      button.addEventListener('keydown', event => {
        const moveBy = event.shiftKey ? 24 : 8
        if (event.key === 'ArrowLeft') { event.preventDefault(); moveItem(item.id, -moveBy, 0) }
        else if (event.key === 'ArrowRight') { event.preventDefault(); moveItem(item.id, moveBy, 0) }
        else if (event.key === 'ArrowUp') { event.preventDefault(); moveItem(item.id, 0, -moveBy) }
        else if (event.key === 'ArrowDown') { event.preventDefault(); moveItem(item.id, 0, moveBy) }
        else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); deleteItem(item.id) }
      })
      board.append(button)
    }
    renderSelectionState()
  }

  function updateBoardItem(item: FreeformItem) {
    const element = board.querySelector<HTMLButtonElement>(`.creation-board-item[data-id="${item.id}"]`)
    if (!element) return
    element.style.left = `${item.x}px`
    element.style.top = `${item.y}px`
    element.style.width = `${item.width}px`
    element.style.height = `${item.height}px`
    element.style.background = item.color
    element.style.transform = `rotate(${item.rotation}deg)`
    element.setAttribute('aria-label', `${titleCase(item.kind)}: ${item.text || 'Untitled item'}`)
    if (item.kind === 'card') {
      element.querySelector<HTMLElement>('.creation-board-item-text')!.textContent = item.text || 'Empty card'
    } else {
      element.querySelector<HTMLElement>('.creation-board-item-glyph')!.textContent = item.glyph
      element.querySelector<HTMLElement>('.creation-board-item-caption')!.textContent = item.text || 'Doodle'
    }
  }

  function clampItem(item: FreeformItem) {
    const width = Math.max(96, item.width)
    const height = Math.max(96, item.height)
    item.width = width
    item.height = height
    item.x = clamp(item.x, 8, Math.max(8, board.clientWidth - width - 8))
    item.y = clamp(item.y, 8, Math.max(8, board.clientHeight - height - 8))
  }

  function moveItem(id: string, dx: number, dy: number) {
    const item = items.find(entry => entry.id === id)
    if (!item) return
    item.x += dx
    item.y += dy
    clampItem(item)
    item.updatedAt = Date.now()
    save()
    updateBoardItem(item)
    renderSelectionState()
    renderInspectorSummary()
  }

  function deleteItem(id: string) {
    const index = items.findIndex(item => item.id === id)
    if (index < 0) return
    items.splice(index, 1)
    selectedId = items[index]?.id ?? items[index - 1]?.id ?? items[0]?.id ?? null
    save()
    renderBoard()
    renderInspector()
  }

  function duplicateItem(item: FreeformItem) {
    const copy: FreeformItem = {
      ...item,
      id: uid(),
      x: item.x + 18,
      y: item.y + 18,
      rotation: item.rotation + 2,
      updatedAt: Date.now(),
    }
    clampItem(copy)
    items = [...items, copy]
    selectedId = copy.id
    save()
    renderBoard()
    renderInspector()
  }

  function createItem(kind: FreeformKind) {
    const centerX = Math.max(24, Math.round(board.clientWidth / 2) - 80)
    const centerY = Math.max(24, Math.round(board.clientHeight / 2) - 64)
    const item: FreeformItem = {
      id: uid(),
      kind,
      x: clamp(centerX + (items.length % 3) * 22, 8, Math.max(8, board.clientWidth - 180)),
      y: clamp(centerY + (items.length % 2) * 20, 8, Math.max(8, board.clientHeight - 160)),
      width: kind === 'card' ? 166 : 126,
      height: kind === 'card' ? 124 : 126,
      color: draftColor,
      text: kind === 'card' ? 'A new note to move around.' : 'fresh doodle',
      glyph: freeformGlyphs[items.length % freeformGlyphs.length],
      rotation: (items.length % 2 === 0 ? -1 : 1) * (4 + items.length % 5),
      updatedAt: Date.now(),
    }
    clampItem(item)
    items = [...items, item]
    selectedId = item.id
    save()
    renderBoard()
    renderInspector()
  }

  function randomizeBoard() {
    items = items.map((item, index) => {
      const next = { ...item }
      next.x = clamp(20 + ((index * 73) % Math.max(80, board.clientWidth - next.width - 40)), 8, Math.max(8, board.clientWidth - next.width - 8))
      next.y = clamp(20 + ((index * 57) % Math.max(80, board.clientHeight - next.height - 40)), 8, Math.max(8, board.clientHeight - next.height - 8))
      next.rotation = item.rotation + (index % 2 === 0 ? -6 : 6)
      next.updatedAt = Date.now()
      clampItem(next)
      return next
    })
    save()
    renderBoard()
    renderInspector()
  }

  function renderPalette() {
    palette.replaceChildren()
    for (const color of freeformPalette) {
      const swatch = document.createElement('button')
      swatch.type = 'button'
      swatch.className = 'creation-swatch'
      swatch.style.background = color
      swatch.dataset.color = color
      swatch.setAttribute('aria-label', `Choose ${color}`)
      swatch.setAttribute('aria-pressed', String(color === draftColor))
      swatch.addEventListener('click', () => {
        draftColor = color
        renderPalette()
      })
      palette.append(swatch)
    }
  }

  function renderInspectorSummary() {
    const item = selectedItem()
    if (!item) {
      detailTitle.textContent = 'Nothing selected'
      detailMeta.textContent = 'Pick a card or doodle to edit it.'
      deleteButton.disabled = true
      detailBody.innerHTML = '<p class="creation-empty creation-empty--detail">Add something to the board, then keep moving it around.</p>'
      return
    }
    detailTitle.textContent = item.kind === 'card' ? 'Card details' : 'Doodle details'
    detailMeta.textContent = `${titleCase(item.kind)} · ${Math.round(item.x)}×${Math.round(item.y)} · ${formatShortDate(item.updatedAt)}`
    deleteButton.disabled = false
  }

  function renderInspector() {
    const item = selectedItem()
    renderInspectorSummary()
    if (!item) return
    detailBody.innerHTML = `
      <label class="creation-field">
        <span>${item.kind === 'card' ? 'Card text' : 'Doodle label'}</span>
        <textarea class="creation-textarea creation-freeform-text" spellcheck="true"></textarea>
      </label>
      <div class="creation-field">
        <span>Color</span>
        <div class="creation-mini-palette"></div>
      </div>
      <div class="creation-field">
        <span>${item.kind === 'doodle' ? 'Glyph' : 'Size'}</span>
        <div class="creation-mini-actions"></div>
      </div>
      <div class="creation-summary-grid">
        <button class="creation-summary-card creation-nudge" data-dx="-12" data-dy="0" type="button"><span>Left</span><strong>←</strong></button>
        <button class="creation-summary-card creation-nudge" data-dx="12" data-dy="0" type="button"><span>Right</span><strong>→</strong></button>
        <button class="creation-summary-card creation-nudge" data-dx="0" data-dy="-12" type="button"><span>Up</span><strong>↑</strong></button>
        <button class="creation-summary-card creation-nudge" data-dx="0" data-dy="12" type="button"><span>Down</span><strong>↓</strong></button>
      </div>
      <div class="creation-summary-grid">
        <button class="creation-chip creation-secondary creation-duplicate-item" type="button">Duplicate</button>
        <button class="creation-chip creation-secondary creation-delete-item-inline" type="button">Delete</button>
      </div>
    `
    const textInput = detailBody.querySelector<HTMLTextAreaElement>('.creation-freeform-text')!
    const miniPalette = detailBody.querySelector<HTMLElement>('.creation-mini-palette')!
    const miniActions = detailBody.querySelector<HTMLElement>('.creation-mini-actions')!
    textInput.value = item.text
    textInput.addEventListener('input', () => {
      item.text = textInput.value
      item.updatedAt = Date.now()
      save()
      updateBoardItem(item)
      renderInspectorSummary()
    })
    miniPalette.replaceChildren()
    for (const color of freeformPalette) {
      const swatch = document.createElement('button')
      swatch.type = 'button'
      swatch.className = 'creation-swatch creation-swatch--small'
      swatch.style.background = color
      swatch.setAttribute('aria-label', `Set color ${color}`)
      swatch.setAttribute('aria-pressed', String(color === item.color))
      swatch.addEventListener('click', () => {
        item.color = color
        item.updatedAt = Date.now()
        save()
        updateBoardItem(item)
        renderInspector()
      })
      miniPalette.append(swatch)
    }
    miniActions.replaceChildren()
    if (item.kind === 'doodle') {
      for (const glyph of freeformGlyphs) {
        const glyphButton = document.createElement('button')
        glyphButton.type = 'button'
        glyphButton.className = 'creation-chip creation-chip--glyph'
        glyphButton.textContent = glyph
        glyphButton.setAttribute('aria-pressed', String(item.glyph === glyph))
        glyphButton.addEventListener('click', () => {
          item.glyph = glyph
          item.updatedAt = Date.now()
          save()
          updateBoardItem(item)
          renderInspector()
        })
        miniActions.append(glyphButton)
      }
    } else {
      const shrink = document.createElement('button')
      shrink.type = 'button'
      shrink.className = 'creation-chip creation-secondary'
      shrink.textContent = 'Smaller'
      shrink.addEventListener('click', () => {
        item.width = clamp(item.width - 12, 110, 260)
        item.height = clamp(item.height - 8, 90, 260)
        item.updatedAt = Date.now()
        clampItem(item)
        save()
        updateBoardItem(item)
        renderInspectorSummary()
      })
      const grow = document.createElement('button')
      grow.type = 'button'
      grow.className = 'creation-chip creation-secondary'
      grow.textContent = 'Bigger'
      grow.addEventListener('click', () => {
        item.width = clamp(item.width + 12, 110, 260)
        item.height = clamp(item.height + 8, 90, 260)
        item.updatedAt = Date.now()
        clampItem(item)
        save()
        updateBoardItem(item)
        renderInspectorSummary()
      })
      miniActions.append(shrink, grow)
    }
    detailBody.querySelectorAll<HTMLButtonElement>('.creation-nudge').forEach(button => {
      button.addEventListener('click', () => moveItem(item.id, Number(button.dataset.dx), Number(button.dataset.dy)))
    })
    detailBody.querySelector<HTMLButtonElement>('.creation-duplicate-item')!.addEventListener('click', () => duplicateItem(item))
    detailBody.querySelector<HTMLButtonElement>('.creation-delete-item-inline')!.addEventListener('click', () => deleteItem(item.id))
  }

  function createSelectedItem() {
    createItem(draftKind)
  }

  kindButtons.forEach(button => {
    button.addEventListener('click', () => {
      draftKind = button.dataset.kind === 'doodle' ? 'doodle' : 'card'
      kindButtons.forEach(entry => {
        entry.classList.toggle('is-active', entry === button)
        entry.setAttribute('aria-pressed', String(entry === button))
      })
    })
  })
  addButton.addEventListener('click', createSelectedItem)
  randomizeButton.addEventListener('click', randomizeBoard)
  deleteButton.addEventListener('click', () => {
    if (selectedId) deleteItem(selectedId)
  })
  board.addEventListener('pointerdown', event => {
    if (event.target === board) {
      selectedId = null
      renderSelectionState()
      renderInspector()
    }
  })
  window.addEventListener('pointermove', event => {
    if (!drag) return
    const item = items.find(entry => entry.id === drag!.id)
    if (!item) return
    const rect = board.getBoundingClientRect()
    item.x = event.clientX - rect.left - drag.offsetX
    item.y = event.clientY - rect.top - drag.offsetY
    clampItem(item)
    item.updatedAt = Date.now()
    updateBoardItem(item)
    renderSelectionState()
    renderInspectorSummary()
    save()
  })
  window.addEventListener('pointerup', () => {
    drag = null
  })

  renderPalette()
  renderBoard()
  renderInspector()

  return {
    left,
    right,
    onKey(event: KeyboardEvent) {
      if (!selectedId) return false
      const item = selectedItem()
      if (!item) return false
      const step = event.shiftKey ? 24 : 8
      if (event.key === 'ArrowLeft') { moveItem(item.id, -step, 0); return true }
      if (event.key === 'ArrowRight') { moveItem(item.id, step, 0); return true }
      if (event.key === 'ArrowUp') { moveItem(item.id, 0, -step); return true }
      if (event.key === 'ArrowDown') { moveItem(item.id, 0, step); return true }
      if (event.key === 'Backspace' || event.key === 'Delete') { deleteItem(item.id); return true }
      return false
    },
  }
}

function createStarterJournalEntries(): JournalEntry[] {
  const now = Date.now()
  return [
    {
      id: uid(),
      title: 'Landing page notes',
      body: 'The best journal entry is the one that catches the thought before it wanders off.',
      mood: 'focused',
      createdAt: now - 86_400_000,
      updatedAt: now - 30_000,
    },
    {
      id: uid(),
      title: 'Afternoon reset',
      body: 'Short walk. Better coffee. Fewer tabs open. The day came back into shape.',
      mood: 'calm',
      createdAt: now - 52_000_000,
      updatedAt: now - 80_000,
    },
    {
      id: uid(),
      title: 'Tiny win',
      body: 'The thing I was avoiding became much smaller once it had a title.',
      mood: 'grateful',
      createdAt: now - 43_000_000,
      updatedAt: now - 42_000,
    },
  ]
}

function validateJournal(value: unknown): value is JournalEntry[] {
  return Array.isArray(value) && value.every(entry => isRecord(entry)
    && typeof entry.id === 'string'
    && typeof entry.title === 'string'
    && typeof entry.body === 'string'
    && typeof entry.mood === 'string'
    && typeof entry.createdAt === 'number'
    && typeof entry.updatedAt === 'number')
}

function createJournalApp(): AppInstance {
  const storageKey = 'duo-creation-journal'
  let entries = safeParse(storageKey, createStarterJournalEntries(), validateJournal)
  let selectedId: string | null = entries[0]?.id ?? null
  let moodFilter: Mood | 'all' = 'all'

  const moodOptions: Array<{ value: Mood; label: string; icon: string }> = [
    { value: 'energized', label: 'Energized', icon: '⚡' },
    { value: 'focused', label: 'Focused', icon: '◎' },
    { value: 'calm', label: 'Calm', icon: '🌿' },
    { value: 'reflective', label: 'Reflective', icon: '☾' },
    { value: 'tired', label: 'Tired', icon: '☕' },
    { value: 'grateful', label: 'Grateful', icon: '✿' },
  ]

  const left = document.createElement('section')
  left.className = 'creation-pane creation-journal-pane'
  left.innerHTML = `
    <header class="creation-app-header">
      <h2>Journal</h2>
    </header>
    <div class="creation-toolbar creation-toolbar--journal">
      <div class="creation-mood-filters" role="group" aria-label="Mood filters"></div>
    </div>
    <div class="creation-list" role="listbox" aria-label="Journal entries"></div>
    <div class="creation-journal-compose"><button class="creation-chip creation-new-entry" type="button" aria-label="New entry">+</button></div>
  `

  const right = document.createElement('section')
  right.className = 'creation-pane creation-journal-pane creation-detail-pane'
  right.innerHTML = `
    <header class="creation-detail-header">
      <div>
        <p class="creation-eyebrow">Entry</p>
        <h3 class="creation-detail-title"></h3>
        <p class="creation-detail-meta"></p>
      </div>
      <button class="creation-chip creation-secondary creation-delete-entry" type="button">Delete</button>
    </header>
    <div class="creation-detail-body"></div>
  `

  const newEntryButton = left.querySelector<HTMLButtonElement>('.creation-new-entry')!
  const moodFilters = left.querySelector<HTMLElement>('.creation-mood-filters')!
  const list = left.querySelector<HTMLElement>('.creation-list')!
  const detailTitle = right.querySelector<HTMLElement>('.creation-detail-title')!
  const detailMeta = right.querySelector<HTMLElement>('.creation-detail-meta')!
  const detailBody = right.querySelector<HTMLElement>('.creation-detail-body')!
  const deleteEntryButton = right.querySelector<HTMLButtonElement>('.creation-delete-entry')!

  function save() {
    persist(storageKey, entries)
  }

  function selectedEntry() {
    return entries.find(entry => entry.id === selectedId) ?? null
  }

  function filteredEntries() {
    return [...entries]
      .filter(entry => moodFilter === 'all' ? true : entry.mood === moodFilter)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  function selectEntry(id: string) {
    selectedId = id
    renderList()
    renderDetail()
  }

  function renderMoodFilters() {
    moodFilters.replaceChildren()
    const chips: Array<{ value: Mood | 'all'; label: string; icon: string }> = [
      { value: 'all', label: 'All', icon: '◌' },
      ...moodOptions,
    ]
    for (const chip of chips) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'creation-chip creation-mood-chip'
      button.textContent = `${chip.icon} ${chip.label}`
      button.setAttribute('aria-pressed', String(moodFilter === chip.value))
      button.addEventListener('click', () => {
        moodFilter = chip.value
        renderMoodFilters()
        renderList()
      })
      moodFilters.append(button)
    }
  }

  function renderList() {
    const items = filteredEntries()
    list.replaceChildren()
    if (!items.length) {
      const empty = document.createElement('p')
      empty.className = 'creation-empty'
      empty.textContent = moodFilter === 'all' ? 'No entries yet.' : 'No entries match this mood.'
      list.append(empty)
      return
    }
    for (const entry of items) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'creation-list-item creation-list-item--journal'
      button.setAttribute('role', 'option')
      button.setAttribute('aria-selected', String(entry.id === selectedId))
      button.innerHTML = `
        <time class="creation-entry-date"></time>
        <span class="creation-list-copy">
          <strong></strong>
          <span class="creation-entry-preview"></span>
          <span class="creation-list-meta"></span>
        </span>
      `
      button.querySelector<HTMLElement>('.creation-entry-date')!.textContent = new Date(entry.createdAt).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
      button.querySelector<HTMLElement>('strong')!.textContent = entry.title.trim() || 'Untitled entry'
      button.querySelector<HTMLElement>('.creation-entry-preview')!.textContent = entry.body || 'Start writing…'
      button.querySelector<HTMLElement>('.creation-list-meta')!.textContent = `${moodOptions.find(option => option.value === entry.mood)?.icon ?? '◌'} ${titleCase(entry.mood)}`
      button.addEventListener('click', () => selectEntry(entry.id))
      list.append(button)
    }
  }

  function createEntry() {
    const now = Date.now()
    const entry: JournalEntry = {
      id: uid(),
      title: `Journal ${formatShortDate(now)}`,
      body: '',
      mood: 'reflective',
      createdAt: now,
      updatedAt: now,
    }
    entries = [entry, ...entries]
    selectedId = entry.id
    save()
    renderMoodFilters()
    renderList()
    renderDetail()
  }

  function updateEntry(entry: JournalEntry, patch: Partial<Pick<JournalEntry, 'title' | 'body' | 'mood'>>) {
    Object.assign(entry, patch, { updatedAt: Date.now() })
    save()
    renderList()
  }

  function renderDetail() {
    const entry = selectedEntry()
    if (!entry) {
      detailTitle.textContent = 'No entry selected'
      detailMeta.textContent = 'Create one on the left to begin writing.'
      deleteEntryButton.disabled = true
      detailBody.innerHTML = '<p class="creation-empty creation-empty--detail">A journal entry fills the right side so you can write without losing the list.</p>'
      return
    }
    detailTitle.textContent = entry.title
    detailMeta.textContent = `${formatDateTime(entry.createdAt)} · ${entry.mood}`
    deleteEntryButton.disabled = false
    detailBody.innerHTML = `
      <label class="creation-field">
        <span>Title</span>
        <input class="creation-input creation-entry-title" type="text" maxlength="100" value="${entry.title.replaceAll('"', '&quot;')}">
      </label>
      <label class="creation-field">
        <span>Mood</span>
        <select class="creation-select creation-entry-mood"></select>
      </label>
      <label class="creation-field creation-field--fill">
        <span>Entry</span>
        <textarea class="creation-textarea creation-entry-body" spellcheck="true"></textarea>
      </label>
      <div class="creation-summary-grid">
        <div class="creation-summary-card"><span>Created</span><strong>${formatShortDate(entry.createdAt)}</strong></div>
        <div class="creation-summary-card"><span>Updated</span><strong>${formatDateTime(entry.updatedAt)}</strong></div>
      </div>
    `
    const titleInput = detailBody.querySelector<HTMLInputElement>('.creation-entry-title')!
    const moodSelect = detailBody.querySelector<HTMLSelectElement>('.creation-entry-mood')!
    const bodyInput = detailBody.querySelector<HTMLTextAreaElement>('.creation-entry-body')!
    bodyInput.value = entry.body
    for (const option of moodOptions) {
      const choice = document.createElement('option')
      choice.value = option.value
      choice.textContent = `${option.icon} ${option.label}`
      moodSelect.append(choice)
    }
    moodSelect.value = entry.mood
    titleInput.addEventListener('input', () => {
      entry.title = titleInput.value
      updateEntry(entry, { title: titleInput.value })
      detailTitle.textContent = entry.title || 'Untitled entry'
      detailMeta.textContent = `${formatDateTime(entry.createdAt)} · ${entry.mood}`
    })
    moodSelect.addEventListener('change', () => {
      entry.mood = moodSelect.value as Mood
      updateEntry(entry, { mood: entry.mood })
      detailMeta.textContent = `${formatDateTime(entry.createdAt)} · ${entry.mood}`
      renderMoodFilters()
    })
    bodyInput.addEventListener('input', () => {
      entry.body = bodyInput.value
      updateEntry(entry, { body: bodyInput.value })
    })
  }

  newEntryButton.addEventListener('click', createEntry)
  deleteEntryButton.addEventListener('click', () => {
    const entry = selectedEntry()
    if (!entry) return
    const index = entries.findIndex(item => item.id === entry.id)
    entries.splice(index, 1)
    selectedId = entries[index]?.id ?? entries[index - 1]?.id ?? entries[0]?.id ?? null
    save()
    renderMoodFilters()
    renderList()
    renderDetail()
  })

  renderMoodFilters()
  renderList()
  renderDetail()

  return {
    left,
    right,
  }
}

function createStarterVoiceMemos(): VoiceMemo[] {
  const now = Date.now()
  return [
    {
      id: uid(),
      name: 'Kitchen idea',
      duration: 14,
      createdAt: now - 86_400_000,
      updatedAt: now - 40_000,
    },
    {
      id: uid(),
      name: 'Reminder for later',
      duration: 8,
      createdAt: now - 52_000_000,
      updatedAt: now - 22_000,
    },
    {
      id: uid(),
      name: 'Tiny voice note',
      duration: 21,
      createdAt: now - 43_000_000,
      updatedAt: now - 10_000,
    },
  ]
}

function validateVoiceMemos(value: unknown): value is VoiceMemo[] {
  return Array.isArray(value) && value.every(entry => isRecord(entry)
    && typeof entry.id === 'string'
    && typeof entry.name === 'string'
    && typeof entry.duration === 'number'
    && typeof entry.createdAt === 'number'
    && typeof entry.updatedAt === 'number')
}

function createVoiceMemosApp(): AppInstance {
  const storageKey = 'duo-creation-voice-memos'
  let memos = safeParse(storageKey, createStarterVoiceMemos(), validateVoiceMemos)
  let selectedId: string | null = memos[0]?.id ?? null
  let recording = false
  let recordingStart = 0
  let recordingElapsed = 0
  let recordingInterval: number | null = null
  let playingId: string | null = null
  let playbackProgress = 0
  let playbackStart = 0
  let playbackInterval: number | null = null

  const left = document.createElement('section')
  left.className = 'creation-pane creation-voice-pane'
  left.innerHTML = `
    <header class="creation-app-header">
      <h2>All Recordings</h2>
    </header>
    <p class="creation-demo-notice">Demo · Simulated recordings and playback. No audio is captured.</p>
    <div class="creation-list" role="listbox" aria-label="Voice memos"></div>
    <div class="creation-toolbar creation-toolbar--voice">
      <button class="creation-chip creation-record" type="button">Record</button>
      <span class="creation-live-status" role="status"></span>
    </div>
  `

  const right = document.createElement('section')
  right.className = 'creation-pane creation-voice-pane creation-detail-pane'
  right.innerHTML = `
    <header class="creation-detail-header">
      <div>
        <p class="creation-eyebrow">Recording</p>
        <h3 class="creation-detail-title"></h3>
        <p class="creation-detail-meta"></p>
      </div>
      <button class="creation-chip creation-secondary creation-delete-memo" type="button">Delete</button>
    </header>
    <div class="creation-detail-body"></div>
  `

  const recordButton = left.querySelector<HTMLButtonElement>('.creation-record')!
  const liveStatus = left.querySelector<HTMLElement>('.creation-live-status')!
  const list = left.querySelector<HTMLElement>('.creation-list')!
  const detailTitle = right.querySelector<HTMLElement>('.creation-detail-title')!
  const detailMeta = right.querySelector<HTMLElement>('.creation-detail-meta')!
  const detailBody = right.querySelector<HTMLElement>('.creation-detail-body')!
  const deleteButton = right.querySelector<HTMLButtonElement>('.creation-delete-memo')!
  let playerTimeEl: HTMLElement | null = null
  let playerFillEl: HTMLElement | null = null
  let playerToggleEl: HTMLButtonElement | null = null

  function save() {
    persist(storageKey, memos)
  }

  function selectedMemo() {
    return memos.find(memo => memo.id === selectedId) ?? null
  }

  function syncPlaybackProgress() {
    const memo = selectedMemo()
    if (!memo) return
    const progress = playingId === memo.id ? playbackProgress : 0
    if (playerTimeEl) playerTimeEl.textContent = `${formatDuration(progress)} / ${formatDuration(memo.duration)}`
    if (playerFillEl) playerFillEl.style.width = `${Math.max(0, Math.min(100, (progress / Math.max(1, memo.duration)) * 100))}%`
    if (playerToggleEl) playerToggleEl.textContent = playingId === memo.id ? 'Pause' : 'Play'
  }

  function beginPlayback(memo: VoiceMemo) {
    stopRecording(false)
    if (playbackInterval !== null) {
      clearInterval(playbackInterval)
      playbackInterval = null
    }
    playingId = memo.id
    playbackProgress = 0
    playbackStart = performance.now()
    renderList()
    renderDetail()
    playbackInterval = window.setInterval(() => {
      const active = selectedMemo()
      if (!active || playingId !== active.id) {
        stopPlayback()
        return
      }
      playbackProgress = (performance.now() - playbackStart) / 1000
      if (playbackProgress >= active.duration) {
        playbackProgress = active.duration
        syncPlaybackProgress()
        stopPlayback()
        return
      }
      syncPlaybackProgress()
    }, 250)
  }

  function stopRecording(saveDraft = true) {
    if (recordingInterval !== null) {
      clearInterval(recordingInterval)
      recordingInterval = null
    }
    if (!recording) return
    recording = false
    const duration = Math.max(1, Math.round(recordingElapsed))
    if (saveDraft) {
      const memo: VoiceMemo = {
        id: uid(),
        name: `Memo ${formatTime(Date.now())}`,
        duration,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      memos = [memo, ...memos]
      selectedId = memo.id
      save()
    }
    recordingElapsed = 0
    updateRecordUI()
    renderList()
    renderDetail()
  }

  function stopPlayback() {
    if (playbackInterval !== null) {
      clearInterval(playbackInterval)
      playbackInterval = null
    }
    playingId = null
    playbackProgress = 0
    renderList()
    renderDetail()
  }

  function updateRecordUI() {
    recordButton.classList.toggle('is-recording', recording)
    recordButton.setAttribute('aria-label', recording ? 'Stop recording' : 'Record')
    if (recording) {
      recordButton.textContent = 'Stop'
      liveStatus.textContent = `Recording ${formatDuration(recordingElapsed)}`
      liveStatus.classList.add('is-recording')
      return
    }
    liveStatus.classList.remove('is-recording')
    recordButton.textContent = 'Record'
    liveStatus.textContent = memos.length ? 'Ready to record' : 'Tap record to make your first memo.'
  }

  function renderDetail() {
    const memo = selectedMemo()
    if (!memo) {
      detailTitle.textContent = 'No memo selected'
      detailMeta.textContent = 'Create or choose a memo on the left.'
      deleteButton.disabled = true
      detailBody.innerHTML = '<p class="creation-empty creation-empty--detail">Voice memos keep a short list on the left and a simple player on the right.</p>'
      playerTimeEl = null
      playerFillEl = null
      playerToggleEl = null
      return
    }
    detailTitle.textContent = memo.name
    detailMeta.textContent = `${formatDateTime(memo.createdAt)} · ${formatDuration(memo.duration)}`
    deleteButton.disabled = false
    detailBody.innerHTML = `
      <label class="creation-field">
        <span>Memo name</span>
        <input class="creation-input creation-memo-name" type="text" maxlength="100" value="${memo.name.replaceAll('"', '&quot;')}">
      </label>
      <div class="creation-player">
        <div class="creation-player-top">
          <button class="creation-chip creation-play-toggle" type="button">${playingId === memo.id ? 'Pause' : 'Play'}</button>
          <span class="creation-player-time">${formatDuration(playingId === memo.id ? playbackProgress : 0)} / ${formatDuration(memo.duration)}</span>
        </div>
        <div class="creation-waveform" aria-hidden="true"></div>
        <div class="creation-player-track"><span class="creation-player-fill"></span></div>
      </div>
      <div class="creation-summary-grid">
        <div class="creation-summary-card"><span>Length</span><strong>${formatDuration(memo.duration)}</strong></div>
        <div class="creation-summary-card"><span>Recorded</span><strong>${formatShortDate(memo.createdAt)}</strong></div>
      </div>
    `
    const nameInput = detailBody.querySelector<HTMLInputElement>('.creation-memo-name')!
    const playButton = detailBody.querySelector<HTMLButtonElement>('.creation-play-toggle')!
    const fill = detailBody.querySelector<HTMLElement>('.creation-player-fill')!
    const waveform = detailBody.querySelector<HTMLElement>('.creation-waveform')!
    playerTimeEl = detailBody.querySelector<HTMLElement>('.creation-player-time')!
    playerFillEl = fill
    playerToggleEl = playButton
    nameInput.addEventListener('input', () => {
      memo.name = nameInput.value.trim() || 'Untitled memo'
      memo.updatedAt = Date.now()
      save()
      detailTitle.textContent = memo.name
      renderList()
    })
    playButton.addEventListener('click', () => {
      if (playingId === memo.id) {
        stopPlayback()
        return
      }
      beginPlayback(memo)
    })
    waveform.replaceChildren()
    for (let index = 0; index < 72; index += 1) {
      const bar = document.createElement('span')
      bar.style.height = `${8 + Math.abs(Math.sin(index * 1.7) * Math.cos(index * .23)) * 72}%`
      waveform.append(bar)
    }
    syncPlaybackProgress()
  }

  function renderList() {
    list.replaceChildren()
    for (const memo of memos) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'creation-list-item creation-list-item--voice'
      button.setAttribute('role', 'option')
      button.setAttribute('aria-selected', String(memo.id === selectedId))
      button.innerHTML = `
        <span class="creation-list-badge creation-list-badge--voice"></span>
        <span class="creation-list-copy">
          <strong></strong>
          <span class="creation-list-meta"></span>
        </span>
      `
      button.querySelector<HTMLElement>('.creation-list-badge')!.textContent = playingId === memo.id ? '▶' : '◉'
      button.querySelector<HTMLElement>('strong')!.textContent = memo.name
      button.querySelector<HTMLElement>('.creation-list-meta')!.textContent = `${formatDuration(memo.duration)} · ${formatShortDate(memo.createdAt)}`
      button.addEventListener('click', () => {
        if (playingId && playingId !== memo.id) stopPlayback()
        selectedId = memo.id
        renderList()
        renderDetail()
      })
      list.append(button)
    }
  }

  function startRecording() {
    stopPlayback()
    recording = true
    recordingStart = performance.now()
    recordingElapsed = 0
    if (recordingInterval !== null) clearInterval(recordingInterval)
    recordingInterval = window.setInterval(() => {
      recordingElapsed = (performance.now() - recordingStart) / 1000
      updateRecordUI()
    }, 250)
    updateRecordUI()
  }

  function deleteMemo() {
    const memo = selectedMemo()
    if (!memo) return
    if (playingId === memo.id) stopPlayback()
    const index = memos.findIndex(item => item.id === memo.id)
    memos.splice(index, 1)
    selectedId = memos[index]?.id ?? memos[index - 1]?.id ?? memos[0]?.id ?? null
    save()
    renderList()
    renderDetail()
  }

  recordButton.addEventListener('click', () => {
    if (recording) stopRecording(true)
    else startRecording()
  })
  deleteButton.addEventListener('click', deleteMemo)

  updateRecordUI()
  renderList()
  renderDetail()

  return {
    left,
    right,
    onKey(event: KeyboardEvent) {
      if (event.key === 'r' || event.key === 'R') {
        if (event.ctrlKey || event.metaKey || event.altKey) return false
        if (recording) stopRecording(true)
        else startRecording()
        return true
      }
      if (event.key === 'Enter' || event.key === ' ') {
        const memo = selectedMemo()
        if (!memo || recording) return false
        if (playingId === memo.id) stopPlayback()
        else beginPlayback(memo)
        return true
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedMemo()) {
        deleteMemo()
        return true
      }
      return false
    },
  }
}

const filesApp = {
  id: 'files',
  name: 'Files',
  icon: '📁',
  color: '#8fb4ff',
  create: createFilesApp,
} satisfies PhoneApp

const freeformApp = {
  id: 'freeform',
  name: 'Freeform',
  icon: '✦',
  color: '#f19c79',
  create: createFreeformApp,
} satisfies PhoneApp

const journalApp = {
  id: 'journal',
  name: 'Journal',
  icon: '✎',
  color: '#ffd27f',
  create: createJournalApp,
} satisfies PhoneApp

const voiceMemosApp = {
  id: 'voice-memos',
  name: 'Voice Memos',
  icon: '◉',
  color: '#6ba6ff',
  create: createVoiceMemosApp,
} satisfies PhoneApp

export const creationApps: PhoneApp[] = [filesApp, freeformApp, journalApp, voiceMemosApp]
