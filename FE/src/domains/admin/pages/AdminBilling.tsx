import { useEffect, useState } from 'react'
import { Button, Card, Input, Modal, Select, Switch, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Textarea } from '../../../components/common'
import { AdminActionToast, AdminPageSection } from '../components'
import { useAdminActions } from '../hooks/useAdminActions'
import { workflowApi } from '../../../api/client'

type CoinPackageForm = {
  packageId?: number
  packageName: string
  coinsAmount: string
  priceVnd: string
  isActive: boolean
}

const initialCoinPackageForm: CoinPackageForm = {
  packageName: '', coinsAmount: '', priceVnd: '', isActive: true,
}

// 1. Cập nhật Type PlanForm để thêm isPopular
type PlanForm = {
  planId?: number
  tierCode: string
  name: string
  description: string
  priceVnd: string
  durationDays: string
  isActive: boolean
  isPopular: boolean
  features: string
}

// 2. Cập nhật initialPlanForm để khởi tạo giá trị cho isPopular
const initialPlanForm: PlanForm = {
  tierCode: 'PRO', name: '', description: '', priceVnd: '', durationDays: '30', isActive: true, isPopular: false, features: '',
}

const tierOptions = [
  {value: 'FREE', label: 'FREE'},
  { value: 'PERSONAL', label: 'PLUS' },
  { value: 'TEAMS', label: 'TEAM' },
  { value: 'COMBO', label: 'COMBO' },
]

export default function AdminBilling() {
  const { toast, showToast, closeToast } = useAdminActions()

  const [coinPackages, setCoinPackages] = useState<any[]>([])
  const [showCoinModal, setShowCoinModal] = useState(false)
  const [coinForm, setCoinForm] = useState<CoinPackageForm>(initialCoinPackageForm)
  const [savingCoin, setSavingCoin] = useState(false)

  const [plans, setPlans] = useState<any[]>([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planForm, setPlanForm] = useState<PlanForm>(initialPlanForm)
  const [savingPlan, setSavingPlan] = useState(false)

  const loadCoinPackages = async () => {
    const res = await workflowApi.getCoinPackages()
    if (res.success && res.data) setCoinPackages(res.data)
  }
  const loadPlans = async () => {
    const res = await workflowApi.getAdminSubscriptionPlans()
    if (res.success && res.data) setPlans(res.data)
  }

  useEffect(() => {
    loadCoinPackages()
    loadPlans()
  }, [])

  const openCreateCoin = () => { setCoinForm(initialCoinPackageForm); setShowCoinModal(true) }
  const openEditCoin = (p: any) => {
    setCoinForm({
      packageId: p.packageId,
      packageName: p.packageName ?? '',
      coinsAmount: String(p.coinsAmount ?? ''),
      priceVnd: String(p.priceVnd ?? ''),
      isActive: p.isActive !== false,
    })
    setShowCoinModal(true)
  }

  const handleSaveCoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coinForm.packageName.trim() || !coinForm.coinsAmount || !coinForm.priceVnd) {
      showToast('Please complete name, coins and price.', 'error')
      return
    }
    setSavingCoin(true)
    const payload = {
      packageName: coinForm.packageName.trim(),
      coinsAmount: Number(coinForm.coinsAmount),
      bonusCoins: 0,
      priceVnd: Number(coinForm.priceVnd),
      isPopular: false,
      isActive: coinForm.isActive,
      displayOrder: 0,
      description: '',
      features: [],
    }
    try {
      const res = coinForm.packageId
        ? await workflowApi.updateCoinPackage(coinForm.packageId, payload)
        : await workflowApi.createCoinPackage(payload)
      if (res.success) {
        showToast(coinForm.packageId ? 'Coin package updated.' : 'Coin package created.', 'success')
        setShowCoinModal(false)
        await loadCoinPackages()
      } else {
        showToast(res.message || 'Failed to save coin package.', 'error')
      }
    } catch {
      showToast('Error saving coin package.', 'error')
    } finally {
      setSavingCoin(false)
    }
  }

  const openCreatePlan = () => { setPlanForm(initialPlanForm); setShowPlanModal(true) }
  
  // 3. Cập nhật openEditPlan để lấy giá trị isPopular từ dữ liệu trả về
  const openEditPlan = (p: any) => {
    setPlanForm({
      planId: p.planId,
      tierCode: p.tierCode ?? 'PRO',
      name: p.name ?? '',
      description: p.description ?? '',
      priceVnd: String(p.priceVnd ?? ''),
      durationDays: String(p.durationDays ?? 30),
      isActive: p.isActive !== false,
      isPopular: p.isPopular === true,
      features: Array.isArray(p.features) ? p.features.join(', ') : (p.features ?? ''),
    })
    setShowPlanModal(true)
  }

  // 4. Cập nhật handleSavePlan để gửi giá trị isPopular lên API
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planForm.name.trim() || !planForm.priceVnd || !planForm.durationDays) {
      showToast('Please complete name, price (VND) and duration days.', 'error')
      return
    }
    setSavingPlan(true)
    const payload = {
      tierCode: planForm.tierCode,
      name: planForm.name.trim(),
      description: planForm.description,
      priceVnd: Number(planForm.priceVnd),
      durationDays: Number(planForm.durationDays),
      isActive: planForm.isActive,
      isPopular: planForm.isPopular,
      displayOrder: 0,
      features: planForm.features.split(',').map((f) => f.trim()).filter(Boolean),
    }
    try {
      const res = planForm.planId
        ? await workflowApi.updateSubscriptionPlan(planForm.planId, payload)
        : await workflowApi.createSubscriptionPlan(payload)
      if (res.success) {
        showToast(planForm.planId ? 'Subscription plan updated.' : 'Subscription plan created.', 'success')
        setShowPlanModal(false)
        await loadPlans()
      } else {
        showToast(res.message || 'Failed to save plan.', 'error')
      }
    } catch {
      showToast('Error saving plan.', 'error')
    } finally {
      setSavingPlan(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection
        title="Coin Packages"
        subtitle="Gói nạp coin (VND → coin). Chỉnh name, số coin nhận, giá, status."
        action={<Button variant="primary" size="sm" onClick={openCreateCoin}>+ Create package</Button>}
      >
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Coins nhận</TableHeaderCell>
                  <TableHeaderCell>Price (VND)</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coinPackages.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-sm text-neutral-500">No coin packages yet.</TableCell></TableRow>
                ) : coinPackages.map((p) => (
                  <TableRow key={p.packageId}>
                    <TableCell>{p.packageName}</TableCell>
                    <TableCell>{p.coinsAmount}</TableCell>
                    <TableCell>{Number(p.priceVnd ?? 0).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>{p.isActive === false ? 'Inactive' : 'Active'}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="secondary" onClick={() => openEditCoin(p)}>Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </AdminPageSection>

      <AdminPageSection
        title="Subscription Plans"
        subtitle="Gói đăng ký thanh toán bằng VND (PayOS). Chỉnh tier, name, description, số ngày, giá VND, features, status."
        action={<Button variant="primary" size="sm" onClick={openCreatePlan}>+ Create plan</Button>}
      >
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Tier</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Days</TableHeaderCell>
                  <TableHeaderCell>Price (VND)</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-sm text-neutral-500">No subscription plans yet.</TableCell></TableRow>
                ) : plans.map((p) => (
                  <TableRow key={p.planId}>
                    <TableCell>{p.tierCode}</TableCell>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        {p.name}
                        {p.isPopular && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Popular</span>}
                      </div>
                      {p.description && <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{p.description}</div>}
                    </TableCell>
                    <TableCell>{p.durationDays ?? 30}</TableCell>
                    <TableCell>{Number(p.priceVnd ?? 0).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>{p.isActive === false ? 'Inactive' : 'Active'}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="secondary" onClick={() => openEditPlan(p)}>Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </AdminPageSection>

      <Modal open={showCoinModal} onClose={() => setShowCoinModal(false)} title={coinForm.packageId ? 'Edit coin package' : 'Create coin package'}>
        <form onSubmit={handleSaveCoin} className="space-y-4">
          <Input label="Name" value={coinForm.packageName} onChange={(e) => setCoinForm((p) => ({ ...p, packageName: e.target.value }))} />
          <Input label="Số lượng coin nhận" type="number" value={coinForm.coinsAmount} onChange={(e) => setCoinForm((p) => ({ ...p, coinsAmount: e.target.value }))} />
          <Input label="Price (VND)" type="number" value={coinForm.priceVnd} onChange={(e) => setCoinForm((p) => ({ ...p, priceVnd: e.target.value }))} />
          <div className="flex items-center gap-2"><Switch checked={coinForm.isActive} onChange={(v) => setCoinForm((p) => ({ ...p, isActive: v }))} /><span className="text-sm">Active</span></div>
          <Button type="submit" variant="primary" className="w-full" disabled={savingCoin}>{savingCoin ? 'Saving...' : 'Save'}</Button>
        </form>
      </Modal>

      {/* 5. Cập nhật giao diện Modal của Plan */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title={planForm.planId ? 'Edit subscription plan' : 'Create subscription plan'}>
        <form onSubmit={handleSavePlan} className="space-y-4">
          <Select label="Tier" options={tierOptions} value={planForm.tierCode} onChange={(e) => setPlanForm((p) => ({ ...p, tierCode: e.target.value }))} />
          <Input label="Name" value={planForm.name} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))} />
          
          <Input label="Description" value={planForm.description} onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))} />
          
          <div className="grid grid-cols-2 gap-3">
            <Input label="Số ngày của gói" type="number" value={planForm.durationDays} onChange={(e) => setPlanForm((p) => ({ ...p, durationDays: e.target.value }))} />
            <Input label="Price (VND)" type="number" value={planForm.priceVnd} onChange={(e) => setPlanForm((p) => ({ ...p, priceVnd: e.target.value }))} />
          </div>

          <Textarea
            label="Features (phân tách bằng dấu phẩy)"
            rows={2}
            placeholder="Không giới hạn phòng, AI không giới hạn, ..."
            value={planForm.features}
            onChange={(e) => setPlanForm((p) => ({ ...p, features: e.target.value }))}
          />
          
          {/* Nhóm nút gạt Active và Popular */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={planForm.isActive} onChange={(v) => setPlanForm((p) => ({ ...p, isActive: v }))} />
              <span className="text-sm">Active</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch checked={planForm.isPopular} onChange={(v) => setPlanForm((p) => ({ ...p, isPopular: v }))} />
              <span className="text-sm">Popular</span>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={savingPlan}>
            {savingPlan ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </Modal>

      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}