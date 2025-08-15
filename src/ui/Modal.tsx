import { ReactNode } from 'react'

type Props = {
  open: boolean
  title?: string
  children?: ReactNode
  onClose: () => void
  actions?: ReactNode
}

export default function Modal({ open, title, children, onClose, actions }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-5 space-y-3 border border-transparent dark:border-gray-800">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        <div>{children}</div>
        {actions && <div className="flex justify-end gap-2 pt-2">{actions}</div>}
      </div>
    </div>
  )
}
