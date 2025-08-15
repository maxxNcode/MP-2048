export default function TurnIndicator({ status }: { status: 'your_turn'|'opponent_turn'|'waiting' }) {
  const map = {
    your_turn: { text: "Your turn", cls: 'bg-emerald-100 text-emerald-700' },
    opponent_turn: { text: "Opponent's turn", cls: 'bg-amber-100 text-amber-700' },
    waiting: { text: 'Waiting for opponent', cls: 'bg-gray-100 text-gray-700' },
  } as const
  const s = map[status]
  return <span className={`px-3 py-1 rounded text-sm ${s.cls}`}>{s.text}</span>
}
