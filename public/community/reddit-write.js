(function(){
  'use strict';
  var $=function(selector,root){return (root||document).querySelector(selector)};
  var $$=function(selector,root){return Array.from((root||document).querySelectorAll(selector))};
  var params=new URLSearchParams(location.search);
  var returnTo=(function(){try{var raw=params.get('returnTo');if(!raw)return './naver-cafe-list.html?view=reddit';var url=new URL(raw,location.href);return url.origin===location.origin&&url.pathname.endsWith('/community/naver-cafe-list.html')?url.pathname+url.search+url.hash:'./naver-cafe-list.html?view=reddit'}catch(error){return './naver-cafe-list.html?view=reddit'}})();
  var STORAGE_KEY='bbm.community.redditWriteDraft.v1';
  var communities=[
    {name:'자동차뉴스',members:'12.8만 명',letter:'N'},
    {name:'브랜드 자동차 정보',members:'브랜드 정보',letter:'B'},
    {name:'자유게시판',members:'48.2만 명',letter:'자'},
    {name:'국산차 오너톡',members:'19.4만 명',letter:'국'},
    {name:'수입차 라운지',members:'11.7만 명',letter:'수'},
    {name:'전기차',members:'8.6만 명',letter:'전'},
    {name:'정비 · DIY',members:'7.1만 명',letter:'정'},
    {name:'중고차',members:'16.3만 명',letter:'중'},
    {name:'블랙박스 제보',members:'21.5만 명',letter:'블'}
  ];
  var flairs=['신차','산업','정책','전기차','모빌리티','안전','시승기','정비'];
  var state={community:params.get('board')||'자동차뉴스',media:[],flairs:[],spoiler:false,nsfw:false,poll:null,ama:null,link:null};
  var title=$('#postTitle'),body=$('#postBody'),draftStatus=$('#draftStatus'),toast=$('#toast');
  var saveTimer=0,toastTimer=0;

  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}
  function uid(prefix){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
  function showToast(message){toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(function(){toast.hidden=true},1900)}
  function resizeTitle(){title.style.height='auto';title.style.height=Math.min(116,title.scrollHeight)+'px'}
  function isReady(){return Boolean(state.community&&title.value.trim()&&(body.textContent.trim()||state.media.length||state.link||state.poll||state.ama))}
  function sync(){
    $('#titleCount').textContent=title.value.length;
    $('#desktopPostButton').disabled=!isReady();
    $('#mobilePostButton').disabled=!isReady();
    resizeTitle();
  }
  function dirty(){draftStatus.textContent='저장되지 않음';clearTimeout(saveTimer);saveTimer=setTimeout(saveDraft,900);sync()}
  function selectedCommunity(){return communities.find(function(item){return item.name===state.community})||communities[0]}
  function renderCommunity(){var item=selectedCommunity();$('#selectedCommunity').textContent=item.name;$$('.community-avatar').forEach(function(node){if(node.closest('.community-option'))return;node.textContent=item.letter})}

  function saveDraft(silent){
    var draft={community:state.community,title:title.value,body:body.innerHTML,flairs:state.flairs,spoiler:state.spoiler,nsfw:state.nsfw,poll:readPoll(),ama:readAma(),link:state.link,savedAt:Date.now()};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));draftStatus.textContent='임시 저장됨';if(!silent)showToast('임시 저장했습니다.')
  }
  function restoreDraft(){
    try{var draft=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!draft)return;state.community=draft.community||state.community;title.value=draft.title||'';body.innerHTML=draft.body||'';state.flairs=Array.isArray(draft.flairs)?draft.flairs:[];state.spoiler=Boolean(draft.spoiler);state.nsfw=Boolean(draft.nsfw);state.link=draft.link||null;renderLink();if(draft.poll){openPanel('poll');setPoll(draft.poll)}if(draft.ama){openPanel('ama');setAma(draft.ama)}$('[data-toggle="spoiler"]').setAttribute('aria-pressed',String(state.spoiler));$('[data-toggle="nsfw"]').setAttribute('aria-pressed',String(state.nsfw));renderFlairs();draftStatus.textContent='임시 저장 복원됨'}catch(error){showToast('임시 저장본을 불러오지 못했습니다.')}
  }

  function openDialog(kind){
    $('#dialogBackdrop').hidden=false;$$('#dialogBackdrop .dialog').forEach(function(node){node.hidden=true});
    var dialog=kind==='community'?$('#communityDialog'):$('#flairDialog');dialog.hidden=false;document.body.style.overflow='hidden';
    if(kind==='community'){renderCommunityList('');setTimeout(function(){$('#communitySearch').focus()},30)}else renderFlairList()
  }
  function closeDialog(){$('#dialogBackdrop').hidden=true;$$('#dialogBackdrop .dialog').forEach(function(node){node.hidden=true});document.body.style.overflow=''}
  function renderCommunityList(query){var normalized=String(query||'').trim().toLowerCase();$('#communityList').innerHTML=communities.filter(function(item){return !normalized||item.name.toLowerCase().includes(normalized)}).map(function(item){return '<button class="community-option'+(item.name===state.community?' is-selected':'')+'" type="button" data-community="'+esc(item.name)+'"><span class="community-avatar">'+esc(item.letter)+'</span><span><strong>'+esc(item.name)+'</strong><small>회원 '+esc(item.members)+'</small></span></button>'}).join('')}
  function renderFlairList(){$('#flairList').innerHTML=flairs.map(function(flair){return '<button class="flair-option" type="button" data-flair="'+esc(flair)+'" aria-pressed="'+String(state.flairs.includes(flair))+'"><span>'+esc(flair)+'</span></button>'}).join('')}
  function renderFlairs(){var row=$('#flairRow');row.hidden=!state.flairs.length;row.innerHTML=state.flairs.map(function(flair){return '<span>'+esc(flair)+'</span>'}).join('')}

  function addFiles(files,kind){
    Array.from(files||[]).slice(0,kind==='image'?20:5).forEach(function(file){state.media.push({id:uid(kind),kind:kind,name:file.name,url:URL.createObjectURL(file)})});
    renderMedia();dirty()
  }
  function renderMedia(){var area=$('#attachmentArea');area.hidden=!state.media.length;area.innerHTML=state.media.map(function(item){return '<article class="media-tile" data-media-id="'+item.id+'">'+(item.kind==='image'?'<img src="'+item.url+'" alt="'+esc(item.name)+'">':'<video src="'+item.url+'" controls playsinline></video>')+'<button type="button" data-remove-media="'+item.id+'" aria-label="삭제"><img src="assets/write-parity/close.svg" alt=""></button><small>'+esc(item.name)+'</small></article>'}).join('')}
  function openPanel(kind){
    ['link','poll','ama'].forEach(function(name){var panel=$('#'+name+'Panel');var open=name===kind&&!panel.hidden;panel.hidden=name!==kind||open;var button=$('[data-action="'+name+'"]');if(button)button.classList.toggle('is-active',name===kind&&!open)});
    if(kind==='poll'&&!$('#pollOptions').children.length)renderPollOptions(['','']);
  }
  function renderPollOptions(values){$('#pollOptions').innerHTML=values.map(function(value,index){return '<div class="poll-row"><b>'+(index+1)+'</b><input class="poll-option" maxlength="80" placeholder="선택지 '+(index+1)+'" value="'+esc(value)+'"><button type="button" data-remove-poll="'+index+'" aria-label="선택지 삭제">×</button></div>'}).join('')}
  function readPoll(){if($('#pollPanel').hidden)return null;var options=$$('.poll-option').map(function(input){return input.value.trim()}).filter(Boolean);return {options:options,duration:$('#pollDuration').value}}
  function setPoll(poll){renderPollOptions((poll.options||['','']).concat(Array(Math.max(0,2-(poll.options||[]).length)).fill('')));$('#pollDuration').value=String(poll.duration||3)}
  function readAma(){if($('#amaPanel').hidden)return null;return {time:$('#amaTime').value,hosts:$('#amaHosts').value.trim()}}
  function setAma(ama){$('#amaTime').value=ama.time||'';$('#amaHosts').value=ama.hosts||''}
  function renderLink(){if(!state.link)return;$('#linkPanel').hidden=false;$('#linkUrl').value=state.link.url||'';$('#linkLabel').value=state.link.label||'';$('[data-action="link"]').classList.add('is-active')}

  function format(command,value){body.focus();document.execCommand(command,false,value||null);dirty()}
  function addBodyLink(){var selection=window.getSelection();var selected=selection&&selection.toString();var url=prompt('링크 주소를 입력하세요.','https://');if(!url)return;try{var parsed=new URL(url);if(!/^https?:$/.test(parsed.protocol))throw new Error();format('createLink',parsed.href);if(!selected)document.execCommand('insertText',false,parsed.href)}catch(error){showToast('올바른 웹 주소를 입력해 주세요.')}}

  function buildPost(){
    var poll=readPoll(),ama=readAma();
    var html=body.innerHTML;var reader=document.createElement('div');reader.innerHTML=html;var plain=reader.textContent.replace(/\s+/g,' ').trim();
    return {id:Date.now(),status:'LOCAL_PREVIEW',source:'reddit-write',boardId:state.community==='자동차뉴스'?'car-news':'community',board:state.community,head:state.flairs[0]||state.community,category:state.flairs[0]||state.community,title:title.value.trim(),body:plain?[plain]:[],html:html,media:state.media.map(function(item){return {kind:item.kind,name:item.name}}),photos:state.media.filter(function(item){return item.kind==='image'}).map(function(item){return {name:item.name}}),videos:state.media.filter(function(item){return item.kind==='video'}).map(function(item){return {name:item.name}}),link:state.link,poll:poll,ama:ama,flairs:state.flairs.slice(),spoiler:state.spoiler,nsfw:state.nsfw,submittedAt:new Date().toISOString()}
  }
  function publish(){
    if(!isReady()){showToast('게시판, 제목, 내용을 확인해 주세요.');return}
    var poll=readPoll();if(poll&&poll.options.length<2){showToast('투표 선택지를 두 개 이상 입력해 주세요.');return}
    var post=buildPost();
    try{if(post.boardId==='car-news'&&window.BBMCarNewsTable)window.BBMCarNewsTable.insert(post);localStorage.setItem('bbm.community.latestPost.v2',JSON.stringify(post));localStorage.removeItem(STORAGE_KEY)}catch(error){showToast('게시물을 저장하지 못했습니다.');return}
    showToast('게시물을 등록했습니다.');setTimeout(function(){location.href=returnTo},500)
  }

  $('#communityPicker').addEventListener('click',function(){openDialog('community')});
  $('#communitySearch').addEventListener('input',function(){renderCommunityList(this.value)});
  $('#dialogBackdrop').addEventListener('click',function(event){if(event.target===this)closeDialog()});
  title.addEventListener('input',dirty);body.addEventListener('input',dirty);
  body.addEventListener('paste',function(event){var files=Array.from(event.clipboardData&&event.clipboardData.files||[]);if(!files.length)return;event.preventDefault();addFiles(files.filter(function(file){return file.type.startsWith('image/')}),'image');addFiles(files.filter(function(file){return file.type.startsWith('video/')}),'video')});
  body.addEventListener('dragover',function(event){if(event.dataTransfer&&event.dataTransfer.files.length)event.preventDefault()});
  body.addEventListener('drop',function(event){var files=Array.from(event.dataTransfer&&event.dataTransfer.files||[]);if(!files.length)return;event.preventDefault();addFiles(files.filter(function(file){return file.type.startsWith('image/')}),'image');addFiles(files.filter(function(file){return file.type.startsWith('video/')}),'video')});
  $('#imageInput').addEventListener('change',function(){addFiles(this.files,'image');this.value=''});$('#videoInput').addEventListener('change',function(){addFiles(this.files,'video');this.value=''});
  $('#composerForm').addEventListener('submit',function(event){event.preventDefault();publish()});

  document.addEventListener('click',function(event){
    var button=event.target.closest('button');if(!button)return;var action=button.dataset.action;
    if(action==='close-dialog')closeDialog();
    if(action==='save-draft')saveDraft(false);
    if(action==='image')$('#imageInput').click();
    if(action==='video')$('#videoInput').click();
    if(['link','poll','ama'].includes(action))openPanel(action);
    if(action==='format-link')addBodyLink();
    if(action==='flair')openDialog('flair');
    if(action==='apply-flair'){renderFlairs();closeDialog();dirty()}
    if(action==='add-poll-option'){var values=$$('.poll-option').map(function(input){return input.value});if(values.length>=6)return showToast('선택지는 최대 6개입니다.');renderPollOptions(values.concat(''));dirty()}
    if(action==='confirm-link'){var raw=$('#linkUrl').value.trim();try{var parsed=new URL(raw);if(!/^https?:$/.test(parsed.protocol))throw new Error();state.link={url:parsed.href,label:$('#linkLabel').value.trim()||parsed.hostname};showToast('링크를 추가했습니다.');dirty()}catch(error){showToast('올바른 웹 주소를 입력해 주세요.')}}
    if(action==='cancel')location.href=returnTo;
    if(action==='publish')publish();
    if(button.dataset.command)format(button.dataset.command,button.dataset.value);
    if(button.dataset.community){state.community=button.dataset.community;renderCommunity();closeDialog();dirty()}
    if(button.dataset.flair){button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));state.flairs=$$('#flairList [aria-pressed="true"]').map(function(item){return item.dataset.flair}).slice(0,3)}
    if(button.dataset.toggle){var key=button.dataset.toggle;state[key]=!state[key];button.setAttribute('aria-pressed',String(state[key]));dirty()}
    if(button.dataset.removeMedia){var index=state.media.findIndex(function(item){return item.id===button.dataset.removeMedia});if(index>-1){URL.revokeObjectURL(state.media[index].url);state.media.splice(index,1);renderMedia();dirty()}}
    if(button.dataset.removePoll!==undefined){var values=$$('.poll-option').map(function(input){return input.value});if(values.length<=2)return showToast('선택지는 두 개 이상 필요합니다.');values.splice(Number(button.dataset.removePoll),1);renderPollOptions(values);dirty()}
    if(button.dataset.closePanel){$('#'+button.dataset.closePanel+'Panel').hidden=true;$('[data-action="'+button.dataset.closePanel+'"]').classList.remove('is-active');if(button.dataset.closePanel==='link')state.link=null;dirty()}
  });
  document.addEventListener('keydown',function(event){if(event.key==='Escape')closeDialog();if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();saveDraft(false)}});
  document.addEventListener('input',function(event){if(event.target.matches('.poll-option,#pollDuration,#amaTime,#amaHosts,#linkUrl,#linkLabel'))dirty()});
  window.addEventListener('beforeunload',function(){if(title.value.trim()||body.textContent.trim())saveDraft(true)});

  restoreDraft();renderCommunity();renderFlairs();sync();
})();
