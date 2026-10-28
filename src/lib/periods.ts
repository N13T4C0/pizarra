import type { Horizon } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const year = t.getUTCFullYear()
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)
  return { year, week }
}

function monday(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}

export function periodKey(h: Horizon, d: Date): string {
  switch (h) {
    case 'day':
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    case 'week': {
      const { year, week } = isoWeek(d)
      return `${year}-W${pad(week)}`
    }
    case 'month':
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    case 'year':
      return String(d.getFullYear())
  }
}

export function shiftDate(h: Horizon, d: Date, delta: number): Date {
  const n = new Date(d)
  if (h === 'day') n.setDate(n.getDate() + delta)
  if (h === 'week') n.setDate(n.getDate() + 7 * delta)
  if (h === 'month') n.setMonth(n.getMonth() + delta, 1)
  if (h === 'year') n.setFullYear(n.getFullYear() + delta)
  return n
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-ES', o)

export function periodLabel(h: Horizon, d: Date): { title: string; subtitle?: string } {
  switch (h) {
    case 'day':
      return { title: cap(fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(d)) }
    case 'week': {
      const start = monday(d)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const short = fmt({ day: 'numeric', month: 'short' })
      return {
        title: `Semana ${isoWeek(d).week}`,
        subtitle: `${short.format(start)} – ${short.format(end)}`,
      }
    }
    case 'month':
      return { title: cap(fmt({ month: 'long', year: 'numeric' }).format(d)) }
    case 'year':
      return { title: String(d.getFullYear()) }
  }
}

export const HORIZONS: { id: Horizon; label: string; current: string; today: string; this: string }[] = [
  { id: 'day', label: 'Hoy', current: 'Objetivos de hoy', today: 'Hoy', this: 'hoy' },
  { id: 'week', label: 'Semana', current: 'Esta semana', today: 'Esta semana', this: 'esta semana' },
  { id: 'month', label: 'Mes', current: 'Este mes', today: 'Este mes', this: 'este mes' },
  { id: 'year', label: 'Año', current: 'Este año', today: 'Este año', this: 'este año' },
]

export const PARENT: Record<Horizon, Horizon | null> = { day: 'week', week: 'month', month: 'year', year: null }
export const CHILD: Record<Horizon, Horizon | null> = { day: null, week: 'day', month: 'week', year: 'month' }

/** Nombre corto de un periodo a partir de su clave, para listas: "27 oct", "Sem. 43", "sept 2026". */
export function periodShort(h: Horizon, key: string): string {
  const [y, m, d] = key.split('-').map((p) => parseInt(p.replace('W', ''), 10))
  switch (h) {
    case 'day':
      return fmt({ day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
    case 'week':
      return `Sem. ${m}`
    case 'month':
      return fmt({ month: 'short', year: 'numeric' }).format(new Date(y, m - 1, 1))
    case 'year':
      return key
  }
}
