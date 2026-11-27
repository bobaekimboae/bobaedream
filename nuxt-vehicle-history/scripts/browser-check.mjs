import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Reuse the repository's installed Playwright runner; no additional browser or package download.
const runner = process.env.PLAYWRIGHT_MODULE
if (!runner) throw new Error('Set PLAYWRIGHT_MODULE to the installed Playwright index.mjs')
const { chromium } = await import(pathToFileURL(resolve(runner)).href)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const url = process.env.HISTORY_PREVIEW_URL || 'http://127.0.0.1:5216/bobaedream/vehicle-history/'
const api = 'https://staging.bbmuseum.co.kr/v1/test/vehicle-history'
const artifact = resolve(import.meta.dirname, '../artifacts')
await mkdir(artifact, { recursive: true })
const results = []
const fixture = {
  vehicle: { name: '계약 테스트 차량', modelYear: 2024, mileage: 12000, fuel: '가솔린' },
  sourceStatus: { carHistory: 'success', molit: 'success' },
  risk: { grade: 'B', reasons: ['계약 테스트용 합성 응답입니다. 실제 차량이 아닙니다.'] },
  registration: { ownerChangeCount: 1, plateChangeCount: 0, usageHistory: [], inspectionHistory: [], maintenanceHistory: [], performanceCheckHistory: [], mileageHistory: [{ date: '2025-01-01', mileage: 13000 }, { date: '2026-01-01', mileage: 12000 }] },
  insurance: { accidentCount: 1, ownDamageCount: 1, ownDamageTotal: 1000000, totalLoss: false, flood: false, theft: false, accidents: [{ date: '2026-01-01', type: 'own_damage', paidAmount: 1000000, partsAmount: 400000, laborAmount: 300000, paintingAmount: 300000 }] },
}
try {
  for (const [name, width, height] of [['pc',1440,1000], ['mobile',390,844], ['small-mobile',360,800]]) {
    const context = await browser.newContext({ viewport: { width, height }, locale: 'ko-KR' })
    const page = await context.newPage(), errors = [], requests = []
    page.on('pageerror', e => errors.push(e.message))
    await context.addInitScript(() => localStorage.setItem('bobaedream-vehicle-history', '{corrupt'))
    let response = fixture, status = 200, contentType = 'application/json'
    await page.route(api, async route => {
      requests.push(route.request().postDataJSON())
      await new Promise(r => setTimeout(r, 70))
      await route.fulfill({status,contentType,body:contentType==='application/json'?JSON.stringify(response):'<html>upstream error</html>'})
    })
    await page.goto(url)
    await page.screenshot({path:resolve(artifact,`${name}-initial.png`),fullPage:false})
    await page.getByRole('button',{name:'이력 조회',exact:true}).click()
    await page.getByRole('alert').filter({hasText:'차량번호'}).waitFor()
    assert.equal(requests.length,0)
    await page.locator('#plate').fill('12가3456')
    await page.getByRole('button',{name:'이력 조회',exact:true}).click()
    await page.getByRole('alert').filter({hasText:'조회 동의'}).waitFor()
    assert.equal(requests.length,0)
    await page.locator('#consent').check()
    await page.getByRole('button',{name:'이력 조회',exact:true}).click()
    await page.locator('#report').waitFor()
    assert.equal(requests.length,1)
    assert.equal('owner' in requests[0],false)
    assert.equal(requests[0].molitLookupType,'SALE_VEHICLE_OR_OWNER_UNCONSENTED')
    assert.equal(await page.locator('.history-item').count(),19)
    await page.getByText('감소 기록 확인 · 추가 확인 필요',{exact:true}).waitFor()
    assert.ok(await page.locator('.accident').innerText().then(t=>t.includes('400,000원')))
    await page.getByRole('button',{name:'주의 이력',exact:true}).click()
    const warningCount = await page.locator('.history-item').count()
    assert.ok(warningCount>0 && warningCount<19)
    await page.getByRole('button',{name:'전체',exact:true}).click()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    assert.equal(overflow,false)
    await page.screenshot({path:resolve(artifact,`${name}-report.png`),fullPage:true})
    await page.getByRole('button',{name:'더보기 메뉴',exact:true}).click()
    await page.locator('dialog[open]').waitFor()
    assert.ok((await page.locator('.recent-row').innerText()).includes('계약 테스트 차량'))
    await page.keyboard.press('Escape')
    await page.locator('dialog[open]').waitFor({state:'hidden'})
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'')
    await page.evaluate(()=>{window.print=()=>{document.documentElement.dataset.printed='yes'}})
    await page.getByRole('button',{name:'PDF 저장',exact:true}).click()
    assert.equal(await page.locator('html').getAttribute('data-printed'),'yes')
    await page.getByRole('button',{name:'새 차량 조회',exact:true}).click()
    await page.getByText('소유자 확인 조회',{exact:true}).click()
    assert.equal(await page.getByRole('radio',{name:/소유자 확인 조회/}).isChecked(),true)
    await page.locator('#plate').fill('12가3456')
    await page.getByRole('button',{name:'이력 조회',exact:true}).click()
    await page.getByRole('alert').filter({hasText:'소유자명'}).waitFor()
    await page.locator('#owner').fill('법인 3M(주)')
    await page.locator('#consent').check()
    await page.getByRole('button',{name:'이력 조회',exact:true}).click()
    await page.locator('#report').waitFor()
    assert.equal(requests.at(-1).owner,'법인 3M(주)')
    assert.equal(requests.at(-1).molitLookupType,'OWNER_CONSENTED_OR_SELF')
    assert.equal((await page.evaluate(()=>localStorage.getItem('bobaedream-vehicle-history'))).includes('법인 3M'),false)
    response = { ...fixture, sourceStatus: { carHistory:'failed', molit:'success' }, risk: { grade:'A' } }
    await page.getByRole('button',{name:'새 차량 조회',exact:true}).click()
    await page.locator('#plate').fill('12가3456'); await page.locator('#consent').check()
    await page.getByRole('button',{name:'이력 조회',exact:true}).click()
    await page.locator('#report').waitFor()
    assert.equal(await page.locator('.grade').innerText(),'—')
    await page.locator('.history-item').filter({hasText:'보험사고'}).getByText('정보 없음',{exact:true}).waitFor()
    for (const failure of [
      {body:{},status:200,type:'application/json',text:'조회 결과를 반환하지'},
      {body:{...fixture,sourceStatus:{molit:'failed',carHistory:'failed'}},status:200,type:'application/json',text:'모든 조회 기관'},
      {body:{code:'INVALID_OWNER'},status:400,type:'application/json',text:'소유자 확인 조회를 선택'},
      {body:{},status:502,type:'text/html',text:'응답 형식'},
    ]) {
      const resetButton = page.getByRole('button',{name:'새 차량 조회',exact:true})
      if (await resetButton.count()) await resetButton.click()
      response=failure.body;status=failure.status;contentType=failure.type
      await page.locator('#plate').fill('12가3456');await page.locator('#consent').check()
      await page.getByRole('button',{name:'이력 조회',exact:true}).click()
      await page.getByRole('alert').filter({hasText:failure.text}).waitFor()
      assert.equal(await page.locator('#report').count(),0)
    }
    assert.deepEqual(errors,[])
    results.push({viewport:name,width,height,passed:true,warningCount,consoleErrors:errors.length,realProviderQueries:0})
    await context.close()
  }
} finally { await browser.close() }
await writeFile(resolve(artifact,'browser-results.json'),JSON.stringify({testedAt:new Date().toISOString(),type:'intercepted-contract-responses-not-real-vehicle-lookups',results},null,2))
console.log(JSON.stringify(results,null,2))
