import { useTranslation } from '../contexts/LanguageContext'

export function LanguageSwitch() {
  const { language, setLanguage, t } = useTranslation()

  return (
    <div
      className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-charcoal)] p-0.5"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
          language === 'en'
            ? 'bg-[var(--color-surface)] text-neutral-900 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-800'
        }`}
        aria-pressed={language === 'en'}
        title={t('lang.switchToEn')}
      >
        <span aria-hidden>🇬🇧</span>
        <span className="hidden sm:inline">{t('lang.en')}</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
          language === 'vi'
            ? 'bg-[var(--color-surface)] text-neutral-900 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-800'
        }`}
        aria-pressed={language === 'vi'}
        title={t('lang.switchToVi')}
      >
        <span aria-hidden>🇻🇳</span>
        <span className="hidden sm:inline">{t('lang.vi')}</span>
      </button>
    </div>
  )
}
