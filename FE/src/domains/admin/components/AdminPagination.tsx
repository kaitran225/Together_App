import { Button } from '../../../components/common'

interface AdminPaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function AdminPagination({ page, totalPages, onChange }: AdminPaginationProps) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-xs text-neutral-600">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

