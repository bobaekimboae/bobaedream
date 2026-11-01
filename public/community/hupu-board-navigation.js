(function(){
  'use strict';

  var boards=[
    {id:'best',displayName:'베스트글',shortName:'베스트',section:'게시판',topicKey:'전체',fixed:true,avatarLabel:'BEST',avatarColor:'#18181b',avatarAccent:'#f5b942'},
    {id:'free',displayName:'자유게시판',shortName:'자유',section:'게시판',topicKey:'전체',avatarLabel:'자유',avatarColor:'#2457d6',avatarAccent:'#6ea8ff'},
    {id:'car-news',displayName:'자동차뉴스',shortName:'자동차뉴스',section:'게시판',topicKey:'전체',avatarLabel:'NEWS',avatarColor:'#164e9b',avatarAccent:'#55a5f5'},
    {id:'foreign-car-news',displayName:'해외 자동차뉴스',shortName:'해외뉴스',section:'게시판',topicKey:'전체',avatarLabel:'WORLD',avatarColor:'#0f4c5c',avatarAccent:'#3fb7a7'},
    {id:'brand-car-info',displayName:'브랜드 자동차 정보',shortName:'브랜드정보',section:'게시판',topicKey:'전체',avatarLabel:'BRAND',avatarColor:'#263238',avatarAccent:'#90a4ae'},
    {id:'vehicle-review',displayName:'차량리뷰',shortName:'차량리뷰',section:'게시판',topicKey:'전체',avatarLabel:'리뷰',avatarColor:'#1f2937',avatarAccent:'#7c8698'},
    {id:'tuhu-review',displayName:'투후 오너 리뷰',shortName:'투후리뷰',section:'게시판',topicKey:'전체',avatarLabel:'TUHU',avatarColor:'#17191e',avatarAccent:'#5d626a'},
    {id:'fuel-economy',displayName:'연비·전비',shortName:'연비전비',section:'게시판',topicKey:'전체',avatarLabel:'효율',avatarColor:'#1f2937',avatarAccent:'#7c8698'},
    {id:'autohome-complaint',displayName:'차량 결함·불만',shortName:'결함불만',section:'게시판',topicKey:'전체',avatarLabel:'불만',avatarColor:'#17191e',avatarAccent:'#59616d'},
    {id:'chezhiwang-complaint',displayName:'처즈왕 결함·불만',shortName:'처즈왕불만',section:'게시판',topicKey:'전체',avatarLabel:'CZ',avatarColor:'#17191e',avatarAccent:'#59616d'},
    {id:'politics',displayName:'정치/시사게시판',shortName:'정치시사',section:'게시판',topicKey:'전체',avatarLabel:'시사',avatarColor:'#5031a9',avatarAccent:'#9678e8'},
    {id:'test-drive',displayName:'시승기/배틀/목격담',shortName:'시승배틀',section:'게시판',topicKey:'전체',avatarLabel:'시승',avatarColor:'#c65316',avatarAccent:'#ff9c57'},
    {id:'celebrity-car',displayName:'유명인의 차',shortName:'유명인차',section:'게시판',topicKey:'전체',avatarLabel:'STAR',avatarColor:'#9e3f77',avatarAccent:'#f08bc2'},
    {id:'adult',displayName:'성인게시판',shortName:'성인',section:'게시판',topicKey:'전체',avatarLabel:'19',avatarColor:'#74253d',avatarAccent:'#d36386'},
    {id:'boba-story',displayName:'보배드림 이야기',shortName:'보배이야기',section:'게시판',topicKey:'전체',avatarLabel:'보배',avatarColor:'#a51f34',avatarAccent:'#ef6679'},
    {id:'suggestion',displayName:'제안/건의',shortName:'제안건의',section:'게시판',topicKey:'전체',avatarLabel:'제안',avatarColor:'#35556f',avatarAccent:'#76a5c8'},
    {id:'kbo',displayName:'국내야구',shortName:'국내야구',section:'게시판',topicKey:'전체',avatarLabel:'KBO',avatarColor:'#1f6d3f',avatarAccent:'#61bd7e'},
    {id:'mlb',displayName:'해외야구',shortName:'해외야구',section:'게시판',topicKey:'전체',avatarLabel:'MLB',avatarColor:'#174b8d',avatarAccent:'#5d9eea'},
    {id:'overseas-football',displayName:'해외축구',shortName:'해외축구',section:'게시판',topicKey:'전체',avatarLabel:'해축',avatarColor:'#236b4b',avatarAccent:'#62c894'},
    {id:'domestic-football',displayName:'국내축구',shortName:'국내축구',section:'게시판',topicKey:'전체',avatarLabel:'국축',avatarColor:'#16736d',avatarAccent:'#58c7bc'},
    {id:'event',displayName:'이벤트',shortName:'이벤트',section:'게시판',topicKey:'전체',avatarLabel:'EVENT',avatarColor:'#b23d28',avatarAccent:'#ff856b'},
    {id:'new-humor',displayName:'신유머/감동/이슈',shortName:'유머이슈',section:'자료실',topicKey:'전체',avatarLabel:'이슈',avatarColor:'#7f4c16',avatarAccent:'#e2a34d'},
    {id:'humor',displayName:'유머게시판',shortName:'유머',section:'자료실',topicKey:'전체',avatarLabel:'유머',avatarColor:'#745400',avatarAccent:'#f2c94c'},
    {id:'accident-blackbox',displayName:'교통사고/블박',shortName:'교통블박',section:'자료실',topicKey:'블박',avatarLabel:'블박',avatarColor:'#b4332b',avatarAccent:'#ff766e'},
    {id:'domestic-car',displayName:'국산차게시판',shortName:'국산차',section:'자료실',topicKey:'전체',avatarLabel:'국산',avatarColor:'#176549',avatarAccent:'#5bc699'},
    {id:'import-car',displayName:'수입차게시판',shortName:'수입차',section:'자료실',topicKey:'전체',avatarLabel:'수입',avatarColor:'#252932',avatarAccent:'#808b9e'},
    {id:'tesla',displayName:'테슬라',shortName:'테슬라',section:'자료실',topicKey:'테슬라',avatarLabel:'T',avatarColor:'#b11f2f',avatarAccent:'#ed5965'},
    {id:'bmw',displayName:'BMW',shortName:'BMW',section:'자료실',topicKey:'BMW',avatarLabel:'BMW',avatarColor:'#1769aa',avatarAccent:'#73b9e6'},
    {id:'mercedes-benz',displayName:'벤츠',shortName:'벤츠',section:'자료실',topicKey:'벤츠',avatarLabel:'BENZ',avatarColor:'#25282d',avatarAccent:'#8f969f'},
    {id:'my-car-photo',displayName:'내차사진',shortName:'내차사진',section:'자료실',topicKey:'전체',avatarLabel:'MY',avatarColor:'#11748d',avatarAccent:'#5bc3dc'},
    {id:'scoop',displayName:'직찍/특종발견',shortName:'직찍특종',section:'자료실',topicKey:'전체',avatarLabel:'특종',avatarColor:'#5c3b8f',avatarAccent:'#a982e4'},
    {id:'car-media',displayName:'자동차사진/동영상',shortName:'자동차영상',section:'자료실',topicKey:'전체',avatarLabel:'영상',avatarColor:'#3348a1',avatarAccent:'#7488eb'},
    {id:'installation',displayName:'장착시공사진',shortName:'장착시공',section:'자료실',topicKey:'튜닝',avatarLabel:'DIY',avatarColor:'#414f8a',avatarAccent:'#8594d6'},
    {id:'free-media',displayName:'자유사진/동영상',shortName:'자유영상',section:'자료실',topicKey:'전체',avatarLabel:'PHOTO',avatarColor:'#147675',avatarAccent:'#58c2bd'},
    {id:'caution',displayName:'후방주의방',shortName:'후방주의',section:'자료실',topicKey:'전체',avatarLabel:'주의',avatarColor:'#a3295d',avatarAccent:'#eb76ab'},
    {id:'racing-model',displayName:'레이싱모델',shortName:'레이싱',section:'자료실',topicKey:'전체',avatarLabel:'RACE',avatarColor:'#a52345',avatarAccent:'#f06e8e'},
    {id:'military',displayName:'군사/무기',shortName:'군사무기',section:'자료실',topicKey:'전체',avatarLabel:'군사',avatarColor:'#4e5e31',avatarAccent:'#95a967'},
    {id:'truck-bus-heavy',displayName:'트럭/버스/중기',shortName:'트럭중기',section:'자료실',topicKey:'전체',avatarLabel:'TRUCK',avatarColor:'#645044',avatarAccent:'#ae8b72'},
    {id:'aviation-rail',displayName:'항공/해운/철도',shortName:'항공철도',section:'자료실',topicKey:'전체',avatarLabel:'교통',avatarColor:'#244b72',avatarAccent:'#6f9bc6'},
    {id:'bike-cycle',displayName:'오토바이/자전거',shortName:'바이크',section:'자료실',topicKey:'전체',avatarLabel:'BIKE',avatarColor:'#b02e2e',avatarAccent:'#ef7474'},
    {id:'oldcar-memory',displayName:'올드카/추억거리',shortName:'올드카',section:'자료실',topicKey:'전체',avatarLabel:'OLD',avatarColor:'#6c4c2f',avatarAccent:'#bc9061'}
  ];
  var storageKey='bbm.community.boardChannels.v2';
  var legacyStorageKey='bbm.community.boardOrder.v1';
  var defaultHomeStorageKey='bbm.community.defaultBoard.v1';
  var favoriteStorageKey='bbm.community.favoriteBoards.v1';
  var recentStorageKey='bbm.community.recentBoards.v1';
  var fixedIds=['home','all','best'];
  var movableBoards=boards.filter(function(board){return !board.fixed});
  var defaultExcludedIds=['adult','installation','free-media','caution','racing-model','military'];
  var boardGroupById={
    'car-news':'자동차','foreign-car-news':'자동차','brand-car-info':'자동차','vehicle-review':'자동차','tuhu-review':'자동차','fuel-economy':'자동차','test-drive':'자동차','celebrity-car':'자동차','domestic-car':'자동차','import-car':'자동차','tesla':'자동차','bmw':'자동차','mercedes-benz':'자동차','my-car-photo':'자동차','car-media':'자동차','installation':'자동차','oldcar-memory':'자동차',
    'truck-bus-heavy':'차량','bike-cycle':'차량',
    'accident-blackbox':'제보','scoop':'제보',
    'autohome-complaint':'결함','chezhiwang-complaint':'결함'
  };
  var menuSections=['일반','자동차','차량','제보','결함'];
  movableBoards.forEach(function(board){board.menuSection=boardGroupById[board.id]||'일반'});
  var defaultActiveOrder=movableBoards.filter(function(board){return defaultExcludedIds.indexOf(board.id)<0}).map(function(board){return board.id});
  var boardById={};
  boards.forEach(function(board,index){board.defaultOrder=index+1;boardById[board.id]=board});

  function escapeHtml(value){return String(value).replace(/[&<>\"]/g,function(character){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[character]})}
  function boardAvatarSrc(board){
    board=board||{};
    var label=String(board.avatarLabel||board.shortName||'전체');
    var fontSize=label.length>=5?18:label.length>=3?21:26;
    var color=board.avatarColor||'#252525';
    var accent=board.avatarAccent||'#777';
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="10" y1="8" x2="86" y2="88" gradientUnits="userSpaceOnUse"><stop stop-color="'+color+'"/><stop offset="1" stop-color="'+accent+'"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#g)"/><circle cx="74" cy="21" r="17" fill="#fff" fill-opacity=".13"/><path d="M14 69c17-13 34-15 68-3" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="8" stroke-linecap="round"/><text x="48" y="55" fill="#fff" font-family="Pretendard,Arial,sans-serif" font-size="'+fontSize+'" font-weight="800" text-anchor="middle" letter-spacing="-.8">'+escapeHtml(label)+'</text></svg>';
    return'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  }
  function normalizeActiveOrder(value,appendMissing){
    var result=[],seen={};
    if(Array.isArray(value))value.forEach(function(id){if(boardById[id]&&!boardById[id].fixed&&!seen[id]){seen[id]=true;result.push(id)}});
    if(appendMissing)defaultActiveOrder.forEach(function(id){if(!seen[id]){seen[id]=true;result.push(id)}});
    return result;
  }
  function saveState(order){
    var state={version:2,menuProfileVersion:1,fixedIds:fixedIds.slice(),activeOrder:normalizeActiveOrder(order,false),updatedAt:new Date().toISOString()};
    try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(error){}
    return state;
  }
  function loadState(){
    try{
      var stored=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(stored&&stored.version===2&&Array.isArray(stored.activeOrder)){
        var activeOrder=normalizeActiveOrder(stored.activeOrder,false);
        if(!stored.menuProfileVersion&&activeOrder.length>defaultActiveOrder.length){
          activeOrder=defaultActiveOrder.slice();
          saveState(activeOrder);
        }
        return{version:2,menuProfileVersion:1,fixedIds:fixedIds.slice(),activeOrder:activeOrder,updatedAt:stored.updatedAt||null};
      }
    }catch(error){}
    try{
      var legacy=JSON.parse(localStorage.getItem(legacyStorageKey)||'null');
      if(Array.isArray(legacy))return saveState(normalizeActiveOrder(legacy,true));
    }catch(error){}
    return{version:2,menuProfileVersion:1,fixedIds:fixedIds.slice(),activeOrder:defaultActiveOrder.slice(),updatedAt:null};
  }
  function orderedBoards(){return[boardById.best].concat(loadState().activeOrder.map(function(id){return boardById[id]}).filter(Boolean))}
  function sections(){return menuSections.map(function(title){return{title:title,boards:movableBoards.filter(function(board){return board.menuSection===title})}})}
  function loadDefaultHome(){
    var id='home';
    try{id=localStorage.getItem(defaultHomeStorageKey)||'home'}catch(error){}
    return id==='home'||id==='all'||boardById[id]?id:'home';
  }
  function loadBoardIds(key,limit){
    try{
      var stored=JSON.parse(localStorage.getItem(key)||'[]');
      if(Array.isArray(stored))return stored.filter(function(id,index){return boardById[id]&&stored.indexOf(id)===index}).slice(0,limit);
    }catch(error){}
    return[];
  }
  function saveBoardIds(key,ids,limit){
    var normalized=ids.filter(function(id,index){return boardById[id]&&ids.indexOf(id)===index}).slice(0,limit);
    try{localStorage.setItem(key,JSON.stringify(normalized))}catch(error){}
    return normalized;
  }

  function init(api){
    var scroller=document.getElementById('boardChannelScroller');
    var track=document.getElementById('boardChannelTrack');
    var menuButton=document.getElementById('boardOrderMenu');
    var headerMenuButton=document.querySelector('.appbar .hamburger');
    if(!scroller||!track||!menuButton)return null;
    var queryId=new URLSearchParams(location.search).get('board');
    var queryParams=new URLSearchParams(location.search);
    var previewGrid=queryParams.get('boardGrid');
    var panelColumns=previewGrid==='3'?3:4;
    var selectedId=queryId==='home'||queryId==='all'||boardById[queryId]?queryId:loadDefaultHome();
    var editing=false;
    var draftOrder=[];
    var activeSection='일반';
    var dragging=null;
    var dragStartOrder=[];
    var dragPointerId=null;
    var dragPointerStart=null;
    var longPressTimer=null;
    var longPressActive=false;
    var panelOpener=null;
    var toastTimer=null;

    function boardForId(id){
      if(id==='home')return{id:'home',displayName:'전체 게시글',shortName:'홈',topicKey:'전체',fixed:true,avatarLabel:'HOME',avatarColor:'#202124',avatarAccent:'#666a70'};
      if(id==='all')return{id:'all',displayName:'전체 게시글',shortName:'전체',topicKey:'전체',fixed:true,avatarLabel:'ALL',avatarColor:'#202124',avatarAccent:'#666a70'};
      return boardById[id];
    }
    function updateCurrentBoardAvatar(board){
      var avatar=document.querySelector('.boardAvatar');
      if(!avatar||!board)return;
      avatar.src=boardAvatarSrc(board);
      avatar.alt=board.displayName+' 프로필';
    }
    function updateQuery(id){
      var url=new URL(location.href);
      if(id==='home')url.searchParams.delete('board');else url.searchParams.set('board',id);
      history.replaceState(null,'',url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():'')+url.hash);
    }
    function scrollSelected(){requestAnimationFrame(function(){var selected=track.querySelector('.boardChannelTab.on');if(selected)selected.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})})}
    function announce(message){var region=backdrop.querySelector('.boardOrderLive');if(region)region.textContent=message}
    function choose(id,options){
      options=options||{};
      var board=boardForId(id);
      if(!board)return;
      selectedId=id;
      renderNav();
      updateCurrentBoardAvatar(board);
      if(!options.skipQuery)updateQuery(id);
      if(boardById[id])saveBoardIds(recentStorageKey,[id].concat(loadBoardIds(recentStorageKey,6).filter(function(boardId){return boardId!==id})),6);
      if(api&&api.onSelect)api.onSelect(board,{silent:!!options.silent,fromNavigation:true});
      scrollSelected();
      if(options.closePanel)closePanel();
    }
    function navButton(id,label,fullName,isHome){
      var on=id===selectedId;
      return '<button class="boardChannelTab '+(isHome?'home ':'')+(on?'on':'')+'" data-board-id="'+escapeHtml(id)+'" aria-label="'+escapeHtml(fullName)+'" '+(on?'aria-current="page"':'')+'><span>'+escapeHtml(label)+'</span></button>';
    }
    function renderNav(){
      var state=loadState();
      var items=[navButton('home','홈','커뮤니티 홈',true),navButton('all','전체','전체 게시글',false),navButton('best','베스트','베스트글',false)];
      state.activeOrder.forEach(function(id){var board=boardById[id];if(board)items.push(navButton(board.id,board.shortName,board.displayName,false))});
      track.innerHTML=items.join('');
      Array.prototype.forEach.call(track.querySelectorAll('[data-board-id]'),function(button){button.onclick=function(){choose(button.dataset.boardId)}});
    }

    var backdrop=document.createElement('div');
    backdrop.className='boardOrderBackdrop';
    backdrop.hidden=true;
    backdrop.innerHTML='<section class="boardOrderPanel" role="dialog" aria-modal="true" aria-labelledby="boardOrderTitle" tabindex="-1"><header class="boardOrderHeader"><h2 id="boardOrderTitle">전체 게시판</h2><button class="boardOrderClose" aria-label="닫기"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button></header><div class="boardOrderBody"><button class="boardOrderDefaultEntry" type="button" aria-label="현재 게시판을 기본 홈으로 설정"><strong>기본 홈 설정</strong><span class="boardOrderDefaultValue">전체 게시글</span><span class="boardOrderDefaultArrow" aria-hidden="true">›</span></button><div class="boardOrderHeading"><div><strong>내 게시판</strong><span class="boardOrderGuide">누르면 해당 게시판으로 이동합니다</span></div><button class="boardOrderEdit" aria-pressed="false">편집</button></div><div class="boardOrderMyGrid"></div><div class="boardOrderAvailable"><div class="boardOrderSectionTabs" role="tablist" aria-label="게시판 분류">'+menuSections.map(function(section){return'<button role="tab" data-section="'+escapeHtml(section)+'">'+escapeHtml(section)+'</button>'}).join('')+'</div><div class="boardOrderAvailableSections"></div><p class="boardOrderEmpty" hidden></p></div><button class="boardOrderReset" hidden>기본 순서로 초기화</button><p class="boardOrderHint">변경 내용은 바로 저장되며, 제외한 게시판은 아래에서 다시 추가할 수 있습니다.</p></div><div class="boardOrderToast" role="status" aria-live="polite" hidden><span class="boardOrderToastText"></span><button class="boardOrderUndo" type="button" hidden>되돌리기</button></div><div class="boardOrderLive" aria-live="polite" aria-atomic="true"></div></section>';
    document.body.appendChild(backdrop);
    var serviceBackdrop=document.createElement('div');
    serviceBackdrop.className='communityMenuBackdrop';
    serviceBackdrop.hidden=true;
    serviceBackdrop.innerHTML='<section class="communityMenuPanel" role="dialog" aria-modal="true" aria-labelledby="communityMenuTitle"><header class="communityMenuHeader"><h2 id="communityMenuTitle">커뮤니티</h2><button class="communityMenuClose" aria-label="닫기"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button></header><div class="communityMenuBody"><nav class="communityMenuPrimary" aria-label="커뮤니티 주요 메뉴"><button type="button" data-service-board="home"><img src="assets/reddit-rail/home.svg" alt=""><span>커뮤니티 홈</span></button><button type="button" data-service-board="all"><img src="assets/reddit-rail/explore.svg" alt=""><span>전체 게시글</span></button><button type="button" data-service-board="best"><img src="assets/reddit-rail/popular.svg" alt=""><span>베스트글</span></button><a href="./chzzk-write.html"><img src="assets/reddit-ui/write.svg" alt=""><span>글쓰기</span></a></nav><div class="communityMenuDivider"></div><div class="communityMenuSmartGroups"><details class="communityMenuGroup communityMenuRecentGroup" open><summary><span>최근 방문</span><img src="assets/reddit-rail/section-toggle.svg" alt="" aria-hidden="true"></summary><div class="communityMenuRecent"></div></details><details class="communityMenuGroup communityMenuFavoriteGroup" open><summary><span>즐겨찾기</span><img src="assets/reddit-rail/section-toggle.svg" alt="" aria-hidden="true"></summary><div class="communityMenuFavorites"></div></details></div><div class="communityMenuDivider"></div><div class="communityMenuSectionTitle">전체 게시판</div><div class="communityMenuGroups"></div><div class="communityMenuDivider"></div><button class="communityMenuUtility communityMenuViewEntry" type="button"><img src="assets/reddit-ui/view-list.svg" alt=""><span>보기 방식</span><img class="communityMenuUtilityArrow" src="assets/reddit-ui/chevron-right.svg" alt=""></button><button class="communityMenuUtility communityMenuBoardEntry" type="button"><img src="assets/reddit-rail/favorite.svg" alt=""><span>게시판 관리</span><img class="communityMenuUtilityArrow" src="assets/reddit-ui/chevron-right.svg" alt=""></button></div></section>';
    document.body.appendChild(serviceBackdrop);
    var panel=backdrop.querySelector('.boardOrderPanel');
    if(panelColumns)panel.dataset.gridColumns=String(panelColumns);
    var myGrid=backdrop.querySelector('.boardOrderMyGrid');
    var availableSections=backdrop.querySelector('.boardOrderAvailableSections');
    var toast=backdrop.querySelector('.boardOrderToast');
    var toastText=backdrop.querySelector('.boardOrderToastText');
    var toastUndo=backdrop.querySelector('.boardOrderUndo');
    var serviceOpener=null;

    function updateDefaultHomeEntry(){
      var value=backdrop.querySelector('.boardOrderDefaultValue');
      var board=boardForId(loadDefaultHome());
      if(value&&board)value.textContent=board.displayName;
    }
    function saveDefaultHome(id){
      var board=boardForId(id);
      if(!board)return;
      try{localStorage.setItem(defaultHomeStorageKey,id)}catch(error){}
      updateDefaultHomeEntry();
      showToast(board.displayName+'을 기본 홈으로 설정했습니다');
    }

    function hideToast(){
      clearTimeout(toastTimer);
      toastTimer=null;
      toast.hidden=true;
      toastUndo.hidden=true;
      toastUndo.onclick=null;
    }
    function showToast(message,undo){
      clearTimeout(toastTimer);
      toastText.textContent=message;
      toastUndo.hidden=typeof undo!=='function';
      toastUndo.onclick=typeof undo==='function'?function(){hideToast();undo()}:null;
      toast.hidden=false;
      announce(message);
      toastTimer=setTimeout(hideToast,5000);
    }
    function commitDraft(message){
      saveState(draftOrder);
      renderNav();
      if(message)announce(message);
    }

    function fixedTile(id,label,fullName){
      var selected=id===selectedId;
      var interactive=editing?'aria-disabled="true"':'role="button" tabindex="0"';
      return '<div class="boardOrderItem boardOrderFixed '+(selected?'selected':'')+'" '+interactive+' data-board-id="'+id+'" data-fixed="true" aria-label="'+escapeHtml(fullName)+' 고정 게시판" '+(selected?'aria-current="page"':'')+'><span class="boardOrderName">'+escapeHtml(label)+'</span></div>';
    }
    function movableTile(board){
      var selected=board.id===selectedId;
      return '<div class="boardOrderItem '+(selected?'selected ':'')+(editing?'editing':'')+'" role="button" tabindex="0" draggable="'+(editing?'true':'false')+'" data-board-id="'+escapeHtml(board.id)+'" data-board-name="'+escapeHtml(board.displayName)+'" data-movable="true" aria-label="'+escapeHtml(board.displayName)+(editing?' 순서 변경':' 이동')+'" '+(editing?'aria-grabbed="false" ':'')+(selected?'aria-current="page"':'')+'><span class="boardOrderName">'+escapeHtml(board.shortName)+'</span>'+(editing?'<button class="boardOrderRemove" aria-label="'+escapeHtml(board.displayName)+' 내 게시판에서 제외"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button>':'')+'</div>';
    }
    function addTile(board){
      return '<button class="boardOrderAdd" data-board-id="'+escapeHtml(board.id)+'" aria-label="'+escapeHtml(board.displayName)+' 내 게시판에 추가"><span>'+escapeHtml(board.displayName)+'</span><img class="boardOrderPlusIcon" src="assets/chzzk-detail/icons/close.svg" alt=""></button>';
    }
    function activeCategoryTile(board){
      return '<button class="boardOrderCategoryItem isActive" data-board-id="'+escapeHtml(board.id)+'" aria-label="'+escapeHtml(board.displayName)+' 내 게시판에 추가됨" aria-pressed="true" tabindex="-1"><span>'+escapeHtml(board.displayName)+'</span></button>';
    }
    function currentOrder(){return editing?draftOrder.slice():loadState().activeOrder.slice()}
    function readGridOrder(){return Array.prototype.map.call(myGrid.querySelectorAll('.boardOrderItem[data-movable="true"]'),function(item){return item.dataset.boardId})}
    function updateDraftFromGrid(){draftOrder=normalizeActiveOrder(readGridOrder(),false)}
    function updateItemLabels(){
      var items=myGrid.querySelectorAll('.boardOrderItem[data-movable="true"]');
      Array.prototype.forEach.call(items,function(item,index){
        item.setAttribute('aria-label',item.dataset.boardName+' 현재 '+(index+4)+'번째, 방향키로 이동');
        item.setAttribute('aria-posinset',String(index+1));
        item.setAttribute('aria-setsize',String(items.length));
      });
    }
    function sameOrder(left,right){return left.length===right.length&&left.every(function(id,index){return id===right[index]})}
    function startDrag(item,pointerId){
      if(!item||dragging)return;
      dragging=item;
      dragStartOrder=readGridOrder();
      dragPointerId=pointerId==null?null:pointerId;
      longPressActive=true;
      item.classList.add('dragging');
      item.setAttribute('aria-grabbed','true');
      document.body.classList.add('boardOrderDragging');
      if(dragPointerId!=null){try{item.setPointerCapture(dragPointerId)}catch(error){}}
    }
    function finishDrag(shouldSave){
      clearTimeout(longPressTimer);
      var activeItem=dragging;
      if(activeItem){
        activeItem.classList.remove('dragging');
        activeItem.setAttribute('aria-grabbed','false');
        if(dragPointerId!=null){try{activeItem.releasePointerCapture(dragPointerId)}catch(error){}}
      }
      updateDraftFromGrid();
      var changed=!sameOrder(dragStartOrder,draftOrder);
      if(longPressActive&&changed&&shouldSave!==false)commitDraft('게시판 순서를 저장했습니다');
      dragging=null;
      dragStartOrder=[];
      dragPointerId=null;
      dragPointerStart=null;
      longPressActive=false;
      document.body.classList.remove('boardOrderDragging');
    }
    function moveItem(item,target,event){
      if(!target||target===item||target.dataset.movable!=='true')return false;
      var beforeOrder=readGridOrder();
      var rect=target.getBoundingClientRect();
      var sameRow=event.clientY>=rect.top&&event.clientY<=rect.bottom;
      var before=sameRow?event.clientX<=rect.left+rect.width/2:event.clientY<rect.top+rect.height/2;
      myGrid.insertBefore(item,before?target:target.nextSibling);
      var afterOrder=readGridOrder();
      if(sameOrder(beforeOrder,afterOrder))return false;
      updateDraftFromGrid();
      commitDraft();
      updateItemLabels();
      return true;
    }
    function bindMyGrid(){
      Array.prototype.forEach.call(myGrid.querySelectorAll('.boardOrderItem'),function(item){
        var id=item.dataset.boardId;
        item.onclick=function(event){
          if(event.target.closest('.boardOrderRemove')||editing||longPressActive)return;
          choose(id,{closePanel:true});
        };
        item.onkeydown=function(event){
          if(!editing&&(event.key==='Enter'||event.key===' ')){event.preventDefault();choose(id,{closePanel:true});return}
          if(!editing||item.dataset.movable!=='true')return;
          var items=Array.prototype.slice.call(myGrid.querySelectorAll('.boardOrderItem[data-movable="true"]'));
          var index=items.indexOf(item),columns=panelColumns,next=index;
          if(event.key==='ArrowLeft')next=index-1;
          if(event.key==='ArrowRight')next=index+1;
          if(event.key==='ArrowUp')next=index-columns;
          if(event.key==='ArrowDown')next=index+columns;
          if(next!==index&&next>=0&&next<items.length){event.preventDefault();myGrid.insertBefore(item,next>index?items[next].nextSibling:items[next]);updateDraftFromGrid();updateItemLabels();commitDraft(item.dataset.boardName+' '+(next+4)+'번째로 이동·저장');item.focus()}
        };
        if(!editing||item.dataset.movable!=='true')return;
        item.ondragstart=function(event){startDrag(item,null);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',id)};
        item.ondragenter=function(event){if(dragging&&dragging!==item){event.preventDefault();moveItem(dragging,item,event)}};
        item.ondragover=function(event){event.preventDefault();if(dragging)moveItem(dragging,item,event)};
        item.ondrop=function(event){
          event.preventDefault();
          var sourceId=event.dataTransfer&&event.dataTransfer.getData('text/plain');
          var source=sourceId&&myGrid.querySelector('.boardOrderItem[data-board-id="'+sourceId+'"]');
          if(source&&source!==item)moveItem(source,item,event);
          updateDraftFromGrid();
          finishDrag(true);
        };
        item.ondragend=function(){updateDraftFromGrid();finishDrag(true)};
        item.onpointerdown=function(event){
          if(event.target.closest('.boardOrderRemove')||event.pointerType==='mouse')return;
          clearTimeout(longPressTimer);
          var pointerId=event.pointerId;
          dragPointerStart={pointerId:pointerId,x:event.clientX,y:event.clientY};
          longPressTimer=setTimeout(function(){startDrag(item,pointerId)},180);
        };
        item.onpointermove=function(event){
          if(!longPressActive&&dragPointerStart&&dragPointerStart.pointerId===event.pointerId){
            var deltaX=event.clientX-dragPointerStart.x;
            var deltaY=event.clientY-dragPointerStart.y;
            if(Math.sqrt(deltaX*deltaX+deltaY*deltaY)>6){clearTimeout(longPressTimer);startDrag(item,event.pointerId)}
          }
          if(!longPressActive||dragging!==item)return;
          event.preventDefault();
          var target=document.elementFromPoint(event.clientX,event.clientY);
          moveItem(item,target&&target.closest('.boardOrderItem[data-movable="true"]'),event);
          var body=backdrop.querySelector('.boardOrderBody');
          var bodyRect=body.getBoundingClientRect();
          if(event.clientY<bodyRect.top+64)body.scrollTop-=12;
          if(event.clientY>bodyRect.bottom-64)body.scrollTop+=12;
        };
        item.onpointerup=item.onpointercancel=function(){updateDraftFromGrid();finishDrag(true)};
        var remove=item.querySelector('.boardOrderRemove');
        if(remove){
          remove.onpointerdown=function(event){event.stopPropagation()};
          remove.onclick=function(event){
            event.stopPropagation();
            var removedIndex=draftOrder.indexOf(id);
            draftOrder=draftOrder.filter(function(boardId){return boardId!==id});
            commitDraft(item.dataset.boardName+' 내 게시판에서 제외');
            renderPanel();
            showToast(item.dataset.boardName+'을 제외했습니다',function(){
              if(draftOrder.indexOf(id)<0)draftOrder.splice(Math.max(0,removedIndex),0,id);
              commitDraft(item.dataset.boardName+' 제외를 취소');
              renderPanel();
              showToast(item.dataset.boardName+'을 다시 추가했습니다');
            });
          };
        }
      });
    }
    function renderAvailable(order){
      var active={};
      order.forEach(function(id){active[id]=true});
      var available=movableBoards.filter(function(board){return !active[board.id]});
      availableSections.innerHTML=menuSections.map(function(section,index){
        var list=movableBoards.filter(function(board){return board.menuSection===section});
        var title=index===0?'':'<h3 class="boardOrderAvailableTitle">'+escapeHtml(section)+'</h3>';
        return '<section class="boardOrderAvailableSection" data-section="'+escapeHtml(section)+'">'+title+'<div class="boardOrderAvailableGrid">'+list.map(function(board){return active[board.id]?activeCategoryTile(board):addTile(board)}).join('')+'</div></section>';
      }).join('');
      var empty=backdrop.querySelector('.boardOrderEmpty');
      empty.hidden=available.length>0;
      empty.textContent='모든 게시판이 내 게시판에 추가되어 있습니다.';
      Array.prototype.forEach.call(availableSections.querySelectorAll('.boardOrderAdd'),function(button){button.onclick=function(){
        var id=button.dataset.boardId;
        if(editing){if(draftOrder.indexOf(id)<0)draftOrder.push(id);commitDraft(boardById[id].displayName+' 내 게시판에 추가')}else{var next=loadState().activeOrder.slice();if(next.indexOf(id)<0)next.push(id);saveState(next);draftOrder=next.slice();renderNav()}
        renderPanel();
        showToast(boardById[id].displayName+'을 추가했습니다');
      }});
    }
    function selectAvailableSection(section,shouldScroll){
      activeSection=menuSections.indexOf(section)>=0?section:'일반';
      Array.prototype.forEach.call(backdrop.querySelectorAll('.boardOrderSectionTabs [role="tab"]'),function(tab){
        var on=tab.dataset.section===activeSection;
        tab.classList.toggle('on',on);
        tab.setAttribute('aria-selected',String(on));
        tab.tabIndex=on?0:-1;
      });
      if(shouldScroll){
        var target=availableSections.querySelector('.boardOrderAvailableSection[data-section="'+activeSection+'"]');
        if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
      }
    }
    function renderPanel(){
      var order=currentOrder();
      var guide=backdrop.querySelector('.boardOrderGuide');
      var editButton=backdrop.querySelector('.boardOrderEdit');
      guide.textContent=editing?'드래그하여 순서를 변경하세요':'누르면 해당 게시판으로 이동합니다';
      editButton.textContent=editing?'완료':'편집';
      editButton.setAttribute('aria-pressed',String(editing));
      backdrop.classList.toggle('isEditing',editing);
      myGrid.innerHTML=fixedTile('home','홈','커뮤니티 홈')+fixedTile('all','전체','전체 게시글')+fixedTile('best','베스트','베스트글')+order.map(function(id){return movableTile(boardById[id])}).join('');
      var reset=backdrop.querySelector('.boardOrderReset');
      reset.hidden=!editing;
      bindMyGrid();
      renderAvailable(order);
      Array.prototype.forEach.call(backdrop.querySelectorAll('.boardOrderSectionTabs [role="tab"]'),function(tab){tab.onclick=function(){selectAvailableSection(tab.dataset.section,true)}});
      selectAvailableSection(activeSection,false);
    }
    function openPanel(options){
      options=options||{};
      panelOpener=options.opener||document.activeElement;
      editing=false;
      draftOrder=loadState().activeOrder.slice();
      activeSection='일반';
      updateDefaultHomeEntry();
      renderPanel();
      backdrop.hidden=false;
      document.body.classList.add('boardOrderOpen');
      panel.focus({preventScroll:true});
    }
    function closePanel(){
      if(editing){updateDraftFromGrid();commitDraft()}
      finishDrag(false);
      hideToast();
      editing=false;
      backdrop.hidden=true;
      document.body.classList.remove('boardOrderOpen');
      if(panelOpener&&panelOpener.isConnected)panelOpener.focus();else menuButton.focus();
    }

    function focusablePanelItems(){return Array.prototype.filter.call(panel.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])'),function(item){return !item.disabled&&!item.hidden&&item.getAttribute('aria-disabled')!=='true'&&item.getClientRects().length>0})}
    function focusableServiceItems(){return Array.prototype.filter.call(serviceBackdrop.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])'),function(item){return !item.disabled&&!item.hidden&&item.getClientRects().length>0})}

    function serviceBoardRow(board,favoriteIds){
      var favorite=favoriteIds.indexOf(board.id)>=0;
      return '<div class="communityMenuBoardRow '+(board.id===selectedId?'selected':'')+'"><button class="communityMenuBoard" type="button" data-service-board="'+escapeHtml(board.id)+'"><img src="'+boardAvatarSrc(board)+'" alt="" aria-hidden="true"><span>'+escapeHtml(board.displayName)+'</span></button><button class="communityMenuFavoriteToggle '+(favorite?'isFavorite':'')+'" type="button" data-favorite-board="'+escapeHtml(board.id)+'" aria-label="'+escapeHtml(board.displayName)+' 즐겨찾기 '+(favorite?'해제':'추가')+'" aria-pressed="'+String(favorite)+'"><img src="assets/reddit-rail/'+(favorite?'favorite-selected.svg?v=20261102redditfavorites3':'favorite.svg')+'" alt="" aria-hidden="true"></button></div>';
    }
    function renderServiceMenu(){
      var favoriteIds=loadBoardIds(favoriteStorageKey,movableBoards.length);
      var recentBoards=loadBoardIds(recentStorageKey,6).map(function(id){return boardById[id]}).filter(Boolean);
      var favoriteBoards=favoriteIds.map(function(id){return boardById[id]}).filter(Boolean);
      serviceBackdrop.querySelector('.communityMenuRecent').innerHTML=recentBoards.length?recentBoards.map(function(board){return serviceBoardRow(board,favoriteIds)}).join(''):'<p class="communityMenuEmpty">방문한 게시판이 여기에 표시됩니다.</p>';
      serviceBackdrop.querySelector('.communityMenuFavorites').innerHTML=favoriteBoards.length?favoriteBoards.map(function(board){return serviceBoardRow(board,favoriteIds)}).join(''):'<p class="communityMenuEmpty">게시판 옆 별표를 눌러 추가하세요.</p>';
      serviceBackdrop.querySelector('.communityMenuGroups').innerHTML=sections().map(function(section){
        var selectedInSection=section.boards.some(function(board){return board.id===selectedId});
        return '<details class="communityMenuGroup" '+(selectedInSection?'open':'')+'><summary><span>'+escapeHtml(section.title)+'</span><img src="assets/reddit-rail/section-toggle.svg" alt="" aria-hidden="true"></summary><div>'+section.boards.map(function(board){return serviceBoardRow(board,favoriteIds)}).join('')+'</div></details>';
      }).join('');
      Array.prototype.forEach.call(serviceBackdrop.querySelectorAll('.communityMenuPrimary [data-service-board]'),function(button){button.classList.toggle('selected',button.dataset.serviceBoard===selectedId)});
    }
    function toggleFavorite(id){
      var board=boardById[id];
      if(!board)return;
      var favoriteIds=loadBoardIds(favoriteStorageKey,movableBoards.length);
      var index=favoriteIds.indexOf(id);
      if(index>=0)favoriteIds.splice(index,1);else favoriteIds.unshift(id);
      saveBoardIds(favoriteStorageKey,favoriteIds,movableBoards.length);
      renderServiceMenu();
      announce(board.displayName+(index>=0?' 즐겨찾기를 해제했습니다':' 즐겨찾기에 추가했습니다'));
    }

    function openServiceMenu(){
      serviceOpener=document.activeElement;
      renderServiceMenu();
      var selectedButton=serviceBackdrop.querySelector('.communityMenuBoard[data-service-board="'+selectedId+'"]');
      if(selectedButton&&selectedButton.closest('details'))selectedButton.closest('details').open=true;
      serviceBackdrop.hidden=false;
      document.body.classList.add('communityMenuOpen');
      serviceBackdrop.querySelector('.communityMenuClose').focus();
    }
    function closeServiceMenu(){
      serviceBackdrop.hidden=true;
      document.body.classList.remove('communityMenuOpen');
      if(serviceOpener&&serviceOpener.isConnected)serviceOpener.focus();
    }

    menuButton.onclick=function(){openPanel({opener:menuButton})};
    if(headerMenuButton)headerMenuButton.onclick=openServiceMenu;
    backdrop.querySelector('.boardOrderClose').onclick=closePanel;
    backdrop.querySelector('.boardOrderDefaultEntry').onclick=function(){saveDefaultHome(selectedId)};
    backdrop.querySelector('.boardOrderEdit').onclick=function(){
      if(editing){updateDraftFromGrid();commitDraft();editing=false;showToast('편집을 완료했습니다')}else{draftOrder=loadState().activeOrder.slice();editing=true;announce('게시판 편집을 시작했습니다')}
      renderPanel();
    };
    backdrop.querySelector('.boardOrderReset').onclick=function(){draftOrder=defaultActiveOrder.slice();commitDraft('기본 순서로 저장');renderPanel();showToast('기본 순서로 되돌렸습니다')};
    backdrop.onclick=function(event){if(event.target===backdrop)closePanel()};
    serviceBackdrop.querySelector('.communityMenuClose').onclick=closeServiceMenu;
    serviceBackdrop.querySelector('.communityMenuViewEntry').onclick=function(){closeServiceMenu();if(api&&api.onOpenView)api.onOpenView()};
    serviceBackdrop.querySelector('.communityMenuBoardEntry').onclick=function(){closeServiceMenu();openPanel({opener:headerMenuButton})};
    serviceBackdrop.onclick=function(event){
      if(event.target===serviceBackdrop){closeServiceMenu();return}
      var favoriteButton=event.target.closest('[data-favorite-board]');
      if(favoriteButton){event.preventDefault();event.stopPropagation();toggleFavorite(favoriteButton.dataset.favoriteBoard);return}
      var boardButton=event.target.closest('[data-service-board]');
      if(boardButton){choose(boardButton.dataset.serviceBoard);closeServiceMenu()}
    };
    document.addEventListener('keydown',function(event){
      if(!serviceBackdrop.hidden){
        if(event.key==='Escape'){event.preventDefault();closeServiceMenu();return}
        if(event.key==='Tab'){
          var serviceFocusable=focusableServiceItems();
          if(serviceFocusable.length){var serviceFirst=serviceFocusable[0],serviceLast=serviceFocusable[serviceFocusable.length-1];if(event.shiftKey&&document.activeElement===serviceFirst){event.preventDefault();serviceLast.focus()}else if(!event.shiftKey&&document.activeElement===serviceLast){event.preventDefault();serviceFirst.focus()}}
        }
        return;
      }
      if(backdrop.hidden)return;
      if(event.key==='Escape'){event.preventDefault();closePanel();return}
      if(event.key!=='Tab')return;
      var focusable=focusablePanelItems();
      if(!focusable.length)return;
      var first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    });

    renderNav();
    choose(selectedId,{skipQuery:true,silent:true});
    if(queryParams.get('menu')==='all')requestAnimationFrame(function(){openPanel()});
    return{
      setSelectedByLabel:function(label){var board=boards.find(function(item){return item.displayName===label});if(board){selectedId=board.id;renderNav();updateCurrentBoardAvatar(board);updateQuery(board.id);scrollSelected()}else if(label==='전체 게시글'||label==='전체'){selectedId='home';renderNav();updateCurrentBoardAvatar(boardForId('home'));updateQuery('home');scrollSelected()}},
      selectById:function(id){choose(id)},
      getSelectedId:function(){return selectedId},
      openEditor:openPanel,
      avatarSrc:boardAvatarSrc
    };
  }

  window.BBMCommunityBoardNavigation={catalog:boards,sections:sections,ordered:orderedBoards,avatarSrc:boardAvatarSrc,normalizeOrder:function(value){return normalizeActiveOrder(value,true)},init:init,storageKey:storageKey,legacyStorageKey:legacyStorageKey,fixedIds:fixedIds.slice()};
})();
