import type { PublishPostPayload, PublishPostResult } from '~/types/community'

export const previewStorageKey = 'bbm.nuxt-community.preview-posts.v1'

export function createCommunityApi(apiBase: string) {
  return {
    async publish(payload: PublishPostPayload, idempotencyKey: string): Promise<PublishPostResult> {
      if (apiBase) {
        return await $fetch<PublishPostResult>(`${apiBase.replace(/\/$/, '')}/v1/community/posts`, {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: payload,
        })
      }

      const now = new Date().toISOString()
      const result = { id: `preview-${crypto.randomUUID()}`, createdAt: now }
      const current = JSON.parse(localStorage.getItem(previewStorageKey) || '[]') as unknown[]
      localStorage.setItem(previewStorageKey, JSON.stringify([{ ...result, ...payload }, ...current].slice(0, 30)))
      return result
    },
  }
}
