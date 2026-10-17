/**
 * 보배드림 해외 자동차뉴스 → 구글 시트 번역 파이프라인 (Google Apps Script)
 *
 * 하는 일
 *  1) 깃허브 액션이 모은 해외 기사 목록(JSON)을 읽는다.
 *  2) 시트 「해외뉴스_번역」에 새 기사는 추가하고, 이미 있는 기사는 바뀐 원문만 갱신한다.
 *  3) 한국어 제목·요약이 비어 있으면 구글 번역(LanguageApp)으로 채운다.
 *     사람이 고친 한국어 제목·요약은 덮어쓰지 않는다.
 *  4) 깃허브 액션이 다음 수집 때 이 탭(공개 CSV)을 읽어 게시판 카드에 한국어를 넣는다.
 *
 * 설치(한 번만)
 *  - 시트 메뉴 「확장 프로그램 → Apps Script」에 이 파일 전체를 붙여넣고 저장한다.
 *  - 함수 목록에서 setupTrigger 를 골라 ▶ 실행 → 권한 허용.
 *    (15분마다 syncForeignNews 가 자동 실행된다. 바로 돌려 보려면 syncForeignNews ▶ 실행)
 *  - 시트 공유는 「링크가 있는 모든 사용자 - 뷰어」여야 깃허브 액션이 읽을 수 있다.
 */
var CONFIG = {
  SOURCE_URL: 'https://bobaekimboae.github.io/bobaedream/community/data/foreign-car-news.json',
  SHEET_NAME: '해외뉴스_번역',
  MAX_TRANSLATE_PER_RUN: 40,      // 한 번 실행에 새로 번역할 기사 수(구글 번역 하루 한도 보호)
  SUMMARY_MAX_CHARS: 110,         // 한국어 요약 최대 길이(2문장 안팎)
  TRIGGER_MINUTES: 15
};

var HEADERS = ['기사ID', '발행일', '국가', '출처', '원문 제목', '원문 요약', '한국어 제목', '한국어 요약',
  '번역방식', '원문 언어', '원문 URL', '대표이미지 URL', '수집일', '갱신일'];
var COL = {}; HEADERS.forEach(function (h, i) { COL[h] = i; });

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncForeignNews') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncForeignNews').timeBased().everyMinutes(CONFIG.TRIGGER_MINUTES).create();
  syncForeignNews();
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  var first = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (first.join('') !== HEADERS.join('')) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
      .setFontWeight('bold').setBackground('#1f1f1f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function translate_(text, lang) {
  text = String(text || '').trim();
  if (!text) return '';
  try { return LanguageApp.translate(text, lang && lang.length === 2 ? lang : '', 'ko'); }
  catch (e) { return ''; }
}

/* 구글 번역의 존댓말(~습니다)을 게시판 기사체(~다)로 바꾼다 */
function plain_(text) {
  return String(text || '')
    .replace(/않습니다/g, '않는다').replace(/입니다/g, '이다').replace(/됩니다/g, '된다')
    .replace(/합니다/g, '한다').replace(/([았었였했켰렸])습니다/g, '$1다').replace(/습니다/g, '다')
    .replace(/갑니다/g, '간다').replace(/옵니다/g, '온다').replace(/줍니다/g, '준다').replace(/봅니다/g, '본다')
    .replace(/ㅂ니다/g, '다');
}

/* 요약: 번역문을 문장 단위로 잘라 최대 길이 안에서 2문장까지, 끝은 기사체 그대로 */
function shortSummary_(text) {
  var s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  var parts = s.match(/[^.!?。！？]+[.!?。！？]?/g) || [s];
  var out = '';
  for (var i = 0; i < parts.length && i < 2; i++) {
    var next = (out ? out + ' ' : '') + parts[i].trim();
    if (next.length > CONFIG.SUMMARY_MAX_CHARS && out) break;
    out = next;
  }
  if (out.length > CONFIG.SUMMARY_MAX_CHARS) out = out.slice(0, CONFIG.SUMMARY_MAX_CHARS - 1) + '…';
  return out;
}

function syncForeignNews() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    var res = UrlFetchApp.fetch(CONFIG.SOURCE_URL + '?t=' + Date.now(), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('기사 목록을 못 받았습니다: HTTP ' + res.getResponseCode());
    var articles = (JSON.parse(res.getContentText()).articles || []);

    var sh = getSheet_();
    var last = sh.getLastRow();
    var rows = last > 1 ? sh.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
    var byId = {};
    rows.forEach(function (r, i) { byId[String(r[COL['기사ID']])] = i; });

    var now = new Date();
    var budget = CONFIG.MAX_TRANSLATE_PER_RUN, added = 0, updated = 0, translated = 0;

    articles.forEach(function (a) {
      var id = String(a.id || '');
      if (!id) return;
      var idx = byId[id];
      var row;
      if (idx === undefined) {
        row = new Array(HEADERS.length).fill('');
        row[COL['기사ID']] = id;
        row[COL['수집일']] = a.collectedAt || '';
        rows.push(row); byId[id] = rows.length - 1; added++;
      } else {
        row = rows[idx];
        if (row[COL['원문 제목']] !== (a.originalTitle || '') || row[COL['원문 요약']] !== (a.originalSummary || '')) updated++;
      }
      row[COL['발행일']] = a.publishedAt || '';
      row[COL['국가']] = a.country || '';
      row[COL['출처']] = a.source || '';
      row[COL['원문 제목']] = a.originalTitle || '';
      row[COL['원문 요약']] = a.originalSummary || '';
      row[COL['원문 언어']] = a.originalLanguage || '';
      row[COL['원문 URL']] = a.canonicalUrl || '';
      row[COL['대표이미지 URL']] = a.previewImageUrl || a.imageUrl || '';

      // 이미 AI 번역(깃허브 쪽)이 있으면 그대로 쓰고, 없으면 구글 번역. 사람이 고친 칸은 건드리지 않는다.
      if (!row[COL['한국어 제목']] && a.titleKo) {
        row[COL['한국어 제목']] = a.titleKo;
        row[COL['한국어 요약']] = row[COL['한국어 요약']] || shortSummary_(String(a.summaryKo || '').replace(/\n+/g, ' '));
        row[COL['번역방식']] = 'AI';
      }
      if (!row[COL['한국어 제목']] && budget > 0) {
        var t = translate_(a.originalTitle, a.originalLanguage);
        if (t) {
          row[COL['한국어 제목']] = plain_(t).replace(/\.$/, '');
          row[COL['한국어 요약']] = row[COL['한국어 요약']] || plain_(shortSummary_(translate_(a.originalSummary, a.originalLanguage)));
          row[COL['번역방식']] = '구글 번역';
          budget--; translated++;
        }
      }
      if (row[COL['번역방식']] === '구글 번역') {
        row[COL['한국어 제목']] = plain_(row[COL['한국어 제목']]).replace(/\.$/, '');
        row[COL['한국어 요약']] = plain_(row[COL['한국어 요약']]);
      }
      row[COL['갱신일']] = now;
    });

    // 최신 발행일이 위로
    rows.sort(function (x, y) { return String(y[COL['발행일']]).localeCompare(String(x[COL['발행일']])); });
    if (rows.length) {
      if (last > 1) sh.getRange(2, 1, last - 1, HEADERS.length).clearContent();
      sh.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
      sh.getRange(2, COL['한국어 제목'] + 1, rows.length, 2).setWrap(true);
    }
    console.log('추가 ' + added + ' · 원문 갱신 ' + updated + ' · 새 번역 ' + translated + ' · 전체 ' + rows.length);
  } finally {
    lock.releaseLock();
  }
}
