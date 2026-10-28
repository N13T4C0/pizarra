import type { Habit, Note } from '../lib/types'
import { addDays, bestStreak, completionRate, currentStreak, dayKey, mondayOf } from '../lib/habits'
import { periodKey } from '../lib/periods'

interface Props {
  notes: Note[]
  habits: Habit[]
}

const HEAT_WEEKS = 18
const BAR_WEEKS = 8
const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const monthShort = new Intl.DateTimeFormat('es-ES', { month: 'short' })
const dayLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : null)

function tally(list: Note[]) {
  return { done: list.filter((n) => n.done).length, total: list.length }
}

/** Nivel de intensidad 0–4 para el mapa de calor. */
const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4)

export function StatsBoard({ notes, habits }: Props) {
  const now = new Date()
  const today = dayKey(now)
  const weekKey = periodKey('week', now)
  const monthKey = periodKey('month', now)
  const dayNotes = notes.filter((n) => n.horizon === 'day' && !n.dismissed)

  // Objetivos del día de esta semana + los de la pizarra semanal
  const thisWeek = tally([
    ...dayNotes.filter((n) => periodKey('week', parseDay(n.period)) === weekKey),
    ...notes.filter((n) => n.horizon === 'week' && n.period === weekKey),
  ])
  const thisMonth = tally([
    ...dayNotes.filter((n) => n.period.startsWith(monthKey)),
    ...notes.filter((n) => n.horizon === 'month' && n.period === monthKey),
  ])
  const carriedThisMonth = notes.filter((n) => n.carried && n.period.startsWith(monthKey)).length

  const streaks = habits.map((h) => ({ habit: h, current: currentStreak(h), best: bestStreak(h) }))
  const topStreak = streaks.reduce<(typeof streaks)[number] | null>((a, b) => (!a || b.current > a.current ? b : a), null)

  // Actividad por día: objetivos diarios completados + hábitos marcados
  const doneByDay = new Map<string, number>()
  for (const n of dayNotes) if (n.done) doneByDay.set(n.period, (doneByDay.get(n.period) ?? 0) + 1)
  for (const h of habits) for (const d of h.days) doneByDay.set(d, (doneByDay.get(d) ?? 0) + 1)

  const heatStart = addDays(mondayOf(now), -7 * (HEAT_WEEKS - 1))
  const heatWeeks = Array.from({ length: HEAT_WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(heatStart, w * 7 + d)))
  const activeDays = heatWeeks.flat().filter((d) => dayKey(d) <= today && (doneByDay.get(dayKey(d)) ?? 0) > 0).length

  // Promedio por día de la semana, desde el primer día con actividad (no desde antes de usar la app)
  const firstActive = [...doneByDay.keys()].sort()[0] ?? today
  const weekdayTotals = Array.from({ length: 7 }, () => ({ sum: 0, days: 0 }))
  for (const d of heatWeeks.flat()) {
    if (dayKey(d) > today || dayKey(d) < firstActive) continue
    const wd = (d.getDay() + 6) % 7
    weekdayTotals[wd].sum += doneByDay.get(dayKey(d)) ?? 0
    weekdayTotals[wd].days++
  }
  const weekdayAvg = weekdayTotals.map((t) => (t.days ? t.sum / t.days : 0))
  const maxAvg = Math.max(...weekdayAvg)
  const bestDay = maxAvg > 0 ? weekdayAvg.indexOf(maxAvg) : -1

  // % de objetivos diarios completados en las últimas semanas
  const bars = Array.from({ length: BAR_WEEKS }, (_, i) => {
    const monday = addDays(mondayOf(now), -7 * (BAR_WEEKS - 1 - i))
    const key = periodKey('week', monday)
    const t = tally(dayNotes.filter((n) => periodKey('week', parseDay(n.period)) === key))
    return { key, label: key.split('-W')[1], ...t, value: pct(t.done, t.total) }
  })

  return (
    <section className="board" aria-label="Resumen">
      <header className="board-head">
        <h1 className="period">
          Resumen
          <small>{dayLong.format(now)}</small>
        </h1>
      </header>

      <div className="surface flow stats">
        <dl className="kpis">
          <div>
            <dt>Objetivos esta semana</dt>
            <dd>
              <span className="num">{thisWeek.done}</span>
              <small className="num"> de {thisWeek.total}</small>
            </dd>
          </div>
          <div>
            <dt>Objetivos este mes</dt>
            <dd>
              <span className="num">{thisMonth.done}</span>
              <small className="num"> de {thisMonth.total}</small>
            </dd>
          </div>
          <div>
            <dt>Racha más larga ahora</dt>
            <dd>
              {topStreak && topStreak.current > 0 ? (
                <>
                  <span className="num">{topStreak.current}</span>
                  <small> {topStreak.current === 1 ? 'día' : 'días'} · {topStreak.habit.name}</small>
                </>
              ) : (
                <small className="muted">{habits.length ? 'Ninguna activa' : 'Sin hábitos'}</small>
              )}
            </dd>
          </div>
          <div>
            <dt>Aplazados este mes</dt>
            <dd>
              <span className="num">{carriedThisMonth}</span>
            </dd>
          </div>
        </dl>

        <div className="stats-grid">
          <section className="panel panel-wide">
            <h2>Actividad</h2>
            <p className="panel-note">
              {activeDays === 0
                ? 'Cada objetivo del día que completes y cada hábito que marques llenará un cuadro.'
                : `${activeDays} ${activeDays === 1 ? 'día con actividad' : 'días con actividad'} en las últimas ${HEAT_WEEKS} semanas.`}
            </p>
            <div className="heat-wrap">
              <div className="heat-days" aria-hidden="true">
                <span>L</span>
                <span />
                <span>X</span>
                <span />
                <span>V</span>
                <span />
                <span>D</span>
              </div>
              <div>
                <div className="heat-months" aria-hidden="true">
                  {heatWeeks.map((week, i) => (
                    // El mes se rotula en su primera semana completa, para que dos etiquetas nunca se pisen
                    <span key={i}>{week[0].getDate() <= 7 ? monthShort.format(week[0]).replace('.', '') : ''}</span>
                  ))}
                </div>
                <div className="heat" role="img" aria-label={`Mapa de actividad: ${activeDays} días con actividad en las últimas ${HEAT_WEEKS} semanas`}>
                  {heatWeeks.flat().map((d) => {
                    const key = dayKey(d)
                    const n = doneByDay.get(key) ?? 0
                    const future = key > today
                    return (
                      <span
                        key={key}
                        className={`heat-cell l${future ? 'x' : level(n)} ${key === today ? 'today' : ''}`}
                        title={future ? undefined : `${dayLong.format(d)}: ${n} ${n === 1 ? 'hecho' : 'hechos'}`}
                      />
                    )
                  })}
                </div>
                <div className="heat-legend" aria-hidden="true">
                  Menos
                  {[0, 1, 2, 3, 4].map((l) => (
                    <span key={l} className={`heat-cell l${l}`} />
                  ))}
                  Más
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Tu mejor día</h2>
            <p className="panel-note">
              {bestDay >= 0
                ? `Los ${WEEKDAYS[bestDay].toLowerCase()} completas más cosas.`
                : 'Cuando completes objetivos verás qué días rindes más.'}
            </p>
            <ul className="bar-list">
              {WEEKDAYS.map((name, i) => (
                <li key={name} className={i === bestDay ? 'best' : undefined}>
                  <span className="bar-label">{name.slice(0, 3)}</span>
                  <span className="bar-track">
                    <span style={{ width: maxAvg ? `${(weekdayAvg[i] / maxAvg) * 100}%` : '0%' }} />
                  </span>
                  <span className="bar-value num">{weekdayAvg[i].toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>Objetivos diarios cumplidos</h2>
            <p className="panel-note">Porcentaje por semana, últimas {BAR_WEEKS}.</p>
            <div className="columns" role="img" aria-label={bars.map((b) => `Semana ${b.label}: ${b.value === null ? 'sin objetivos' : `${b.value} %`}`).join('; ')}>
              {bars.map((b) => (
                <div key={b.key} className={`column ${b.key === weekKey ? 'current' : ''}`}>
                  <span className="column-value num">{b.value === null ? '–' : `${b.value}%`}</span>
                  <span className="column-track">
                    <span style={{ height: `${b.value ?? 0}%` }} />
                  </span>
                  <span className="column-label num">S{b.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Hábitos</h2>
            {habits.length === 0 ? (
              <p className="panel-note">Añade hábitos en su pizarra para ver aquí su constancia.</p>
            ) : (
              <table className="habit-stats">
                <thead>
                  <tr>
                    <th scope="col">Hábito</th>
                    <th scope="col" className="num-col">
                      30 días
                    </th>
                    <th scope="col" className="num-col">
                      Racha
                    </th>
                    <th scope="col" className="num-col">
                      Mejor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {streaks.map(({ habit, current, best }) => (
                    <tr key={habit.id}>
                      <th scope="row">{habit.name}</th>
                      <td className="num-col num">{Math.round(completionRate(habit) * 100)}%</td>
                      <td className="num-col num">{current}</td>
                      <td className="num-col num">{best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

function parseDay(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
