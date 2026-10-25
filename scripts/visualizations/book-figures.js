// Các hình của chương 2 trong sách, vẽ lại bằng nét tay với đúng dữ liệu in trong sách.
// Hình tĩnh: mỗi hình một ý, cơ chế nằm trong hình (phạm vi scan, entry khớp, chỗ tree không giúp được).
import { figure } from '../sketch.js';
import { scan } from '../scan-model.js';
import { names, people } from '../../data/ch2-examples.js';

const ROW = 24, LEAF_GAP = 14;
const narrow = () => matchMedia('(max-width: 560px)').matches;

// Một node: các dòng entry. cells: [[text, width], ...] cho mỗi dòng; tone(i) tô từng dòng.
function node(p, x, y, rows, widths, style = () => ({})) {
  const w = widths.reduce((a, b) => a + b, 0);
  rows.forEach((cells, i) => {
    const s = style(i), ry = y + i * ROW;
    if (s.fill) p.rect(x + 2, ry + 2, w - 4, ROW - 4, { stroke: false, fill: s.fill, solid: s.fill === 'match-wash', gap: 3, simple: true });
    let cx = x;
    cells.forEach((c, k) => {
      p.text(cx + widths[k] / 2, ry + 17, c, { size: s.small && k === cells.length - 1 ? 12 : 15, anchor: 'middle', tone: s.tone ?? 'ink', weight: s.bold ? 700 : 400 });
      cx += widths[k];
    });
  });
  const touched = rows.some((_, i) => style(i).fill);
  p.rect(x, y, w, rows.length * ROW, { tone: touched ? 'ink' : 'index', width: touched ? 2 : 1.3 });
  return w;
}

const leafTop = (top, i) => top + i * (3 * ROW + LEAF_GAP);
const stub = (p, x, y, tx, ty) => {
  p.arrow(x, y, tx, ty, { tone: 'faint', width: 1, simple: true });
  p.text(tx + (tx < x ? -4 : 4), ty + 5, '…', { size: 16, tone: 'muted', anchor: tx < x ? 'end' : 'start' });
};

// Figure 2.1: index (employee_id, subsidiary_id). Entry của subsidiary 20 không nằm cạnh nhau,
// và không có trong root hay branch.
const F21 = {
  root: [[121, 25], [126, 30], [131, 11]],
  branch: [[123, 18], [123, 27], [125, 30], [126, 30]],
  leaves: [[[123, 20], [123, 21], [123, 27]], [[124, 10], [124, 20], [125, 30]]],
};
export function fig21(svg) {
  figure(svg, p => {
    const thin = narrow(), W = thin ? 400 : 680, top = 40;
    const cw = thin ? [44, 40] : [54, 50], rid = thin ? [] : [64];
    const rx = 0, bx = thin ? 130 : 210, lx = thin ? 270 : 450;
    const lw = cw.concat(rid).reduce((a, b) => a + b, 0);
    svg.setAttribute('viewBox', `0 0 ${W} ${top + 2 * (3 * ROW) + LEAF_GAP + 64}`);
    p.text(rx, 18, 'Root', { size: 16, tone: 'muted' });
    p.text(bx, 18, 'Branch', { size: 16, tone: 'muted' });
    p.text(lx, 18, 'Leaf node', { size: 16, tone: 'muted' });
    const by = top + 10, ry = by + ROW / 2;
    node(p, rx, ry, F21.root.map(r => r.map(String)), cw);
    node(p, bx, by, F21.branch.map(r => r.map(String)), cw);
    // root (126, 30) → branch này; các entry khác của root trỏ ra ngoài hình.
    const rw = cw[0] + cw[1];
    p.arrow(rx + rw + 2, ry + 1.5 * ROW, bx - 4, by + ROW * 2, { tone: 'index', width: 1.3 });
    stub(p, rx + rw + 2, ry + 0.5 * ROW, rx + rw + 26, ry - 10);
    stub(p, rx + rw + 2, ry + 2.5 * ROW, rx + rw + 26, ry + 3 * ROW + 10);
    // branch (123, 27) → leaf 1, (125, 30) → leaf 2.
    [1, 2].forEach((b, i) => p.arrow(bx + rw + 2, by + (b + 0.5) * ROW, lx - 4, leafTop(top, i) + 1.5 * ROW, { tone: 'index', width: 1.3 }));
    stub(p, bx + rw + 2, by + 0.5 * ROW, bx + rw + 26, by - 10);
    stub(p, bx + rw + 2, by + 3.5 * ROW, bx + rw + 26, by + 4 * ROW + 10);
    F21.leaves.forEach((leaf, i) => node(p, lx, leafTop(top, i), leaf.map(e => [String(e[0]), String(e[1])].concat(thin ? [] : ['ROWID'])),
      cw.concat(rid), j => (leaf[j][1] === 20 ? { fill: 'match-wash', tone: 'match', bold: true } : { small: true })));
    p.arrow(lx + lw / 2, leafTop(top, 0) + 3 * ROW + 2, lx + lw / 2, leafTop(top, 1) - 2, { tone: 'muted', both: true, width: 1, simple: true });
    const ny = leafTop(top, 1) + 3 * ROW + 26;
    p.text(0, ny, 'Cột đầu: employee_id · cột sau: subsidiary_id.', { size: 15, tone: 'muted' });
    p.text(0, ny + 22, 'Subsidiary 20 (cam) có ở leaf node, nhưng không có trong root hay branch.', { size: 15, tone: 'match' });
  });
}

// Figure 2.2 / 2.3: cùng điều kiện (subsidiary 27, sinh 1/1–9/1/1971) trên hai thứ tự column.
const F22 = {
  cols: ['date_of_birth', 'subsidiary_id'],
  branch: [['27-DEC-70', 19], ['01-JAN-71', 6], ['05-JAN-71', 3], ['08-JAN-71', 6], ['09-JAN-71', 17], ['12-JAN-71', 3]],
  leaves: [
    [['28-DEC-70', 4], ['01-JAN-71', 3], ['01-JAN-71', 6]],
    [['02-JAN-71', 1], ['04-JAN-71', 1], ['05-JAN-71', 3]],
    [['06-JAN-71', 4], ['06-JAN-71', 11], ['08-JAN-71', 6]],
    [['08-JAN-71', 27], ['09-JAN-71', 10], ['09-JAN-71', 17]],
    [['09-JAN-71', 17], ['09-JAN-71', 30], ['12-JAN-71', 3]],
  ],
};
const F23 = {
  cols: ['subsidiary_id', 'date_of_birth'],
  branch: [[27, '12-SEP-60'], [27, '25-JUN-69'], [27, '26-SEP-72'], [27, '16-AUG-76'], [27, '14-SEP-84'], [30, '30-SEP-53']],
  leaves: [
    [[26, '01-SEP-83'], [27, '23-NOV-64'], [27, '25-JUN-69']],
    [[27, '23-SEP-69'], [27, '08-JAN-71'], [27, '26-SEP-72']],
    [[27, '04-OCT-73'], [27, '18-DEC-75'], [27, '16-AUG-76']],
    [[27, '23-AUG-76'], [27, '30-JUL-78'], [27, '14-SEP-84']],
    [[27, '09-MAR-88'], [27, '08-OCT-91'], [30, '30-SEP-53']],
  ],
};
const MON = { JAN: 1, JUN: 6, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12, MAR: 3, JUL: 7 };
const iso = d => { const [dd, m, yy] = d.split('-'); return `19${yy}-${String(MON[m]).padStart(2, '0')}-${dd}`; };
const inRange = d => iso(d) >= '1971-01-01' && iso(d) <= '1971-01-09';

export function rangeFig(svg, which) {
  const F = which === '2.3' ? F23 : F22;
  const dateOf = e => (typeof e[0] === 'string' ? e[0] : e[1]);
  const subOf = e => (typeof e[0] === 'string' ? e[1] : e[0]);
  // Access predicate: với (date, sub) chỉ khoảng ngày giới hạn được đoạn scan; với (sub, date) là cả hai.
  const scanned = e => (which === '2.3' ? subOf(e) === 27 && inRange(dateOf(e)) : inRange(dateOf(e)));
  const match = e => subOf(e) === 27 && inRange(dateOf(e));
  figure(svg, p => {
    const thin = narrow(), W = thin ? 400 : 680, top = 34;
    const cw = typeof F.leaves[0][0][0] === 'string' ? (thin ? [84, 32] : [100, 44]) : (thin ? [32, 84] : [44, 100]);
    const bx = 0, lx = thin ? 168 : 250, bw = cw[0] + cw[1];
    const H = leafTop(top, 5) + 4;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    p.text(bx, 18, 'Branch node', { size: 16, tone: 'muted' });
    p.text(lx, 18, 'Leaf node', { size: 16, tone: 'muted' });
    const by = top + (leafTop(top, 5) - top - 6 * ROW) / 2;
    node(p, bx, by, F.branch.map(r => r.map(String)), cw);
    stub(p, bx + bw + 2, by + 0.5 * ROW, bx + bw + 28, by - 12);
    F.leaves.forEach((leaf, i) => {
      p.arrow(bx + bw + 2, by + (i + 1.5) * ROW, lx - 4, leafTop(top, i) + 1.5 * ROW, { tone: 'index', width: 1.1, roughness: 0.6 });
      node(p, lx, leafTop(top, i), leaf.map(r => r.map(String)), cw,
        j => (match(leaf[j]) ? { fill: 'match-wash', tone: 'match', bold: true } : scanned(leaf[j]) ? { fill: 'faint' } : { tone: 'muted' }));
    });
    // Đường kích thước bên phải: đoạn index phải scan, từ entry đầu tới entry cuối.
    const ys = F.leaves.flatMap((leaf, i) => leaf.map((e, j) => (scanned(e) ? leafTop(top, i) + j * ROW : null))).filter(v => v !== null);
    const x = lx + bw + 18, y0 = Math.min(...ys) + 2, y1 = Math.max(...ys) + ROW - 2;
    p.line(x, y0, x, y1, { tone: 'match', width: 2, roughness: 0.4 });
    p.line(x - 6, y0, x + 6, y0, { tone: 'match', width: 2, roughness: 0.3 });
    p.line(x - 6, y1, x + 6, y1, { tone: 'match', width: 2, roughness: 0.3 });
    const n = F.leaves.flat().filter(scanned).length;
    const ly = (y0 + y1) / 2;
    p.text(x + 12, ly - 4, 'đoạn scan', { size: 15, tone: 'match', weight: 700 });
    p.text(x + 12, ly + 16, `${n} entry`, { size: 15, tone: 'match' });
  });
}

// Figure 2.4: ba mẫu LIKE trên cùng một đoạn index; phần trước wildcard đầu tiên quyết định đoạn scan.
export function likeFig(svg) {
  const patterns = ['WI%ND', 'WIN%D', 'WINA%'];
  figure(svg, p => {
    const thin = narrow(), W = thin ? 400 : 680, colW = W / 3, R = 20, top = 34;
    svg.setAttribute('viewBox', `0 0 ${W} ${top + names.length * R + 24}`);
    patterns.forEach((like, c) => {
      const { sorted, scanned, matched } = scan(names, ['last_name'], { last_name: { like } });
      const x = c * colW;
      p.text(x, 18, `LIKE '${like}'`, { size: thin ? 14 : 16, weight: 700, mono: true });
      sorted.forEach((e, i) => {
        const y = top + i * R;
        if (scanned[i]) p.rect(x, y + 1, colW - (thin ? 26 : 36), R - 2, { stroke: false, fill: matched[i] ? 'match-wash' : 'faint', solid: matched[i], gap: 3, simple: true });
        p.text(x + 4, y + 15, e.last_name, { size: thin ? 13 : 15, mono: true, tone: matched[i] ? 'match' : scanned[i] ? 'ink' : 'muted', weight: matched[i] ? 700 : 400 });
      });
      const idx = scanned.map((s, i) => (s ? i : -1)).filter(i => i >= 0);
      const bx = x + colW - (thin ? 18 : 26), y0 = top + idx[0] * R + 2, y1 = top + (idx.at(-1) + 1) * R - 2;
      p.line(bx, y0, bx, y1, { tone: 'match', width: 2, roughness: 0.4 });
      p.line(bx - 5, y0, bx + 5, y0, { tone: 'match', width: 2, roughness: 0.3 });
      p.line(bx - 5, y1, bx + 5, y1, { tone: 'match', width: 2, roughness: 0.3 });
      p.text(bx - 2, y1 + 16, String(idx.length), { size: 14, tone: 'match', weight: 700, anchor: 'end' });
    });
  });
}

// Index Merge: hai điều kiện khoảng là một góc trên bàn cờ, nhưng index là một chuỗi.
// Chuỗi bên dưới là index (last_name, năm sinh): góc trên bàn cờ thành các điểm rời rạc trong đoạn scan.
export function boardFig(svg, letter = 'K', year = 1970) {
  const hit = e => e.last_name < letter && e.year < year;
  const { sorted, scanned } = scan(people, ['last_name', 'year'], { last_name: { hi: letter }, year: { hi: year - 1 } });
  figure(svg, p => {
    const thin = narrow(), W = thin ? 400 : 680;
    const L = 48, R = W - 10, T = 30, B = thin ? 230 : 260;
    const x = n => L + ((n.charCodeAt(0) - 65 + (n.charCodeAt(1) - 97) / 26) / 26) * (R - L);
    const y = yr => B - ((yr - 1950) / 50) * (B - T);
    const cy = B + 90;
    svg.setAttribute('viewBox', `0 0 ${W} ${cy + 60}`);
    p.rect(L, y(year), x(letter + 'a') - L, B - y(year), { tone: 'match', fill: 'match-wash', solid: true, width: 1.4 });
    p.arrow(L, B, R, B, { tone: 'muted', width: 1.2 });
    p.arrow(L, B, L, T - 12, { tone: 'muted', width: 1.2 });
    ['A', 'G', 'M', 'S', 'Z'].forEach(t => p.text(x(t + 'a'), B + 20, t, { size: 15, tone: 'muted', anchor: 'middle' }));
    [1950, 1975, 2000].forEach(t => p.text(L - 8, y(t) + 5, t, { size: 15, tone: 'muted', anchor: 'end' }));
    p.text(R, B + 40, 'last_name →', { size: 15, tone: 'muted', anchor: 'end' });
    p.text(L + 10, T - 14, '↑ năm sinh', { size: 15, tone: 'muted' });
    p.text(L + 8, y(year) - 8, `last_name < '${letter}' và sinh trước ${year}`, { size: 15, tone: 'match', weight: 700 });
    people.forEach(e => p.circle(x(e.last_name), y(e.year), hit(e) ? 11 : 8, { tone: hit(e) ? 'match' : 'index', fill: hit(e) ? 'match' : 'index-wash', solid: true, width: 1.2 }));
    // Chuỗi: cùng 40 người, xếp theo last_name rồi năm sinh.
    const step = (R - L) / sorted.length;
    p.text(0, cy - 30, 'Index (last_name, năm sinh) là một chuỗi:', { size: 15, tone: 'muted' });
    p.line(L, cy, R, cy, { tone: 'faint', width: 1 });
    sorted.forEach((e, i) => p.circle(L + (i + 0.5) * step, cy, hit(e) ? 11 : 8, { tone: hit(e) ? 'match' : 'index', fill: hit(e) ? 'match' : scanned[i] ? 'faint' : 'index-wash', solid: true, width: 1.1 }));
    const n = scanned.filter(Boolean).length;
    const x1 = L + n * step;
    p.line(L, cy + 18, x1, cy + 18, { tone: 'match', width: 2, roughness: 0.4 });
    p.line(L, cy + 12, L, cy + 24, { tone: 'match', width: 2, roughness: 0.3 });
    p.line(x1, cy + 12, x1, cy + 24, { tone: 'match', width: 2, roughness: 0.3 });
    p.text(L, cy + 44, `đoạn scan: ${n} entry để lấy ${people.filter(hit).length}`, { size: 15, tone: 'match', weight: 700 });
  });
}
