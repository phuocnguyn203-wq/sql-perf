import { test } from 'node:test';
import assert from 'node:assert/strict';
import { branches, root, search } from './btree-model.js';

test('tree dựng đúng như Hình 1.2', () => {
  assert.deepEqual(branches[1].keys, [46, 53, 57, 83]);
  assert.deepEqual(root.keys, [39, 83, 98]);
});

const phases = key => search(key).map(s => s.phase);

test('57: duyệt 3 tầng, đọc thêm 1 leaf (Hình 1.3)', () => {
  assert.deepEqual(phases(57), ['tree', 'tree', 'tree', 'chain']);
  assert.deepEqual(search(57)[2].hits, [1, 2]);
  assert.deepEqual(search(57)[3].hits, []);
});

test('46: kết quả nằm ở hai leaf liền nhau', () => {
  const leafSteps = search(46).filter(s => s.level === 'leaf');
  assert.deepEqual(leafSteps.map(s => [s.node, s.hits]), [[3, [2]], [4, [0]]]);
});

test('50: tree traversal xong mới biết không có kết quả', () => {
  assert.deepEqual(phases(50), ['tree', 'tree', 'tree']);
});

test('99: lớn hơn mọi key, dừng ngay ở root', () => {
  assert.deepEqual(search(99), [{ phase: 'tree', level: 'root', entry: -1 }]);
});

test('98: leaf cuối không có leaf kế bên', () => {
  assert.deepEqual(phases(98), ['tree', 'tree', 'tree']);
});
