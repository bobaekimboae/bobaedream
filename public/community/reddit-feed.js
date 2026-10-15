(function(){
  'use strict';

  var posts=(window.BOBAE_POSTS||[]).slice(0,5);
  var list=document.getElementById('list');
  var phone=document.querySelector('.phone');
  var typeLabel=document.getElementById('typeLabel');

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }

  function cleanTitle(title){
    return String(title||'').replace(/^\[[^\]]+\]\s*/,'');
  }

  function icon(name){
    return 'assets/chzzk-detail/icons/'+name+'.svg?v=20261015redditfeed1';
  }

  function mediaFor(post,index){
    if(index===0||!post.detailImage) return '';
    return '<a class="redditFeedMedia" href="./chzzk-detail.html?id='+post.id+'&v=20261015redditfeed1" aria-label="'+esc(cleanTitle(post.title))+' 상세 보기"><img src="'+esc(post.detailImage)+'" alt="'+esc(cleanTitle(post.title))+'" loading="lazy"></a>';
  }

  function card(post,index){
    var body=Array.isArray(post.body)&&post.body.length?post.body[0]:'실사용하면서 확인한 내용을 사진과 함께 공유합니다.';
    var avatars=[
      'assets/chzzk-detail/author-avatar.png',
      'assets/chzzk-detail/comment-avatar.gif',
      'assets/chzzk-detail/default-user.png',
      'assets/chzzk-detail/chzzk-operator-avatar.png',
      'assets/chzzk-detail/comment-anonymous-avatar.png'
    ];
    var avatar=avatars[index%avatars.length];
    var category=post.category||'자유게시판';
    return [
      '<article class="redditFeedCard" data-post-id="'+post.id+'">',
        '<div class="redditFeedIdentity">',
          '<img class="redditFeedAvatar" src="'+esc(avatar)+'" alt="'+esc(post.user)+' 프로필">',
          '<div class="redditFeedAuthor">'+esc(post.user)+'<time>'+esc(post.time)+'</time></div>',
          '<button class="redditFeedMore" type="button" aria-label="게시물 더보기"><img src="'+icon('more-reddit')+'" alt=""></button>',
        '</div>',
        '<a class="redditFeedTitle" href="./chzzk-detail.html?id='+post.id+'&v=20261015redditfeed1">'+esc(cleanTitle(post.title))+'</a>',
        '<span class="redditFeedTag">'+esc(category)+'</span>',
        '<p class="redditFeedPreview">'+esc(body)+'</p>',
        mediaFor(post,index),
        '<div class="redditFeedActions" aria-label="게시물 반응">',
          '<div class="redditActionPill">',
            '<button class="redditVoteButton" type="button" data-vote="up" aria-label="추천" aria-pressed="false"><img src="'+icon('vote-up')+'" alt=""><span class="redditScore">0</span></button>',
            '<span class="redditVoteDivider" aria-hidden="true"></span>',
            '<button class="redditVoteButton" type="button" data-vote="down" aria-label="비추천" aria-pressed="false"><img src="'+icon('vote-down')+'" alt=""></button>',
          '</div>',
          '<button class="redditActionButton" type="button" data-comment="'+post.id+'" aria-label="댓글 '+post.reply+'개"><img src="'+icon('comment-reddit')+'" alt=""><span>'+post.reply+'</span></button>',
          '<button class="redditActionButton reshare" type="button" data-reshare="'+post.id+'" aria-label="재공유"><img src="'+icon('refresh')+'" alt=""></button>',
          '<button class="redditActionButton" type="button" data-share="'+post.id+'" aria-label="공유"><img src="'+icon('share-reddit')+'" alt=""></button>',
        '</div>',
      '</article>'
    ].join('');
  }

  function ensureRecommendation(){
    var element=document.getElementById('redditRecommendation');
    if(element) return element;
    element=document.createElement('aside');
    element.id='redditRecommendation';
    element.className='redditRecommendation';
    element.setAttribute('role','status');
    element.innerHTML='<p>보배드림 커뮤니티에서 이 게시물을 좋아할 수도 있습니다</p><button type="button">공유</button>';
    document.body.appendChild(element);
    element.querySelector('button').addEventListener('click',function(){
      sharePost(element.dataset.postId||'1');
    });
    return element;
  }

  var recommendationTimer=0;
  function showRecommendation(postId){
    var element=ensureRecommendation();
    element.dataset.postId=postId;
    element.classList.add('show');
    clearTimeout(recommendationTimer);
    recommendationTimer=setTimeout(function(){element.classList.remove('show');},3600);
  }

  function setVote(button){
    var cardElement=button.closest('.redditFeedCard');
    var up=cardElement.querySelector('[data-vote="up"]');
    var down=cardElement.querySelector('[data-vote="down"]');
    var score=up.querySelector('.redditScore');
    var next=button.dataset.vote;
    var active=button.getAttribute('aria-pressed')==='true';
    up.classList.remove('is-up');
    down.classList.remove('is-down');
    up.setAttribute('aria-pressed','false');
    down.setAttribute('aria-pressed','false');
    score.textContent='0';
    if(active) return;
    button.setAttribute('aria-pressed','true');
    if(next==='up'){
      up.classList.add('is-up');
      score.textContent='1';
      showRecommendation(cardElement.dataset.postId);
    }else{
      down.classList.add('is-down');
      score.textContent='-1';
    }
  }

  async function sharePost(postId){
    var post=posts.find(function(candidate){return String(candidate.id)===String(postId);})||posts[0];
    var url=new URL('./chzzk-detail.html?id='+post.id,location.href).href;
    var payload={title:cleanTitle(post.title),text:cleanTitle(post.title),url:url};
    try{
      if(navigator.share){await navigator.share(payload);return;}
      await navigator.clipboard.writeText(url);
    }catch(error){
      if(error&&error.name==='AbortError') return;
    }
    var element=ensureRecommendation();
    element.querySelector('p').textContent='게시물 링크를 복사했습니다';
    element.classList.add('show');
    clearTimeout(recommendationTimer);
    recommendationTimer=setTimeout(function(){
      element.classList.remove('show');
      element.querySelector('p').textContent='보배드림 커뮤니티에서 이 게시물을 좋아할 수도 있습니다';
    },2200);
  }

  function bind(){
    list.querySelectorAll('[data-vote]').forEach(function(button){
      button.addEventListener('click',function(){setVote(button);});
    });
    list.querySelectorAll('[data-comment]').forEach(function(button){
      button.addEventListener('click',function(){location.href='./chzzk-detail.html?id='+button.dataset.comment+'#comments';});
    });
    list.querySelectorAll('[data-reshare]').forEach(function(button){
      button.addEventListener('click',function(){showRecommendation(button.dataset.reshare);});
    });
    list.querySelectorAll('[data-share]').forEach(function(button){
      button.addEventListener('click',function(){sharePost(button.dataset.share);});
    });
    list.querySelectorAll('.redditFeedMore').forEach(function(button){
      button.addEventListener('click',function(){
        var element=ensureRecommendation();
        element.querySelector('p').textContent='게시물 메뉴를 준비 중입니다';
        element.classList.add('show');
        clearTimeout(recommendationTimer);
        recommendationTimer=setTimeout(function(){
          element.classList.remove('show');
          element.querySelector('p').textContent='보배드림 커뮤니티에서 이 게시물을 좋아할 수도 있습니다';
        },1800);
      });
    });
    list.querySelector('[data-reddit-options]')?.addEventListener('click',function(){
      document.getElementById('viewBtn')?.click();
    });
  }

  window.renderRedditFeed=function(){
    phone.classList.remove('compactMode','feedCafeMode','chototFeedMode');
    phone.classList.add('redditFeedMode');
    typeLabel.textContent='피드형';
    list.className='list redditFeedList';
    list.innerHTML='<div class="redditFeedControls"><button class="redditFeedOption" type="button" data-reddit-options><img src="assets/chzzk-detail/icons/filter.svg" alt="">피드 옵션</button></div>'+posts.map(card).join('');
    bind();
  };

  var view=new URLSearchParams(location.search).get('view');
  if(view==='reddit'||view==='feed') window.renderRedditFeed();
})();
