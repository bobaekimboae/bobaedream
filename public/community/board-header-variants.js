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
    image.src='assets/board-header-genesis-yeosu.webp';
    image.alt='한국인 뮤지션들과 제네시스 GV60가 함께하는 여수 로드트립 배너';

    var boardName=document.querySelector('.boardSelectName');
    var heroTitle=hero.querySelector('.boardHeroTitle');
    if(boardName&&heroTitle){
      var syncTitle=function(){
        var title=(boardName.textContent||'전체 게시글').trim()||'전체 게시글';
        heroTitle.textContent=title;
        image.alt=title+' 프리미엄 자동차 커뮤니티 배너';
      };
      syncTitle();
      new MutationObserver(syncTitle).observe(boardName,{childList:true,subtree:true,characterData:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
