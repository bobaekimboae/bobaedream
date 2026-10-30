import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import { scenesFor,sceneAt,safeFilename,socialCaption,drawFrame } from '../public/dealer-studio/core.js';

test('every selected photo remains in the film and the dealer card occupies the final three seconds',()=>{
  for(const duration of [15,30])for(const count of [1,6,12]){
    const photos=Array.from({length:count},(_,i)=>({id:String(i)}));
    const state={photos,duration,endCard:true};const scenes=scenesFor(state);
    assert.deepEqual(scenes.filter(s=>!s.end).map(s=>s.id),photos.map(s=>s.id));
    assert.ok(Math.abs(scenes.reduce((n,s)=>n+s.duration,0)-duration)<1e-8);
    assert.equal(sceneAt(state,duration-1).end,true);
    assert.equal(sceneAt(state,0).id,'0');
    assert.equal(scenes.at(-1).start,duration-3);
    assert.equal(scenes.at(-1).duration,3);
  }
  assert.deepEqual(scenesFor({photos:[],duration:15,endCard:true}),[]);
  assert.equal(scenesFor({photos:[{id:'one'}],duration:15,endCard:false})[0].duration,15);
});
test('sample inventory has existing local photographs and never imports estimated prices',()=>{
  const items=JSON.parse(readFileSync('public/dealer-studio/inventory.json','utf8'));
  assert.equal(items.length,12);
  for(const item of items){assert.ok(item.company&&item.dealer&&item.gallery);assert.equal('price' in item,false);for(const photo of item.photos)assert.ok(existsSync(`public/${photo.replace('../','')}`),photo);}
});
test('posting captions preserve dealer input and filenames remain valid on Windows',()=>{
  const state={title:'BMW M3',year:'2023',mileage:'22,000',price:'가격 상담',gallery:'서울오토갤러리',company:'디앤디플러스',dealer:'박상용',phone:'',highlights:'직접 입력한 소개'};
  const caption=socialCaption(state);assert.match(caption,/가격 상담/);assert.match(caption,/직접 입력한 소개/);assert.match(caption,/서울오토갤러리 · 디앤디플러스/);assert.doesNotMatch(safeFilename('BMW/:*?"<>|\\M3'),/[\\/:*?"<>|]/);
});

test('film keeps the vehicle description alongside optional scene captions and respects line breaks',()=>{
  const text=[];
  const ctx={save(){},restore(){},scale(){},fillRect(){},fillText(value){text.push(value);},measureText(value){return {width:value.length*8};}};
  const canvas={width:540,height:960,getContext:()=>ctx};
  const state={photos:[{id:'one',caption:'장면 설명'}],duration:15,endCard:false,template:'clean',highlights:'전체 소개 첫 줄\n전체 소개 둘째 줄',captions:true};
  drawFrame(canvas,state,new Map(),0);
  assert.ok(text.includes('전체 소개 첫 줄'));
  assert.ok(text.includes('전체 소개 둘째 줄'));
  assert.ok(text.includes('장면 설명'));
  text.length=0;
  drawFrame(canvas,{...state,captions:false},new Map(),0);
  assert.ok(text.includes('전체 소개 첫 줄'));
  assert.ok(text.includes('전체 소개 둘째 줄'));
  assert.ok(!text.includes('장면 설명'));
});
