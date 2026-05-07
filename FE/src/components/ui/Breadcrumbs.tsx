export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  /** Separator style */
  separator?: 'chevron' | 'slash' | 'dot'
  /** Max items to show; collapse middle with ... */
  maxItems?: number
  className?: string
}

const chevronIcon = (
  <svg width="5" height="7" viewBox="0 0 5 7" fill="none" className="text-primary">
    <path
      d="M2.68333 3.5L0 0.816667L0.816667 0L4.31667 3.5L0.816667 7L0 6.18333L2.68333 3.5Z"
      fill="currentColor"
    />
  </svg>
)

export function Breadcrumbs({
  items,
  separator = 'chevron',
  maxItems,
  className = '',
}: BreadcrumbsProps) {
  const displayItems =
    maxItems != null && items.length > maxItems
      ? [
          items[0],
          { label: '...', href: undefined } as BreadcrumbItem,
          items[items.length - 1],
        ]
      : items

  const Sep = () => (
    <span className="text-primary/70 px-1" aria-hidden>
      {separator === 'chevron' ? chevronIcon : separator === 'slash' ? '/' : '·'}
    </span>
  )

  return (
    <nav aria-label="Breadcrumb" className={`inline-flex items-center gap-1 ${className}`}>
      {displayItems.map((item, i) => {
        const isLast = i === displayItems.length - 1
        const isEllipsis = item.label === '...'
        return (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && <Sep />}
            {isEllipsis ? (
              <span className="text-sm text-primary/70">...</span>
            ) : item.href && !isLast ? (
              <a
                href={item.href}
                className="text-sm font-medium text-primary underline underline-offset-2 hover:text-accent"
              >
                {item.label}
              </a>
            ) : (
              <span className={`text-sm ${isLast ? 'font-bold' : 'font-normal'} text-neutral-900 dark:text-neutral-900`}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
