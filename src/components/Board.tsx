import { useRef } from 'react'
import type { Horizon, Note } from '../lib/types'
import { HORIZONS, periodLabel } from '../lib/periods'
import { NoteItem, type DragState } from './NoteItem'

interface Props {
  horizon: Horizon
  viewDate: Date
  isCurrent: boolean
  notes: Note[]
  freshId: string | null
  eraserRef: React.RefObject<HTMLDivElement>
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onAdd: (pos?: { x: number; y: number }) => void
  onUpdate: (id: string, patch: Partial<Note>) => void
  onRemove: (id: string) => void
  onFront: (id: string) => void
  onEditEnd: () => void
  onDragState: (s: DragState) => void
}

export function Board(props: Props) {
  const { horizon, viewDate, isCurrent, notes } = props
  const surfaceRef = useRef<HTMLDivElement>(null)
  const { title, subtitle } = periodLabel(horizon, viewDate)
  const meta = HORIZONS.find((h) => h.id === horizon)!
  const done = notes.filter((n) => n.done).length

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const r = e.currentTarget.getBoundingClientRect()
    props.onAdd({
      x: ((e.clientX - r.left) / r.width) * 100 - 2,
      y: ((e.clientY - r.top) / r.height) * 100 - 3,
    })
  }

  return (
    <section className="board" aria-label={`Pizarra: ${meta.current}`}>
      <header className="board-head">
        <div className="period">
          <span className="eyebrow">{isCurrent ? meta.current : meta.label}</span>
          <h1>
            {title}
            {subtitle && <small> · {subtitle}</small>}
          </h1>
        </div>

        <div className="board-actions">
          {notes.length > 0 && (
            <div className="progress" title={`${done} de ${notes.length} hechos`}>
              <span>
                {done}/{notes.length}
              </span>
              <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                <path className="track" d="M2 5 H98" />
                <path className="fill" pathLength={1} d="M2 5 H98" style={{ strokeDashoffset: 1 - done / notes.length }} />
              </svg>
            </div>
          )}
          <nav className="pager" aria-label="Cambiar periodo">
            <button onClick={props.onPrev} aria-label="Periodo anterior">‹</button>
            <button onClick={props.onToday} disabled={isCurrent}>Hoy</button>
            <button onClick={props.onNext} aria-label="Periodo siguiente">›</button>
          </nav>
          <button className="add" onClick={() => props.onAdd()}>+ Escribir</button>
        </div>
      </header>

      <div ref={surfaceRef} className="surface" onDoubleClick={onDoubleClick}>
        {notes.length === 0 && (
          <p className="empty">
            Pizarra limpia.
            <br />
            Haz doble clic para escribir un objetivo.
          </p>
        )}
        {notes.map((n) => (
          <NoteItem
            key={n.id}
            note={n}
            boardRef={surfaceRef}
            eraserRef={props.eraserRef}
            startEditing={n.id === props.freshId}
            onUpdate={(patch) => props.onUpdate(n.id, patch)}
            onRemove={() => props.onRemove(n.id)}
            onFront={() => props.onFront(n.id)}
            onEditEnd={props.onEditEnd}
            onDragState={props.onDragState}
          />
        ))}
      </div>
    </section>
  )
}
