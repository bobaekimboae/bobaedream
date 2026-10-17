/* 커뮤니티 글쓰기 공용 임베드: 주소 → 임베드(유튜브·인스타그램·레딧 등) 또는 뉴스 카드(노션 북마크형).
   chzzk-write(간결형 글쓰기)와 상세 화면이 함께 쓴다. */
(function () {
  'use strict';
  /*
    TikTok 단축주소는 브라우저에서 리다이렉트 목적지를 읽을 수 없으므로(CORS),
    게시판에 등록·검수된 주소는 정식 영상 주소로 고정한다. 새 단축주소를 수집할 때도
    같은 방식으로 최종 영상 ID를 저장하면 GitHub Pages에서도 안정적으로 재생된다.
  */
  var TIKTOK_SHORT_URLS = {
    ZSgFh12ft: 'https://www.tiktok.com/@ah_nouh/video/7696972500185533712'
  };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return String(url || ''); } }

  /* 주소 → { url, render:'iframe'|'preview', src, provider, title, tall } (잘못된 주소는 null) */
  /* 공식 '임베드 코드'(틱톡 blockquote·유튜브 iframe·인스타 blockquote·X·레딧)를 붙여 넣어도 글 주소를 뽑아 쓴다 */
  function fromCode(value) {
    var text = String(value || '').trim();
    if (text.charAt(0) !== '<') return text;
    var m = text.match(/data-instgrm-permalink="([^"]+)"/i) || text.match(/\bcite="(https?:[^"]+)"/i);
    if (m) return m[1].replace(/&amp;/g, '&');
    m = text.match(/<iframe[^>]+src="([^"]+)"/i);
    if (m) {
      var src = m[1].replace(/&amp;/g, '&');
      var yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/i);
      if (yt) return 'https://www.youtube.com/watch?v=' + yt[1];
      return src;
    }
    m = text.match(/href="(https?:\/\/(?:www\.|mobile\.)?(?:twitter|x|threads|reddit|facebook)\.com\/[^"]*?(?:status|post|comments|posts|videos)[^"]*)"/i);
    if (m) return m[1].replace(/&amp;/g, '&').replace(/\?ref_src=[^"]*$/, '');
    m = text.match(/href="(https?:[^"]+)"/i);
    return m ? m[1].replace(/&amp;/g, '&') : text;
  }
  function info(value) {
    var parsed;
    value = fromCode(value);
    try { parsed = new URL(String(value || '').trim()); } catch (_) { return null; }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    var host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    var parts = parsed.pathname.split('/').filter(Boolean);
    if ((host === 'vt.tiktok.com' || host === 'vm.tiktok.com') && parts[0] && TIKTOK_SHORT_URLS[parts[0]]) {
      parsed = new URL(TIKTOK_SHORT_URLS[parts[0]]);
      host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      parts = parsed.pathname.split('/').filter(Boolean);
    }
    var base = { url: parsed.href, render: 'preview', src: '', provider: host, title: host, tall: false };
    function frame(src, provider, title, tall, url) { return { url: url || parsed.href, render: 'iframe', src: src, provider: provider, title: title, tall: Boolean(tall) }; }
    function yt(id, shorts) { var item = frame('https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0', 'YouTube', shorts ? '유튜브 쇼츠' : '유튜브 동영상', shorts); item.image = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg'; item.wide = !shorts; return item; }
    if (host === 'youtu.be' && parts[0]) return yt(parts[0], false);
    if (host.slice(-11) === 'youtube.com') {
      var id = parsed.searchParams.get('v') || (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live' ? parts[1] : '');
      if (id) return yt(id, parts[0] === 'shorts');
    }
    if (host.slice(-9) === 'vimeo.com' && /^\d+$/.test(parts[parts.length - 1] || '')) { var vm = frame('https://player.vimeo.com/video/' + parts[parts.length - 1] + '?app_id=122963', 'Vimeo', 'Vimeo 동영상'); vm.wide = true; vm.kind = 'video'; return vm; }
    if (host === 'instagram.com' || host.slice(-14) === '.instagram.com') {
      if (['p', 'reel', 'reels', 'tv'].indexOf(parts[0]) >= 0 && parts[1]) {
        var type = parts[0] === 'reels' ? 'reel' : parts[0];
        var clean = 'https://www.instagram.com/' + type + '/' + encodeURIComponent(parts[1]) + '/';
        /* 스레드처럼 본문(캡션) 없이 계정 줄 + 사진·영상만: 캡션 없는 embed/ 를 쓰고 아래 반응 줄은 잘라 낸다(crop) */
        var ig = frame(clean + 'embed/', 'Instagram', type === 'reel' ? 'Instagram 릴스' : 'Instagram 게시물', true, clean);
        ig.crop = 'instagram';
        if (type === 'reel') ig.reel = true; /* 릴스는 스레드 앱처럼 9:16 영상만(계정 줄·하단 반응 줄 잘라냄) */
        return ig;
      }
    }
    /* 틱톡: 영상은 공식 플레이어(player/v1, 세로 9:16), 계정 주소는 공식 크리에이터 임베드(embed/@이름) */
    if (host === 'tiktok.com' || host.slice(-11) === '.tiktok.com') {
      if (parts[0] && parts[0].charAt(0) === '@') {
        var vid = parts[1] === 'video' && /^\d+$/.test(parts[2] || '') ? parts[2] : '';
        if (vid) { var tv = frame('https://www.tiktok.com/player/v1/' + vid + '?description=1&music_info=1', 'TikTok', 'TikTok 동영상', true, 'https://www.tiktok.com/' + parts[0] + '/video/' + vid); tv.short = true; return tv; }
        var name = parts[0].slice(1);
        var tp = frame('https://www.tiktok.com/embed/@' + encodeURIComponent(name), 'TikTok', 'TikTok @' + name, false, 'https://www.tiktok.com/@' + encodeURIComponent(name));
        tp.profile = true; tp.handle = '@' + name;
        return tp;
      }
    }
    /* 레딧: 공식 widgets.js와 같은 주소·변수(embed.reddit.com/{경로}/?embed=true&ref_source=embed&ref=share…).
       글(r|user/…/comments/ID), 댓글(…/comments/ID/슬러그/댓글ID, 윗 댓글 맥락 포함), 서브레딧(/r/이름) 지원 */
    if (/(^|\.)reddit\.com$/.test(host)) {
      var at = parts.indexOf('comments');
      var rbase = 'ref_source=embed&ref=share&utm_source=embedv2&utm_medium=widgets&embed_host_url=' + encodeURIComponent(location.origin || '');
      var rpath = '';
      var rtitle = 'Reddit 게시물';
      var rcomment = false;
      if ((parts[0] === 'r' || parts[0] === 'user') && parts[1] && at === 2 && parts[at + 1]) {
        rpath = parts[0] + '/' + encodeURIComponent(parts[1]) + '/comments/' + encodeURIComponent(parts[at + 1]) + '/';
        if (parts[at + 2]) rpath += encodeURIComponent(parts[at + 2]) + '/';
        if (parts[at + 3]) { rpath += encodeURIComponent(parts[at + 3]) + '/'; rcomment = true; rtitle = 'Reddit 댓글'; }
      } else if (parts[0] === 'r' && parts[1] && parts.length === 2) {
        rpath = 'r/' + encodeURIComponent(parts[1]) + '/';
        rtitle = 'Reddit r/' + parts[1];
      }
      if (rpath) {
        var rq = 'embed=true&theme=light&' + (rcomment ? 'showmedia=false&showmore=false&depth=1&context=1&utm_name=comment_embed' : 'showmedia=true&showmore=false&utm_name=post_embed') + '&' + rbase;
        return frame('https://embed.reddit.com/' + rpath + '?' + rq, 'Reddit', rtitle, true, parsed.href);
      }
    }
    /* 스레드: 메타 공식 문서(Embed a Threads Post)의 embed.js가 만드는 틀과 같게 — /t/글코드/embed/, 높이는 스레드가 보내는 신호로 자동.
       주소 형식은 문서대로 @아이디/post/글코드 와 t/글코드 두 가지. 계정·검색 주소는 링크 카드 */
    if (host === 'threads.net' || host === 'threads.com' || host.slice(-12) === '.threads.net' || host.slice(-12) === '.threads.com') {
      var tcode = parts[0] === 't' ? parts[1] : (parts[0] && parts[0].charAt(0) === '@' && parts[1] === 'post' ? parts[2] : '');
      if (tcode) {
        var th = frame('https://www.threads.com/t/' + encodeURIComponent(tcode) + '/embed/', 'Threads', 'Threads 게시물', false, parts[0] === 't' ? 'https://www.threads.com/t/' + encodeURIComponent(tcode) : 'https://www.threads.com/' + parts[0] + '/post/' + encodeURIComponent(tcode));
        th.height = 520; th.kind = 'card'; th.threads = true;
        return th;
      }
    }
    /* X(트위터): 공식 위젯 플레이어 */
    if (host === 'x.com' || host === 'twitter.com' || host === 'mobile.twitter.com') {
      var si = parts.indexOf('status');
      if (si > 0 && /^\d+$/.test(parts[si + 1] || '')) return frame('https://platform.twitter.com/embed/Tweet.html?id=' + parts[si + 1] + '&theme=light&lang=ko&dnt=true', 'X', 'X 게시물', true, 'https://x.com/' + parts[0] + '/status/' + parts[si + 1]);
    }
    /* 페이스북 공개 글·영상: 공식 플러그인 */
    if (host === 'facebook.com' || host.slice(-13) === '.facebook.com') {
      if (/\/(posts|videos|photos|reel|permalink\.php)/.test(parsed.pathname) || parsed.pathname === '/permalink.php' || parsed.pathname === '/watch/') {
        var kind = /\/(videos|reel)\b|\/watch\//.test(parsed.pathname) ? 'video' : 'post';
        return frame('https://www.facebook.com/plugins/' + kind + '.php?href=' + encodeURIComponent(parsed.href) + '&show_text=true&width=500', 'Facebook', 'Facebook 게시물', true, parsed.href);
      }
    }
    if (host === 'open.spotify.com' && parts.length >= 2) { var sp = frame('https://open.spotify.com/embed/' + encodeURIComponent(parts[0]) + '/' + encodeURIComponent(parts[1]), 'Spotify', 'Spotify'); sp.height = parts[0] === 'track' || parts[0] === 'episode' ? 152 : 352; sp.kind = 'audio'; return sp; }
    /* ─ 노션 도움말 「Embeds, bookmarks & link mentions」의 임베드 지원 서비스(2026-10-17 수집)를 공식 iframe 주소로 ─ */
    var full = parsed.href, q = encodeURIComponent(full), id;
    function sized(item, h, kind) { item.height = h; item.kind = kind || 'card'; return item; }
    /* 트위터(X) 게시물 */
    if ((host === 'twitter.com' || host === 'x.com' || host === 'mobile.twitter.com') && parts[1] === 'status' && /^\d+$/.test(parts[2] || '')) return sized(frame('https://platform.twitter.com/embed/Tweet.html?id=' + parts[2] + '&lang=ko&dnt=true', 'X(트위터)', 'X 게시물'), 520);
    /* 스레드 */
    /* 페이스북 게시물·영상 */
    if (host === 'facebook.com' || host === 'm.facebook.com' || host === 'fb.watch') {
      var fbVideo = /\/videos?\/|\/reel\/|watch/.test(parsed.pathname + parsed.search) || host === 'fb.watch';
      return sized(frame('https://www.facebook.com/plugins/' + (fbVideo ? 'video' : 'post') + '.php?href=' + q + '&show_text=true&width=500', 'Facebook', fbVideo ? 'Facebook 동영상' : 'Facebook 게시물'), fbVideo ? 420 : 560, fbVideo ? 'video' : 'card');
    }
    /* 링크드인 게시물(activity 번호가 있는 주소) */
    if (host === 'linkedin.com' && (id = (full.match(/(?:activity|share|ugcPost)[:-](\d{10,})/) || [])[1])) return sized(frame('https://www.linkedin.com/embed/feed/update/urn:li:' + (/ugcPost/.test(full) ? 'ugcPost' : /share[:-]/.test(full) ? 'share' : 'activity') + ':' + id, 'LinkedIn', 'LinkedIn 게시물'), 560);
    /* 핀터레스트 핀 */
    if (/(^|\.)pinterest\.[a-z.]+$/.test(host) && parts[0] === 'pin' && /^\d+$/.test(parts[1] || '')) return sized(frame('https://assets.pinterest.com/ext/embed.html?id=' + parts[1], 'Pinterest', 'Pinterest 핀'), 620);
    /* 룸(Loom) 영상 */
    if (host.slice(-8) === 'loom.com' && (parts[0] === 'share' || parts[0] === 'embed') && parts[1]) { var lm = frame('https://www.loom.com/embed/' + encodeURIComponent(parts[1]), 'Loom', 'Loom 영상'); lm.wide = true; lm.kind = 'video'; return lm; }
    /* 비메오는 위에서 처리. 지피(GIPHY) */
    if (host.slice(-9) === 'giphy.com' && (id = (parts[0] === 'gifs' || parts[0] === 'embed' || parts[0] === 'media' ? (parts[parts.length - 1] || '').split('-').pop() : ''))) return sized(frame('https://giphy.com/embed/' + encodeURIComponent(id), 'GIPHY', 'GIPHY'), 300, 'media');
    /* 사운드클라우드 */
    if (host.slice(-14) === 'soundcloud.com' && parts.length >= 2) return sized(frame('https://w.soundcloud.com/player/?url=' + q + '&visual=false', 'SoundCloud', 'SoundCloud'), 166, 'audio');
    /* 구글 지도 */
    if ((host === 'google.com' || host === 'maps.google.com' || /^google\.[a-z.]+$/.test(host)) && (parts[0] === 'maps' || host === 'maps.google.com')) {
      var place = parsed.searchParams.get('q') || (parts[1] === 'place' && parts[2] ? decodeURIComponent(parts[2]).replace(/\+/g, ' ') : '');
      var at = (parsed.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || []);
      var mq = place || (at[1] ? at[1] + ',' + at[2] : '');
      if (mq) return sized(frame('https://maps.google.com/maps?q=' + encodeURIComponent(mq) + '&z=15&output=embed', 'Google 지도', 'Google 지도'), 320, 'map');
    }
    if (host === 'maps.app.goo.gl' || host === 'goo.gl') return base;
    /* 네이버 카페: 다른 사이트 안에 넣는 것을 막고(X-Frame-Options), 회원 글은 로그인해야 보여 원문 카드로 */
    if (host === 'cafe.naver.com' || host === 'm.cafe.naver.com') return { url: full, render: 'preview', src: '', provider: '네이버 카페', site: '네이버 카페', title: '', description: '카페 회원만 볼 수 있는 글은 네이버 카페 앱이나 웹에서 로그인 후 확인할 수 있어요.', logo: 'https://ca-fe.pstatic.net/web-mobile/static/favicon/android_legacy_xxxhpdi_192x192.png', noHydrate: true, tall: false };
    /* 구글 드라이브·문서·시트·슬라이드·캘린더(공개 문서만) */
    if (host === 'drive.google.com' && parts[0] === 'file' && parts[2]) return sized(frame('https://drive.google.com/file/d/' + encodeURIComponent(parts[2]) + '/preview', 'Google 드라이브', 'Google 드라이브 파일'), 480, 'doc');
    if (host === 'docs.google.com' && ['document', 'spreadsheets', 'presentation', 'forms'].indexOf(parts[0]) >= 0 && parts[1] === 'd' && parts[2]) {
      var gtail = parts[0] === 'forms' ? '/viewform?embedded=true' : parts[0] === 'presentation' ? '/embed' : '/preview';
      return sized(frame('https://docs.google.com/' + parts[0] + '/d/' + encodeURIComponent(parts[2]) + gtail, 'Google ' + ({ document: '문서', spreadsheets: '시트', presentation: '슬라이드', forms: '설문' })[parts[0]], 'Google 문서'), parts[0] === 'presentation' ? 300 : 480, 'doc');
    }
    if (host === 'calendar.google.com' && parts.indexOf('embed') >= 0) return sized(frame(full, 'Google 캘린더', 'Google 캘린더'), 480, 'doc');
    /* 피그마 */
    if (host.slice(-9) === 'figma.com' && ['file', 'design', 'proto', 'board', 'slides'].indexOf(parts[0]) >= 0) return sized(frame('https://www.figma.com/embed?embed_host=bobaedream&url=' + q, 'Figma', 'Figma'), 450, 'doc');
    /* 코드펜 */
    var penAt = host === 'codepen.io' ? parts.indexOf('pen') : -1;
    if (penAt > 0 && parts[penAt + 1]) return sized(frame('https://codepen.io/' + parts.slice(0, penAt).map(encodeURIComponent).join('/') + '/embed/' + encodeURIComponent(parts[penAt + 1]) + '?default-tab=result', 'CodePen', 'CodePen'), 400, 'doc');
    /* 깃허브 기스트(.pibb = iframe용 HTML) */
    if (host === 'gist.github.com' && parts.length >= 2) return sized(frame('https://gist.github.com/' + encodeURIComponent(parts[0]) + '/' + encodeURIComponent(parts[1]) + '.pibb', 'GitHub Gist', 'GitHub Gist'), 360, 'doc');
    /* 미로 보드 */
    if (host === 'miro.com' && parts[0] === 'app' && parts[1] === 'board' && parts[2]) return sized(frame('https://miro.com/app/live-embed/' + encodeURIComponent(parts[2]) + '/', 'Miro', 'Miro 보드'), 450, 'doc');
    /* 캔바 디자인 */
    if (host === 'canva.com' && parts[0] === 'design' && parts[1]) return sized(frame('https://www.canva.com/design/' + encodeURIComponent(parts[1]) + '/' + encodeURIComponent(parts[2] || 'view') + '/view?embed', 'Canva', 'Canva 디자인'), 420, 'doc');
    /* 타입폼·탤리 설문 */
    if (host.slice(-12) === 'typeform.com' && parts[0] === 'to' && parts[1]) return sized(frame(full, 'Typeform', 'Typeform 설문'), 500, 'doc');
    if (host === 'tally.so' && (parts[0] === 'r' || parts[0] === 'embed') && parts[1]) return sized(frame('https://tally.so/embed/' + encodeURIComponent(parts[1]) + '?transparentBackground=1', 'Tally', 'Tally 설문'), 500, 'doc');
    /* 리플릿·스트림릿·태블로 공개 화면 */
    if (host === 'replit.com' && parts[0] && parts[0].charAt(0) === '@' && parts[1]) return sized(frame('https://replit.com/' + parts[0] + '/' + encodeURIComponent(parts[1]) + '?embed=true', 'Replit', 'Replit'), 450, 'doc');
    if (/\.streamlit\.app$/.test(host)) return sized(frame(full.split('#')[0] + (parsed.search ? '&' : '?') + 'embed=true', 'Streamlit', 'Streamlit 앱'), 500, 'doc');
    if (host === 'public.tableau.com' && parts[0] === 'views') return sized(frame(full.split('?')[0] + '?:showVizHome=no&:embed=true', 'Tableau', 'Tableau'), 500, 'doc');
    /* 임베드용으로 만든 도구(엑스칼리드로·프레이머·플로커스·인디파이·스케치·인비전·앱스트랙트·믹스패널 공개 화면): 주소 그대로 */
    if (/(^|\.)(excalidraw\.com|framer\.website|framer\.app|flocus\.com|indify\.co|widgetbox\.app|sketch\.com|invis\.io|invisionapp\.com|abstract\.com|mixpanel\.com)$/.test(host)) return sized(frame(full, host.split('.').slice(-2, -1)[0].replace(/^./, function (c) { return c.toUpperCase(); }), host), 450, 'doc');
    /* PDF 파일·동영상 파일 */
    if (/\.pdf($|\?)/i.test(parsed.pathname)) return sized(frame(full, 'PDF', 'PDF 문서'), 520, 'doc');
    if (/\.(mp4|webm|mov)($|\?)/i.test(parsed.pathname)) { var vf = frame(full, '동영상', '동영상 파일'); vf.wide = true; vf.kind = 'video'; return vf; }
    return base;
  }

  /* 뉴스 카드용 메타데이터(제목·요약·대표 이미지·매체). microlink 공개 API */
  var cache = {};
  /* 레딧 MediaByURL처럼 주소별 결과를 저장해 다시 긁지 않는다(이번 방문 동안) */
  function stored(url) { try { var v = sessionStorage.getItem('bbm-embed-meta:' + url); return v ? JSON.parse(v) : null; } catch (_) { return null; } }
  function fetchMeta(url) {
    if (cache[url]) return cache[url];
    var hit = stored(url);
    if (hit) { cache[url] = Promise.resolve(hit); return cache[url]; }
    cache[url] = fetch('https://api.microlink.io/?url=' + encodeURIComponent(url))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        var d = json && json.status === 'success' ? json.data || {} : {};
        var meta = { title: d.title || '', description: d.description || '', image: (d.image && d.image.url) || '', site: d.publisher || '', logo: (d.logo && d.logo.url) || '', lang: d.lang || '' };
        try { if (meta.title || meta.image) sessionStorage.setItem('bbm-embed-meta:' + url, JSON.stringify(meta)); } catch (_) {}
        return meta;
      })
      .catch(function () { return {}; });
    return cache[url];
  }

  /* 사이트 파비콘(스레드 카드처럼 도메인 앞에 표시): 메타에 로고가 없으면 저장해 둔 것을 쓴다 */
  var FAVICONS = { 'n.news.naver.com': './media/favicons/n.news.naver.com.png', 'm.sports.naver.com': './media/favicons/m.sports.naver.com.png', 'sports.naver.com': './media/favicons/m.sports.naver.com.png', 'm.cafe.naver.com': './media/favicons/m.cafe.naver.com.png', 'cafe.naver.com': './media/favicons/m.cafe.naver.com.png', 'naver.me': './media/favicons/n.news.naver.com.png', 'v.daum.net': './media/favicons/v.daum.net.png', 'news.daum.net': './media/favicons/v.daum.net.png', 'm.daum.net': './media/favicons/v.daum.net.png', 'www.autopista.es': './media/favicons/www.autopista.es.png', 'autopista.es': './media/favicons/www.autopista.es.png' };
  /* 노션 북마크처럼 각 사이트 파비콘: 저장본(네이버·다음) → 없으면 구글 파비콘 서비스(사이트 파비콘을 돌려주고, 없으면 기본 지구본) */
  /* 구글 서비스는 파비콘이 없는 사이트에 16px 기본 지구본을 주므로, 노션처럼 그때는 아이콘 자리를 비운다(img의 onload에서 지움) */
  function faviconFor(url) {
    var host = hostOf(url);
    if (!host || !/\./.test(host)) return '';
    return FAVICONS[host] || 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host) + '&sz=64';
  }
  function cardHtml(item) {
    var host = hostOf(item.url);
    if (!item.logo) item = Object.assign({}, item, { logo: faviconFor(item.url) });
    var overseas = item.lang && !/^ko/i.test(item.lang);
    return '<a class="news-card" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' +
      (item.image ? '<span class="news-card-image"><img src="' + esc(item.image) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></span>' : '') +
      '<span class="news-card-copy"><span class="news-card-site">' + (item.logo ? '<img src="' + esc(item.logo) + '" alt="" referrerpolicy="no-referrer"' + (/google\.com\/s2\/favicons/.test(item.logo) ? ' onload="if(this.naturalWidth<=16)this.remove()"' : '') + ' onerror="this.remove()">' : '') +
      '<span>' + esc(item.site || item.provider || host) + '</span>' + (overseas ? '<em>해외</em>' : '') + '</span>' +
      '<strong class="news-card-title">' + esc(item.title || host) + '</strong>' +
      (item.description ? '<span class="news-card-desc">' + esc(item.description) + '</span>' : '') +
      '<small class="news-card-url">' + esc(host) + '</small></span></a>';
  }
  function frameHtml(item, opts) {
    /* 레딧 validate_secure_oembed처럼 https 주소만 iframe으로, 아니면 링크 카드 */
    if (!/^https:\/\//.test(item.src || '')) return cardHtml(item);
    if (item.reel && /instagram\.com\//.test(item.src || '')) {
      var rsrc = String(item.src).replace(/embed\/captioned\/?$/, 'embed/');
      return '<div class="bbm-embed-reel"><iframe data-embed-reel src="' + esc(rsrc) + '" title="' + esc(item.title || 'Instagram 릴스') + '" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen scrolling="no" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></div>';
    }
    var crop = item.crop === 'instagram' || /instagram\.com\//.test(item.src || '');
    var src = crop ? String(item.src).replace(/embed\/captioned\/?$/, 'embed/') : item.src;
    var yt = /youtube(-nocookie)?\.com\/embed\//.test(src);
    if (yt && opts && opts.autoplay) src += (src.indexOf('?') < 0 ? '?' : '&') + 'autoplay=1&playsinline=1';
    /* 노션 동영상 블록처럼 유튜브는 본문 폭 16:9, 쇼츠는 세로 9:16(최대 폭 315, 가운데) */
    var tt = /tiktok\.com\/(player|embed)\//.test(src);
    var shape = yt ? (item.tall ? ' data-embed-short' : ' data-embed-wide') : tt ? (/\/player\//.test(src) ? ' data-embed-short' : ' data-embed-tiktok-profile') : '';
    if (tt) {
      /* 틱톡 공식 embed.js가 만드는 iframe과 똑같이: name(__tt_embed__…)·lang·referrer·sandbox. 높이는 틱톡이 보내는 신호로 맞춘다 */
      var ttName = '__tt_embed__v' + Math.floor(Math.random() * 1e15);
      var ttSrc = src + (src.indexOf('?') < 0 ? '?' : '&') + 'lang=ko-KR&referrer=' + encodeURIComponent(location.href);
      return '<iframe' + shape + ' name="' + ttName + '" src="' + esc(ttSrc) + '" title="' + esc(item.title || 'TikTok') + '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin"></iframe>';
    }
    if (!yt && item.wide) shape += ' data-embed-wide';
    var style = item.height ? ' style="height:' + Number(item.height) + 'px"' : '';
    if (/platform\.twitter\.com\//.test(src)) shape += ' data-embed-tweet';
    if (/threads\.com\/t\/[^/]+\/embed\//.test(src)) shape += ' data-embed-threads';
    var html = '<iframe' + shape + style + ' src="' + esc(src) + '" title="' + esc(item.title || item.provider || '임베드') + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"></iframe>';
    return crop ? '<div class="bbm-embed-crop">' + html + '</div>' : html;
  }
  /* 상세·피드에서 쓰는 블록 하나 */
  function blockHtml(item) {
    if (!item || !/^https?:\/\//.test(item.url || '')) return '';
    var caption = item.caption ? '<figcaption>' + esc(item.caption) + '</figcaption>' : '';
    if (item.render === 'iframe') return '<figure class="detailEmbed' + (item.tall ? ' is-tall' : '') + '">' + frameHtml(item) + caption + '</figure>';
    var card = cardHtml(item);
    if (!item.image && !item.noHydrate) card = card.replace('<a class="news-card"', '<a class="news-card" data-embed-hydrate');
    return '<figure class="detailEmbed">' + card + caption + '</figure>';
  }
  /* 노션처럼 원본 높이로: 인스타그램(MEASURE)·레딧(resize.embed)이 보내는 높이 신호로 iframe 높이를 맞춘다 */
  window.addEventListener('message', function (event) {
    /* 스레드 embed.js와 같게: 틀이 보내는 숫자(높이)로 iframe 높이를 맞춘다 */
    if (/(^|\.)threads\.(com|net)$/.test((function () { try { return new URL(event.origin).hostname; } catch (_) { return ''; } })())) {
      var th = Number(typeof event.data === 'string' || typeof event.data === 'number' ? event.data : NaN);
      if (!(th > 50)) return;
      Array.prototype.forEach.call(document.querySelectorAll('iframe[data-embed-threads]'), function (frame) { if (frame.contentWindow === event.source) { frame.setAttribute('data-embed-height', ''); frame.style.setProperty('--embed-h', Math.ceil(th) + 'px'); } });
      return;
    }
    if (/(^|\.)twitter\.com$/.test((function () { try { return new URL(event.origin).hostname; } catch (_) { return ''; } })())) {
      var xd = event.data; try { if (typeof xd === 'string') xd = JSON.parse(xd); } catch (_) { return; }
      var xr = xd && xd['twttr.embed']; var xh = xr && xr.method === 'twttr.private.resize' && xr.params && xr.params[0] && Number(xr.params[0].height);
      if (!(xh > 50)) return;
      Array.prototype.forEach.call(document.querySelectorAll('iframe[data-embed-tweet]'), function (frame) { if (frame.contentWindow === event.source) { frame.setAttribute('data-embed-height', ''); frame.style.setProperty('--embed-h', Math.ceil(xh) + 'px'); } });
      return;
    }
    if (/(^|\.)tiktok\.com$/.test((function () { try { return new URL(event.origin).hostname; } catch (_) { return ''; } })())) {
      var td = event.data;
      try { if (typeof td === 'string' && td.charAt(0) === '{') td = JSON.parse(td); } catch (_) { return; }
      if (!td || !td.signalSource || !(Number(td.height) > 50)) return;
      var tf = document.querySelector('iframe[name="' + String(td.signalSource).replace(/[^\w]/g, '') + '"]');
      if (tf) { tf.setAttribute('data-embed-height', ''); tf.style.setProperty('--embed-h', Math.ceil(td.height) + 'px'); }
      return;
    }
    /* X 위젯: twttr.private.resize 신호로 높이를 맞춘다 */
    if (/(^|\.)(twitter|x)\.com$/.test((function () { try { return new URL(event.origin).hostname; } catch (_) { return ''; } })())) {
      var xd = event.data;
      try { if (typeof xd === 'string') xd = JSON.parse(xd); } catch (_) { return; }
      var xe = xd && xd['twttr.embed'];
      var xh = xe && xe.method === 'twttr.private.resize' && xe.params && xe.params[0] ? Number(xe.params[0].height) : 0;
      if (xh > 50) Array.prototype.forEach.call(document.querySelectorAll('iframe'), function (frame) {
        if (frame.contentWindow !== event.source) return;
        frame.setAttribute('data-embed-height', ''); frame.style.setProperty('--embed-h', Math.ceil(xh) + 'px');
      });
      return;
    }
    if (!/(^|\.)(instagram\.com|reddit\.com|threads\.com|threads\.net)$/.test((function () { try { return new URL(event.origin).hostname; } catch (_) { return ''; } })())) return;
    var data = event.data, height = 0;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch (_) { return; }
    if (data && data.type === 'MEASURE' && data.details) height = Number(data.details.height);
    else if (data && data.type === 'resize.embed') height = Number(data.data);
    if (!(height > 50)) return;
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function (frame) {
      if (frame.contentWindow !== event.source) return;
      frame.setAttribute('data-embed-height', ''); frame.style.setProperty('--embed-h', Math.ceil(height) + 'px');
      /* 인스타그램 캡션 없는 embed/ 아래 반응·댓글 줄(약 154px)은 잘라 계정 줄 + 사진·영상만 남긴다 */
      var box = frame.parentElement;
      if (box && box.classList.contains('bbm-embed-crop')) box.style.setProperty('--crop-h', Math.max(120, Math.ceil(height) - 154) + 'px');
    });
  });
  /* 레딧 목록 방식(expando): 목록에서는 외부 플레이어를 불러오지 않고 썸네일 + 재생 버튼만 보여 주고,
     누르면 그 자리에서 플레이어로 바꿔 바로 재생한다. 썸네일은 레딧 스크래퍼 순서대로
     ① 제공처 썸네일(유튜브 i.ytimg) ② 원문 og:image(microlink) ③ 없으면 제공처 색 타일 */
  function kindOf(item) { return item.provider === 'YouTube' ? (item.tall ? 'short' : 'wide') : item.provider === 'Instagram' ? 'instagram' : item.provider === 'TikTok' ? (item.profile ? 'tiktok-profile' : 'short') : item.wide ? 'wide' : item.kind === 'audio' || item.kind === 'map' || item.kind === 'doc' || item.kind === 'card' ? 'panel' : 'tall'; }
  /* 영상이 아닌 임베드(지도·문서·오디오·게시물)는 노션처럼 미리보기 없이 바로 보여 준다 */
  function isPlayable(item) { return item.provider === 'YouTube' || item.provider === 'Instagram' || (item.provider === 'TikTok' && !item.profile) || item.kind === 'video' || item.provider === 'Vimeo'; }
  function previewHtml(item) {
    if (!item || item.render !== 'iframe') return blockless(item);
    /* 틱톡 계정 카드는 재생할 영상이 아니라 소개 카드라서 미리보기 없이 바로 보여 준다 */
    if (item.profile || !isPlayable(item)) return frameHtml(item);
    var label = item.provider === 'YouTube' ? (item.tall ? 'YouTube 쇼츠' : 'YouTube') : item.profile ? 'TikTok ' + item.handle : item.provider;
    return '<button type="button" class="bbm-embed-preview is-' + kindOf(item) + (item.reel ? ' is-reel' : '') + '" data-embed-activate="' + esc(item.url) + '" aria-label="' + esc(label) + ' 재생">' +
      (item.image ? '<img src="' + esc(item.image) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '') +
      '<span class="bbm-embed-play" aria-hidden="true"></span><span class="bbm-embed-label">' + esc(label) + '</span></button>';
  }
  function blockless(item) { return item ? cardHtml(item) : ''; }
  function hydratePreviews(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.bbm-embed-preview:not([data-embed-hydrated])'), function (button) {
      button.setAttribute('data-embed-hydrated', '');
      if (button.querySelector('img')) return;
      fetchMeta(button.getAttribute('data-embed-activate')).then(function (meta) {
        if (!meta || !meta.image || button.querySelector('img')) return;
        button.insertAdjacentHTML('afterbegin', '<img src="' + esc(meta.image) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">');
      });
    });
  }
  function activate(button) {
    var item = info(button.getAttribute('data-embed-activate'));
    if (!item) return;
    var wrap = document.createElement('div');
    wrap.className = 'bbm-embed-live';
    wrap.innerHTML = frameHtml(item, { autoplay: true });
    button.replaceWith(wrap);
    /* 레딧이 실패한 주소를 오류로 남기듯: 인스타·레딧·X가 12초 안에 크기 신호를 안 보내면(삭제·비공개·차단) 원문 링크로 바꾼다 */
    if (item.provider === 'Instagram' || item.provider === 'Reddit' || item.provider === 'X') {
      setTimeout(function () {
        var frame = wrap.querySelector('iframe');
        if (!frame || frame.hasAttribute('data-embed-height') || !wrap.isConnected) return;
        wrap.innerHTML = '<a class="bbm-embed-fallback" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer"><strong>원문을 확인할 수 없습니다</strong><span>' + esc(item.provider) + '에서 보기</span></a>';
      }, 12000);
    }
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-embed-activate]');
    if (!button) return;
    event.preventDefault(); event.stopPropagation();
    activate(button);
  }, true);
  /* 기사 링크(네이버 스포츠 등 iframe을 막는 사이트): 노션 북마크처럼 원문 제목·이미지·파비콘을 불러와 카드로 채운다 */
  function hydrateCards(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('a.news-card[data-embed-hydrate]'), function (card) {
      card.removeAttribute('data-embed-hydrate');
      var url = card.getAttribute('href');
      fetchMeta(url).then(function (meta) {
        if (!meta || !(meta.title || meta.image) || !card.isConnected) return;
        var fallbackTitle = card.getAttribute('data-embed-title') || '';
        var html = cardHtml({ url: url, title: meta.title || fallbackTitle, description: meta.description, image: meta.image, logo: meta.logo, site: meta.site, lang: meta.lang });
        var holder = document.createElement('div'); holder.innerHTML = html;
        card.replaceWith(holder.firstChild);
      });
    });
  }
  window.BBM_EMBED = { faviconFor: faviconFor, fromCode: fromCode, hydrateCards: hydrateCards, info: info, fetchMeta: fetchMeta, cardHtml: cardHtml, frameHtml: frameHtml, blockHtml: blockHtml, previewHtml: previewHtml, hydratePreviews: hydratePreviews };
})();
