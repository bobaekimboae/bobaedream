(function(){
  var LIST_PAGE='bobaedream-pc-board-list.html';
  var DETAIL_PAGE='bobaedream-pc-board-detail.html';
  var STORE_POSTS='bobaePcDemoPosts';
  var STORE_LOGIN='bobaePcDemoLoggedIn';
  var STORE_BOARD='bobaePcCurrentBoard';
  var isList=!!document.getElementById('postRows');
  var isDetail=!!document.querySelector('.commentSection');
  var basePosts=window.bobaeScenarioPosts||window.bobaeBoardPosts||[];
  var boardNames=['전체 게시글','국산차 오너톡','수입차 라운지','전기차 충전소','SUV 패밀리카','화물·특장','중고차 문의','정비 상담','튜닝 인증','보험·사고','블랙박스 제보','공지','자유','질문','시승기','출석체크'];
  var boardConfig={
    '전체 게시글':{categories:[],label:'전체'},
    '국산차 오너톡':{categories:['국산차'],label:'국산차'},
    '수입차 라운지':{categories:['수입차'],label:'수입차'},
    '전기차 충전소':{categories:['전기차'],label:'전기차'},
    'SUV 패밀리카':{categories:['SUV'],label:'SUV'},
    '화물·특장':{categories:['화물'],label:'화물'},
    '중고차 문의':{categories:['중고차'],label:'중고차'},
    '정비 상담':{categories:['정비'],label:'정비'},
    '튜닝 인증':{categories:['튜닝'],label:'튜닝'},
    '보험·사고':{categories:['보험','사고/블박'],label:'보험'},
    '블랙박스 제보':{categories:['블랙박스'],label:'블랙박스'},
    '공지':{categories:['공지'],label:'공지'},
    '자유':{categories:['자유'],label:'자유'},
    '질문':{categories:['질문'],label:'질문'},
    '시승기':{categories:['시승기'],label:'시승기'},
    '출석체크':{categories:['출석'],label:'출석'}
  };

  addInteractionStyles();
  setupLoginState();
  setupBoardNavigation();
  setupWriteButtons();
  if(isList) setupListPage();
  if(isDetail) setupDetailPage();

  function addInteractionStyles(){
    if(document.getElementById('bobaeInteractionStyles')) return;
    var style=document.createElement('style');
    style.id='bobaeInteractionStyles';
    style.textContent=[
      '.mockLoginBackdrop{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.66);display:flex;align-items:center;justify-content:center}',
      '.mockLoginModal{width:320px;border-radius:10px;background:#fff;box-shadow:0 14px 28px rgba(0,0,0,.18);overflow:hidden;text-align:center}',
      '.mockLoginTitle{height:60px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #edf0f4;color:#222;font-size:17px;line-height:20px;font-weight:800}',
      '.mockLoginBody{padding:23px 30px 19px;color:#333;font-size:14px;line-height:20px}',
      '.mockLoginActions{display:flex;gap:12px;padding:0 30px 20px}',
      '.mockLoginActions button{height:41px;border-radius:7px;font-size:15px;line-height:18px;font-weight:800;flex:1}',
      '.mockLoginCancel{background:#e8f1ff;color:#1264c4}',
      '.mockLoginConfirm{background:#1264c4;color:#fff}',
      '.bobaeToast{position:fixed;left:50%;bottom:34px;z-index:1100;transform:translateX(-50%);min-width:220px;max-width:520px;height:42px;border-radius:21px;background:rgba(17,19,23,.94);color:#fff;display:flex;align-items:center;justify-content:center;padding:0 22px;font-size:14px;line-height:18px;font-weight:700;box-shadow:0 12px 28px rgba(0,0,0,.18)}',
      '.writePanel{min-height:720px;border-radius:12px;background:#fff;padding:26px 30px 30px}',
      '.writeHead{height:38px;display:flex;align-items:center;margin-bottom:19px}',
      '.writeHead strong{color:#222;font-size:24px;line-height:30px;font-weight:800}',
      '.writeBoardSelect{width:200px;height:35px;margin-left:20px;border:1px solid #dfe3eb;border-radius:6px;background:#fff;color:#697183;padding:0 34px 0 12px;font-size:13px;line-height:16px;font-weight:600}',
      '.writeField{display:block;width:100%;border:0;outline:0;background:#fff;color:#222}',
      '.writeTitleInput{height:58px;border-bottom:1px solid #edf0f4;font-size:20px;line-height:26px;font-weight:600}',
      '.writeTitleInput::placeholder,.writeBodyTextarea::placeholder,.writeTagInput::placeholder{color:#9ba1ad}',
      '.writeBodyTextarea{height:420px;padding:24px 0;border-bottom:1px solid #edf0f4;resize:none;font-size:15px;line-height:24px;font-weight:400}',
      '.writeTagArea{height:56px;display:flex;align-items:center;border-bottom:1px solid #edf0f4}',
      '.writeTagMark{width:26px;height:26px;border-radius:50%;background:#f2f4f8;color:#697183;display:grid;place-items:center;margin-right:11px;font-size:15px;font-weight:800}',
      '.writeTagInput{height:40px;font-size:14px;line-height:18px}',
      '.writeBottom{height:58px;display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:19px}',
      '.writeCancel,.writeSubmit{height:39px;border-radius:7px;padding:0 18px;font-size:14px;line-height:17px;font-weight:800}',
      '.writeCancel{background:#f0f2f6;color:#697183}',
      '.writeSubmit{background:#222428;color:#fff}',
      '.writePanel.isLocked input,.writePanel.isLocked textarea,.writePanel.isLocked select{pointer-events:none;color:#9da3ae}',
      '.writePanel.isLocked .writeSubmit{background:#c8cfdd}',
      '.emptyBoardRows{height:180px;text-align:center;color:#858894;font-size:14px;line-height:180px}',
      '.commentTextarea{width:100%;height:72px;border:0;outline:0;background:transparent;resize:none;color:#222;font-size:14px;line-height:20px;padding:17px 0 0}',
      '.commentTextarea::placeholder{color:#9ba1ad}',
      '.registerButton.isReady{background:#1264c4}',
      '.commentItem.hasReplyComposer{padding-bottom:90px}',
      '.replyComposer{position:relative;z-index:3;margin:14px 110px 0 0;border:1px solid #e3e6ee;border-radius:12px;background:#f7f8fb;padding:10px 12px}',
      '.replyTextarea{width:100%;height:64px;border:0;background:transparent;outline:0;resize:none;color:#222;font-size:14px;line-height:20px}',
      '.replyActions{display:flex;justify-content:flex-end;gap:7px;margin-top:7px}',
      '.replyActions button{height:30px;border-radius:7px;padding:0 12px;font-size:13px;font-weight:800}',
      '.replyCancel{background:#eef0f5;color:#697183}',
      '.replySubmit{background:#1264c4;color:#fff}',
      '.replyItem{margin:12px 0 0;padding:12px 12px 12px 34px;border-radius:10px;background:#f8f9fd;position:relative;color:#222;font-size:14px;line-height:20px}',
      '.replyItem:before{content:"";position:absolute;left:13px;top:15px;width:9px;height:9px;border-left:1.5px solid #b8bfcc;border-bottom:1.5px solid #b8bfcc}',
      '.replyItem b{display:block;margin-bottom:4px;color:#000;font-size:13px;line-height:16px}',
      '.commentActionMenu{position:absolute;right:0;top:42px;z-index:20;width:98px;border:1px solid #e0e4ec;border-radius:9px;background:#fff;box-shadow:0 8px 20px rgba(24,31,45,.09);overflow:hidden}',
      '.commentActionMenu button{display:block;width:100%;height:34px;text-align:left;padding:0 13px;color:#222;font-size:13px;line-height:16px}',
      '.commentActionMenu button+button{border-top:1px solid #f1f3f6}',
      '.menuItem,.boardShortcut,.rightLink,.detailButton,.writeButton,.registerButton,.replyWrite,.smallVote,.composerTool,.refreshButton,.orderButton{transition:background-color .12s ease,color .12s ease,border-color .12s ease,opacity .12s ease}',
      '.menuItem:hover,.rightLink:hover{color:#1264c4}',
      '.writeButton:active,.detailButton:active,.registerButton:active,.smallVote:active{transform:translateY(1px)}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function setupLoginState(){
    refreshLoginChrome();
    document.querySelectorAll('.loginButton').forEach(function(button){
      button.addEventListener('click', function(){
        if(isLoggedIn()){
          localStorage.removeItem(STORE_LOGIN);
          refreshLoginChrome();
          toast('로그아웃되었습니다.');
          if(isDetail) lockComposer();
        }else{
          showLoginModal({onLogin:function(){
            toast('시안용 로그인 상태입니다.');
            if(isDetail) activateComposer();
          }});
        }
      });
    });
  }

  function setupBoardNavigation(){
    document.querySelectorAll('.menuItem').forEach(function(link){
      var board=cleanBoardName(link);
      link.dataset.board=board;
      link.href=LIST_PAGE+'?board='+encodeURIComponent(board);
      link.addEventListener('click', function(event){
        if(!isList) return;
        event.preventDefault();
        setCurrentBoard(board, true);
      });
    });
    document.querySelectorAll('.boardShortcut').forEach(function(link){
      var label=(link.querySelector('.shortcutText')||link).textContent.trim();
      var board=shortcutToBoard(label);
      link.href=LIST_PAGE+'?board='+encodeURIComponent(board);
      link.addEventListener('click', function(event){
        if(!isList) return;
        event.preventDefault();
        setCurrentBoard(board, true);
      });
    });
  }

  function setupWriteButtons(){
    document.querySelectorAll('.writeButton').forEach(function(button){
      button.addEventListener('click', function(){
        renderWriteView();
        if(!isLoggedIn()) showLoginModal({onLogin:unlockWritePanel});
      });
    });
  }

  function setupListPage(){
    window.addEventListener('popstate', function(){
      setCurrentBoard(boardFromUrl()||localStorage.getItem(STORE_BOARD)||'전체 게시글', false);
    });
    setCurrentBoard(boardFromUrl()||localStorage.getItem(STORE_BOARD)||'전체 게시글', false);
  }

  function setupDetailPage(){
    hydrateDetailFromQuery();
    setupCommentComposer();
    setupCommentEvents();
    loadSavedComments();
    updateCommentCount();
  }

  function setCurrentBoard(board, push){
    if(!boardConfig[board]) board='전체 게시글';
    localStorage.setItem(STORE_BOARD, board);
    updateMenuActive(board);
    if(isList) renderBoardRows(board);
    if(push){
      var url=LIST_PAGE+'?board='+encodeURIComponent(board);
      history.pushState({board:board}, '', url);
    }
  }

  function updateMenuActive(board){
    document.querySelectorAll('.menuItem').forEach(function(link){
      link.classList.toggle('active', link.dataset.board===board);
    });
  }

  function renderBoardRows(board){
    var title=document.querySelector('.boardTitleArea strong');
    if(title) title.textContent=board;
    var rows=document.getElementById('postRows');
    if(!rows) return;
    var posts=getPostsForBoard(board);
    if(!posts.length){
      rows.innerHTML='<tr><td colspan="5" class="emptyBoardRows">'+esc(board)+' 게시판의 새 글이 없습니다.</td></tr>';
      return;
    }
    rows.innerHTML=posts.map(function(post){return renderRow(post, board)}).join('');
  }

  function getPostsForBoard(board){
    var all=getAllPosts();
    if(board==='전체 게시글') return all;
    var cfg=boardConfig[board]||boardConfig['전체 게시글'];
    var filtered=all.filter(function(post){
      return cfg.categories.indexOf(post[0])!==-1 || String(post[1]).indexOf(board.replace(' 게시글',''))!==-1;
    });
    return filtered.length?filtered:makeFallbackPosts(board);
  }

  function getAllPosts(){
    return savedPosts().concat(basePosts);
  }

  function renderRow(post, board){
    var targetBoard=post[9]||boardFromCategory(post[0])||board||'전체 게시글';
    var href=DETAIL_PAGE+'?board='+encodeURIComponent(targetBoard)+'&post='+encodeURIComponent(post[1]);
    if(post[8]) href+='&postId='+encodeURIComponent(post[8]);
    var reply=post[6]?'<span class="replyNum">('+post[6]+')</span>':'';
    var lock=post[0]==='사고/블박'?'<span class="locked">!</span>':'';
    return '<tr><td><div class="boardTitleCell"><span class="boardLabel">'+esc(post[0])+'</span><a class="articleTitle" href="'+href+'">'+esc(post[1])+'</a>'+reply+lock+'</div></td><td class="authorCell">'+esc(post[2])+'</td><td class="centerCell">'+esc(post[3])+'</td><td class="centerCell">'+esc(post[4])+'</td><td class="centerCell">'+esc(post[5])+'</td></tr>';
  }

  function renderWriteView(){
    var panel=document.querySelector('.centerPanel');
    if(!panel) return;
    var current=boardFromUrl()||localStorage.getItem(STORE_BOARD)||'국산차 오너톡';
    if(current==='전체 게시글') current='국산차 오너톡';
    panel.innerHTML=[
      '<section class="writePanel '+(isLoggedIn()?'':'isLocked')+'" aria-label="글쓰기">',
      '<div class="writeHead"><strong>글쓰기</strong><select class="writeBoardSelect" aria-label="게시판 선택">',
      boardNames.filter(function(name){return name!=='전체 게시글'}).map(function(name){return '<option value="'+esc(name)+'" '+(name===current?'selected':'')+'>'+esc(name)+'</option>'}).join(''),
      '</select></div>',
      '<input class="writeField writeTitleInput" maxlength="80" placeholder="제목을 입력해주세요">',
      '<textarea class="writeField writeBodyTextarea" maxlength="5000" placeholder="자동차 이야기, 정비 후기, 사고 상황 등을 자유롭게 작성해주세요."></textarea>',
      '<div class="writeTagArea"><span class="writeTagMark">#</span><input class="writeField writeTagInput" placeholder="태그 입력 (#으로 구분, 최대 10개)"></div>',
      '<div class="writeBottom"><button class="writeCancel">취소</button><button class="writeSubmit">등록</button></div>',
      '</section>'
    ].join('');
    panel.querySelector('.writeCancel').addEventListener('click', function(){
      location.href=LIST_PAGE+'?board='+encodeURIComponent(current);
    });
    panel.querySelector('.writeSubmit').addEventListener('click', function(){
      if(!isLoggedIn()){
        showLoginModal({onLogin:unlockWritePanel});
        return;
      }
      submitPost();
    });
    if(isLoggedIn()) unlockWritePanel();
  }

  function unlockWritePanel(){
    var panel=document.querySelector('.writePanel');
    if(panel) panel.classList.remove('isLocked');
    refreshLoginChrome();
    var input=document.querySelector('.writeTitleInput');
    if(input) input.focus();
  }

  function submitPost(){
    var board=document.querySelector('.writeBoardSelect').value;
    var title=document.querySelector('.writeTitleInput').value.trim();
    var body=document.querySelector('.writeBodyTextarea').value.trim();
    if(!title){
      toast('제목을 입력해주세요.');
      document.querySelector('.writeTitleInput').focus();
      return;
    }
    if(!body){
      toast('본문을 입력해주세요.');
      document.querySelector('.writeBodyTextarea').focus();
      return;
    }
    var cfg=boardConfig[board]||boardConfig['국산차 오너톡'];
    var id='post-'+Date.now();
    var post=[cfg.label,title,'시안계정','방금',0,0,0,body,id,board];
    var saved=savedPosts();
    saved.unshift(post);
    localStorage.setItem(STORE_POSTS, JSON.stringify(saved.slice(0,40)));
    localStorage.setItem(STORE_BOARD, board);
    location.href=DETAIL_PAGE+'?board='+encodeURIComponent(board)+'&postId='+encodeURIComponent(id);
  }

  function hydrateDetailFromQuery(){
    var params=new URLSearchParams(location.search);
    var board=params.get('board')||localStorage.getItem(STORE_BOARD)||'국산차 오너톡';
    updateMenuActive(board);
    var crumb=document.querySelector('.boardCrumb');
    if(crumb){
      crumb.textContent=board;
      crumb.href=LIST_PAGE+'?board='+encodeURIComponent(board);
    }
    var post=findPost(params.get('postId'), params.get('post'));
    if(post){
      var title=document.querySelector('.feedTitle');
      var body=document.querySelector('.postText');
      var author=document.querySelector('.authorName');
      var meta=document.querySelector('.metaLine');
      if(title) title.textContent=post[1];
      if(body) body.textContent=post[7]||detailCopyFor(board, post[1]);
      if(author) author.innerHTML=esc(post[2])+'<span class="level">LV 2</span>';
      if(meta) meta.innerHTML='<span>'+esc(post[3])+'</span><span>조회수 '+esc(post[4])+'</span>';
      document.title=post[1]+' : 보배드림 자동차토론';
    }
  }

  function setupCommentComposer(){
    var composer=document.querySelector('.commentComposer');
    if(!composer) return;
    composer.addEventListener('click', function(event){
      if(event.target.closest('.registerButton,.composerTool')) return;
      if(!isLoggedIn()){
        showLoginModal({onLogin:activateComposer});
      }
    });
    var submit=document.querySelector('.registerButton');
    if(submit){
      submit.addEventListener('click', function(){
        if(!isLoggedIn()){
          showLoginModal({onLogin:activateComposer});
          return;
        }
        submitComment();
      });
    }
    document.querySelectorAll('.composerTool').forEach(function(tool){
      tool.addEventListener('click', function(){
        if(!isLoggedIn()){
          showLoginModal({onLogin:activateComposer});
        }else{
          toast(tool.getAttribute('aria-label')+' 기능은 시안용 상태입니다.');
        }
      });
    });
    if(isLoggedIn()) activateComposer();
    else lockComposer();
  }

  function activateComposer(){
    localStorage.setItem(STORE_LOGIN,'1');
    refreshLoginChrome();
    var guide=document.querySelector('.composerGuide');
    if(guide && !document.querySelector('.commentTextarea')){
      var textarea=document.createElement('textarea');
      textarea.className='commentTextarea';
      textarea.maxLength=5000;
      textarea.placeholder='댓글을 입력해주세요.';
      guide.replaceWith(textarea);
      textarea.addEventListener('input', updateCommentCounter);
      textarea.focus();
    }
    var submit=document.querySelector('.registerButton');
    if(submit) submit.classList.add('isReady');
    updateCommentCounter();
  }

  function lockComposer(){
    var textarea=document.querySelector('.commentTextarea');
    if(textarea){
      var guide=document.createElement('div');
      guide.className='composerGuide';
      guide.textContent='로그인 후 작성하실 수 있습니다.';
      textarea.replaceWith(guide);
    }
    var submit=document.querySelector('.registerButton');
    if(submit) submit.classList.remove('isReady');
    var counter=document.querySelector('.counter');
    if(counter) counter.textContent='0/5000';
  }

  function updateCommentCounter(){
    var textarea=document.querySelector('.commentTextarea');
    var counter=document.querySelector('.counter');
    var submit=document.querySelector('.registerButton');
    var len=textarea?textarea.value.length:0;
    if(counter) counter.textContent=len+'/5000';
    if(submit) submit.classList.toggle('isReady', len>0);
  }

  function submitComment(){
    var textarea=document.querySelector('.commentTextarea');
    if(!textarea) return;
    var text=textarea.value.trim();
    if(!text){
      toast('댓글을 입력해주세요.');
      textarea.focus();
      return;
    }
    addComment({author:'시안계정', level:'LV 2', text:text, time:'방금 전', buff:0, nerf:0}, true);
    textarea.value='';
    updateCommentCounter();
    toast('댓글이 등록되었습니다.');
  }

  function setupCommentEvents(){
    var section=document.querySelector('.commentSection');
    if(!section) return;
    section.addEventListener('click', function(event){
      var reply=event.target.closest('.replyWrite');
      if(reply){
        event.preventDefault();
        ensureLoggedIn(function(){ openReplyComposer(reply.closest('.commentItem')); });
        return;
      }
      var smallVote=event.target.closest('.smallVote');
      if(smallVote){
        incrementSmallVote(smallVote);
        return;
      }
      var more=event.target.closest('.commentMore');
      if(more){
        toggleCommentMenu(more.closest('.commentItem'));
        return;
      }
      if(event.target.closest('.replyCancel')){
        event.target.closest('.commentItem')?.classList.remove('hasReplyComposer');
        event.target.closest('.replyComposer').remove();
        return;
      }
      if(event.target.closest('.replySubmit')){
        submitReply(event.target.closest('.replyComposer'));
        return;
      }
      if(event.target.closest('.commentActionMenu button')){
        toast(event.target.textContent.trim()+' 처리했습니다.');
        event.target.closest('.commentActionMenu').remove();
      }
    });
    var order=document.querySelector('.orderButton');
    if(order){
      order.addEventListener('click', function(){
        var next=order.textContent.trim()==='등록순'?'최신순':'등록순';
        order.textContent=next;
        reverseCommentList();
        toast(next+'으로 정렬했습니다.');
      });
    }
    var refresh=document.querySelector('.refreshButton');
    if(refresh){
      refresh.addEventListener('click', function(){
        refresh.style.transform='rotate(180deg)';
        setTimeout(function(){refresh.style.transform='';},180);
        toast('댓글을 새로고침했습니다.');
      });
    }
  }

  function addComment(comment, save){
    var list=document.querySelector('.commentList');
    if(!list) return;
    list.insertAdjacentHTML('afterbegin', commentHtml(comment));
    if(save){
      var key=commentStoreKey();
      var comments=savedComments();
      comments.unshift(comment);
      localStorage.setItem(key, JSON.stringify(comments.slice(0,20)));
    }
    updateCommentCount();
  }

  function commentHtml(comment){
    return [
      '<li class="commentItem">',
      '<span class="commentAvatar"></span>',
      '<div class="commentAuthor">'+esc(comment.author)+' <span class="level">'+esc(comment.level||'LV 2')+'</span></div>',
      '<button class="commentMore" aria-label="더보기"></button>',
      '<p class="commentText">'+esc(comment.text)+'</p>',
      '<div class="commentMeta">'+esc(comment.time||'방금 전')+' <button class="replyWrite">답글 쓰기</button></div>',
      '<div class="commentActions"><button class="smallVote">추천'+(comment.buff?'<span class="num">'+comment.buff+'</span>':'')+'</button><button class="smallVote">비추천'+(comment.nerf?'<span class="num">'+comment.nerf+'</span>':'')+'</button></div>',
      '</li>'
    ].join('');
  }

  function openReplyComposer(item){
    if(!item) return;
    document.querySelectorAll('.replyComposer').forEach(function(open){open.remove();});
    document.querySelectorAll('.commentItem.hasReplyComposer').forEach(function(open){open.classList.remove('hasReplyComposer');});
    var meta=item.querySelector('.commentMeta');
    item.classList.add('hasReplyComposer');
    meta.insertAdjacentHTML('afterend','<div class="replyComposer"><textarea class="replyTextarea" maxlength="1000" placeholder="답글을 입력해주세요."></textarea><div class="replyActions"><button class="replyCancel">취소</button><button class="replySubmit">등록</button></div></div>');
    item.querySelector('.replyTextarea').focus();
  }

  function submitReply(composer){
    var textarea=composer&&composer.querySelector('.replyTextarea');
    if(!textarea) return;
    var text=textarea.value.trim();
    if(!text){
      toast('답글을 입력해주세요.');
      textarea.focus();
      return;
    }
    composer.insertAdjacentHTML('afterend','<div class="replyItem"><b>시안계정 <span class="level">LV 2</span></b>'+esc(text)+'</div>');
    composer.closest('.commentItem')?.classList.remove('hasReplyComposer');
    composer.remove();
    updateCommentCount();
    toast('답글이 등록되었습니다.');
  }

  function incrementSmallVote(button){
    var num=button.querySelector('.num');
    if(!num){
      num=document.createElement('span');
      num.className='num';
      num.textContent='0';
      button.appendChild(num);
    }
    num.textContent=String(Number(num.textContent)+1);
  }

  function toggleCommentMenu(item){
    if(!item) return;
    var current=item.querySelector('.commentActionMenu');
    document.querySelectorAll('.commentActionMenu').forEach(function(menu){menu.remove();});
    if(current) return;
    item.insertAdjacentHTML('beforeend','<div class="commentActionMenu"><button>신고</button><button>링크 복사</button></div>');
  }

  function reverseCommentList(){
    var list=document.querySelector('.commentList');
    if(!list) return;
    Array.from(list.children).reverse().forEach(function(child){list.appendChild(child);});
  }

  function loadSavedComments(){
    savedComments().reverse().forEach(function(comment){addComment(comment, false);});
  }

  function updateCommentCount(){
    var count=document.querySelector('.commentCount');
    if(!count) return;
    var total=document.querySelectorAll('.commentItem').length+document.querySelectorAll('.replyItem').length;
    count.textContent='댓글 '+total;
  }

  function ensureLoggedIn(action){
    if(isLoggedIn()){
      action();
    }else{
      showLoginModal({onLogin:function(){
        activateComposer();
        action();
      }});
    }
  }

  function showLoginModal(options){
    options=options||{};
    document.querySelectorAll('.mockLoginBackdrop').forEach(function(open){open.remove();});
    var modal=document.createElement('div');
    modal.className='mockLoginBackdrop';
    modal.innerHTML=[
      '<div class="mockLoginModal" role="dialog" aria-modal="true" aria-label="로그인 필요">',
      '<div class="mockLoginTitle">보배드림</div>',
      '<div class="mockLoginBody">로그인이 필요한 서비스입니다.</div>',
      '<div class="mockLoginActions"><button class="mockLoginCancel">취소</button><button class="mockLoginConfirm">로그인</button></div>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);
    modal.querySelector('.mockLoginCancel').addEventListener('click', function(){
      modal.remove();
      if(options.onCancel) options.onCancel();
    });
    modal.querySelector('.mockLoginConfirm').addEventListener('click', function(){
      localStorage.setItem(STORE_LOGIN,'1');
      modal.remove();
      refreshLoginChrome();
      if(options.onLogin) options.onLogin();
    });
  }

  function refreshLoginChrome(){
    var logged=isLoggedIn();
    document.querySelectorAll('.loginButton').forEach(function(button){
      button.textContent=logged?'시안계정':'로그인';
      button.title=logged?'클릭하면 시안용 로그아웃':'';
    });
  }

  function toast(message){
    document.querySelectorAll('.bobaeToast').forEach(function(open){open.remove();});
    var box=document.createElement('div');
    box.className='bobaeToast';
    box.textContent=message;
    document.body.appendChild(box);
    setTimeout(function(){box.remove();},1800);
  }

  function cleanBoardName(link){
    return link.textContent.replace(/\s+/g,' ').trim();
  }

  function shortcutToBoard(label){
    if(label.indexOf('전기차')!==-1) return '전기차 충전소';
    if(label.indexOf('SUV')!==-1) return 'SUV 패밀리카';
    if(label.indexOf('정비')!==-1) return '정비 상담';
    if(label.indexOf('블랙박스')!==-1) return '블랙박스 제보';
    return '전체 게시글';
  }

  function boardFromUrl(){
    return new URLSearchParams(location.search).get('board');
  }

  function boardFromCategory(category){
    var found=boardNames.find(function(name){
      return name!=='전체 게시글' && (boardConfig[name].categories||[]).indexOf(category)!==-1;
    });
    return found||'전체 게시글';
  }

  function savedPosts(){
    try{return JSON.parse(localStorage.getItem(STORE_POSTS)||'[]')}catch(e){return []}
  }

  function savedComments(){
    try{return JSON.parse(localStorage.getItem(commentStoreKey())||'[]')}catch(e){return []}
  }

  function commentStoreKey(){
    var params=new URLSearchParams(location.search);
    return 'bobaePcComments:'+(params.get('postId')||params.get('post')||document.querySelector('.feedTitle')?.textContent||'default');
  }

  function findPost(id, title){
    var all=getAllPosts();
    if(id){
      var byId=all.find(function(post){return post[8]===id;});
      if(byId) return byId;
    }
    if(title){
      var byTitle=all.find(function(post){return post[1]===title;});
      if(byTitle) return byTitle;
    }
    return null;
  }

  function makeFallbackPosts(board){
    var cfg=boardConfig[board]||{label:'자유'};
    return [
      [cfg.label,board+' 첫 글로 실사용 후기 남깁니다','보배시안러','방금',3,0,0],
      [cfg.label,board+'에서 자주 묻는 질문 정리해봤습니다','질문정리','8분 전',18,0,2],
      [cfg.label,board+' 관련해서 오너분들 의견 궁금합니다','오너톡','16분 전',27,0,4],
      [cfg.label,board+' 사진과 견적 비교 자료 공유합니다','자료공유','24분 전',41,1,6],
      [cfg.label,board+' 이번 주 인기 토론 주제 모음','운영메모','32분 전',55,0,1]
    ];
  }

  function detailCopyFor(board, title){
    return title+'에 대한 실제 오너 관점의 짧은 후기입니다. '+board+' 게시판에서 이어지는 토론 흐름을 확인할 수 있도록 작성자 정보, 최신 글, 반응, 댓글 영역을 같은 화면 리듬으로 배치했습니다.';
  }

  function isLoggedIn(){
    return localStorage.getItem(STORE_LOGIN)==='1';
  }

  function esc(value){
    return String(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
})();
