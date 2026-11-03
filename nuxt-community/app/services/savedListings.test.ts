import { describe, it, expect } from 'vitest'
import { demoVehicles, updateActivity, listingActivityKey } from './accountDemo'
import { savedTab, toggleSaved, savedVehicleUrl } from './savedListings'

describe('Saved listing interactions', () => {
  it('removes and restores the same stable listing without duplicates', () => {
    const vehicle = demoVehicles[0]!
    const rows = [vehicle]
    const removed = toggleSaved(rows, vehicle)
    expect(removed).toEqual([])
    expect(rows).toEqual([vehicle])
    const restored = toggleSaved(removed, vehicle)
    expect(restored.map(v => v.id)).toEqual([vehicle.id])
    expect(toggleSaved(restored, vehicle)).toEqual([])
  })
  it('does not remove another same-title vehicle', () => {
    const a = demoVehicles[0]!, b = { ...a, id:'other-listing' }
    expect(toggleSaved([a,b],a).map(v=>v.id)).toEqual(['other-listing'])
  })
  it('enforces 100 saved listings and still allows removal at the limit', () => {
    const rows = Array.from({length:100},(_,i)=>({...demoVehicles[0]!,id:String(i)}))
    expect(()=>toggleSaved(rows,demoVehicles[1]!)).toThrow('100')
    expect(toggleSaved(rows,rows[0]!).length).toBe(99)
  })
  it('normalizes a bad tab and preserves valid deep-linked tabs', () => {
    expect(savedTab('video')).toBe('video'); expect(savedTab('post')).toBe('post'); expect(savedTab(['ad'])).toBe('ad')
  })
  it('preserves filter context and rejects external or script destinations', () => {
    const u = new URL(savedVehicleUrl(demoVehicles[0]!,'https://example.com','/bobaedream/'))
    expect(u.pathname).toBe('/bobaedream/')
    expect(u.searchParams.get('maker')).toBe('제네시스')
    expect(u.searchParams.get('accountListing')).toBe('sample-g80')
    expect(()=>savedVehicleUrl({...demoVehicles[0]!,url:'javascript:alert(1)'},'https://example.com','/bobaedream/')).toThrow()
    expect(()=>savedVehicleUrl({...demoVehicles[0]!,url:'https://external.com'},'https://example.com','/bobaedream/')).toThrow()
  })
  it('opens PC-saved vehicles using the current responsive surface',()=>{
    const vehicle={...demoVehicles[0]!,url:'?qf=guazi&pc=1&maker=제네시스'}
    expect(new URL(savedVehicleUrl(vehicle,'https://example.com','/bobaedream/',false)).searchParams.has('pc')).toBe(false)
    expect(new URL(savedVehicleUrl({...vehicle,url:'?qf=guazi'},'https://example.com','/bobaedream/',true)).searchParams.get('pc')).toBe('1')
  })
  it('leaves the original heart and count unchanged when storage rejects a write',()=>{
    const before={favorites:[demoVehicles[0]!],recent:[]}
    expect(()=>updateActivity({getItem:()=>null,setItem:()=>{throw new Error('quota')}},before,a=>{a.favorites=[]})).toThrow('quota')
    expect(before.favorites.length).toBe(1)
  })
  it('uses the latest cross-tab saved list instead of overwriting it from stale state',()=>{
    let stored=JSON.stringify({favorites:[demoVehicles[1]!],recent:[]})
    const next=updateActivity({getItem:k=>k===listingActivityKey?stored:null,setItem:(_k,v)=>{stored=v}},{favorites:[],recent:[]},a=>{a.favorites.push(demoVehicles[0]!)})
    expect(next.favorites.map(v=>v.id)).toEqual(['sample-carnival','sample-g80'])
  })
})
