import { createHash } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const key = getHeader(event, 'Idempotency-Key')
  const body = await readBody<{ listingId?: string; sourceVersion?: number }>(event)

  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'Idempotency-Key is required' })
  }
  if (!body.listingId || typeof body.sourceVersion !== 'number') {
    throw createError({ statusCode: 422, statusMessage: 'listingId and sourceVersion are required' })
  }

  return {
    jobId: `render_${createHash('sha1').update(key).digest('hex').slice(0, 12)}`,
    idempotencyKey: key,
    status: 'queued',
    mock: true,
    published: false,
    source: { listingId: body.listingId, sourceVersion: body.sourceVersion }
  }
})

