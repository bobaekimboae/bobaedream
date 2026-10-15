(function(){
  'use strict';

  var list=document.getElementById('list');
  var phone=document.querySelector('.phone');
  var typeLabel=document.getElementById('typeLabel');
  var avatarAssets=[
    'assets/chzzk-detail/author-avatar.png',
    'assets/chzzk-detail/comment-avatar.gif',
    'assets/chzzk-detail/default-user.png',
    'assets/chzzk-detail/chzzk-operator-avatar.png',
    'assets/chzzk-detail/comment-anonymous-avatar.png'
  ];
  var carAssets=Array.from({length:30},function(_,index){
    return '../assets/cars/supercar-sheet-v01/sc-'+String(index+1).padStart(3,'0')+'.jpg';
  });
  var ratios=['portrait','tall','square','landscape'];
  var layouts=[
    ['portrait','portrait','portrait','portrait','portrait','portrait'],
    ['tall','tall','tall','tall','tall'],
    ['portrait','square'],
    ['portrait','landscape','portrait'],
    ['portrait','portrait','portrait','portrait'],
    ['video'],
    ['landscape'],
    ['square'],
    ['portrait','tall','square','landscape','portrait'],
    []
  ];
  var bodyCopy=[
    '주말 모임에서 촬영한 차량들입니다. 사진마다 비율이 달라도 잘리지 않게 한 줄로 넘겨볼 수 있도록 정리했습니다.',
    '세로로 찍은 실내 사진과 외관 사진을 함께 올립니다. 실제 색감과 옵션 구성을 확인하실 분은 사진을 눌러 크게 보세요.',
    '정비 전후 사진을 비교해 봤습니다. 첫 사진은 작업 전이고 두 번째 사진은 출고 직후입니다.',
    '출퇴근하면서 일주일 타본 후기입니다. 승차감과 정숙성은 기대 이상이었고 연비도 함께 기록해 두었습니다.',
    '이번 행사에서 직접 본 신차입니다. 앞모습부터 실내까지 순서대로 넘기면 전체 구성이 자연스럽게 이어집니다.',
    '짧게 촬영한 주행 영상입니다. 재생 버튼을 누르면 전체 화면에서 바로 확인할 수 있습니다.',
    '오늘 출고한 차량 한 장 남깁니다. 인도 전에 광택과 실내 검수까지 마쳤습니다.',
    '동호회 스티커 시안을 공유합니다. 실제 부착 크기와 색상을 한 번 더 조정하려고 합니다.',
    '차량 구입을 고민하는 분들을 위해 외관, 휠, 실내, 트렁크 순서로 사진을 모았습니다. 여러 비율의 사진을 좌우로 넘겨 확인할 수 있습니다.',
    '요즘 중고차 매물을 볼 때 꼭 확인하는 항목을 정리했습니다. 성능기록부와 보험 이력, 이전비 항목은 계약 전에 다시 확인하세요.'
  ];
  var videoAssets=['media/car-driving-road-v01.mp4','media/car-sunset-drive-v01.mp4','media/car-desert-drone-v01.mp4'];
  var galleryItems=[];
  var galleryIndex=0;

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }

  function cleanTitle(value){
    return String(value||'').replace(/^\[[^\]]+\]\s*/, '');
  }

  function redditIcon(name){
    return 'assets/chzzk-detail/icons/'+name+'.svg?v=20261015chototfeed1';
  }

  function chototIcon(name){
    return '../icons/chotot/'+name+'.svg?v=20261015chototfeed1';
  }

  function postData(){
    var source=(window.BOBAE_POSTS&&window.BOBAE_POSTS.length?window.BOBAE_POSTS:window.posts)||[];
    return source.slice(0,10);
  }

  function itemSource(postIndex,itemIndex){
    return carAssets[(postIndex*3+itemIndex)%carAssets.length];
  }

  function mediaMarkup(post,index){
    var layout=layouts[index%layouts.length];
    if(!layout.length)return '';
    var cells=layout.map(function(ratio,itemIndex){
      if(ratio==='video'){
        var video=videoAssets[index%videoAssets.length];
        var poster=itemSource(index,itemIndex);
        return '<button class="chototMediaItem video" type="button" data-media-index="'+itemIndex+'" data-kind="video" data-src="'+esc(video)+'" data-ratio="portrait" aria-label="영상 크게 보기"><video muted playsinline preload="metadata" poster="'+esc(poster)+'"><source src="'+esc(video)+'" type="video/mp4"></video><img class="chototVideoPlay" src="'+chototIcon('chotot-common-video-play-white-bg')+'" alt=""></button>';
      }
      var source=itemSource(index,itemIndex);
      return '<button class="chototMediaItem" type="button" data-media-index="'+itemIndex+'" data-kind="image" data-src="'+esc(source)+'" data-ratio="'+ratio+'" aria-label="'+esc(cleanTitle(post.title))+' 사진 '+(itemIndex+1)+' 크게 보기"><img src="'+esc(source)+'" alt="'+esc(cleanTitle(post.title))+' 사진 '+(itemIndex+1)+'" loading="lazy"></button>';
    }).join('');
    return '<div class="chototMediaShell"><div class="chototMediaRail" aria-label="게시물 미디어, 좌우로 넘기기">'+cells+'</div><button class="chototRailArrow chototRailPrev" type="button" aria-label="이전 사진"><img src="'+chototIcon('chotot-list-detail-feed-prev-button')+'" alt=""></button><button class="chototRailArrow chototRailNext" type="button" aria-label="다음 사진"><img src="'+chototIcon('chotot-list-detail-feed-next-button')+'" alt=""></button>'+(layout.length>1?'<span class="chototMediaCount">1 / '+layout.length+'</span>':'')+'</div>';
  }

  function card(post,index){
    var title=cleanTitle(post.title);
    var score=(Number(post.id||index+1)*7)%46+3;
    return [
      '<article class="chototFeedCard" data-post-id="'+esc(post.id)+'">',
        '<div class="chototFeedIdentity">',
          '<img class="chototFeedAvatar" src="'+avatarAssets[index%avatarAssets.length]+'" alt="'+esc(post.user)+' 프로필">',
          '<div class="chototFeedAuthor"><strong>'+esc(post.user)+'</strong><span>보배드림 · '+esc(post.time||'방금 전')+'</span></div>',
          '<button class="chototFeedMore" type="button" aria-label="게시물 더보기"><img src="'+redditIcon('more-reddit')+'" alt=""></button>',
        '</div>',
        '<a class="chototFeedTitle" href="./chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261015chototfeed">'+esc(title)+'</a>',
        '<div class="chototFeedBodyWrap"><p class="chototFeedBody">'+esc(bodyCopy[index%bodyCopy.length])+'</p><button class="chototFeedMoreText" type="button" aria-expanded="false">더보기</button></div>',
        mediaMarkup(post,index),
        '<div class="chototFeedActions" aria-label="게시물 반응">',
          '<div class="chototActionPill"><button class="chototVoteButton" type="button" data-vote="up" aria-label="추천" aria-pressed="false"><img src="'+redditIcon('vote-up')+'" alt=""><span>'+score+'</span></button><span class="chototVoteDivider" aria-hidden="true"></span><button class="chototVoteButton" type="button" data-vote="down" aria-label="비추천" aria-pressed="false"><img src="'+redditIcon('vote-down')+'" alt=""></button></div>',
          '<button class="chototActionButton" type="button" data-comment="'+esc(post.id)+'" aria-label="댓글 '+esc(post.reply||0)+'개"><img src="'+redditIcon('comment-reddit')+'" alt=""><span>'+esc(post.reply||0)+'</span></button>',
          '<button class="chototActionButton" type="button" data-share="'+esc(post.id)+'" aria-label="공유"><img src="'+redditIcon('share-reddit')+'" alt=""></button>',
          '<button class="chototActionButton" type="button" data-save="'+esc(post.id)+'" aria-label="저장" aria-pressed="false"><img src="'+redditIcon('bookmark')+'" alt=""></button>',
        '</div>',
      '</article>'
    ].join('');
  }

  function ensureGallery(){
    var gallery=document.getElementById('chototGallery');
    if(gallery)return gallery;
    gallery=document.createElement('div');
    gallery.id='chototGallery';
    gallery.className='chototGallery';
    gallery.setAttribute('role','dialog');
    gallery.setAttribute('aria-modal','true');
    gallery.setAttribute('aria-label','미디어 크게 보기');
    gallery.innerHTML='<div class="chototGalleryStage"><button class="chototGalleryClose" type="button" aria-label="닫기"><img src="'+redditIcon('close')+'" alt=""></button><span class="chototGalleryCounter"></span><button class="chototGalleryNav chototGalleryPrev" type="button" aria-label="이전"><img src="'+chototIcon('chotot-list-detail-feed-prev-button')+'" alt=""></button><div class="chototGalleryContent"></div><button class="chototGalleryNav chototGalleryNext" type="button" aria-label="다음"><img src="'+chototIcon('chotot-list-detail-feed-next-button')+'" alt=""></button></div>';
    document.body.appendChild(gallery);
    gallery.querySelector('.chototGalleryClose').onclick=closeGallery;
    gallery.querySelector('.chototGalleryPrev').onclick=function(){moveGallery(-1)};
    gallery.querySelector('.chototGalleryNext').onclick=function(){moveGallery(1)};
    gallery.addEventListener('click',function(event){if(event.target===gallery)closeGallery()});
    return gallery;
  }

  function showGalleryItem(){
    var gallery=ensureGallery();
    var item=galleryItems[galleryIndex];
    if(!item)return;
    var content=gallery.querySelector('.chototGalleryContent');
    content.innerHTML=item.kind==='video'?'<video class="chototGalleryVideo" src="'+esc(item.src)+'" controls autoplay playsinline></video>':'<img class="chototGalleryImage" src="'+esc(item.src)+'" alt="확대 사진">';
    gallery.querySelector('.chototGalleryCounter').textContent=(galleryIndex+1)+' / '+galleryItems.length;
    gallery.querySelector('.chototGalleryPrev').hidden=galleryItems.length<2;
    gallery.querySelector('.chototGalleryNext').hidden=galleryItems.length<2;
  }

  function openGallery(card,startIndex){
    galleryItems=[].map.call(card.querySelectorAll('.chototMediaItem'),function(item){return{kind:item.dataset.kind,src:item.dataset.src}});
    galleryIndex=Math.max(0,Math.min(startIndex,galleryItems.length-1));
    var gallery=ensureGallery();
    showGalleryItem();
    gallery.classList.add('open');
    document.body.classList.add('chototGalleryOpen');
    gallery.querySelector('.chototGalleryClose').focus();
  }

  function closeGallery(){
    var gallery=document.getElementById('chototGallery');
    if(!gallery)return;
    var video=gallery.querySelector('video');
    if(video)video.pause();
    gallery.classList.remove('open');
    document.body.classList.remove('chototGalleryOpen');
  }

  function moveGallery(delta){
    if(!galleryItems.length)return;
    galleryIndex=(galleryIndex+delta+galleryItems.length)%galleryItems.length;
    showGalleryItem();
  }

  function sharePost(postId){
    var url=new URL('./chzzk-detail.html?id='+encodeURIComponent(postId),location.href).href;
    if(navigator.share){navigator.share({title:'보배드림 게시물',url:url}).catch(function(){})}
    else if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){if(window.toast)window.toast('링크를 복사했습니다')})}
    else if(window.toast)window.toast('공유 링크를 준비했습니다');
  }

  function bindCard(card){
    var more=card.querySelector('.chototFeedMoreText');
    var wrap=card.querySelector('.chototFeedBodyWrap');
    if(more)more.onclick=function(){var expanded=wrap.classList.toggle('expanded');more.textContent=expanded?'접기':'더보기';more.setAttribute('aria-expanded',String(expanded))};
    [].forEach.call(card.querySelectorAll('.chototMediaItem'),function(item){item.onclick=function(){openGallery(card,Number(item.dataset.mediaIndex)||0)}});
    var rail=card.querySelector('.chototMediaRail');
    var counter=card.querySelector('.chototMediaCount');
    function updateCounter(){
      if(!rail||!counter)return;
      var items=[].slice.call(rail.children);
      var nearest=items.reduce(function(best,item,index){var distance=Math.abs(item.offsetLeft-rail.scrollLeft);return distance<best.distance?{index:index,distance:distance}:best},{index:0,distance:Infinity});
      counter.textContent=(nearest.index+1)+' / '+items.length;
    }
    if(rail){rail.addEventListener('scroll',updateCounter,{passive:true})}
    var prev=card.querySelector('.chototRailPrev');
    var next=card.querySelector('.chototRailNext');
    if(prev)prev.onclick=function(){rail.scrollBy({left:-Math.max(220,rail.clientWidth*.78),behavior:'smooth'})};
    if(next)next.onclick=function(){rail.scrollBy({left:Math.max(220,rail.clientWidth*.78),behavior:'smooth'})};
    [].forEach.call(card.querySelectorAll('.chototVoteButton'),function(button){button.onclick=function(){
      var pill=button.parentElement;
      var wasActive=button.classList.contains('is-active');
      [].forEach.call(pill.querySelectorAll('.chototVoteButton'),function(peer){peer.classList.remove('is-active');peer.setAttribute('aria-pressed','false')});
      if(!wasActive){button.classList.add('is-active');button.setAttribute('aria-pressed','true')}
    }});
    var comment=card.querySelector('[data-comment]');
    if(comment)comment.onclick=function(){location.href='./chzzk-detail.html?id='+encodeURIComponent(comment.dataset.comment)+'#comments'};
    var share=card.querySelector('[data-share]');
    if(share)share.onclick=function(){sharePost(share.dataset.share)};
    var save=card.querySelector('[data-save]');
    if(save)save.onclick=function(){var active=save.classList.toggle('is-active');save.setAttribute('aria-pressed',String(active));if(window.toast)window.toast(active?'게시물을 저장했습니다':'저장을 취소했습니다')};
    var menu=card.querySelector('.chototFeedMore');
    if(menu)menu.onclick=function(){if(window.toast)window.toast('게시물 메뉴')};
  }

  function renderChototFeed(){
    var data=postData();
    phone.classList.remove('compactMode','feedCafeMode','redditFeedMode');
    phone.classList.add('chototFeedMode');
    typeLabel.textContent='피드형 · 초톳';
    list.className='list chototFeedList';
    list.innerHTML='<div class="chototFeedIntro"><strong>사진을 좌우로 넘겨보세요</strong><span>초톳처럼 원본 비율을 살린 가로 피드입니다.</span></div>'+data.map(card).join('');
    [].forEach.call(list.querySelectorAll('.chototFeedCard'),bindCard);
  }

  document.addEventListener('keydown',function(event){
    var gallery=document.getElementById('chototGallery');
    if(!gallery||!gallery.classList.contains('open'))return;
    if(event.key==='Escape')closeGallery();
    if(event.key==='ArrowLeft')moveGallery(-1);
    if(event.key==='ArrowRight')moveGallery(1);
  });

  window.renderChototFeed=renderChototFeed;
  var requestedView=new URLSearchParams(location.search).get('view');
  if(requestedView==='chotot'||requestedView==='feed-chotot'){
    renderChototFeed();
  }
})();
