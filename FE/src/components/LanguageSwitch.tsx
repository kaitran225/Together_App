import { useTranslation } from '../contexts/LanguageContext'

export function LanguageSwitch() {
  const { language, setLanguage } = useTranslation()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en')
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-charcoal)] text-neutral-900 text-sm font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Switch language"
      title={language === 'en' ? 'Chuyển sang tiếng Việt' : 'Switch to English'}
    >
      <span className="text-base leading-none shrink-0" aria-hidden>
        {language === 'en' ? '🇬🇧' : '🇻🇳'}
      </span>
      <span className="hidden sm:inline font-extrabold uppercase tracking-widest text-[10px] text-neutral-700 dark:text-neutral-300">
        {language === 'en' ? 'EN' : 'VI'}
      </span>
    </button>
  )
}
