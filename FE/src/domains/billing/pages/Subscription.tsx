import { useState, useEffect } from 'react'
import { Button } from '../../../components/common'
import { workflowApi } from '../../../api/client'

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="inline-flex items-start gap-2">
      <span className="shrink-0 text-sm font-bold leading-5 text-neutral-900">+</span>
      <span className="min-w-0 text-sm font-normal leading-5 text-neutral-900">{text}</span>
    </div>
  )
}

export default function Subscription() {
  const [plans, setPlans] = useState<any[]>([])
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    workflowApi.getSubscriptionPlans().then((res) => {
      if (res.success && res.data) setPlans(res.data)
    })
  }, [])

  const handleCheckout = async (planId: number) => {
    setCheckingOutPlanId(planId)
    setMessage('')
    try {
      const res = await workflowApi.checkoutSubscription(planId)
      if (res.success && res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
        return
      }
      setMessage(res.message || 'Không tạo được link thanh toán. Vui lòng thử lại.')
    } catch (e) {
      console.error(e)
      setMessage('Có lỗi xảy ra khi thanh toán gói.')
    } finally {
      setCheckingOutPlanId(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col px-4 py-4 sm:px-6">
      <div className="flex flex-col items-center gap-3 pb-6 sm:gap-4 sm:pb-8 md:gap-5 md:pb-10">
        <h1 className="text-center text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl md:text-3xl md:leading-tight">
          Gói đăng ký
        </h1>
        <p className="w-full max-w-[28rem] text-center text-sm leading-6 text-neutral-700 sm:max-w-[672px] sm:text-base sm:leading-7">
          Chọn gói phù hợp — thanh toán bằng tiền Việt (VND) qua PayOS.
        </p>
        {message && <p className="text-sm font-medium text-accent">{message}</p>}
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 lg:gap-6 pt-4">
        {plans.map((plan) => {
          const features: string[] = plan.features || []
          const priceVnd = Number(plan.priceVnd ?? 0)
          const days = plan.durationDays ?? 30
          const isPopular = plan.isPopular === true

          return (
            <div
              key={plan.planId}
              className={`relative flex min-w-0 flex-col justify-between rounded-2xl p-4 sm:p-5 lg:min-h-[380px] lg:p-6 transition-all bg-[var(--color-surface)] ${
                isPopular
                  ? 'border-2 border-indigo-600 shadow-md scale-[1.02]'
                  : 'border border-white/10 shadow-none'
              }`}
            >
              {/* Nhãn nổi bật cho gói Popular */}
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow whitespace-nowrap">
                  Phổ biến nhất
                </span>
              )}

              <div className="flex flex-col">
                <div className="flex flex-col gap-2 pb-3 sm:pb-4">
                  <h3 className="text-xl font-bold uppercase leading-8 text-neutral-900 sm:text-2xl">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-3xl font-bold leading-[2.5rem] text-neutral-900 sm:text-4xl sm:leading-[3rem]">
                      {priceVnd.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-sm text-neutral-500">/ {days} ngày</span>
                  </div>
                  <p className="text-sm font-normal leading-6 text-neutral-700 sm:text-base">{plan.description}</p>
                </div>
                <ul className="flex flex-col gap-2 pb-6 sm:gap-3 sm:pb-8">
                  {features.map((f: string) => (
                    <li key={f} className="flex items-start gap-3">
                      <FeatureItem text={f} />
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant={isPopular ? 'primary' : 'secondary'}
                size="md"
                className="w-full uppercase"
                disabled={checkingOutPlanId === plan.planId}
                onClick={() => handleCheckout(plan.planId)}
              >
                {checkingOutPlanId === plan.planId ? 'Đang chuyển tới thanh toán...' : 'Thanh toán'}
              </Button>
            </div>
          )
        })}
        {plans.length === 0 && (
          <p className="col-span-full text-center text-sm text-neutral-500">Chưa có gói đăng ký nào khả dụng.</p>
        )}
      </div>
    </div>
  )
}