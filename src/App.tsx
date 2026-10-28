import { useEffect, useRef, useState } from 'react'
import { Board } from './components/Board'
import { Tray } from './components/Tray'
import type { DragState } from './components/NoteItem'
import type { Horizon, Note, Theme, Tool } from './lib/types'
import { HORIZONS, periodKey, shiftDate } from './lib/periods'
import { newId, usePersistentState } from './lib/storage'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'blanca', label: 'Blanca' },
  { id: 'tiza', label: 'Tiza' },
  { id: 'corcho', label: 'Corcho' },
]

const randomRot = (tool: Tool) => (Math.random() - 0.5) * (tool.kind === 'postit' ? 6 : 3)

function makeNote(horizon: Horizon, period: string, style: Tool, x: number, y: number, text = ''): Note {
  return { id: newId(), horizon, period, text, done: false, style, x, y, rot: randomRot(style), createdAt: Date.now() }
}

/** Ejemplos para que la pizarra no salga vacía la primera vez. */
function seedNotes(): Note[] {
  const today = new Date()
  const day = periodKey('day', today)
  const week = periodKey('week', today)
  const month = periodKey('month', today)
  const seeded = [
    makeNote('day', day, { kind: 'marker', ink: 1 }, 6, 8, 'Leer 20 páginas'),
    makeNote('day', day, { kind: 'marker', ink: 2 }, 6, 24, 'Terminar la práctica de BBDD'),
    makeNote('day', day, { kind: 'postit', color: 'yellow' }, 58, 10, 'Ir al gimnasio 💪'),
    makeNote('week', week, { kind: 'marker', ink: 1 }, 6, 8, 'Repasar temas 1–3'),
    makeNote('month', month, { kind: 'postit', color: 'pink' }, 8, 10, 'Acabar el libro'),
  ]
  seeded[0].done = true
  return seeded
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
  const [dragState, setDragState] = useState<DragState>('idle')
  const eraserRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const period = periodKey(horizon, viewDate)
  const isCurrent = period === periodKey(horizon, new Date())
  const visible = notes.filter((n) => n.horizon === horizon && n.period === period)

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

        <nav className="tabs" aria-label="Pizarras">
          {HORIZONS.map((h) => {
            const pending = pendingFor(h.id)
            return (
              <button key={h.id} aria-pressed={h.id === horizon} onClick={() => switchHorizon(h.id)}>
                {h.label}
                {pending > 0 && <span className="badge">{pending}</span>}
              </button>
            )
          })}
        </nav>

        <div className="theme-picker" role="radiogroup" aria-label="Tipo de pizarra">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={t.id === theme}
              title={`Pizarra ${t.label.toLowerCase()}`}
              onClick={() => setTheme(t.id)}
            >
              <span className={`swatch swatch-${t.id}`} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="wall">
        <div className={`frame ${dragState !== 'idle' ? 'is-dragging' : ''}`}>
          <Board
            horizon={horizon}
            viewDate={viewDate}
            isCurrent={isCurrent}
            notes={visible}
            freshId={freshId}
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
          />
          <Tray ref={eraserRef} tool={tool} dragState={dragState} onTool={setTool} />
        </div>
        <p className="hint">
          Doble clic para escribir · Arrastra para mover · Suelta en el borrador para borrar · Teclado: Espacio tacha, flechas mueven
        </p>
      </main>
    </div>
  )
}
