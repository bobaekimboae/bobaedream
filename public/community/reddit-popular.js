(function(){
  'use strict';

  var section=document.getElementById('popularSection');
  var toggle=document.getElementById('popularToggle');
  var track=document.getElementById('popularTrack');
  var pageOffset=0;
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

  function compactCount(value){
    var count=Math.max(0,Number(value)||0);
    if(count>=10000)return (count/10000).toFixed(count>=100000?0:1).replace(/\.0$/,'')+'만';
    if(count>=1000)return (count/1000).toFixed(1).replace(/\.0$/,'')+'천';
    return count.toLocaleString('ko-KR');
  }

  function hrefFor(post){
    return './chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261016popular4';
  }

  function storyMarkup(post,index){
    var title=cleanTitle(post.title);
    var avatar=post.authorAvatar||'assets/profile-avatars/avatar-01.svg';
    return '<a class="popularStory" href="'+hrefFor(post)+'" aria-label="인기글: '+esc(title)+'"><div class="popularStoryCopy"><div class="popularStoryMeta"><img class="popularStoryAvatar" src="'+esc(avatar)+'" alt=""><span class="popularStoryAuthor">'+esc(post.user)+'</span><span class="popularStoryTime">'+esc(post.time)+'</span></div><strong class="popularStoryTitle">'+esc(title)+'</strong></div><img class="popularStoryMedia" src="'+esc(imageFor(post,index))+'" alt="" loading="lazy"></a>';
  }

  function render(){
    var source=(window.BOBAE_POSTS||[]).slice();
    var ranked=source.sort(function(a,b){
      var aScore=(Number(a.view)||0)+(Number(a.likes)||0)*14+Math.min(Number(a.reply)||0,999)*2;
      var bScore=(Number(b.view)||0)+(Number(b.likes)||0)*14+Math.min(Number(b.reply)||0,999)*2;
      return bScore-aScore;
    }).slice(0,6);
    if(!ranked.length){section.hidden=true;return;}
    var pageCount=Math.max(1,Math.ceil(ranked.length/3));
    var page=Math.floor(pageOffset/3)%pageCount;
    var popular=ranked.slice(page*3).concat(ranked.slice(0,page*3));
    var lead=popular[0];
    var stories=popular.slice(1,3);
    var leadTitle=cleanTitle(lead.title);
    var dots=Array.from({length:pageCount},function(_,index){return '<span class="'+(index===page?'on':'')+'" aria-hidden="true"></span>';}).join('');
    track.innerHTML='<article class="popularPanel"><a class="popularLead" href="'+hrefFor(lead)+'" aria-label="대표 인기글: '+esc(leadTitle)+'"><span class="popularLeadIcon"><img src="assets/write-parity/tag.svg" alt=""></span><strong class="popularLeadTitle">'+esc(leadTitle)+'</strong><span class="popularNew">NEW</span><span class="popularHeat">조회 '+compactCount(lead.view)+'</span></a><div class="popularStories">'+stories.map(storyMarkup).join('')+'</div><div class="popularPager" aria-label="'+(page+1)+' / '+pageCount+' 페이지">'+dots+'</div></article>';
    section.hidden=false;
  }

  toggle.addEventListener('click',function(){
    if(toggle.classList.contains('isChanging'))return;
    toggle.classList.add('isChanging');
    track.classList.add('isChanging');
    window.setTimeout(function(){
      pageOffset=(pageOffset+3)%Math.max(3,Math.min(6,(window.BOBAE_POSTS||[]).length));
      render();
      track.classList.remove('isChanging');
      toggle.classList.remove('isChanging');
    },140);
  });

  render();
})();
