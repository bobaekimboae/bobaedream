export default defineEventHandler(async (event) => {
  const key = getHeader(event, 'Idempotency-Key')
  const body = await readBody<{ listingId?: string; channels?: string[]; approved?: boolean }>(event)

  if (!key) throw createError({ statusCode: 400, statusMessage: 'Idempotency-Key is required' })

  return {
    adapter: 'mock',
    published: false,
    status: 'not_published',
    channels: (body.channels ?? []).map((channel) => ({ channel, status: 'blocked', reason: 'OAUTH_NOT_CONNECTED' })),
    message: body.approved
      ? 'MOCK 어댑터입니다. OAuth와 API 키가 없어 실제 게시하지 않았습니다.'
      : '사람 승인 전에는 게시할 수 없습니다. 실제 게시하지 않았습니다.'
  }
})

