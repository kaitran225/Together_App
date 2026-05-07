import type React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Input } from '../../../components/common'
import { PACKS } from '../../../mocks'

const PACK_ICONS: Record<string, React.ReactNode> = {
  starter: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  student: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>,
  pro: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  squad: <span className="text-xs font-bold">G</span>,
  mastery: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  ultimate: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
}

export default function Shop() {
  const [promoCode, setPromoCode] = useState('')
  const balance = 1250

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col px-4 py-3 sm:px-5">
      {/* Heading — compact */}
      <div className="flex flex-col items-center gap-2 pb-5 sm:pb-6">
        <h1 className="text-center text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl">
          Buy Coins
        </h1>
        <p className="max-w-[26rem] text-center text-xs leading-5 text-neutral-700 sm:text-sm">
          Boost your learning experience with additional coins.
        </p>
        <p className="rounded-md border border-white/10 bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-neutral-900">
          {balance.toLocaleString()} Coins
        </p>
      </div>

      {/* Packs grid — compact cards */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`relative flex min-w-0 flex-col justify-between rounded-xl border-2 p-4 sm:p-5 ${
              pack.popular
                ? 'border-primary/50 bg-primary/10'
                : 'border-white/10 bg-[var(--color-surface)]'
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-primary px-2 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  Most Popular
                </span>
              </div>
            )}
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[var(--color-surface)] text-neutral-400">
                {PACK_ICONS[pack.iconKey]}
              </div>
              <h3 className="mb-1 text-sm font-bold uppercase leading-6 text-neutral-900 sm:text-base">
                {pack.name}
              </h3>
              <p className="mb-0.5 text-lg font-bold leading-8 text-neutral-900 sm:text-xl">
                {pack.coins.toLocaleString()} Coins
              </p>
              <p className="mb-4 text-sm text-neutral-600">
                ${pack.price.toFixed(2)}
              </p>
            </div>
            <Button
              variant={pack.popular ? 'primary' : 'secondary'}
              size="sm"
              className="w-full uppercase"
            >
              Buy
            </Button>
          </div>
        ))}
      </div>

      {/* Promo code — compact */}
      <div className="pt-6">
        <Card className="rounded-xl border border-dashed border-white/10 bg-[var(--color-surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[var(--color-charcoal)] text-neutral-500">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                  Have a promo code?
                </p>
                <Input
                  type="text"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="mt-1.5 text-sm"
                />
              </div>
            </div>
            <Button variant="primary" size="sm" className="shrink-0 uppercase">
              Apply
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer — compact */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-neutral-500">
        <div className="flex flex-wrap gap-4">
          <Link to="/transaction" className="font-medium text-neutral-900 hover:underline">
            Transaction history
          </Link>
          <a href="#" className="text-neutral-500 hover:underline">Terms of service</a>
          <a href="#" className="text-neutral-500 hover:underline">Support</a>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 shrink-0 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Secure payment
          </span>
        </div>
      </footer>
    </div>
  )
}
