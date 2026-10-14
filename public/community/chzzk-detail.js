const params = new URLSearchParams(location.search);
const id = Number(params.get('id') || 8326278);
const isNotice = params.get('type') === 'notice' || params.get('notice') === '1';
const isLongNotice = id === 8303245;
const posts = window.BOBAE_POSTS || [];
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
const sourcePost = localSourcePost || posts.find((item) => item.id === id);
const isReferencePost = !localSourcePost && (id === 8326278 || id === 8131629 || isLongNotice || !sourcePost);
const post = isLongNotice ? {
  title: "[안내] 24시간 방송 추천 '루프 스테이션' 안내 (10/9~10/11)",
  user: '치지직',
  level: 27,
  date: '10.08',
  view: 11269,
  likes: 30,
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

function setRegularContent() {
  $('#postTitle').textContent = isLongNotice ? post.title : String(post.title || '출첵!').replace(/^\[[^\]]+\]\s*/, '');
  $('#authorName').textContent = post.user || '쿠로토라';
  $('#authorLevel').textContent = post.level || 17;
  $('#authorDate').textContent = post.date || '7시간 전';
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
  } else if (!isReferencePost) {
    const copy = (post.body && post.body.length ? post.body : ['좋은 정보 함께 나눠요.']).slice(0, 2).join('\n');
    $('#postBody').querySelector('p').textContent = copy;
  }
  if (localSourcePost) {
    $('#boardBtn').childNodes[0].nodeValue = `${post.board.replace('게시판', '').trim()} `;
    $('#postBody').querySelector('.heroSticker')?.remove();
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
$('#upBtn').addEventListener('click', () => { up = !up; if (up) down = false; updateVote(); showToast(up ? '버프를 추천했습니다' : '버프를 취소했습니다'); });
$('#downBtn').addEventListener('click', () => { down = !down; if (down) up = false; updateVote(); showToast(down ? '너프를 선택했습니다' : '너프를 취소했습니다'); });
$('#commentJump').addEventListener('click', () => { $('#comments').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#commentInput').focus(), 350); });
$('#shareBtn').addEventListener('click', async () => {
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url: location.href }); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(location.href); showToast('게시글 링크를 복사했습니다'); } catch { showToast('주소창의 링크를 복사해 주세요'); }
});
$('#latestMore').addEventListener('click', () => showToast('최신글을 더 불러옵니다'));
document.querySelectorAll('.latestItem').forEach((item) => item.addEventListener('click', () => showToast(item.textContent.trim())));
$('#refreshBtn').addEventListener('click', () => showToast('댓글을 새로고침했습니다'));
$('#filterBtn').addEventListener('click', () => showToast('댓글 정렬: 등록순'));
$('#gearBtn').addEventListener('click', () => showToast('클린봇이 켜져 있습니다'));
document.querySelectorAll('.replyButton, .nestedTools > button').forEach((button) => button.addEventListener('click', () => { $('#commentInput').value = '@쿠로토라 '; $('#commentInput').dispatchEvent(new Event('input')); $('#commentInput').focus(); }));
document.querySelectorAll('.miniVotes button').forEach((button) => button.addEventListener('click', () => { button.classList.toggle('active'); showToast(button.getAttribute('aria-label').includes('너프') ? '댓글을 너프했습니다' : '댓글을 버프했습니다'); }));
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
