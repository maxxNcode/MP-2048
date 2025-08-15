type Props = { score: number; moves?: number; maxTile?: number }

export default function ScorePanel({ score, moves, maxTile }: Props) {
  return (
    <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-sm">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Score</div>
          <div className="text-2xl font-bold tabular-nums whitespace-nowrap min-w-[4ch] mx-auto">{score}</div>
        </div>
        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Moves</div>
          <div className="text-2xl font-bold tabular-nums whitespace-nowrap min-w-[3ch] mx-auto">{moves ?? '—'}</div>
        </div>
        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Max</div>
          <div className="text-2xl font-bold tabular-nums whitespace-nowrap min-w-[4ch] mx-auto">{maxTile ?? '—'}</div>
        </div>
      </div>
    </div>
  )
}
