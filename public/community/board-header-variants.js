(function(){
  'use strict';

  function initialize(){
    var phone=document.querySelector('.phone');
    var hero=document.getElementById('boardHero');
    var image=document.getElementById('boardHeroImage');
    if(!phone||!hero||!image)return;

    var variant=new URLSearchParams(location.search).get('header');
    if(variant!=='youtube'&&variant!=='reddit')return;

    var isYouTube=variant==='youtube';
    phone.classList.add(isYouTube?'headerYouTube':'headerReddit');
    hero.hidden=false;
    hero.dataset.variant=variant;
    image.src=isYouTube?'assets/board-header-youtube.webp':'assets/board-header-reddit.webp';
    image.alt=isYouTube?'자유게시판 유튜브형 자동차 채널 배너':'자유게시판 레딧형 자동차 커뮤니티 배너';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
