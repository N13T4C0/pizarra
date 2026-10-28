import { useEffect, useState } from 'react'

/** useState que se guarda en localStorage. Si el almacenamiento falla, sigue funcionando en memoria. */
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return JSON.parse(raw) as T
    } catch {
      /* almacenamiento bloqueado o JSON corrupto */
    }
    return initial instanceof Function ? initial() : initial
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* modo privado o cuota llena */
    }
  }, [key, value])

  return [value, setValue] as const
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
