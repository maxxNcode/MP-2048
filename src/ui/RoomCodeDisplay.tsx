import { useState } from 'react'

export default function RoomCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // noop
    }
  }
  return (
    <div className="mt-3 p-3 border dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-gray-500">Room code</div>
        <div className="font-mono text-lg">{code}</div>
      </div>
      <button onClick={copy} className="px-3 py-1.5 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] transition">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
