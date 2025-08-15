import { Outlet, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthProvider'
import { useEffect, useState } from 'react'

function Navbar() {
  const { user, signOut } = useAuth()
  const loc = useLocation()
  const [dark, setDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'))
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  const linkCls = (active: boolean) => `px-2 py-1 rounded-md ${active? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}`
  return (
    <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-900/60 bg-white/95 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-extrabold tracking-tight text-lg">MP 2048</Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className={linkCls(loc.pathname==='/' )}>Lobby</Link>
          <Link to="/leaderboards" className={linkCls(loc.pathname.startsWith('/leaderboards'))}>Leaderboards</Link>
          <Link to="/profile" className={linkCls(loc.pathname.startsWith('/profile'))}>Profile</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={()=>setDark(d=>!d)} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 text-sm">{dark? 'Light' : 'Dark'}</button>
          {user ? (
            <button onClick={signOut} className="px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 text-sm">Sign out</button>
          ) : (
            <Link to="/auth" className="px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 text-sm">Sign in</Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 min-h-0 overflow-hidden">
          <div className="max-w-5xl mx-auto p-4 h-full overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </AuthProvider>
  )
}
