(function(){
  'use strict';

  var descriptions={
    '전체 게시글':'보배드림 커뮤니티의 새로운 이야기와 인기 글을 한곳에서 확인해 보세요.',
    '베스트글':'회원들의 추천과 공감을 많이 받은 보배드림 대표 게시글을 모았습니다.',
    '자유게시판':'자동차 이야기부터 일상까지 누구나 자유롭게 의견과 경험을 나누는 공간입니다.',
    '자동차뉴스/토론':'새로운 자동차 소식과 산업 이슈를 살펴보고 다양한 관점으로 토론하는 공간입니다.',
    '자동차뉴스':'국내외 자동차 기사와 영상·SNS 소식을 3줄 요약으로 빠르게 보고, 댓글과 투표로 의견을 나누는 게시판입니다.',
    '해외 자동차뉴스':'한국을 제외한 해외 자동차 매체의 최신 기사를 출처 링크와 함께 자동 수집합니다.',
    '브랜드 자동차 정보':'자동차 브랜드별 국적·공식 명칭·주요 모델과 국내 시판 정보를 모아 확인하는 독립 정보 게시판입니다.',
    '정치/시사게시판':'사회와 시사 현안을 두고 서로의 생각을 나누는 커뮤니티입니다.',
    '시승기/배틀/목격담':'직접 경험한 시승기와 도로 위 생생한 목격담을 공유하는 공간입니다.',
    '유명인의 차':'방송과 스포츠, 문화계 유명인들의 자동차 이야기를 함께 나눕니다.',
    '성인게시판':'성인 회원을 위한 주제와 이야기를 나누는 회원 전용 공간입니다.',
    '보배드림 이야기':'보배드림 서비스와 커뮤니티에 관한 소식과 경험을 공유합니다.',
    '제안/건의':'더 나은 보배드림을 위한 의견과 개선 아이디어를 전하는 공간입니다.',
    '국내야구':'KBO 경기와 선수, 구단 이야기를 팬들과 함께 나누는 공간입니다.',
    '해외야구':'MLB를 비롯한 해외 야구 소식과 경기 이야기를 공유합니다.',
    '해외축구':'해외 리그와 국가대표 경기, 선수 소식을 함께 이야기합니다.',
    '국내축구':'K리그와 국내 축구 소식, 경기 관람 경험을 나누는 공간입니다.',
    '이벤트':'보배드림에서 진행하는 새로운 행사와 참여 소식을 확인하세요.',
    '신유머/감동/이슈':'지금 화제가 되는 유머와 감동적인 이야기, 주요 이슈를 모았습니다.',
    '유머게시판':'일상 속 웃긴 이야기와 재미있는 콘텐츠를 편하게 나누는 공간입니다.',
    '교통사고/블박':'교통사고 사례와 블랙박스 영상을 공유하고 해결 경험을 나눕니다.',
    '국산차게시판':'국산차 오너들의 구매 정보와 실제 운행 경험을 공유하는 공간입니다.',
    '수입차게시판':'수입차 브랜드와 모델 정보, 오너 경험을 함께 나누는 공간입니다.',
    '내차사진':'직접 아끼고 관리한 내 차의 사진과 이야기를 자랑하는 공간입니다.',
    '직찍/특종발견':'거리에서 직접 포착한 희귀 차량과 자동차 특종 사진을 공유합니다.',
    '자동차사진/동영상':'자동차를 주제로 한 사진과 영상을 감상하고 공유하는 공간입니다.',
    '장착시공사진':'튜닝과 용품 장착, 정비 시공 과정과 결과를 사진으로 공유합니다.',
    '자유사진/동영상':'주제에 제한 없이 직접 촬영한 사진과 영상을 나누는 공간입니다.',
    '후방주의방':'성인 회원을 위한 이미지와 콘텐츠를 공유하는 회원 전용 공간입니다.',
    '레이싱모델':'모터쇼와 서킷에서 만난 레이싱 모델 사진과 소식을 공유합니다.',
    '군사/무기':'국방과 군사 기술, 장비와 역사에 관한 정보를 나누는 공간입니다.',
    '트럭/버스/중기':'상용차와 특장차, 건설기계의 현장 정보와 운행 경험을 공유합니다.',
    '항공/해운/철도':'항공기와 선박, 철도 등 다양한 운송 수단의 이야기를 나눕니다.',
    '오토바이/자전거':'바이크와 자전거의 라이딩 정보, 장비와 정비 경험을 공유합니다.',
    '올드카/추억거리':'시간이 지나도 멋진 클래식카와 자동차 추억을 함께 나누는 공간입니다.',
    '차량리뷰':'실제 오너와 시승자가 남긴 차량별 평점과 사용 경험을 확인하는 리뷰 전용 공간입니다.'
  };

  var stats={
    '전체 게시글':'구독 92.6만명 · 게시물 8,420개',
    '베스트글':'구독 64.2만명 · 게시물 3,180개',
    '자유게시판':'구독 38.4만명 · 게시물 1,000개',
    '자동차뉴스/토론':'구독 12.8만명 · 게시물 786개',
    '자동차뉴스':'구독 12.8만명 · 게시물 36개',
    '해외 자동차뉴스':'해외 107개 매체 · 5분 간격 갱신',
    '브랜드 자동차 정보':'브랜드별 정보 · 독립 게시판',
    '정치/시사게시판':'구독 21.5만명 · 게시물 946개',
    '시승기/배틀/목격담':'구독 9.7만명 · 게시물 628개',
    '교통사고/블박':'구독 31.2만명 · 게시물 1,284개',
    '국산차게시판':'구독 18.6만명 · 게시물 895개',
    '수입차게시판':'구독 14.9만명 · 게시물 742개',
    '오토바이/자전거':'구독 8.1만명 · 게시물 516개',
    '올드카/추억거리':'구독 5.7만명 · 게시물 384개',
    '차량리뷰':'구독 2.8만명 · 리뷰 50개'
  };

  function fallbackStats(label){
    var value=0;
    for(var index=0;index<label.length;index+=1)value+=label.charCodeAt(index);
    var subscribers=(4.2+(value%94)/10).toFixed(1);
    var posts=320+(value%681);
    return '구독 '+subscribers+'만명 · 게시물 '+posts.toLocaleString('ko-KR')+'개';
  }

  function subscriptionKey(label){return 'bbm-community-subscription:'+label}

  function isSubscribed(label){
    try{return localStorage.getItem(subscriptionKey(label))==='1'}catch(error){return false}
  }

  function syncSubscribeButton(button,label){
    var subscribed=isSubscribed(label);
    button.setAttribute('aria-pressed',String(subscribed));
    button.textContent=subscribed?'구독중':'구독';
    button.setAttribute('aria-label',label+' '+(subscribed?'구독 취소':'구독'));
  }

  function syncBoardCopy(name,description,boardStats,subscribeButton){
    var label=(name.textContent||'').trim()||'자유게시판';
    description.textContent=descriptions[label]||label+' 회원들이 최신 정보와 경험을 자유롭게 나누는 공간입니다.';
    boardStats.textContent=stats[label]||fallbackStats(label);
    boardStats.hidden=false;
    syncSubscribeButton(subscribeButton,label);
  }

  function initialize(){
    var boardTop=document.querySelector('.boardTop');
    var boardSelect=document.getElementById('boardSelect');
    var name=boardSelect&&boardSelect.querySelector('.boardSelectName');
    var chevron=boardSelect&&boardSelect.querySelector('.boardChevron');
    var boardStats=boardTop&&boardTop.querySelector('.boardStats');
    var descriptionSection=document.getElementById('boardDescriptionSection');
    var description=document.getElementById('boardDescriptionText');
    if(!boardTop||!boardSelect||!name||!boardStats||!descriptionSection||!description)return;

    var identity=document.createElement('span');
    identity.className='boardIdentityCopy';
    var title=document.createElement('span');
    title.className='boardIdentityTitle';
    title.appendChild(name);
    if(chevron)title.appendChild(chevron);
    identity.appendChild(title);
    identity.appendChild(boardStats);
    boardSelect.appendChild(identity);

    var subscribeButton=document.createElement('button');
    subscribeButton.type='button';
    subscribeButton.className='boardSubscribe';
    boardTop.insertBefore(subscribeButton,boardTop.querySelector('.boardTools'));
    subscribeButton.addEventListener('click',function(event){
      event.stopPropagation();
      var label=(name.textContent||'').trim()||'자유게시판';
      var next=!isSubscribed(label);
      try{localStorage.setItem(subscriptionKey(label),next?'1':'0')}catch(error){}
      syncSubscribeButton(subscribeButton,label);
    });

    boardTop.classList.add('redditProfileReady');
    descriptionSection.classList.add('redditDescriptionReady');
    syncBoardCopy(name,description,boardStats,subscribeButton);

    new MutationObserver(function(){syncBoardCopy(name,description,boardStats,subscribeButton)}).observe(name,{childList:true,subtree:true,characterData:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
