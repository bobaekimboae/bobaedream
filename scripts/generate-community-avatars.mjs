import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve('public', 'community', 'assets', 'profile-avatars');
const backgrounds = ['#d9e8ff','#ffe2d8','#e4defc','#d8f1e4','#fff0c9','#dce7ee','#f7dced','#d9efe9'];
const skins = ['#f6c9a8','#eab18a','#d99162','#b96f47','#8d4d31','#f2bd91'];
const hairs = ['#20242a','#49352b','#71472f','#8f6645','#d4ad62','#5f455f'];
const shirts = ['#238fe3','#315ca8','#e66b54','#12876f','#7656b3','#e7a62f','#424b57','#cc4f7a'];

function hair(index, color) {
  const styles = [
    `<path d="M29 37c0-18 8-27 20-27 14 0 21 11 19 29-6-8-13-12-24-12-6 0-11 4-15 10Z" fill="${color}"/>`,
    `<path d="M29 39c-2-15 6-29 21-29 13 0 22 10 19 28-7-2-10-9-12-16-5 8-15 14-28 17Z" fill="${color}"/>`,
    `<path d="M28 38c0-17 9-28 22-28 15 0 22 13 19 29l-7-10-5 6-8-9-6 8-7-7-8 11Z" fill="${color}"/>`,
    `<path d="M28 39c0-19 9-29 22-29 13 0 21 10 20 27-9-4-14-11-15-18-5 10-13 17-27 20Z" fill="${color}"/>`,
  ];
  return styles[index % styles.length];
}

function avatarSvg(index) {
  const bg = backgrounds[index % backgrounds.length];
  const skin = skins[(index * 5) % skins.length];
  const hairColor = hairs[(index * 7) % hairs.length];
  const shirt = shirts[(index * 3) % shirts.length];
  const glasses = index % 4 === 0
    ? '<g fill="none" stroke="#30343a" stroke-width="2"><rect x="32" y="38" width="12" height="9" rx="4"/><rect x="52" y="38" width="12" height="9" rx="4"/><path d="M44 42h8"/></g>'
    : '';
  const freckles = index % 5 === 0
    ? '<g fill="#b96f47" opacity=".5"><circle cx="35" cy="50" r="1"/><circle cx="39" cy="52" r="1"/><circle cx="61" cy="50" r="1"/><circle cx="57" cy="52" r="1"/></g>'
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="커뮤니티 회원 프로필">
  <circle cx="48" cy="48" r="48" fill="${bg}"/>
  <circle cx="80" cy="18" r="18" fill="#fff" opacity=".22"/>
  <circle cx="14" cy="76" r="23" fill="#fff" opacity=".14"/>
  <path d="M13 96c2-21 15-32 35-32s33 11 35 32H13Z" fill="${shirt}"/>
  <path d="M39 61h18v13c-5 5-13 5-18 0V61Z" fill="${skin}"/>
  <circle cx="29" cy="43" r="5" fill="${skin}"/>
  <circle cx="67" cy="43" r="5" fill="${skin}"/>
  <ellipse cx="48" cy="42" rx="20" ry="25" fill="${skin}"/>
  ${hair(index, hairColor)}
  <g fill="#20242a"><circle cx="39" cy="43" r="2"/><circle cx="57" cy="43" r="2"/></g>
  ${glasses}
  ${freckles}
  <path d="M43 54c3 3 7 3 10 0" fill="none" stroke="#8d4d31" stroke-width="2" stroke-linecap="round"/>
  <path d="M31 76c11 8 23 8 34 0" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>
</svg>`;
}

await mkdir(outputDir, { recursive:true });
await Promise.all(Array.from({ length:48 }, async (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  await writeFile(path.join(outputDir, `avatar-${number}.svg`), avatarSvg(index), 'utf8');
}));

console.log(`Generated 48 community profile avatars in ${outputDir}`);
