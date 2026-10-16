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
  function frameHtml(item, opts) {
    /* 레딧 validate_secure_oembed처럼 https 주소만 iframe으로, 아니면 링크 카드 */
    if (!/^https:\/\//.test(item.src || '')) return cardHtml(item);
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
    var html = '<iframe' + shape + ' src="' + esc(src) + '" title="' + esc(item.title || item.provider || '임베드') + '" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"></iframe>';
    return crop ? '<div class="bbm-embed-crop">' + html + '</div>' : html;
  }
  /* 상세·피드에서 쓰는 블록 하나 */
  function blockHtml(item) {
    if (!item || !/^https?:\/\//.test(item.url || '')) return '';
    var caption = item.caption ? '<figcaption>' + esc(item.caption) + '</figcaption>' : '';
    if (item.render === 'iframe') return '<figure class="detailEmbed' + (item.tall ? ' is-tall' : '') + '">' + frameHtml(item) + caption + '</figure>';
    var card = cardHtml(item);
    if (!item.image) card = card.replace('<a class="news-card"', '<a class="news-card" data-embed-hydrate');
    return '<figure class="detailEmbed">' + card + caption + '</figure>';
  }
  /* 노션처럼 원본 높이로: 인스타그램(MEASURE)·레딧(resize.embed)이 보내는 높이 신호로 iframe 높이를 맞춘다 */
  window.addEventListener('message', function (event) {
    if (/(^|\.)tiktok\.com$/.test((function () { try { return new URL(event.origin).hostname; } catch (_) { return ''; } })())) {
      var td = event.data;
      try { if (typeof td === 'string' && td.charAt(0) === '{') td = JSON.parse(td); } catch (_) { return; }
      if (!td || !td.signalSource || !(Number(td.height) > 50)) return;
      var tf = document.querySelector('iframe[name="' + String(td.signalSource).replace(/[^\w]/g, '') + '"]');
      if (tf) { tf.setAttribute('data-embed-height', ''); tf.style.setProperty('--embed-h', Math.ceil(td.height) + 'px'); }
      return;
    }
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
  /* 레딧 목록 방식(expando): 목록에서는 외부 플레이어를 불러오지 않고 썸네일 + 재생 버튼만 보여 주고,
     누르면 그 자리에서 플레이어로 바꿔 바로 재생한다. 썸네일은 레딧 스크래퍼 순서대로
     ① 제공처 썸네일(유튜브 i.ytimg) ② 원문 og:image(microlink) ③ 없으면 제공처 색 타일 */
  function kindOf(item) { return item.provider === 'YouTube' ? (item.tall ? 'short' : 'wide') : item.provider === 'Instagram' ? 'instagram' : item.provider === 'TikTok' ? (item.profile ? 'tiktok-profile' : 'short') : 'tall'; }
  function previewHtml(item) {
    if (!item || item.render !== 'iframe') return blockless(item);
    /* 틱톡 계정 카드는 재생할 영상이 아니라 소개 카드라서 미리보기 없이 바로 보여 준다 */
    if (item.profile) return frameHtml(item);
    var label = item.provider === 'YouTube' ? (item.tall ? 'YouTube 쇼츠' : 'YouTube') : item.profile ? 'TikTok ' + item.handle : item.provider;
    return '<button type="button" class="bbm-embed-preview is-' + kindOf(item) + '" data-embed-activate="' + esc(item.url) + '" aria-label="' + esc(label) + ' 재생">' +
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
    /* 레딧이 실패한 주소를 오류로 남기듯: 인스타·레딧이 12초 안에 크기 신호를 안 보내면(삭제·비공개·차단) 원문 링크로 바꾼다 */
    if (item.provider === 'Instagram' || item.provider === 'Reddit') {
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
  window.BBM_EMBED = { hydrateCards: hydrateCards, info: info, fetchMeta: fetchMeta, cardHtml: cardHtml, frameHtml: frameHtml, blockHtml: blockHtml, previewHtml: previewHtml, hydratePreviews: hydratePreviews };
})();
