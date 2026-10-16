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
  var scenarioMediaRoot='media/discussion-scenarios-v2/';
  var relatedScenarioMedia={
    1:[1],
    2:[2,14,22,27],3:[3,21,13],4:[4,5,12,18,30],5:[5,4,12,18,30],6:[6],
    7:[7,10,28,16],8:[8,25],9:[9,24,29],10:[10,7,28,16],11:[11,15,19,23,20],
    12:[12,4,5,18,30],13:[13,21,3],14:[14,2,22,27],15:[15,11,19,23,20],
    16:[16,10,7,28],17:[17,25,30],18:[18,12,4,5,30],19:[19,23,15,11,20],
    20:[20,11,15,19,23],21:[21,13,3],22:[22,14,2,27],23:[23,19,15,11,20],
    24:[24,9,29],25:[25,8,17],26:[26],27:[27,14,22,2],28:[28,7,10,16],
    29:[29,24,9],30:[30,17,12,18,4,5],
    31:[31,37,51],32:[32,54,48,49],33:[33,42,59,60],34:[34,52,45],35:[35,46,57],
    36:[36,39,44,47,58],37:[37,31,51],38:[38,44,47],39:[39,44,36],40:[40,33,42],
    41:[41,50,55],42:[42,33,60],43:[43,56],44:[44,39,36,47],45:[45,52,34],
    46:[46,35,57],47:[47,44,36],48:[48,49,32,54],49:[49,48,32],50:[50,41,55],
    51:[51,31,37],52:[52,34,45],53:[53],54:[54,32,48],55:[55,41,50],
    56:[56,43],57:[57,35,46],58:[58,36,39],59:[59,33,42],60:[60,33,42,59]
  };
  var videoMediaByPost={
    8:'media/car-driving-road-v01.mp4',
    11:'media/car-sunset-drive-v01.mp4',
    14:'media/car-driving-road-v01.mp4',
    20:'media/car-desert-drone-v01.mp4',
    34:'media/car-driving-road-v01.mp4',
    37:'media/car-sunset-drive-v01.mp4',
    53:'media/car-driving-road-v01.mp4',
    57:'media/car-desert-drone-v01.mp4'
  };
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
  function avatarFor(post,index){return post.authorAvatar||'assets/profile-avatars/avatar-'+String(index%48+1).padStart(2,'0')+'.svg';}
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
  function scenarioMediaSource(postId){
    return scenarioMediaRoot+'post-'+String(postId).padStart(2,'0')+'.webp?v=20261016scenario3';
  }
  function mediaSources(post){
    var postId=Number(post.id);
    var photoCount=Number(post.photos)||0;
    if(photoCount<=0)return [];
    var requested=Math.min(6,photoCount);
    var related=relatedScenarioMedia[postId]||[postId];
    return related.slice(0,requested).map(scenarioMediaSource);
  }
  function mediaFor(post,index){
    var sources=mediaSources(post,index);
    if(!sources.length)return '';
    var multiple=sources.length>1;
    var title=cleanTitle(post.title);
    var items=sources.map(function(source,itemIndex){
      var ratio=mediaLayouts[index%mediaLayouts.length][itemIndex%mediaLayouts[index%mediaLayouts.length].length];
      var isVideo=Boolean(videoMediaByPost[Number(post.id)])&&itemIndex===0;
      var contain=/\.png(?:\?|$)/i.test(source);
      var media=isVideo?'<video muted playsinline preload="metadata" poster="'+esc(source)+'"><source src="'+esc(videoMediaByPost[Number(post.id)])+'" type="video/mp4"></video><button class="naverDiscussionVideoToggle" type="button" data-discussion-video aria-label="영상 재생"><img src="'+chototIcon('chotot-common-video-play-white-bg')+'" alt=""></button>':'<a class="naverDiscussionMediaLink" href="'+detailUrl(post)+'" aria-label="'+esc(title)+' 사진 '+(itemIndex+1)+' / '+sources.length+' 상세 보기"><img src="'+esc(source)+'" alt="" loading="'+(index===0&&itemIndex===0?'eager':'lazy')+'"'+(index===0&&itemIndex===0?' fetchpriority="high"':'')+'></a>';
      return '<div class="naverDiscussionMediaItem'+(contain?' is-contain':'')+'" data-discussion-media-index="'+itemIndex+'" data-media-post-id="'+esc(post.id)+'" data-kind="'+(isVideo?'video':'image')+'" data-ratio="'+ratio+'">'+media+'</div>';
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
