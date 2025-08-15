import { useEffect, useState } from 'react'

type Props = { value: number; spawned?: boolean }

export default function Tile({ value, spawned }: Props) {
  const color = value===0? 'bg-tileEmpty' : value<=2? 'bg-tile2' : value<=4? 'bg-tile4' : value<=8? 'bg-tile8' : value<=16? 'bg-tile16' : value<=32? 'bg-tile32' : value<=64? 'bg-tile64' : value<=128? 'bg-tile128' : value<=256? 'bg-tile256' : value<=512? 'bg-tile512' : value<=1024? 'bg-tile1024' : 'bg-tile2048'
  const txt = value<=4? 'text-gray-700' : 'text-white'
  const [popping, setPopping] = useState(false)
  useEffect(() => {
    if (value > 0) {
      setPopping(true)
      const t = setTimeout(() => setPopping(false), 180)
      return () => clearTimeout(t)
    }
  }, [value])
  return (
    <div className={`w-full h-full ${color} rounded-lg md:rounded-xl flex items-center justify-center text-2xl md:text-3xl font-extrabold ${txt} shadow-sm shadow-black/10 ring-0 select-none tabular-nums ${popping ? 'animate-tile-pop' : ''} ${spawned ? 'animate-tile-spawn' : ''}`}>
      {value||''}
    </div>
  )
}
