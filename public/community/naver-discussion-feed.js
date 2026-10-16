(function(){
  'use strict';

  var state={section:'추천',room:'전체',keyword:'',sort:'추천순'};
  var roomDefinitions=[
    {name:'전체',caption:'전체 토론'},
    {name:'자유',caption:'자유로운 이야기',boardId:'free'},
    {name:'자동차',caption:'오늘 자동차 이슈',boardId:'car-news'},
    {name:'중고차',caption:'매물과 구매 정보',boardId:'import-car'},
    {name:'바이크',caption:'라이더 이야기',boardId:'bike-cycle'}
  ];
  var keywords=['전기차','테슬라','중고차','정비','블박','보험','튜닝','바이크'];
  var bodyFallbacks=[
    '직접 확인한 내용과 사용하면서 느낀 점을 공유합니다. 같은 경험이 있는 분들의 의견도 궁금합니다.',
    '구매를 고민하면서 비교한 내용을 정리했습니다. 실제 사용자 분들은 어떤 기준으로 선택하셨나요?',
    '정비 후 달라진 부분을 기록합니다. 작업 시간과 비용은 본문에서 함께 확인할 수 있습니다.',
    '주행하면서 발견한 특징입니다. 비슷한 증상이 있었던 분들은 해결 방법을 알려주세요.',
    '사진으로 보던 것과 실제 느낌이 달라 간단히 후기를 남깁니다.'
  ];
  var list=document.getElementById('list');
  var phone=document.querySelector('.phone');
  var typeLabel=document.getElementById('typeLabel');

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});
  }
  function posts(){return (window.BOBAE_POSTS||[]).slice();}
  function cleanTitle(value){return String(value||'').replace(/^\[[^\]]+\]\s*/,'');}
  function bodyFor(post,index){return Array.isArray(post.body)&&post.body.length?post.body[0]:bodyFallbacks[index%bodyFallbacks.length];}
  function avatarFor(post,index){return post.authorAvatar||'assets/profile-avatars/avatar-'+String(index%20+1).padStart(2,'0')+'.svg';}
  function detailUrl(post){return './chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261016naverdiscussion1';}
  function icon(name){return 'assets/chzzk-detail/icons/'+name+'.svg?v=20261016naverdiscussion1';}
  function uiIcon(name){return 'assets/reddit-ui/'+name+'.svg?v=20261016naverdiscussion1';}
  function roomAvatar(definition){
    if(!definition.boardId||!window.BBMCommunityBoardNavigation)return 'assets/free-board-avatar.png';
    var board=window.BBMCommunityBoardNavigation.catalog.find(function(item){return item.id===definition.boardId;});
    return board?window.BBMCommunityBoardNavigation.avatarSrc(board):'assets/free-board-avatar.png';
  }
  function categoryFor(post){return post.category||String(post.title||'').match(/^\[([^\]]+)\]/)?.[1]||'자유';}
  function metric(value){
    var number=Math.max(0,Number(value)||0);
    if(number>=10000){var man=Math.floor(number/1000)/10;return (man%1===0?String(man):man.toFixed(1))+'만';}
    if(number>=1000){var thousand=Math.floor(number/100)/10;return (thousand%1===0?String(thousand):thousand.toFixed(1))+'천';}
    return String(number);
  }
  function roomMatches(post){
    if(state.room==='전체')return true;
    var value=(categoryFor(post)+' '+post.title).toLowerCase();
    var terms={자유:[],자동차:['자동차','전기차','테슬라','정비','튜닝','블박'],중고차:['중고차','보험'],바이크:['바이크','오토바이']}[state.room]||[state.room];
    return !terms.length||terms.some(function(term){return value.indexOf(term.toLowerCase())>-1;});
  }
  function filteredPosts(){
    var data=posts().filter(roomMatches);
    if(state.keyword)data=data.filter(function(post){return (categoryFor(post)+' '+post.title+' '+bodyFor(post,0)).indexOf(state.keyword)>-1;});
    if(state.section==='HOT'||state.sort==='추천순')data.sort(function(a,b){return Number(b.reply||0)+Number(b.view||0)/50-(Number(a.reply||0)+Number(a.view||0)/50);});
    if(state.sort==='최신순')data.sort(function(a,b){return Number(a.id)-Number(b.id);});
    if(state.sort==='댓글순')data.sort(function(a,b){return Number(b.reply||0)-Number(a.reply||0);});
    if(state.sort==='조회순')data.sort(function(a,b){return Number(b.view||0)-Number(a.view||0);});
    return data;
  }
  function topTabs(){
    return '<div class="naverDiscussionTabs" role="tablist" aria-label="피드 구분">'+['추천','HOT','팔로잉','MY'].map(function(label){return '<button class="naverDiscussionTab '+(state.section===label?'on':'')+'" type="button" role="tab" aria-selected="'+(state.section===label)+'" data-discussion-section="'+label+'">'+label+'</button>';}).join('')+'</div>';
  }
  function rooms(){
    return '<div class="naverDiscussionRooms" aria-label="토론방 선택">'+roomDefinitions.map(function(room){var first=room.name==='전체';return '<button class="naverDiscussionRoom '+(state.room===room.name?'on':'')+'" type="button" data-discussion-room="'+room.name+'" aria-pressed="'+(state.room===room.name)+'">'+(first?'':'<img src="'+esc(roomAvatar(room))+'" alt="">')+'<span class="naverDiscussionRoomCopy"><strong>'+(first?'전체 토론방':esc(room.name)+' 토론방')+'</strong>'+(first?'':'<span>'+esc(room.caption)+'</span>')+'</span></button>';}).join('')+'</div>';
  }
  function keywordArea(){
    return '<section class="naverDiscussionKeywordArea" aria-labelledby="naverDiscussionKeywordTitle"><h2 class="naverDiscussionSectionTitle" id="naverDiscussionKeywordTitle">실시간 키워드 <span class="naverDiscussionLiveDot" aria-hidden="true"></span><span class="naverDiscussionInfo" aria-hidden="true">i</span></h2><div class="naverDiscussionKeywords">'+keywords.map(function(keyword){return '<button class="naverDiscussionKeyword '+(state.keyword===keyword?'on':'')+'" type="button" data-discussion-keyword="'+keyword+'" aria-pressed="'+(state.keyword===keyword)+'">'+keyword+'</button>';}).join('')+'</div></section>';
  }
  function sortRow(){
    return '<div class="naverDiscussionSortRow"><button class="naverDiscussionSort" type="button" aria-expanded="false" aria-controls="naverDiscussionSortMenu">'+state.sort+'<img src="'+uiIcon('chevron-down')+'" alt=""></button><div class="naverDiscussionSortMenu" id="naverDiscussionSortMenu" role="menu" hidden>'+['추천순','최신순','댓글순','조회순'].map(function(sort){return '<button class="naverDiscussionSortChoice '+(state.sort===sort?'on':'')+'" type="button" role="menuitemradio" aria-checked="'+(state.sort===sort)+'" data-discussion-sort="'+sort+'">'+sort+'</button>';}).join('')+'</div></div>';
  }
  function cleanbot(){return '<div class="naverDiscussionCleanbot"><img src="assets/chotot-default-avatar.svg" alt=""><span><strong>클린봇</strong>이 악성게시글을 감지합니다.</span><button type="button" data-cleanbot-settings><img src="'+icon('settings')+'" alt="">설정</button></div>';}
  function mediaFor(post){if(!post.detailImage)return '';return '<a class="naverDiscussionMedia" href="'+detailUrl(post)+'" aria-label="'+esc(cleanTitle(post.title))+' 이미지와 상세 보기"><img src="'+esc(post.detailImage)+'" alt="" loading="lazy"></a>';}
  function card(post,index){
    var likes=Math.max(0,Math.round(Number(post.view||0)/23)+Number(post.reply||0));
    var dislikes=Math.max(0,Math.round(Number(post.reply||0)/7));
    return '<article class="naverDiscussionCard" data-discussion-post="'+esc(post.id)+'"><span class="naverDiscussionCategory">'+esc(categoryFor(post))+'</span><div class="naverDiscussionIdentity"><img class="naverDiscussionAvatar" src="'+esc(avatarFor(post,index))+'" alt="'+esc(post.user)+' 프로필"><strong class="naverDiscussionAuthor">'+esc(post.user)+'</strong><time class="naverDiscussionTime">'+esc(post.time)+'</time></div><a class="naverDiscussionTitle" href="'+detailUrl(post)+'">'+esc(cleanTitle(post.title))+'</a><p class="naverDiscussionBody">'+esc(bodyFor(post,index))+'</p>'+mediaFor(post)+'<div class="naverDiscussionMetrics" aria-label="게시물 반응"><button class="naverDiscussionMetric" type="button" data-discussion-vote="up" aria-pressed="false"><img src="'+icon('buff')+'" alt="">버프 <span>'+metric(likes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-vote="down" aria-pressed="false"><img src="'+icon('nerf')+'" alt="">너프 <span>'+metric(dislikes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-comment="'+esc(post.id)+'" aria-label="댓글 '+Number(post.reply||0).toLocaleString('ko-KR')+'개"><img src="'+icon('comment-reddit')+'" alt="">'+metric(post.reply)+'</button><span class="naverDiscussionViews">조회 '+Number(post.view||0).toLocaleString('ko-KR')+'</span></div></article>';
  }
  function hotModule(data){
    var hot=data.slice().sort(function(a,b){return Number(b.reply||0)-Number(a.reply||0);}).slice(0,3);
    if(!hot.length)return '';
    return '<aside class="naverDiscussionHot" aria-labelledby="naverDiscussionHotTitle"><div class="naverDiscussionHotHead"><strong id="naverDiscussionHotTitle">지금 뜨는 토론</strong><span>댓글 많은 글</span></div><div class="naverDiscussionHotRail">'+hot.map(function(post,index){return '<button class="naverDiscussionHotCard" type="button" data-discussion-detail="'+esc(post.id)+'"><span class="naverDiscussionHotCardMeta"><img src="'+esc(avatarFor(post,index+4))+'" alt="">'+esc(post.user)+' · '+esc(post.time)+'</span><strong>'+esc(cleanTitle(post.title))+'</strong><p>'+esc(bodyFor(post,index))+'</p></button>';}).join('')+'</div></aside>';
  }
  function feedBody(){
    var data=filteredPosts();
    if(!data.length)return '<div style="padding:44px 16px;color:#858990;font-size:14px;text-align:center">선택한 조건의 토론이 없습니다.</div>';
    var first=data.slice(0,3).map(card).join('');
    var rest=data.slice(3).map(function(post,index){return card(post,index+3);}).join('');
    return first+hotModule(data)+rest;
  }
  function render(){
    phone.classList.remove('compactMode','feedCafeMode','redditFeedMode','chototFeedMode','chototBoardFeedMode','chototDealerFeedMode');
    phone.classList.add('naverDiscussionMode');
    typeLabel.textContent='네이버 토론형';
    list.className='list naverDiscussionList';
    list.innerHTML=topTabs()+rooms()+keywordArea()+sortRow()+cleanbot()+feedBody();
    bind();
  }
  function showToast(message){var toast=document.getElementById('toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');setTimeout(function(){toast.classList.remove('show');},1200);}
  function bind(){
    list.querySelectorAll('[data-discussion-section]').forEach(function(button){button.addEventListener('click',function(){state.section=button.dataset.discussionSection;render();});});
    list.querySelectorAll('[data-discussion-room]').forEach(function(button){button.addEventListener('click',function(){state.room=button.dataset.discussionRoom;state.keyword='';render();});});
    list.querySelectorAll('[data-discussion-keyword]').forEach(function(button){button.addEventListener('click',function(){state.keyword=state.keyword===button.dataset.discussionKeyword?'':button.dataset.discussionKeyword;render();});});
    var sortButton=list.querySelector('.naverDiscussionSort'),sortMenu=list.querySelector('.naverDiscussionSortMenu');
    sortButton?.addEventListener('click',function(){var opening=sortMenu.hidden;sortMenu.hidden=!opening;sortButton.setAttribute('aria-expanded',String(opening));});
    list.querySelectorAll('[data-discussion-sort]').forEach(function(button){button.addEventListener('click',function(){state.sort=button.dataset.discussionSort;render();});});
    list.querySelectorAll('[data-discussion-vote]').forEach(function(button){button.addEventListener('click',function(){var active=button.getAttribute('aria-pressed')==='true';var cardElement=button.closest('.naverDiscussionCard');cardElement.querySelectorAll('[data-discussion-vote]').forEach(function(other){other.classList.remove('is-active');other.setAttribute('aria-pressed','false');});if(!active){button.classList.add('is-active');button.setAttribute('aria-pressed','true');}});});
    list.querySelectorAll('[data-discussion-comment]').forEach(function(button){button.addEventListener('click',function(){location.href='./chzzk-detail.html?id='+encodeURIComponent(button.dataset.discussionComment)+'#comments';});});
    list.querySelectorAll('[data-discussion-detail]').forEach(function(button){button.addEventListener('click',function(){location.href='./chzzk-detail.html?id='+encodeURIComponent(button.dataset.discussionDetail)+'&v=20261016naverdiscussion1';});});
    list.querySelector('[data-cleanbot-settings]')?.addEventListener('click',function(){showToast('클린봇 설정은 상세 기능에서 연결됩니다.');});
  }

  window.renderNaverDiscussionFeed=render;
  if(new URLSearchParams(location.search).get('view')==='naver-discussion')render();
})();
