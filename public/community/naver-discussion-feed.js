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
  var mediaCarousels=[];
  var sharedMedia=window.BBM_DISCUSSION_MEDIA||{photosFor:function(){return [];},videoFor:function(){return '';}};

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});
  }
  function posts(){var data=(window.BOBAE_POSTS||[]).slice();if(window.BOBAE_LOCAL_POST)data.unshift(window.BOBAE_LOCAL_POST);return data;}
  function cleanTitle(value){return String(value||'').replace(/^\[[^\]]+\]\s*/,'');}
  function bodyFor(post,index){return Array.isArray(post.body)&&post.body.length?post.body[0]:bodyFallbacks[index%bodyFallbacks.length];}
  function avatarFor(post,index){return post.authorAvatar||'assets/profile-avatars/avatar-'+String(index%48+1).padStart(2,'0')+'.svg';}
  function detailUrl(post,photoIndex){return './chzzk-detail.html?id='+encodeURIComponent(post.id)+'&from=discussion'+(photoIndex>0?'&photo='+(photoIndex+1):'')+'&v=20261016naverdiscussion3';}
  function icon(name){return 'assets/chzzk-detail/icons/'+name+'.svg?v=20261016naverdiscussion2';}
  function chototIcon(name){return '../icons/chotot/'+name+'.svg?v=20261016navermedia1';}
  function categoryFor(post){return post.category||String(post.title||'').match(/^\[([^\]]+)\]/)?.[1]||'자유';}
  function metric(value){
    var number=Math.max(0,Number(value)||0);
    if(number>=10000){var man=Math.floor(number/1000)/10;return (man%1===0?String(man):man.toFixed(1))+'만';}
    if(number>=1000){var thousand=Math.floor(number/100)/10;return (thousand%1===0?String(thousand):thousand.toFixed(1))+'천';}
    return String(number);
  }
  function mediaSources(post){
    if(post.local){
      if(!Array.isArray(post.media))return [];
      return post.media.filter(function(item){
        return item&&item.kind&&(item.id||(item.kind==='image'&&item.url)||(item.kind==='video'&&/\.(?:mp4|webm|mov)(?:\?|$)/i.test(item.url||'')));
      }).slice(0,6).map(function(item){return{src:item.url||'',id:item.id||'',kind:item.kind,ratio:item.kind==='video'?16/9:0};});
    }
    return sharedMedia.photosFor(post).map(function(photo){return{src:photo.src,id:'',kind:'image',ratio:photo.ratio};});
  }
  /* 사진 칸 폭 = 줄 높이 × 원본 비율. 너무 길거나 넓은 사진만 9:16 ~ 16:9 안으로 자른다. */
  function clampRatio(value){var r=Number(value)||1;return Math.min(16/9,Math.max(9/16,r));}
  function mediaFor(post,index){
    var sources=mediaSources(post,index);
    if(!sources.length)return '';
    var multiple=sources.length>1;
    var title=cleanTitle(post.title);
    var postVideo=sharedMedia.videoFor(post);
    var items=sources.map(function(item,itemIndex){
      var source=item.src||'';
      var isVideo=item.kind==='video'||Boolean(postVideo)&&itemIndex===0;
      var ratio=item.ratio?clampRatio(item.ratio):1;
      var contain=/\.png(?:\?|$)/i.test(source);
      var localMedia=item.id?' data-local-media-id="'+esc(item.id)+'"':'';
      var needsRatio=item.ratio?'':' data-measure-ratio';
      var videoSource=item.kind==='video'?source:postVideo;
      var media=isVideo?'<video muted playsinline preload="metadata"'+localMedia+(item.kind==='video'?'':' poster="'+esc(source)+'"')+(videoSource?' src="'+esc(videoSource)+'"':'')+'></video><button class="naverDiscussionVideoToggle" type="button" data-discussion-video aria-label="영상 재생"><img src="'+chototIcon('chotot-common-video-play-white-bg')+'" alt=""></button>':'<a class="naverDiscussionMediaLink" href="'+detailUrl(post,itemIndex)+'" draggable="false" aria-label="'+esc(title)+' 사진 '+(itemIndex+1)+' / '+sources.length+' 상세 보기"><img src="'+esc(source)+'"'+localMedia+needsRatio+' alt="" draggable="false" loading="'+(index===0&&itemIndex===0?'eager':'lazy')+'"'+(index===0&&itemIndex===0?' fetchpriority="high"':'')+'></a>';
      return '<div class="naverDiscussionMediaItem'+(contain?' is-contain':'')+'" style="--media-ratio:'+ratio.toFixed(4)+'" data-discussion-media-index="'+itemIndex+'" data-media-post-id="'+esc(post.id)+'" data-kind="'+(isVideo?'video':'image')+'">'+media+'</div>';
    }).join('');
    var count=multiple?'<span class="naverDiscussionMediaCount" aria-hidden="true"><b data-media-current>1</b>/'+sources.length+'</span>':'';
    var arrows=multiple?'<button class="naverDiscussionMediaArrow is-prev" type="button" data-media-prev aria-label="이전 사진" hidden></button><button class="naverDiscussionMediaArrow is-next" type="button" data-media-next aria-label="다음 사진"></button>':'';
    return '<div class="naverDiscussionMediaShell'+(multiple?' is-multi':' is-single')+'"'+(multiple?'':' style="--media-ratio:'+Math.max(1,sources[0].ratio?clampRatio(sources[0].ratio):16/9).toFixed(4)+'"')+'><div class="naverDiscussionMediaRail" tabindex="0" aria-label="'+esc(title)+' 사진과 영상 '+sources.length+'개, 좌우로 넘기기">'+items+'</div>'+arrows+count+'</div>';
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
    mediaCarousels.forEach(function(api){api.destroy();});
    mediaCarousels=[];
    phone.classList.remove('compactMode','feedCafeMode','redditFeedMode','chototFeedMode','chototBoardFeedMode','chototDealerFeedMode');
    phone.classList.add('naverDiscussionMode');
    typeLabel.textContent='네이버 토론형';
    list.className='list naverDiscussionList';
    list.innerHTML=feedBody();
    bind();
    hydrateLocalMedia();
  }
  function hydrateLocalMedia(){
    var elements=[].slice.call(list.querySelectorAll('[data-local-media-id]'));
    if(!elements.length||!window.indexedDB)return;
    var request=indexedDB.open('bbm-notion-write-media',1);
    request.onsuccess=function(){
      var db=request.result;
      elements.forEach(function(element){
        var read=db.transaction('media','readonly').objectStore('media').get(element.dataset.localMediaId);
        read.onsuccess=function(){if(!read.result)return;var objectUrl=URL.createObjectURL(read.result);element.src=objectUrl;if(element.tagName==='VIDEO')element.load();};
      });
    };
  }
  function bind(){
    initMediaCarousels();
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

  function measureLocalRatios(){
    list.querySelectorAll('img[data-measure-ratio]').forEach(function(img){
      function apply(){
        if(!img.naturalWidth||!img.naturalHeight)return;
        var r=clampRatio(img.naturalWidth/img.naturalHeight);
        var item=img.closest('.naverDiscussionMediaItem');
        var shell=img.closest('.naverDiscussionMediaShell');
        if(item)item.style.setProperty('--media-ratio',r.toFixed(4));
        if(shell&&shell.classList.contains('is-single'))shell.style.setProperty('--media-ratio',Math.max(1,r).toFixed(4));
        if(shell&&shell._discussionEmbla)shell._discussionEmbla.reInit();
      }
      if(img.complete)apply();else img.addEventListener('load',apply,{once:true});
    });
  }
  function initMediaCarousels(){
    measureLocalRatios();
    if(typeof window.EmblaCarousel!=='function')return;
    list.querySelectorAll('.naverDiscussionMediaShell.is-multi').forEach(function(shell){
      shell.classList.add('is-embla-ready');
      shell.dataset.carouselEngine='embla';
      var api=window.EmblaCarousel(shell,{
        align:'start',
        containScroll:'trimSnaps',
        dragFree:true,
        loop:false,
        duration:24
      });
      shell._discussionEmbla=api;
      var prev=shell.querySelector('[data-media-prev]');
      var next=shell.querySelector('[data-media-next]');
      var current=shell.querySelector('[data-media-current]');
      function sync(){
        if(prev)prev.hidden=!api.canScrollPrev();
        if(next)next.hidden=!api.canScrollNext();
        var scrollable=api.canScrollPrev()||api.canScrollNext();
        shell.classList.toggle('is-fit',!scrollable);
        if(current){
          var nodes=api.slideNodes();
          var left=shell.getBoundingClientRect().left;
          var first=0;
          /* 왼쪽 끝에 절반 이상 보이는 첫 사진의 번호 */
          for(var i=0;i<nodes.length;i++){var r=nodes[i].getBoundingClientRect();if(r.left+r.width/2>=left){first=i;break;}}
          /* 맨 끝에 닿으면 마지막 사진 번호를 보여 준다 */
          if(!api.canScrollNext())first=nodes.length-1;
          current.textContent=String(first+1);
        }
      }
      api.on('init',sync);api.on('scroll',sync);api.on('select',sync);api.on('reInit',sync);api.on('settle',sync);
      sync();
      api.on('pointerDown',function(){shell.classList.add('is-dragging');});
      api.on('pointerUp',function(){shell.classList.remove('is-dragging');});
      if(prev)prev.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();api.scrollPrev();});
      if(next)next.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();api.scrollNext();});
      /* PC 트랙패드·휠: 가로로 더 많이 움직였을 때만 사진을 넘긴다(세로 스크롤은 그대로) */
      var wheelSum=0,wheelTimer=0,wheelLock=false;
      shell.addEventListener('wheel',function(event){
        var dx=event.deltaX||(event.shiftKey?event.deltaY:0);
        if(Math.abs(dx)<=Math.abs(event.shiftKey?0:event.deltaY))return;
        event.preventDefault();
        wheelSum+=dx;
        clearTimeout(wheelTimer);
        wheelTimer=setTimeout(function(){wheelSum=0;wheelLock=false;},180);
        if(wheelLock||Math.abs(wheelSum)<30)return;
        wheelLock=true;
        if(wheelSum>0)api.scrollNext();else api.scrollPrev();
        wheelSum=0;
      },{passive:false});
      shell.addEventListener('keydown',function(event){
        if(event.key==='ArrowRight'){event.preventDefault();api.scrollNext();}
        if(event.key==='ArrowLeft'){event.preventDefault();api.scrollPrev();}
      });
      mediaCarousels.push(api);
    });
  }

  window.renderNaverDiscussionFeed=render;
  if(new URLSearchParams(location.search).get('view')==='naver-discussion')render();
})();
