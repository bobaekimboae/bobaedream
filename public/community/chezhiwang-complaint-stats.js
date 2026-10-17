/* 처즈왕(车质网) 순위 통계·필터(2026-10-17, 앱 전수 캡처 기준).
   한국은 공식 접수 절차가 없어 처리 단계·회신에 기대는 순위(제조사 회신율·철회율·작성자 만족도)는 두지 않는다.
   순위: 불만 순위 · 판매량 순위 · 불만·판매 비율 순위. 필터: 처즈왕 목록 필터·순위 필터 항목 그대로. */
(function(){
  'use strict';
  var previous=window.renderChezhiwangComplaintBoardTable;
  if(typeof previous!=='function')return;
  var TODAY=new Date('2026-10-17T23:59:00+09:00');
  var ICON={search:'assets/reddit-ui/search.svg',right:'assets/reddit-ui/chevron-right.svg',del:'assets/reddit-ui/delete.svg',chat:'assets/chzzk-detail/icons/comment-reddit.svg',like:'assets/reddit-ui/recommend-thumb-up.svg',back:'assets/reddit-ui/back.svg',share:'assets/chzzk-detail/icons/share-reddit.svg',filter:'assets/chzzk-detail/icons/filter.svg',chevron:'assets/reddit-ui/chevron-down.svg'};
  var KEYS=['f_from','f_to','f_brand','f_model','f_trim','f_body','f_fuel','f_price','f_origin','f_country','f_age','f_quality','f_service','f_other','f_sales'];
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function img(src,alt,cls){return'<img'+(cls?' class="'+cls+'"':'')+' src="'+esc(src)+'" alt="'+esc(alt||'')+'" loading="lazy">'}
  function T(){return(window.BBM_BOARD_TABLES||{})['chezhiwang-complaint']||{rows:[]}}
  function cats(){return T().categories||{'품질':[],'서비스':[],'기타':[]}}
  function localRows(){try{return JSON.parse(localStorage.getItem('bobae-chezhiwang-complaints-v1')||'[]')||[]}catch(e){return[]}}
  function allRows(){return localRows().concat(T().rows||[])}
  function q(){return new URLSearchParams(location.search)}
  function href(params){var u=new URL(location.href);u.searchParams.set('board','chezhiwang-complaint');['czw','for','rank','czwtab','qs'].concat(KEYS).forEach(function(k){u.searchParams.delete(k)});u.searchParams.delete('v');Object.keys(params||{}).forEach(function(k){if(params[k])u.searchParams.set(k,params[k])});return u.pathname+'?'+u.searchParams.toString()}
  function current(){var s=q(),o={};KEYS.forEach(function(k){if(s.get(k))o[k]=s.get(k)});return o}
  function vals(o,k){return String(o[k]||'').split(',').filter(Boolean)}
  function uniq(arr){return arr.filter(function(v,i){return v&&arr.indexOf(v)===i})}
  function problemCats(r){return(r.problems||[]).map(function(p){return p[0]}).concat(String(r.subtypes||'').split(/\s+·\s+/))}
  function ageBucket(r){var a=new Date(r.purchaseDate),b=new Date(r.problemDate);if(isNaN(a)||isNaN(b))return'';var m=(b-a)/864e5/30.4;return m<=1?'1개월 이내':m<=3?'1~3개월':m<=6?'3~6개월':m<=12?'6~12개월':m<=36?'1~3년':'3년 이상'}
  function match(r,o){var d=String(r.publishedAt||'').slice(0,10);if(o.f_from&&d<o.f_from)return false;if(o.f_to&&d>o.f_to)return false;
    var checks=[['f_brand','brand'],['f_model','model'],['f_trim','trim'],['f_body','bodyType'],['f_fuel','fuel'],['f_price','priceBand'],['f_origin','brandOrigin'],['f_country','country']];
    for(var i=0;i<checks.length;i++){var v=vals(o,checks[i][0]);if(v.length&&v.indexOf(r[checks[i][1]])<0)return false}
    var age=vals(o,'f_age');if(age.length&&age.indexOf(ageBucket(r))<0)return false;
    var pc=problemCats(r),need=vals(o,'f_quality').concat(vals(o,'f_service'),vals(o,'f_other'));if(need.length&&!pc.some(function(c){return need.indexOf(c)>-1}))return false;return true}
  function pairClass(c){var k=cats();return(k['서비스']||[]).indexOf(c)>-1?'is-service':(k['기타']||[]).indexOf(c)>-1?'is-other':'is-quality'}
  function pairHtml(p){return'<span class="czw-pair '+pairClass(p[0])+'"><i>'+esc(p[0])+'</i><em>'+esc(p[1])+'</em></span>'}
  function toast(text){var t=document.createElement('div');t.className='czs-toast';t.textContent=text;document.body.appendChild(t);setTimeout(function(){t.remove()},1800)}
  function phone(state){var p=document.querySelector('.phone');if(p)p.className='phone chezhiwangComplaintMode czsMode '+state;var list=document.getElementById('list');list.className='list czw czs';window.scrollTo(0,0);return list}
  function bar(title,right){return'<header class="czs-bar"><button type="button" data-back aria-label="뒤로">'+img(ICON.back,'')+'</button><strong>'+esc(title)+'</strong><span>'+(right||'')+'</span></header>'}
  var LABEL={f_brand:'제조사',f_model:'모델',f_trim:'세부 모델',f_body:'차종',f_fuel:'연료',f_price:'가격',f_origin:'브랜드 속성',f_country:'국가',f_age:'고장 발생 시기',f_quality:'품질 문제',f_service:'서비스 문제',f_other:'기타 문제'};
  function chipsHtml(o,forRank){var out=[];if(o.f_from||o.f_to)out.push('<button type="button" class="czs-chip" data-drop="f_from,f_to">'+esc((o.f_from||'처음')+' ~ '+(o.f_to||'오늘'))+'<span>×</span></button>');Object.keys(LABEL).forEach(function(k){vals(o,k).forEach(function(v){out.push('<button type="button" class="czs-chip" data-drop="'+k+'" data-value="'+esc(v)+'">'+esc(v)+'<span>×</span></button>')})});if(forRank&&o.f_sales)out.push('<button type="button" class="czs-chip" data-drop="f_sales">월 판매 '+Number(o.f_sales).toLocaleString('ko-KR')+'대 이상<span>×</span></button>');return out.join('')}
  function bindChips(root){[].forEach.call(root.querySelectorAll('[data-drop]'),function(b){b.onclick=function(e){e.stopPropagation();var u=new URL(location.href);b.dataset.drop.split(',').forEach(function(k){if(b.dataset.value===undefined){u.searchParams.delete(k);return}var rest=(u.searchParams.get(k)||'').split(',').filter(function(v){return v&&v!==b.dataset.value});if(rest.length)u.searchParams.set(k,rest.join(','));else u.searchParams.delete(k)});location.href=u.pathname+'?'+u.searchParams.toString()}})}

  /* ── 필터 ───────────────────────────────────────── */
  function renderFilter(){var forRank=q().get('for')==='rank',list=phone('chezhiwangComplaintFilter'),rows=allRows(),draft={};KEYS.forEach(function(k){draft[k]=vals(current(),k)});
    var c=cats();var groups=forRank?[
      ['기간','date'],['가격','f_price',['2천만원 이하','2~3천만원','3~4천만원','4~5천만원','5~7천만원','7천만원~1억','1억 이상']],['차종','f_body',['세단','SUV','MPV','스포츠카','경차','픽업','기타']],['연료','f_fuel',['가솔린','디젤','하이브리드','플러그인 하이브리드','전기','LPG','수소']],['브랜드 속성','f_origin',['국산','수입']],['국가','f_country',['한국','독일','미국','일본','프랑스','스웨덴','영국','이탈리아','기타']],['품질 문제','f_quality',c['품질']],['서비스 문제','f_service',c['서비스']]
    ]:[
      ['제조사','f_brand',null],['모델','f_model',null],['세부 모델','f_trim',null],['기간','date'],['차종','f_body',['세단','SUV','MPV','스포츠카','경차','픽업','기타']],['연료','f_fuel',['가솔린','디젤','하이브리드','플러그인 하이브리드','전기','LPG','수소']],['고장 발생 시기','f_age',['1개월 이내','1~3개월','3~6개월','6~12개월','1~3년','3년 이상']],['품질 문제','f_quality',c['품질']],['서비스 문제','f_service',c['서비스']],['기타 문제','f_other',c['기타']]
    ];
    function dyn(k){var b=draft.f_brand,m=draft.f_model;if(k==='f_brand')return uniq(rows.map(function(r){return r.brand}));if(k==='f_model')return uniq(rows.filter(function(r){return!b.length||b.indexOf(r.brand)>-1}).map(function(r){return r.model}));return uniq(rows.filter(function(r){return(!b.length||b.indexOf(r.brand)>-1)&&(!m.length||m.indexOf(r.model)>-1)}).map(function(r){return r.trim}))}
    function count(){var o={};KEYS.forEach(function(k){if(draft[k].length)o[k]=draft[k].join(',')});return rows.filter(function(r){return match(r,o)}).length}
    function section(g,i){if(g[1]==='date')return'<section id="czs-f'+i+'"><h3>'+g[0]+'</h3><div class="czs-dates"><input type="date" data-date="f_from" value="'+esc(draft.f_from[0]||'')+'" aria-label="시작일"><span>~</span><input type="date" data-date="f_to" value="'+esc(draft.f_to[0]||'')+'" aria-label="종료일"></div></section>';var list=g[2]||dyn(g[1]);return'<section id="czs-f'+i+'"><h3>'+g[0]+'</h3><div class="czs-fchips">'+(list.length?list.map(function(v){return'<button type="button" class="czs-fchip'+(draft[g[1]].indexOf(v)>-1?' on':'')+'" data-key="'+g[1]+'" data-value="'+esc(v)+'">'+esc(v)+'</button>'}).join(''):'<p class="czs-note">'+(g[1]==='f_trim'?'모델을 먼저 고르세요':'선택할 항목이 없습니다')+'</p>')+'</div></section>'}
    list.innerHTML='<section class="czs-filter">'+bar('필터')+'<div class="czs-fwrap"><nav class="czs-fnav">'+groups.map(function(g,i){return'<button type="button" data-jump="'+i+'"'+(i?'':' class="on"')+'>'+g[0]+'</button>'}).join('')+'</nav><div class="czs-fbody"></div></div><footer class="czs-factions"><button type="button" data-reset>초기화</button><button type="button" data-apply>확인</button></footer></section>';
    var body=list.querySelector('.czs-fbody');
    function paint(){var y=body.scrollTop;body.innerHTML=groups.map(section).join('');body.scrollTop=y;list.querySelector('[data-apply]').textContent=forRank?'확인':count()+'건 보기';list.querySelector('[data-reset]').disabled=!KEYS.some(function(k){return draft[k].length});
      [].forEach.call(body.querySelectorAll('.czs-fchip'),function(b){b.onclick=function(){var arr=draft[b.dataset.key],i=arr.indexOf(b.dataset.value);if(i>-1)arr.splice(i,1);else arr.push(b.dataset.value);if(b.dataset.key==='f_brand'){draft.f_model=draft.f_model.filter(function(v){return dyn('f_model').indexOf(v)>-1})}if(b.dataset.key!=='f_trim'){draft.f_trim=draft.f_trim.filter(function(v){return dyn('f_trim').indexOf(v)>-1})}paint()}});
      [].forEach.call(body.querySelectorAll('[data-date]'),function(inp){inp.onchange=function(){draft[inp.dataset.date]=inp.value?[inp.value]:[];paint()}})}
    paint();
    list.querySelector('[data-back]').onclick=function(){history.length>1?history.back():location.href=href(Object.assign(current(),forRank?{czw:'rank'}:{}))};
    [].forEach.call(list.querySelectorAll('[data-jump]'),function(b){b.onclick=function(){var t=body.querySelector('#czs-f'+b.dataset.jump);body.scrollTo({top:t.offsetTop-body.offsetTop,behavior:'smooth'})}});
    body.addEventListener('scroll',function(){var cur=0;[].forEach.call(body.querySelectorAll('section'),function(sec,i){if(sec.offsetTop-body.offsetTop-10<=body.scrollTop)cur=i});[].forEach.call(list.querySelectorAll('[data-jump]'),function(x){x.classList.toggle('on',Number(x.dataset.jump)===cur)})});
    list.querySelector('[data-reset]').onclick=function(){KEYS.forEach(function(k){if(k!=='f_sales')draft[k]=[]});paint()};
    list.querySelector('[data-apply]').onclick=function(){var p=forRank?{czw:'rank',rank:q().get('rank')||''}:{};KEYS.forEach(function(k){if(draft[k].length)p[k]=draft[k].join(',')});location.href=href(p)}}

  /* ── 순위 ───────────────────────────────────────── */
  function rankNo(arr,key){var prev=null,rank=0;return arr.map(function(x,i){if(prev===null||x[key]!==prev)rank=i+1;prev=x[key];x.rank=rank;return x})}
  function badge(n){return'<b class="czs-rank r'+(n<=3?n:'n')+'">'+n+'</b>'}
  function renderRank(){var list=phone('chezhiwangComplaintRank'),tab=q().get('rank')||'count',o=current();if(tab==='ratio'&&!o.f_sales)o.f_sales='1000';
    var rows=allRows().filter(function(r){return match(r,o)}),by={};
    rows.forEach(function(r){var k=r.brand+'|'+r.model,x=by[k]=by[k]||{brand:r.brand,model:r.model,body:r.bodyType||'',img:r.thumbnail,sales:Number(r.monthlySales||0),n:0,pairs:{}};x.n++;(r.problems||[]).forEach(function(p){var key=p[0]+'|'+p[1];x.pairs[key]=(x.pairs[key]||0)+1})});
    var arr=Object.keys(by).map(function(k){var x=by[k];x.ratio=x.sales?Math.round(x.n/x.sales*10000*10)/10:0;return x});
    if(tab==='sales')arr=rankNo(arr.sort(function(a,b){return b.sales-a.sales}),'sales');
    else if(tab==='ratio')arr=rankNo(arr.filter(function(x){return x.sales>=Number(o.f_sales)}).sort(function(a,b){return a.ratio-b.ratio}),'ratio');
    else arr=rankNo(arr.sort(function(a,b){return b.n-a.n}),'n');
    var tabs=[['count','불만 순위'],['sales','판매량 순위'],['ratio','불만·판매 비율 순위']].map(function(t){return'<a class="'+(tab===t[0]?'on':'')+'" href="'+esc(href(Object.assign(current(),{czw:'rank',rank:t[0]==='count'?'':t[0]})))+'">'+t[1]+'</a>'}).join('');
    var from=o.f_from||'2026-09-18',to=o.f_to||'2026-10-17';
    var head='<div class="czs-rank-head"><div class="czs-chips"><span class="czs-period">'+esc(from.replace(/-/g,'.')+' ~ '+to.replace(/-/g,'.'))+'</span>'+chipsHtml(Object.assign({},o,{f_from:'',f_to:''}),true)+'</div><a href="'+esc(href(Object.assign(current(),{czw:'filter',for:'rank',rank:tab==='count'?'':tab})))+'">'+img(ICON.filter,'')+'필터</a></div><p class="czs-rank-sub">'+(tab==='ratio'?'만 대당 불만 건수 · 수치가 작을수록 좋습니다 · 판매량은 시안용 가상 값':tab==='sales'?'월 판매량 · 시안용 가상 값':'결함·불만 실시간 집계')+'</p>';
    var body=arr.length?arr.map(function(x){var pairs=Object.keys(x.pairs).sort(function(a,b){return x.pairs[b]-x.pairs[a]}).map(function(k){return k.split('|')});var val=tab==='sales'?'<em><b>'+x.sales.toLocaleString('ko-KR')+'</b>판매량(대)</em>':tab==='ratio'?'<em><b><small>만 대당</small> '+x.ratio.toFixed(1)+'</b>불만·판매 비율</em>':'<em><b>'+x.n+'</b>건수(건)</em>';
      return'<article class="czs-rank-row">'+badge(x.rank)+'<a class="czs-rank-car" href="'+esc(href({f_model:x.model}))+'">'+img(x.img,x.model)+'<span><b>'+esc(x.model)+'</b><small>'+esc(x.brand+' / '+x.body)+'</small></span>'+val+'</a>'+(tab==='count'&&pairs.length?'<div class="czs-typical"><button type="button" class="czs-typical-head" aria-expanded="false"><b>대표 문제</b>'+img(ICON.chevron,'','czs-chev')+'</button><div class="czw-pairs">'+pairs.map(pairHtml).join('')+'</div></div>':'')+'</article>'}).join(''):'<p class="czs-empty">조건에 맞는 차량이 없습니다</p>';
    list.innerHTML='<section class="czs-rankpage">'+bar('순위','<button type="button" data-share aria-label="공유">'+img(ICON.share,'')+'</button>')+'<nav class="czs-tabs">'+tabs+'</nav>'+head+'<div class="czs-rank-list">'+body+'</div><button type="button" class="czs-make" data-make>순위표<br>만들기</button></section>';
    list.querySelector('[data-back]').onclick=function(){location.href=href({})};
    list.querySelector('[data-share]').onclick=function(){if(navigator.clipboard)navigator.clipboard.writeText(location.href);toast('순위 링크를 복사했습니다')};
    list.querySelector('[data-make]').onclick=function(){toast('순위표 이미지 만들기는 다음 단계에서 연결합니다')};
    [].forEach.call(list.querySelectorAll('.czs-typical-head'),function(b){b.onclick=function(){var open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));b.parentNode.classList.toggle('open',open)}});
    bindChips(list)}

  /* ── 목록: 진입 카드·탭(불만 목록/불만 영상/업체 불만)·필터 줄·순위·검색 ───────────── */
  function bizCard(b){return'<article class="czw-card czs-biz" data-id="'+esc(b.complaintId)+'"><a class="czw-main" href="'+esc(href({czw:b.complaintId}))+'"><h2>'+esc(b.title)+(b.hasPhoto?'<span class="czw-mark is-photo" aria-label="사진 첨부"></span>':'')+'</h2><p class="czw-trimline">'+esc(b.businessType+' · '+b.businessName)+'</p><div class="czw-typical"><b>대표 문제</b><div class="czw-pairs">'+b.problems.map(pairHtml).join('')+'</div></div><footer class="czw-meta"><span>'+img(ICON.chat,'')+Number(b.comments||0)+'</span><span>'+img(ICON.like,'')+Number(b.likes||0)+'</span><time>'+esc(String(b.publishedAt).slice(0,10))+'</time></footer></a></article>'}
  function enhanceList(){var list=document.getElementById('list');if(!list||!list.querySelector('.czw-list'))return;var o=current(),tab=q().get('czwtab')||'';
    var right=list.querySelector('.czw-bar>:last-child');if(right&&!list.querySelector('.czs-bar-links')){var box=document.createElement('span');box.className='czs-bar-links';box.innerHTML='<a class="czs-rank-link" href="'+esc(href({czw:'rank'}))+'">순위</a><a class="czs-search-link" href="'+esc(href({czw:'search'}))+'" aria-label="검색">'+img(ICON.search,'')+'</a>';right.replaceWith(box)}
    var hero=list.querySelector('.czw-hero');if(hero&&!list.querySelector('.czs-entry')){var en=document.createElement('nav');en.className='czs-entry';en.innerHTML='<a class="is-legal" href="'+esc(href({czw:'legal'}))+'"><b>법률 상담</b><small>LEGAL ADVICE</small></a><a class="is-official" href="'+esc(href({czw:'official'}))+'"><b>공식 발표</b><small>OFFICIAL</small></a><a class="is-news" href="'+esc(href({czw:'news'}))+'"><b>해결 소식</b><small>RESOLVED</small></a>';hero.after(en)}
    var tabs=list.querySelector('.czw-tabs');if(tabs&&!tabs.classList.contains('czs-done')){tabs.classList.add('czs-done');tabs.innerHTML=[['','불만 목록'],['video','불만 영상'],['biz','업체 불만']].map(function(t){return'<a class="'+(tab===t[0]?'on':'')+'" href="'+esc(href(Object.assign(current(),{czwtab:t[0]})))+'">'+t[1]+'</a>'}).join('')}
    if(tabs&&!list.querySelector('.czs-filterbar')){var fb=document.createElement('div');fb.className='czs-filterbar';fb.innerHTML='<div class="czs-chips">'+chipsHtml(o,false)+'</div><a href="'+esc(href(Object.assign({},o,{czw:'filter',czwtab:tab})))+'">'+img(ICON.filter,'')+'필터</a>';tabs.after(fb);bindChips(fb)}
    var shown=0;[].forEach.call(list.querySelectorAll('.czw-card:not(.czs-biz)'),function(cardEl){var r=allRows().find(function(x){return String(x.complaintId||x.id)===cardEl.dataset.id});var ok=tab!=='biz'&&(!r||(match(r,current())&&(tab!=='video'||r.hasVideo)));cardEl.hidden=!ok;if(ok)shown++});
    if(tab==='biz'&&!list.querySelector('.czs-biz')){var anchor=list.querySelector('.czs-filterbar');var biz=(T().businesses||[]).filter(function(b){return match(Object.assign({},b),current())});anchor.insertAdjacentHTML('afterend',biz.map(bizCard).join(''));shown=biz.length}
    if(!shown&&!list.querySelector('.czs-empty')){var e=document.createElement('p');e.className='czs-empty';e.textContent='조건에 맞는 결함·불만이 없습니다';list.querySelector('.czs-filterbar').after(e)}}

  /* ── 상세 보강: 차량 카드·해결 소식 ───────────── */
  function newsRows(brand){var all=T().news||[],pick=all.filter(function(n){return n[3]===brand});return(pick.length?pick:all).slice(0,3)}
  function newsHtml(brand){return'<section class="czs-sec"><div class="czs-sec-head"><h2>해결 소식</h2><a href="'+esc(href({czw:'news'}))+'">소식 올리기 '+img(ICON.right,'','czs-chev-r')+'</a></div>'+newsRows(brand).map(function(n){return'<a class="czs-news-row" href="'+esc(href({czw:'news-'+(T().news||[]).indexOf(n)}))+'"><b>'+esc(n[1])+'</b><span><i>해결 소식</i><time>'+esc(n[5])+'</time></span></a>'}).join('')+'</section>'}
  function enhanceDetail(id){var list=document.getElementById('list'),r=allRows().find(function(x){return String(x.complaintId||x.id)===id});if(!list||!r||list.querySelector('.czs-carcard'))return;
    var content=list.querySelector('.czw-content');if(!content)return;
    var car='<a class="czs-carcard" href="'+esc(href({f_model:r.model}))+'">'+img(r.thumbnail,r.model)+'<span><b>'+esc(r.model)+'</b><small>'+esc(r.brand+' / '+(r.bodyType||''))+'</small><small>연료: '+esc(r.fuel||'-')+'</small><small>가격대: <em>'+esc(r.priceBand||'-')+'</em></small></span></a>';
    content.insertAdjacentHTML('beforeend',car);var anchor=list.querySelector('.czw-related')||list.querySelector('.czw-comments');if(anchor)anchor.insertAdjacentHTML('beforebegin',newsHtml(r.brand))}

  /* ── 업체 불만 상세 ───────────── */
  function renderBiz(id){var b=(T().businesses||[]).find(function(x){return x.complaintId===id});if(!b)return false;var list=phone('chezhiwangComplaintDetail');
    var same=(T().businesses||[]).filter(function(x){return x!==b}).slice(0,4);
    list.innerHTML='<article class="czs-page">'+bar('불만 상세')+'<section class="czs-main"><h1>'+esc(b.title)+'</h1><dl class="czw-infobox"><div><dt>업체 유형</dt><dd>'+esc(b.businessType)+'</dd></div><div><dt>업체</dt><dd>'+esc(b.businessName)+'</dd></div><div><dt>등록 시각</dt><dd>'+esc(String(b.publishedAt).slice(0,16).replace('T',' '))+'</dd></div></dl><div class="czw-typical"><b>대표 문제</b><div class="czw-pairs">'+b.problems.map(pairHtml).join('')+'</div></div><p class="czs-body">'+esc(b.body)+'</p><p class="czs-private">업체명은 가림 처리했습니다. 연락처·계약서 원본은 공개되지 않습니다.</p></section><section class="czs-sec"><div class="czs-sec-head"><h2>다른 업체 불만</h2></div>'+same.map(function(x){return'<a class="czs-news-row" href="'+esc(href({czw:x.complaintId}))+'"><b>'+esc(x.title)+'</b><span><em>'+esc(x.businessType+' · '+x.businessName)+'</em><time>'+esc(String(x.publishedAt).slice(0,10))+'</time></span></a>'}).join('')+'</section></article>';
    list.querySelector('[data-back]').onclick=function(){location.href=href({czwtab:'biz'})};return true}

  /* ── 검색 ───────────── */
  function renderSearch(){var list=phone('chezhiwangComplaintSearch'),term=q().get('qs')||'',key='bobae-chezhiwang-search-v1',hist=[];try{hist=JSON.parse(localStorage.getItem(key)||'[]')||[]}catch(e){}
    var res=term?allRows().concat(T().businesses||[]).filter(function(r){return[r.brand,r.model,r.trim,r.title,r.businessName,(r.problems||[]).map(function(p){return p.join(' ')}).join(' ')].join(' ').toLowerCase().indexOf(term.toLowerCase())>-1}):[];
    list.innerHTML='<section class="czs-page">'+'<header class="czs-bar is-search"><button type="button" data-back aria-label="뒤로">'+img(ICON.back,'')+'</button><label class="czs-sbox">'+img(ICON.search,'')+'<input type="search" value="'+esc(term)+'" placeholder="모델·증상·업체로 검색" aria-label="검색어"></label><button type="button" class="czs-go" data-go>검색</button></header>'+
      (term?'<p class="czs-rank-sub">검색 결과 <b>'+res.length+'</b>건</p>'+(res.length?res.map(function(r){return'<a class="czs-result" href="'+esc(href({czw:r.complaintId||r.id}))+'"><b>'+esc((r.kind==='business'?'':[r.brand,r.model].join(' ')+' ')+r.title)+'</b><span>'+esc(r.kind==='business'?r.businessType+' · '+r.businessName:[r.brand,r.model,r.trim].join(' / '))+'</span><div class="czw-pairs">'+(r.problems||[]).map(pairHtml).join('')+'</div></a>'}).join(''):'<p class="czs-empty">검색 결과가 없습니다</p>'):
      '<div class="czs-history"><div class="czs-sec-head"><h2>검색 기록</h2>'+(hist.length?'<button type="button" data-clear aria-label="검색 기록 전체 삭제">'+img(ICON.del,'')+'</button>':'')+'</div><div class="czs-hchips">'+(hist.length?hist.map(function(h){return'<a href="'+esc(href({czw:'search',qs:h}))+'">'+esc(h)+'</a>'}).join(''):'<p class="czs-note">최근 검색어가 없습니다</p>')+'</div></div>')+'</section>';
    var input=list.querySelector('input');if(!term)setTimeout(function(){input.focus()},50);
    function run(){var v=input.value.trim();if(!v)return;hist=hist.filter(function(x){return x!==v});hist.unshift(v);try{localStorage.setItem(key,JSON.stringify(hist.slice(0,10)))}catch(e){}location.href=href({czw:'search',qs:v})}
    list.querySelector('[data-go]').onclick=run;input.onkeydown=function(e){if(e.key==='Enter')run()};list.querySelector('[data-back]').onclick=function(){location.href=href({})};var c=list.querySelector('[data-clear]');if(c)c.onclick=function(){try{localStorage.setItem(key,'[]')}catch(e){}renderSearch()}}

  /* ── 해결 소식·공식 발표·법률 상담 ───────────── */
  function renderNews(){var list=phone('chezhiwangComplaintNews'),news=T().news||[];
    list.innerHTML='<section class="czs-page">'+bar('해결 소식','<a href="'+esc(href({czw:'search'}))+'" aria-label="검색">'+img(ICON.search,'')+'</a>')+'<p class="czs-rank-sub">결함·불만을 공개한 뒤 어떻게 해결됐는지 작성자가 직접 남긴 소식입니다.</p>'+news.map(function(n,i){return'<a class="czs-news-item" href="'+esc(href({czw:'news-'+i}))+'"><span class="czs-who"><span class="czs-avatar">'+esc(n[0].slice(0,1))+'</span>'+esc(n[0])+'</span><b>'+esc(n[1])+'</b><span class="czs-news-meta"><time>'+esc(n[5])+'</time><span>조회 '+n[6]+'</span><span>댓글 '+n[7]+'</span></span></a>'}).join('')+'<div class="czs-bottom"><button type="button" data-post>+ 소식 올리기</button></div></section>';
    list.querySelector('[data-back]').onclick=function(){location.href=href({})};list.querySelector('[data-post]').onclick=function(){toast('해결 소식 작성은 다음 단계에서 연결합니다')}}
  function renderNewsDetail(i){var n=(T().news||[])[i];if(!n)return renderNews();var list=phone('chezhiwangComplaintNews');
    list.innerHTML='<article class="czs-page">'+bar('해결 소식')+'<section class="czs-main"><h1>'+esc(n[1])+'</h1><div class="czs-who is-big"><span class="czs-avatar">'+esc(n[0].slice(0,1))+'</span><span><b>'+esc(n[0])+' <i>작성자</i></b><small>'+esc(n[5])+'</small></span></div><p class="czs-body">'+esc(n[2])+'</p><a class="czs-more" href="'+esc(href({f_model:n[4]}))+'">'+esc(n[3]+' '+n[4])+' 결함·불만 모아 보기 '+img(ICON.right,'','czs-chev-r')+'</a></section><section class="czs-sec"><div class="czs-sec-head"><h2>전체 댓글</h2></div><p class="czs-empty">아직 댓글이 없습니다</p></section></article>';
    list.querySelector('[data-back]').onclick=function(){location.href=href({czw:'news'})}}
  function renderOfficial(){var list=phone('chezhiwangComplaintNews');
    list.innerHTML='<section class="czs-page">'+bar('공식 발표')+(T().official||[]).map(function(o){return'<article class="czs-official"><b>'+esc(o[1])+'</b><p>'+esc(o[2])+'</p><span><i>'+esc(o[0])+'</i><time>'+esc(o[3])+'</time></span></article>'}).join('')+'<p class="czs-rank-sub">제조사·기관의 공식 입장은 확인되는 대로 이곳에 모읍니다.</p></section>';
    list.querySelector('[data-back]').onclick=function(){location.href=href({})}}
  function renderLegal(){var list=phone('chezhiwangComplaintNews');
    list.innerHTML='<section class="czs-page">'+bar('법률 상담')+'<div class="czs-legal-hero"><b>보배드림 &amp; 제휴 법률사무소</b><small>차량 분쟁 상담 연결 · 제휴 준비 중</small></div><section class="czs-main"><h2 class="czs-legal-h">상담 가능 분야</h2><div class="czs-hchips">'+['신차 결함·교환·환불','중고차 허위·누락 고지','정비 과실·수리비','리스·렌트 계약','보험 처리 분쟁'].map(function(v){return'<a>'+esc(v)+'</a>'}).join('')+'</div><h2 class="czs-legal-h">먼저 이용할 수 있는 곳</h2><ul class="czs-legal-list"><li><b>1372 소비자상담센터</b><span>한국소비자원 피해구제·분쟁조정 안내</span></li><li><b>자동차리콜센터</b><span>국토교통부 리콜 대상 조회·결함 신고</span></li></ul><p class="czs-private">제휴 변호사 정보와 상담 신청은 제휴가 확정되면 공개합니다.</p></section></section>';
    list.querySelector('[data-back]').onclick=function(){location.href=href({})}}

  function render(arg){var id=q().get('czw')||'';if(id==='rank')return renderRank();if(id==='filter')return renderFilter();if(id==='search')return renderSearch();if(id==='news')return renderNews();if(/^news-\d+$/.test(id))return renderNewsDetail(Number(id.slice(5)));if(id==='official')return renderOfficial();if(id==='legal')return renderLegal();if(/^czw-b/.test(id)&&renderBiz(id))return;previous(arg);if(!id)enhanceList();else if(id!=='write')enhanceDetail(id)}
  window.renderChezhiwangComplaintBoardTable=render;
})();
