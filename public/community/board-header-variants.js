(function(){
  'use strict';

  // 게시판마다 어울리는 배너 그림과 한 줄 소개(2026-11-02 「각각의 배너 이미지 어울리게」).
  // 그림은 scripts/community-board-banners.py 로 만든다(차 사진은 자르고 크기만 바꿈, 스포츠·시사 등은 게시판 색 무늬).
  var banners={
    'home':['자동차를 넘어, 사람 사는 이야기','제네시스 GV60와 여수 바다 노을'],
    'all':['모든 게시판의 새 글을 한곳에서','비 내린 서킷 옆 스포츠카 세 대'],
    'best':['지금 가장 많이 본 글','도시 야경 앞 고급 세단 세 대'],
    'free':['자동차부터 일상까지 자유롭게','놀이공원 앞 벤츠 GLB와 가족'],
    'car-news':['국내 자동차 소식을 빠르게','GMC 허머 EV'],
    'foreign-car-news':['해외 자동차 소식과 신차','바닷가의 애스턴마틴 DB12'],
    'brand-car-info':['브랜드별 자동차 정보 모음','마이바흐 GLS'],
    'vehicle-review':['오너가 직접 쓴 차량 리뷰','벤츠 S-클래스'],
    'tuhu-review':['오너 리뷰를 점수로 한눈에','BMW 7시리즈'],
    'fuel-economy':['실제 연비·전비 기록','테슬라 모델 X'],
    'autohome-complaint':['차량 결함과 불만을 함께 기록','주의 표시'],
    'chezhiwang-complaint':['결함·불만 사례 모아 보기','주의 표시'],
    'politics':['시사 이슈를 함께 이야기','말풍선'],
    'test-drive':['시승기, 배틀, 목격담','아우디 R8 스파이더'],
    'celebrity-car':['유명인이 타는 차 이야기','롤스로이스 컬리넌'],
    'adult':['성인 회원 전용 게시판','줄무늬'],
    'boba-story':['보배드림 회원들의 이야기','보배드림 동그라미'],
    'suggestion':['보배드림에 바라는 점','말풍선'],
    'kbo':['국내 야구 이야기','야구장 다이아몬드'],
    'mlb':['해외 야구 이야기','야구장 다이아몬드'],
    'overseas-football':['해외 축구 이야기','축구장'],
    'domestic-football':['국내 축구 이야기','축구장'],
    'event':['보배드림 이벤트 소식','색종이'],
    'new-humor':['웃기고 뭉클한 이슈','웃는 얼굴'],
    'humor':['오늘도 한 번 웃고 가세요','웃는 얼굴'],
    'accident-blackbox':['교통사고와 블랙박스 영상','블랙박스 화면과 도로'],
    'domestic-car':['국산차 이야기','제네시스 GV60'],
    'import-car':['수입차 이야기','BMW M5 투어링'],
    'tesla':['테슬라 오너 모임','테슬라 사이버트럭'],
    'bmw':['BMW 오너 모임','BMW M8 그란쿠페'],
    'mercedes-benz':['벤츠 오너 모임','벤츠 G-클래스'],
    'my-car-photo':['내 차 사진 자랑','포르쉐 911'],
    'scoop':['직접 찍은 특종과 발견','맥라렌 GT'],
    'car-media':['자동차 사진과 영상','페라리 푸로산게'],
    'installation':['장착·시공 사진','람보르기니 우루스'],
    'free-media':['자유롭게 올리는 사진과 영상','페라리 캘리포니아'],
    'caution':['후방주의 게시판','줄무늬'],
    'racing-model':['레이싱모델 사진','체크무늬 깃발'],
    'military':['군사와 무기 이야기','등고선'],
    'truck-bus-heavy':['트럭, 버스, 중장비 이야기','현대 엑시언트 트럭'],
    'aviation-rail':['항공, 해운, 철도 이야기','철길과 비행기'],
    'bike-cycle':['오토바이와 자전거 이야기','파란 스즈키 스포츠 바이크'],
    'oldcar-memory':['올드카와 추억','산길의 BMW E30']
  };

  function initialize(){
    var phone=document.querySelector('.phone');
    var hero=document.getElementById('boardHero');
    var image=document.getElementById('boardHeroImage');
    if(!phone||!hero||!image)return;

    phone.classList.add('headerYouTube');
    hero.hidden=false;
    hero.dataset.variant='youtube';
    image.onerror=function(){if(image.dataset.fallback!=='1'){image.dataset.fallback='1';image.src='assets/board-header-genesis-yeosu.webp'}};

    var boardName=document.querySelector('.boardSelectName');
    var heroTitle=hero.querySelector('.boardHeroTitle');
    var heroTagline=hero.querySelector('.boardHeroTagline');
    var sync=function(){
      var id=new URLSearchParams(location.search).get('board')||'home';
      if(!banners[id])id='home';
      var info=banners[id];
      var title=boardName?((boardName.textContent||'전체 게시글').trim()||'전체 게시글'):'전체 게시글';
      if(heroTitle)heroTitle.textContent=title;
      if(heroTagline)heroTagline.textContent=info[0];
      hero.dataset.board=id;
      var src='assets/board-banners/'+id+'.webp';
      if(image.getAttribute('src')!==src){image.dataset.fallback='';image.src=src}
      image.alt=title+' 배너: '+info[1];
    };
    sync();
    if(boardName)new MutationObserver(sync).observe(boardName,{childList:true,subtree:true,characterData:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
