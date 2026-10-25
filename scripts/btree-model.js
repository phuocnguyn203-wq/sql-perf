// Index mẫu 30 entry lấy từ Hình 1.2 của sách: [key, ROWID].
// Đây là mô hình khái niệm của sách, không phải layout nội bộ của B-tree PostgreSQL.
export const leaves = [
  [[11, '3C AF'], [13, 'F3 91'], [18, '6F B2']],
  [[21, '2C 50'], [27, '0F 1B'], [27, '52 55']],
  [[34, '0D 1E'], [35, '44 53'], [39, '24 5D']],
  [[40, '4A 1B'], [43, '9F 71'], [46, 'A2 D2']],
  [[46, '8B 1C'], [53, 'A0 A1'], [53, '0D 79']],
  [[55, '9C F6'], [57, 'B1 C1'], [57, '50 29']],
  [[67, 'C4 6B'], [83, 'FF 9D'], [83, 'AF E9']],
  [[84, '80 64'], [86, '4C 2F'], [88, '06 5B']],
  [[89, '6A 3E'], [90, '7D 9A'], [94, '36 D4']],
  [[95, 'EA 37'], [98, '5E B2'], [98, 'D8 4F']],
];

const groups = [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9]];

// Mỗi entry của branch = key lớn nhất trong node con (cách sách dựng tree).
export const branches = groups.map(children => ({
  children,
  keys: children.map(i => leaves[i].at(-1)[0]),
}));
export const root = { keys: branches.map(b => b.keys.at(-1)) };

// Hai bước đầu của một index lookup (Hình 1.3): tree traversal, rồi leaf node chain.
export function search(key) {
  const steps = [];
  const r = root.keys.findIndex(k => k >= key);
  steps.push({ phase: 'tree', level: 'root', entry: r });
  if (r < 0) return steps;

  const branch = branches[r];
  const e = branch.keys.findIndex(k => k >= key);
  steps.push({ phase: 'tree', level: 'branch', node: r, entry: e });

  for (let leaf = branch.children[e], first = true; leaf < leaves.length; leaf++, first = false) {
    const found = leaves[leaf].flatMap(([k], i) => (k === key ? [i] : []));
    steps.push({ phase: first ? 'tree' : 'chain', level: 'leaf', node: leaf, hits: found });
    // Entry cuối vẫn bằng key thì leaf kế bên có thể còn kết quả.
    if (leaves[leaf].at(-1)[0] !== key) break;
  }
  return steps;
}
