import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/common'
import { workflowApi } from '../../../api/client'

const PACK_ICONS = [
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>,
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  <span className="text-xs font-bold">G</span>,
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
]

export default function Shop() {
  const [balance, setBalance] = useState<number>(0)
  const [packages, setPackages] = useState<any[]>([])

  useEffect(() => {
    workflowApi.getCoinPackages().then(res => {
      if (res.success && res.data) setPackages(res.data)
    })
    workflowApi.getUserWallet().then(res => {
      if (res.success && res.data) setBalance(res.data.balance || 0)
    })
  }, [])

  const handleBuy = async (packageId: number) => {
    try {
      const res = await workflowApi.checkoutPayOs(packageId)
      if (res.success && res.data && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      } else {
        alert("Có lỗi khi tạo link thanh toán.")
      }
    } catch (e) {
      console.error(e)
      alert("Có lỗi kết nối với PayOS.")
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col px-4 py-3 sm:px-5">
      {/* Heading — compact */}
      <div className="flex flex-col items-center gap-2 pb-5 sm:pb-6">
        <h1 className="text-center text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl">
          Mua xu
        </h1>
        <p className="rounded-md border border-white/10 bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-neutral-900">
          {balance.toLocaleString()} Coins
        </p>
      </div>

      {/* Packs grid — compact cards */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {packages.map((pack, idx) => (
          <div
            key={pack.packageId}
            className={`relative flex min-w-0 flex-col justify-between rounded-xl border-2 p-4 sm:p-5 ${
              pack.isPopular
                ? 'border-primary/50 bg-primary/10'
                : 'border-white/10 bg-[var(--color-surface)]'
            }`}
          >
            {pack.isPopular && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-primary px-2 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  Phổ biến nhất
                </span>
              </div>
            )}
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[var(--color-surface)] text-neutral-400">
                {PACK_ICONS[idx % PACK_ICONS.length]}
              </div>
              <h3 className="mb-1 text-sm font-bold uppercase leading-6 text-neutral-900 sm:text-base">
                {pack.packageName}
              </h3>
              <p className="mb-0.5 text-lg font-bold leading-8 text-neutral-900 sm:text-xl">
                {pack.coinsAmount.toLocaleString()} Xu
              </p>
              {pack.bonusCoins > 0 && (
                <p className="mb-1 text-xs font-semibold text-green-600">
                  + {pack.bonusCoins.toLocaleString()} Xu Bonus
                </p>
              )}
              <p className="mb-4 text-sm text-neutral-600">
                {pack.priceVnd.toLocaleString()} VND
              </p>
            </div>
            <Button
              variant={pack.isPopular ? 'primary' : 'secondary'}
              size="sm"
              className="w-full uppercase"
              onClick={() => handleBuy(pack.packageId)}
            >
              Mua
            </Button>
          </div>
        ))}
      </div>

      {/* Footer — compact */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-neutral-500">
        <div className="flex flex-wrap gap-4">
          <Link to="/transaction" className="font-medium text-neutral-900 hover:underline">
            Lịch sử giao dịch
          </Link>
          <a href="#" className="text-neutral-500 hover:underline">Điều khoản dịch vụ</a>
          <a href="#" className="text-neutral-500 hover:underline">Hỗ trợ</a>
        </div>
      </footer>
    </div>
  )
}
