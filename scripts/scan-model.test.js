import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scan, likePrefix } from './scan-model.js';
import { births, names } from '../data/ch2-examples.js';

const count = arr => arr.filter(Boolean).length;

const range = { subsidiary_id: { eq: 27 }, date_of_birth: { lo: '1971-01-01', hi: '1971-01-09' } };

test('Hình 2.2: (date_of_birth, subsidiary_id) scan 13 entry để lấy 1', () => {
  const r = scan(births, ['date_of_birth', 'subsidiary_id'], range);
  assert.deepEqual(r.access, ['date_of_birth']);
  assert.equal(count(r.scanned), 13);
  assert.equal(count(r.matched), 1);
});

test('Hình 2.3: (subsidiary_id, date_of_birth) scan đúng 1 entry', () => {
  const r = scan(births, ['subsidiary_id', 'date_of_birth'], range);
  assert.deepEqual(r.access, ['subsidiary_id', 'date_of_birth']);
  assert.equal(count(r.scanned), 1);
});

test('Hình 2.4: tiền tố LIKE quyết định phạm vi scan', () => {
  const run = like => scan(names, ['last_name'], { last_name: { like } });
  assert.deepEqual([run('WI%ND'), run('WIN%D'), run('WINA%')].map(r => [count(r.scanned), count(r.matched)]),
    [[18, 1], [2, 1], [1, 1]]);
  assert.equal(likePrefix('%ND'), '');
  assert.equal(count(run('%ND').scanned), 18);
  assert.equal(likePrefix('WINAND'), 'WINAND');
});
