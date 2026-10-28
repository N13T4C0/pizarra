import { forwardRef } from 'react'
import type { Ink, PostitColor, Tool } from '../lib/types'
import type { DragState } from './NoteItem'

const INKS: Ink[] = [1, 2, 3, 4]
const POSTITS: PostitColor[] = ['yellow', 'pink', 'blue', 'green']
const POSTIT_NAMES: Record<PostitColor, string> = { yellow: 'amarillo', pink: 'rosa', blue: 'azul', green: 'verde' }

interface Props {
  tool: Tool
  dragState: DragState
  onTool: (t: Tool) => void
}

/** La repisa de abajo: rotuladores, taco de post-its y borrador (que sirve de papelera). */
export const Tray = forwardRef<HTMLDivElement, Props>(function Tray({ tool, dragState, onTool }, eraserRef) {
  return (
    <div className="tray" role="toolbar" aria-label="Herramientas">
      <div className="markers">
        {INKS.map((ink) => (
          <button
            key={ink}
            className={`marker-pen ink-${ink}`}
            aria-label={`Rotulador ${ink}`}
            aria-pressed={tool.kind === 'marker' && tool.ink === ink}
            onClick={() => onTool({ kind: 'marker', ink })}
          >
            <span className="cap" />
            <span className="body" />
          </button>
        ))}
      </div>

      <div className="postits">
        {POSTITS.map((color) => (
          <button
            key={color}
            className={`postit-pad postit-${color}`}
            aria-label={`Post-it ${POSTIT_NAMES[color]}`}
            aria-pressed={tool.kind === 'postit' && tool.color === color}
            onClick={() => onTool({ kind: 'postit', color })}
          />
        ))}
      </div>

      <div ref={eraserRef} className={`eraser ${dragState}`} aria-label="Borrador: arrastra una nota aquí para borrarla">
        <span className="felt" />
        <span className="label">{dragState === 'idle' ? 'Borrador' : 'Suelta para borrar'}</span>
      </div>
    </div>
  )
})
