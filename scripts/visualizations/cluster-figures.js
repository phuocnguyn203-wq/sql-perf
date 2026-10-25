// Hình chương 5: gom cụm dữ liệu. Hình 5.1 và 5.2 vẽ lại từ dữ liệu in trong sách; các hình còn lại là minh họa.
import { figure } from '../sketch.js';
import { W, ROW, box, cells, tree } from './join-figures.js';

const fmt = n => n.toLocaleString('vi-VN');

// Vị trí giả ngẫu nhiên cố định (cùng hình mỗi lần vẽ).
const scatter = (i, n) => (i * 7 + 3) % n;

// A. Row store gom cả row vào một block; column store gom từng column.
export function figRowColumn(svg) {
  const cols = ['id', 'tên', 'ngày sinh', 'điện thoại'];
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 230`);
    const panel = (x0, title, byColumn) => {
      p.text(x0, 18, title, { size: 15, weight: 700 });
      for (let b = 0; b < 2; b++) {
        const bx = x0 + b * 160, by = 40;
        p.rect(bx, by, 150, 150, { tone: 'muted', width: 1.3, dash: [5, 4] });
        p.text(bx + 75, by + 168, `block ${b + 1}`, { size: 13, tone: 'muted', anchor: 'middle' });
        for (let r = 0; r < 4; r++) {
          if (byColumn) {
            const c = b * 2 + Math.floor(r / 2);
            p.rect(bx + 8, by + 10 + r * 34, 134, 26, { tone: 'index', fill: c % 2 ? 'index-wash' : 'match-wash', solid: true, width: 1, simple: true });
            p.text(bx + 75, by + 28 + r * 34, `${cols[c]} của row ${(r % 2) * 2 + 1}–${(r % 2) * 2 + 2}`, { size: 12, anchor: 'middle' });
          } else {
            cols.forEach((_, c) => p.rect(bx + 8 + c * 33.5, by + 10 + r * 34, 32, 26, { tone: 'index', fill: c % 2 ? 'index-wash' : 'match-wash', solid: true, width: 1, simple: true }));
            p.text(bx + 75, by + 28 + r * 34, `row ${b * 4 + r + 1}`, { size: 12, anchor: 'middle' });
          }
        }
      }
    };
    panel(0, 'Row store: mọi column của một row nằm cùng block', false);
    panel(360, 'Column store: mỗi block chứa một column', true);
  });
}

// B. Filter predicate dùng có chủ ý: kiểm tra LIKE trước hay sau khi vào table.
export function figFilter(svg, { rows, matches }) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 300`);
    const lane = (y, title, inIndex) => {
      p.text(0, y - 12, title, { size: 15, weight: 700 });
      box(p, 0, y, 150, 44, inIndex ? 'index + last_name' : 'index subsidiary_id', { size: 13 });
      p.text(75, y + 62, `${fmt(rows)} entry của subsidiary`, { size: 12, tone: 'muted', anchor: 'middle' });
      if (inIndex) {
        p.text(170, y + 18, "LIKE '%INA%' kiểm tra", { size: 13, tone: 'match', weight: 700 });
        p.text(170, y + 36, 'ngay trên entry trong index', { size: 13, tone: 'match' });
        p.arrow(340, y + 22, 450, y + 22, { tone: 'index', width: 1.3 });
        p.text(460, y + 27, `${fmt(matches)} row khớp, không vào table`, { size: 14, tone: 'index', weight: 700 });
      } else {
        for (let i = 0; i < 9; i++) p.arrow(152, y + 22, 300, y - 6 + i * 7, { tone: 'muted', width: 0.9, simple: true });
        p.rect(304, y - 10, 90, 68, { tone: 'muted', fill: 'faint', width: 1.2, gap: 5 });
        p.text(349, y + 28, 'table', { size: 14, anchor: 'middle' });
        p.text(349, y + 78, `${fmt(rows)} lần lấy row`, { size: 12, tone: 'match', anchor: 'middle', weight: 700 });
        p.arrow(398, y + 22, 450, y + 22, { tone: 'match', width: 1.3 });
        p.text(460, y + 18, "rồi mới kiểm tra LIKE:", { size: 13, tone: 'match' });
        p.text(460, y + 36, `giữ ${fmt(matches)}, bỏ ${fmt(rows - matches)}`, { size: 14, tone: 'match', weight: 700 });
      }
    };
    lane(40, 'Điều kiện LIKE chỉ có trong table', false);
    lane(190, 'Điều kiện LIKE có sẵn trong index', true);
  });
}

// C. Clustering factor: các entry liền nhau của index trỏ tới ít hay nhiều table block.
export function figClustering(svg) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 280`);
    const panel = (x0, title, good) => {
      p.text(x0, 18, title, { size: 15, weight: 700, tone: good ? 'index' : 'match' });
      cells(p, x0, 40, 70, Array.from({ length: 8 }, (_, i) => `entry ${i + 1}`));
      const touched = new Set();
      for (let i = 0; i < 8; i++) {
        const b = good ? Math.floor(i / 4) : scatter(i, 8);
        touched.add(b);
        p.arrow(x0 + 72, 40 + i * ROW + 12, x0 + 196, 44 + b * 26 + 10, { tone: good ? 'index' : 'match', width: 1, simple: true });
      }
      for (let b = 0; b < 8; b++) {
        const on = touched.has(b);
        p.rect(x0 + 200, 44 + b * 26, 90, 20, { tone: on ? (good ? 'index' : 'match') : 'faint', fill: on ? (good ? 'index-wash' : 'match-wash') : undefined, solid: true, width: 1.1, simple: true });
        p.text(x0 + 245, 59 + b * 26, `block ${b + 1}`, { size: 12, anchor: 'middle', tone: on ? 'ink' : 'muted' });
      }
      p.text(x0, 270, `8 entry → đọc ${touched.size} table block`, { size: 14, weight: 700, tone: good ? 'index' : 'match' });
    };
    panel(0, 'Clustering factor tốt', true);
    panel(360, 'Clustering factor kém', false);
  });
}

// D. Index-only scan: index đã có eur_value, không cần vào table.
export function figIndexOnly(svg, { rows }) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 210`);
    p.text(0, 18, 'Index sales_sub_eur (subsidiary_id, eur_value)', { size: 14, tone: 'muted' });
    cells(p, 0, 34, 70, ['20', '20', '20', '20', '20'], () => ({ tone: 'index' }));
    cells(p, 70, 34, 90, ['3,10', '12,50', '48,00', '95,20', '…'], () => ({ tone: 'index', fill: 'index-wash', solid: true }));
    p.arrow(166, 94, 236, 94, { tone: 'index', width: 1.4 });
    box(p, 240, 72, 120, 44, 'SUM(eur_value)', { tone: 'index', mono: true, size: 13 });
    p.text(240, 136, `${fmt(rows)} entry, cộng ngay trong index`, { size: 13, tone: 'index' });
    box(p, 500, 50, 150, 90, 'table sales', { tone: 'faint', text: 'muted' });
    p.arrow(362, 94, 494, 94, { tone: 'faint', width: 1.2, dash: [5, 4] });
    p.line(418, 78, 440, 110, { tone: 'match', width: 2.4 });
    p.line(440, 78, 418, 110, { tone: 'match', width: 2.4 });
    p.text(430, 160, 'không cần vào table', { size: 14, tone: 'match', weight: 700, anchor: 'middle' });
  });
}

// E. Hai column của cùng table: sale_date theo đúng thứ tự row trong table, subsidiary_id thì rải khắp nơi.
export function figCorrelation(svg, { corrDate, corrSub }) {
  const N = 24;
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 220`);
    const lane = (y, title, hit, note) => {
      p.text(0, y - 10, title, { size: 15, weight: 700 });
      let n = 0;
      for (let b = 0; b < N; b++) {
        const on = hit(b);
        if (on) n++;
        p.rect(b * 27, y, 24, 30, { tone: on ? 'match' : 'faint', fill: on ? 'match-wash' : undefined, solid: true, width: 1.1, simple: true });
      }
      p.text(0, y + 50, `${note}: row khớp nằm trong ${n}/${N} block`, { size: 13, tone: 'match' });
    };
    lane(34, `sale_date > 30/6/2024 (correlation ${corrDate})`, b => b >= N - 2, 'row thêm theo thời gian, lần bán mới ở cuối table');
    lane(134, `subsidiary_id = 20 (correlation ${corrSub})`, b => b % 3 !== 1, 'lần bán của một subsidiary rải khắp table');
    p.text(W - 4, 210, 'thứ tự block trong table →', { size: 13, tone: 'muted', anchor: 'end' });
  });
}

// Hình 5.1 (sách): tra index rồi lấy row từ heap table bằng ROWID.
// Hình 5.2 (sách): secondary index trên index-organized table: tra thêm cả B-tree của clustered index.
const HEAP = [[[23, 21, '9.99', '2010-02-23'], [87, 20, '4.99', '2012-05-23']], [[44, 44, '2.49', '2011-07-04'], [73, 84, '5.99', '2012-05-23']]];
export function fig51(svg) {
  const leaves = [[['2012-05-20'], ['2012-05-20'], ['2012-05-23', [0, 1]]], [['2012-05-23', [1, 1]], ['2012-05-24'], ['2012-05-24']]];
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 250`);
    p.text(0, 18, 'B-tree index trên sale_date', { size: 14, tone: 'muted' });
    p.text(330, 18, 'Heap table: sale_id, employee_id, eur_value, sale_date', { size: 13, tone: 'muted' });
    cells(p, 0, 70, 96, ['2012-05-20', '2012-05-23', '2012-05-24', '2012-05-25']);
    leaves.forEach((leaf, l) => {
      const y = 34 + l * 104;
      p.arrow(98, 70 + (l + 1) * ROW - 12, 136, y + 36, { tone: 'index', width: 1, simple: true });
      leaf.forEach(([d, to], i) => {
        cells(p, 140, y + i * ROW, 96, [d], () => (to ? { tone: 'match', fill: 'match-wash', solid: true } : {}));
        cells(p, 236, y + i * ROW, 60, ['ROWID'], () => (to ? { tone: 'match' } : {}));
        if (to) p.arrow(298, y + i * ROW + 12, 326, 46 + to[0] * 104 + to[1] * ROW + 12, { tone: 'match', width: 1.4 });
      });
    });
    HEAP.forEach((blk, b) => {
      const y = 34 + b * 104;
      p.rect(328, y - 4, 340, 2 * ROW + 32, { tone: 'muted', dash: [5, 4], width: 1.1 });
      blk.forEach((row, r) => row.forEach((v, c) => {
        const hit = row[3] === '2012-05-23';
        cells(p, 336 + [0, 50, 100, 160][c], y + 8 + r * ROW, [50, 50, 60, 100][c], [String(v)], () => (hit ? { tone: 'match', fill: 'match-wash', solid: true } : {}));
      }));
    });
    p.text(0, 244, '① INDEX RANGE SCAN   ② TABLE ACCESS BY INDEX ROWID: ROWID trỏ thẳng tới vị trí row', { size: 13, tone: 'muted' });
  });
}

export function fig52(svg) {
  const leaves = [[['2012-05-20', 65], ['2012-05-20', 46], ['2012-05-23', 73]], [['2012-05-23', 87], ['2012-05-24', 22], ['2012-05-24', 50]]];
  const iot = [[[72, 54, '8.99', '2009-09-23'], [73, 20, '4.99', '2012-05-23']], [[87, 84, '5.99', '2012-05-23'], [88, 14, '2.49', '2008-03-25']]];
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 300`);
    p.text(0, 18, 'Secondary index (sale_date)', { size: 14, tone: 'muted' });
    p.text(300, 18, 'Index-organized table (clustered index theo sale_id)', { size: 13, tone: 'muted' });
    leaves.forEach((leaf, l) => leaf.forEach(([d, k], i) => {
      const y = 40 + l * 104 + i * ROW, hit = d === '2012-05-23';
      cells(p, 0, y, 96, [d], () => (hit ? { tone: 'match', fill: 'match-wash', solid: true } : {}));
      cells(p, 96, y, 40, [String(k)], () => (hit ? { tone: 'match' } : {}));
    }));
    // Root và branch của clustered index đứng giữa secondary index và dữ liệu.
    cells(p, 300, 40, 40, ['75', '82', '90'], i => (i !== 1 ? { tone: 'match' } : {}));
    cells(p, 380, 34, 40, ['71', '73', '75'], i => (i === 1 ? { tone: 'match' } : {}));
    cells(p, 380, 150, 40, ['86', '88', '90'], i => (i === 1 ? { tone: 'match' } : {}));
    p.arrow(342, 52 + 0, 376, 70, { tone: 'match', width: 1.2, simple: true });
    p.arrow(342, 100, 376, 186, { tone: 'match', width: 1.2, simple: true });
    iot.forEach((leaf, l) => leaf.forEach((row, r) => row.forEach((v, c) => {
      const hit = row[3] === '2012-05-23';
      cells(p, 450 + [0, 34, 68, 112][c], 40 + l * 116 + r * ROW, [34, 34, 44, 96][c], [String(v)], () => (hit ? { tone: 'match', fill: 'match-wash', solid: true } : {}));
    })));
    p.arrow(422, 34 + 1.5 * ROW, 446, 40 + 1.5 * ROW, { tone: 'match', width: 1.2, simple: true });
    p.arrow(422, 150 + 1.5 * ROW, 446, 156 + 0.5 * ROW, { tone: 'match', width: 1.2, simple: true });
    // Secondary index chỉ có clustering key (sale_id): phải bắt đầu lại từ root của clustered index.
    p.arrow(138, 40 + 2 * ROW + 12, 296, 52, { tone: 'match', width: 1.4, bend: -20 });
    p.arrow(138, 144 + 12, 296, 100, { tone: 'match', width: 1.4, bend: 20 });
    p.text(0, 268, '① INDEX RANGE SCAN trên secondary index → ra sale_id (73, 87), không phải vị trí row', { size: 13, tone: 'muted' });
    p.text(0, 290, '② với mỗi sale_id: INDEX UNIQUE SCAN, duyệt lại B-tree của clustered index từ root', { size: 13, tone: 'muted' });
  });
}

// F. Vì sao secondary index không lưu được ROWID: tách leaf node làm row đổi chỗ.
export function figSplit(svg) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 190`);
    p.text(0, 18, 'Trước: leaf node đầy', { size: 14, weight: 700 });
    cells(p, 0, 34, 60, ['72', '73', '87', '88'], i => (i === 3 ? { tone: 'match', fill: 'match-wash', solid: true } : {}));
    p.text(70, 140, 'row 88 ở block 1', { size: 13, tone: 'match' });
    p.arrow(110, 80, 230, 80, { tone: 'muted', width: 1.3 });
    p.text(170, 70, 'thêm 80', { size: 13, tone: 'muted', anchor: 'middle' });
    p.text(240, 18, 'Sau: tách thành hai leaf', { size: 14, weight: 700 });
    cells(p, 240, 34, 60, ['72', '73', '80']);
    p.text(240, 134, 'block 1', { size: 13, tone: 'muted' });
    cells(p, 340, 34, 60, ['87', '88'], i => (i === 1 ? { tone: 'match', fill: 'match-wash', solid: true } : {}));
    p.text(340, 110, 'block mới', { size: 13, tone: 'muted' });
    p.text(440, 60, 'Row 88 không hề bị sửa,', { size: 14, tone: 'match' });
    p.text(440, 80, 'nhưng đã sang block khác.', { size: 14, tone: 'match' });
    p.text(440, 110, 'Một địa chỉ vật lý lưu trong', { size: 14 });
    p.text(440, 130, 'secondary index sẽ thành sai.', { size: 14 });
  });
}
