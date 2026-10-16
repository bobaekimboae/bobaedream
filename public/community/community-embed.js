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
    if (host === 'youtu.be' && parts[0]) return frame('https://www.youtube-nocookie.com/embed/' + encodeURIComponent(parts[0]), 'YouTube', '유튜브 동영상');
    if (host.slice(-11) === 'youtube.com') {
      var id = parsed.searchParams.get('v') || (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live' ? parts[1] : '');
      if (id) return frame('https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id), 'YouTube', parts[0] === 'shorts' ? '유튜브 쇼츠' : '유튜브 동영상', parts[0] === 'shorts');
    }
    if (host.slice(-9) === 'vimeo.com' && /^\d+$/.test(parts[parts.length - 1] || '')) return frame('https://player.vimeo.com/video/' + parts[parts.length - 1], 'Vimeo', 'Vimeo 동영상');
    if (host === 'instagram.com' || host.slice(-14) === '.instagram.com') {
      if (['p', 'reel', 'reels', 'tv'].indexOf(parts[0]) >= 0 && parts[1]) {
        var type = parts[0] === 'reels' ? 'reel' : parts[0];
        var clean = 'https://www.instagram.com/' + type + '/' + encodeURIComponent(parts[1]) + '/';
        return frame(clean + 'embed/captioned/', 'Instagram', type === 'reel' ? 'Instagram 릴스' : 'Instagram 게시물', true, clean);
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
    return '<iframe src="' + esc(item.src) + '" title="' + esc(item.title || item.provider || '임베드') + '" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"></iframe>';
  }
  /* 상세·피드에서 쓰는 블록 하나 */
  function blockHtml(item) {
    if (!item || !/^https?:\/\//.test(item.url || '')) return '';
    var caption = item.caption ? '<figcaption>' + esc(item.caption) + '</figcaption>' : '';
    if (item.render === 'iframe') return '<figure class="detailEmbed' + (item.tall ? ' is-tall' : '') + '">' + frameHtml(item) + caption + '</figure>';
    return '<figure class="detailEmbed">' + cardHtml(item) + caption + '</figure>';
  }
  window.BBM_EMBED = { info: info, fetchMeta: fetchMeta, cardHtml: cardHtml, frameHtml: frameHtml, blockHtml: blockHtml };
})();
