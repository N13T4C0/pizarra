import { useEffect, useRef, useState } from 'react'
import { Board } from './components/Board'
import { Tray } from './components/Tray'
import type { DragState } from './components/NoteItem'
import type { Horizon, Note, Theme, Tool } from './lib/types'
import { CHILD, HORIZONS, PARENT, periodKey, shiftDate } from './lib/periods'
import { newId, usePersistentState } from './lib/storage'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'blanca', label: 'Blanca' },
  { id: 'tiza', label: 'Tiza' },
  { id: 'corcho', label: 'Corcho' },
]

/** Cómo nombrar el nivel de arriba y el de abajo en los textos de vincular y desglosar. */
const PARENT_LABEL: Partial<Record<Horizon, string>> = { day: 'la semana', week: 'el mes', month: 'el año' }
const CHILD_LABEL: Partial<Record<Horizon, string>> = { week: 'el día', month: 'la semana', year: 'el mes' }

const randomRot = (tool: Tool) => (Math.random() - 0.5) * (tool.kind === 'postit' ? 6 : 3)

function makeNote(horizon: Horizon, period: string, style: Tool, x: number, y: number, text = ''): Note {
  return { id: newId(), horizon, period, text, done: false, style, x, y, rot: randomRot(style), createdAt: Date.now() }
}

/** Ejemplos para que la pizarra no salga vacía la primera vez. */
function seedNotes(): Note[] {
  const now = new Date()
  const day = periodKey('day', now)
  const week = periodKey('week', now)
  const month = periodKey('month', now)
  const book = makeNote('month', month, { kind: 'postit', color: 'pink' }, 8, 10, 'Acabar el libro')
  const pages = makeNote('week', week, { kind: 'marker', ink: 2 }, 6, 24, 'Leer 140 páginas')
  const today = makeNote('day', day, { kind: 'marker', ink: 1 }, 6, 8, 'Leer 20 páginas')
  pages.parentId = book.id
  today.parentId = pages.id
  today.done = true
  return [
    today,
    makeNote('day', day, { kind: 'marker', ink: 2 }, 6, 28, 'Terminar la práctica de BBDD'),
    makeNote('day', day, { kind: 'postit', color: 'yellow' }, 58, 10, 'Ir al gimnasio'),
    makeNote('week', week, { kind: 'marker', ink: 1 }, 6, 8, 'Repasar temas 1–3'),
    pages,
    book,
  ]
}

/** Busca un hueco libre en una rejilla para no apilar notas encima de otras. */
function freeSpot(existing: Note[]) {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 4 + col * 24
      const y = 6 + row * 15
      if (!existing.some((n) => Math.abs(n.x - x) < 14 && Math.abs(n.y - y) < 10)) return { x, y }
    }
  }
  return { x: 10 + Math.random() * 60, y: 10 + Math.random() * 60 }
}

export default function App() {
  const [notes, setNotes] = usePersistentState<Note[]>('pizarra:notes', seedNotes)
  const [theme, setTheme] = usePersistentState<Theme>('pizarra:theme', 'blanca')
  const [horizon, setHorizon] = usePersistentState<Horizon>('pizarra:horizon', 'day')
  const [tool, setTool] = usePersistentState<Tool>('pizarra:tool', { kind: 'marker', ink: 1 })
  const [viewDate, setViewDate] = useState(() => new Date())
  const [freshId, setFreshId] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState>('idle')
  const eraserRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const period = periodKey(horizon, viewDate)
  const currentPeriod = periodKey(horizon, new Date())
  const isCurrent = period === currentPeriod
  const visible = notes.filter((n) => n.horizon === horizon && n.period === period)

  // Las claves de periodo se ordenan bien como texto (2026-10-27 < 2026-10-28, 2026-W43 < 2026-W44).
  const pastPending = isCurrent
    ? notes.filter((n) => n.horizon === horizon && n.period < currentPeriod && !n.done && !n.dismissed)
    : []

  const parentHorizon = PARENT[horizon]
  const childHorizon = CHILD[horizon]
  const linkCandidates = parentHorizon
    ? notes.filter((n) => n.horizon === parentHorizon && n.period === periodKey(parentHorizon, viewDate))
    : null

  const byId = new Map(notes.map((n) => [n.id, n]))
  const stepStats = new Map<string, { done: number; total: number }>()
  for (const n of notes) {
    if (!n.parentId || !byId.has(n.parentId)) continue
    const s = stepStats.get(n.parentId) ?? { done: 0, total: 0 }
    s.total++
    if (n.done) s.done++
    stepStats.set(n.parentId, s)
  }

  const pendingFor = (h: Horizon) => {
    const p = periodKey(h, new Date())
    return notes.filter((n) => n.horizon === h && n.period === p && !n.done).length
  }

  const addNote = (pos?: { x: number; y: number }) => {
    const { x, y } = pos ?? freeSpot(visible)
    const note = makeNote(horizon, period, tool, x, y)
    setNotes((prev) => [...prev, note])
    setFreshId(note.id)
  }

  const updateNote = (id: string, patch: Partial<Note>) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))

  const removeNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id))

  const bringToFront = (id: string) =>
    setNotes((prev) => {
      if (prev[prev.length - 1]?.id === id) return prev
      const note = prev.find((n) => n.id === id)
      return note ? [...prev.filter((n) => n.id !== id), note] : prev
    })

  const carryOver = (ids: string[]) =>
    setNotes((prev) => {
      const placed = prev.filter((n) => n.horizon === horizon && n.period === currentPeriod)
      return prev.map((n) => {
        if (!ids.includes(n.id)) return n
        const moved = { ...n, period: currentPeriod, ...freeSpot(placed), carried: (n.carried ?? 0) + 1 }
        placed.push(moved)
        return moved
      })
    })

  const dismiss = (ids: string[]) =>
    setNotes((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, dismissed: true } : n)))

  /** Crea un paso en la pizarra de abajo, vinculado a este objetivo, y salta a ella para escribirlo. */
  const breakDown = (goal: Note) => {
    if (!childHorizon) return
    const target = isCurrent ? new Date() : viewDate
    const key = periodKey(childHorizon, target)
    const { x, y } = freeSpot(notes.filter((n) => n.horizon === childHorizon && n.period === key))
    const step = { ...makeNote(childHorizon, key, tool, x, y), parentId: goal.id }
    setNotes((prev) => [...prev, step])
    setHorizon(childHorizon)
    setViewDate(target)
    setFreshId(step.id)
  }

  const openParent = (parent: Note) => {
    setHorizon(parent.horizon)
    setFlashId(parent.id)
    window.setTimeout(() => setFlashId(null), 1600)
  }

  const switchHorizon = (h: Horizon) => {
    setHorizon(h)
    setViewDate(new Date())
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          Pizarra
        </div>

        <div className="theme-picker" role="radiogroup" aria-label="Tipo de pizarra">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={t.id === theme}
              aria-label={`Pizarra ${t.label.toLowerCase()}`}
              title={`Pizarra ${t.label.toLowerCase()}`}
              onClick={() => setTheme(t.id)}
            >
              <span className={`swatch swatch-${t.id}`} aria-hidden="true" />
              <span className="theme-name">{t.label}</span>
            </button>
          ))}
        </div>

        <nav className="tabs" aria-label="Pizarras">
          {HORIZONS.map((h) => {
            const pending = pendingFor(h.id)
            return (
              <button
                key={h.id}
                aria-current={h.id === horizon ? 'page' : undefined}
                aria-label={pending > 0 ? `${h.label}, ${pending} pendientes` : h.label}
                onClick={() => switchHorizon(h.id)}
              >
                {h.label}
                {pending > 0 && (
                  <span className="count num" aria-hidden="true">
                    {pending}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="wall">
        <div className={`frame ${dragState !== 'idle' ? 'is-dragging' : ''}`}>
          <Board
            horizon={horizon}
            viewDate={viewDate}
            isCurrent={isCurrent}
            notes={visible}
            pastPending={pastPending}
            linkCandidates={linkCandidates}
            parentLabel={PARENT_LABEL[horizon]}
            childLabel={CHILD_LABEL[horizon]}
            parentOf={(n) => (n.parentId ? byId.get(n.parentId) : undefined)}
            childStats={(n) => stepStats.get(n.id)}
            freshId={freshId}
            flashId={flashId}
            eraserRef={eraserRef}
            onPrev={() => setViewDate((d) => shiftDate(horizon, d, -1))}
            onNext={() => setViewDate((d) => shiftDate(horizon, d, 1))}
            onToday={() => setViewDate(new Date())}
            onAdd={addNote}
            onUpdate={updateNote}
            onRemove={removeNote}
            onFront={bringToFront}
            onEditEnd={() => setFreshId(null)}
            onDragState={setDragState}
            onCarry={carryOver}
            onDismiss={dismiss}
            onLink={(id, parentId) => updateNote(id, { parentId })}
            onBreakDown={childHorizon ? breakDown : undefined}
            onOpenParent={openParent}
          />
          <Tray ref={eraserRef} tool={tool} dragState={dragState} onTool={setTool} />
        </div>
      </main>
    </div>
  )
}
