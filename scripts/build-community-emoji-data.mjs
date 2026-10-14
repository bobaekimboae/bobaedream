import { getEmojis } from 'unicode-emoji';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.join(process.cwd(), 'public', 'community', 'data', 'emoji-v17.json');
const emojis = getEmojis();
const categories = [...new Set(emojis.map((item) => item.category))];
const data = {
  meta: {
    source: 'unicode-emoji',
    sourceVersion: '2.8.0',
    unicodeEmojiVersion: '17.0',
    license: 'MIT',
    baseCount: emojis.length,
    variationCount: emojis.reduce((count, item) => count + (item.variations?.length || 0), 0),
    categories,
  },
  emojis: emojis.map((item) => ({
    e: item.emoji,
    d: item.description,
    k: item.keywords,
    c: item.category,
    v: item.variations?.map((variation) => variation.emoji) || [],
  })),
};

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(data)}\n`, 'utf8');
console.log(JSON.stringify({ output, ...data.meta }, null, 2));
