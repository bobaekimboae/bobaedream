/* 처즈왕(车质网) 앱 전수 캡처(2026-10-17, 휴대폰 미러 29장) 기준 보강.
   목록·상세·순위·필터·검색·해결 소식·공식 발표·법률 상담·내 불만을 처즈왕 화면 구조로 그리고,
   불만 등록(작성) 화면은 기존 흐름(chezhiwang-complaint-board.js + enhancements)을 그대로 쓴다. */
(function(){
  'use strict';
  var previousRender=window.renderChezhiwangComplaintBoardTable;
  if(typeof previousRender!=='function')return;
  var TODAY=new Date('2026-10-17T23:59:00+09:00');
  var storageKey='bobae-chezhiwang-complaints-v1',commentKey='bobae-chezhiwang-complaint-comments-v1',historyKey='bobae-chezhiwang-search-v1',saveKey='bobae-chezhiwang-saved-v1';
  var ICON={back:'assets/reddit-ui/back.svg',search:'assets/reddit-ui/search.svg',share:'assets/chzzk-detail/icons/share-reddit.svg',chat:'assets/chzzk-detail/icons/comment-reddit.svg',save:'assets/chzzk-detail/icons/bookmark.svg',filter:'assets/chzzk-detail/icons/filter.svg',top:'assets/chzzk-detail/icons/top.svg',edit:'assets/reddit-ui/edit.svg',chevron:'assets/reddit-ui/chevron-down.svg',right:'assets/reddit-ui/chevron-right.svg',del:'assets/reddit-ui/delete.svg'};
  var STEPS=[['접수','불만 접수'],['심사','정보 심사'],['접수','제조사 접수'],['회신','처리 회신'],['평가','작성자 평가'],['완료','완료·재불만']];
  /* 처리 단계 아이콘(처즈왕 흐름의 6단계 모양을 단순화한 선 아이콘) */
  var SVG={
    phone:'<path d="M8 4h3l1.5 4-2 1.3a10 10 0 0 0 4.2 4.2l1.3-2L20 13v3a2 2 0 0 1-2 2A14 14 0 0 1 6 6a2 2 0 0 1 2-2Z"/>',
    check:'<path d="m6.5 12.5 3.5 3.5 7.5-8"/>',
    doc:'<path d="M7 4h7l4 4v12H7Z"/><path d="M14 4v4h4M10 12h5M10 16h5"/>',
    reply:'<path d="M5 6h14v9H10l-4 3v-3H5Z"/><path d="M9 10.5h6"/>',
    star:'<path d="m12 4.5 2.3 4.7 5.2.7-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.7Z"/>',
    done:'<path d="M5 5h14v14H5Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    photo:'<rect x="4" y="6" width="16" height="12" rx="2"/><circle cx="9" cy="10.5" r="1.5"/><path d="m5 17 5-4.5 3 2.5 2.5-2 3.5 3"/>',
    video:'<rect x="4" y="6" width="16" height="12" rx="2"/><path d="m10.5 9.5 4 2.5-4 2.5Z"/>',
    hotline:'<path d="M8 4h3l1.5 4-2 1.3a10 10 0 0 0 4.2 4.2l1.3-2L20 13v3a2 2 0 0 1-2 2A14 14 0 0 1 6 6a2 2 0 0 1 2-2Z"/>',
    write:'<path d="M5 19h4l10-10-4-4L5 15Z"/><path d="m13 7 4 4"/>',
    empty:'<rect x="6" y="9" width="36" height="22" rx="4"/><circle cx="17" cy="20" r="2.5"/><circle cx="31" cy="20" r="2.5"/><path d="m22 18 4 4m0-4-4 4"/><path d="M2 14h3M43 14h3M2 26h3"/>'
  };
  function svg(name,cls){return'<svg class="'+(cls||'czp-ic')+'" viewBox="0 0 '+(name==='empty'?'48 40':'24 24')+'" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+SVG[name]+'</svg>'}
  var STATUS={'정보 심사':['check','is-review'],'제조사 접수':['doc','is-accept'],'처리 회신':['reply','is-reply'],'작성자 평가':['star','is-rating'],'완료':['done','is-done']};
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function img(src,alt,cls){return'<img'+(cls?' class="'+cls+'"':'')+' src="'+esc(src)+'" alt="'+esc(alt||'')+'" loading="lazy" onerror="this.style.visibility=\'hidden\'">'}
  function T(){return(window.BBM_BOARD_TABLES||{})['chezhiwang-complaint']||{rows:[]}}
  function read(key,fallback){try{var v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v}catch(e){return fallback}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
  function localRows(){return(read(storageKey,[])||[]).map(function(r){return Object.assign({status:'정보 심사',kind:'car',complaintNo:String(r.complaintId||'').replace(/\D/g,'').slice(-6)},r)})}
  function allRows(){return localRows().concat(T().rows||[])}
  function carRows(){return allRows().filter(function(r){return r.kind!=='business'})}
  function bizRows(){return allRows().filter(function(r){return r.kind==='business'})}
  function find(id){return allRows().find(function(r){return String(r.complaintId||r.id)===String(id)})}
  function q(){return new URLSearchParams(location.search)}
  function go(params){var u=new URL(location.href);u.searchParams.set('board','chezhiwang-complaint');['czw','czwtab','rank','f_brand','f_model','f_status','f_issue','f_fuel','f_seg','f_period','news','qs'].forEach(function(k){u.searchParams.delete(k)});u.searchParams.delete('v');Object.keys(params||{}).forEach(function(k){if(params[k])u.searchParams.set(k,params[k])});return u.pathname+'?'+u.searchParams.toString()}
  function keepFilters(extra){var p={},s=q();['czwtab','f_brand','f_model','f_status','f_issue','f_fuel','f_seg','f_period'].forEach(function(k){if(s.get(k))p[k]=s.get(k)});return Object.assign(p,extra||{})}
  function day(r){return String(r.publishedAt||'').slice(0,10)}
  function stamp(r){var s=String(r.publishedAt||'');return s.slice(0,10)+' '+s.slice(11,16)}
  function no(r){return r.complaintNo||String(r.complaintId||r.id).replace(/\D/g,'')}
  function groupClass(g){return g==='서비스'?'is-service':g==='기타'?'is-other':'is-quality'}
  function pairs(r){if(r.kind==='business')return[[r.subtypes||'서비스',r.subDetail||'기타','서비스']];var subs=String(r.subtypes||'').split(/\s+·\s+/).filter(Boolean),g=r.issueType==='종합'?null:r.issueType;return subs.map(function(x,i){var gg=g||(i===0?'품질':'서비스');return[gg,x,gg]})}
  function pairHtml(p){return'<span class="czp-pair '+groupClass(p[2]||p[0])+'"><i>'+esc(p[0])+'</i><em>'+esc(p[1])+'</em></span>'}
  function statusHtml(s){var m=STATUS[s]||STATUS['정보 심사'];return'<span class="czp-status '+m[1]+'">'+svg(m[0])+esc(s||'정보 심사')+'</span>'}
  function statusIcon(s){var m=STATUS[s]||STATUS['정보 심사'];return'<span class="czp-status-ic '+m[1]+'" title="'+esc(s)+'">'+svg(m[0])+'</span>'}
  function mediaIcons(r){return(r.hasPhoto?'<span class="czp-media is-photo" title="사진 첨부">'+svg('photo')+'</span>':'')+(r.hasVideo?'<span class="czp-media is-video" title="영상 첨부">'+svg('video')+'</span>':'')}
  function trimLine(r){return r.kind==='business'?(r.businessType+' · '+r.businessName):[r.brand,r.model,r.trim].filter(Boolean).join(' / ')}
  function stars(v){var out='';for(var i=1;i<=5;i++)out+='<i class="'+(v>=i?'on':v>=i-.5?'half':'')+'">★</i>';return'<span class="czp-stars" aria-label="5점 중 '+v+'점">'+out+'</span>'}
  function phone(state){var p=document.querySelector('.phone');if(p)p.className='phone chezhiwangComplaintMode czpMode '+(state||'');var list=document.getElementById('list');list.className='list czw czp';return list}
  function bar(title,right,opts){opts=opts||{};return'<header class="czp-bar'+(opts.search?' is-search':'')+'"><button type="button" class="czp-icon-btn" data-back aria-label="뒤로">'+img(ICON.back,'')+'</button><strong>'+esc(title)+'</strong><span class="czp-bar-right">'+(right||'')+'</span></header>'}
  function bindCommon(root,back){[].forEach.call(root.querySelectorAll('[data-back]'),function(b){b.onclick=function(){if(back)location.href=back;else if(history.length>1)history.back();else location.href=go({})}});[].forEach.call(root.querySelectorAll('[data-href]'),function(a){a.onclick=function(e){e.preventDefault();location.href=a.getAttribute('data-href')}});window.scrollTo(0,0)}
  function toast(text){var t=document.createElement('div');t.className='czp-toast';t.textContent=text;document.body.appendChild(t);setTimeout(function(){t.remove()},1800)}

  /* ── 목록 ───────────────────────────────────────── */
  function applyFilters(data){var s=q(),list=function(k){return(s.get(k)||'').split(',').filter(Boolean)};var brand=list('f_brand'),model=list('f_model'),status=list('f_status'),issue=list('f_issue'),fuel=list('f_fuel'),seg=list('f_seg'),period=s.get('f_period');
    return data.filter(function(r){if(brand.length&&brand.indexOf(r.brand)<0)return false;if(model.length&&model.indexOf(r.model)<0)return false;if(status.length&&status.indexOf(r.status)<0)return false;if(fuel.length&&fuel.indexOf(r.fuel)<0)return false;if(seg.length&&seg.indexOf(r.segment)<0)return false;if(issue.length&&!String(r.subtypes||'').split(/\s+·\s+/).some(function(x){return issue.indexOf(x)>-1}))return false;if(period){var d=(TODAY-new Date(r.publishedAt))/864e5;if(d>{'1m':31,'3m':92,'6m':183,'1y':366}[period])return false}return true})}
  function activeFilterChips(){var s=q(),labels={f_brand:'제조사',f_model:'모델',f_status:'처리 단계',f_issue:'문제',f_fuel:'연료',f_seg:'차급',f_period:'기간'},period={'1m':'1개월','3m':'3개월','6m':'6개월','1y':'1년'},out=[];Object.keys(labels).forEach(function(k){if(s.get(k))s.get(k).split(',').forEach(function(v){out.push('<button type="button" class="czp-active-chip" data-drop="'+k+'" data-value="'+esc(v)+'">'+esc(k==='f_period'?period[v]:v)+'<span aria-hidden="true">×</span></button>')})});return out.length?'<div class="czp-active">'+out.join('')+'<button type="button" class="czp-active-reset" data-reset>초기화</button></div>':''}
  function card(r){var right=r.kind==='business'?'':'<span class="czp-card-car">'+img(r.thumbnail,r.brand+' '+r.model)+'</span>';return'<article class="czp-card"><a href="'+esc(go(keepFilters({czw:r.complaintId||r.id})))+'"><div class="czp-card-head"><div><h3><span class="czp-no">['+esc(no(r))+']</span> '+esc(r.title)+mediaIcons(r)+'</h3><p class="czp-trim">'+esc(trimLine(r))+'</p></div>'+right+'</div><div class="czp-typical"><b>대표 문제</b><div class="czp-pairs">'+pairs(r).map(pairHtml).join('')+'</div></div><footer><time>'+esc(day(r))+'</time>'+statusHtml(r.status)+'</footer></a></article>'}
  function videoCard(r){return'<article class="czp-card is-video"><a href="'+esc(go(keepFilters({czw:r.complaintId||r.id})))+'"><h3><span class="czp-no">['+esc(no(r))+']</span> '+esc(r.title)+'</h3><p class="czp-trim">'+esc(trimLine(r))+'</p><div class="czp-poster">'+img(r.thumbnail,r.brand+' '+r.model)+'<span class="czp-play" aria-label="영상 재생"></span><small>보배드림</small></div><footer><time>'+esc(day(r))+'</time>'+statusHtml(r.status)+'</footer></a></article>'}
  function empty(text,cta){return'<div class="czp-empty">'+svg('empty','czp-empty-ic')+'<p>'+esc(text)+'</p>'+(cta||'')+'</div>'}
  function renderList(){var list=phone(''),s=q(),tab=s.get('czwtab')||'list';
    var base=tab==='biz'?bizRows():carRows();if(tab==='video')base=base.filter(function(r){return r.hasVideo});var data=applyFilters(base).sort(function(a,b){return String(b.publishedAt).localeCompare(String(a.publishedAt))});
    var tabs=[['list','불만 목록'],['video','불만 영상'],['biz','업체 불만']].map(function(t){return'<a class="'+(tab===t[0]?'on':'')+'" href="'+esc(go(Object.assign(keepFilters(),{czwtab:t[0]==='list'?'':t[0]})))+'">'+t[1]+'</a>'}).join('');
    var steps=STEPS.map(function(st,i){return(i?'<i class="czp-arrow" aria-hidden="true"></i>':'')+'<li>'+svg(['phone','check','doc','reply','star','done'][i],'czp-step-ic')+'<span>'+esc(st[1])+'</span></li>'}).join('');
    list.innerHTML='<section class="czp-list">'+bar('결함·불만','<a class="czp-text-btn" href="'+esc(go({czw:'rank'}))+'">순위</a><a class="czp-icon-btn" href="'+esc(go({czw:'search'}))+'" aria-label="검색">'+img(ICON.search,'')+'</a>')+
      '<div class="czp-head"><nav class="czp-entry"><a class="is-legal" href="'+esc(go({czw:'legal'}))+'"><b>법률 상담</b><small>LEGAL ADVICE</small></a><a class="is-official" href="'+esc(go({czw:'official'}))+'"><b>공식 발표</b><small>OFFICIAL</small></a><a class="is-news" href="'+esc(go({czw:'news'}))+'"><b>해결 소식</b><small>RESOLVED</small></a></nav><ol class="czp-steps">'+steps+'</ol></div>'+
      '<div class="czp-tabbar"><nav class="czp-tabs">'+tabs+'</nav><a class="czp-filter-btn" href="'+esc(go(keepFilters({czw:'filter'})))+'">'+img(ICON.filter,'')+'필터</a></div>'+activeFilterChips()+
      '<div class="czp-cards">'+(data.length?data.map(tab==='video'?videoCard:card).join(''):empty('조건에 맞는 불만이 없습니다'))+'</div>'+
      '<div class="czp-bottom"><a class="czp-hotline" href="tel:1372">'+svg('hotline')+'1372 소비자상담</a><a class="czp-cta" href="'+esc(go({czw:'write'}))+'">'+svg('write')+'불만 등록</a></div><button type="button" class="czp-top" aria-label="맨 위로">'+img(ICON.top,'')+'</button></section>';
    bindCommon(list,go({}).replace(/board=chezhiwang-complaint&?/,'board=chezhiwang-complaint'));list.querySelector('[data-back]').onclick=function(){location.href='./naver-cafe-list.html'};
    [].forEach.call(list.querySelectorAll('[data-drop]'),function(b){b.onclick=function(){var u=new URL(location.href),k=b.dataset.drop,vals=(u.searchParams.get(k)||'').split(',').filter(function(v){return v&&v!==b.dataset.value});if(vals.length)u.searchParams.set(k,vals.join(','));else u.searchParams.delete(k);location.href=u.pathname+'?'+u.searchParams.toString()}});
    var reset=list.querySelector('[data-reset]');if(reset)reset.onclick=function(){location.href=go(tab==='list'?{}:{czwtab:tab})};
    var top=list.querySelector('.czp-top');top.onclick=function(){window.scrollTo({top:0,behavior:'smooth'})};window.onscroll=function(){top.classList.toggle('show',window.scrollY>600)};}

  /* ── 상세 ───────────────────────────────────────── */
  function comments(id){return read(commentKey+'.'+id,[])||[]}
  function renderDetail(id){var r=find(id);if(!r){renderList();return}var list=phone('chezhiwangComplaintDetail'),saved=comments(id),isBiz=r.kind==='business';
    var info=[['접수번호','['+no(r)+']'],['접수 시간',stamp(r)]].concat(isBiz?[['업체 유형',r.businessType],['업체',r.businessName]]:[['제조사',r.brand],['모델',r.model],['세부 모델',r.trim]]).concat([['처리 단계',statusHtml(r.status)]]);
    var infoHtml=info.map(function(v){return'<div><dt>'+esc(v[0])+'</dt><dd>'+(v[0]==='처리 단계'?v[1]:esc(v[1]))+'</dd></div>'}).join('');
    var steps=STEPS.map(function(st,i){var cur=['정보 심사','제조사 접수','처리 회신','작성자 평가','완료'].indexOf(r.status)+1;return'<li class="'+(i<=cur?'on':'')+(i===cur?' now':'')+'"><span></span><b>'+esc(st[1])+'</b></li>'}).join('');
    var facts=isBiz?'':[['구매일',r.purchaseDate],['문제 발생일',r.problemDate],['발생 주행거리',r.odometer?Number(r.odometer).toLocaleString('ko-KR')+'km':''],['사고 여부',r.accident],['인명 피해',r.injury],['판매·정비 업체',[r.dealerGroup,r.dealerBranch].filter(Boolean).join(' · ')]].filter(function(v){return v[1]}).map(function(v){return'<div><dt>'+esc(v[0])+'</dt><dd>'+esc(v[1])+'</dd></div>'}).join('');
    var carCard=isBiz?'':'<a class="czp-carcard" href="'+esc(go({f_model:r.model}))+'">'+img(r.thumbnail,r.model)+'<span><b>'+esc(r.model)+'</b><small>'+esc(r.brand+' / '+(r.segment||'차급 미입력'))+'</small><small>연료: '+esc(r.fuel||'미입력')+'</small><small>판매 구분: <em>'+esc(r.vehicleType||'미입력')+'</em></small></span></a>';
    var news=(T().news||[]).filter(function(n){return isBiz||n[3]===r.brand}).slice(0,3);if(!news.length)news=(T().news||[]).slice(0,3);
    var newsHtml='<section class="czp-sec"><div class="czp-sec-head"><h2>해결 소식</h2><a href="'+esc(go({czw:'news'}))+'">소식 올리기 '+img(ICON.right,'','czp-chev')+'</a></div>'+news.map(function(n,i){return'<a class="czp-news-row" href="'+esc(go({czw:'news-'+(T().news||[]).indexOf(n)}))+'"><b>'+esc(n[1])+'</b><span><i>해결 소식</i><time>'+esc(n[5])+'</time></span></a>'}).join('')+'</section>';
    var related=(isBiz?bizRows():carRows()).filter(function(x){return x!==r&&(isBiz||x.model===r.model)});if(related.length<3&&!isBiz)related=related.concat(carRows().filter(function(x){return x!==r&&x.brand===r.brand&&x.model!==r.model}));related=related.slice(0,6);
    var relHtml=related.length?'<section class="czp-sec"><div class="czp-sec-head"><h2>관련 불만</h2></div>'+related.map(function(x){return'<a class="czp-rel-row" href="'+esc(go({czw:x.complaintId||x.id}))+'"><span><b>'+esc(x.title)+'</b><small>'+(isBiz?esc(x.businessName):'세부 모델: '+esc(x.trim))+'</small></span><span class="czp-rel-meta">'+statusIcon(x.status)+'<time>'+esc(day(x))+'</time></span></a>'}).join('')+'</section>':'';
    var demand=r.demand?'<p class="czp-demand"><b>요구 사항</b> '+esc(r.demand)+'</p>':'';
    var photo=r.hasPhoto&&r.thumbnail?'<div class="czp-body-photo">'+img(r.thumbnail,r.brand+' '+r.model+' 첨부 사진')+(r.hasVideo?'<span class="czp-play" aria-hidden="true"></span>':'')+'</div>':'';
    var rating=r.rating?'<div class="czp-rating"><b>작성자 평가</b>'+stars(r.rating)+'<em>'+r.rating+'.0</em></div>':'';
    var savedOn=(read(saveKey,[])||[]).indexOf(id)>-1;
    list.innerHTML='<article class="czp-detail">'+bar('불만 상세','<a class="czp-icon-btn" href="'+esc(go({czw:'search'}))+'" aria-label="검색">'+img(ICON.search,'')+'</a>')+
      '<section class="czp-d-main"><h1>'+esc(r.title)+'</h1><dl class="czp-info">'+infoHtml+'</dl><ol class="czp-track" aria-label="처리 단계">'+steps+'</ol><div class="czp-d-body"><p>'+esc(r.body||r.summary)+'</p>'+demand+photo+'</div>'+
      (facts?'<dl class="czp-facts">'+facts+'</dl><p class="czp-private">차대번호·엔진번호·차량번호·연락처는 확인용으로만 쓰며 공개하지 않습니다.</p>':'')+
      '<div class="czp-reply"><h2>불만 회신</h2><p>'+esc(r.reply||'보배드림이 접수 내용을 확인하고 있습니다.')+'</p>'+rating+'</div>'+carCard+'</section>'+newsHtml+relHtml+
      '<section class="czp-sec czp-comments"><div class="czp-sec-head"><h2>최신 댓글</h2></div><div data-comments></div></section>'+
      '<div class="czp-detail-cta"><a class="czp-cta" href="'+esc(go({czw:'write'}))+'">'+svg('write')+'불만 등록</a></div>'+
      '<footer class="czp-actions"><label class="czp-input">'+img(ICON.edit,'')+'<input maxlength="300" placeholder="댓글 쓰기..." aria-label="댓글 입력"></label><button type="button" data-send aria-label="댓글">'+img(ICON.chat,'')+'<small data-count></small></button><button type="button" data-save class="'+(savedOn?'on':'')+'">'+img(ICON.save,'')+'<small>저장</small></button><button type="button" data-share>'+img(ICON.share,'')+'<small>공유</small></button></footer></article>';
    bindCommon(list,go(keepFilters()));
    var base=Number(r.comments||0),fixed=[{author:'정비노트',body:'재현 조건과 경고등 사진, 정비명세서를 함께 보관하면 원인 확인에 도움이 됩니다.'},{author:'안전제보',body:'주행 안전과 관련된 증상이라면 운행을 멈추고 긴급출동부터 이용하세요.'}].slice(0,Math.min(2,base));
    function paint(){var all=saved.concat(fixed);list.querySelector('[data-count]').textContent=String(base+saved.length);list.querySelector('[data-comments]').innerHTML=all.length?all.map(function(c){return'<article class="czp-comment"><span class="czp-avatar">'+esc(String(c.author).slice(0,1))+'</span><div><b>'+esc(c.author)+'</b><p>'+esc(c.body)+'</p></div></article>'}).join('')+(base>fixed.length?'<p class="czp-more-comments">댓글 '+(base-fixed.length)+'개 더 보기</p>':''):empty('아직 댓글이 없습니다')}
    paint();var input=list.querySelector('.czp-input input');
    function send(){var v=input.value.trim();if(!v){input.focus();return}saved.unshift({author:'보배드림 회원',body:v});write(commentKey+'.'+id,saved);input.value='';paint()}
    input.onkeydown=function(e){if(e.key==='Enter')send()};list.querySelector('[data-send]').onclick=send;
    list.querySelector('[data-save]').onclick=function(){var arr=read(saveKey,[])||[],i=arr.indexOf(id);if(i>-1)arr.splice(i,1);else arr.push(id);write(saveKey,arr);this.classList.toggle('on',i<0);toast(i<0?'저장했습니다':'저장을 취소했습니다')};
    list.querySelector('[data-share]').onclick=function(){if(navigator.clipboard)navigator.clipboard.writeText(location.href);toast('링크를 복사했습니다')}}

  /* ── 필터 ───────────────────────────────────────── */
  function uniq(arr){return arr.filter(function(v,i){return v&&arr.indexOf(v)===i})}
  function renderFilter(){var list=phone('chezhiwangComplaintFilter'),s=q(),tab=s.get('czwtab')||'',rows=tab==='biz'?bizRows():carRows(),draft={};
    ['f_brand','f_model','f_status','f_issue','f_fuel','f_seg','f_period'].forEach(function(k){draft[k]=(s.get(k)||'').split(',').filter(Boolean)});
    var issues={'품질 문제':[],'서비스 문제':[],'기타 문제':[]};rows.forEach(function(r){var key=r.issueType==='서비스'?'서비스 문제':r.issueType==='기타'?'기타 문제':'품질 문제';String(r.subtypes||'').split(/\s+·\s+/).forEach(function(x){if(x&&issues[key].indexOf(x)<0)issues[key].push(x)})});
    var groups=[['제조사','f_brand',uniq(rows.map(function(r){return r.brand}))],['모델','f_model',null],['기간','f_period',[['1m','1개월'],['3m','3개월'],['6m','6개월'],['1y','1년']]],['차급','f_seg',uniq(rows.map(function(r){return r.segment}))],['연료','f_fuel',uniq(rows.map(function(r){return r.fuel}))],['품질 문제','f_issue',issues['품질 문제']],['서비스 문제','f_issue',issues['서비스 문제']],['기타 문제','f_issue',issues['기타 문제']],['처리 단계','f_status',T().statuses||[]]].filter(function(g){return g[2]===null||g[2].length});
    function models(){var b=draft.f_brand;return uniq(rows.filter(function(r){return!b.length||b.indexOf(r.brand)>-1}).map(function(r){return r.model}))}
    function chips(g){var vals=g[2]===null?models():g[2];return vals.map(function(v){var val=Array.isArray(v)?v[0]:v,label=Array.isArray(v)?v[1]:v;return'<button type="button" class="czp-fchip'+(draft[g[1]].indexOf(val)>-1?' on':'')+'" data-key="'+g[1]+'" data-value="'+esc(val)+'">'+esc(label)+'</button>'}).join('')||'<p class="czp-fnote">제조사를 먼저 고르면 모델이 나옵니다</p>'}
    function count(){var data=rows.filter(function(r){var ok=true;Object.keys(draft).forEach(function(k){var vals=draft[k];if(!vals.length)return;if(k==='f_brand'&&vals.indexOf(r.brand)<0)ok=false;if(k==='f_model'&&vals.indexOf(r.model)<0)ok=false;if(k==='f_status'&&vals.indexOf(r.status)<0)ok=false;if(k==='f_fuel'&&vals.indexOf(r.fuel)<0)ok=false;if(k==='f_seg'&&vals.indexOf(r.segment)<0)ok=false;if(k==='f_issue'&&!String(r.subtypes||'').split(/\s+·\s+/).some(function(x){return vals.indexOf(x)>-1}))ok=false;if(k==='f_period'){var d=(TODAY-new Date(r.publishedAt))/864e5;if(d>{'1m':31,'3m':92,'6m':183,'1y':366}[vals[vals.length-1]])ok=false}});return ok});return data.length}
    function paint(){var body=list.querySelector('.czp-fbody');body.innerHTML=groups.map(function(g,i){return'<section id="czp-f'+i+'"><h3>'+esc(g[0])+'</h3><div class="czp-fchips">'+chips(g)+'</div></section>'}).join('');list.querySelector('[data-apply]').textContent=count()+'건 보기';var any=Object.keys(draft).some(function(k){return draft[k].length});var r=list.querySelector('[data-freset]');r.disabled=!any;
      [].forEach.call(body.querySelectorAll('.czp-fchip'),function(b){b.onclick=function(){var k=b.dataset.key,v=b.dataset.value,arr=draft[k];if(k==='f_period'){draft[k]=arr[0]===v?[]:[v]}else{var i=arr.indexOf(v);if(i>-1)arr.splice(i,1);else arr.push(v)}if(k==='f_brand'){var ms=models();draft.f_model=draft.f_model.filter(function(m){return ms.indexOf(m)>-1})}var y=body.scrollTop;paint();list.querySelector('.czp-fbody').scrollTop=y}})}
    list.innerHTML='<section class="czp-filter">'+bar('필터')+'<div class="czp-fwrap"><nav class="czp-fnav">'+groups.map(function(g,i){return'<button type="button" data-jump="'+i+'"'+(i===0?' class="on"':'')+'>'+esc(g[0])+'</button>'}).join('')+'</nav><div class="czp-fbody"></div></div><footer class="czp-factions"><button type="button" data-freset>초기화</button><button type="button" data-apply>보기</button></footer></section>';
    bindCommon(list,go(keepFilters()));paint();
    [].forEach.call(list.querySelectorAll('[data-jump]'),function(b){b.onclick=function(){[].forEach.call(list.querySelectorAll('[data-jump]'),function(x){x.classList.toggle('on',x===b)});var t=list.querySelector('#czp-f'+b.dataset.jump),body=list.querySelector('.czp-fbody');body.scrollTo({top:t.offsetTop-body.offsetTop,behavior:'smooth'})}});
    list.querySelector('.czp-fbody').addEventListener('scroll',function(){var body=this,cur=0;[].forEach.call(body.querySelectorAll('section'),function(sec,i){if(sec.offsetTop-body.offsetTop-8<=body.scrollTop)cur=i});[].forEach.call(list.querySelectorAll('[data-jump]'),function(x){x.classList.toggle('on',Number(x.dataset.jump)===cur)})});
    list.querySelector('[data-freset]').onclick=function(){Object.keys(draft).forEach(function(k){draft[k]=[]});paint()};
    list.querySelector('[data-apply]').onclick=function(){var p=tab?{czwtab:tab}:{};Object.keys(draft).forEach(function(k){if(draft[k].length)p[k]=draft[k].join(',')});location.href=go(p)}}

  /* ── 순위 ───────────────────────────────────────── */
  function rankNo(list,key){var prev=null,rank=0;return list.map(function(x,i){if(prev===null||x[key]!==prev)rank=i+1;prev=x[key];return Object.assign({rank:rank},x)})}
  function rankBadge(n){return'<b class="czp-rank r'+(n<=3?n:'n')+'">'+n+'</b>'}
  function renderRank(){var list=phone('chezhiwangComplaintRank'),tab=q().get('rank')||'count',rows=carRows();
    var tabs=[['count','불만 순위'],['reply','제조사 회신율'],['done','해결률'],['rating','작성자 만족도']].map(function(t){return'<a class="'+(tab===t[0]?'on':'')+'" href="'+esc(go({czw:'rank',rank:t[0]==='count'?'':t[0]}))+'">'+t[1]+'</a>'}).join('');
    var body='';
    if(tab==='count'){var by={};rows.forEach(function(r){var k=r.brand+'|'+r.model;(by[k]=by[k]||{brand:r.brand,model:r.model,segment:r.segment,img:r.thumbnail,n:0,subs:{}}).n++;pairs(r).forEach(function(p){var key=p[0]+'|'+p[1]+'|'+(p[2]||p[0]);by[k].subs[key]=(by[k].subs[key]||0)+1})});
      var arr=rankNo(Object.keys(by).map(function(k){return by[k]}).sort(function(a,b){return b.n-a.n}),'n');
      body='<p class="czp-rank-note"><span class="czp-period">2026.09.18 ~ 2026.10.17</span><a href="'+esc(go({czw:'filter'}))+'">'+img(ICON.filter,'')+'필터</a></p><p class="czp-rank-sub">보배드림 결함·불만 실시간 집계</p>'+arr.map(function(x,i){var subs=Object.keys(x.subs).sort(function(a,b){return x.subs[b]-x.subs[a]}).map(function(k){return k.split('|')});return'<article class="czp-rank-car">'+rankBadge(x.rank)+'<a href="'+esc(go({f_model:x.model}))+'">'+img(x.img,x.model)+'<span><b>'+esc(x.model)+'</b><small>'+esc(x.brand+' / '+(x.segment||''))+'</small></span><em><b>'+x.n+'</b>건</em></a><details'+(i<3?' open':'')+'><summary>대표 문제'+img(ICON.chevron,'','czp-chev')+'</summary><div class="czp-pairs">'+subs.map(pairHtml).join('')+'</div></details></article>'}).join('')}
    else{var byB={};rows.forEach(function(r){var b=byB[r.brand]=byB[r.brand]||{brand:r.brand,logo:r.brandLogo,n:0,reply:0,done:0,rs:0,rn:0};b.n++;if(['처리 회신','작성자 평가','완료'].indexOf(r.status)>-1)b.reply++;if(r.status==='완료')b.done++;if(r.rating){b.rs+=r.rating;b.rn++}});
      var arr2=Object.keys(byB).map(function(k){var b=byB[k];b.replyRate=Math.round(b.reply/b.n*100);b.doneRate=Math.round(b.done/b.n*100);b.score=b.rn?Math.round(b.rs/b.rn*10)/10:0;return b});
      var key=tab==='reply'?'replyRate':tab==='done'?'doneRate':'score';arr2=arr2.filter(function(b){return tab!=='rating'||b.rn}).sort(function(a,b){return b[key]-a[key]||b.n-a.n});arr2=rankNo(arr2,key);
      body='<p class="czp-rank-sub">2026년 보배드림 결함·불만 기준 · 제조사별 접수 '+'건수 대비</p>'+arr2.map(function(b){var val=tab==='rating'?'<span class="czp-score"><small>만족도</small> <b>'+b.score.toFixed(1)+'</b></span>'+stars(b.score):'<span class="czp-pct"><b>'+b[key]+'%</b><small>'+(tab==='reply'?'회신율':'해결률')+'</small></span>';return'<article class="czp-rank-brand">'+rankBadge(b.rank)+'<a href="'+esc(go({f_brand:b.brand}))+'">'+img(b.logo,b.brand,'czp-brand-logo')+'<b>'+esc(b.brand)+'</b><small>'+b.n+'건</small></a><div class="czp-rank-val">'+val+'</div></article>'}).join('')}
    list.innerHTML='<section class="czp-rankpage">'+bar('순위','<button type="button" class="czp-icon-btn" data-share aria-label="공유">'+img(ICON.share,'')+'</button>')+'<nav class="czp-tabs is-rank">'+tabs+'</nav><div class="czp-rank-list">'+body+'</div></section>';
    bindCommon(list,go({}));list.querySelector('[data-share]').onclick=function(){if(navigator.clipboard)navigator.clipboard.writeText(location.href);toast('순위 링크를 복사했습니다')}}

  /* ── 검색 ───────────────────────────────────────── */
  function renderSearch(){var list=phone('chezhiwangComplaintSearch'),term=q().get('qs')||'',hist=read(historyKey,[])||[];
    var results=term?allRows().filter(function(r){return(r.title+' '+trimLine(r)+' '+(r.subtypes||'')).toLowerCase().indexOf(term.toLowerCase())>-1}):[];
    list.innerHTML='<section class="czp-search"><header class="czp-bar is-search"><button type="button" class="czp-icon-btn" data-back aria-label="뒤로">'+img(ICON.back,'')+'</button><label class="czp-sbox">'+img(ICON.search,'')+'<input type="search" value="'+esc(term)+'" placeholder="모델·증상·업체로 검색" aria-label="검색어"></label><button type="button" class="czp-text-btn" data-go>검색</button></header>'+
      (term?'<p class="czp-result-count">검색 결과 <b>'+results.length+'</b>건</p>'+(results.length?'<div class="czp-cards">'+results.map(card).join('')+'</div>':empty('검색 결과가 없습니다')):'<div class="czp-history"><div class="czp-sec-head"><h2>검색 기록</h2>'+(hist.length?'<button type="button" data-clear aria-label="검색 기록 전체 삭제">'+img(ICON.del,'')+'</button>':'')+'</div><div class="czp-hchips">'+(hist.length?hist.map(function(h){return'<a href="'+esc(go({czw:'search',qs:h}))+'">'+esc(h)+'</a>'}).join(''):'<p class="czp-fnote">최근 검색어가 없습니다</p>')+'</div><div class="czp-sec-head"><h2>많이 찾는 검색어</h2></div><div class="czp-hchips is-hot">'+['변속 충격','에어컨 누수','쏘렌토','EV6 충전','도장 단차','대차'].map(function(h,i){return'<a href="'+esc(go({czw:'search',qs:h}))+'"><i>'+(i+1)+'</i>'+esc(h)+'</a>'}).join('')+'</div></div>')+'</section>';
    bindCommon(list,go({}));var input=list.querySelector('input');if(!term)setTimeout(function(){input.focus()},50);
    function run(){var v=input.value.trim();if(!v)return;var h=(read(historyKey,[])||[]).filter(function(x){return x!==v});h.unshift(v);write(historyKey,h.slice(0,10));location.href=go({czw:'search',qs:v})}
    list.querySelector('[data-go]').onclick=run;input.onkeydown=function(e){if(e.key==='Enter')run()};var c=list.querySelector('[data-clear]');if(c)c.onclick=function(){write(historyKey,[]);renderSearch()}}

  /* ── 해결 소식 · 공식 발표 · 법률 상담 · 내 불만 ───────── */
  function renderNews(){var list=phone('chezhiwangComplaintNews'),news=T().news||[];
    list.innerHTML='<section class="czp-sub">'+bar('해결 소식','<a class="czp-icon-btn" href="'+esc(go({czw:'search'}))+'" aria-label="검색">'+img(ICON.search,'')+'</a>')+'<p class="czp-sub-note">불만 등록 뒤 어떻게 해결됐는지 작성자가 직접 남긴 소식입니다.</p>'+news.map(function(n,i){return'<a class="czp-news-item" href="'+esc(go({czw:'news-'+i}))+'"><span class="czp-who"><span class="czp-avatar">'+esc(n[0].slice(0,1))+'</span>'+esc(n[0])+'</span><b>'+esc(n[1])+'</b><span class="czp-news-meta"><time>'+esc(n[5])+'</time><span>조회 '+n[6]+'</span><span>댓글 '+n[7]+'</span></span></a>'}).join('')+'<div class="czp-bottom is-single"><button type="button" class="czp-cta" data-post>+ 소식 올리기</button></div></section>';
    bindCommon(list,go({}));list.querySelector('[data-post]').onclick=function(){toast('해결 소식 작성은 다음 단계에서 연결합니다')}}
  function renderNewsDetail(i){var n=(T().news||[])[i];if(!n){renderNews();return}var list=phone('chezhiwangComplaintNews');
    list.innerHTML='<article class="czp-sub">'+bar('해결 소식')+'<section class="czp-d-main"><h1>'+esc(n[1])+'</h1><div class="czp-who is-big"><span class="czp-avatar">'+esc(n[0].slice(0,1))+'</span><span><b>'+esc(n[0])+' <i>작성자</i></b><small>'+esc(n[5])+'</small></span></div><div class="czp-d-body"><p>'+esc(n[2])+'</p></div><a class="czp-related-link" href="'+esc(go({f_model:n[4]}))+'">'+esc(n[3]+' '+n[4])+' 불만 모아 보기 '+img(ICON.right,'','czp-chev')+'</a></section><section class="czp-sec"><div class="czp-sec-head"><h2>전체 댓글</h2></div>'+empty('아직 댓글이 없습니다')+'</section></article>';
    bindCommon(list,go({czw:'news'}))}
  function renderOfficial(){var list=phone('chezhiwangComplaintNews'),items=T().official||[];
    list.innerHTML='<section class="czp-sub">'+bar('공식 발표')+items.map(function(o){return'<article class="czp-official"><div><b>'+esc(o[1])+'</b><p>'+esc(o[2])+'</p><span><i>'+esc(o[0])+'</i><time>'+esc(o[3])+'</time></span></div></article>'}).join('')+'<p class="czp-sub-note">제조사·기관이 발표한 공식 입장은 확인되는 대로 이곳에 모읍니다.</p></section>';bindCommon(list,go({}))}
  function renderLegal(){var list=phone('chezhiwangComplaintNews');
    list.innerHTML='<section class="czp-sub">'+bar('법률 상담')+'<div class="czp-legal-hero"><b>보배드림 &amp; 제휴 법률사무소</b><small>차량 분쟁 상담 연결 · 제휴 준비 중</small></div><section class="czp-d-main"><h2 class="czp-legal-h">상담 가능 분야</h2><div class="czp-hchips">'+['신차 결함·교환·환불','중고차 허위·누락 고지','정비 과실·수리비','리스·렌트 계약','보험 처리 분쟁'].map(function(v){return'<a>'+esc(v)+'</a>'}).join('')+'</div><h2 class="czp-legal-h">먼저 이용할 수 있는 곳</h2><ul class="czp-legal-list"><li><b>1372 소비자상담센터</b><span>한국소비자원 피해구제·분쟁조정 안내</span></li><li><b>자동차리콜센터</b><span>국토교통부 리콜 대상 조회·결함 신고</span></li></ul><p class="czp-private">제휴 변호사 정보와 상담 신청은 제휴가 확정되면 공개합니다.</p></section></section>';bindCommon(list,go({}))}
  function renderMine(){var list=phone('chezhiwangComplaintNews'),mine=localRows();
    list.innerHTML='<section class="czp-sub">'+bar('내 불만')+(mine.length?'<div class="czp-cards">'+mine.map(card).join('')+'</div>':empty('등록한 불만이 없습니다'))+'<div class="czp-bottom is-single"><a class="czp-cta" href="'+esc(go({czw:'write'}))+'">'+svg('write')+'불만 등록</a></div></section>';bindCommon(list,go({}))}

  function render(arg){window.onscroll=null;var id=q().get('czw')||'';
    if(id==='write'){previousRender(arg);return}
    if(id==='rank')return renderRank();if(id==='filter')return renderFilter();if(id==='search')return renderSearch();
    if(id==='news')return renderNews();if(/^news-\d+$/.test(id))return renderNewsDetail(Number(id.slice(5)));
    if(id==='official')return renderOfficial();if(id==='legal')return renderLegal();if(id==='mine')return renderMine();
    if(id)return renderDetail(id);renderList()}
  window.renderChezhiwangComplaintBoardTable=render;
})();
