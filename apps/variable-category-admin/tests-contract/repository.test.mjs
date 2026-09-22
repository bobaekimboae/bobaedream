import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('required production contracts exist', () => {
  for (const path of ['AGENTS.md', 'docs/openapi.yaml', 'docs/INTEGRATION.md', 'docs/ROLLBACK.md', 'Dockerfile', 'docker-compose.yml']) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, path);
  }
});

test('repository forbids production listing stubs and executable sql predicates', () => {
  const agents = read('AGENTS.md');
  assert.match(agents, /listings_stub/);
  assert.match(agents, /사용자 입력 SQL/);
  const evaluator = read('app/Services/PredicateEvaluator.php');
  assert.doesNotMatch(evaluator, /\beval\s*\(/);
  assert.doesNotMatch(evaluator, /DB::raw/);
});

test('public API and adapter boundaries are documented', () => {
  assert.match(read('docs/openapi.yaml'), /\/configuration\/current:/);
  assert.match(read('app/Contracts/ListingGateway.php'), /interface ListingGateway/);
  assert.match(read('app/Domain/Listing/ListingContract.php'), /final readonly class ListingContract/);
});

test('public admin demo exposes the production operations model', () => {
  const html = read('public/admin-demo/index.html');
  const script = read('public/admin-demo/app.js');

  for (const label of ['정책 매트릭스', '운영 작업 큐', '릴리스 상세·검수', '기존 관리자 연동', '감사 로그']) {
    assert.match(html, new RegExp(label));
  }

  for (const code of ['CAR', 'BIKE', 'TRUCK_SPECIAL', 'BUS', 'CAMPING_CARAVAN', 'CONSTRUCTION', 'MATERIAL_HANDLING']) {
    assert.match(script, new RegExp(`code: "${code}".*namespace: "VEHICLE_TYPE"`));
  }

  for (const code of ['ATTACHMENT', 'PARTS_GOODS']) {
    assert.match(script, new RegExp(`code: "${code}".*namespace: "ASSET_TYPE"`));
  }

  for (const legacyCode of ['FORKLIFT_LOGISTICS', 'AGRICULTURE', 'TRAILER', 'BOAT_PWC', 'ATV_UTV', 'E_BIKE', 'CONTAINER_MOBILE_HOME']) {
    assert.doesNotMatch(script, new RegExp(`code: "${legacyCode}"`));
  }

  for (const policyKey of ['filter', 'registration', 'list', 'detail', 'option', 'seller', 'product', 'makers', 'qa', 'platform']) {
    assert.match(script, new RegExp(`"${policyKey}"`));
  }

  assert.match(script, /READ_ONLY SHADOW/);
  assert.doesNotMatch(script, /fetch\s*\(/);
});
