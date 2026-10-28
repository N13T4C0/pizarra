import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Note } from '../lib/types'

export type DragState = 'idle' | 'dragging' | 'over-eraser'

interface Props {
  note: Note
  /** Objetivo superior al que está vinculada, si existe. */
  parent?: Note
  /** Progreso de los pasos vinculados a esta nota. */
  childStats?: { done: number; total: number }
  /** Objetivos del nivel superior a los que se puede vincular; null en la pizarra anual. */
  linkCandidates: Note[] | null
  parentLabel?: string
  childLabel?: string
  flash: boolean
  boardRef: React.RefObject<HTMLDivElement>
  eraserRef: React.RefObject<HTMLDivElement>
  startEditing: boolean
  onUpdate: (patch: Partial<Note>) => void
  onRemove: () => void
  onFront: () => void
  onEditEnd: () => void
  onDragState: (s: DragState) => void
  onLink: (parentId: string | undefined) => void
  onBreakDown?: () => void
  onOpenParent: () => void
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

function isOver(el: HTMLElement | null, x: number, y: number) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

export function NoteItem({
  note,
  parent,
  childStats,
  linkCandidates,
  parentLabel,
  childLabel,
  flash,
  boardRef,
  eraserRef,
  startEditing,
  onUpdate,
  onRemove,
  onFront,
  onEditEnd,
  onDragState,
  onLink,
  onBreakDown,
  onOpenParent,
}: Props) {
  const [editing, setEditing] = useState(startEditing)
  const [draft, setDraft] = useState(note.text)
  const [live, setLive] = useState<{ x: number; y: number } | null>(null)
  const [erasing, setErasing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const elRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const drag = useRef<{ offX: number; offY: number; sx: number; sy: number; moved: boolean } | null>(null)

  useEffect(() => {
    if (!editing) return
    const t = textRef.current
    if (!t) return
    t.focus()
    t.setSelectionRange(t.value.length, t.value.length)
  }, [editing])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !elRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  // El textarea crece con el texto, como si escribieras en la pizarra.
  useLayoutEffect(() => {
    const t = textRef.current
    if (!t) return
    t.style.height = '0px'
    t.style.height = `${t.scrollHeight}px`
  }, [draft, editing])

  const erase = () => {
    setErasing(true)
    window.setTimeout(onRemove, 320)
  }

  const commit = () => {
    const text = draft.trim()
    setEditing(false)
    onEditEnd()
    if (!text) return erase()
    if (text !== note.text) onUpdate({ text })
  }

  const cancel = () => {
    setEditing(false)
    onEditEnd()
    if (!note.text) return erase()
    setDraft(note.text)
  }

  const boardPos = (clientX: number, clientY: number) => {
    const d = drag.current!
    const b = boardRef.current!.getBoundingClientRect()
    return {
      x: ((clientX - d.offX - b.left) / b.width) * 100,
      y: ((clientY - d.offY - b.top) / b.height) * 100,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button, .link-menu')) return
    const r = elRef.current!.getBoundingClientRect()
    drag.current = { offX: e.clientX - r.left, offY: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
    onFront()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return
    d.moved = true
    setLive(boardPos(e.clientX, e.clientY))
    onDragState(isOver(eraserRef.current, e.clientX, e.clientY) ? 'over-eraser' : 'dragging')
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    if (!d.moved) return
    onDragState('idle')
    if (isOver(eraserRef.current, e.clientX, e.clientY)) return erase()

    const { x, y } = boardPos(e.clientX, e.clientY)
    const b = boardRef.current!.getBoundingClientRect()
    const el = elRef.current!
    onUpdate({
      x: clamp(x, 0, 100 - (el.offsetWidth / b.width) * 100),
      y: clamp(y, 0, 100 - (el.offsetHeight / b.height) * 100),
    })
    setLive(null)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editing || e.target !== e.currentTarget) return
    const step = e.shiftKey ? 5 : 1
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    if (moves[e.key]) {
      e.preventDefault()
      const [dx, dy] = moves[e.key]
      onUpdate({ x: clamp(note.x + dx, 0, 92), y: clamp(note.y + dy, 0, 92) })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      setEditing(true)
    } else if (e.key === ' ') {
      e.preventDefault()
      onUpdate({ done: !note.done })
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      erase()
    }
  }

  const pos = live ?? note
  const { style } = note
  const classes = [
    'note',
    style.kind,
    style.kind === 'marker' ? `ink-${style.ink}` : `postit-${style.color}`,
    note.done && 'done',
    live && 'dragging',
    erasing && 'erasing',
    editing && 'editing',
    menuOpen && 'menu-open',
    flash && 'flash',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={elRef}
      className={classes}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, '--rot': `${note.rot}deg` } as React.CSSProperties}
      tabIndex={0}
      role="group"
      aria-label={`${note.text || 'Nota nueva'}${note.done ? ', completada' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => setEditing(true)}
      onKeyDown={onKeyDown}
    >
      <button
        className="check"
        aria-label={note.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
        aria-pressed={note.done}
        onClick={() => onUpdate({ done: !note.done })}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path className="box" d="M4 5.5c5-.8 10.5-.6 15.6-.2.5 4.6.6 9.4.1 14-5.1.6-10.4.5-15.4.1C3.8 14.7 3.9 10 4 5.5z" />
          <path className="tick" pathLength={1} d="M7 12.5l3.4 3.6L18.5 6" />
        </svg>
      </button>

      <div className="body">
        {editing ? (
          <textarea
            ref={textRef}
            className="text"
            value={draft}
            placeholder="Escribe un objetivo…"
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                cancel()
              }
            }}
          />
        ) : (
          <div className="text">
            <span className="strike">{note.text}</span>
          </div>
        )}

        {parent && (
          <button className="parent-tag" onClick={onOpenParent} title={`Ver en la pizarra de ${parentLabel}`}>
            ↑ {parent.text}
          </button>
        )}

        {childStats && (
          <div className="steps" title={`${childStats.done} de ${childStats.total} pasos hechos`}>
            <span className="steps-bar">
              <span style={{ width: `${(childStats.done / childStats.total) * 100}%` }} />
            </span>
            {childStats.done}/{childStats.total} pasos
          </div>
        )}
      </div>

      {!!note.carried && (
        <span className="carried" title={`Aplazado ${note.carried} ${note.carried === 1 ? 'vez' : 'veces'}`}>
          ↻{note.carried}
        </span>
      )}

      <div className="tools">
        {linkCandidates && (
          <button
            className="tool"
            aria-label={`Vincular a un objetivo de ${parentLabel}`}
            title={`Vincular a un objetivo de ${parentLabel}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ↑
          </button>
        )}
        {onBreakDown && (
          <button
            className="tool"
            aria-label={`Añadir un paso en ${childLabel}`}
            title={`Añadir un paso en ${childLabel}`}
            onClick={onBreakDown}
          >
            +
          </button>
        )}
        <button className="tool" aria-label="Borrar" title="Borrar" onClick={erase}>
          ×
        </button>
      </div>

      {menuOpen && linkCandidates && (
        <div className="link-menu" role="menu">
          <p>Forma parte de… ({parentLabel})</p>
          {linkCandidates.length === 0 && <p className="none">No hay objetivos en {parentLabel}.</p>}
          {linkCandidates.map((c) => (
            <button
              key={c.id}
              role="menuitemradio"
              aria-checked={c.id === note.parentId}
              onClick={() => {
                onLink(c.id)
                setMenuOpen(false)
              }}
            >
              {c.text}
            </button>
          ))}
          {note.parentId && (
            <button
              role="menuitem"
              className="unlink"
              onClick={() => {
                onLink(undefined)
                setMenuOpen(false)
              }}
            >
              Quitar vínculo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
