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
const allPosts = [...posts, ...dukkaebiPosts];
function loadLocalPost() {
  if (params.get('local') !== '1') return null;
  try {
    const saved = JSON.parse(localStorage.getItem('bbm.community.latestPost.v2') || 'null');
    const savedId = Date.parse(saved?.submittedAt || saved?.savedAt || '');
    if (!saved || !savedId || savedId !== id) return null;
    const container = document.createElement('div');
    container.innerHTML = saved.body || '';
    const lines = (container.innerText || container.textContent || '').split(/\n+/).map((value) => value.trim()).filter(Boolean);
    return { id:savedId, title:saved.title, user:'보배드림 회원', level:1, date:'방금 전', view:0, likes:0, board:saved.board || '자유게시판', tags:saved.tags || '', body:lines.length ? lines : ['내용이 없습니다.'] };
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

function commentActionsHtml(item, label = '댓글') {
  const itemId = escapeHtml(item.id || label);
  const user = escapeHtml(item.user || '회원');
  const score = Number(item.like || 0);
  return `<div class="${label === '답글' ? 'nestedTools' : 'commentTools'}" aria-label="${label} 작업">
    <button class="commentIconButton moreCommentButton" aria-label="${label} 더보기"><img src="assets/chzzk-detail/icons/more-reddit.svg" alt=""></button>
    <button class="commentTextButton replyButton" data-reply-user="${user}"><img src="assets/chzzk-detail/icons/reply-reddit.svg" alt=""><span>답글</span></button>
    <button class="commentTextButton commentShareButton" data-comment-share="${itemId}" aria-label="${label} 공유"><img src="assets/chzzk-detail/icons/share-reddit.svg" alt=""><span>공유</span></button>
    <div class="miniVotes"><button aria-label="${label} 추천"><img src="assets/chzzk-detail/icons/vote-up.svg?v=20261015v14" alt=""><span>추천</span></button><b>${score}</b><button aria-label="${label} 비추"><img src="assets/chzzk-detail/icons/vote-down.svg?v=20261015v14" alt=""><span>비추</span></button></div>
  </div>`;
}

function replyHtml(reply) {
  return `<div class="nestedReply" id="${escapeHtml(reply.id)}">
    <img class="replyAvatar" src="${escapeHtml(reply.avatar)}" alt="${escapeHtml(reply.user)} 프로필">
    <div>
      <div class="replyAuthor"><strong>${escapeHtml(reply.user)} · LV ${escapeHtml(reply.level || 1)}</strong>${reply.writer ? '<span class="authorBadge">작성자</span>' : ''}<span>${escapeHtml(reply.date)}</span></div>
      <p class="replyText">${escapeHtml(reply.text)}</p>
      ${commentActionsHtml(reply, '답글')}
    </div>
  </div>`;
}

function commentHtml(comment) {
  const nested = (comment.replies || []).map(replyHtml).join('');
  return `<li class="commentItem" id="${escapeHtml(comment.id)}">
    <img class="commentAvatar" src="${escapeHtml(comment.avatar)}" alt="${escapeHtml(comment.user)} 프로필">
    <div class="commentContent">
      <div class="commentAuthor"><strong>${escapeHtml(comment.user)} · LV ${escapeHtml(comment.level || 1)}</strong>${comment.writer ? '<span class="authorBadge">작성자</span>' : ''}<span>${escapeHtml(comment.date)}</span></div>
      <p>${escapeHtml(comment.text)}</p>
      ${commentActionsHtml(comment)}
      ${nested}
    </div>
  </li>`;
}

function renderSourceComments(source) {
  const items = source.comments || [];
  const total = items.reduce((sum, item) => sum + 1 + (item.replies || []).length, 0);
  comments = total;
  $('#commentList').innerHTML = items.map(commentHtml).join('');
  $('#commentCount').textContent = `댓글 ${total}`;
  $('#actionCommentCount').textContent = total;
}

function setRegularContent() {
  $('#postTitle').textContent = isLongNotice ? post.title : String(post.title || '출첵!').replace(/^\[[^\]]+\]\s*/, '');
  $('#authorName').textContent = post.user || '쿠로토라';
  $('#authorLevel').textContent = post.level || 17;
  $('#authorDate').textContent = post.time || post.date || '7시간 전';
  $('#authorView').textContent = Number(post.view ?? 34).toLocaleString();
  $('#score').textContent = Number(post.likes ?? 16);
  $('#latestAuthor').textContent = post.user || '쿠로토라';
  if (isLongNotice) {
    document.body.classList.add('isLongNotice');
    $('#boardBtn').childNodes[0].nodeValue = '공지사항 ';
    $('#eventText').textContent = '[치지직 오버워치] 넥슨 네이버 계정 연동 이벤트';
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
    $('#eventText').textContent = '[월즈 2026] LoL 한정판 시청 드롭스 안내 (플레이인-스위스 스테이지)';
    $('#authorAvatar').src = 'assets/chzzk-detail/user-default-avatar.png';
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
            <div class="miniVotes"><button aria-label="댓글 추천"><img src="assets/chzzk-detail/icons/vote-up.svg" alt=""><span>추천</span></button><button aria-label="댓글 비추"><img src="assets/chzzk-detail/icons/vote-down.svg" alt=""><span>비추</span></button></div>
          </div>
        </div>
      </li>`;
  } else if (!isReferencePost && !localSourcePost) {
    document.body.classList.add('isScenarioPost');
    $('#boardBtn').childNodes[0].nodeValue = `${post.category || '자유게시판'} `;
    if (post.authorAvatar) {
      $('#authorAvatar').src = post.authorAvatar;
      $('#authorAvatar').alt = `${post.user || '회원'} 프로필`;
    }
    const paragraphs = post.body && post.body.length ? post.body : ['좋은 정보 함께 나눠요.'];
    const detailImage = post.detailImage || String(post.thumbnail || '').replace(/([?&])w=\d+/, '$1w=960');
    $('#postBody').innerHTML = `${detailImage ? `<img class="detailPhoto" src="${escapeHtml(detailImage)}" alt="${escapeHtml(post.title)}">` : ''}
      <div class="detailCopy">${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>`;
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
      } else {
        delete item.dataset.postId;
      }
    });
  }
  if (localSourcePost) {
    $('#boardBtn').childNodes[0].nodeValue = `${post.board.replace('게시판', '').trim()} `;
    $('#postBody').innerHTML = `<div class="detailCopy">${post.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>`;
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
  $('#score').textContent = base + (up ? 1 : 0) - (down ? 1 : 0);
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
const eventMessages = [
  '[놈웨의 과몰입 만화방 2화] 신세기 에반게리온 과몰입 토크 스트리머 모집',
  '2026 데마시아 컵 글로벌 인비테이셔널(DCGI) 같이보기 안내',
  '(2차 당첨자 안내 업데이트) [그님픽] 그님팀 9월 내전 시청자 이벤트 안내',
];
let eventIndex = 0;
$('#eventBar').addEventListener('click', () => {
  eventIndex = (eventIndex + 1) % eventMessages.length;
  $('#eventText').textContent = eventMessages[eventIndex];
  showToast('다음 이벤트 안내입니다');
});
$('#upBtn').addEventListener('click', () => { up = !up; if (up) down = false; updateVote(); showToast(up ? '게시글을 추천했습니다' : '추천을 취소했습니다'); });
$('#downBtn').addEventListener('click', () => { down = !down; if (down) up = false; updateVote(); showToast(down ? '게시글을 비추천했습니다' : '비추를 취소했습니다'); });
$('#commentJump').addEventListener('click', () => { $('#comments').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#commentInput').focus(), 350); });
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
    $('#commentInput').value = `@${button.dataset.replyUser || '쿠로토라'} `;
    $('#commentInput').dispatchEvent(new Event('input'));
    $('#commentInput').focus();
    return;
  }
  if (button.closest('.miniVotes')) {
    const group = button.closest('.miniVotes');
    group.querySelectorAll('button').forEach((item) => { if (item !== button) item.classList.remove('active'); });
    button.classList.toggle('active');
    showToast(button.getAttribute('aria-label').includes('비추') ? '댓글을 비추천했습니다' : '댓글을 추천했습니다');
    return;
  }
  if (button.classList.contains('moreCommentButton')) {
    showToast('댓글 메뉴입니다');
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
commentInput.addEventListener('input', () => {
  const ready = commentInput.value.trim().length > 0;
  submitBtn.disabled = !ready;
  submitBtn.classList.toggle('ready', ready);
});
$('#commentForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = commentInput.value.trim();
  if (!value || isNotice) return;
  comments += 1;
  $('#commentCount').textContent = `댓글 ${comments}`;
  $('#actionCommentCount').textContent = comments;
  commentInput.value = '';
  commentInput.dispatchEvent(new Event('input'));
  showToast('댓글이 등록되었습니다');
});

setRegularContent();
setNoticeMode();
