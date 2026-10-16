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

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];});
  }
  function posts(){return (window.BOBAE_POSTS||[]).slice();}
  function cleanTitle(value){return String(value||'').replace(/^\[[^\]]+\]\s*/,'');}
  function bodyFor(post,index){return Array.isArray(post.body)&&post.body.length?post.body[0]:bodyFallbacks[index%bodyFallbacks.length];}
  function avatarFor(post,index){return post.authorAvatar||'assets/profile-avatars/avatar-'+String(index%20+1).padStart(2,'0')+'.svg';}
  function detailUrl(post){return './chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261016naverdiscussion2';}
  function icon(name){return 'assets/chzzk-detail/icons/'+name+'.svg?v=20261016naverdiscussion2';}
  function categoryFor(post){return post.category||String(post.title||'').match(/^\[([^\]]+)\]/)?.[1]||'자유';}
  function metric(value){
    var number=Math.max(0,Number(value)||0);
    if(number>=10000){var man=Math.floor(number/1000)/10;return (man%1===0?String(man):man.toFixed(1))+'만';}
    if(number>=1000){var thousand=Math.floor(number/100)/10;return (thousand%1===0?String(thousand):thousand.toFixed(1))+'천';}
    return String(number);
  }
  function mediaFor(post){
    if(!post.detailImage)return '';
    return '<a class="naverDiscussionMedia" href="'+detailUrl(post)+'" aria-label="'+esc(cleanTitle(post.title))+' 이미지와 상세 보기"><img src="'+esc(post.detailImage)+'" alt="" loading="lazy"></a>';
  }
  function card(post,index){
    var likes=Math.max(0,Math.round(Number(post.view||0)/23)+Number(post.reply||0));
    var dislikes=Math.max(0,Math.round(Number(post.reply||0)/7));
    return '<article class="naverDiscussionCard" data-discussion-post="'+esc(post.id)+'"><span class="naverDiscussionCategory">'+esc(categoryFor(post))+'</span><div class="naverDiscussionIdentity"><img class="naverDiscussionAvatar" src="'+esc(avatarFor(post,index))+'" alt="'+esc(post.user)+' 프로필"><strong class="naverDiscussionAuthor">'+esc(post.user)+'</strong><time class="naverDiscussionTime">'+esc(post.time)+'</time></div><a class="naverDiscussionTitle" href="'+detailUrl(post)+'">'+esc(cleanTitle(post.title))+'</a><p class="naverDiscussionBody">'+esc(bodyFor(post,index))+'</p>'+mediaFor(post)+'<div class="naverDiscussionMetrics" aria-label="게시물 반응"><button class="naverDiscussionMetric" type="button" data-discussion-vote="up" aria-pressed="false"><img src="'+icon('buff')+'" alt="">버프 <span>'+metric(likes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-vote="down" aria-pressed="false"><img src="'+icon('nerf')+'" alt="">너프 <span>'+metric(dislikes)+'</span></button><button class="naverDiscussionMetric" type="button" data-discussion-comment="'+esc(post.id)+'" aria-label="댓글 '+Number(post.reply||0).toLocaleString('ko-KR')+'개"><img src="'+icon('comment-reddit')+'" alt="">'+metric(post.reply)+'</button><span class="naverDiscussionViews">조회 '+Number(post.view||0).toLocaleString('ko-KR')+'</span></div></article>';
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
    list.querySelectorAll('[data-discussion-vote]').forEach(function(button){button.addEventListener('click',function(){var active=button.getAttribute('aria-pressed')==='true';var cardElement=button.closest('.naverDiscussionCard');cardElement.querySelectorAll('[data-discussion-vote]').forEach(function(other){other.classList.remove('is-active');other.setAttribute('aria-pressed','false');});if(!active){button.classList.add('is-active');button.setAttribute('aria-pressed','true');}});});
    list.querySelectorAll('[data-discussion-comment]').forEach(function(button){button.addEventListener('click',function(){location.href='./chzzk-detail.html?id='+encodeURIComponent(button.dataset.discussionComment)+'#comments';});});
  }

  window.renderNaverDiscussionFeed=render;
  if(new URLSearchParams(location.search).get('view')==='naver-discussion')render();
})();
