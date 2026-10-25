// Mô hình khái niệm: index nhiều column = danh sách entry sắp theo các column, theo đúng thứ tự định nghĩa.
// conds: { column: { eq } | { lo, hi } | { like } }

export const compareBy = cols => (a, b) => {
  for (const c of cols) {
    if (a[c] < b[c]) return -1;
    if (a[c] > b[c]) return 1;
  }
  return 0;
};

export const likePrefix = pattern => pattern.split(/[%_]/)[0];

export const likeRegex = pattern =>
  new RegExp('^' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$');

function test(v, cond) {
  if ('eq' in cond) return v === cond.eq;
  if ('like' in cond) return likeRegex(cond.like).test(v);
  return (cond.lo === undefined || v >= cond.lo) && (cond.hi === undefined || v <= cond.hi);
}

// Access predicate: các column đầu có điều kiện bằng, cộng tối đa một column khoảng (hoặc tiền tố LIKE).
export function accessCols(cols, conds) {
  const out = [];
  for (const c of cols) {
    const cond = conds[c];
    if (!cond) break;
    if ('like' in cond) {
      if (likePrefix(cond.like)) out.push(c);
      break;
    }
    out.push(c);
    if (!('eq' in cond)) break;
  }
  return out;
}

const accessTest = (v, cond) => ('like' in cond ? v.startsWith(likePrefix(cond.like)) : test(v, cond));

// Không có access predicate nào => phải scan toàn bộ.
export function scan(entries, cols, conds) {
  const sorted = [...entries].sort(compareBy(cols));
  const access = accessCols(cols, conds);
  const scanned = sorted.map(e => access.every(c => accessTest(e[c], conds[c])));
  const matched = sorted.map(e => Object.entries(conds).every(([c, cond]) => test(e[c], cond)));
  return { sorted, access, scanned, matched };
}
