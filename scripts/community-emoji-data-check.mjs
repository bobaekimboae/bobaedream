import { readFile } from 'node:fs/promises';
import path from 'node:path';

const input = path.join(process.cwd(), 'public', 'community', 'data', 'emoji-v17.json');
const catalog = JSON.parse(await readFile(input, 'utf8'));
const failures = [];
const expectedCategories = ['face-emotion', 'symbols', 'person-people', 'animals-nature', 'food-drink', 'travel-places', 'objects', 'activities-events', 'flags'];
const actualCategories = [...new Set(catalog.emojis.map((item) => item.c))];
const variationCount = catalog.emojis.reduce((count, item) => count + item.v.length, 0);
const allEmoji = catalog.emojis.flatMap((item) => [item.e, ...item.v]);
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(catalog.meta.source === 'unicode-emoji', 'source');
assert(catalog.meta.sourceVersion === '2.8.0', 'source version');
assert(catalog.meta.unicodeEmojiVersion === '17.0', 'Unicode Emoji version');
assert(catalog.meta.license === 'MIT', 'license');
assert(catalog.emojis.length === 1867, `base count: ${catalog.emojis.length}`);
assert(variationCount === 2077, `variation count: ${variationCount}`);
assert(JSON.stringify(actualCategories.sort()) === JSON.stringify(expectedCategories.sort()), `categories: ${actualCategories.join(', ')}`);
assert(new Set(allEmoji).size === allEmoji.length, 'duplicate emoji');
assert(catalog.emojis.every((item) => item.e && item.d && item.c && Array.isArray(item.k) && Array.isArray(item.v)), 'required fields');

if (failures.length) {
  console.error(JSON.stringify({ ok:false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok:true, baseCount:catalog.emojis.length, variationCount, categories:actualCategories.length, totalSelectable:allEmoji.length }, null, 2));
