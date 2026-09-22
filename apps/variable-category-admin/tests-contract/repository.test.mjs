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
