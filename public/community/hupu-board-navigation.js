(function(){
  'use strict';

  var boards=[
    {id:'best',displayName:'베스트글',shortName:'베스트',section:'게시판',topicKey:'전체',fixed:true,avatarLabel:'BEST',avatarColor:'#18181b',avatarAccent:'#f5b942'},
    {id:'free',displayName:'자유게시판',shortName:'자유',section:'게시판',topicKey:'전체',avatarLabel:'자유',avatarColor:'#2457d6',avatarAccent:'#6ea8ff'},
    {id:'car-news',displayName:'자동차뉴스/토론',shortName:'자동차뉴스',section:'게시판',topicKey:'전체',avatarLabel:'뉴스',avatarColor:'#006d77',avatarAccent:'#45c4b0'},
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
  var fixedIds=['home','best'];
  var movableBoards=boards.filter(function(board){return !board.fixed});
  var defaultActiveOrder=movableBoards.map(function(board){return board.id});
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
    var queryParams=new URLSearchParams(location.search);
    var previewGrid=queryParams.get('boardGrid');
    var panelColumns=previewGrid==='3'?3:4;
    var selectedId=queryId==='home'||boardById[queryId]?queryId:'home';
    var editing=false;
    var draftOrder=[];
    var activeSection='게시판';
    var dragging=null;
    var dragStartOrder=[];
    var dragPointerId=null;
    var longPressTimer=null;
    var longPressActive=false;
    var panelOpener=null;
    var toastTimer=null;

    function boardForId(id){return id==='home'?{id:'home',displayName:'전체 게시글',shortName:'전체',topicKey:'전체',fixed:true,avatarLabel:'ALL',avatarColor:'#202124',avatarAccent:'#666a70'}:boardById[id]}
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
      var items=[navButton('home','전체','전체 게시글',true),navButton('best','베스트','베스트글',false)];
      state.activeOrder.forEach(function(id){var board=boardById[id];if(board)items.push(navButton(board.id,board.shortName,board.displayName,false))});
      track.innerHTML=items.join('');
      Array.prototype.forEach.call(track.querySelectorAll('[data-board-id]'),function(button){button.onclick=function(){choose(button.dataset.boardId)}});
    }

    var backdrop=document.createElement('div');
    backdrop.className='boardOrderBackdrop';
    backdrop.hidden=true;
    backdrop.innerHTML='<section class="boardOrderPanel" role="dialog" aria-modal="true" aria-labelledby="boardOrderTitle"><header class="boardOrderHeader"><h2 id="boardOrderTitle">전체 게시판</h2><button class="boardOrderClose" aria-label="닫기"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button></header><div class="boardOrderBody"><button class="boardOrderViewEntry" type="button"><span class="boardOrderViewIcon" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="boardOrderViewCopy"><strong>보기 방식</strong></span><span class="boardOrderViewArrow" aria-hidden="true">›</span></button><div class="boardOrderHeading"><div><strong>내 게시판</strong><span class="boardOrderGuide">누르면 해당 게시판으로 이동합니다</span></div><button class="boardOrderEdit" aria-pressed="false">편집</button></div><div class="boardOrderMyGrid"></div><div class="boardOrderAvailable"><div class="boardOrderSectionTabs" role="tablist" aria-label="게시판 분류"><button role="tab" data-section="게시판">게시판</button><button role="tab" data-section="자료실">자료실</button></div><div class="boardOrderAvailableGrid"></div><p class="boardOrderEmpty" hidden></p></div><button class="boardOrderReset" hidden>기본 순서로 초기화</button><p class="boardOrderHint">변경 내용은 바로 저장되며, 제외한 게시판은 아래에서 다시 추가할 수 있습니다.</p></div><div class="boardOrderToast" role="status" aria-live="polite" hidden><span class="boardOrderToastText"></span><button class="boardOrderUndo" type="button" hidden>되돌리기</button></div><div class="boardOrderLive" aria-live="polite" aria-atomic="true"></div></section>';
    document.body.appendChild(backdrop);
    var panel=backdrop.querySelector('.boardOrderPanel');
    if(panelColumns)panel.dataset.gridColumns=String(panelColumns);
    var myGrid=backdrop.querySelector('.boardOrderMyGrid');
    var availableGrid=backdrop.querySelector('.boardOrderAvailableGrid');
    var toast=backdrop.querySelector('.boardOrderToast');
    var toastText=backdrop.querySelector('.boardOrderToastText');
    var toastUndo=backdrop.querySelector('.boardOrderUndo');

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
      return '<div class="boardOrderItem boardOrderFixed '+(selected?'selected':'')+'" '+interactive+' data-board-id="'+id+'" data-fixed="true" aria-label="'+escapeHtml(fullName)+' 고정 게시판" '+(selected?'aria-current="page"':'')+'><span class="boardOrderName">'+escapeHtml(label)+'</span>'+(editing?'<img class="boardOrderFixedIcon" src="assets/chzzk-detail/icons/lock.svg" alt="고정">':'')+'</div>';
    }
    function movableTile(board){
      var selected=board.id===selectedId;
      return '<div class="boardOrderItem '+(selected?'selected ':'')+(editing?'editing':'')+'" role="button" tabindex="0" draggable="'+(editing?'true':'false')+'" data-board-id="'+escapeHtml(board.id)+'" data-board-name="'+escapeHtml(board.displayName)+'" data-movable="true" aria-label="'+escapeHtml(board.displayName)+(editing?' 순서 변경':' 이동')+'" '+(editing?'aria-grabbed="false" ':'')+(selected?'aria-current="page"':'')+'><span class="boardOrderName">'+escapeHtml(board.shortName)+'</span>'+(editing?'<button class="boardOrderRemove" aria-label="'+escapeHtml(board.displayName)+' 내 게시판에서 제외"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button>':'')+'</div>';
    }
    function addTile(board){
      return '<button class="boardOrderAdd" data-board-id="'+escapeHtml(board.id)+'" aria-label="'+escapeHtml(board.displayName)+' 내 게시판에 추가"><span>'+escapeHtml(board.shortName)+'</span><img class="boardOrderPlusIcon" src="assets/chzzk-detail/icons/close.svg" alt=""></button>';
    }
    function currentOrder(){return editing?draftOrder.slice():loadState().activeOrder.slice()}
    function readGridOrder(){return Array.prototype.map.call(myGrid.querySelectorAll('.boardOrderItem[data-movable="true"]'),function(item){return item.dataset.boardId})}
    function updateDraftFromGrid(){draftOrder=normalizeActiveOrder(readGridOrder(),false)}
    function updateItemLabels(){
      var items=myGrid.querySelectorAll('.boardOrderItem[data-movable="true"]');
      Array.prototype.forEach.call(items,function(item,index){
        item.setAttribute('aria-label',item.dataset.boardName+' 현재 '+(index+3)+'번째, 방향키로 이동');
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
          if(next!==index&&next>=0&&next<items.length){event.preventDefault();myGrid.insertBefore(item,next>index?items[next].nextSibling:items[next]);updateDraftFromGrid();updateItemLabels();commitDraft(item.dataset.boardName+' '+(next+3)+'번째로 이동·저장');item.focus()}
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
          longPressTimer=setTimeout(function(){startDrag(item,pointerId)},350);
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
      var available=movableBoards.filter(function(board){return board.section===activeSection&&!active[board.id]});
      availableGrid.innerHTML=available.map(addTile).join('');
      var empty=backdrop.querySelector('.boardOrderEmpty');
      empty.hidden=available.length>0;
      empty.textContent=activeSection+'의 모든 게시판이 내 게시판에 추가되어 있습니다.';
      Array.prototype.forEach.call(availableGrid.querySelectorAll('.boardOrderAdd'),function(button){button.onclick=function(){
        var id=button.dataset.boardId;
        if(editing){if(draftOrder.indexOf(id)<0)draftOrder.push(id);commitDraft(boardById[id].displayName+' 내 게시판에 추가')}else{var next=loadState().activeOrder.slice();if(next.indexOf(id)<0)next.push(id);saveState(next);draftOrder=next.slice();renderNav()}
        renderPanel();
        showToast(boardById[id].displayName+'을 추가했습니다');
      }});
    }
    function renderPanel(){
      var order=currentOrder();
      var guide=backdrop.querySelector('.boardOrderGuide');
      var editButton=backdrop.querySelector('.boardOrderEdit');
      guide.textContent=editing?'길게 눌러 순서를 변경하세요':'누르면 해당 게시판으로 이동합니다';
      editButton.textContent=editing?'완료':'편집';
      editButton.setAttribute('aria-pressed',String(editing));
      backdrop.classList.toggle('isEditing',editing);
      myGrid.innerHTML=fixedTile('home','전체','전체 게시글')+fixedTile('best','베스트','베스트글')+order.map(function(id){return movableTile(boardById[id])}).join('');
      Array.prototype.forEach.call(backdrop.querySelectorAll('.boardOrderSectionTabs [role="tab"]'),function(tab){var on=tab.dataset.section===activeSection;tab.classList.toggle('on',on);tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;tab.onclick=function(){activeSection=tab.dataset.section;renderPanel()}});
      var reset=backdrop.querySelector('.boardOrderReset');
      reset.hidden=!editing;
      bindMyGrid();
      renderAvailable(order);
    }
    function openPanel(options){
      options=options||{};
      panelOpener=options.opener||document.activeElement;
      editing=false;
      draftOrder=loadState().activeOrder.slice();
      activeSection='게시판';
      backdrop.querySelector('.boardOrderViewEntry').hidden=options.showViewEntry===false;
      renderPanel();
      backdrop.hidden=false;
      document.body.classList.add('boardOrderOpen');
      backdrop.querySelector('.boardOrderClose').focus();
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

    menuButton.onclick=function(){openPanel({showViewEntry:true,opener:menuButton})};
    if(headerMenuButton)headerMenuButton.onclick=function(){openPanel({showViewEntry:false,opener:headerMenuButton})};
    backdrop.querySelector('.boardOrderClose').onclick=closePanel;
    backdrop.querySelector('.boardOrderViewEntry').onclick=function(){closePanel();if(api&&api.onOpenView)api.onOpenView()};
    backdrop.querySelector('.boardOrderEdit').onclick=function(){
      if(editing){updateDraftFromGrid();commitDraft();editing=false;showToast('편집을 완료했습니다')}else{draftOrder=loadState().activeOrder.slice();editing=true;announce('게시판 편집을 시작했습니다')}
      renderPanel();
    };
    backdrop.querySelector('.boardOrderReset').onclick=function(){draftOrder=defaultActiveOrder.slice();commitDraft('기본 순서로 저장');renderPanel();showToast('기본 순서로 되돌렸습니다')};
    backdrop.onclick=function(event){if(event.target===backdrop)closePanel()};
    document.addEventListener('keydown',function(event){
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
    if(queryId==='home'||boardById[queryId])choose(queryId,{skipQuery:true,silent:true});else choose('home',{skipQuery:true,silent:true});
    if(queryParams.get('menu')==='all')requestAnimationFrame(function(){openPanel({showViewEntry:false})});
    return{
      setSelectedByLabel:function(label){var board=boards.find(function(item){return item.displayName===label});if(board){selectedId=board.id;renderNav();updateCurrentBoardAvatar(board);updateQuery(board.id);scrollSelected()}else if(label==='전체 게시글'||label==='전체'){selectedId='home';renderNav();updateCurrentBoardAvatar(boardForId('home'));updateQuery('home');scrollSelected()}},
      getSelectedId:function(){return selectedId},
      openEditor:openPanel,
      avatarSrc:boardAvatarSrc
    };
  }

  window.BBMCommunityBoardNavigation={catalog:boards,sections:sections,ordered:orderedBoards,avatarSrc:boardAvatarSrc,normalizeOrder:function(value){return normalizeActiveOrder(value,true)},init:init,storageKey:storageKey,legacyStorageKey:legacyStorageKey,fixedIds:fixedIds.slice()};
})();
