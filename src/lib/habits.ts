import type { Habit } from './types'
import { periodKey } from './periods'

export const dayKey = (d: Date) => periodKey('day', d)

export function addDays(d: Date, n: number) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() + n)
  return r
}

export function mondayOf(d: Date) {
  return addDays(d, -((d.getDay() + 6) % 7))
}

/**
 * Racha actual: días seguidos cumplidos hasta hoy.
 * Si hoy aún no está marcado, la racha sigue viva desde ayer (el día no ha terminado).
 */
export function currentStreak(habit: Habit, today = new Date()) {
  const done = new Set(habit.days)
  let d = done.has(dayKey(today)) ? today : addDays(today, -1)
  let n = 0
  while (done.has(dayKey(d))) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export function bestStreak(habit: Habit) {
  const days = [...habit.days].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const key of days) {
    const [y, m, d] = key.split('-').map(Number)
    run = prev && dayKey(addDays(new Date(y, m - 1, d), -1)) === prev ? run + 1 : 1
    best = Math.max(best, run)
    prev = key
  }
  return best
}

/** Porcentaje de días cumplidos en los últimos `span` días (sin contar los anteriores a crearlo). */
export function completionRate(habit: Habit, span = 30, today = new Date()) {
  const done = new Set(habit.days)
  const created = new Date(habit.createdAt)
  let total = 0
  let hits = 0
  for (let i = 0; i < span; i++) {
    const d = addDays(today, -i)
    if (d < addDays(created, 0)) break
    total++
    if (done.has(dayKey(d))) hits++
  }
  return total ? hits / total : 0
}
