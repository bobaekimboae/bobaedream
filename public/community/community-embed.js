/* 커뮤니티 글쓰기 공용 임베드: 주소 → 임베드(유튜브·인스타그램·레딧 등) 또는 뉴스 카드(노션 북마크형).
   chzzk-write(간결형 글쓰기)와 상세 화면이 함께 쓴다. */
(function () {
  'use strict';
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return String(url || ''); } }

  /* 주소 → { url, render:'iframe'|'preview', src, provider, title, tall } (잘못된 주소는 null) */
  function info(value) {
    var parsed;
    try { parsed = new URL(String(value || '').trim()); } catch (_) { return null; }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    var host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    var parts = parsed.pathname.split('/').filter(Boolean);
    var base = { url: parsed.href, render: 'preview', src: '', provider: host, title: host, tall: false };
    function frame(src, provider, title, tall, url) { return { url: url || parsed.href, render: 'iframe', src: src, provider: provider, title: title, tall: Boolean(tall) }; }
    function yt(id, shorts) { var item = frame('https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id), 'YouTube', shorts ? '유튜브 쇼츠' : '유튜브 동영상', shorts); item.image = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg'; item.wide = !shorts; return item; }
    if (host === 'youtu.be' && parts[0]) return yt(parts[0], false);
    if (host.slice(-11) === 'youtube.com') {
      var id = parsed.searchParams.get('v') || (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live' ? parts[1] : '');
      if (id) return yt(id, parts[0] === 'shorts');
    }
    if (host.slice(-9) === 'vimeo.com' && /^\d+$/.test(parts[parts.length - 1] || '')) return frame('https://player.vimeo.com/video/' + parts[parts.length - 1], 'Vimeo', 'Vimeo 동영상');
    if (host === 'instagram.com' || host.slice(-14) === '.instagram.com') {
      if (['p', 'reel', 'reels', 'tv'].indexOf(parts[0]) >= 0 && parts[1]) {
        var type = parts[0] === 'reels' ? 'reel' : parts[0];
        var clean = 'https://www.instagram.com/' + type + '/' + encodeURIComponent(parts[1]) + '/';
        /* 스레드처럼 본문(캡션) 없이 계정 줄 + 사진·영상만: 캡션 없는 embed/ 를 쓰고 아래 반응 줄은 잘라 낸다(crop) */
        var ig = frame(clean + 'embed/', 'Instagram', type === 'reel' ? 'Instagram 릴스' : 'Instagram 게시물', true, clean);
        ig.crop = 'instagram';
        return ig;
      }
    }
    if (/(^|\.)reddit\.com$/.test(host)) {
      var at = parts.indexOf('comments');
      if (parts[0] === 'r' && parts[1] && at > 1 && parts[at + 1]) {
        var slug = parts[at + 2] ? encodeURIComponent(parts[at + 2]) + '/' : '';
        return frame('https://embed.reddit.com/r/' + encodeURIComponent(parts[1]) + '/comments/' + encodeURIComponent(parts[at + 1]) + '/' + slug + '?embed=true&theme=light&showmedia=true&showmore=false', 'Reddit', 'Reddit 게시물', true);
      }
    }
    if (host === 'open.spotify.com' && parts.length >= 2) return frame('https://open.spotify.com/embed/' + encodeURIComponent(parts[0]) + '/' + encodeURIComponent(parts[1]), 'Spotify', 'Spotify');
    return base;
  }

  /* 뉴스 카드용 메타데이터(제목·요약·대표 이미지·매체). microlink 공개 API */
  var cache = {};
  function fetchMeta(url) {
    if (cache[url]) return cache[url];
    cache[url] = fetch('https://api.microlink.io/?url=' + encodeURIComponent(url))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        var d = json && json.status === 'success' ? json.data || {} : {};
        return { title: d.title || '', description: d.description || '', image: (d.image && d.image.url) || '', site: d.publisher || '', logo: (d.logo && d.logo.url) || '', lang: d.lang || '' };
      })
      .catch(function () { return {}; });
    return cache[url];
  }

  function cardHtml(item) {
    var host = hostOf(item.url);
    var overseas = item.lang && !/^ko/i.test(item.lang);
    return '<a class="news-card" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' +
      (item.image ? '<span class="news-card-image"><img src="' + esc(item.image) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></span>' : '') +
      '<span class="news-card-copy"><span class="news-card-site">' + (item.logo ? '<img src="' + esc(item.logo) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()">' : '') +
      '<span>' + esc(item.site || item.provider || host) + '</span>' + (overseas ? '<em>해외</em>' : '') + '</span>' +
      '<strong class="news-card-title">' + esc(item.title || host) + '</strong>' +
      (item.description ? '<span class="news-card-desc">' + esc(item.description) + '</span>' : '') +
      '<small class="news-card-url">' + esc(host) + '</small></span></a>';
  }
  function frameHtml(item) {
    if (!/^https:\/\//.test(item.src || '')) return cardHtml(item);
    var crop = item.crop === 'instagram' || /instagram\.com\//.test(item.src || '');
    var src = crop ? String(item.src).replace(/embed\/captioned\/?$/, 'embed/') : item.src;
    var yt = /youtube(-nocookie)?\.com\/embed\//.test(src);
    /* 노션 동영상 블록처럼 유튜브는 본문 폭 16:9, 쇼츠는 세로 9:16(최대 폭 315, 가운데) */
    var html = '<iframe' + (yt ? (item.tall ? ' data-embed-short' : ' data-embed-wide') : '') + ' src="' + esc(src) + '" title="' + esc(item.title || item.provider || '임베드') + '" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"></iframe>';
    return crop ? '<div class="bbm-embed-crop">' + html + '</div>' : html;
  }
  /* 상세·피드에서 쓰는 블록 하나 */
  function blockHtml(item) {
    if (!item || !/^https?:\/\//.test(item.url || '')) return '';
    var caption = item.caption ? '<figcaption>' + esc(item.caption) + '</figcaption>' : '';
    if (item.render === 'iframe') return '<figure class="detailEmbed' + (item.tall ? ' is-tall' : '') + '">' + frameHtml(item) + caption + '</figure>';
    return '<figure class="detailEmbed">' + cardHtml(item) + caption + '</figure>';
  }
  /* 노션처럼 원본 높이로: 인스타그램(MEASURE)·레딧(resize.embed)이 보내는 높이 신호로 iframe 높이를 맞춘다 */
  window.addEventListener('message', function (event) {
    if (!/(^|\.)(instagram\.com|reddit\.com)$/.test((function () { try { return new URL(event.origin).hostname; } catch (_) { return ''; } })())) return;
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
  window.BBM_EMBED = { info: info, fetchMeta: fetchMeta, cardHtml: cardHtml, frameHtml: frameHtml, blockHtml: blockHtml };
})();
