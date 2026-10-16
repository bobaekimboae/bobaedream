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
  var activeHeadword='전체';
  function selectedHeadword(){return activeHeadword;}
  function posts(){
    var data=(window.BOBAE_POSTS||[]).slice();
    var localPost=window.BOBAE_LOCAL_POST;
    var activeBoard=window.BBM_GET_ACTIVE_BOARD_TABLE?window.BBM_GET_ACTIVE_BOARD_TABLE():'';
    var activeTable=activeBoard&&window.BBM_BOARD_TABLES?window.BBM_BOARD_TABLES[activeBoard]:null;
    var localPostMatches=!activeTable||Boolean(localPost&&localPost.board&&localPost.board===activeTable.displayName);
    var alreadyIncluded=localPost&&data.some(function(post){return String(post.id)===String(localPost.id);});
    if(localPost&&activeBoard!=='best'&&localPostMatches&&!alreadyIncluded)data.unshift(localPost);
    var headword=selectedHeadword();
    if(headword==='전체')return data;
    return data.filter(function(post){return categoryFor(post)===headword;});
  }
  function syncHeadwords(){
    var items=Array.isArray(window.BOBAE_TOPICS)&&window.BOBAE_TOPICS.length?window.BOBAE_TOPICS:['전체'];
    if(items.indexOf(activeHeadword)<0)activeHeadword='전체';
    var container=document.getElementById('category');
    if(!container)return;
    container.innerHTML=items.map(function(item,index){return '<button class="cat '+(item===activeHeadword?'on':'')+'" type="button" data-discussion-headword="'+esc(item)+'" aria-pressed="'+(item===activeHeadword?'true':'false')+'">'+esc(item)+'</button>';}).join('');
    container.querySelectorAll('[data-discussion-headword]').forEach(function(button){
      button.addEventListener('click',function(){activeHeadword=button.dataset.discussionHeadword;render();});
    });
    var selected=container.querySelector('.cat.on');
    if(selected)selected.scrollIntoView({inline:'center',block:'nearest'});
  }
  function cleanTitle(value){return String(value||'').replace(/^\[[^\]]+\]\s*/,'');}
  function bodyFor(post,index){
    if(post.hideBody)return '작성자가 본문을 숨긴 글입니다.';
    if(Array.isArray(post.body)&&post.body.length){
      return post.board==='foreign-car-news'?post.body.slice(0,3).join('\n'):post.body[0];
    }
    return bodyFallbacks[index%bodyFallbacks.length];
  }
  function avatarFor(post,index){return post.authorAvatar||'assets/profile-avatars/avatar-'+String(index%48+1).padStart(2,'0')+'.svg';}
  function detailUrl(post,photoIndex){return './chzzk-detail.html?id='+encodeURIComponent(post.id)+(post.local?'&local=1':'')+'&from=discussion'+(photoIndex>0?'&photo='+(photoIndex+1):'')+'&v=20261016naverdiscussion3';}
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
    return '<article class="naverDiscussionCard" data-discussion-post="'+esc(post.id)+'"><span class="naverDiscussionCategory">'+esc(categoryFor(post))+'</span><div class="naverDiscussionIdentity"><img class="naverDiscussionAvatar" src="'+esc(avatarFor(post,index))+'" alt="'+esc(post.user)+' 프로필"><strong class="naverDiscussionAuthor">'+esc(post.user)+'</strong><time class="naverDiscussionTime">'+esc(post.time)+'</time></div><a class="naverDiscussionTitle" href="'+detailUrl(post)+'">'+esc(cleanTitle(post.title))+'</a><p class="naverDiscussionBody">'+esc(bodyFor(post,index))+'</p>'+(mediaFor(post,index)||embedInlineFor(post)||newsCardFor(post))+'<div class="naverDiscussionMetrics" aria-label="게시물 반응"><button class="naverDiscussionMetric" type="button" data-discussion-vote="up" aria-label="버프 '+metric(likes)+'" aria-pressed="false"><img src="'+icon('buff')+'" alt=""><span>'+metric(likes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-vote="down" aria-label="너프 '+metric(dislikes)+'" aria-pressed="false"><img src="'+icon('nerf')+'" alt=""><span>'+metric(dislikes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-comment="'+esc(post.id)+'" aria-label="댓글 '+Number(post.reply||0).toLocaleString('ko-KR')+'개"><img src="'+icon('comment-reddit')+'" alt="">'+metric(post.reply)+'</button><span class="naverDiscussionViews">조회 '+Number(post.view||0).toLocaleString('ko-KR')+'</span></div></article>';
  }
  /* 글쓰기에서 넣은 링크·뉴스 카드(첫 번째 것만 피드에 보여 준다) */
  function firstEmbed(post){return Array.isArray(post.embeds)&&post.embeds.length?post.embeds[0]:null;}
  function newsCardFor(post){
    var item=firstEmbed(post);
    if(!item)return '';
    var host=String(item.url||'').replace(/^https?:\/\/(www\.)?/,'').split('/')[0];
    var overseas=item.lang&&!/^ko/i.test(item.lang);
    var logo=item.logo||(window.BBM_EMBED&&window.BBM_EMBED.faviconFor?window.BBM_EMBED.faviconFor(item.url):'');
    var hydrate=!item.image&&!item.metaReady&&!item.noHydrate?' data-news-hydrated data-embed-hydrate data-embed-title="'+esc(cleanTitle(post.title))+'"':' data-news-hydrated';
    var media=item.image?'<span class="news-card-image"><img src="'+esc(item.image)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></span>':'<span class="news-card-placeholder" aria-hidden="true"><img src="assets/write-parity/link.svg" alt=""></span>';
    return '<a class="news-card"'+hydrate+' href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">'+media+'<span class="news-card-copy"><span class="news-card-site">'+(logo?'<img src="'+esc(logo)+'" alt="" referrerpolicy="no-referrer"'+(/google\.com\/s2\/favicons/.test(logo)?' onload="if(this.naturalWidth<=16)this.remove()"':'')+' onerror="this.remove()">':'')+'<span>'+esc(item.site||item.provider||host)+'</span>'+(overseas?'<em>해외</em>':'')+'</span><strong class="news-card-title">'+esc(item.title||cleanTitle(post.title)||host)+'</strong>'+(item.description?'<span class="news-card-desc">'+esc(item.description)+'</span>':'')+'<small class="news-card-url">'+esc(host)+'</small></span></a>';
  }
  /* 첫 임베드가 인스타그램·유튜브 같은 재생형이면 피드 카드 안에서 바로 보여 준다 */
  function embedInlineFor(post,autoplay){
    var item=firstEmbed(post);
    if(!item||item.render!=='iframe'||!window.BBM_EMBED)return '';
    /* 레딧 목록처럼 썸네일 + 재생 버튼만, 누르면 그 자리에서 재생. 썸네일형 타일을 눌러 펼칠 때는 바로 재생(autoplay) */
    return '<div class="naverDiscussionEmbed'+(item.tall?' is-tall':'')+'">'+(autoplay?window.BBM_EMBED.frameHtml(item,{autoplay:true}):window.BBM_EMBED.previewHtml(item))+'</div>';
  }
  /* 좌측 썸네일형(네이버페이 증권 토론방 목록): 글쓴이 줄 → 왼쪽 72px 썸네일 + 제목·본문 2줄 → 반응 줄 */
  function thumbCard(post,index){
    var table=Boolean(post.boardTable);
    var likes=table?Number(post.likes)||0:Math.max(0,Math.round(Number(post.view||0)/23)+Number(post.reply||0));
    var dislikes=table?0:Math.max(0,Math.round(Number(post.reply||0)/7));
    var photos=mediaSources(post,index).filter(function(item){return item.kind==='image'&&item.src;});
    var embedItem=(Array.isArray(post.embeds)?post.embeds:[]).filter(function(e){return e&&e.image;})[0]||null;
    var thumbSrc=photos.length?photos[0].src:(post.thumb||(embedItem&&embedItem.image)||'');
    var count=photos.length;
    var title=cleanTitle(post.title);
    var avatar=avatarFor(post,index);
    var playEmbed=!photos.length&&firstEmbed(post)&&firstEmbed(post).render==='iframe'?firstEmbed(post):null;
    var playImage=playEmbed&&playEmbed.image?'<img src="'+esc(playEmbed.image)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'';
    var thumb=playEmbed?'<span class="naverDiscussionThumb is-play'+(playImage?' has-image':'')+'" role="button" tabindex="0" data-discussion-play="'+esc(post.id)+'" aria-label="'+esc(playEmbed.provider)+' 목록에서 재생">'+playImage+'<span class="naverDiscussionThumbPlay"></span><small>'+esc(playEmbed.provider)+'</small></span>':thumbSrc?'<span class="naverDiscussionThumb"><img src="'+esc(thumbSrc)+'" alt="" loading="'+(index<4?'eager':'lazy')+'" referrerpolicy="no-referrer" onerror="this.parentNode.remove()">'+(count>1?'<b class="naverDiscussionThumbCount">'+count+'</b>':'')+'</span>':'';
    return '<article class="naverDiscussionCard is-thumb" data-discussion-post="'+esc(post.id)+'"><span class="naverDiscussionCategory">'+esc(categoryFor(post))+'</span><div class="naverDiscussionIdentity"><img class="naverDiscussionAvatar" src="'+esc(avatar)+'" alt="'+esc(post.user)+' 프로필"><strong class="naverDiscussionAuthor">'+esc(post.user)+'</strong><time class="naverDiscussionTime">'+esc(post.time)+'</time></div><a class="naverDiscussionThumbMain" href="'+detailUrl(post)+'"><span class="naverDiscussionThumbText"><strong class="naverDiscussionTitle">'+esc(title)+'</strong><span class="naverDiscussionBody">'+esc(bodyFor(post,index))+'</span></span>'+thumb+'</a><div class="naverDiscussionMetrics" aria-label="게시물 반응"><button class="naverDiscussionMetric" type="button" data-discussion-vote="up" aria-label="버프 '+metric(likes)+'" aria-pressed="false"><img src="'+icon('buff')+'" alt=""><span>'+metric(likes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-vote="down" aria-label="너프 '+metric(dislikes)+'" aria-pressed="false"><img src="'+icon('nerf')+'" alt=""><span>'+metric(dislikes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-comment="'+esc(post.id)+'" aria-label="댓글 '+Number(post.reply||0).toLocaleString('ko-KR')+'개"><img src="'+icon('comment-reddit')+'" alt="">'+metric(post.reply)+'</button><span class="naverDiscussionViews">조회 '+Number(post.view||0).toLocaleString('ko-KR')+'</span></div></article>';
  }
  function loungeBestCard(post,index,showRank){
    var photos=mediaSources(post,index).filter(function(item){return item.kind==='image'&&item.src;});
    var thumbSrc=photos.length?photos[0].src:(post.thumb||'');
    var thumb=thumbSrc?'<span class="loungeBestThumb"><img src="'+esc(thumbSrc)+'" alt="" loading="'+(index<4?'eager':'lazy')+'" referrerpolicy="no-referrer" onerror="this.parentNode.remove()">'+(photos.length>1?'<b>'+photos.length+'</b>':'')+'</span>':'';
    var rank=showRank?'<span class="loungeBestRank">'+(index+1)+'</span>':'';
    return '<a class="loungeBestRow" href="'+detailUrl(post)+'" data-lounge-best-post="'+esc(post.id)+'">'+rank+'<span class="loungeBestCopy"><span class="loungeBestTitleLine"><strong>'+esc(cleanTitle(post.title))+'</strong>'+(Number(post.reply||0)>0?'<b class="loungeBestReply">'+metric(post.reply)+'</b>':'')+'</span><span class="loungeBestMeta"><span>'+esc(categoryFor(post))+'</span><span>조회 '+metric(post.view)+'</span></span></span>'+thumb+'</a>';
  }
  function loungeBestTime(){
    var hour=new Date().getHours();
    return (hour<12?'오전 ':'오후 ')+(hour%12||12)+'시 기준';
  }
  function renderLoungeBest(viewMode){
    var clean=viewMode==='lounge-best-clean'||viewMode==='lounge-best-left';
    var left=viewMode==='lounge-best-left';
    var data=posts();
    syncHeadwords();
    phone.classList.remove('compactMode','feedCafeMode','cafeLeftMode','naverCafePopularMode','redditFeedMode','chototFeedMode','chototBoardFeedMode','chototDealerFeedMode','naverDiscussionThumbMode');
    phone.classList.add('naverDiscussionMode','loungeBestMode');
    phone.classList.toggle('loungeBestCleanMode',!!clean);
    phone.classList.toggle('loungeBestLeftMode',left);
    typeLabel.textContent=left?'라운지 썸네일 좌측형':clean?'라운지 간결형':'라운지 인기글형';
    list.className='list loungeBestList';
    list.innerHTML='<section class="loungeBestIntro" aria-labelledby="loungeBestHeading"><div class="loungeBestHead"><h2 id="loungeBestHeading"><em>지금</em> 보배드림 트렌드<img src="../assets/bbm/header-notification.svg" alt=""></h2><button class="loungeBestTime" type="button" data-lounge-best-info aria-expanded="false">'+loungeBestTime()+'<span aria-hidden="true">i</span></button></div><div class="loungeBestInfo" data-lounge-best-popover hidden><strong>인기 게시글 선정 기준</strong><p>게시글의 조회·댓글·추천 반응을 종합해 순위를 업데이트합니다.</p><button type="button" data-lounge-best-close aria-label="선정 기준 닫기"><img src="'+icon('close')+'" alt=""></button></div></section><div class="loungeBestRows">'+(data.length?data.map(function(post,index){return loungeBestCard(post,index,!clean)}).join(''):'<div class="loungeBestEmpty">등록된 베스트글이 없습니다.</div>')+'</div>';
    var info=list.querySelector('[data-lounge-best-info]');
    var popover=list.querySelector('[data-lounge-best-popover]');
    var close=list.querySelector('[data-lounge-best-close]');
    function setInfo(open){popover.hidden=!open;info.setAttribute('aria-expanded',String(open));}
    info.addEventListener('click',function(){setInfo(popover.hidden);});
    close.addEventListener('click',function(){setInfo(false);info.focus();});
  }
  var activeRankingMetric=(function(value){return value==='comment'||value==='recommend'?value:'popular';})(new URLSearchParams(location.search).get('ranking'));
  function rankingValue(post,metricName){
    if(metricName==='comment')return Number(post.reply)||0;
    if(metricName==='recommend')return Number(post.likes)||0;
    return Number(post.view)||0;
  }
  function rankingMeta(post,metricName){
    if(metricName==='comment')return '<img src="assets/chzzk-detail/icons/comment-reddit.svg" alt=""><span class="blind">댓글수</span>'+Number(post.reply||0).toLocaleString('ko-KR');
    if(metricName==='recommend')return '<img src="assets/reddit-ui/recommend-thumb-up.svg" alt=""><span class="blind">추천수</span>'+Number(post.likes||0).toLocaleString('ko-KR');
    return '<img src="assets/reddit-ui/view-count.svg" alt=""><span class="blind">조회수</span>'+Number(post.view||0).toLocaleString('ko-KR');
  }
  function naverRankingCard(post,index){
    var photos=mediaSources(post,index).filter(function(item){return item.kind==='image'&&item.src;});
    var thumbSrc=photos.length?photos[0].src:(post.thumb||'');
    var thumb=thumbSrc?'<span class="naverRankingThumb"><img src="'+esc(thumbSrc)+'" alt="" loading="'+(index<4?'eager':'lazy')+'" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></span>':'';
    return '<a class="naverRankingRow'+(thumb?'':' no-thumb')+'" href="'+detailUrl(post)+'" data-naver-ranking-post="'+esc(post.id)+'">'+thumb+'<span class="naverRankingCopy"><strong>'+esc(cleanTitle(post.title))+'</strong><span>'+rankingMeta(post,activeRankingMetric)+'</span></span></a>';
  }
  function naverRankingGroups(data){
    var groups=[];
    for(var start=0;start<data.length;start+=10){
      var chunk=data.slice(start,start+10);
      var split=Math.min(5,chunk.length);
      var left=chunk.slice(0,split).map(function(post,index){return naverRankingCard(post,start+index);}).join('');
      var right=chunk.slice(split).map(function(post,index){return naverRankingCard(post,start+split+index);}).join('');
      groups.push('<section class="naverRankingGroup"><div class="naverRankingColumn">'+left+'</div>'+(right?'<div class="naverRankingColumn">'+right+'</div>':'')+'</section>');
    }
    return groups.join('');
  }
  function renderNaverRanking(){
    var data=posts().sort(function(a,b){var diff=rankingValue(b,activeRankingMetric)-rankingValue(a,activeRankingMetric);return diff||Number(b.id)-Number(a.id);});
    syncHeadwords();
    phone.classList.remove('compactMode','feedCafeMode','cafeLeftMode','naverCafePopularMode','redditFeedMode','chototFeedMode','chototBoardFeedMode','chototDealerFeedMode','naverDiscussionThumbMode','loungeBestMode','loungeBestCleanMode','loungeBestLeftMode');
    phone.classList.add('naverDiscussionMode','naverRankingMode');
    typeLabel.textContent='네이버 랭킹뉴스형';
    list.className='list naverRankingList';
    var tabs=[['popular','많이 본'],['comment','댓글 많은'],['recommend','추천 많은']];
    list.innerHTML='<section class="naverRankingHeader"><div class="naverRankingTabs" role="tablist" aria-label="랭킹 기준">'+tabs.map(function(tab){var on=tab[0]===activeRankingMetric;return '<button type="button" role="tab" aria-selected="'+on+'" class="'+(on?'on':'')+'" data-ranking-metric="'+tab[0]+'"><span>'+tab[1]+'</span></button>';}).join('')+'</div><div class="naverRankingHeading"><strong>'+tabs.filter(function(tab){return tab[0]===activeRankingMetric;})[0][1]+' 랭킹</strong><button type="button" data-ranking-info aria-label="랭킹 집계 기준 안내" aria-expanded="false"><img src="../icons/chotot/chotot-common-info.svg" alt=""></button><div class="naverRankingPopover" data-ranking-popover hidden>조회·댓글·추천 반응을 기준으로 정렬합니다.<br>실시간 수치와 다를 수 있습니다.</div></div></section><div class="naverRankingRows">'+(data.length?naverRankingGroups(data):'<div class="loungeBestEmpty">등록된 베스트글이 없습니다.</div>')+'</div>';
    list.querySelectorAll('[data-ranking-metric]').forEach(function(button){button.addEventListener('click',function(){activeRankingMetric=button.dataset.rankingMetric;renderNaverRanking();});});
    var info=list.querySelector('[data-ranking-info]'),popover=list.querySelector('[data-ranking-popover]');
    info.addEventListener('click',function(){var open=popover.hidden;popover.hidden=!open;info.setAttribute('aria-expanded',String(open));});
  }
  var currentVariant='';
  function feedBody(){
    var data=posts();
    if(!data.length)return '<div style="padding:44px 16px;color:#858990;font-size:14px;text-align:center">등록된 글이 없습니다.</div>';
    return data.map(currentVariant==='thumb'?thumbCard:card).join('');
  }
  function render(variant){
    if(window.BBM_GET_ACTIVE_BOARD_TABLE&&window.BBM_GET_ACTIVE_BOARD_TABLE()==='vehicle-review'){
      if(window.renderVehicleReviewBoardTable)window.renderVehicleReviewBoardTable({posts:(window.BOBAE_POSTS||[]).slice()});
      return;
    }
    if(window.BBM_GET_ACTIVE_BOARD_TABLE&&window.BBM_GET_ACTIVE_BOARD_TABLE()==='best'){
      currentVariant='lounge-best';
      mediaCarousels.forEach(function(api){api.destroy();});
      mediaCarousels=[];
      var bestView=(window.BBM_GET_VIEW_MODE&&window.BBM_GET_VIEW_MODE())||variant;
      if(bestView==='naver-ranking-news')renderNaverRanking();else renderLoungeBest(bestView);
      return;
    }
    currentVariant=variant==='thumb'?'thumb':'';
    mediaCarousels.forEach(function(api){api.destroy();});
    mediaCarousels=[];
    syncHeadwords();
    phone.classList.remove('compactMode','feedCafeMode','cafeLeftMode','naverCafePopularMode','redditFeedMode','chototFeedMode','chototBoardFeedMode','chototDealerFeedMode','loungeBestMode','loungeBestCleanMode','loungeBestLeftMode','naverRankingMode');
    phone.classList.add('naverDiscussionMode');
    phone.classList.toggle('naverDiscussionThumbMode',currentVariant==='thumb');
    typeLabel.textContent=currentVariant==='thumb'?'네이버 토론 · 좌측 썸네일':'네이버 토론형';
    list.className='list naverDiscussionList'+(currentVariant==='thumb'?' is-thumb':'');
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
  /* 피드의 뉴스 카드는 주소만 있으므로 제목·요약·대표 이미지를 불러와 채운다 */
  function hydrateNewsCards(){
    if(!window.BBM_EMBED||!window.BBM_EMBED.fetchMeta||!window.BBM_EMBED.cardHtml)return;
    list.querySelectorAll('a.news-card:not([data-news-hydrated])').forEach(function(card){
      card.setAttribute('data-news-hydrated','');
      if(card.querySelector('.news-card-image'))return;
      var url=card.getAttribute('href');
      window.BBM_EMBED.fetchMeta(url).then(function(meta){
        if(!meta||!card.isConnected||!(meta.title||meta.image))return;
        var item=Object.assign({url:url},meta);
        var holder=document.createElement('div');
        holder.innerHTML=window.BBM_EMBED.cardHtml(item);
        var next=holder.firstElementChild;
        if(next){next.setAttribute('data-news-hydrated','');card.replaceWith(next);}
      }).catch(function(){});
    });
  }
  function bind(){
    initMediaCarousels();
    if(window.BBM_EMBED&&window.BBM_EMBED.hydratePreviews)window.BBM_EMBED.hydratePreviews(list);
    if(window.BBM_EMBED&&window.BBM_EMBED.hydrateCards)window.BBM_EMBED.hydrateCards(list);
    hydrateNewsCards();
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
    /* 썸네일형: 재생 타일을 누르면 상세로 가지 않고 카드 아래에 릴스·영상을 펼쳐 바로 재생, 다시 누르면 접기 */
    list.querySelectorAll('[data-discussion-play]').forEach(function(tile){
      function toggle(event){
        event.preventDefault();event.stopPropagation();
        var cardElement=tile.closest('.naverDiscussionCard');
        var open=cardElement.querySelector('.naverDiscussionEmbed');
        if(open){open.remove();tile.classList.remove('is-open');tile.setAttribute('aria-expanded','false');return;}
        var post=posts().filter(function(p){return String(p.id)===tile.dataset.discussionPlay;})[0];
        var html=post&&embedInlineFor(post,true);
        if(!html)return;
        cardElement.querySelector('.naverDiscussionThumbMain').insertAdjacentHTML('afterend',html);
        tile.classList.add('is-open');tile.setAttribute('aria-expanded','true');
      }
      tile.addEventListener('click',toggle);
      tile.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' ')toggle(event);});
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
  /* 목록 페이지의 현재 보기 방식(mode)을 따른다. 게시판 기본 보기(자동차뉴스 = 좌측 썸네일)도 여기서 반영된다 */
  var startMode=(window.BBM_GET_VIEW_MODE&&window.BBM_GET_VIEW_MODE())||new URLSearchParams(location.search).get('view');
  var activeBoardTable=window.BBM_GET_ACTIVE_BOARD_TABLE&&window.BBM_GET_ACTIVE_BOARD_TABLE();
  if(activeBoardTable!=='vehicle-review'){
    if(startMode==='naver-discussion')render();
    else if(startMode==='naver-discussion-thumb')render('thumb');
    else if(startMode==='lounge-best-rank'||startMode==='lounge-best-clean'||startMode==='lounge-best-left'||startMode==='naver-ranking-news')render(startMode);
  }
})();
