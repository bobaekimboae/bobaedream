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
  var slash='/';
  var projectAssetRoot=(/github\.io$/i.test(location.hostname)?slash+'bobaedream':'')+slash+'assets'+slash;
  var carAssets=Array.from({length:30},function(_,index){
    return projectAssetRoot+'cars'+slash+'supercar-sheet-v01'+slash+'sc-'+String(index+1).padStart(3,'0')+'.jpg?v=20261015realfeed3';
  });
  var feedScenarios=[
    {title:'주말 모임에 등장한 블루 SUV, 실물 색감은 이렇습니다',user:'성수동카스팟',time:'방금 전',reply:18,media:[1,4,12,15,18,22],layout:['landscape','portrait','square','landscape','portrait','square'],body:'주말 자동차 모임에서 직접 촬영한 차량들입니다. 전시장 조명과 야외 자연광에서 색감이 어떻게 달라지는지 순서대로 담았습니다.'},
    {title:'수입차 전시장 실물 비교, 사진으로 먼저 보세요',user:'전시장한바퀴',time:'3분 전',reply:31,media:[2,3,5,6,11],layout:['landscape','landscape','square','square','portrait'],body:'같은 날 여러 전시장을 돌며 촬영했습니다. 차체 비율과 전면 디자인을 비교하기 쉽도록 정면과 측면 사진을 함께 올립니다.'},
    {title:'도산대로에서 만난 슈퍼카, 디테일 사진 모음',user:'도산대로직찍',time:'8분 전',reply:42,media:[3,9,14],layout:['landscape','portrait','square'],body:'도로에서 직접 본 차량을 안전한 위치에서 촬영했습니다. 사진을 좌우로 넘기면 전면, 휠, 후면 순서로 확인할 수 있습니다.'},
    {title:'블루 SUV 두 대 직접 비교해봤습니다',user:'패밀리카고민중',time:'17분 전',reply:24,media:[1,4,17,21],layout:['landscape','landscape','portrait','square'],body:'패밀리카로 고민 중인 두 차량을 같은 기준으로 비교했습니다. 2열 공간과 트렁크, 휠 크기는 상세 사진에서 확인해 주세요.'},
    {title:'레드 페라리 출고 전 검수 사진 공유합니다',user:'출고검수팀장',time:'29분 전',reply:15,media:[5,7,8,16],layout:['landscape','landscape','square','portrait'],body:'인도 전에 도장면과 휠, 실내 버튼 작동 상태를 확인했습니다. 사진은 보정하지 않은 원본 색감에 가깝게 올렸습니다.'},
    {title:'야간 주행 영상과 실제 배기음 기록',user:'밤드라이브',time:'41분 전',reply:57,media:[10],layout:['video'],body:'교통 법규를 지키며 촬영한 짧은 주행 영상입니다. 소리는 이어폰보다 휴대폰 스피커 기준으로 자연스럽게 들리도록 정리했습니다.'},
    {title:'오늘 입고된 중고 슈퍼카, 첫 점검 사진',user:'중고차보는눈',time:'1시간 전',reply:36,media:[11],layout:['landscape'],body:'입고 직후 세차 전 상태에서 촬영했습니다. 외판 단차와 타이어 마모, 실내 사용감은 계약 전에 한 번 더 확인할 예정입니다.'},
    {title:'동호회 차량 스티커 실제 부착 위치 비교',user:'스티커장인',time:'2시간 전',reply:9,media:[13,20],layout:['square','landscape'],body:'같은 크기의 스티커를 유리와 차체에 각각 대봤습니다. 운전 시야를 가리지 않으면서 사진에도 잘 보이는 위치를 비교했습니다.'},
    {title:'구매 전 확인한 외관·휠·실내 사진 5장',user:'현금완납러',time:'3시간 전',reply:68,media:[6,8,19,23,27],layout:['landscape','portrait','square','landscape','portrait'],body:'매물 설명만으로 부족했던 부분을 현장에서 직접 촬영했습니다. 휠 스크래치와 시트 주름, 트렁크 마감까지 차례대로 확인할 수 있습니다.'},
    {title:'중고차 매물 볼 때 사진으로 먼저 거르는 기준',user:'성능기록부필수',time:'5시간 전',reply:73,media:[24,25,26],layout:['landscape','square','portrait'],body:'성능기록부를 보기 전에도 사진에서 확인할 수 있는 항목을 정리했습니다. 패널 간격, 타이어 편마모, 실내 버튼 마모를 먼저 살펴보세요.'}
  ];
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
  var galleryOpener=null;
  var lockedScrollY=0;

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

  function redditUiIcon(name){
    return 'assets/reddit-ui/'+name+'.svg?v=20261016redditicons1';
  }

  function postData(){
    var source=(window.BOBAE_POSTS&&window.BOBAE_POSTS.length?window.BOBAE_POSTS:window.posts)||[];
    return source.slice(0,10).map(function(post,index){
      return Object.assign({},post,feedScenarios[index]||{});
    });
  }

  function itemSource(post,postIndex,itemIndex){
    var selected=post.media&&post.media.length?post.media[itemIndex%post.media.length]:((postIndex*3+itemIndex)%carAssets.length)+1;
    return carAssets[(Math.max(1,Number(selected)||1)-1)%carAssets.length];
  }

  function mediaMarkup(post,index){
    var layout=post.layout||layouts[index%layouts.length];
    if(!layout.length)return '';
    var cells=layout.map(function(ratio,itemIndex){
      if(ratio==='video'){
        var video=videoAssets[index%videoAssets.length];
        var poster=itemSource(post,index,itemIndex);
        return '<button class="chototMediaItem video" type="button" data-media-index="'+itemIndex+'" data-kind="video" data-src="'+esc(video)+'" data-ratio="portrait" aria-label="영상 크게 보기"><video muted playsinline preload="metadata" poster="'+esc(poster)+'"><source src="'+esc(video)+'" type="video/mp4"></video><img class="chototVideoPlay" src="'+redditUiIcon('video')+'" alt=""></button>';
      }
      var source=itemSource(post,index,itemIndex);
      var priority=index===0&&itemIndex===0;
      return '<button class="chototMediaItem" type="button" data-media-index="'+itemIndex+'" data-kind="image" data-src="'+esc(source)+'" data-ratio="'+ratio+'" aria-label="'+esc(cleanTitle(post.title))+' 사진 '+(itemIndex+1)+' 크게 보기"><img src="'+esc(source)+'" alt="'+esc(cleanTitle(post.title))+' 사진 '+(itemIndex+1)+'" loading="'+(priority?'eager':'lazy')+'"'+(priority?' fetchpriority="high"':'')+'></button>';
    }).join('');
    return '<div class="chototMediaShell"><div class="chototMediaRail" aria-label="게시물 미디어, 좌우로 넘기기">'+cells+'</div><button class="chototRailArrow chototRailPrev" type="button" aria-label="이전 사진"><img src="'+redditUiIcon('previous')+'" alt=""></button><button class="chototRailArrow chototRailNext" type="button" aria-label="다음 사진"><img src="'+redditUiIcon('next')+'" alt=""></button>'+(layout.length>1?'<span class="chototMediaCount">1 / '+layout.length+'</span>':'')+'</div>';
  }

  function card(post,index){
    var title=cleanTitle(post.title);
    var score=(Number(post.id||index+1)*7)%46+3;
    return [
      '<article class="chototFeedCard" data-post-id="'+esc(post.id)+'">',
        mediaMarkup(post,index),
        '<div class="chototFeedIdentity">',
          '<img class="chototFeedAvatar" src="'+avatarAssets[index%avatarAssets.length]+'" alt="'+esc(post.user)+' 프로필">',
          '<div class="chototFeedAuthor"><strong>'+esc(post.user)+'</strong><span>보배드림 · '+esc(post.time||'방금 전')+'</span></div>',
          '<button class="chototFeedMore" type="button" aria-label="게시물 더보기"><img src="'+redditIcon('more-reddit')+'" alt=""></button>',
        '</div>',
        '<a class="chototFeedTitle" href="./chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261015chototfeed">'+esc(title)+'</a>',
        '<div class="chototFeedBodyWrap"><p class="chototFeedBody">'+esc(post.body||bodyCopy[index%bodyCopy.length])+'</p><button class="chototFeedMoreText" type="button" aria-expanded="false">더보기</button></div>',
        '<div class="chototFeedActions" aria-label="게시물 반응">',
          '<div class="chototActionPill"><button class="chototVoteButton" type="button" data-vote="up" aria-label="추천" aria-pressed="false"><img src="'+redditIcon('vote-up')+'" alt=""><span>'+score+'</span></button><span class="chototVoteDivider" aria-hidden="true"></span><button class="chototVoteButton" type="button" data-vote="down" aria-label="비추천" aria-pressed="false"><img src="'+redditIcon('vote-down')+'" alt=""></button></div>',
          '<button class="chototActionButton" type="button" data-comment="'+esc(post.id)+'" aria-label="댓글 '+esc(post.reply||0)+'개"><img src="'+redditIcon('comment-reddit')+'" alt=""><span>'+esc(post.reply||0)+'</span></button>',
          '<button class="chototActionButton" type="button" data-share="'+esc(post.id)+'" aria-label="공유"><img src="'+redditIcon('share-reddit')+'" alt=""></button>',
          '<button class="chototActionButton" type="button" data-save="'+esc(post.id)+'" aria-label="저장" aria-pressed="false"><img src="'+redditIcon('bookmark')+'" alt=""></button>',
        '</div>',
      '</article>'
    ].join('');
  }

  function dealerCard(post,index){
    var title=cleanTitle(post.title);
    return [
      '<article class="chototFeedCard chototDealerFeedCard" data-post-id="'+esc(post.id)+'">',
        '<div class="chototFeedIdentity">',
          '<img class="chototFeedAvatar" src="'+avatarAssets[index%avatarAssets.length]+'" alt="'+esc(post.user)+' 프로필">',
          '<div class="chototFeedAuthor"><strong>'+esc(post.user)+'</strong><span>보배드림 딜러 · '+esc(post.time||'방금 전')+'</span></div>',
          '<button class="chototFeedMore" type="button" aria-label="게시물 더보기"><img src="'+redditIcon('more-reddit')+'" alt=""></button>',
        '</div>',
        '<a class="chototDealerCaption" href="./chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261015chototdealer">'+esc(title)+'</a>',
        mediaMarkup(post,index),
        '<div class="chototDealerActions" aria-label="딜러 게시물 반응과 연락">',
          '<button class="chototDealerAction" type="button" data-dealer-like aria-label="추천" aria-pressed="false"><img src="'+redditIcon('vote-up')+'" alt=""><span>0</span></button>',
          '<button class="chototDealerAction" type="button" data-comment="'+esc(post.id)+'" aria-label="댓글 '+esc(post.reply||0)+'개"><img src="'+redditIcon('comment-reddit')+'" alt=""><span>'+esc(post.reply||0)+'</span></button>',
          '<a class="chototDealerAction" href="tel:02-2059-5211" aria-label="딜러에게 전화"><img class="autoScoutPhone" src="'+redditUiIcon('phone-autoscout24')+'" alt=""><span>전화</span></a>',
          '<button class="chototDealerAction" type="button" data-dealer-chat aria-label="딜러와 채팅"><img src="'+redditUiIcon('chat')+'" alt=""><span>채팅</span></button>',
          '<button class="chototDealerAction" type="button" data-save="'+esc(post.id)+'" data-dealer-save aria-label="저장" aria-pressed="false"><img src="'+redditIcon('bookmark')+'" alt=""><span>저장</span></button>',
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
    gallery.innerHTML='<div class="chototGalleryStage"><button class="chototGalleryClose" type="button" aria-label="닫기"><img src="'+redditIcon('close')+'" alt=""></button><span class="chototGalleryCounter"></span><button class="chototGalleryNav chototGalleryPrev" type="button" aria-label="이전"><img src="'+redditUiIcon('previous')+'" alt=""></button><div class="chototGalleryContent"></div><button class="chototGalleryNav chototGalleryNext" type="button" aria-label="다음"><img src="'+redditUiIcon('next')+'" alt=""></button></div>';
    document.body.appendChild(gallery);
    gallery.querySelector('.chototGalleryClose').onclick=closeGallery;
    gallery.querySelector('.chototGalleryPrev').onclick=function(){moveGallery(-1)};
    gallery.querySelector('.chototGalleryNext').onclick=function(){moveGallery(1)};
    gallery.addEventListener('click',function(event){if(event.target===gallery)closeGallery()});
    var touchStart=null;
    gallery.addEventListener('touchstart',function(event){
      var touch=event.touches&&event.touches[0];
      if(touch)touchStart={x:touch.clientX,y:touch.clientY};
    },{passive:true});
    gallery.addEventListener('touchend',function(event){
      var touch=event.changedTouches&&event.changedTouches[0];
      if(!touch||!touchStart)return;
      var dx=touch.clientX-touchStart.x;
      var dy=touch.clientY-touchStart.y;
      touchStart=null;
      if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.25)moveGallery(dx<0?1:-1);
    },{passive:true});
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
    if(!galleryItems.length)return;
    galleryIndex=Math.max(0,Math.min(startIndex,galleryItems.length-1));
    var gallery=ensureGallery();
    galleryOpener=card.querySelector('.chototMediaItem[data-media-index="'+galleryIndex+'"]');
    lockedScrollY=window.scrollY||window.pageYOffset||0;
    showGalleryItem();
    gallery.classList.add('open');
    document.body.classList.add('chototGalleryOpen');
    document.body.style.top='-'+lockedScrollY+'px';
    gallery.querySelector('.chototGalleryClose').focus();
  }

  function closeGallery(){
    var gallery=document.getElementById('chototGallery');
    if(!gallery)return;
    var video=gallery.querySelector('video');
    if(video)video.pause();
    gallery.classList.remove('open');
    document.body.classList.remove('chototGalleryOpen');
    document.body.style.top='';
    window.scrollTo(0,lockedScrollY);
    if(galleryOpener&&document.contains(galleryOpener))galleryOpener.focus({preventScroll:true});
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

  function notify(message){
    if(window.toast){window.toast(message);return}
    var element=document.getElementById('toast');
    if(!element)return;
    element.textContent=message;
    element.classList.add('show');
    window.setTimeout(function(){element.classList.remove('show')},1000);
  }

  function setDealerBoardName(enabled){
    var name=document.querySelector('.boardSelectName');
    if(!name)return;
    if(enabled){
      if(!phone.dataset.chototBoardName)phone.dataset.chototBoardName=name.textContent.trim()||'자유게시판';
      name.textContent='중고차딜러';
      return;
    }
    if(phone.dataset.chototBoardName){
      name.textContent=phone.dataset.chototBoardName;
      delete phone.dataset.chototBoardName;
    }
  }

  function bindCard(card){
    var more=card.querySelector('.chototFeedMoreText');
    var wrap=card.querySelector('.chototFeedBodyWrap');
    if(more)more.onclick=function(){var expanded=wrap.classList.toggle('expanded');more.textContent=expanded?'접기':'더보기';more.setAttribute('aria-expanded',String(expanded))};
    [].forEach.call(card.querySelectorAll('.chototMediaItem'),function(item){
      var gesture={x:0,y:0,moved:false};
      item.addEventListener('pointerdown',function(event){gesture.x=event.clientX;gesture.y=event.clientY;gesture.moved=false});
      item.addEventListener('pointermove',function(event){if(Math.abs(event.clientX-gesture.x)>10||Math.abs(event.clientY-gesture.y)>10)gesture.moved=true});
      item.addEventListener('pointercancel',function(){gesture.moved=true});
      item.onclick=function(event){
        event.preventDefault();
        event.stopPropagation();
        if(gesture.moved){gesture.moved=false;return}
        openGallery(card,Number(item.dataset.mediaIndex)||0);
      };
    });
    var rail=card.querySelector('.chototMediaRail');
    var counter=card.querySelector('.chototMediaCount');
    function placeCounter(item){
      if(!counter||!item)return;
      var shell=counter.parentElement;
      var shellRect=shell.getBoundingClientRect();
      var itemRect=item.getBoundingClientRect();
      counter.style.left=Math.max(34,Math.min(shellRect.width-9,itemRect.right-shellRect.left-9))+'px';
    }
    function resetRailToFirstImage(){
      if(!rail)return;
      rail.scrollLeft=0;
      if(counter)counter.textContent='1 / '+rail.children.length;
      placeCounter(rail.firstElementChild);
    }
    function updateCounter(){
      if(!rail||!counter)return;
      var items=[].slice.call(rail.children);
      var nearest=items.reduce(function(best,item,index){var distance=Math.abs(item.offsetLeft-rail.scrollLeft);return distance<best.distance?{index:index,distance:distance}:best},{index:0,distance:Infinity});
      counter.textContent=(nearest.index+1)+' / '+items.length;
      placeCounter(items[nearest.index]);
    }
    if(rail){
      resetRailToFirstImage();
      requestAnimationFrame(resetRailToFirstImage);
      rail.addEventListener('scroll',updateCounter,{passive:true});
      ['touchstart','touchmove','touchend','touchcancel'].forEach(function(eventName){
        rail.addEventListener(eventName,function(event){event.stopPropagation()},{passive:true});
      });
    }
    var prev=card.querySelector('.chototRailPrev');
    var next=card.querySelector('.chototRailNext');
    if(prev)prev.onclick=function(event){event.stopPropagation();rail.scrollBy({left:-Math.max(220,rail.clientWidth*.78),behavior:'smooth'})};
    if(next)next.onclick=function(event){event.stopPropagation();rail.scrollBy({left:Math.max(220,rail.clientWidth*.78),behavior:'smooth'})};
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

  function bindDealerCard(card){
    bindCard(card);
    var like=card.querySelector('[data-dealer-like]');
    if(like)like.onclick=function(){
      var active=like.classList.toggle('is-active');
      like.setAttribute('aria-pressed',String(active));
      like.querySelector('span').textContent=active?'1':'0';
    };
    var chat=card.querySelector('[data-dealer-chat]');
    if(chat)chat.onclick=function(){notify('딜러 채팅을 준비했습니다')};
    var save=card.querySelector('[data-dealer-save]');
    if(save)save.onclick=function(){
      var active=save.classList.toggle('is-active');
      save.setAttribute('aria-pressed',String(active));
      save.querySelector('img').src=redditIcon('bookmark');
      notify(active?'게시물을 저장했습니다':'저장을 취소했습니다');
    };
  }

  function renderChototFeed(){
    var data=postData();
    setDealerBoardName(false);
    phone.classList.remove('compactMode','feedCafeMode','redditFeedMode','chototDealerFeedMode');
    phone.classList.add('chototFeedMode','chototBoardFeedMode');
    typeLabel.textContent='초톳 피드형 · 게시판형';
    list.className='list chototFeedList';
    list.innerHTML='<div class="chototFeedIntro"><strong>사진을 좌우로 넘겨보세요</strong><span>초톳처럼 원본 비율을 살린 가로 피드입니다.</span></div>'+data.map(card).join('');
    [].forEach.call(list.querySelectorAll('.chototFeedCard'),bindCard);
  }

  function renderChototDealerFeed(){
    var data=postData();
    setDealerBoardName(true);
    phone.classList.remove('compactMode','feedCafeMode','redditFeedMode','chototBoardFeedMode');
    phone.classList.add('chototFeedMode','chototDealerFeedMode');
    typeLabel.textContent='초톳 피드형 · 딜러형';
    list.className='list chototFeedList chototDealerFeedList';
    list.innerHTML=data.map(dealerCard).join('');
    [].forEach.call(list.querySelectorAll('.chototDealerFeedCard'),bindDealerCard);
  }

  document.addEventListener('keydown',function(event){
    var gallery=document.getElementById('chototGallery');
    if(!gallery||!gallery.classList.contains('open'))return;
    if(event.key==='Escape')closeGallery();
    if(event.key==='ArrowLeft')moveGallery(-1);
    if(event.key==='ArrowRight')moveGallery(1);
  });

  window.renderChototFeed=renderChototFeed;
  window.renderChototDealerFeed=renderChototDealerFeed;
  var requestedView=new URLSearchParams(location.search).get('view');
  if(requestedView==='chotot'||requestedView==='chotot-board'||requestedView==='feed-chotot'){
    if(typeof mode!=='undefined')mode='feed-chotot';
    renderChototFeed();
  }else if(requestedView==='chotot-dealer'||requestedView==='feed-chotot-dealer'){
    if(typeof mode!=='undefined')mode='feed-chotot-dealer';
    renderChototDealerFeed();
  }
  window.addEventListener('pageshow',function(){
    if(!phone.classList.contains('chototFeedMode'))return;
    requestAnimationFrame(function(){
      [].forEach.call(list.querySelectorAll('.chototMediaRail'),function(rail){rail.scrollLeft=0});
      [].forEach.call(list.querySelectorAll('.chototMediaCount'),function(counter){
        var rail=counter.parentElement.querySelector('.chototMediaRail');
        if(rail)counter.textContent='1 / '+rail.children.length;
      });
    });
  });
})();
