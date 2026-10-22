import { writeFileSync, existsSync } from 'node:fs';
import { seoulAutoGalleryRows } from '../src/prototype/data/seoul-autogallery-v01.ts';

const items = seoulAutoGalleryRows.slice(0, 12).map(row => {
  const nn = String(row.number).padStart(2, '0');
  const photos = row.number === 1
    ? [1, 4, 7, 10, 14, 18].map(n => `cars/seoul-autogallery-v01/m3-original/m3-${n}.webp`)
    : row.photoSet
      ? Array.from({ length: Math.min(6,row.photoSet.count) }, (_, i) => `cars/seoul-autogallery-v01/${row.photoSet.dir}/${row.photoSet.prefix}-${String(i+1).padStart(2,'0')}.jpg`)
      : [1,2,3,4,5].map(n=>`cars/seoul-autogallery-v01/sag-${nn}-${n}.webp`);
  for (const photo of photos) if (!existsSync(`public/assets/${photo}`)) throw new Error(`Missing inventory photo: ${photo}`);
  return { id:`sag-${row.number}`,title:[row.maker,...(row.trim.startsWith(row.model)?[row.trim]:[row.model,row.trim])].filter(Boolean).join(' '),year:row.year,mileage:row.mileage.toLocaleString('ko-KR'),fuel:row.fuel,company:row.company.replace(/\(주\)|\(유\)|주식회사/g,'').trim(),dealer:row.dealer,gallery:'서울오토갤러리',photos:photos.map(p=>`../assets/${p}`) };
});
// Estimated prototype prices are intentionally excluded. Dealers enter the verified price themselves.
writeFileSync('public/dealer-studio/inventory.json',JSON.stringify(items,null,2)+'\n');
console.log(`Dealer studio: ${items.length} sample vehicles, photos verified.`);
