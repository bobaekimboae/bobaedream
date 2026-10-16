(function(){
  'use strict';

  var section=document.getElementById('popularSection');
  var toggle=document.getElementById('popularToggle');
  var track=document.getElementById('popularTrack');
  if(!section||!toggle||!track)return;

  function esc(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }

  function cleanTitle(value){
    return String(value||'').replace(/^\[[^\]]+\]\s*/,'');
  }

  function imageFor(post,index){
    if(post.detailImage)return post.detailImage;
    if(post.thumbnail)return post.thumbnail.replace('w=220','w=520');
    var fallback=['photo-1617788138017-80ad40651399','photo-1563720223185-11003d516935','photo-1542362567-b07e54358753'];
    return 'https://images.unsplash.com/'+fallback[index%fallback.length]+'?auto=format&fit=crop&w=520&q=82';
  }

  function render(){
    var source=(window.BOBAE_POSTS||[]).slice();
    var popular=source.sort(function(a,b){
      return (Number(b.reply)||0)+(Number(b.likes)||0)*8-(Number(a.reply)||0)-(Number(a.likes)||0)*8;
    }).slice(0,5);
    track.innerHTML=popular.map(function(post,index){
      var textOnly=index===1;
      var title=cleanTitle(post.title);
      var href='./chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261016popular1';
      return '<a class="popularCard '+(textOnly?'isText':'')+'" href="'+href+'" aria-label="인기글: '+esc(title)+'">'+
        (textOnly?'':'<img class="popularCardMedia" src="'+esc(imageFor(post,index))+'" alt="" loading="lazy"><span class="popularCardShade" aria-hidden="true"></span>')+
        '<span class="popularCardCopy"><strong class="popularCardTitle">'+esc(title)+'</strong><span class="popularCardMeta"><img src="'+esc(post.authorAvatar||'assets/profile-avatars/avatar-01.svg')+'" alt=""><span>'+esc(post.user)+' · 댓글 '+Number(post.reply||0).toLocaleString('ko-KR')+'</span></span></span></a>';
    }).join('');
    section.hidden=popular.length===0;
  }

  toggle.addEventListener('click',function(){
    var collapsed=section.classList.toggle('isCollapsed');
    toggle.setAttribute('aria-expanded',String(!collapsed));
    toggle.setAttribute('aria-label',collapsed?'인기글 펼치기':'인기글 접기');
  });

  render();
})();
