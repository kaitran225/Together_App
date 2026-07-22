import { useEffect, useState } from 'react'

const CHECK_MS = 15_000
const TIMEOUT_MS = 4_000

async function isServerReachable(): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const r = await fetch('/actuator/health', { signal: ctrl.signal, cache: 'no-store' })
    return r.ok
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

/** Full-screen gate when home BE / gateway is unreachable (FE static still loads). */
export function ServerBusyOverlay() {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      const ok = await isServerReachable()
      if (!cancelled) setBusy(!ok)
    }
    void tick()
    const id = window.setInterval(tick, CHECK_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  if (!busy) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-neutral-950/85 px-6 text-center backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Server đang bận học rồi
      </p>
      <p className="max-w-sm text-sm text-neutral-300">
        Hệ thống tạm thời không kết nối được. Thử lại sau nhé.
      </p>
    </div>
  )
}
