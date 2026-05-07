/** AI chat avatar/icon from public/together. Use in AI-related chat UIs. */
export function AiBotIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <img
      src="/together/ai-bot-icon.svg"
      alt=""
      role="presentation"
      className={`object-contain ${className}`}
    />
  )
}
