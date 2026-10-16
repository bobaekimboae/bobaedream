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

  function compactCount(value){
    var count=Math.max(0,Number(value)||0);
    if(count>=10000)return (count/10000).toFixed(count>=100000?0:1).replace(/\.0$/,'')+'만';
    if(count>=1000)return (count/1000).toFixed(1).replace(/\.0$/,'')+'천';
    return count.toLocaleString('ko-KR');
  }

  function hrefFor(post){
    return './chzzk-detail.html?id='+encodeURIComponent(post.id)+'&v=20261016popular6';
  }

  function rowMarkup(post){
    var title=cleanTitle(post.title);
    return '<a class="popularPinnedRow" href="'+hrefFor(post)+'" aria-label="인기글: '+esc(title)+'"><span class="popularPinBadge" aria-hidden="true">인기</span><strong class="popularPinnedTitle">'+esc(title)+'</strong><span class="popularPinnedReply">('+compactCount(post.reply)+')</span></a>';
  }

  function render(){
    var ranked=(window.BOBAE_POSTS||[]).slice().sort(function(a,b){
      var aScore=(Number(a.view)||0)+(Number(a.likes)||0)*14+Math.min(Number(a.reply)||0,999)*2;
      var bScore=(Number(b.view)||0)+(Number(b.likes)||0)*14+Math.min(Number(b.reply)||0,999)*2;
      return bScore-aScore;
    }).slice(0,6);
    if(!ranked.length){section.hidden=true;return;}
    var pageCount=Math.max(1,Math.ceil(ranked.length/3));
    var page=Math.floor(pageOffset/3)%pageCount;
    var popular=ranked.slice(page*3,page*3+3);
    var dots=Array.from({length:pageCount},function(_,index){return '<span class="'+(index===page?'on':'')+'" aria-hidden="true"></span>';}).join('');
    track.innerHTML='<div class="popularPanel">'+popular.map(rowMarkup).join('')+'</div>';
    toggle.innerHTML=dots;
    toggle.setAttribute('aria-label','인기글 '+(page+1)+' / '+pageCount+' · 다음 묶음 보기');
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
