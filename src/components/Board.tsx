import { useRef } from 'react'
import type { Habit, Horizon, Note } from '../lib/types'
import { HORIZONS, periodKey, periodLabel } from '../lib/periods'
import { NoteItem, type DragState } from './NoteItem'
import { CarryOver } from './CarryOver'
import { HabitStrip } from './HabitStrip'
import { Icon } from './Icon'

interface Props {
  horizon: Horizon
  viewDate: Date
  isCurrent: boolean
  notes: Note[]
  /** Pendientes de periodos pasados (solo se muestran en el periodo actual). */
  pastPending: Note[]
  linkCandidates: Note[] | null
  parentLabel?: string
  childLabel?: string
  parentOf: (n: Note) => Note | undefined
  childStats: (n: Note) => { done: number; total: number } | undefined
  freshId: string | null
  flashId: string | null
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
  onCarry: (ids: string[]) => void
  onDismiss: (ids: string[]) => void
  onLink: (id: string, parentId: string | undefined) => void
  onBreakDown?: (n: Note) => void
  onOpenParent: (parent: Note) => void
  /** Solo en la pizarra diaria: los hábitos para marcar ese día. */
  habits?: Habit[]
  onToggleHabit?: (id: string, day: string) => void
  onOpenHabits?: () => void
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
        <h1 className="period">
          {title}
          {subtitle && <small>{subtitle}</small>}
        </h1>

        <div className="board-actions">
          {notes.length > 0 && (
            <div className="progress" title={`${done} de ${notes.length} hechos`}>
              <span className="num">
                {done} de {notes.length}
              </span>
              <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                <path className="track" d="M2 5 H98" />
                <path className="fill" pathLength={1} d="M2 5 H98" style={{ strokeDashoffset: 1 - done / notes.length }} />
              </svg>
            </div>
          )}
          <nav className="pager" aria-label="Cambiar periodo">
            <button onClick={props.onPrev} aria-label="Periodo anterior" title="Periodo anterior">
              <Icon name="chevron-left" />
            </button>
            <button onClick={props.onToday} disabled={isCurrent}>
              {meta.today}
            </button>
            <button onClick={props.onNext} aria-label="Periodo siguiente" title="Periodo siguiente">
              <Icon name="chevron-right" />
            </button>
          </nav>
          <button className="add" onClick={() => props.onAdd()}>
            <Icon name="pen" />
            Escribir
          </button>
        </div>
      </header>

      <CarryOver horizon={horizon} pending={props.pastPending} onCarry={props.onCarry} onDismiss={props.onDismiss} />

      {horizon === 'day' && props.habits && props.onToggleHabit && props.onOpenHabits && (
        <HabitStrip
          habits={props.habits}
          day={periodKey('day', viewDate)}
          isFuture={periodKey('day', viewDate) > periodKey('day', new Date())}
          onToggle={props.onToggleHabit}
          onOpenHabits={props.onOpenHabits}
        />
      )}

      <div ref={surfaceRef} className="surface" onDoubleClick={onDoubleClick}>
        {notes.length === 0 && (
          <div className="empty">
            <p className="empty-title">{isCurrent ? `Nada escrito para ${meta.this} todavía` : 'Nada escrito en este periodo'}</p>
            <p>Haz doble clic en cualquier parte de la pizarra, o pulsa Escribir.</p>
            <p>Para borrar una nota, arrástrala hasta el borrador.</p>
          </div>
        )}
        {notes.map((n) => {
          const parent = props.parentOf(n)
          return (
            <NoteItem
              key={n.id}
              note={n}
              parent={parent}
              childStats={props.childStats(n)}
              linkCandidates={props.linkCandidates}
              parentLabel={props.parentLabel}
              childLabel={props.childLabel}
              flash={n.id === props.flashId}
              boardRef={surfaceRef}
              eraserRef={props.eraserRef}
              startEditing={n.id === props.freshId}
              onUpdate={(patch) => props.onUpdate(n.id, patch)}
              onRemove={() => props.onRemove(n.id)}
              onFront={() => props.onFront(n.id)}
              onEditEnd={props.onEditEnd}
              onDragState={props.onDragState}
              onLink={(parentId) => props.onLink(n.id, parentId)}
              onBreakDown={props.onBreakDown && (() => props.onBreakDown!(n))}
              onOpenParent={() => parent && props.onOpenParent(parent)}
            />
          )
        })}
      </div>
    </section>
  )
}
