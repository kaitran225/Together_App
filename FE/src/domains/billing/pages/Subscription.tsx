import { useState, useEffect } from 'react'
import { Button } from '../../../components/common'
import { workflowApi } from '../../../api/client'

function FeatureItem({
  text,
  prefix,
  light,
}: {
  text: string
  prefix: '-' | '+'
  light?: boolean
}) {
  const textClass = light ? 'text-white' : 'text-neutral-900'
  return (
    <div className="inline-flex items-start gap-2">
      <span className={`shrink-0 text-sm font-bold leading-5 ${textClass}`}>{prefix}</span>
      <span className={`min-w-0 text-sm font-normal leading-5 ${textClass}`}>{text}</span>
    </div>
  )
}

export default function Subscription() {
  const [packages, setPackages] = useState<any[]>([])

  useEffect(() => {
    workflowApi.getCoinPackages().then(res => {
      if (res.success && res.data) setPackages(res.data)
    })
  }, [])

  const handleUpgrade = async (packageId: number) => {
    try {
      const res = await workflowApi.checkoutPayOs(packageId)
      if (res.success && res.data && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      } else {
        alert("Failed to generate payment checkout link.")
      }
    } catch (e) {
      console.error(e)
      alert("Error initiating payment checkout.")
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col px-4 py-4 sm:px-6">
      <div className="flex flex-col items-center gap-3 pb-6 sm:gap-4 sm:pb-8 md:gap-5 md:pb-10">
        <h1 className="text-center text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl md:text-3xl md:leading-tight">
          Gói đăng ký
        </h1>
        <p className="w-full max-w-[28rem] text-center text-sm leading-6 text-neutral-700 sm:max-w-[672px] sm:text-base sm:leading-7">
          Chọn gói phù hợp với nhu cầu học tập của bạn
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-4">
        {packages.map((pack) => {
          const features: string[] = pack.features || []
          const desc = pack.description || ''
          const isFree = pack.priceVnd === 0

          return (
            <div key={pack.packageId} className={`relative flex min-w-0 flex-col justify-between rounded-2xl border ${pack.isPopular ? 'border-primary/30' : 'border-white/10'} bg-[var(--color-surface)] p-4 shadow-none sm:p-5 lg:min-h-[380px] lg:p-6`}>
              {pack.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded border border-primary bg-primary px-3 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Most Popular</span>
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex flex-col gap-2 pb-3 sm:pb-4">
                  <h3 className="text-xl font-bold uppercase leading-8 text-neutral-900 sm:text-2xl">{pack.packageName}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold leading-[2.5rem] text-neutral-900 sm:text-4xl sm:leading-[3rem]">{pack.priceVnd.toLocaleString()}VND</span>
                  </div>
                  <p className="text-sm font-normal leading-6 text-neutral-700 sm:text-base">{desc}</p>
                </div>
                <ul className="flex flex-col gap-2 pb-6 sm:gap-3 sm:pb-8">
                  {features.map((f: string) => (
                    <li key={f} className="flex items-start gap-3">
                      <FeatureItem text={f} prefix={pack.isPopular ? '+' : '-'} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                {isFree ? (
                  <Button variant="secondary" size="md" className="w-full uppercase" onClick={() => alert("You are already on the Free plan.")}>Active</Button>
                ) : (
                  <>
                    <Button variant="secondary" size="md" className="flex-1 uppercase" onClick={() => handleUpgrade(pack.packageId)}>Start</Button>
                    {!pack.isPopular && <Button variant="secondary" size="md" className="flex-1 uppercase" onClick={() => handleUpgrade(pack.packageId)}>3 days trial</Button>}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
