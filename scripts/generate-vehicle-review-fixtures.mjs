#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'data/inventory/seoul-autogallery-cars.json'), 'utf8'));
const cars = inventory.cars.filter((car) => car.id >= 1 && car.id <= 23).sort((a, b) => a.id - b.id);
const modelIds = {
  1: 'sag-01-m3', 2: 'sag-02-taycan', 3: 'sag-03-gls', 4: 'sag-04-glc', 5: 'sag-05-eclass', 6: 'sag-06-rx',
  7: 'sag-07-sclass', 8: 'sag-08-gla', 9: 'sag-09-defender', 10: 'sag-10-7series', 11: 'sag-11-eclass',
  12: 'sag-12-cls', 13: 'sag-13-sclass', 14: 'sag-14-4series', 15: 'sag-15-sclass', 16: 'sag-16-flying-spur',
  17: 'sag-17-ftype', 18: 'sag-18-defender', 19: 'sag-19-macan', 20: 'sag-20-sclass', 21: 'sag-21-avante',
  22: 'sag-22-carnival', 23: 'sag-23-maybach',
};
const logoSlugs = { BMW: 'bmw', 벤츠: 'mercedes-benz', 포르쉐: 'porsche', 랜드로버: 'land-rover', 렉서스: 'lexus', 벤틀리: 'bentley', 재규어: 'jaguar', 현대: 'hyundai', 기아: 'kia' };
const authors = ['드라이브로그', '차생활연구소', '주말오너', '매일출근러', '패밀리카유저', '모터다이어리', '서울드라이버', '로드테스터'];
const locations = ['서울', '경기', '인천', '부산', '대구', '대전'];
const titleSuffixes = ['실사용 솔직 후기', '출퇴근·장거리 주행 후기', '승차감과 유지비 체감 후기'];
const bodies = [
  '출퇴근과 주말 장거리에서 함께 운행했습니다. 차체가 안정적이고 조향 반응이 자연스러우며, 실내 정숙성과 시트 편안함도 기대했던 수준입니다.',
  '도심 정체 구간과 고속도로를 번갈아 주행했습니다. 가속과 제동이 매끄럽고 시야가 편안하지만, 노면이 거친 구간에서는 승차감이 조금 단단하게 느껴집니다.',
  '가족과 여행하며 적재 공간과 2열 승차감을 집중해서 봤습니다. 장거리 피로도가 낮고 기본 편의 사양이 충분해 일상용으로 만족스럽습니다.',
];
const values = [3.5, 4, 4.5, 4, 3.5, 4.5, 4, 3.5];
const headers = ['id','category','title','summary','body','source','sourceUrl','author','publishedAt','thumbnail','images','views','comments','likes','tags','reviewId','modelId','brand','model','trim','powertrain','rating','owner','ownershipLabel','benchmark','location','ratings','brandLogo','embed'];
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function powertrainOf(car) {
  if (car.fuel === '전기') return 'ev';
  if (car.fuel === '하이브리드') return 'hybrid';
  return 'ice';
}

function ratingsOf(powertrain, index) {
  const labels = powertrain === 'ev'
    ? ['외관','실내','공간','편의·안전 사양','주행감','주행거리·전비','주행 보조','인포테인먼트']
    : ['외관','실내','공간','편의·안전 사양','동력·핸들링','연비'];
  return labels.map((label, offset) => [label, values[(index + offset) % values.length]]);
}

const rows = Array.from({ length: 50 }, (_, index) => {
  const car = cars[index % cars.length];
  const variant = Math.floor(index / cars.length);
  const key = `sag-${String(car.id).padStart(2, '0')}`;
  const powertrain = powertrainOf(car);
  const scores = ratingsOf(powertrain, index);
  const rating = scores.reduce((sum, [, score]) => sum + score, 0) / scores.length;
  const owner = index % 4 !== 3;
  const title = `${car.maker} ${car.model} ${titleSuffixes[(index + variant) % titleSuffixes.length]}`;
  const body = bodies[(index + variant) % bodies.length];
  const photoStart = (variant * 2) % 5;
  const images = [0, 1, 2].map((offset) => {
    const photo = ((photoStart + offset) % 5) + 1;
    return `../%61ssets/cars/seoul-autogallery-v01/${key}-${photo}.webp`;
  });
  return {
    id: 9200001 + index,
    category: owner ? '실소유자' : '시승 리뷰',
    title,
    summary: body.split('. ')[0] + '.',
    body,
    source: '보배드림',
    sourceUrl: '',
    author: authors[index % authors.length],
    publishedAt: `2026-10-${String(16 - (index % 15)).padStart(2, '0')}T${String(8 + index % 12).padStart(2, '0')}:${String(index * 7 % 60).padStart(2, '0')}:00+09:00`,
    thumbnail: images[0],
    images: images.join('|'),
    views: 240 + index * 37,
    comments: 2 + (index * 3) % 24,
    likes: 12 + (index * 7) % 89,
    tags: `${owner ? '실소유자' : '시승'}|${powertrain === 'ev' ? '전기차' : powertrain === 'hybrid' ? '하이브리드' : '내연기관'}`,
    reviewId: `review-${key}-${variant + 1}`,
    modelId: modelIds[car.id],
    brand: car.maker,
    model: car.model,
    trim: `${car.year} ${car.trim}`,
    powertrain,
    rating: rating.toFixed(2),
    owner,
    ownershipLabel: owner ? `보유 ${3 + index % 21}개월` : '시승 리뷰',
    benchmark: `${car.body} 평균 4.3`,
    location: locations[index % locations.length],
    ratings: scores.map(([label, score]) => `${label} ${score.toFixed(1)}`).join('|'),
    brandLogo: `../%61ssets/brand/kr/${logoSlugs[car.maker]}.png`,
    embed: '',
  };
});

const output = [headers.join(','), ...rows.map((row) => headers.map((header) => csv(row[header])).join(','))].join('\n') + '\n';
fs.writeFileSync(path.join(root, 'data/boards/vehicle-review.csv'), output, 'utf8');
console.log(`vehicle-review fixtures: ${rows.length}`);
