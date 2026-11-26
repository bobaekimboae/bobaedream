// Contract/reference-plan checks only. This does not call a production renderer or API.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const p=JSON.parse(fs.readFileSync(new URL('./card-selection-v2.json',import.meta.url),'utf8'));
const ids=p.catalog.map(x=>x.type_id);
assert.equal(ids.length,8);assert.equal(new Set(ids).size,8);
assert.ok(p.catalog.every(x=>x.required===false));assert.deepEqual(p.selection.mandatory_type_ids,[]);
// Test oracle for the declared relative order. Eligibility in production is separate.
const normalize=requested=>p.catalog.filter(x=>requested.includes(x.type_id)).sort((a,b)=>a.order-b.order).map(x=>x.type_id);
for(const [name,input,expected] of p.checks)assert.deepEqual(normalize(input),expected,name);
for(let mask=0;mask<256;mask++){
 const selected=ids.filter((_,i)=>mask&(1<<i));
 const actual=normalize([...selected].reverse());
 assert.deepEqual(actual,selected);assert.equal(actual.length,selected.length);
}
const sample=normalize(p.sample.requested_type_ids).filter(x=>p.sample.eligible_type_ids.includes(x));
assert.deepEqual(sample,p.sample.expected_selected_type_ids);
assert.ok(!sample.includes('vehicle_history_timeline'));
assert.ok(p.sample.cross_source_reference_events.every(x=>x.official_timeline_eligible===false));
assert.ok(p.sample.cross_source_reference_events.every(x=>x.source_provider!=='MOLIT_TS_CAR365'));
assert.equal(p.actual_molit_api_connected,false);assert.equal(p.actual_video_rendered,false);
const report={catalog_types:8,named_cases:p.checks.length,order_subsets_checked:256,sample_timeline_omitted:true,scope:'contract reference plan; production gate/render/API not tested'};
fs.writeFileSync(new URL('./v2-policy-check-result.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));