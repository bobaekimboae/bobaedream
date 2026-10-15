(function(){
  'use strict';

  var boards=[
    {id:'best',displayName:'베스트글',shortName:'베스트',section:'게시판',topicKey:'전체',fixed:true},
    {id:'free',displayName:'자유게시판',shortName:'자유',section:'게시판',topicKey:'전체'},
    {id:'car-news',displayName:'자동차뉴스/토론',shortName:'자동차뉴스',section:'게시판',topicKey:'전체'},
    {id:'politics',displayName:'정치/시사게시판',shortName:'정치시사',section:'게시판',topicKey:'전체'},
    {id:'test-drive',displayName:'시승기/배틀/목격담',shortName:'시승배틀',section:'게시판',topicKey:'전체'},
    {id:'celebrity-car',displayName:'유명인의 차',shortName:'유명인차',section:'게시판',topicKey:'전체'},
    {id:'adult',displayName:'성인게시판',shortName:'성인',section:'게시판',topicKey:'전체'},
    {id:'boba-story',displayName:'보배드림 이야기',shortName:'보배이야기',section:'게시판',topicKey:'전체'},
    {id:'suggestion',displayName:'제안/건의',shortName:'제안건의',section:'게시판',topicKey:'전체'},
    {id:'kbo',displayName:'국내야구',shortName:'국내야구',section:'게시판',topicKey:'전체'},
    {id:'mlb',displayName:'해외야구',shortName:'해외야구',section:'게시판',topicKey:'전체'},
    {id:'overseas-football',displayName:'해외축구',shortName:'해외축구',section:'게시판',topicKey:'전체'},
    {id:'domestic-football',displayName:'국내축구',shortName:'국내축구',section:'게시판',topicKey:'전체'},
    {id:'event',displayName:'이벤트',shortName:'이벤트',section:'게시판',topicKey:'전체'},
    {id:'new-humor',displayName:'신유머/감동/이슈',shortName:'유머이슈',section:'자료실',topicKey:'전체'},
    {id:'humor',displayName:'유머게시판',shortName:'유머',section:'자료실',topicKey:'전체'},
    {id:'accident-blackbox',displayName:'교통사고/블박',shortName:'교통블박',section:'자료실',topicKey:'블박'},
    {id:'domestic-car',displayName:'국산차게시판',shortName:'국산차',section:'자료실',topicKey:'전체'},
    {id:'import-car',displayName:'수입차게시판',shortName:'수입차',section:'자료실',topicKey:'전체'},
    {id:'my-car-photo',displayName:'내차사진',shortName:'내차사진',section:'자료실',topicKey:'전체'},
    {id:'scoop',displayName:'직찍/특종발견',shortName:'직찍특종',section:'자료실',topicKey:'전체'},
    {id:'car-media',displayName:'자동차사진/동영상',shortName:'자동차영상',section:'자료실',topicKey:'전체'},
    {id:'installation',displayName:'장착시공사진',shortName:'장착시공',section:'자료실',topicKey:'튜닝'},
    {id:'free-media',displayName:'자유사진/동영상',shortName:'자유영상',section:'자료실',topicKey:'전체'},
    {id:'caution',displayName:'후방주의방',shortName:'후방주의',section:'자료실',topicKey:'전체'},
    {id:'racing-model',displayName:'레이싱모델',shortName:'레이싱',section:'자료실',topicKey:'전체'},
    {id:'military',displayName:'군사/무기',shortName:'군사무기',section:'자료실',topicKey:'전체'},
    {id:'truck-bus-heavy',displayName:'트럭/버스/중기',shortName:'트럭중기',section:'자료실',topicKey:'전체'},
    {id:'aviation-rail',displayName:'항공/해운/철도',shortName:'항공철도',section:'자료실',topicKey:'전체'},
    {id:'bike-cycle',displayName:'오토바이/자전거',shortName:'바이크',section:'자료실',topicKey:'전체'},
    {id:'oldcar-memory',displayName:'올드카/추억거리',shortName:'올드카',section:'자료실',topicKey:'전체'}
  ];
  var storageKey='bbm.community.boardChannels.v2';
  var legacyStorageKey='bbm.community.boardOrder.v1';
  var fixedIds=['home','best'];
  var movableBoards=boards.filter(function(board){return !board.fixed});
  var defaultActiveOrder=movableBoards.map(function(board){return board.id});
  var boardById={};
  boards.forEach(function(board,index){board.defaultOrder=index+1;boardById[board.id]=board});

  function escapeHtml(value){return String(value).replace(/[&<>\"]/g,function(character){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[character]})}
  function normalizeActiveOrder(value,appendMissing){
    var result=[],seen={};
    if(Array.isArray(value))value.forEach(function(id){if(boardById[id]&&!boardById[id].fixed&&!seen[id]){seen[id]=true;result.push(id)}});
    if(appendMissing)defaultActiveOrder.forEach(function(id){if(!seen[id]){seen[id]=true;result.push(id)}});
    return result;
  }
  function saveState(order){
    var state={version:2,fixedIds:fixedIds.slice(),activeOrder:normalizeActiveOrder(order,false),updatedAt:new Date().toISOString()};
    try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(error){}
    return state;
  }
  function loadState(){
    try{
      var stored=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(stored&&stored.version===2&&Array.isArray(stored.activeOrder))return{version:2,fixedIds:fixedIds.slice(),activeOrder:normalizeActiveOrder(stored.activeOrder,false),updatedAt:stored.updatedAt||null};
    }catch(error){}
    try{
      var legacy=JSON.parse(localStorage.getItem(legacyStorageKey)||'null');
      if(Array.isArray(legacy))return saveState(normalizeActiveOrder(legacy,true));
    }catch(error){}
    return{version:2,fixedIds:fixedIds.slice(),activeOrder:defaultActiveOrder.slice(),updatedAt:null};
  }
  function orderedBoards(){return[boardById.best].concat(loadState().activeOrder.map(function(id){return boardById[id]}).filter(Boolean))}
  function sections(){return['게시판','자료실'].map(function(title){return{title:title,boards:boards.filter(function(board){return board.section===title})}})}

  function init(api){
    var scroller=document.getElementById('boardChannelScroller');
    var track=document.getElementById('boardChannelTrack');
    var menuButton=document.getElementById('boardOrderMenu');
    var headerMenuButton=document.querySelector('.appbar .hamburger');
    if(!scroller||!track||!menuButton)return null;
    var queryId=new URLSearchParams(location.search).get('board');
    var selectedId=queryId==='home'||boardById[queryId]?queryId:'free';
    var editing=false;
    var draftOrder=[];
    var activeSection='게시판';
    var dragging=null;
    var longPressTimer=null;
    var longPressActive=false;

    function boardForId(id){return id==='home'?{id:'home',displayName:'전체 게시글',shortName:'전체',topicKey:'전체',fixed:true}:boardById[id]}
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
      if(!options.skipQuery)updateQuery(id);
      if(api&&api.onSelect)api.onSelect(board,{silent:!!options.silent,fromNavigation:true});
      scrollSelected();
      if(options.closePanel)closePanel();
    }
    function navButton(id,label,fullName,isHome){
      var on=id===selectedId;
      return '<button class="boardChannelTab '+(isHome?'home ':'')+(on?'on':'')+'" data-board-id="'+escapeHtml(id)+'" aria-label="'+escapeHtml(fullName)+'" '+(on?'aria-current="page"':'')+'>'+escapeHtml(label)+'</button>';
    }
    function renderNav(){
      var state=loadState();
      var items=[navButton('home','전체','전체 게시글',true),navButton('best','베스트','베스트글',false)];
      state.activeOrder.forEach(function(id){var board=boardById[id];if(board)items.push(navButton(board.id,board.shortName,board.displayName,false))});
      track.innerHTML=items.join('');
      Array.prototype.forEach.call(track.querySelectorAll('[data-board-id]'),function(button){button.onclick=function(){choose(button.dataset.boardId)}});
    }

    var backdrop=document.createElement('div');
    backdrop.className='boardOrderBackdrop';
    backdrop.hidden=true;
    backdrop.innerHTML='<section class="boardOrderPanel" role="dialog" aria-modal="true" aria-labelledby="boardOrderTitle"><header class="boardOrderHeader"><h2 id="boardOrderTitle">커뮤니티 메뉴</h2><button class="boardOrderClose" aria-label="닫기"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button></header><div class="boardOrderBody"><button class="boardOrderViewEntry" type="button"><span class="boardOrderViewIcon" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="boardOrderViewCopy"><strong>보기 방식</strong><small class="boardOrderCurrentView">목록형</small></span><span class="boardOrderViewArrow" aria-hidden="true">›</span></button><div class="boardOrderHeading"><div><strong>내 채널</strong><span class="boardOrderGuide">누르면 해당 게시판으로 이동합니다</span></div><button class="boardOrderEdit" aria-pressed="false">편집</button></div><div class="boardOrderMyGrid"></div><div class="boardOrderAvailable"><div class="boardOrderSectionTabs" role="tablist" aria-label="게시판 분류"><button role="tab" data-section="게시판">게시판</button><button role="tab" data-section="자료실">자료실</button></div><div class="boardOrderAvailableGrid"></div><p class="boardOrderEmpty" hidden></p></div><button class="boardOrderReset" hidden>기본 순서로 초기화</button><p class="boardOrderHint">내 채널에서 제외해도 아래 분류에서 다시 추가할 수 있습니다.</p></div><div class="boardOrderLive" aria-live="polite" aria-atomic="true"></div></section>';
    document.body.appendChild(backdrop);
    var myGrid=backdrop.querySelector('.boardOrderMyGrid');
    var availableGrid=backdrop.querySelector('.boardOrderAvailableGrid');

    function fixedTile(id,label,fullName){
      var selected=id===selectedId;
      return '<div class="boardOrderItem boardOrderFixed '+(selected?'selected':'')+'" role="button" tabindex="0" data-board-id="'+id+'" data-fixed="true" aria-label="'+escapeHtml(fullName)+' 고정 채널" '+(selected?'aria-current="page"':'')+'><span class="boardOrderName">'+escapeHtml(label)+'</span></div>';
    }
    function movableTile(board){
      var selected=board.id===selectedId;
      return '<div class="boardOrderItem '+(selected?'selected ':'')+(editing?'editing':'')+'" role="button" tabindex="0" draggable="'+(editing?'true':'false')+'" data-board-id="'+escapeHtml(board.id)+'" data-board-name="'+escapeHtml(board.displayName)+'" data-movable="true" aria-label="'+escapeHtml(board.displayName)+(editing?' 순서 변경':' 이동')+'" '+(selected?'aria-current="page"':'')+'><span class="boardOrderName">'+escapeHtml(board.shortName)+'</span>'+(editing?'<button class="boardOrderRemove" aria-label="'+escapeHtml(board.displayName)+' 내 채널에서 제외"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button>':'')+'</div>';
    }
    function addTile(board){
      return '<button class="boardOrderAdd" data-board-id="'+escapeHtml(board.id)+'" aria-label="'+escapeHtml(board.displayName)+' 내 채널에 추가"><span>'+escapeHtml(board.shortName)+'</span><img class="boardOrderPlusIcon" src="assets/chzzk-detail/icons/close.svg" alt=""></button>';
    }
    function currentOrder(){return editing?draftOrder.slice():loadState().activeOrder.slice()}
    function readGridOrder(){return Array.prototype.map.call(myGrid.querySelectorAll('.boardOrderItem[data-movable="true"]'),function(item){return item.dataset.boardId})}
    function updateDraftFromGrid(){draftOrder=normalizeActiveOrder(readGridOrder(),false)}
    function updateItemLabels(){
      Array.prototype.forEach.call(myGrid.querySelectorAll('.boardOrderItem[data-movable="true"]'),function(item,index){item.setAttribute('aria-label',item.dataset.boardName+' 현재 '+(index+3)+'번째, 방향키로 이동')});
    }
    function finishDrag(){
      clearTimeout(longPressTimer);
      if(dragging)dragging.classList.remove('dragging');
      if(longPressActive)updateDraftFromGrid();
      dragging=null;
      longPressActive=false;
      document.body.classList.remove('boardOrderDragging');
    }
    function moveItem(item,target,event){
      if(!target||target===item||target.dataset.movable!=='true')return;
      var rect=target.getBoundingClientRect();
      var sameRow=event.clientY>=rect.top&&event.clientY<=rect.bottom;
      var before=sameRow?event.clientX<=rect.left+rect.width/2:event.clientY<rect.top+rect.height/2;
      myGrid.insertBefore(item,before?target:target.nextSibling);
      updateItemLabels();
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
          var index=items.indexOf(item),columns=innerWidth>=768?6:4,next=index;
          if(event.key==='ArrowLeft')next=index-1;
          if(event.key==='ArrowRight')next=index+1;
          if(event.key==='ArrowUp')next=index-columns;
          if(event.key==='ArrowDown')next=index+columns;
          if(next!==index&&next>=0&&next<items.length){event.preventDefault();myGrid.insertBefore(item,next>index?items[next].nextSibling:items[next]);updateDraftFromGrid();updateItemLabels();item.focus();announce(item.dataset.boardName+' '+(next+3)+'번째로 이동')}
        };
        if(!editing||item.dataset.movable!=='true')return;
        item.ondragstart=function(event){dragging=item;longPressActive=true;item.classList.add('dragging');document.body.classList.add('boardOrderDragging');event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',id)};
        item.ondragenter=function(event){if(dragging&&dragging!==item){event.preventDefault();myGrid.insertBefore(dragging,item);updateItemLabels()}};
        item.ondragover=function(event){event.preventDefault();if(dragging)moveItem(dragging,item,event)};
        item.ondrop=function(event){
          event.preventDefault();
          var sourceId=event.dataTransfer&&event.dataTransfer.getData('text/plain');
          var source=sourceId&&myGrid.querySelector('.boardOrderItem[data-board-id="'+sourceId+'"]');
          if(source&&source!==item)myGrid.insertBefore(source,item);
          updateDraftFromGrid();
        };
        item.ondragend=function(){updateDraftFromGrid();finishDrag()};
        item.onpointerdown=function(event){
          if(event.target.closest('.boardOrderRemove')||event.pointerType==='mouse')return;
          clearTimeout(longPressTimer);
          longPressTimer=setTimeout(function(){dragging=item;longPressActive=true;item.classList.add('dragging');document.body.classList.add('boardOrderDragging');try{item.setPointerCapture(event.pointerId)}catch(error){}},350);
        };
        item.onpointermove=function(event){
          if(!longPressActive||dragging!==item)return;
          event.preventDefault();
          var target=document.elementFromPoint(event.clientX,event.clientY);
          moveItem(item,target&&target.closest('.boardOrderItem[data-movable="true"]'),event);
          var body=backdrop.querySelector('.boardOrderBody');
          var bodyRect=body.getBoundingClientRect();
          if(event.clientY<bodyRect.top+64)body.scrollTop-=12;
          if(event.clientY>bodyRect.bottom-64)body.scrollTop+=12;
        };
        item.onpointerup=item.onpointercancel=function(){updateDraftFromGrid();finishDrag()};
        var remove=item.querySelector('.boardOrderRemove');
        if(remove){
          remove.onpointerdown=function(event){event.stopPropagation()};
          remove.onclick=function(event){event.stopPropagation();draftOrder=draftOrder.filter(function(boardId){return boardId!==id});announce(item.dataset.boardName+' 내 채널에서 제외');renderPanel()};
        }
      });
    }
    function renderAvailable(order){
      var active={};
      order.forEach(function(id){active[id]=true});
      var available=movableBoards.filter(function(board){return board.section===activeSection&&!active[board.id]});
      availableGrid.innerHTML=available.map(addTile).join('');
      var empty=backdrop.querySelector('.boardOrderEmpty');
      empty.hidden=available.length>0;
      empty.textContent=activeSection+'의 모든 게시판이 내 채널에 추가되어 있습니다.';
      Array.prototype.forEach.call(availableGrid.querySelectorAll('.boardOrderAdd'),function(button){button.onclick=function(){
        var id=button.dataset.boardId;
        if(editing){if(draftOrder.indexOf(id)<0)draftOrder.push(id)}else{var next=loadState().activeOrder.slice();if(next.indexOf(id)<0)next.push(id);saveState(next);renderNav()}
        announce(boardById[id].displayName+' 내 채널에 추가');
        renderPanel();
      }});
    }
    function renderPanel(){
      var order=currentOrder();
      var currentView=backdrop.querySelector('.boardOrderCurrentView');
      var guide=backdrop.querySelector('.boardOrderGuide');
      var editButton=backdrop.querySelector('.boardOrderEdit');
      guide.textContent=editing?'길게 눌러 순서를 변경하세요':'누르면 해당 게시판으로 이동합니다';
      editButton.textContent=editing?'완료':'편집';
      editButton.setAttribute('aria-pressed',String(editing));
      currentView.textContent=(document.getElementById('typeLabel')||{}).textContent||'목록형';
      backdrop.classList.toggle('isEditing',editing);
      myGrid.innerHTML=fixedTile('home','전체','전체 게시글')+fixedTile('best','베스트','베스트글')+order.map(function(id){return movableTile(boardById[id])}).join('');
      Array.prototype.forEach.call(backdrop.querySelectorAll('.boardOrderSectionTabs [role="tab"]'),function(tab){var on=tab.dataset.section===activeSection;tab.classList.toggle('on',on);tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;tab.onclick=function(){activeSection=tab.dataset.section;renderPanel()}});
      var reset=backdrop.querySelector('.boardOrderReset');
      reset.hidden=!editing;
      bindMyGrid();
      renderAvailable(order);
    }
    function openPanel(){editing=false;draftOrder=loadState().activeOrder.slice();activeSection='게시판';renderPanel();backdrop.hidden=false;document.body.classList.add('boardOrderOpen');backdrop.querySelector('.boardOrderClose').focus()}
    function closePanel(){finishDrag();editing=false;backdrop.hidden=true;document.body.classList.remove('boardOrderOpen');menuButton.focus()}

    menuButton.onclick=openPanel;
    if(headerMenuButton)headerMenuButton.onclick=openPanel;
    backdrop.querySelector('.boardOrderClose').onclick=closePanel;
    backdrop.querySelector('.boardOrderViewEntry').onclick=function(){closePanel();if(api&&api.onOpenView)api.onOpenView()};
    backdrop.querySelector('.boardOrderEdit').onclick=function(){
      if(editing){updateDraftFromGrid();saveState(draftOrder);editing=false;renderNav();announce('내 채널 순서를 저장했습니다')}else{draftOrder=loadState().activeOrder.slice();editing=true}
      renderPanel();
    };
    backdrop.querySelector('.boardOrderReset').onclick=function(){draftOrder=defaultActiveOrder.slice();announce('기본 순서로 되돌렸습니다');renderPanel()};
    backdrop.onclick=function(event){if(event.target===backdrop)closePanel()};
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!backdrop.hidden)closePanel()});

    renderNav();
    if(queryId==='home'||boardById[queryId])choose(queryId,{skipQuery:true,silent:true});else scrollSelected();
    return{
      setSelectedByLabel:function(label){var board=boards.find(function(item){return item.displayName===label});if(board){selectedId=board.id;renderNav();updateQuery(board.id);scrollSelected()}else if(label==='전체 게시글'||label==='전체'){selectedId='home';renderNav();updateQuery('home');scrollSelected()}},
      getSelectedId:function(){return selectedId},
      openEditor:openPanel
    };
  }

  window.BBMCommunityBoardNavigation={catalog:boards,sections:sections,ordered:orderedBoards,normalizeOrder:function(value){return normalizeActiveOrder(value,true)},init:init,storageKey:storageKey,legacyStorageKey:legacyStorageKey,fixedIds:fixedIds.slice()};
})();
