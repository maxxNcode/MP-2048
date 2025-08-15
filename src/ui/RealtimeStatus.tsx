export default function RealtimeStatus({ online }: { online: boolean }) {
  return (
    <span className={`text-xs ${online? 'text-emerald-600' : 'text-red-600'}`}>{online? 'Online' : 'Disconnected'}</span>
  )
}
