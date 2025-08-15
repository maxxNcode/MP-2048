import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const { signIn, signUp, loading, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // If already signed in, go to lobby
  useEffect(() => {
    if (!loading && user) navigate('/')
  }, [loading, user, navigate])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading || submitting) return
    setErrorMsg(null)
    setSubmitting(true)
    try {
      if (mode==='signin') await signIn(email, password)
      else await signUp(email, password)
      // With email confirmation disabled, session is ready; go to lobby
      navigate('/')
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-xl font-semibold mb-4">{mode==='signin' ? 'Sign in' : 'Sign up'}</h1>
      {user && <p className="text-green-700 text-sm mb-2">Already signed in</p>}
      {errorMsg && <p className="text-red-600 text-sm mb-2">{errorMsg}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border px-3 py-2 rounded" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border px-3 py-2 rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
        <button disabled={loading || submitting} className="w-full bg-gray-900 text-white rounded py-2 disabled:opacity-50">
          {submitting ? 'Please wait…' : (mode==='signin'?'Sign in':'Create account')}
        </button>
      </form>
      <button className="mt-3 text-sm underline disabled:opacity-50" onClick={()=>setMode(m=>m==='signin'?'signup':'signin')} disabled={submitting}>
        {mode==='signin'?'Need an account? Sign up':'Have an account? Sign in'}
      </button>
    </div>
  )
}
