import { CloseIcon } from '../icons'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Panel max-width class, e.g. 'max-w-md', 'max-w-2xl'. Default 'max-w-md'. */
  size?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, size = 'max-w-md', children }: ModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 dark:bg-black/55 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border)] w-full shadow-none overflow-hidden animate-scale-in ${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-accent-muted)]">
          {title && (
            <h2 id="modal-title" className="text-xs font-bold text-neutral-500 uppercase tracking-[0.15em]">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-neutral-500 hover:bg-[var(--color-charcoal)] hover:text-neutral-900 ml-auto transition-colors duration-150 active:scale-95"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
