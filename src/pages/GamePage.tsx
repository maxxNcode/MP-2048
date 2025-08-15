import { useEffect, useMemo, useRef, useState, type TouchEventHandler } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import GameBoard from '../ui/GameBoard'
import ScorePanel from '../ui/ScorePanel'
import MoveButtons from '../ui/MoveButtons'
import TurnIndicator from '../ui/TurnIndicator'
import RealtimeStatus from '../ui/RealtimeStatus'
import RoomCodeDisplay from '../ui/RoomCodeDisplay'
import Modal from '../ui/Modal'
import { applyMove, canMoveAny, createInitialBoard, Direction, scoreOfBoard } from '../util/game'
import { useToast } from '../context/ToastProvider'

function isEmptyBoard(b: number[][] | null | undefined) {
  if (!b) return true
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (b[r][c] !== 0) return false
  return true
}

export default function GamePage() {
  const { roomId } = useParams()
  const { profile } = useAuth()
  const { addToast } = useToast()
  const [board, setBoard] = useState<number[][]>(createInitialBoard())
  const [room, setRoom] = useState<any | null>(null)
  const [online, setOnline] = useState(true)
  const [moves, setMoves] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const containerRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<{x:number,y:number}|null>(null)
  const isSingle = roomId === 'single'
  const [gameOverOpen, setGameOverOpen] = useState(false)
  const [finalStats, setFinalStats] = useState<{ score: number; maxTile: number; moves: number; duration: number } | null>(null)
  const [spawn, setSpawn] = useState<{ r: number; c: number } | undefined>(undefined)
  const [muted, setMuted] = useState(false)
  const [dark, setDark] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)() } catch {}
    }
    return audioCtxRef.current
  }
  const playTone = (freq: number, durationMs: number, type: OscillatorType = 'sine') => {
    if (muted) return
    const ctx = ensureAudio()
    if (!ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    o.connect(g)
    g.connect(ctx.destination)
    const now = ctx.currentTime
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs/1000)
    o.start()
    o.stop(now + durationMs/1000 + 0.01)
  }

  // Load state for multiplayer
  useEffect(() => {
    if (!roomId || isSingle) return
    const load = async () => {
      const { data, error } = await supabase.from('multiplayer_rooms').select('*').eq('id', roomId).single()
      if (!error && data) {
        setRoom(data)
        if (data.board_state && !isEmptyBoard(data.board_state)) setBoard(data.board_state)
      }

    }
    void load()

    // subscribe to realtime updates
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` }, async (payload: any) => {
        const newRow: any = (payload as any).new
        setRoom(newRow)
        if (newRow.board_state && !isEmptyBoard(newRow.board_state)) setBoard(newRow.board_state)
        // Ensure we have the authoritative latest state
        const { data: latest, error: latestErr } = await supabase
          .from('multiplayer_rooms')
          .select('*')
          .eq('id', roomId)
          .single()
        if (!latestErr && latest) {
          setRoom(latest)
          if (latest.board_state && !isEmptyBoard(latest.board_state)) setBoard(latest.board_state)
        }
      })
      .subscribe((status: any) => setOnline(status === 'SUBSCRIBED'))

    return () => { void supabase.removeChannel(channel) }
  }, [roomId, isSingle])

  // Fallback polling to ensure updates even if realtime misses
  useEffect(() => {
    if (!roomId || isSingle) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('multiplayer_rooms')
        .select('*')
        .eq('id', roomId)
        .single()
      if (data) {
        setRoom(data)
        if (data.board_state && !isEmptyBoard(data.board_state)) setBoard(data.board_state)
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [roomId, isSingle])

  const myTurn = useMemo(() => {
    if (isSingle) return true
    if (!room || !profile) return false
    return room.current_turn === profile.id
  }, [room, profile, isSingle])

  const move = async (dir: Direction) => {
    if (isSingle) {
      const next = applyMove(board, dir)
      if (next.changed) {
        setBoard(next.board)
        setMoves((m: number) => m + 1)
        setSpawn(next.spawn)
        // sounds: tick on move, blip on merge
        playTone(220, 80, 'triangle')
        if (next.gain > 0) playTone(440, 120, 'sawtooth')
        // check game over after applying move
        if (!canMoveAny(next.board)) {
          const score = scoreOfBoard(next.board)
          const maxTile = Math.max(...next.board.flat())
          const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
          const totalMoves = moves + 1
          if (profile) {
            await supabase.rpc('record_single_player_score', {
              p_user_id: profile.id,
              p_score: score,
              p_max_tile: maxTile,
              p_moves: totalMoves,
              p_duration: duration,
            })
          }
          setFinalStats({ score, maxTile, moves: totalMoves, duration })
          setGameOverOpen(true)
        }
      }
      return
    }
    if (!roomId || !profile || !myTurn) return
    const { error } = await supabase.rpc('make_move', { p_room_id: roomId, p_user_id: profile.id, p_direction: dir })
    if (error) { addToast({ type: 'error', title: 'Move failed', message: error.message }); return }
    // Optimistically fetch the latest room state so mover sees update immediately
    const { data: updated, error: fetchErr } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    if (!fetchErr && updated) {
      setRoom(updated)
      if (updated.board_state && !isEmptyBoard(updated.board_state)) setBoard(updated.board_state)
    }
  }

  // Touch swipe controls (declared after move)
  const onTouchStart: TouchEventHandler<HTMLDivElement> = (e) => {
    const t = e.changedTouches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd: TouchEventHandler<HTMLDivElement> = (e) => {
    if (!touchStartRef.current) return
    const start = touchStartRef.current
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    const absX = Math.abs(dx), absY = Math.abs(dy)
    const threshold = 24
    let dir: Direction | null = null
    if (absX > absY && absX > threshold) dir = dx > 0 ? 'right' : 'left'
    else if (absY > threshold) dir = dy > 0 ? 'down' : 'up'
    if (dir) void move(dir)
    touchStartRef.current = null
  }

  // Keyboard controls (Arrows and WASD)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      let dir: Direction | null = null
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': dir = 'up'; break
        case 'ArrowDown': case 's': case 'S': dir = 'down'; break
        case 'ArrowLeft': case 'a': case 'A': dir = 'left'; break
        case 'ArrowRight': case 'd': case 'D': dir = 'right'; break
      }
      if (dir) {
        e.preventDefault()
        void move(dir)
      }
    }
    window.addEventListener('keydown', onKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [move])

  const canMove = myTurn && canMoveAny(board)
  const score = scoreOfBoard(board)
  const maxTile = useMemo(() => Math.max(...board.flat()), [board])

  const newGame = () => {
    setBoard(createInitialBoard())
    setMoves(0)
    startTimeRef.current = Date.now()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">2048</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Merge tiles with arrow keys (or WASD) or swipe on mobile.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setDark(d=>!d)} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 text-sm">{dark? 'Light' : 'Dark'}</button>
          <button onClick={()=>setMuted(m=>!m)} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 text-sm">{muted? 'Unmute' : 'Mute'}</button>
          {isSingle && (
            <button onClick={newGame} className="px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] transition text-sm">New Game</button>
          )}
        </div>
      </div>
      <button onClick={()=>setShowHelp(v=>!v)} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400 mb-3">{showHelp? 'Hide' : 'Show'} how to play</button>
      {showHelp && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-3 text-sm text-gray-700 dark:text-gray-200">
          Combine tiles with the same number to add them together. Try to reach 2048! Use Arrow keys / WASD or swipe. Press New Game anytime.
        </div>
      )}
      <div ref={containerRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="flex-1 min-h-0 grid md:grid-cols-[1fr,300px] gap-4 items-start overflow-hidden">
        <div className="min-h-0 overflow-auto">
          <div className="flex items-center justify-between mb-3">
          <TurnIndicator status={isSingle ? 'your_turn' : myTurn ? 'your_turn' : 'opponent_turn'} />
          {!isSingle && <RealtimeStatus online={online} />}
          </div>
          <GameBoard board={board} spawn={spawn} />
          <div className="h-2" />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 shadow-lg p-4 space-y-3 min-h-0 overflow-auto">
          <ScorePanel score={score} moves={moves} maxTile={maxTile} />
          <div className="flex justify-center pt-2">
            <MoveButtons disabled={!canMove} onMove={move} />
          </div>
          {!isSingle && room && <RoomCodeDisplay code={room.code} />}
        </div>
      </div>
      
      <Modal
        open={gameOverOpen}
        title="Game over"
        onClose={() => setGameOverOpen(false)}
        actions={
          <>
            <button onClick={() => setGameOverOpen(false)} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Close</button>
            <button onClick={() => { setGameOverOpen(false); newGame() }} className="px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800">Play again</button>
          </>
        }
      >
        {finalStats && (
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 dark:border dark:border-gray-700 p-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Score</div>
              <div className="text-xl font-bold tabular-nums">{finalStats.score}</div>
            </div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 dark:border dark:border-gray-700 p-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Max Tile</div>
              <div className="text-xl font-bold tabular-nums">{finalStats.maxTile}</div>
            </div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 dark:border dark:border-gray-700 p-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Moves</div>
              <div className="text-xl font-bold tabular-nums">{finalStats.moves}</div>
            </div>
            <div className="rounded-md bg-gray-50 dark:bg-gray-800 dark:border dark:border-gray-700 p-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Time</div>
              <div className="text-xl font-bold tabular-nums">{finalStats.duration}s</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
