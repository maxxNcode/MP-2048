import Tile from './Tile'

type Props = { board: number[][]; spawn?: { r: number; c: number } }

export default function GameBoard({ board, spawn }: Props) {
  return (
    <div className="inline-block board-frame rounded-xl md:rounded-2xl w-full max-w-[min(96vmin,560px)] aspect-square shadow-lg">
      <div className="grid grid-cols-4 grid-rows-4 gap-1 sm:gap-1.5 md:gap-2 p-1 sm:p-1.5 md:p-2 rounded-xl md:rounded-2xl board-surface h-full">
        {board.flatMap((row, rIdx) => row.map((v, cIdx) => (
          <Tile key={`${rIdx}-${cIdx}`} value={v} spawned={!!spawn && spawn.r===rIdx && spawn.c===cIdx} />
        )))}
      </div>
    </div>
  )
}
