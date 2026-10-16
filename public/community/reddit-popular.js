(function(){
  'use strict';

  var section=document.getElementById('popularSection');
  var toggle=document.getElementById('popularToggle');
  var track=document.getElementById('popularTrack');
  var scroller=document.getElementById('popularScroller');
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

  function quoteFor(index){
    return [
      '직접 경험한 분들의 평가가 궁금해요',
      '같은 증상을 겪은 분 계신가요?',
      '실사용자 의견은 확실히 다르네요',
      '정비 경험자분들 조언 부탁드려요',
      '다음 차로 고민 중입니다'
    ][index%5];
  }

  function render(){
    var source=(window.BOBAE_POSTS||[]).slice();
    var ranked=source.sort(function(a,b){
      var aScore=(Number(a.view)||0)+(Number(a.likes)||0)*14+Math.min(Number(a.reply)||0,999)*2;
      var bScore=(Number(b.view)||0)+(Number(b.likes)||0)*14+Math.min(Number(b.reply)||0,999)*2;
      return bScore-aScore;
    }).slice(0,5);
    var popular=ranked.slice(pageOffset).concat(ranked.slice(0,pageOffset));
    track.innerHTML=popular.map(function(post,index){
      var title=cleanTitle(post.title);
      var href='./chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261016popular3';
      var replyCount=compactCount(post.reply);
      return '<article class="popularCard"><a class="popularCardMain" href="'+href+'" aria-label="인기 토론: '+esc(title)+'"><strong class="popularCardTitle"><span class="popularDiscussionBadge">토론</span>'+esc(title)+'</strong><img class="popularCardMedia" src="'+esc(imageFor(post,index))+'" alt="" loading="lazy"><span class="popularCardQuote"><img src="assets/write-parity/quote.svg" alt=""><span>'+esc(quoteFor(index+pageOffset))+'</span></span></a><a class="popularCardAction" href="'+href+'">'+replyCount+'명이 토론 중</a></article>';
    }).join('');
    section.hidden=popular.length===0;
  }

  toggle.addEventListener('click',function(){
    if(toggle.classList.contains('isRefreshing'))return;
    toggle.classList.add('isRefreshing');
    track.classList.add('isRefreshing');
    window.setTimeout(function(){
      pageOffset=(pageOffset+2)%Math.max(1,(window.BOBAE_POSTS||[]).length>5?5:(window.BOBAE_POSTS||[]).length);
      render();
      scroller.scrollLeft=0;
      track.classList.remove('isRefreshing');
      toggle.classList.remove('isRefreshing');
    },160);
  });

  render();
})();
