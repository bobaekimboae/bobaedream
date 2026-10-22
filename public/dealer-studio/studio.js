import { palettes, scenesFor, sceneAt, stripCompany, safeFilename, socialCaption, drawFrame, mixAudio, encodeMp4 } from './core.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  video:'../icons/chotot/chotot-common-video-play.svg',image:'../icons/chotot/chotot-common-image.svg',
  upload:'../icons/chotot/chotot-listing-register-image-upload-color-change.svg',info:'../icons/chotot/chotot-common-info.svg',
  delete:'../icons/chotot/chotot-listing-register-image-upload-delete.svg',
  car:'../icons/dealer-profile/car-sale-as24.svg',person:'../icons/dealer-profile/person-as24.svg',
  pin:'../icons/dealer-profile/pin-reddit.svg',
};
const paintIcons = root => root.querySelectorAll('[data-icon]').forEach(el => el.style.setProperty('--icon',`url("${icons[el.dataset.icon]}")`));
paintIcons(document);
$$('.nav-item').forEach(el=>el.setAttribute('aria-label',el.querySelector('span')?.textContent.trim()||el.textContent.trim()));
$('.brand').setAttribute('aria-label','보배드림 홈');
$$('dialog').forEach(dialog=>{const title=dialog.querySelector('h2');title.id=`${dialog.id}-title`;dialog.setAttribute('aria-labelledby',title.id);});
let state = {title:'BMW M3 컴페티션',year:'2023',mileage:'22,000',fuel:'가솔린',price:'가격 상담',gallery:'서울오토갤러리',company:'디앤디플러스',dealer:'박상용',phone:'',kicker:'드라이빙의 즐거움을 만나보세요',highlights:'사진 속 매력을, 더 가까이 만나보세요.',cta:'이 차량이 궁금하다면',template:'clean',duration:15,motion:true,captions:true,endCard:true,music:'ambient',volume:.4,photos:[],logo:null};
let files={music:null,voice:null}, images=new Map(), stock=[], time=0, selected=0, playing=false, frameId, startTime, audioContext, audioSource, busy=false, ready=false, aborter, currentResult, resultUrl, toastTimer, saveTimer, loadToken=0, draggedId;
const objectUrls=new Set(), libraryUrls=new Set();
const objectUrl = blob => {const url=URL.createObjectURL(blob);objectUrls.add(url);return url;};
function toast(message) {$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3800);}
const formatTime = n => `00:${String(Math.floor(n)).padStart(2,'0')}`;
function openDialog(id) {stop();const d=$(id);if(!d.open)d.showModal();}
function switchPane(pane) {$$('.pane').forEach(el=>el.hidden=el.id!==`pane-${pane}`);$$('[data-pane]').forEach(el=>{const active=el.dataset.pane===pane;el.classList.toggle('selected',active);if(active)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});}
const database = new Promise((resolve,reject)=>{
  const req=indexedDB.open('bbm-dealer-studio',1);
  req.onupgradeneeded=()=>{req.result.createObjectStore('project');req.result.createObjectStore('videos',{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('저장소가 다른 탭에서 사용 중입니다.'));
});
database.catch(()=>{});
async function dbRead(store,key) {const db=await database;return new Promise((resolve,reject)=>{const req=db.transaction(store).objectStore(store)[key===undefined?'getAll':'get'](key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function dbWrite(store,value,key) {const db=await database;return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
async function saveDraft(explicit=false) {
  if(!ready)return;
  clearTimeout(saveTimer);
  try {await dbWrite('project',{state,files},'current');$('#save-state').textContent='기기에 저장됨';if(explicit)toast('사진과 편집 내용을 이 기기에 저장했어요.');}
  catch {$('#save-state').textContent='임시 저장 실패';toast('기기 저장 공간을 확인해 주세요. 현재 영상은 계속 편집할 수 있어요.');}
}
function changed() {stop();$('#save-state').textContent='변경 내용 저장 중';clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDraft(),650);render();}
function releasePhoto(photo) {if(photo?.blob&&objectUrls.has(photo.src)){URL.revokeObjectURL(photo.src);objectUrls.delete(photo.src);}if(photo)images.delete(photo.id);}
async function imageFrom(src) {const image=new Image();image.decoding='async';image.src=src;await image.decode();return image;}
async function reloadImages() {
  const token=++loadToken,next=new Map();
  await Promise.all(state.photos.map(async photo=>{try{next.set(photo.id,await imageFrom(photo.src));}catch{/* Retain unavailable photos visibly, but block export. */}}));
  if(state.logo)try{next.set('logo',await imageFrom(objectUrl(state.logo)));}catch{toast('로고를 열 수 없습니다. 다른 파일을 선택해 주세요.');}
  if(token!==loadToken)return;images=next;render();
}
function syncFields() {$$('[data-field]').forEach(el=>{const value=state[el.dataset.field];if(el.type==='checkbox')el.checked=!!value;else if(document.activeElement!==el)el.value=String(value??'');});$('#volume-label').textContent=`${Math.round(state.volume*100)}%`;$('#music-upload').hidden=state.music!=='upload';$('#music-label').textContent=files.music?.name||'MP3 · WAV · M4A / 최대 30MB';$('#voice-label').textContent=files.voice?.name||'녹음한 음성 파일 추가 · 최대 30MB';$('#remove-voice').hidden=!files.voice;$('#logo-label').textContent=state.logo?.name||'PNG · JPG · WebP / 최대 2MB';$('#remove-logo').hidden=!state.logo;}
function render() {
  syncFields();
  const photo=state.photos[0];$('#vehicle-thumb').src=photo?.src||'../app/icon-rounded-192.png';$('#vehicle-title').textContent=state.title||'차량명을 입력해 주세요';$('#vehicle-meta').textContent=[state.year&&`${state.year}년식`,state.mileage&&`${state.mileage}km`,state.fuel].filter(Boolean).join(' · ');
  $('#photo-count').textContent=state.photos.length;$('#media-summary').textContent=`${state.photos.length}장의 사진 · ${state.duration}초`;
  $('#photos').innerHTML=state.photos.length?state.photos.map((p,i)=>`<div class="photo-tile ${i===selected?'selected':''}" draggable="true" data-id="${esc(p.id)}"><div class="photo-image"><button data-select="${i}" aria-label="${i+1}번 사진 선택"><img src="${esc(p.src)}" alt="차량 사진 ${i+1}"></button><span class="${i===0?'cover':''}">${i===0?'커버':String(i+1).padStart(2,'0')}</span></div><div class="photo-actions"><button data-move="${i}" data-dir="-1" ${i===0?'disabled':''} aria-label="${i+1}번 사진 앞으로">←</button><button data-move="${i}" data-dir="1" ${i===state.photos.length-1?'disabled':''} aria-label="${i+1}번 사진 뒤로">→</button><button class="delete-photo" data-delete="${i}" aria-label="${i+1}번 사진 삭제"><i data-icon="delete"></i></button></div></div>`).join(''):'<div class="empty">사진을 추가하면 여기에 표시돼요.</div>';
  paintIcons($('#photos'));
  $('#templates').innerHTML=Object.entries(palettes).map(([id,p])=>`<button class="template ${state.template===id?'selected':''}" data-template="${id}" aria-pressed="${state.template===id}"><span class="template-art" style="--template-bg:${p.background};--template-ink:${p.ink};--template-accent:${p.accent}"><small>VEHICLE FILM</small><b>${id==='clean'?'좋은 차,<br>좋은 시작.':id==='night'?'THE NEXT<br>DRIVE.':'DRIVE<br>YOUR WAY.'}</b><span></span></span><strong>${p.name}</strong><small>${p.label}</small></button>`).join('');
  const scenes=scenesFor(state);selected=Math.min(selected,Math.max(0,scenes.length-1));
  $('#timeline-count').textContent=`${scenes.length}개 장면 · ${state.duration}초`;
  $('#timeline').innerHTML=scenes.map((s,i)=>`<button data-select="${i}" class="${i===selected?'selected':''}" aria-label="${s.end?'마지막 안내':`${i+1}번`} 장면 선택">${s.end?'<div class="end-card-thumb">딜러 안내</div>':`<img src="${esc(s.src)}" alt="">`}<span>${s.end?'마지막 안내':`${String(i+1).padStart(2,'0')} ${i===0?'커버':'차량 사진'}`}<small>${s.duration.toFixed(1)}초</small></span></button>`).join('');
  updateSceneEditor();time=Math.min(time,Number(state.duration)-.01);draw();
}
function updateSceneEditor() {const scene=scenesFor(state)[selected];$('#scene-title').textContent=scene?.end?'마지막 딜러 안내':`장면 ${selected+1} 소개 문구`;$('#scene-length').textContent=scene?`${scene.duration.toFixed(1)}초`:'';$('#scene-caption').disabled=!scene;$('#scene-caption').value=scene?.end?state.cta:scene?.caption||'';}
function draw() {drawFrame($('#preview'),state,images,time);$('#scrubber').max=state.duration;$('#scrubber').value=String(time);$('#play-time').textContent=formatTime(time);$('#total-time').textContent=formatTime(state.duration);}
function stop() {playing=false;cancelAnimationFrame(frameId);try{audioSource?.stop();}catch{}audioSource=null;$('#play-symbol').textContent='▶';$('.canvas-play').classList.remove('playing');$('.canvas-play').setAttribute('aria-label','영상 미리보기 재생');}
async function play() {
  if(playing){stop();return;}if(busy||!state.photos.length)return;
  if(time>=Number(state.duration)-.1)time=0;
  playing=true;$('#play-symbol').textContent='Ⅱ';$('.canvas-play').classList.add('playing');$('.canvas-play').setAttribute('aria-label','영상 미리보기 일시정지');
  startTime=performance.now()-time*1000;
  function tick(now) {if(!playing)return;time=(now-startTime)/1000;if(time>=Number(state.duration)){time=Number(state.duration)-.01;draw();stop();return;}draw();frameId=requestAnimationFrame(tick);}
  frameId=requestAnimationFrame(tick);
  try {const buffer=await mixAudio(state,files);if(!playing)return;audioContext??=new AudioContext();await audioContext.resume();audioSource=audioContext.createBufferSource();audioSource.buffer=buffer;audioSource.connect(audioContext.destination);audioSource.start(0,Math.min(time,buffer.duration-.01));}catch{toast('오디오를 재생할 수 없어 화면만 미리보기합니다.');}
}
function selectScene(index) {stop();selected=index;time=scenesFor(state)[index]?.start||0;render();}
async function addPhotos(list) {
  if(busy)return;stop();const room=12-state.photos.length;if(room<=0){toast('사진은 최대 12장까지 추가할 수 있어요.');return;}
  const all=[...list], accepted=all.filter(f=>['image/jpeg','image/png','image/webp'].includes(f.type)&&f.size<=15*1024*1024).slice(0,room);
  let added=0;
  for(const blob of accepted) {const src=objectUrl(blob);try{const image=await imageFrom(src);if(image.width*image.height>48e6)throw new Error();const id=crypto.randomUUID();state.photos.push({id,src,blob,caption:''});images.set(id,image);added++;}catch{URL.revokeObjectURL(src);objectUrls.delete(src);}}
  if(all.length>accepted.length)toast('JPG·PNG·WebP, 15MB 이하 파일만 최대 12장 추가합니다.');else toast(`${added}장의 사진을 추가했어요.`);
  changed();
}
function renderStock(query='') {const found=stock.filter(item=>`${item.title} ${item.company}`.toLowerCase().includes(query.toLowerCase()));$('#stock-list').innerHTML=found.map(item=>`<button class="stock-option" data-stock="${item.id}"><img src="${esc(item.photos[0])}" alt="${esc(item.title)}"><span><strong>${esc(item.title)}</strong><small>${esc(item.year)}년 · ${esc(item.mileage)}km<br>${esc(item.company)} · ${esc(item.dealer)}</small></span></button>`).join('')||'<p class="empty">검색한 차량이 없습니다.</p>';}
async function chooseStock(id) {const item=stock.find(item=>item.id===id);if(!item)return;stop();Object.assign(state,{title:item.title,year:String(item.year),mileage:item.mileage,fuel:item.fuel,company:item.company,gallery:item.gallery,dealer:item.dealer,phone:'',price:'가격 상담',logo:null,photos:item.photos.slice(0,6).map((src,i)=>({id:crypto.randomUUID(),src,caption:['외관에서 느껴지는 첫인상','다른 각도에서 만나는 매력','차량의 디테일을 확인하세요','실내 공간까지 살펴보세요','사진 속 차량을 직접 만나보세요','자세한 내용은 판매자에게 문의하세요'][i]}))});selected=0;time=0;$('#stock-dialog').close();render();await reloadImages();changed();}
function download(blob,name) {const url=objectUrl(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>{URL.revokeObjectURL(url);objectUrls.delete(url);},60000);}
function cover() {const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;drawFrame(canvas,state,images,0);canvas.toBlob(blob=>{if(blob)download(blob,`${safeFilename(state.title)}-커버.jpg`);else toast('커버를 저장하지 못했어요.');},'image/jpeg',.94);}
function openExport() {if(!state.photos.length){toast('사진을 한 장 이상 추가해 주세요.');return;}if(state.photos.some(p=>!images.has(p.id))){toast('불러오지 못한 사진이 있어요. 해당 사진을 삭제하거나 다시 추가해 주세요.');return;}if(!state.title.trim()){toast('차량명을 입력해 주세요.');switchPane('design');return;}if(state.music==='upload'&&!files.music){toast('배경음악 파일을 선택하거나 음악 설정을 바꿔 주세요.');switchPane('brand');return;}$('#export-title').textContent=state.title;$('#export-info').textContent=`${state.photos.length}장 · ${state.duration}초 · ${palettes[state.template].name}`;$('#export-settings').hidden=false;$('#export-progress').hidden=true;$('#export-result').hidden=true;$('#export-error').textContent='';$('#export-confirm').checked=false;openDialog('#export-dialog');}
async function renderVideo() {
  if(busy)return;if(!$('#export-confirm').checked){$('#export-error').textContent='차량 정보와 사진 확인에 체크해 주세요.';return;}
  stop();busy=true;aborter=new AbortController();$$('[data-action="export"]').forEach(el=>el.disabled=true);$('#export-settings').hidden=true;$('#export-progress').hidden=false;$('#export-error').textContent='';$('#render-progress').value=0;
  try {
    const height=Number($('#export-size').value);
    const blob=await encodeMp4(state,images,files,{height,signal:aborter.signal,onProgress:(n,label)=>{$('#render-progress').value=n;$('#render-percent').textContent=`${n}%`;$('#render-label').textContent=label;}});
    if(resultUrl)URL.revokeObjectURL(resultUrl);resultUrl=URL.createObjectURL(blob);currentResult={id:crypto.randomUUID(),blob,title:state.title,duration:state.duration,height,created:Date.now(),caption:socialCaption(state)};
    $('#result-video').src=resultUrl;$('#download-video').href=resultUrl;$('#download-video').download=`${safeFilename(state.title)}-${state.duration}초.mp4`;$('#result-info').textContent=`${height*9/16} × ${height} · ${state.duration}초 · ${(blob.size/1048576).toFixed(1)}MB · MP4`;
    $('#export-progress').hidden=true;$('#export-result').hidden=false;
    try {await dbWrite('videos',currentResult);const old=(await dbRead('videos')).sort((a,b)=>b.created-a.created).slice(5);const db=await database;const tx=db.transaction('videos','readwrite');old.forEach(item=>tx.objectStore('videos').delete(item.id));$('#export-count').textContent=String(Math.min(5,(await dbRead('videos')).length));}catch{toast('영상은 완성됐지만 보관함 저장에 실패했어요. 지금 다운로드해 주세요.');}
  } catch(error) {$('#export-progress').hidden=true;$('#export-settings').hidden=false;$('#export-error').textContent=error.name==='AbortError'?'제작을 취소했어요. 편집한 내용은 그대로입니다.':`영상 제작 실패: ${error.message}`;}
  finally {busy=false;aborter=null;$$('[data-action="export"]').forEach(el=>el.disabled=false);}
}
async function library() {libraryUrls.forEach(url=>URL.revokeObjectURL(url));libraryUrls.clear();try{const items=(await dbRead('videos')).sort((a,b)=>b.created-a.created);$('#library-list').innerHTML=items.map(item=>{const url=URL.createObjectURL(item.blob);libraryUrls.add(url);return `<div class="library-item"><video src="${url}" muted preload="metadata" aria-label="${esc(item.title)} 완성 영상"></video><div><strong>${esc(item.title)}</strong><small>${item.duration}초 · ${item.height*9/16} × ${item.height} · ${new Date(item.created).toLocaleDateString('ko-KR')}</small><a class="button secondary" href="${url}" download="${esc(safeFilename(item.title))}.mp4">MP4 다운로드</a></div></div>`;}).join('')||'<p class="empty">아직 만든 영상이 없어요. 첫 매물 영상을 완성해 보세요.</p>';openDialog('#library-dialog');}catch{toast('이 브라우저의 보관함을 열 수 없어요.');}}

document.addEventListener('click',async event=>{
  const target=event.target.closest('button,a');if(!target)return;
  if(target.hasAttribute('data-close')){const dialog=target.closest('dialog');if(dialog.id==='export-dialog'&&busy){aborter?.abort();return;}dialog.close();return;}
  if(busy&&!target.closest('#export-dialog'))return;
  if(target.dataset.pane){stop();switchPane(target.dataset.pane);return;}
  if(target.dataset.next){stop();switchPane(target.dataset.next);return;}
  if(target.dataset.select!==undefined){selectScene(Number(target.dataset.select));return;}
  if(target.dataset.template){state.template=target.dataset.template;changed();return;}
  if(target.dataset.stock){await chooseStock(target.dataset.stock);return;}
  if(target.dataset.delete!==undefined){const [removed]=state.photos.splice(Number(target.dataset.delete),1);releasePhoto(removed);selected=0;time=0;changed();return;}
  if(target.dataset.move!==undefined){const from=Number(target.dataset.move),to=from+Number(target.dataset.dir);if(to<0||to>=state.photos.length)return;[state.photos[from],state.photos[to]]=[state.photos[to],state.photos[from]];selected=to;changed();return;}
  switch(target.dataset.action){
    case 'editor':switchPane('media');break;case 'branding':switchPane('brand');break;
    case 'library':await library();break;case 'help':openDialog('#help-dialog');break;
    case 'stock':renderStock();openDialog('#stock-dialog');break;case 'save':await saveDraft(true);break;
    case 'clear':state.photos.forEach(releasePhoto);state.photos=[];selected=0;time=0;changed();break;
    case 'remove-logo':state.logo=null;images.delete('logo');changed();break;
    case 'remove-voice':files.voice=null;changed();break;
    case 'export':openExport();break;case 'play':await play();break;case 'cover':cover();break;
    case 'caption':try{await navigator.clipboard.writeText(currentResult?.caption||socialCaption(state));toast('영상과 함께 올릴 게시글을 복사했어요.');}catch{toast('클립보드 접근을 허용한 뒤 다시 시도해 주세요.');}break;
  }
});
$$('[data-field]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.field;state[key]=el.type==='checkbox'?el.checked:key==='duration'||key==='volume'?Number(el.value):key==='motion'?el.value==='true':el.value;changed();}));
$('#scrubber').addEventListener('input',event=>{stop();time=Number(event.target.value);const scene=sceneAt(state,time);if(scene){selected=scene.index;updateSceneEditor();}draw();});
$('#scene-caption').addEventListener('input',event=>{if(scenesFor(state)[selected]?.end)state.cta=event.target.value;else if(state.photos[selected])state.photos[selected].caption=event.target.value;stop();draw();clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDraft(),650);});
$('#stock-search').addEventListener('input',event=>renderStock(event.target.value));
$('#photo-files').addEventListener('change',async event=>{await addPhotos(event.target.files);event.target.value='';});
$('#drop-zone').addEventListener('dragover',event=>{event.preventDefault();$('#drop-zone').classList.add('dragging');});
$('#drop-zone').addEventListener('dragleave',()=>$('#drop-zone').classList.remove('dragging'));
$('#drop-zone').addEventListener('drop',event=>{event.preventDefault();$('#drop-zone').classList.remove('dragging');void addPhotos(event.dataTransfer.files);});
$('#photos').addEventListener('dragstart',event=>{draggedId=event.target.closest('[data-id]')?.dataset.id;if(draggedId)event.dataTransfer.setData('text/plain',draggedId);});
$('#photos').addEventListener('dragover',event=>event.preventDefault());
$('#photos').addEventListener('drop',event=>{event.preventDefault();const toId=event.target.closest('[data-id]')?.dataset.id,from=state.photos.findIndex(p=>p.id===draggedId),to=state.photos.findIndex(p=>p.id===toId);if(from<0||to<0||busy)return;const [photo]=state.photos.splice(from,1);state.photos.splice(to,0,photo);selected=to;changed();});
$('#logo-file').addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;if(file.size>2*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('로고는 PNG·JPG·WebP 2MB 이하로 선택해 주세요.');return;}try{const image=await imageFrom(objectUrl(file));images.set('logo',image);state.logo=file;changed();}catch{toast('로고 파일을 열 수 없어요.');}});
for(const type of ['music','voice'])$(`#${type}-file`).addEventListener('change',async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;if(!file.type.startsWith('audio/')||file.size>30*1024*1024){toast('30MB 이하의 오디오 파일을 선택해 주세요.');return;}try{const ctx=new AudioContext();try{await ctx.decodeAudioData(await file.arrayBuffer());}finally{await ctx.close();}files[type]=file;if(type==='music')state.music='upload';changed();}catch{toast('재생할 수 있는 오디오 파일을 선택해 주세요.');}});
$('#render-button').addEventListener('click',renderVideo);$('#cancel-render').addEventListener('click',()=>aborter?.abort());
$('#export-dialog').addEventListener('cancel',event=>{if(busy){event.preventDefault();aborter?.abort();}});
$('#export-dialog').addEventListener('close',()=>{$('#result-video').pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
window.addEventListener('pagehide',()=>{stop();void audioContext?.close();objectUrls.forEach(url=>URL.revokeObjectURL(url));libraryUrls.forEach(url=>URL.revokeObjectURL(url));if(resultUrl)URL.revokeObjectURL(resultUrl);});

async function init() {
  try {
    const response=await fetch('./inventory.json');if(!response.ok)throw new Error();stock=await response.json();
    let saved;try{saved=await dbRead('project','current');}catch{$('#save-state').textContent='기기 저장 사용 불가';}
    if(saved?.state&&Array.isArray(saved.state.photos)&&saved.state.photos.length<=12){Object.assign(state,saved.state);files=saved.files||files;state.photos=state.photos.map(p=>({...p,src:p.blob?objectUrl(p.blob):p.src}));await reloadImages();}
    else await chooseStock(stock.find(item=>item.id==='sag-1')?.id||stock[0].id);
    try{$('#export-count').textContent=String((await dbRead('videos')).length);}catch{}
    ready=true;render();await document.fonts.ready;draw();
  }catch{toast('예시 매물을 불러오지 못했어요. 내 사진을 직접 추가할 수 있습니다.');ready=true;render();}
}
void init();
