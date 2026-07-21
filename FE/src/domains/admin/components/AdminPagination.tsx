import { Button } from '../../../components/common'
import { useTranslation } from '../../../contexts/LanguageContext'

interface AdminPaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function AdminPagination({ page, totalPages, onChange }: AdminPaginationProps) {
  const { t } = useTranslation()
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-xs text-neutral-600">
        {t('admin.pageOf', { page, total: totalPages })}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          {t('common.previous')}
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          {t('common.next')}
        </Button>
      </div>
    </div>
  )
}
