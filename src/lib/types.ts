export type Horizon = 'day' | 'week' | 'month' | 'year'
export type Theme = 'blanca' | 'tiza' | 'corcho'

/** Índice del rotulador; cada tema decide qué color real es (negro, tiza blanca…). */
export type Ink = 1 | 2 | 3 | 4
export type PostitColor = 'yellow' | 'pink' | 'blue' | 'green'

export type Tool =
  | { kind: 'marker'; ink: Ink }
  | { kind: 'postit'; color: PostitColor }

export interface Note {
  id: string
  horizon: Horizon
  /** Clave del periodo al que pertenece: 2026-10-28, 2026-W44, 2026-10 o 2026. */
  period: string
  text: string
  done: boolean
  style: Tool
  /** Posición en % del tamaño de la pizarra. */
  x: number
  y: number
  rot: number
  createdAt: number
  /** Objetivo del nivel superior del que forma parte (día → semana → mes → año). */
  parentId?: string
  /** Veces que se ha pasado al periodo siguiente sin terminar. */
  carried?: number
  /** Pendiente que se decidió no pasar; ya no se vuelve a ofrecer. */
  dismissed?: boolean
}

export interface Habit {
  id: string
  name: string
  ink: Ink
  createdAt: number
  /** Días cumplidos, como claves de día (2026-10-28). */
  days: string[]
}

/** Qué hay en la pizarra: las notas de un periodo, los hábitos o el resumen. */
export type View = 'notes' | 'habits' | 'stats'
