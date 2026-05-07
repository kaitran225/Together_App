import type { SVGAttributes } from 'react'

export function CloseIcon({ className = 'w-5 h-5', ...props }: { className?: string } & SVGAttributes<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
