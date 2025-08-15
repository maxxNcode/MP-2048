import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthProvider'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastProvider'

function randomCode(len=6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({length: len}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
}

export default function LobbyPage() {
  const { profile } = useAuth()
  const [joiningCode, setJoiningCode] = useState('')
  const nav = useNavigate()
  const { addToast } = useToast()

  const canCreate = !!profile

  const createRoom = async () => {
    if (!profile) return
    const { data, error } = await supabase.rpc('create_room', { creator_id: profile.id })
    if (error) { addToast({ type: 'error', title: 'Could not create room', message: error.message }); return }
    nav(`/game/${data.room_id}`)
  }

  const joinRoom = async () => {
    const code = joiningCode.trim().toUpperCase()
    if (!profile || !code) return
    const { data, error } = await supabase.rpc('join_room', { p_code: code, p_user_id: profile.id })
    if (error) { addToast({ type: 'error', title: 'Join failed', message: error.message }); return }
    nav(`/game/${data.room_id}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 shadow-lg p-6">
        <h2 className="font-semibold text-lg mb-2">Create Multiplayer Room</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">You'll get a short join code to share.</p>
        <button
          disabled={!canCreate}
          onClick={createRoom}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >Create Room</button>
        {!canCreate && <p className="text-xs text-red-600 mt-2">Sign in to create a room.</p>}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 shadow-lg p-6">
        <h2 className="font-semibold text-lg mb-2">Join Multiplayer Room</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="ENTER CODE"
            value={joiningCode}
            onChange={e=>setJoiningCode(e.target.value)}
          />
          <button onClick={joinRoom} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500">Join</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 shadow-lg p-6 md:col-span-2">
        <h2 className="font-semibold text-lg mb-2">Single Player</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Practice and chase high scores solo.</p>
        <Link to="/game/single" className="inline-flex items-center px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800">Play</Link>
      </div>
    </div>
  )
}
