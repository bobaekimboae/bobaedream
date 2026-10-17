const params = new URLSearchParams(location.search);
const id = Number(params.get('id') || 8326278);
const isNotice = params.get('type') === 'notice' || params.get('notice') === '1';
const isLongNotice = id === 8303245;
const isUserInquiry = id === 8325190;
const posts = window.BOBAE_POSTS || [];
const dukkaebiPosts = [
  {
    id: 8325190,
    title: '특정 채널의 채팅 이용 제한 해제 관련 문의드립니다',
    user: '두깝이',
    category: '자유게시판',
    date: '14시간 전',
    view: 91,
    likes: -4,
  },
  {
    id: 8325181,
    title: '가입 인사드립니다. 잘 부탁드려요',
    user: '두깝이',
    level: 7,
    category: '자유게시판',
    date: '1일 전',
    view: 128,
    likes: 8,
    authorAvatar: 'assets/chzzk-detail/user-default-avatar.png',
    tags: ['가입인사', '첫글'],
    body: [
      '안녕하세요. 오늘 처음 가입해서 인사드립니다.',
      '치지직 방송과 게임 이야기를 좋아해서 커뮤니티 글도 자주 읽어보려고 합니다.',
      '아직 모르는 기능이 많지만 이용 규칙을 지키면서 천천히 활동하겠습니다.',
      '앞으로 잘 부탁드립니다.',
    ],
    comments: [
      { id:'8325181-1', user:'초록라임', level:5, avatar:'assets/chzzk-detail/comment-avatar.gif', text:'반갑습니다. 편하게 활동하세요!', date:'22시간 전', like:4, replies:[] },
      { id:'8325181-2', user:'익씽', level:12, avatar:'assets/chzzk-detail/comment-anonymous-avatar.png', text:'공지 한 번 읽고 시작하시면 금방 적응하실 거예요.', date:'20시간 전', like:2, replies:[] },
    ],
  },
  {
    id: 8325147,
    title: '치지직 채팅 이용 규칙은 어디에서 확인하나요?',
    user: '두깝이',
    level: 7,
    category: '자유게시판',
    date: '2일 전',
    view: 204,
    likes: 5,
    authorAvatar: 'assets/chzzk-detail/user-default-avatar.png',
    tags: ['채팅', '이용규칙'],
    body: [
      '채널마다 채팅 규칙이 조금씩 다른 것 같아 정확한 확인 위치를 찾고 있습니다.',
      '치지직 공통 운영정책과 스트리머별 채널 규칙을 각각 어디에서 볼 수 있을까요?',
      '모바일 앱에서 확인하는 경로를 아시는 분은 알려주시면 감사하겠습니다.',
    ],
    comments: [
      { id:'8325147-1', user:'규칙먼저', level:9, avatar:'assets/chzzk-detail/comment-anonymous-avatar.png', text:'채널 정보의 이용 안내와 치지직 운영정책을 같이 확인하시면 됩니다.', date:'2일 전', like:7, replies:[{ id:'8325147-1-1', user:'두깝이', level:7, avatar:'assets/chzzk-detail/user-default-avatar.png', writer:true, text:'확인했습니다. 알려주셔서 감사합니다.', date:'2일 전', like:2 }] },
    ],
  },
  {
    id: 8325093,
    title: '구독 알림이 조금 늦게 오는 것 같습니다',
    user: '두깝이',
    level: 7,
    category: '자유게시판',
    date: '3일 전',
    view: 176,
    likes: 3,
    authorAvatar: 'assets/chzzk-detail/user-default-avatar.png',
    tags: ['구독알림', '모바일'],
    body: [
      '구독 중인 채널이 방송을 시작한 뒤 알림이 몇 분 늦게 도착하는 경우가 있습니다.',
      '앱 알림과 휴대폰 알림 권한은 모두 켜둔 상태입니다.',
      '비슷한 증상을 해결하신 분이 있다면 설정 방법을 공유 부탁드립니다.',
    ],
    comments: [
      { id:'8325093-1', user:'알림체크', level:4, avatar:'assets/chzzk-detail/comment-avatar.gif', text:'배터리 최적화에서 치지직 앱을 제외하니 저는 좋아졌습니다.', date:'3일 전', like:6, replies:[] },
    ],
  },
];
// 전용 테이블 게시판(자동차뉴스 등)의 글도 상세에서 찾는다
const boardTablePosts = window.BBM_BOARD_TABLE ? window.BBM_BOARD_TABLE.allPosts() : [];
const allPosts = [...posts, ...dukkaebiPosts, ...boardTablePosts];
function loadLocalPost() {
  if (params.get('local') !== '1') return null;
  try {
    const saved = JSON.parse(localStorage.getItem('bbm.community.latestPost.v2') || 'null');
    const savedId = Date.parse(saved?.submittedAt || saved?.savedAt || '');
    if (!saved || !savedId || savedId !== id) return null;
    const container = new DOMParser().parseFromString(`<div>${Array.isArray(saved.body) ? '' : (saved.body || '')}</div>`, 'text/html').body.firstChild;
    const lines = Array.isArray(saved.body) ? saved.body.map((value) => String(value).trim()).filter(Boolean) : (container.innerText || container.textContent || '').split(/\n+/).map((value) => value.trim()).filter(Boolean);
    return { id:savedId, title:saved.title, user:'보배드림 회원', level:1, date:'방금 전', view:0, likes:0, board:saved.board || '자유게시판', tags:saved.tags || '', body:lines.length ? lines : ['내용이 없습니다.'], html:saved.html || (Array.isArray(saved.embeds) && saved.embeds.length && typeof saved.body === 'string' ? saved.body : ''), embeds:Array.isArray(saved.embeds) ? saved.embeds : [], media:Array.isArray(saved.media) ? saved.media : [], hideBody:Boolean(saved.hideBody) };
  } catch { return null; }
}
const localSourcePost = loadLocalPost();
const sourcePost = localSourcePost || allPosts.find((item) => item.id === id);
const isReferencePost = !localSourcePost && (id === 8326278 || id === 8131629 || isLongNotice || isUserInquiry || !sourcePost);
const post = isLongNotice ? {
  title: "[안내] 24시간 방송 추천 '루프 스테이션' 안내 (10/9~10/11)",
  user: '치지직',
  level: 27,
  date: '10.08',
  view: 11269,
  likes: 30,
  body: [],
} : isUserInquiry ? {
  title: '특정 채널의 채팅 이용 제한 해제 관련 문의드립니다',
  user: '두깝이',
  level: 7,
  date: '14시간 전',
  view: 91,
  likes: -4,
  body: [],
} : isReferencePost ? {
  title: '출첵!',
  user: '쿠로토라',
  level: 17,
  date: '7시간 전',
  view: 34,
  likes: 16,
  body: ['출첵!'],
} : sourcePost;

const $ = (selector) => document.querySelector(selector);
const toast = $('#toast');
let toastTimer;
let up = false;
let down = false;
let comments = localSourcePost ? 0 : 2;
let commentItems = [];
let replyTarget = null;
let editTarget = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1300);
}

function listUrl() {
  return './naver-cafe-list.html?v=20261015chzzk';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[character]));
}

function latestCommentCount(item) {
  const explicitCount = Number(item?.reply);
  if (Number.isFinite(explicitCount)) return Math.max(0, explicitCount);
  return (item?.comments || []).reduce((total, comment) => total + 1 + (comment.replies || []).length, 0);
}

function commentActionsHtml(item, label = '댓글', parentId = '') {
  const itemId = escapeHtml(item.id || label);
  const user = escapeHtml(item.user || '회원');
  return `<div class="${label === '답글' ? 'nestedTools' : 'commentTools'}" aria-label="${label} 작업">
    <button class="commentTextButton replyButton" data-reply-user="${user}" data-reply-id="${itemId}" data-parent-id="${escapeHtml(parentId)}"><img src="assets/chzzk-detail/icons/reply-reddit.svg" alt=""><span>답글</span></button>
    <button class="commentTextButton commentShareButton" data-comment-share="${itemId}" aria-label="${label} 공유"><img src="assets/chzzk-detail/icons/share-reddit.svg" alt=""><span>공유</span></button>
    <button class="commentIconButton moreCommentButton" data-comment-id="${itemId}" data-parent-id="${escapeHtml(parentId)}" data-owned="${item.own === true}" aria-label="${label} 더보기"><img src="assets/chzzk-detail/icons/more-reddit.svg" alt=""></button>
  </div>`;
}

function replyHtml(reply, parentId) {
  return `<div class="nestedReply" id="${escapeHtml(reply.id)}">
    <img class="replyAvatar" src="${escapeHtml(reply.avatar)}" alt="${escapeHtml(reply.user)} 프로필" onerror="this.onerror=null;this.src='assets/rank-avatars/minimal/avatar-01.png'">
    <div>
      <div class="replyAuthor"><strong>${escapeHtml(reply.user)} · LV ${escapeHtml(reply.level || 1)}</strong>${reply.writer ? '<span class="authorBadge">작성자</span>' : ''}<span>${escapeHtml(reply.date)}</span></div>
      <p class="replyText">${escapeHtml(reply.text)}</p>
      ${commentActionsHtml(reply, '답글', parentId)}
    </div>
  </div>`;
}

function commentHtml(comment) {
  const nested = (comment.replies || []).map((reply) => replyHtml(reply, comment.id)).join('');
  return `<li class="commentItem" id="${escapeHtml(comment.id)}">
    <img class="commentAvatar" src="${escapeHtml(comment.avatar)}" alt="${escapeHtml(comment.user)} 프로필" onerror="this.onerror=null;this.src='assets/rank-avatars/minimal/avatar-01.png'">
    <div class="commentContent">
      <div class="commentAuthor"><strong>${escapeHtml(comment.user)} · LV ${escapeHtml(comment.level || 1)}</strong>${comment.writer ? '<span class="authorBadge">작성자</span>' : ''}<span>${escapeHtml(comment.date)}</span></div>
      <p>${escapeHtml(comment.text)}</p>
      ${commentActionsHtml(comment)}
      ${nested}
    </div>
  </li>`;
}

function renderSourceComments(source) {
  const storageKey = `bbm.community.comments.${id}`;
  try {
    commentItems = JSON.parse(localStorage.getItem(storageKey) || 'null') || structuredClone(source.comments || []);
  } catch {
    commentItems = structuredClone(source.comments || []);
  }
  renderCommentItems();
}

function persistComments() {
  try { localStorage.setItem(`bbm.community.comments.${id}`, JSON.stringify(commentItems)); } catch {}
}

function renderCommentItems() {
  const total = commentItems.reduce((sum, item) => sum + 1 + (item.replies || []).length, 0);
  comments = total;
  $('#commentList').innerHTML = commentItems.map(commentHtml).join('');
  $('#commentCount').textContent = `댓글 ${total}`;
  $('#actionCommentCount').textContent = total;
}

function findComment(itemId, parentId = '') {
  if (parentId) {
    const parent = commentItems.find((item) => String(item.id) === String(parentId));
    const item = parent?.replies?.find((reply) => String(reply.id) === String(itemId));
    return item ? { item, parent } : null;
  }
  const item = commentItems.find((comment) => String(comment.id) === String(itemId));
  return item ? { item, parent:null } : null;
}

function removeComment(itemId, parentId = '') {
  if (parentId) {
    const parent = commentItems.find((item) => String(item.id) === String(parentId));
    if (parent) parent.replies = (parent.replies || []).filter((reply) => String(reply.id) !== String(itemId));
  } else {
    commentItems = commentItems.filter((item) => String(item.id) !== String(itemId));
  }
  persistComments();
  renderCommentItems();
}

function setRegularContent() {
  $('#postTitle').textContent = isLongNotice ? post.title : String(post.title || '출첵!').replace(/^\[[^\]]+\]\s*/, '');
  $('#authorName').textContent = post.user || '쿠로토라';
  $('#authorLevel').textContent = post.level || 17;
  $('#authorDate').textContent = post.time || post.date || '7시간 전';
  $('#authorView').textContent = Number(post.view ?? 34).toLocaleString();
  const recommendationCount = Number(post.likes ?? 16);
  $('#score').textContent = recommendationCount;
  $('#authorLike').textContent = recommendationCount.toLocaleString();
  $('#latestAuthor').textContent = post.user || '쿠로토라';
  if (isLongNotice) {
    document.body.classList.add('isLongNotice');
    $('#boardBtn').childNodes[0].nodeValue = '공지사항 ';
    $('#authorAvatar').src = 'assets/chzzk-detail/chzzk-operator-avatar.png';
    $('#authorAvatar').alt = '치지직 운영자 프로필';
    $('#operatorBadge').hidden = false;
    $('#postBody').innerHTML = `
      <img class="loopBanner" src="assets/chzzk-detail/loop-station-banner.png" alt="루프 스테이션">
      <div class="longNoticeBody">
        <p>안녕하세요, 치지직입니다. 🧀</p>
        <p>오늘은 어떤 방송을 볼까 고민하신 적 있으신가요?</p>
        <p><strong>'루프 스테이션'</strong>에서 하루 24시간 동안 시간에 잘 어울리는 방송을 소개해드려요.</p>
        <p>잔잔한 피아노 연주와 ASMR로 꿀잠자고,<br>노래와 토크로 오전을 힘차게 열고,<br>쿡방과 캐주얼 게임이 가득한 낮을 지나<br>예능/합방/게임으로 달아오르는 저녁까지!</p>
        <p>시간대마다 새로운 채널을 발견하는 재미를 느껴보세요.</p>
        <div class="longNoticeSection"><strong>■ 임시 운영 기간</strong><p>2026년 10월 9일(금) 00:00 ~ 10월 11일(일) 24:00 (3일간)</p></div>
        <div class="longNoticeSection"><strong>■ 시청 방법</strong><p>3일 내내 치지직 홈 중단의 <strong>'루프 스테이션'</strong> 영역에서 만날 수 있어요. (PC / 모바일)</p></div>
        <div class="longNoticeSection"><strong>■ 노출 콘텐츠</strong><p>• ON AIR : 지금 잘 어울리는 라이브<br>• 추천 다시보기 : 놓치기 아까운 최신 라이브 다시보기<br>• 이건 꼭 봐야 해 : 핵심 장면을 짧게 즐기는 클립</p></div>
        <p class="sourceNote">편성 시간 및 콘텐츠는 스트리머의 사정에 따라 일부 변경될 수 있습니다.</p>
      </div>`;
    $('.latestItem:nth-of-type(1)').textContent = '[수정완료] 일부 라이브에서 채팅이 작동하지 않는 오류 발생 안내';
    $('.latestItem:nth-of-type(2)').textContent = '[월즈 2026] LoL 한정판 시청 드롭스 안내';
    $('.latestItem:nth-of-type(3)').textContent = '[24H LIVE] JTBC 채널 일시 중지 안내 (10/13)';
    const input = $('#commentInput');
    input.value = '';
    input.placeholder = '댓글을 쓸 수 없는 게시글입니다.';
    input.disabled = true;
    $('#submitBtn').disabled = true;
    $('#commentForm').classList.add('isDisabled');
  } else if (isUserInquiry) {
    document.body.classList.add('isUserInquiry');
    $('#boardBtn').childNodes[0].nodeValue = '자유게시판 ';
    $('#authorAvatar').src = window.BOBAE_AVATAR_FOR?.('두깝이') || 'assets/rank-avatars/minimal/avatar-01.png';
    $('#authorAvatar').alt = '두깝이 프로필';
    $('#postBody').innerHTML = `
      <div class="userInquiryBody">
        <p>안녕하세요.</p>
        <p>치지직 특정 채널의 채팅 이용 제한과 관련하여 문의드립니다.</p>
        <p>현재 해당 채널의 방송 시청은 가능하지만, 채팅을 작성할 수 없는 상태입니다. 채팅 이용 제한을 해제받고 싶어 문의드리게 되었습니다.</p>
        <p>과거 이용 과정에서 문제가 있었던 부분은 반성하고 있으며, 앞으로는 관련 이용 규칙을 준수하고자 합니다.</p>
        <p>이러한 경우 치지직 운영진을 통해 채팅 이용 제한 해제에 대한 검토를 요청할 수 있는지, 또는 별도의 공식 문의 절차가 있는지 안내해 주시면 감사하겠습니다.</p>
        <p>읽어주셔서 감사합니다.</p>
      </div>`;
    const tagRow = $('#regularPost .tagRow');
    tagRow.hidden = true;
    $('#latestAuthor').textContent = '두깝이';
    const latestItems = document.querySelectorAll('.latestItem');
    dukkaebiPosts.filter((item) => item.id !== id).forEach((next, index) => {
      latestItems[index].textContent = next.title;
      latestItems[index].dataset.postId = String(next.id);
      latestItems[index].dataset.comments = String(latestCommentCount(next));
      latestItems[index].hidden = false;
    });
    $('#commentCount').textContent = '댓글 2';
    $('#actionCommentCount').textContent = '2';
    $('#commentList').innerHTML = `
      <li class="moderatedComment"><img src="assets/chzzk-detail/comment-anonymous-avatar.png" alt="숨김 댓글"><span>클린봇이 부적절한 내용을 감지했습니다.</span></li>
      <li class="commentItem">
        <img class="commentAvatar" src="assets/chzzk-detail/comment-anonymous-avatar.png" alt="익씽 프로필">
        <div class="commentContent">
          <div class="commentAuthor"><strong>익씽 · LV 12</strong><span>8시간 전</span></div>
          <p>고객센터나 벤당한 스트리머 한테 애기하는거지 여기 애기하는게 아닙니다.</p>
          <div class="commentTools" aria-label="댓글 작업">
            <button class="commentIconButton moreCommentButton" aria-label="댓글 더보기"><img src="assets/chzzk-detail/icons/more-reddit.svg" alt=""></button>
            <button class="commentTextButton replyButton" data-reply-user="익씽"><img src="assets/chzzk-detail/icons/reply-reddit.svg" alt=""><span>답글</span></button>
            <button class="commentTextButton commentShareButton" data-comment-share="comment-inquiry" aria-label="댓글 공유"><img src="assets/chzzk-detail/icons/share-reddit.svg" alt=""><span>공유</span></button>
          </div>
        </div>
      </li>`;
  } else if (!isReferencePost && !localSourcePost) {
    document.body.classList.add('isScenarioPost');
    $('#boardBtn').childNodes[0].nodeValue = `${post.boardTable ? (window.BBM_BOARD_TABLES?.[post.board]?.displayName || post.category) : (post.category || '자유게시판')} `;
    if (post.authorAvatar) {
      $('#authorAvatar').src = post.authorAvatar;
      $('#authorAvatar').alt = `${post.user || '회원'} 프로필`;
    }
    const paragraphs = post.body && post.body.length ? post.body : ['좋은 정보 함께 나눠요.'];
    const detailImage = post.detailImage || String(post.thumbnail || '').replace(/([?&])w=\d+/, '$1w=960');
    // 네이버 토론형 피드에서 온 글은 피드와 같은 사진을 모두 보여 준다(무관한 기본 사진 대신)
    const fromDiscussion = new URLSearchParams(location.search).get('from') === 'discussion' && window.BBM_DISCUSSION_MEDIA;
    const discussionPhotos = fromDiscussion ? window.BBM_DISCUSSION_MEDIA.photosFor(post) : [];
    const discussionVideo = fromDiscussion ? window.BBM_DISCUSSION_MEDIA.videoFor(post) : '';
    const photoHtml = fromDiscussion
      ? discussionPhotos.map((photo, index) => (index === 0 && discussionVideo
        ? `<video class="detailPhoto detailDiscussionPhoto" id="detailPhoto${index + 1}" src="${escapeHtml(discussionVideo)}" poster="${escapeHtml(photo.src)}" controls muted playsinline preload="metadata" ${photo.ratio ? ` style="aspect-ratio:${photo.ratio}"` : ''}></video>`
        : `<img class="detailPhoto detailDiscussionPhoto" id="detailPhoto${index + 1}" src="${escapeHtml(photo.src)}" alt="${escapeHtml(post.title)} 사진 ${index + 1}" ${photo.ratio ? ` style="aspect-ratio:${photo.ratio}"` : ''} loading="${index < 2 ? 'eager' : 'lazy'}">`)).join('')
      : post.boardTable && post.images && post.images.length
        ? post.images.map((src, index) => `<img class="detailPhoto detailDiscussionPhoto" src="${escapeHtml(src)}" alt="${escapeHtml(post.title)} 사진 ${index + 1}" loading="${index < 2 ? 'eager' : 'lazy'}">`).join('')
        : (detailImage ? `<img class="detailPhoto" src="${escapeHtml(detailImage)}" alt="${escapeHtml(post.title)}">` : '');
    const tableEmbedHtml = post.boardTable && Array.isArray(post.embeds) && window.BBM_EMBED ? post.embeds.map((item) => window.BBM_EMBED.blockHtml(item.title || item.render === 'iframe' ? item : { ...item, title: String(post.title || '').replace(/^\[[^\]]+\]\s*/, '') })).join('') : '';
    const sourceHtml = post.boardTable && (post.source || post.sourceUrl)
      ? `<p class="detailSource">출처 ${escapeHtml(post.source || '')}${post.sourceUrl && /^https?:\/\//.test(post.sourceUrl) ? ` · <a href="${escapeHtml(post.sourceUrl)}" target="_blank" rel="noopener noreferrer">원문 보기</a>` : ''}</p>`
      : '';
    const summary3 = post.boardTable && Array.isArray(post.summary3) && post.summary3.length ? `<section class="detailSummary3" aria-label="한 줄 요약"><strong>요약</strong><p>${escapeHtml(post.summary3.join(' '))}</p></section>` : '';
    const pollHtml = post.boardTable && post.poll && window.BBM_POLL ? window.BBM_POLL.html(post.poll, { id: `board-${post.id}`, interactive: true }) : '';
    $('#postBody').innerHTML = `${summary3}${photoHtml}${tableEmbedHtml}${pollHtml}
      <div class="detailCopy">${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>${sourceHtml}`;
    if (window.BBM_EMBED && window.BBM_EMBED.hydrateCards) window.BBM_EMBED.hydrateCards($('#postBody'));
    const photoTarget = Number(new URLSearchParams(location.search).get('photo')) || 0;
    if (fromDiscussion && photoTarget > 1) {
      requestAnimationFrame(() => document.getElementById(`detailPhoto${photoTarget}`)?.scrollIntoView({ block: 'start' }));
    }
    const tagRow = $('#regularPost .tagRow');
    const tags = (post.tags || [post.category]).filter(Boolean).slice(0, 10);
    tagRow.replaceChildren(...tags.map((tag) => {
      const button = document.createElement('button');
      button.textContent = `#${tag}`;
      return button;
    }));
    tagRow.hidden = tags.length === 0;
    renderSourceComments(post);
    const related = allPosts.filter((item) => item.id !== post.id && (item.user === post.user || item.category === post.category)).slice(0, 3);
    document.querySelectorAll('.latestItem').forEach((item, index) => {
      const next = related[index];
      item.hidden = !next;
      if (next) {
        item.textContent = String(next.title || '').replace(/^\[[^\]]+\]\s*/, '');
        item.dataset.postId = String(next.id);
        item.dataset.comments = String(latestCommentCount(next));
      } else {
        delete item.dataset.postId;
        delete item.dataset.comments;
      }
    });
  }
  if (localSourcePost) {
    $('#boardBtn').childNodes[0].nodeValue = `${post.board.replace('게시판', '').trim()} `;
    $('#postBody').innerHTML = post.hideBody ? '<div class="detailCopy"><p>작성자가 본문을 숨긴 글입니다.</p></div>' : post.html ? renderLocalHtml(post) : `<div class="detailCopy">${post.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>`;
    if (!post.hideBody) renderLocalMedia(post.media);
    const tagRow = $('#regularPost .tagRow');
    const tags = String(post.tags || '').split('#').map((value) => value.trim()).filter(Boolean).slice(0, 10);
    tagRow.replaceChildren(...tags.map((tag) => { const button = document.createElement('button'); button.textContent = `#${tag}`; return button; }));
    tagRow.hidden = tags.length === 0;
    $('#commentList').innerHTML = '';
    $('#commentCount').textContent = '댓글 0';
    $('#actionCommentCount').textContent = '0';
  }
  document.title = `${$('#postTitle').textContent} | 치지직`;
}

/* 글쓰기에서 첨부한 사진·영상: 브라우저 저장소(IndexedDB)에서 꺼내 본문 위에 보여 준다 */
function renderLocalMedia(media) {
  if (!Array.isArray(media) || !media.length || !window.indexedDB) return;
  const holder = document.createElement('div');
  holder.className = 'detailLocalMedia';
  $('#postBody').prepend(holder);
  const request = indexedDB.open('bbm-notion-write-media', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('media');
  request.onsuccess = () => {
    const db = request.result;
    media.forEach((item) => {
      const read = db.transaction('media', 'readonly').objectStore('media').get(item.id);
      read.onsuccess = () => {
        if (!read.result) return;
        const url = URL.createObjectURL(read.result);
        const el = document.createElement(item.kind === 'video' ? 'video' : 'img');
        el.className = 'detailPhoto detailDiscussionPhoto';
        el.src = url;
        if (item.kind === 'video') { el.controls = true; el.playsInline = true; } else el.alt = item.name || '첨부 사진';
        holder.append(el);
      };
    });
  };
}

// 노션식 글쓰기로 올린 글: 본문 순서대로 글·임베드(레딧·유튜브)·뉴스 카드를 보여 준다
function detailEmbedHtml(item) {
  if (!item || !/^https?:\/\//.test(item.url || '')) return '';
  const caption = item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : '';
  if (window.BBM_EMBED && /instagram\.com\//.test(item.url)) { const fresh = window.BBM_EMBED.info(item.url); if (fresh) return window.BBM_EMBED.blockHtml({ ...fresh, caption: item.caption }); }
  if (item.render === 'iframe' && /^https:\/\//.test(item.src || '')) {
    return `<figure class="detailEmbed${item.tall ? ' is-tall' : ''}"><iframe src="${escapeHtml(item.src)}" title="${escapeHtml(item.provider || '임베드')}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"></iframe>${caption}</figure>`;
  }
  let host = item.url;
  try { host = new URL(item.url).hostname.replace(/^www\./, ''); } catch (_) {}
  const overseas = item.lang && !/^ko/i.test(item.lang);
  const image = item.image ? `<span class="news-card-image"><img src="${escapeHtml(item.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></span>` : '';
  const logoUrl = item.logo || (window.BBM_EMBED && window.BBM_EMBED.faviconFor ? window.BBM_EMBED.faviconFor(item.url) : '');
  const logo = logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="" referrerpolicy="no-referrer"${/google\.com\/s2\/favicons/.test(logoUrl) ? ' onload="if(this.naturalWidth<=16)this.remove()"' : ''} onerror="this.remove()">` : '';
  return `<figure class="detailEmbed"><a class="news-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${image}<span class="news-card-copy"><span class="news-card-site">${logo}<span>${escapeHtml(item.site || item.provider || host)}</span>${overseas ? '<em>해외</em>' : ''}</span><strong class="news-card-title">${escapeHtml(item.title || host)}</strong>${item.description ? `<span class="news-card-desc">${escapeHtml(item.description)}</span>` : ''}<small class="news-card-url">${escapeHtml(host)}</small></span></a>${caption}</figure>`;
}
/* 글쓰기 본문의 서식(굵게·기울임·밑줄·링크·줄바꿈)만 남기고 나머지 태그·속성은 버린다 */
function safeInline(root) {
  return Array.from(root.childNodes).map((node) => {
    if (node.nodeType === 3) return escapeHtml(node.textContent);
    if (node.nodeType !== 1) return '';
    const inner = safeInline(node);
    const tag = node.tagName;
    if (tag === 'BR') return '<br>';
    if (tag === 'B' || tag === 'STRONG') return `<strong>${inner}</strong>`;
    if (tag === 'I' || tag === 'EM') return `<em>${inner}</em>`;
    if (tag === 'U') return `<u>${inner}</u>`;
    if (tag === 'A' && /^https?:\/\//.test(node.getAttribute('href') || '')) return `<a href="${escapeHtml(node.getAttribute('href'))}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
    if (tag === 'FONT' && node.getAttribute('size')) { const size = { 1: 12, 2: 13, 3: 16, 4: 18, 5: 22, 6: 26, 7: 30 }[node.getAttribute('size')] || 16; return `<span style="font-size:${size}px">${inner}</span>`; }
    if (tag === 'FIGURE' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME') return '';
    return inner;
  }).join('');
}
function localPollHtml(node, key) {
  let poll = null;
  try { poll = JSON.parse(node.getAttribute('data-poll') || 'null'); } catch (error) { poll = null; }
  if (!poll) {
    poll = {
      title: node.querySelector('strong')?.textContent || '투표',
      options: Array.from(node.querySelectorAll('span')).map((span) => span.textContent),
      note: node.querySelector('small')?.textContent || ''
    };
  }
  return window.BBM_POLL ? window.BBM_POLL.html(poll, { id: key, interactive: true }) : '';
}
function renderLocalHtml(source) {
  /* DOMParser로 읽으면 이미지 로딩·onerror 같은 스크립트가 실행되지 않는다(innerHTML로 임시 div에 넣으면 실행됨) */
  const box = new DOMParser().parseFromString(`<div>${source.html}</div>`, 'text/html').body.firstChild;
  const byUrl = new Map((source.embeds || []).map((item) => [item.url, item]));
  const parts = [];
  let paragraphs = [];
  const flush = () => { if (paragraphs.length) { parts.push(`<div class="detailCopy">${paragraphs.join('')}</div>`); paragraphs = []; } };
  Array.from(box.childNodes).forEach((node) => {
    if (node.nodeType === 1 && node.matches('figure.media-block, figure.write-embed')) {
      if (node.dataset.kind === 'embed' || node.classList.contains('write-embed')) { flush(); parts.push(detailEmbedHtml(byUrl.get(node.dataset.embedUrl) || { url: node.dataset.embedUrl })); }
      return;
    }
    if (node.nodeType === 1 && node.querySelector('figure.write-embed')) {
      // 글쓰기에서 줄 안에 들어간 임베드도 순서대로 꺼낸다
      Array.from(node.childNodes).forEach((child) => { if (child.nodeType === 1 && child.matches('figure.write-embed')) { flush(); parts.push(detailEmbedHtml(byUrl.get(child.dataset.embedUrl) || { url: child.dataset.embedUrl })); } else { const t = (child.textContent || '').trim(); if (t) paragraphs.push(`<p>${escapeHtml(t)}</p>`); } });
      return;
    }
    if (node.nodeType === 1 && node.tagName === 'HR') { flush(); parts.push('<hr class="detailRule">'); return; }
    if (node.nodeType === 1 && node.matches('section.editor-poll')) { flush(); parts.push(localPollHtml(node, `local-${source.id || source.submittedAt || 'post'}-${parts.length}`)); return; }
    const text = (node.textContent || '').trim();
    if (!text) return;
    const tag = node.nodeType === 1 ? node.tagName : '';
    const inner = node.nodeType === 1 ? safeInline(node) : escapeHtml(text);
    if (/^H[1-3]$/.test(tag)) paragraphs.push(`<h3 class="detailSubhead">${inner}</h3>`);
    else if (tag === 'BLOCKQUOTE') paragraphs.push(`<blockquote class="detailQuote">${inner}</blockquote>`);
    else if (tag === 'UL' || tag === 'OL') paragraphs.push(`<${tag.toLowerCase()}>${Array.from(node.children).map((li) => `<li>${safeInline(li)}</li>`).join('')}</${tag.toLowerCase()}>`);
    else paragraphs.push(`<p>${inner}</p>`);
  });
  flush();
  return parts.join('') || `<div class="detailCopy"><p>${escapeHtml(source.body?.[0] || '내용이 없습니다.')}</p></div>`;
}

function setNoticeMode() {
  if (!isNotice) return;
  document.body.classList.add('isNotice');
  $('#regularPost').hidden = true;
  $('#noticePost').hidden = false;
  $('#latestAuthor').textContent = '치지직';
  $('.latestItem:nth-of-type(1)').textContent = '[수정완료] 일부 라이브에서 채팅이 작동하지 않는 오류 안내';
  $('.latestItem:nth-of-type(2)').textContent = '[월즈 2026] LoL 한정판 시청 드롭스 안내';
  $('.latestItem:nth-of-type(3)').textContent = '[24H LIVE] JTBC 채널 일시 중지 안내 (10/13)';
  const input = $('#commentInput');
  input.value = '';
  input.placeholder = '댓글을 쓸 수 없는 게시글입니다.';
  input.disabled = true;
  $('#submitBtn').disabled = true;
  $('#commentForm').classList.add('isDisabled');
  document.title = '공지사항 | 치지직';
}

function updateVote() {
  const base = Number(post.likes ?? 16);
  const recommendationCount = base + (up ? 1 : 0) - (down ? 1 : 0);
  $('#score').textContent = recommendationCount;
  $('#authorLike').textContent = recommendationCount.toLocaleString();
  $('#upBtn').classList.toggle('active', up);
  $('#downBtn').classList.toggle('active', down);
  $('#upBtn').setAttribute('aria-pressed', String(up));
  $('#downBtn').setAttribute('aria-pressed', String(down));
}

$('#closeBtn').addEventListener('click', () => { location.href = listUrl(); });
$('#boardBtn').addEventListener('click', () => { location.href = listUrl(); });
$('#bookmarkBtn').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const next = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(next));
  showToast(next ? '게시글을 저장했습니다' : '저장을 취소했습니다');
});
$('#menuBtn').addEventListener('click', () => showToast('게시글 메뉴입니다'));
$('#upBtn').addEventListener('click', () => { up = !up; if (up) down = false; updateVote(); showToast(up ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다'); });
$('#downBtn').addEventListener('click', () => { down = !down; if (down) up = false; updateVote(); showToast(down ? '싫어요를 눌렀습니다' : '싫어요를 취소했습니다'); });
$('#commentJump').addEventListener('click', () => { $('#comments').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#commentInput').focus(), 350); });
$('#repostBtn').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const next = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(next));
  button.classList.toggle('active', next);
  showToast(next ? '게시글을 재게시했습니다' : '재게시를 취소했습니다');
});
$('#shareBtn').addEventListener('click', async () => {
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url: location.href }); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(location.href); showToast('게시글 링크를 복사했습니다'); } catch { showToast('주소창의 링크를 복사해 주세요'); }
});
$('#latestMore').addEventListener('click', () => showToast('최신글을 더 불러옵니다'));
document.querySelectorAll('.latestItem').forEach((item) => item.addEventListener('click', () => {
  const postId = Number(item.dataset.postId || 0);
  if (postId) {
    location.href = `./chzzk-detail.html?id=${postId}`;
    return;
  }
  showToast(item.textContent.trim());
}));
$('#refreshBtn').addEventListener('click', () => showToast('댓글을 새로고침했습니다'));
$('#filterBtn').addEventListener('click', () => showToast('댓글 정렬: 등록순'));
$('#gearBtn').addEventListener('click', () => showToast('클린봇이 켜져 있습니다'));
$('#commentList').addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.classList.contains('replyButton')) {
    replyTarget = {
      id: button.dataset.replyId || '',
      parentId: button.dataset.parentId || button.dataset.replyId || '',
      user: button.dataset.replyUser || '쿠로토라',
    };
    editTarget = null;
    showCommentContext(`${replyTarget.user}에게 답글`);
    $('#commentInput').placeholder = '답글을 입력하세요.';
    $('#commentInput').focus();
    return;
  }
  if (button.classList.contains('moreCommentButton')) {
    if (button.dataset.owned !== 'true') { showToast('내가 작성한 댓글만 수정할 수 있습니다'); return; }
    openCommentMenu(button.dataset.commentId, button.dataset.parentId || '');
    return;
  }
  if (button.classList.contains('commentShareButton')) {
    const anchor = button.dataset.commentShare || 'comment';
    const shareUrl = `${location.href.split('#')[0]}#${anchor}`;
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url: shareUrl }); return; } catch (error) { if (error.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(shareUrl); showToast('댓글 링크를 복사했습니다'); } catch { showToast('주소창의 링크를 복사해 주세요'); }
  }
});
$('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const commentInput = $('#commentInput');
const submitBtn = $('#submitBtn');
let contextElement;

function showCommentContext(label) {
  if (!contextElement) {
    contextElement = document.createElement('div');
    contextElement.className = 'commentContext';
    contextElement.innerHTML = '<strong></strong><button type="button" aria-label="작성 취소"><img src="assets/chzzk-detail/icons/close.svg" alt=""></button>';
    $('#commentForm').appendChild(contextElement);
    contextElement.querySelector('button').addEventListener('click', resetCommentComposer);
  }
  contextElement.querySelector('strong').textContent = label;
  contextElement.hidden = false;
}

function resetCommentComposer() {
  replyTarget = null;
  editTarget = null;
  commentInput.value = '';
  commentInput.placeholder = '댓글을 입력하세요.';
  commentInput.dispatchEvent(new Event('input'));
  if (contextElement) contextElement.hidden = true;
}

function ensureCommentMenu() {
  let overlay = $('#commentMenuOverlay');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'commentMenuOverlay';
  overlay.className = 'commentMenuOverlay';
  overlay.hidden = true;
  overlay.innerHTML = `<section class="commentMenuSheet" role="dialog" aria-modal="true" aria-label="댓글 관리">
    <span class="commentMenuHandle" aria-hidden="true"></span>
    <button type="button" data-comment-menu="edit"><img src="assets/reddit-ui/edit.svg" alt=""><span>수정하기</span></button>
    <button class="danger" type="button" data-comment-menu="delete"><img src="assets/reddit-ui/delete.svg" alt=""><span>삭제하기</span></button>
    <button type="button" data-comment-menu="cancel"><img src="assets/write-parity/close.svg" alt=""><span>취소</span></button>
  </section>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (event) => {
    const action = event.target.closest('[data-comment-menu]')?.dataset.commentMenu;
    if (!action && event.target !== overlay) return;
    if (action === 'edit') {
      const found = findComment(overlay.dataset.commentId, overlay.dataset.parentId);
      if (found) {
        editTarget = { id:overlay.dataset.commentId, parentId:overlay.dataset.parentId };
        replyTarget = null;
        commentInput.value = found.item.text;
        commentInput.dispatchEvent(new Event('input'));
        showCommentContext('댓글 수정 중');
        commentInput.focus();
      }
    }
    if (action === 'delete') {
      removeComment(overlay.dataset.commentId, overlay.dataset.parentId);
      showToast('댓글을 삭제했습니다');
    }
    closeCommentMenu();
  });
  return overlay;
}

function openCommentMenu(itemId, parentId) {
  const overlay = ensureCommentMenu();
  overlay.dataset.commentId = itemId;
  overlay.dataset.parentId = parentId;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function closeCommentMenu() {
  const overlay = $('#commentMenuOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => { overlay.hidden = true; }, 180);
}

commentInput.addEventListener('input', () => {
  const ready = commentInput.value.trim().length > 0;
  submitBtn.disabled = !ready;
  submitBtn.classList.toggle('ready', ready);
});
$('#commentForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = commentInput.value.trim();
  if (!value || isNotice) return;
  if (editTarget) {
    const found = findComment(editTarget.id, editTarget.parentId);
    if (found) found.item.text = value;
    persistComments();
    renderCommentItems();
    resetCommentComposer();
    showToast('댓글을 수정했습니다');
    return;
  }
  const wasReply = Boolean(replyTarget);
  const ownComment = {
    id:`local-${Date.now()}`,
    user:'보배드림 회원',
    level:1,
    avatar:window.BOBAE_AVATAR_FOR?.('보배드림 회원')||'assets/rank-avatars/minimal/avatar-01.png',
    text:value,
    date:'방금 전',
    own:true,
    replies:[],
  };
  if (replyTarget) {
    const parentId = replyTarget.parentId || replyTarget.id;
    const parent = commentItems.find((item) => String(item.id) === String(parentId));
    if (parent) parent.replies = [...(parent.replies || []), ownComment];
    else commentItems.push(ownComment);
  } else {
    commentItems.push(ownComment);
  }
  persistComments();
  renderCommentItems();
  resetCommentComposer();
  showToast(wasReply ? '답글이 등록되었습니다' : '댓글이 등록되었습니다');
});

setRegularContent();
setNoticeMode();
