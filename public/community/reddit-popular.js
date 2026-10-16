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
      var aScore=(Number(a.view)||0)+(Number(a.likes)||0)*14+Math.min(Number(a.reply)||0,999)*2;
      var bScore=(Number(b.view)||0)+(Number(b.likes)||0)*14+Math.min(Number(b.reply)||0,999)*2;
      return bScore-aScore;
    }).slice(0,5);
    track.innerHTML=popular.map(function(post,index){
      var title=cleanTitle(post.title);
      var href='./chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261016popular2';
      var photoCount=Math.max(1,Number(post.photos)||1);
      return '<a class="popularCard" href="'+href+'" aria-label="인기글: '+esc(title)+'"><span class="popularCardMediaWrap"><img class="popularCardMedia" src="'+esc(imageFor(post,index))+'" alt="" loading="lazy"><span class="popularCardPhotoCount">'+(photoCount>1?photoCount+'+':'1')+'</span></span><span class="popularCardBody"><strong class="popularCardTitle">'+esc(title)+'</strong><span class="popularCardMeta"><span>조회 '+Number(post.view||0).toLocaleString('ko-KR')+'</span><span>·</span><img src="assets/chzzk-detail/icons/comment-reddit.svg" alt=""><span>'+Number(post.reply||0).toLocaleString('ko-KR')+'</span></span></span></a>';
    }).join('');
    section.hidden=popular.length===0;
  }

  toggle.addEventListener('click',function(){
    var scroller=document.getElementById('popularScroller');
    var nearEnd=scroller.scrollLeft+scroller.clientWidth>=scroller.scrollWidth-12;
    scroller.scrollTo({left:nearEnd?0:Math.min(scroller.scrollLeft+308,scroller.scrollWidth-scroller.clientWidth),behavior:'smooth'});
  });

  render();
})();
