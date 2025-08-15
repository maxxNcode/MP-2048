import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type SPS = { id: string; score: number; max_tile: number; moves: number; duration_seconds: number; created_at: string; profiles: { username: string } }

type MPS = { profile_id: string; wins: number; losses: number; draws: number; rating: number; profiles: { username: string } }

export default function LeaderboardPage() {
  const [single, setSingle] = useState<SPS[]>([])
  const [multi, setMulti] = useState<MPS[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: sps } = await supabase
        .from('single_player_scores')
        .select('id, score, max_tile, moves, duration_seconds, created_at, profiles!inner(username)')
        .order('score', { ascending: false })
        .limit(20)
        .returns<SPS[]>()
      const { data: mps } = await supabase
        .from('multiplayer_stats')
        .select('profile_id, wins, losses, draws, rating, profiles!inner(username)')
        .order('rating', { ascending: false })
        .limit(20)
        .returns<MPS[]>()
      setSingle(sps ?? [])
      setMulti(mps ?? [])
      setLoading(false)
    }
    void load()
  }, [])

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 shadow-lg p-4">
        <h2 className="font-semibold mb-1">🏆 Single-player Top Scores</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Highest scores achieved in solo games.</p>
        {loading ? (
          <ul className="animate-pulse space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
              </li>
            ))}
          </ul>
        ) : (
          <ol className="divide-y divide-gray-100 dark:divide-gray-800">
            {single.map((r, i) => (
              <li key={r.id} className="flex justify-between text-sm py-2">
                <span className="text-gray-700 dark:text-gray-200">{i+1}. {r.profiles.username}</span>
                <span className="text-gray-600 dark:text-gray-300">{r.score} pts • max {r.max_tile}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 shadow-lg p-4">
        <h2 className="font-semibold mb-1">👥 Multiplayer Ranking</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Top players by ELO-like rating.</p>
        {loading ? (
          <ul className="animate-pulse space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <li key={idx} className="flex justify-between items-center">
                <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
              </li>
            ))}
          </ul>
        ) : (
          <ol className="divide-y divide-gray-100 dark:divide-gray-800">
            {multi.map((r, i) => (
              <li key={r.profile_id} className="flex justify-between text-sm py-2">
                <span className="text-gray-700 dark:text-gray-200">{i+1}. {r.profiles.username}</span>
                <span className="text-gray-600 dark:text-gray-300">W{r.wins}-L{r.losses}-D{r.draws} • {Math.round(r.rating)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
