import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../context/ToastProvider'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user?.user_metadata as any)?.avatar_url ?? null)
  const { addToast } = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)

  useEffect(() => setUsername(profile?.username ?? ''), [profile?.username])

  const save = async () => {
    if (!user) return
    await supabase.from('profiles').update({ username }).eq('id', user.id)
    addToast({ type: 'success', title: 'Saved', message: 'Profile updated.' })
  }

  const onAvatarChange = async (file?: File) => {
    try {
      if (!user || !file) return
      const ext = file.name.split('.').pop() || 'png'
      const path = `${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) { addToast({ type: 'error', title: 'Upload failed', message: upErr.message }); return }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = data.publicUrl
      const { error: metaErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      if (metaErr) { addToast({ type: 'error', title: 'Save failed', message: metaErr.message }); return }
      setAvatarUrl(publicUrl)
      addToast({ type: 'success', title: 'Avatar updated', message: 'Your avatar has been updated.' })
    } catch (e:any) {
      addToast({ type: 'error', title: 'Unexpected error', message: e?.message || 'Could not upload avatar.' })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
      <h2 className="font-semibold mb-4 text-xl text-center">Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left: Profile basics */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 shadow-lg p-6">
          {/* Email */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
            <div className="text-sm text-gray-800 dark:text-gray-200">{user?.email ?? '—'}</div>
          </div>

          {/* Avatar */}
          <div className="mb-4 flex items-center gap-3">
            <img src={avatarUrl || 'https://api.dicebear.com/7.x/thumbs/svg?seed=mp2048'} alt="Avatar" className="w-16 h-16 rounded-full border border-gray-200 dark:border-gray-700 object-cover" />
            <label className="text-sm">
              <span className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 cursor-pointer inline-block">Upload avatar</span>
              <input type="file" accept="image/*" className="hidden" onChange={e=>onAvatarChange(e.target.files?.[0])} />
            </label>
          </div>

          {/* Username */}
          <label className="text-sm text-gray-700 dark:text-gray-300">Username</label>
          <input
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={username}
            onChange={e=>setUsername(e.target.value)}
          />
          <button onClick={save} className="mt-3 px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800">Save</button>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Note: Requires a public Supabase Storage bucket named <code>avatars</code>.</p>
        </div>

        {/* Right: Security */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/80 shadow-lg p-6">
          <h3 className="font-medium mb-2 flex items-center gap-2">🔐 Security</h3>
          {/* Change password */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/70 dark:bg-gray-900/60">
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Change password</div>
            <div className="grid gap-2">
              <input
                type="password"
                placeholder="New password"
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newPassword}
                onChange={e=>setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={confirmPassword}
                onChange={e=>setConfirmPassword(e.target.value)}
              />
              <button
                onClick={async ()=>{
                  if (!user) return
                  if (newPassword.length < 8) { addToast({ type:'error', title:'Too short', message:'Password must be at least 8 characters.' }); return }
                  if (newPassword !== confirmPassword) { addToast({ type:'error', title:'Mismatch', message:'Passwords do not match.' }); return }
                  try {
                    setPwLoading(true)
                    const { error } = await supabase.auth.updateUser({ password: newPassword })
                    if (error) { addToast({ type:'error', title:'Could not update', message:error.message }); }
                    else {
                      setNewPassword('')
                      setConfirmPassword('')
                      addToast({ type:'success', title:'Password updated', message:'Use your new password next sign-in.' })
                    }
                  } finally {
                    setPwLoading(false)
                  }
                }}
                disabled={pwLoading}
                className="mt-1 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >{pwLoading ? 'Updating…' : 'Update password'}</button>
            </div>
          </div>

          {/* Sign out of all devices */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/70 dark:bg-gray-900/60 mt-3">
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Sign out everywhere</div>
            <button
              onClick={async ()=>{
                try {
                  setSignOutLoading(true)
                  // Global sign-out to invalidate all sessions
                  await supabase.auth.signOut({ scope: 'global' as any })
                  addToast({ type:'success', title:'Signed out', message:'All sessions have been signed out.' })
                } catch (e:any) {
                  addToast({ type:'error', title:'Error', message:e?.message || 'Failed to sign out globally.' })
                } finally {
                  setSignOutLoading(false)
                }
              }}
              disabled={signOutLoading}
              className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >{signOutLoading ? 'Signing out…' : 'Sign out of all devices'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
