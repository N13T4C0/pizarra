import { useState } from 'react'
import type { Horizon, Note } from '../lib/types'
import { periodShort } from '../lib/periods'

const PAST: Record<Horizon, string> = {
  day: 'días anteriores',
  week: 'semanas anteriores',
  month: 'meses anteriores',
  year: 'años anteriores',
}

interface Props {
  horizon: Horizon
  pending: Note[]
  onCarry: (ids: string[]) => void
  onDismiss: (ids: string[]) => void
}

/** Aviso con los objetivos que quedaron sin hacer en periodos pasados. */
export function CarryOver({ horizon, pending, onCarry, onDismiss }: Props) {
  const [open, setOpen] = useState(false)
  if (pending.length === 0) return null
  const all = pending.map((n) => n.id)
  const n = pending.length

  return (
    <div className="carry" role="region" aria-label="Pendientes de periodos anteriores">
      <span className="tape" aria-hidden="true" />
      <div className="carry-head">
        <p>
          <strong className="num">{n}</strong> {n === 1 ? 'objetivo quedó sin terminar' : 'objetivos quedaron sin terminar'} en {PAST[horizon]}
        </p>
        <button className="primary" onClick={() => onCarry(all)}>
          {n === 1 ? 'Pasar aquí' : `Pasar los ${n} aquí`}
        </button>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Ocultar' : 'Revisar'}
        </button>
        <button onClick={() => onDismiss(all)}>{n === 1 ? 'Descartar' : 'Descartar todos'}</button>
      </div>

      {open && (
        <ul className="carry-list">
          {pending.map((note) => (
            <li key={note.id}>
              <span className="when">{periodShort(horizon, note.period)}</span>
              <span className="what">{note.text}</span>
              <button onClick={() => onCarry([note.id])}>Pasar</button>
              <button onClick={() => onDismiss([note.id])}>Descartar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
