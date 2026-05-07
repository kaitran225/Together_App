import { Button } from '../../../components/common'
import { FREE_FEATURES, PERSONAL_FEATURES, TEAMS_FEATURES, COMBO_FEATURES } from '../../../mocks'

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
  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col px-4 py-4 sm:px-6">
      <div className="flex flex-col items-center gap-3 pb-6 sm:gap-4 sm:pb-8 md:gap-5 md:pb-10">
        <h1 className="text-center text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl md:text-3xl md:leading-tight">
          Subscription Plans
        </h1>
        <p className="w-full max-w-[28rem] text-center text-sm leading-6 text-neutral-700 sm:max-w-[672px] sm:text-base sm:leading-7">
          Choose the plan that best fits your learning goals and team study needs.
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
                {/* <span className="text-base font-normal leading-7 text-neutral-900 sm:text-lg">/mo</span> */}
              </div>
              <p className="text-sm font-normal leading-6 text-neutral-700 sm:text-base">Perfect for individuals</p>
            </div>
            <ul className="flex flex-col gap-2 pb-6 sm:gap-3 sm:pb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <FeatureItem text={f} prefix="-" />
                </li>
              ))}
            </ul>
          </div>
          <Button variant="secondary" size="md" className="w-full uppercase">Start</Button>
        </div>

        {/* PERSONAL */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-[var(--color-surface)] p-4 shadow-none sm:p-5 lg:min-h-[380px] lg:p-6">
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 pb-3 sm:pb-4">
              <h3 className="text-xl font-bold uppercase leading-8 text-neutral-900 sm:text-2xl">Personal</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold leading-[2.5rem] text-neutral-900 sm:text-4xl sm:leading-[3rem]">59.000VND</span>
                {/* <span className="text-base font-normal leading-7 text-neutral-900 sm:text-lg">/mo</span> */}
              </div>
              <p className="text-sm font-normal leading-6 text-neutral-700 sm:text-base">Perfect for individuals</p>
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
            <Button variant="secondary" size="md" className="flex-1 uppercase">Start</Button>
            <Button variant="secondary" size="md" className="flex-1 uppercase">3 days trial</Button>
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
                {/* <span className="text-base font-normal leading-7 text-neutral-900 sm:text-lg">/mo</span> */}
              </div>
              <p className="text-sm font-normal leading-6 text-neutral-900 sm:text-base">For serious students</p>
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
            <Button variant="secondary" size="md" className="flex-1 uppercase">Start</Button>
            <Button variant="secondary" size="md" className="flex-1 uppercase">3 days trial</Button>
          </div>
        </div>

        {/* COMBO (TEAMS + PERSONAL) Custom */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-white/10 bg-[var(--color-surface)] p-4 shadow-none sm:p-5 lg:min-h-[380px] lg:p-6">
          <div className="flex flex-col">
            <div className="flex flex-col gap-2 pb-3 sm:pb-4">
              <h3 className="text-xl font-bold uppercase leading-8 text-neutral-900 sm:text-2xl">Combo</h3>
              <p className="text-base font-semibold leading-6 text-neutral-700 sm:text-lg">(Teams + Personal)</p>
              <div className="text-4xl font-bold leading-[2.5rem] text-neutral-900 sm:text-4xl sm:leading-[3rem]">299.000VND</div>
{/* <span className="text-base font-normal leading-7 text-neutral-900 sm:text-lg">/mo</span> */}
              <p className="text-sm font-normal leading-6 text-neutral-700 sm:text-base">For institutions & large groups</p>
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
            <Button variant="secondary" size="md" className="flex-1 uppercase">Start</Button>
            {/* <Button variant="secondary" size="md" className="flex-1 uppercase">3 days trial</Button> */}
          </div>
        </div>
      </div>

      {/* <section className="flex flex-col items-center gap-4 pt-10 sm:pt-12">
        <h2 className="text-center text-xs font-bold uppercase tracking-wider text-neutral-600 sm:text-sm">
          Trusted by these institutions
        </h2>
        <div className="grid w-full max-w-[520px] grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex h-14 items-center justify-center rounded-lg border border-white/10 bg-[var(--color-surface)] sm:h-16">
              <span className="text-xs font-medium text-neutral-400 sm:text-sm">LOGO</span>
            </div>
          ))}
        </div>
      </section> */}
    </div>
  )
}
