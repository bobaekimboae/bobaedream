(function(){
  'use strict';

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
  var slash='/';
  var projectRoot=/github\.io$/i.test(location.hostname)?slash+'bobaedream':'';
  var fallbackMedia=Array.from({length:30},function(_,index){
    return projectRoot+slash+'assets'+slash+'cars'+slash+'supercar-sheet-v01'+slash+'sc-'+String(index+1).padStart(3,'0')+'.jpg?v=20261016navercarousel2';
  });
  var videoMedia=['media/car-driving-road-v01.mp4','media/car-sunset-drive-v01.mp4','media/car-desert-drone-v01.mp4'];
  var mediaLayouts=[
    ['landscape','square','portrait','landscape','tall','square'],
    ['portrait','square','landscape','portrait','square','tall'],
    ['portrait','landscape','square','tall','landscape','portrait'],
    ['square','portrait','landscape','square','tall','portrait']
  ];

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});
  }
  function posts(){return (window.BOBAE_POSTS||[]).slice();}
  function cleanTitle(value){return String(value||'').replace(/^\[[^\]]+\]\s*/,'');}
  function bodyFor(post,index){return Array.isArray(post.body)&&post.body.length?post.body[0]:bodyFallbacks[index%bodyFallbacks.length];}
  function avatarFor(post,index){return post.authorAvatar||'assets/profile-avatars/avatar-'+String(index%20+1).padStart(2,'0')+'.svg';}
  function detailUrl(post){return './chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261016naverdiscussion2';}
  function icon(name){return 'assets/chzzk-detail/icons/'+name+'.svg?v=20261016naverdiscussion2';}
  function chototIcon(name){return '../icons/chotot/'+name+'.svg?v=20261016navermedia1';}
  function categoryFor(post){return post.category||String(post.title||'').match(/^\[([^\]]+)\]/)?.[1]||'자유';}
  function metric(value){
    var number=Math.max(0,Number(value)||0);
    if(number>=10000){var man=Math.floor(number/1000)/10;return (man%1===0?String(man):man.toFixed(1))+'만';}
    if(number>=1000){var thousand=Math.floor(number/100)/10;return (thousand%1===0?String(thousand):thousand.toFixed(1))+'천';}
    return String(number);
  }
  function normalizedMediaSource(source){
    if(!source)return '';
    if(/^https?:\/\//i.test(source))return source.replace(/([?&])w=\d+/,'$1w=960');
    if(source.charAt(0)==='/'&&projectRoot&&source.indexOf(projectRoot+'/')!==0)return projectRoot+source;
    return source;
  }
  function mediaSources(post,index){
    var requested=Math.min(6,Math.max(0,Number(post.photos)||0));
    var supplied=[];
    ['detailImages','images','mediaImages'].forEach(function(field){
      if(Array.isArray(post[field]))supplied=supplied.concat(post[field]);
    });
    supplied.push(post.detailImage||'',post.thumbnail||'');
    var sources=supplied.map(normalizedMediaSource).filter(function(source,position,all){return source&&all.indexOf(source)===position;});
    if(!sources.length&&post.video)sources.push(fallbackMedia[(index*4)%fallbackMedia.length]);
    if(!sources.length)return [];
    var target=Math.max(1,Math.min(6,requested||sources.length));
    while(sources.length<target){
      var fallback=fallbackMedia[(index*4+sources.length-1)%fallbackMedia.length];
      if(sources.indexOf(fallback)<0)sources.push(fallback);
    }
    return sources.slice(0,target);
  }
  function mediaFor(post,index){
    var sources=mediaSources(post,index);
    if(!sources.length)return '';
    var multiple=sources.length>1;
    var title=cleanTitle(post.title);
    var items=sources.map(function(source,itemIndex){
      var ratio=mediaLayouts[index%mediaLayouts.length][itemIndex%mediaLayouts[index%mediaLayouts.length].length];
      var isVideo=Boolean(post.video)&&itemIndex===0;
      var contain=/\.png(?:\?|$)/i.test(source);
      var media=isVideo?'<video muted playsinline preload="metadata" poster="'+esc(source)+'"><source src="'+esc(videoMedia[index%videoMedia.length])+'" type="video/mp4"></video><button class="naverDiscussionVideoToggle" type="button" data-discussion-video aria-label="영상 재생"><img src="'+chototIcon('chotot-common-video-play-white-bg')+'" alt=""></button>':'<a class="naverDiscussionMediaLink" href="'+detailUrl(post)+'" aria-label="'+esc(title)+' 사진 '+(itemIndex+1)+' / '+sources.length+' 상세 보기"><img src="'+esc(source)+'" alt="" loading="'+(index===0&&itemIndex===0?'eager':'lazy')+'"'+(index===0&&itemIndex===0?' fetchpriority="high"':'')+'></a>';
      var pagination=multiple?'<span class="naverDiscussionMediaCount"><b>'+(itemIndex+1)+'</b> / '+sources.length+'</span><span class="naverDiscussionMediaDots" aria-hidden="true">'+sources.map(function(_,dotIndex){return '<i'+(dotIndex===itemIndex?' class="is-active"':'')+'></i>';}).join('')+'</span>':'';
      return '<div class="naverDiscussionMediaItem'+(contain?' is-contain':'')+'" data-discussion-media-index="'+itemIndex+'" data-kind="'+(isVideo?'video':'image')+'" data-ratio="'+ratio+'">'+media+pagination+'</div>';
    }).join('');
    return '<div class="naverDiscussionMediaShell'+(multiple?' is-multi':'')+'"><div class="naverDiscussionMediaRail" tabindex="0" aria-label="'+esc(title)+' 사진과 영상, 좌우로 넘기기">'+items+'</div></div>';
  }
  function card(post,index){
    var likes=Math.max(0,Math.round(Number(post.view||0)/23)+Number(post.reply||0));
    var dislikes=Math.max(0,Math.round(Number(post.reply||0)/7));
    return '<article class="naverDiscussionCard" data-discussion-post="'+esc(post.id)+'"><span class="naverDiscussionCategory">'+esc(categoryFor(post))+'</span><div class="naverDiscussionIdentity"><img class="naverDiscussionAvatar" src="'+esc(avatarFor(post,index))+'" alt="'+esc(post.user)+' 프로필"><strong class="naverDiscussionAuthor">'+esc(post.user)+'</strong><time class="naverDiscussionTime">'+esc(post.time)+'</time></div><a class="naverDiscussionTitle" href="'+detailUrl(post)+'">'+esc(cleanTitle(post.title))+'</a><p class="naverDiscussionBody">'+esc(bodyFor(post,index))+'</p>'+mediaFor(post,index)+'<div class="naverDiscussionMetrics" aria-label="게시물 반응"><button class="naverDiscussionMetric" type="button" data-discussion-vote="up" aria-label="버프 '+metric(likes)+'" aria-pressed="false"><img src="'+icon('buff')+'" alt=""><span>'+metric(likes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-vote="down" aria-label="너프 '+metric(dislikes)+'" aria-pressed="false"><img src="'+icon('nerf')+'" alt=""><span>'+metric(dislikes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-comment="'+esc(post.id)+'" aria-label="댓글 '+Number(post.reply||0).toLocaleString('ko-KR')+'개"><img src="'+icon('comment-reddit')+'" alt="">'+metric(post.reply)+'</button><span class="naverDiscussionViews">조회 '+Number(post.view||0).toLocaleString('ko-KR')+'</span></div></article>';
  }
  function feedBody(){
    var data=posts();
    if(!data.length)return '<div style="padding:44px 16px;color:#858990;font-size:14px;text-align:center">등록된 토론이 없습니다.</div>';
    return data.map(card).join('');
  }
  function render(){
    phone.classList.remove('compactMode','feedCafeMode','redditFeedMode','chototFeedMode','chototBoardFeedMode','chototDealerFeedMode');
    phone.classList.add('naverDiscussionMode');
    typeLabel.textContent='네이버 토론형';
    list.className='list naverDiscussionList';
    list.innerHTML=feedBody();
    bind();
  }
  function bind(){
    list.querySelectorAll('[data-discussion-video]').forEach(function(button){
      var video=button.parentElement.querySelector('video');
      if(!video)return;
      button.addEventListener('click',function(){
        list.querySelectorAll('.naverDiscussionMediaItem video').forEach(function(other){if(other!==video)other.pause();});
        if(video.paused){video.controls=true;video.play().catch(function(){});}else video.pause();
      });
      video.addEventListener('play',function(){button.classList.add('is-playing');button.setAttribute('aria-label','영상 일시정지');});
      video.addEventListener('pause',function(){button.classList.remove('is-playing');button.setAttribute('aria-label','영상 재생');});
    });
    list.querySelectorAll('[data-discussion-vote]').forEach(function(button){button.addEventListener('click',function(){var active=button.getAttribute('aria-pressed')==='true';var cardElement=button.closest('.naverDiscussionCard');cardElement.querySelectorAll('[data-discussion-vote]').forEach(function(other){other.classList.remove('is-active');other.setAttribute('aria-pressed','false');});if(!active){button.classList.add('is-active');button.setAttribute('aria-pressed','true');}});});
    list.querySelectorAll('[data-discussion-comment]').forEach(function(button){button.addEventListener('click',function(){location.href='./chzzk-detail.html?id='+encodeURIComponent(button.dataset.discussionComment)+'#comments';});});
  }

  window.renderNaverDiscussionFeed=render;
  if(new URLSearchParams(location.search).get('view')==='naver-discussion')render();
})();
