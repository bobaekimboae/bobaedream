export type CommunitySectionId = 'general' | 'cars' | 'vehicles' | 'reports' | 'defects'
export type CommunitySort = 'latest' | 'latest-comment' | 'popular'
export type CommunityPopularPeriod = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
export type CommunityView = 'compact' | 'list' | 'feed'

export interface CommunityBoard {
  id: string
  sectionId: CommunitySectionId
  name: string
  headwords: string[]
  canWrite: boolean
}

export interface CommunitySection {
  id: CommunitySectionId
  name: string
  boards: CommunityBoard[]
}

export interface CommunityAttachment {
  id: string
  kind: 'image' | 'video'
  name: string
  size: number
  mime: string
  previewUrl: string
}

export interface CommunityPost {
  id: string
  boardId: string
  headword?: string
  title: string
  excerpt: string
  author: string
  createdAt: string
  updatedAt: string
  thumbnail?: string
  comments: number
  likes: number
  dislikes: number
  views: number
  isPopular?: boolean
}

export interface CommunityDraft {
  id: string
  boardId: string
  title: string
  html: string
  text: string
  tags: string[]
  hideBody: boolean
  updatedAt: string
}

export interface PublishPostPayload {
  boardId: string
  title: string
  html: string
  text: string
  tags: string[]
  hideBody: boolean
  attachmentIds: string[]
}

export interface PublishPostResult {
  id: string
  createdAt: string
}
