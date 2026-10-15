(function(){
  'use strict';

  var boards=[
    {id:'best',displayName:'베스트글',section:'게시판',topicKey:'전체'},
    {id:'free',displayName:'자유게시판',section:'게시판',topicKey:'전체'},
    {id:'car-news',displayName:'자동차뉴스/토론',section:'게시판',topicKey:'전체'},
    {id:'politics',displayName:'정치/시사게시판',section:'게시판',topicKey:'전체'},
    {id:'test-drive',displayName:'시승기/배틀/목격담',section:'게시판',topicKey:'전체'},
    {id:'celebrity-car',displayName:'유명인의 차',section:'게시판',topicKey:'전체'},
    {id:'adult',displayName:'성인게시판',section:'게시판',topicKey:'전체'},
    {id:'boba-story',displayName:'보배드림 이야기',section:'게시판',topicKey:'전체'},
    {id:'suggestion',displayName:'제안/건의',section:'게시판',topicKey:'전체'},
    {id:'kbo',displayName:'국내야구',section:'게시판',topicKey:'전체'},
    {id:'mlb',displayName:'해외야구',section:'게시판',topicKey:'전체'},
    {id:'overseas-football',displayName:'해외축구',section:'게시판',topicKey:'전체'},
    {id:'domestic-football',displayName:'국내축구',section:'게시판',topicKey:'전체'},
    {id:'event',displayName:'이벤트',section:'게시판',topicKey:'전체'},
    {id:'new-humor',displayName:'신유머/감동/이슈',section:'자료실',topicKey:'전체'},
    {id:'humor',displayName:'유머게시판',section:'자료실',topicKey:'전체'},
    {id:'accident-blackbox',displayName:'교통사고/블박',section:'자료실',topicKey:'블박'},
    {id:'domestic-car',displayName:'국산차게시판',section:'자료실',topicKey:'전체'},
    {id:'import-car',displayName:'수입차게시판',section:'자료실',topicKey:'전체'},
    {id:'my-car-photo',displayName:'내차사진',section:'자료실',topicKey:'전체'},
    {id:'scoop',displayName:'직찍/특종발견',section:'자료실',topicKey:'전체'},
    {id:'car-media',displayName:'자동차사진/동영상',section:'자료실',topicKey:'전체'},
    {id:'installation',displayName:'장착시공사진',section:'자료실',topicKey:'튜닝'},
    {id:'free-media',displayName:'자유사진/동영상',section:'자료실',topicKey:'전체'},
    {id:'caution',displayName:'후방주의방',section:'자료실',topicKey:'전체'},
    {id:'racing-model',displayName:'레이싱모델',section:'자료실',topicKey:'전체'},
    {id:'military',displayName:'군사/무기',section:'자료실',topicKey:'전체'},
    {id:'truck-bus-heavy',displayName:'트럭/버스/중기',section:'자료실',topicKey:'전체'},
    {id:'aviation-rail',displayName:'항공/해운/철도',section:'자료실',topicKey:'전체'},
    {id:'bike-cycle',displayName:'오토바이/자전거',section:'자료실',topicKey:'전체'},
    {id:'oldcar-memory',displayName:'올드카/추억거리',section:'자료실',topicKey:'전체'}
  ];
  var storageKey='bbm.community.boardOrder.v1';
  var boardById={};
  boards.forEach(function(board,index){board.defaultOrder=index+1;boardById[board.id]=board});

  function normalizeOrder(value){
    var result=[],seen={};
    if(Array.isArray(value))value.forEach(function(id){if(boardById[id]&&!seen[id]){seen[id]=true;result.push(id)}});
    boards.forEach(function(board){if(!seen[board.id])result.push(board.id)});
    return result;
  }
  function loadOrder(){try{return normalizeOrder(JSON.parse(localStorage.getItem(storageKey)||'[]'))}catch(error){return normalizeOrder([])}}
  function saveOrder(order){try{localStorage.setItem(storageKey,JSON.stringify(normalizeOrder(order)))}catch(error){}}
  function orderedBoards(){return loadOrder().map(function(id){return boardById[id]})}
  function sections(){return ['게시판','자료실'].map(function(title){return{title:title,boards:boards.filter(function(board){return board.section===title})}})}

  function init(api){
    var scroller=document.getElementById('boardChannelScroller');
    var track=document.getElementById('boardChannelTrack');
    var menuButton=document.getElementById('boardOrderMenu');
    if(!scroller||!track||!menuButton)return null;
    var queryId=new URLSearchParams(location.search).get('board');
    var selectedId=boardById[queryId]?queryId:'free';

    function updateQuery(id){
      var url=new URL(location.href);
      if(id==='home')url.searchParams.delete('board');else url.searchParams.set('board',id);
      history.replaceState(null,'',url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():'')+url.hash);
    }
    function scrollSelected(){
      requestAnimationFrame(function(){var selected=track.querySelector('.boardChannelTab.on');if(selected)selected.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})});
    }
    function choose(id,options){
      options=options||{};
      selectedId=id;
      var board=id==='home'?{id:'home',displayName:'전체 게시글',topicKey:'전체'}:boardById[id];
      if(!board)return;
      renderNav();
      if(!options.skipQuery)updateQuery(id);
      if(api&&api.onSelect)api.onSelect(board,{silent:!!options.silent,fromNavigation:true});
      scrollSelected();
    }
    function renderNav(){
      var order=orderedBoards();
      track.innerHTML='<button class="boardChannelTab home '+(selectedId==='home'?'on':'')+'" data-board-id="home" '+(selectedId==='home'?'aria-current="page"':'')+'>홈</button>'+order.map(function(board){var on=board.id===selectedId;return '<button class="boardChannelTab '+(on?'on':'')+'" data-board-id="'+board.id+'" '+(on?'aria-current="page"':'')+'>'+board.displayName+'</button>'}).join('');
      Array.prototype.forEach.call(track.querySelectorAll('[data-board-id]'),function(button){button.onclick=function(){choose(button.dataset.boardId)}});
    }

    var backdrop=document.createElement('div');
    backdrop.className='boardOrderBackdrop';
    backdrop.hidden=true;
    backdrop.innerHTML='<section class="boardOrderPanel" role="dialog" aria-modal="true" aria-labelledby="boardOrderTitle"><header class="boardOrderHeader"><button class="boardOrderClose" aria-label="닫기"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button><h2 id="boardOrderTitle">게시판 순서</h2><button class="boardOrderDone">완료</button></header><div class="boardOrderBody"><div class="boardOrderHeading"><strong>내 게시판</strong><span>길게 눌러 순서 변경</span></div><div class="boardOrderHome">홈 · 고정</div><div class="boardOrderGrid"></div><button class="boardOrderReset">기본 순서로 초기화</button><p class="boardOrderHint">게시판은 삭제되지 않으며 순서만 변경됩니다.</p></div></section>';
    document.body.appendChild(backdrop);
    var grid=backdrop.querySelector('.boardOrderGrid');
    var draftOrder=[];
    var dragging=null,longPressTimer=null,longPressActive=false;

    function readGridOrder(){return Array.prototype.map.call(grid.querySelectorAll('.boardOrderItem'),function(item){return item.dataset.boardId})}
    function updateNumbers(){Array.prototype.forEach.call(grid.querySelectorAll('.boardOrderItem'),function(item,index){item.querySelector('.boardOrderIndex').textContent=String(index+1).padStart(2,'0');item.querySelector('.boardOrderDrag').setAttribute('aria-label',item.dataset.boardName+' 현재 '+(index+1)+'번째, 방향키로 이동')})}
    function renderEditor(){
      grid.innerHTML=draftOrder.map(function(id,index){var board=boardById[id];return '<div class="boardOrderItem" draggable="true" data-board-id="'+board.id+'" data-board-name="'+board.displayName+'"><span class="boardOrderIndex">'+String(index+1).padStart(2,'0')+'</span><span class="boardOrderName">'+board.displayName+'</span><button class="boardOrderDrag" aria-label="'+board.displayName+' 현재 '+(index+1)+'번째, 방향키로 이동"><img src="assets/lounge-menu.svg" alt=""></button></div>'}).join('');
      bindEditor();
    }
    function bindEditor(){
      Array.prototype.forEach.call(grid.querySelectorAll('.boardOrderItem'),function(item){
        item.ondragstart=function(e){dragging=item;item.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.dataset.boardId)};
        item.ondragover=function(e){e.preventDefault();if(dragging&&dragging!==item){var rect=item.getBoundingClientRect(),sameRow=e.clientY>=rect.top&&e.clientY<=rect.bottom,before=sameRow?e.clientX<=rect.left+rect.width/2:e.clientY<rect.top+rect.height/2;grid.insertBefore(dragging,before?item:item.nextSibling);updateNumbers()}};
        item.ondragend=function(){if(dragging)dragging.classList.remove('dragging');dragging=null};
        var handle=item.querySelector('.boardOrderDrag');
        handle.onkeydown=function(e){var items=Array.prototype.slice.call(grid.children),index=items.indexOf(item),columns=innerWidth>=768?5:3,next=index;if(e.key==='ArrowLeft')next=index-1;if(e.key==='ArrowRight')next=index+1;if(e.key==='ArrowUp')next=index-columns;if(e.key==='ArrowDown')next=index+columns;if(next!==index&&next>=0&&next<items.length){e.preventDefault();grid.insertBefore(item,next>index?items[next].nextSibling:items[next]);updateNumbers();handle.focus()}};
        handle.onpointerdown=function(e){if(e.pointerType==='mouse')return;longPressTimer=setTimeout(function(){dragging=item;longPressActive=true;item.classList.add('dragging');try{handle.setPointerCapture(e.pointerId)}catch(error){}},350)};
        handle.onpointermove=function(e){if(!longPressActive||dragging!==item)return;e.preventDefault();var target=document.elementFromPoint(e.clientX,e.clientY);target=target&&target.closest('.boardOrderItem');if(target&&target!==item){var rect=target.getBoundingClientRect(),sameRow=e.clientY>=rect.top&&e.clientY<=rect.bottom,before=sameRow?e.clientX<=rect.left+rect.width/2:e.clientY<rect.top+rect.height/2;grid.insertBefore(item,before?target:target.nextSibling);updateNumbers()}};
        handle.onpointerup=handle.onpointercancel=function(){clearTimeout(longPressTimer);if(dragging)dragging.classList.remove('dragging');dragging=null;longPressActive=false};
      });
    }
    function openEditor(){draftOrder=loadOrder();renderEditor();backdrop.hidden=false;document.body.classList.add('boardOrderOpen');backdrop.querySelector('.boardOrderClose').focus()}
    function closeEditor(){backdrop.hidden=true;document.body.classList.remove('boardOrderOpen');menuButton.focus()}
    menuButton.onclick=openEditor;
    backdrop.querySelector('.boardOrderClose').onclick=closeEditor;
    backdrop.querySelector('.boardOrderDone').onclick=function(){saveOrder(readGridOrder());renderNav();closeEditor();scrollSelected()};
    backdrop.querySelector('.boardOrderReset').onclick=function(){draftOrder=boards.map(function(board){return board.id});renderEditor()};
    backdrop.onclick=function(e){if(e.target===backdrop)closeEditor()};
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!backdrop.hidden)closeEditor()});

    renderNav();
    if(boardById[queryId])choose(queryId,{skipQuery:true,silent:true});else scrollSelected();
    return{
      setSelectedByLabel:function(label){var board=boards.find(function(item){return item.displayName===label});if(board){selectedId=board.id;renderNav();updateQuery(board.id);scrollSelected()}else if(label==='전체 게시글'){selectedId='home';renderNav();updateQuery('home');scrollSelected()}},
      getSelectedId:function(){return selectedId},
      openEditor:openEditor
    };
  }

  window.BBMCommunityBoardNavigation={catalog:boards,sections:sections,ordered:orderedBoards,normalizeOrder:normalizeOrder,init:init,storageKey:storageKey};
})();
