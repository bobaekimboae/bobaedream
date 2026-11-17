export type ScreenId =
  | 'dashboard'
  | 'vehicles'
  | 'photos'
  | 'template'
  | 'render'
  | 'review'
  | 'schedule'
  | 'publish'
  | 'brand'
  | 'connections'

export type RenderStatus = 'queued' | 'analyzing' | 'rendering' | 'completed' | 'failed'
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'changes_requested' | 'rejected'
export type PublishStatus = 'blocked' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'not_requested'
export type ChannelId = 'youtube' | 'instagram' | 'tiktok'

export interface Vehicle {
  id: string
  listingId: string
  name: string
  trim: string
  year: number
  mileageKm: number
  priceWon: number
  color: string
  fuel: string
  status: 'for_sale' | 'price_changed' | 'sold'
  videoStatus: 'none' | 'ready' | 'generating' | 'review' | 'failed'
  photoCount: number
  sourceVersion: number
  art: 'sedan' | 'suv' | 'van' | 'coupe'
}

export interface PhotoCheck {
  id: string
  label: string
  angle: string
  score: number
  status: 'good' | 'warning' | 'blocked'
  issue?: string
  art: Vehicle['art']
}

export interface ChannelState {
  id: ChannelId
  label: string
  connected: boolean
  status: PublishStatus
  detail: string
}

