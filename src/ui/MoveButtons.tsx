import { Direction } from '../util/game'

type Props = { disabled?: boolean; onMove: (d: Direction) => void }

export default function MoveButtons({ disabled, onMove }: Props) {
  const btn = 'w-12 h-12 rounded-md bg-gray-900 text-white text-lg flex items-center justify-center shadow-sm hover:bg-gray-800 active:scale-[0.98] transition disabled:opacity-50 disabled:hover:bg-gray-900'
  return (
    <div className="inline-grid grid-cols-3 gap-2 select-none" role="group" aria-label="Move controls">
      <div />
      <button aria-label="Move up" className={btn} onClick={()=>onMove('up')} disabled={disabled}>↑</button>
      <div />
      <button aria-label="Move left" className={btn} onClick={()=>onMove('left')} disabled={disabled}>←</button>
      <div className="w-12 h-12 flex items-center justify-center text-xs text-gray-400">WASD</div>
      <button aria-label="Move right" className={btn} onClick={()=>onMove('right')} disabled={disabled}>→</button>
      <div />
      <button aria-label="Move down" className={btn} onClick={()=>onMove('down')} disabled={disabled}>↓</button>
      <div />
    </div>
  )
}
