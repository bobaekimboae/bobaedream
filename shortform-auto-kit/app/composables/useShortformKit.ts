import { MOCK_CHANNELS, MOCK_PHOTOS, MOCK_VEHICLES } from '~/data/mock'
import type { ApprovalStatus, RenderStatus, ScreenId } from '~/types/shortform'

export const useShortformKit = () => {
  const activeScreen = useState<ScreenId>('shortform-screen', () => 'dashboard')
  const selectedVehicleId = useState<string>('shortform-vehicle', () => MOCK_VEHICLES[0]!.id)
  const selectedTemplate = useState<'clean' | 'dynamic' | 'spec'>('shortform-template', () => 'clean')
  const duration = useState<15 | 20 | 30>('shortform-duration', () => 20)
  const renderStatus = useState<RenderStatus>('shortform-render-status', () => 'completed')
  const renderProgress = useState<number>('shortform-render-progress', () => 100)
  const approvalStatus = useState<ApprovalStatus>('shortform-approval', () => 'pending')
  const factChecks = useState<Record<string, boolean>>('shortform-facts', () => ({
    source: true,
    price: true,
    mileage: true,
    options: true,
    privacy: false,
    defects: true
  }))
  const scheduledAt = useState<string>('shortform-schedule', () => '2026-11-03T19:30')
  const toast = useState<string>('shortform-toast', () => '')

  const selectedVehicle = computed(() => MOCK_VEHICLES.find((vehicle) => vehicle.id === selectedVehicleId.value) ?? MOCK_VEHICLES[0]!)
  const allFactsChecked = computed(() => Object.values(factChecks.value).every(Boolean))
  const publishAllowed = computed(() => approvalStatus.value === 'approved' && selectedVehicle.value.status !== 'sold' && allFactsChecked.value)
  const photoBlockers = computed(() => MOCK_PHOTOS.filter((photo) => photo.status === 'blocked'))

  function go(screen: ScreenId) {
    activeScreen.value = screen
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectVehicle(id: string) {
    selectedVehicleId.value = id
    approvalStatus.value = 'draft'
    toast.value = '매물 DB 원본값을 불러왔습니다.'
    go('photos')
  }

  function advanceRender() {
    const sequence: RenderStatus[] = ['queued', 'analyzing', 'rendering', 'completed']
    const currentIndex = sequence.indexOf(renderStatus.value)
    renderStatus.value = sequence[Math.min(currentIndex + 1, sequence.length - 1)]!
    renderProgress.value = { queued: 8, analyzing: 34, rendering: 72, completed: 100, failed: 61 }[renderStatus.value]
    if (renderStatus.value === 'completed') approvalStatus.value = 'pending'
  }

  function restartRender() {
    renderStatus.value = 'queued'
    renderProgress.value = 8
    approvalStatus.value = 'draft'
    go('render')
  }

  function approve() {
    if (!allFactsChecked.value) {
      toast.value = '번호판·개인정보 확인을 포함해 모든 검수 항목을 확인하세요.'
      return
    }
    approvalStatus.value = 'approved'
    toast.value = '사람 승인 완료. 게시 설정이 열렸습니다.'
  }

  async function runMockPublish() {
    const response = await $fetch<{ published: boolean; message: string }>('/api/publish', {
      method: 'POST',
      headers: { 'Idempotency-Key': `publish:${selectedVehicle.value.listingId}:v${selectedVehicle.value.sourceVersion}:preview` },
      body: {
        listingId: selectedVehicle.value.listingId,
        channels: MOCK_CHANNELS.map((channel) => channel.id),
        approved: approvalStatus.value === 'approved'
      }
    })
    toast.value = response.message
  }

  return {
    activeScreen,
    selectedVehicleId,
    selectedTemplate,
    duration,
    renderStatus,
    renderProgress,
    approvalStatus,
    factChecks,
    scheduledAt,
    toast,
    selectedVehicle,
    allFactsChecked,
    publishAllowed,
    photoBlockers,
    go,
    selectVehicle,
    advanceRender,
    restartRender,
    approve,
    runMockPublish
  }
}

