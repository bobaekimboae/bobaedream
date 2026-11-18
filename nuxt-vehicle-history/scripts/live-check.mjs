import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to installed Playwright')
const { chromium } = await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href)
const api = 'https://staging.bbmuseum.co.kr/v1/test/vehicle-history'
const headers = { Origin: 'https://bobaekimboae.github.io', 'Access-Control-Request-Method':'POST', 'Access-Control-Request-Headers':'content-type' }
const options = await fetch(api,{method:'OPTIONS',headers,signal:AbortSignal.timeout(20000)})
assert.equal(options.status,204)
const browser = await chromium.launch({channel:'chrome',headless:true})
const results = []
try {
  const page = await browser.newPage()
  await page.goto('https://bobaekimboae.github.io/bobaedream/vehicle-history/')
  for (const [name,body,expected] of [
    ['missing-plate',{},'INVALID_PLATE'],
    ['dealer-invalid-plate-no-owner',{plate:'INVALID',consentId:'codex-validation-only',purpose:'USED_CAR_DEALER_LISTING_CHECK',molitLookupType:'SALE_VEHICLE_OR_OWNER_UNCONSENTED'},'INVALID_OWNER'],
    ['owner-mode-missing-plate',{consentId:'codex-validation-only',purpose:'OWNER_VERIFIED_HISTORY_CHECK',molitLookupType:'OWNER_CONSENTED_OR_SELF'},'INVALID_PLATE'],
  ]) {
    const result = await page.evaluate(async ({api,body}) => {
      const r = await fetch(api,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)})
      return {status:r.status,contentType:r.headers.get('content-type'),body:await r.json()}
    },{api,body})
    assert.equal(result.status,400)
    assert.equal(result.body.code,expected)
    results.push({name,...result})
  }
} finally { await browser.close() }
const report = {testedAt:new Date().toISOString(),origin:'https://bobaekimboae.github.io',api,options:{status:options.status,allowOrigin:options.headers.get('access-control-allow-origin')},scope:'only invalid-input checks; no valid vehicle or owner data submitted; real provider success not tested',results}
await mkdir(resolve(import.meta.dirname,'../artifacts'),{recursive:true})
await writeFile(resolve(import.meta.dirname,'../artifacts/live-results.json'),JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))
