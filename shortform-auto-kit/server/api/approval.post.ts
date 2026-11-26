export default defineEventHandler(async (event) => {
  const key = getHeader(event, 'Idempotency-Key')
  const body = await readBody<{ approved?: boolean; factChecks?: Record<string, boolean> }>(event)

  if (!key) throw createError({ statusCode: 400, statusMessage: 'Idempotency-Key is required' })
  const checks = Object.values(body.factChecks ?? {})
  if (!body.approved || checks.length === 0 || checks.some((value) => !value)) {
    throw createError({ statusCode: 422, statusMessage: 'Human approval and all Fact Lock checks are required' })
  }

  return { status: 'approved', approvedBy: 'mock-reviewer', approvedAt: new Date().toISOString(), mock: true }
})

