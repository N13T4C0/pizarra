import { useState } from 'react'
import type { Habit } from '../lib/types'
import { addDays, bestStreak, currentStreak, dayKey, mondayOf } from '../lib/habits'
import { periodLabel } from '../lib/periods'
import { Icon } from './Icon'

interface Props {
  habits: Habit[]
  viewDate: Date
  isCurrent: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onToggle: (id: string, day: string) => void
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
}

const SUGGESTIONS = ['Leer 20 minutos', 'Hacer ejercicio', 'Beber 2 litros de agua', 'Acostarme antes de las 12']
const dow = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
const longDay = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

/** Cuadrícula semanal de hábitos, como la tabla de rayitas que se dibuja en una pizarra. */
export function HabitsBoard(props: Props) {
  const { habits, viewDate, isCurrent } = props
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const today = dayKey(new Date())
  const start = mondayOf(viewDate)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const { title, subtitle } = periodLabel('week', viewDate)

  const weekDone = habits.reduce((sum, h) => sum + days.filter((d) => h.days.includes(dayKey(d))).length, 0)
  const weekPossible = habits.length * days.filter((d) => dayKey(d) <= today).length

  const submit = (name: string) => {
    const clean = name.trim()
    if (!clean) return
    props.onAdd(clean)
    setDraft('')
  }

  return (
    <section className="board" aria-label="Pizarra de hábitos">
      <header className="board-head">
        <h1 className="period">
          Hábitos
          <small>
            {title} · {subtitle}
          </small>
        </h1>
        <div className="board-actions">
          {weekPossible > 0 && (
            <div className="progress" title={`${weekDone} de ${weekPossible} marcas posibles hasta hoy`}>
              <span className="num">
                {weekDone} de {weekPossible}
              </span>
              <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                <path className="track" d="M2 5 H98" />
                <path className="fill" pathLength={1} d="M2 5 H98" style={{ strokeDashoffset: 1 - weekDone / weekPossible }} />
              </svg>
            </div>
          )}
          <nav className="pager" aria-label="Cambiar semana">
            <button onClick={props.onPrev} aria-label="Semana anterior" title="Semana anterior">
              <Icon name="chevron-left" />
            </button>
            <button onClick={props.onToday} disabled={isCurrent}>
              Esta semana
            </button>
            <button onClick={props.onNext} aria-label="Semana siguiente" title="Semana siguiente">
              <Icon name="chevron-right" />
            </button>
          </nav>
        </div>
      </header>

      <div className="surface flow">
        {habits.length > 0 && (
          <div className="habit-scroll">
            <table className="habit-grid">
              <thead>
                <tr>
                  <th scope="col" className="habit-col">
                    <span className="sr-only">Hábito</span>
                  </th>
                  {days.map((d) => (
                    <th key={dayKey(d)} scope="col" className={dayKey(d) === today ? 'today' : undefined}>
                      <span className="dow">{dow.format(d).replace('.', '')}</span>
                      <span className="date num">{d.getDate()}</span>
                    </th>
                  ))}
                  <th scope="col" className="streak-col">
                    Racha
                  </th>
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => {
                  const streak = currentStreak(h)
                  const best = bestStreak(h)
                  return (
                    <tr key={h.id} className={`ink-${h.ink}`}>
                      <th scope="row" className="habit-col">
                        {editingId === h.id ? (
                          <input
                            className="habit-rename"
                            defaultValue={h.name}
                            aria-label="Nombre del hábito"
                            autoFocus
                            onBlur={(e) => {
                              const v = e.target.value.trim()
                              if (v && v !== h.name) props.onRename(h.id, v)
                              setEditingId(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                          />
                        ) : confirmId === h.id ? (
                          <span className="confirm">
                            ¿Borrar «{h.name}» y su historial?
                            <button className="danger" onClick={() => props.onRemove(h.id)}>
                              Borrar
                            </button>
                            <button onClick={() => setConfirmId(null)}>Cancelar</button>
                          </span>
                        ) : (
                          <span className="habit-name">
                            <button className="habit-label" onDoubleClick={() => setEditingId(h.id)} title="Doble clic para renombrar">
                              {h.name}
                            </button>
                            <span className="row-tools">
                              <button className="tool" aria-label={`Renombrar ${h.name}`} title="Renombrar" onClick={() => setEditingId(h.id)}>
                                <Icon name="pen" />
                              </button>
                              <button className="tool" aria-label={`Borrar ${h.name}`} title="Borrar" onClick={() => setConfirmId(h.id)}>
                                <Icon name="close" />
                              </button>
                            </span>
                          </span>
                        )}
                      </th>
                      {days.map((d) => {
                        const key = dayKey(d)
                        const done = h.days.includes(key)
                        const future = key > today
                        return (
                          <td key={key} className={key === today ? 'today' : undefined}>
                            <button
                              className={`cell ${done ? 'done' : ''}`}
                              aria-pressed={done}
                              aria-label={`${h.name}, ${longDay.format(d)}`}
                              disabled={future}
                              onClick={() => props.onToggle(h.id, key)}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path className="box" d="M4 5.5c5-.8 10.5-.6 15.6-.2.5 4.6.6 9.4.1 14-5.1.6-10.4.5-15.4.1C3.8 14.7 3.9 10 4 5.5z" />
                                <path className="tick" pathLength={1} d="M7 12.5l3.4 3.6L18.5 6" />
                              </svg>
                            </button>
                          </td>
                        )
                      })}
                      <td className="streak-col">
                        <span className="streak num">{streak}</span>
                        <span className="streak-meta">
                          {streak === 1 ? 'día' : 'días'}
                          {best > streak && <> · mejor {best}</>}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {habits.length === 0 && (
          <div className="empty static">
            <p className="empty-title">Aún no hay hábitos en la pizarra</p>
            <p>Un hábito es algo que quieres hacer cada día. Márcalo y verás crecer tu racha.</p>
          </div>
        )}

        <form
          className="habit-add"
          onSubmit={(e) => {
            e.preventDefault()
            submit(draft)
          }}
        >
          <label className="sr-only" htmlFor="new-habit">
            Nuevo hábito
          </label>
          <input
            id="new-habit"
            value={draft}
            maxLength={60}
            placeholder="Nuevo hábito, por ejemplo «Leer 20 minutos»"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="add" disabled={!draft.trim()}>
            <Icon name="plus" />
            Añadir hábito
          </button>
        </form>

        {habits.length === 0 && (
          <div className="suggestions" aria-label="Sugerencias">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => submit(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
