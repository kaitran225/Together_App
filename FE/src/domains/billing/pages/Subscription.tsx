import { Button } from '../../../components/common'
import { FREE_FEATURES, PERSONAL_FEATURES, TEAMS_FEATURES, COMBO_FEATURES } from '../../../mocks'
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
        {/* FREE */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-[var(--color-surface)] p-4 shadow-none sm:p-5 lg:min-h-[380px] lg:p-6">
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 pb-3 sm:pb-4">
              <h3 className="text-xl font-bold uppercase leading-8 text-neutral-900 sm:text-2xl">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold leading-[2.5rem] text-neutral-900 sm:text-4xl sm:leading-[3rem]">0VND</span>
              </div>
              <p className="text-sm font-normal leading-6 text-neutral-700 sm:text-base">Gói miễn phí</p>
            </div>
            <ul className="flex flex-col gap-2 pb-6 sm:gap-3 sm:pb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <FeatureItem text={f} prefix="-" />
                </li>
              ))}
            </ul>
          </div>
          <Button variant="secondary" size="md" className="w-full uppercase" onClick={() => alert("You are already on the Free plan.")}>Active</Button>
        </div>

        {/* PERSONAL */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-[var(--color-surface)] p-4 shadow-none sm:p-5 lg:min-h-[380px] lg:p-6">
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 pb-3 sm:pb-4">
              <h3 className="text-xl font-bold uppercase leading-8 text-neutral-900 sm:text-2xl">Personal</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold leading-[2.5rem] text-neutral-900 sm:text-4xl sm:leading-[3rem]">59.000VND</span>
              </div>
              <p className="text-sm font-normal leading-6 text-neutral-700 sm:text-base">Dành cho cá nhân</p>
            </div>
            <ul className="flex flex-col gap-2 pb-6 sm:gap-3 sm:pb-8">
              {PERSONAL_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <FeatureItem text={f} prefix="-" />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1 uppercase" onClick={() => handleUpgrade(1)}>Start</Button>
            <Button variant="secondary" size="md" className="flex-1 uppercase" onClick={() => handleUpgrade(1)}>3 days trial</Button>
          </div>
        </div>

        {/* TEAMS — Most Popular */}
        <div className="relative flex min-w-0 flex-col justify-between rounded-2xl border border-primary/30 bg-[var(--color-surface)] p-4 shadow-none sm:p-5 lg:min-h-[380px] lg:p-6">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded border border-primary bg-primary px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary-foreground">Most Popular</span>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 pb-3 sm:pb-4">
              <h3 className="text-xl font-bold uppercase leading-8 text-neutral-900 sm:text-2xl">Teams</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold leading-[2.5rem] text-neutral-900 sm:text-4xl sm:leading-[3rem]">249.000VND</span>
              </div>
              <p className="text-sm font-normal leading-6 text-neutral-900 sm:text-base">Dành cho nhóm học tập nghiêm túc</p>
            </div>
            <ul className="flex flex-col gap-2 pb-6 sm:gap-3 sm:pb-8">
              {TEAMS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <FeatureItem text={f} prefix="+"/>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1 uppercase" onClick={() => handleUpgrade(2)}>Start</Button>
            <Button variant="secondary" size="md" className="flex-1 uppercase" onClick={() => handleUpgrade(2)}>3 days trial</Button>
          </div>
        </div>

        {/* COMBO (TEAMS + PERSONAL) Custom */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-[var(--color-surface)] p-4 shadow-none sm:p-5 lg:min-h-[380px] lg:p-6">
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 pb-3 sm:pb-4">
              <h3 className="text-xl font-bold uppercase leading-8 text-neutral-900 sm:text-2xl">Combo</h3>
              <p className="text-base font-semibold leading-6 text-neutral-700 sm:text-lg">(Teams + Personal)</p>
              <div className="text-4xl font-bold leading-[2.5rem] text-neutral-900 sm:text-4xl sm:leading-[3rem]">299.000VND</div>
              <p className="text-sm font-normal leading-6 text-neutral-700 sm:text-base">Dành cho tổ chức và nhóm lớn</p>
            </div>
            <ul className="flex flex-col gap-2 pb-6 sm:gap-3 sm:pb-8">
              {COMBO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <FeatureItem text={f} prefix="-" />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1 uppercase" onClick={() => handleUpgrade(3)}>Start</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
