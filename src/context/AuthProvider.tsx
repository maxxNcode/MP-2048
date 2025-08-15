import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { generateUsername } from '../lib/username'

type Ctx = {
  user: User | null
  profile: { id: string; username: string } | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Ctx['profile']>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, sess) => setSession(sess))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      if (!session?.user) {
        setProfile(null)
        setLoading(false)
        return
      }
      const { data, error } = await supabase.from('profiles').select('id, username').eq('id', session.user.id).maybeSingle()
      if (error) console.error(error)
      if (!data) {
        // create profile with random username
        const username = generateUsername()
        const { error: upErr } = await supabase.from('profiles').insert({ id: session.user.id, username })
        if (upErr) console.error(upErr)
        setProfile({ id: session.user.id, username })
      } else {
        setProfile(data)
      }
      setLoading(false)
    }
    void init()
  }, [session])

  const value = useMemo<Ctx>(() => ({
    user: session?.user ?? null,
    profile,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    signUp: async (email, password) => {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    },
    signOut: async () => { await supabase.auth.signOut() },
  }), [session, profile, loading])

  return (
    <AuthCtx.Provider value={value}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
