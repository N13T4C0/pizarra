import type { Habit } from '../lib/types'
import { currentStreak } from '../lib/habits'

interface Props {
  habits: Habit[]
  /** Día que se está viendo en la pizarra de Hoy (puede ser un día pasado). */
  day: string
  isFuture: boolean
  onToggle: (id: string, day: string) => void
  onOpenHabits: () => void
}

/** Tira de imanes con los hábitos del día, para marcarlos sin salir de la pizarra diaria. */
export function HabitStrip({ habits, day, isFuture, onToggle, onOpenHabits }: Props) {
  if (habits.length === 0) return null
  const done = habits.filter((h) => h.days.includes(day)).length

  return (
    <div className="habit-strip" role="group" aria-label="Hábitos del día">
      <button className="strip-title" onClick={onOpenHabits} title="Abrir la pizarra de hábitos">
        Hábitos
        <span className="num">
          {done}/{habits.length}
        </span>
      </button>
      <ul>
        {habits.map((h) => {
          const checked = h.days.includes(day)
          const streak = currentStreak(h)
          return (
            <li key={h.id}>
              <button
                className={`habit-chip ink-${h.ink} ${checked ? 'done' : ''}`}
                aria-pressed={checked}
                disabled={isFuture}
                onClick={() => onToggle(h.id, day)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path className="box" d="M4 5.5c5-.8 10.5-.6 15.6-.2.5 4.6.6 9.4.1 14-5.1.6-10.4.5-15.4.1C3.8 14.7 3.9 10 4 5.5z" />
                  <path className="tick" pathLength={1} d="M7 12.5l3.4 3.6L18.5 6" />
                </svg>
                <span className="chip-name">{h.name}</span>
                {streak > 0 && (
                  <span className="chip-streak num" title={`Racha de ${streak} ${streak === 1 ? 'día' : 'días'}`}>
                    {streak}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
