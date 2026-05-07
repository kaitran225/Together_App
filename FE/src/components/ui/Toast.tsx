import type { HTMLAttributes, ReactNode } from 'react'
import { IconButton } from './IconButton'
import { CloseIcon } from '../icons'

type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

const variantClasses: Record<ToastVariant, string> = {
  default: 'border border-white/10 bg-[var(--color-surface)]',
  success: 'border border-success/40 bg-success/20',
  warning: 'border border-warning/40 bg-warning/25',
  error: 'border border-error/40 bg-error/20',
  info: 'border border-accent/40 bg-accent/20',
}

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant
  icon?: ReactNode
  action?: ReactNode
  onClose?: () => void
}

export function Toast({ variant = 'default', icon, action, onClose, className = '', children, ...props }: ToastProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-[var(--radius-card)] shadow-none ${variantClasses[variant]} ${className}`.trim()} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="text-sm font-medium text-neutral-900 flex-1">{children}</div>
      {action}
      {onClose && (
        <IconButton
          icon={<CloseIcon className="w-4 h-4" />}
          label="Close"
          size="sm"
          variant="ghost"
          onClick={onClose}
        />
      )}
    </div>
  )
}
