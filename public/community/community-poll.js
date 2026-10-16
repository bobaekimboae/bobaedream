/* 치지직(치지칙) 투표 카드: 목록·상세·글쓰기가 같은 모양을 쓴다.
   poll = { title, options[], multiple, anonymous, endsAt(ISO, 선택), note }
   투표 결과는 화면 테스트용으로 이 브라우저(localStorage)에만 저장한다. */
(function () {
  var KEY = 'bbm-community-poll-v1';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(all) { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) {} }
  function normalize(poll) {
    poll = poll || {};
    var note = String(poll.note || '');
    return {
      title: String(poll.title || '투표').replace(/^📊\s*/, ''),
      options: (poll.options || []).map(function (o) { return String(o).replace(/^○\s*/, ''); }).filter(Boolean),
      multiple: poll.multiple != null ? !!poll.multiple : /복수/.test(note),
      anonymous: poll.anonymous != null ? !!poll.anonymous : !/기명 투표/.test(note.replace(/무기명/g, '')),
      endsAt: poll.endsAt || ''
    };
  }
  function remain(endsAt) {
    var end = Date.parse(endsAt || '');
    if (!end) return '';
    var ms = end - Date.now();
    if (ms <= 0) return '투표기간 종료';
    var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    return '투표기간 ' + (d ? d + '일 ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' 남음';
  }
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h7.5a4.5 4.5 0 0 1 0 9H7zM7 15v3M7 10.5h9M7 6v12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CLOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.6V8l2.3 1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m5.3 8.1 1.8 1.8 3.6-3.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var INFO = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4M8 4.9v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  /* opts: { id: 저장 키(없으면 투표 불가), interactive: 상세에서 투표 가능, compact: 목록 미리보기(선택지 4개까지) } */
  function html(poll, opts) {
    opts = opts || {};
    var p = normalize(poll);
    if (p.options.length < 2) return '';
    var st = (opts.id && load()[opts.id]) || {};
    var counts = p.options.map(function (_, i) { return Number((st.counts || [])[i] || 0); });
    var voters = Number(st.voters || 0);
    var ended = !!st.ended || remain(p.endsAt) === '투표기간 종료';
    var mine = st.mine || [];
    var shown = opts.compact ? p.options.slice(0, 4) : p.options;
    var time = remain(p.endsAt);
    var meta = [time ? '<span>' + CLOCK + esc(time) + '</span>' : '', p.multiple ? '<span>' + CHECK + '복수 선택 가능</span>' : ''].filter(Boolean).join('<i aria-hidden="true">·</i>');
    var rows = shown.map(function (o, i) {
      var pct = voters ? Math.round(counts[i] / voters * 100) : 0;
      var on = mine.indexOf(i) > -1;
      var tag = opts.interactive && !ended && !st.voted ? 'button type="button" data-poll-option="' + i + '" aria-pressed="false"' : 'div';
      var end = tag === 'div' ? 'div' : 'button';
      return '<' + tag + ' class="bbmPollOption' + (on ? ' is-mine' : '') + '" style="--pct:' + pct + '%"><span class="bbmPollLabel">' + esc(o) + '</span><span class="bbmPollCount">' + counts[i] + '명 ' + pct + '%</span></' + end + '>';
    }).join('');
    var more = opts.compact && p.options.length > 4 ? '<p class="bbmPollMore">+' + (p.options.length - 4) + '개 항목</p>' : '';
    var actions = opts.interactive ? '<div class="bbmPollActions">' + (ended ? '<button type="button" disabled>투표 종료</button>' : st.voted ? '<button type="button" data-poll-revote>다시 투표하기</button><button type="button" data-poll-end>종료하기</button>' : '<button type="button" data-poll-vote disabled>투표하기</button><button type="button" data-poll-end>종료하기</button>') + '</div>' : '';
    return '<section class="bbmPoll' + (opts.compact ? ' is-compact' : '') + (ended ? ' is-ended' : '') + '" aria-label="투표"' + (opts.id ? ' data-poll-id="' + esc(opts.id) + '"' : '') + ' data-poll-json="' + esc(JSON.stringify(p)) + '">' +
      '<header class="bbmPollHead"><span class="bbmPollIcon">' + ICON + '</span><strong>' + (p.anonymous ? '무기명 ' : '') + (ended ? '투표 종료' : '투표 중') + '</strong><span class="bbmPollInfo" title="' + (p.anonymous ? '누가 투표했는지 공개되지 않습니다' : '투표한 사람이 공개됩니다') + '">' + INFO + '</span><em>' + voters + '명 참여</em></header>' +
      '<h4 class="bbmPollTitle">' + esc(p.title) + '</h4>' + (meta ? '<p class="bbmPollMeta">' + meta + '</p>' : '') +
      '<div class="bbmPollOptions" role="group" aria-label="' + esc(p.title) + ' 선택지">' + rows + '</div>' + more + actions + '</section>';
  }

  function rerender(box) {
    var p = JSON.parse(box.getAttribute('data-poll-json'));
    box.outerHTML = html(p, { id: box.getAttribute('data-poll-id'), interactive: true });
  }
  /* 상세: 선택 → 투표하기 → 결과, 종료하기 */
  document.addEventListener('click', function (event) {
    var box = event.target.closest && event.target.closest('.bbmPoll[data-poll-id]');
    if (!box || box.classList.contains('is-compact')) return;
    var id = box.getAttribute('data-poll-id');
    var p = JSON.parse(box.getAttribute('data-poll-json'));
    var all = load(); var st = all[id] || {};
    var opt = event.target.closest('[data-poll-option]');
    if (opt) {
      if (!p.multiple) box.querySelectorAll('[data-poll-option]').forEach(function (b) { if (b !== opt) { b.classList.remove('is-picked'); b.setAttribute('aria-pressed', 'false'); } });
      var on = !opt.classList.contains('is-picked');
      opt.classList.toggle('is-picked', on); opt.setAttribute('aria-pressed', String(on));
      var vote = box.querySelector('[data-poll-vote]'); if (vote) vote.disabled = !box.querySelector('.is-picked');
      return;
    }
    if (event.target.closest('[data-poll-vote]')) {
      var picks = Array.prototype.map.call(box.querySelectorAll('.is-picked'), function (b) { return Number(b.getAttribute('data-poll-option')); });
      if (!picks.length) return;
      st.counts = p.options.map(function (_, i) { return Number((st.counts || [])[i] || 0) + (picks.indexOf(i) > -1 ? 1 : 0); });
      st.voters = Number(st.voters || 0) + 1; st.mine = picks; st.voted = true;
      all[id] = st; save(all); rerender(box); return;
    }
    if (event.target.closest('[data-poll-revote]')) {
      st.counts = (st.counts || []).map(function (c, i) { return Math.max(0, c - ((st.mine || []).indexOf(i) > -1 ? 1 : 0)); });
      st.voters = Math.max(0, Number(st.voters || 0) - 1); st.mine = []; st.voted = false;
      all[id] = st; save(all); rerender(box); return;
    }
    if (event.target.closest('[data-poll-end]')) { st.ended = true; all[id] = st; save(all); rerender(box); }
  });
  window.BBM_POLL = { html: html, normalize: normalize };
})();
