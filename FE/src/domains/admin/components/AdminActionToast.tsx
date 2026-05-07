import { Toast } from '../../../components/common'

interface AdminActionToastProps {
  message: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  onClose: () => void
}

export function AdminActionToast({ message, variant = 'success', onClose }: AdminActionToastProps) {
  return (
    <div className="fixed right-4 top-20 z-40 w-[min(360px,calc(100vw-2rem))]">
      <Toast variant={variant} onClose={onClose}>
        {message}
      </Toast>
    </div>
  )
}

