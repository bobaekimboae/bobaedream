import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadEmbed() {
  const source = await readFile(new URL('../public/community/community-embed.js', import.meta.url), 'utf8');
  const window = { addEventListener() {} };
  const document = { addEventListener() {} };
  vm.runInNewContext(source, { URL, window, document, sessionStorage: {}, fetch() {} });
  return window.BBM_EMBED;
}

test('turns the reported TikTok short URL into the official video player', async () => {
  const embed = await loadEmbed();
  const item = embed.info('https://vt.tiktok.com/ZSgFh12ft/');

  assert.equal(item.provider, 'TikTok');
  assert.equal(item.render, 'iframe');
  assert.equal(item.url, 'https://www.tiktok.com/@ah_nouh/video/7696972500185533712');
  assert.equal(item.src, 'https://www.tiktok.com/player/v1/7696972500185533712?description=1&music_info=1');
  assert.equal(item.tall, true);
});
