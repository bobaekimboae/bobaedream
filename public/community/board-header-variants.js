(function(){
  'use strict';

  function initialize(){
    var phone=document.querySelector('.phone');
    var hero=document.getElementById('boardHero');
    var image=document.getElementById('boardHeroImage');
    if(!phone||!hero||!image)return;

    phone.classList.add('headerYouTube');
    hero.hidden=false;
    hero.dataset.variant='youtube';
    image.src='assets/board-header-youtube-v2.webp';
    image.alt='자유게시판 프리미엄 자동차 커뮤니티 배너';

    var boardName=document.querySelector('.boardSelectName');
    var heroTitle=hero.querySelector('.boardHeroTitle');
    if(boardName&&heroTitle){
      var syncTitle=function(){heroTitle.textContent=(boardName.textContent||'자유게시판').trim()||'자유게시판'};
      syncTitle();
      new MutationObserver(syncTitle).observe(boardName,{childList:true,subtree:true,characterData:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
