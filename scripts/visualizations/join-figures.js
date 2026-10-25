// Hình minh họa chương 4 (sách không có hình nào cho chương này). Hình tĩnh, mỗi hình một ý:
// join từng cặp table, pipelining, N+1, độ trễ, ba thuật toán join và kích thước bảng băm.
import { figure } from '../sketch.js';

export const W = 680, ROW = 24;
const fmt = n => n.toLocaleString('vi-VN');

// Hộp có nhãn ở giữa.
export function box(p, x, y, w, h, label, o = {}) {
  p.rect(x, y, w, h, { tone: o.tone ?? 'index', fill: o.fill, solid: o.solid, width: o.width ?? 1.4, dash: o.dash, gap: 4 });
  if (label) p.text(x + w / 2, y + h / 2 + 5, label, { size: o.size ?? 15, anchor: 'middle', tone: o.text ?? o.tone ?? 'ink', weight: o.weight, mono: o.mono });
}

// Một cột ô (mỗi ô một row), style(i) → { fill, tone, strike }.
export function cells(p, x, y, w, labels, style = () => ({})) {
  labels.forEach((t, i) => {
    const s = style(i), cy = y + i * ROW;
    p.rect(x, cy, w, ROW, { tone: s.tone ?? 'index', fill: s.fill, solid: s.solid, width: 1.2, simple: true, gap: 3 });
    p.text(x + w / 2, cy + 17, t, { size: 14, anchor: 'middle', mono: true, tone: s.text ?? (s.tone === 'faint' ? 'muted' : 'ink') });
    if (s.strike) p.line(x + 4, cy + ROW / 2, x + w - 4, cy + ROW / 2, { tone: 'match', width: 1.6, simple: true });
  });
}

// Tam giác nhỏ tượng trưng cho một B-tree.
export function tree(p, cx, top, size, label) {
  const h = size, w = size * 1.1;
  p.line(cx, top, cx - w / 2, top + h, { tone: 'index', width: 1.3 });
  p.line(cx, top, cx + w / 2, top + h, { tone: 'index', width: 1.3 });
  p.line(cx - w / 2, top + h, cx + w / 2, top + h, { tone: 'index', width: 1.3 });
  if (label) p.text(cx, top + h + 16, label, { size: 13, anchor: 'middle', tone: 'index', mono: true });
}

const join = (p, cx, cy, label) => {
  p.circle(cx, cy, 44, { tone: 'match', fill: 'match-wash', solid: true, width: 1.6 });
  p.text(cx, cy + 5, label, { size: 14, anchor: 'middle', tone: 'match', weight: 700 });
};

// A. Mọi thuật toán join chỉ ghép hai table một lần: ba table cần hai bước.
export function figPairs(svg) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 300`);
    box(p, 20, 20, 150, 40, 'Table A');
    box(p, 210, 20, 150, 40, 'Table B');
    p.arrow(95, 62, 172, 112, { tone: 'index' });
    p.arrow(285, 62, 208, 112, { tone: 'index' });
    join(p, 190, 130, 'join 1');
    p.arrow(190, 154, 190, 186, { tone: 'muted' });
    box(p, 100, 190, 180, 40, 'kết quả trung gian', { tone: 'muted', dash: [6, 5] });
    box(p, 440, 112, 150, 40, 'Table C');
    p.arrow(282, 210, 418, 250, { tone: 'muted' });
    p.arrow(515, 154, 452, 236, { tone: 'index' });
    join(p, 440, 256, 'join 2');
    p.arrow(466, 256, 540, 256, { tone: 'muted' });
    p.text(548, 261, 'kết quả', { size: 15, weight: 700 });
    p.text(20, 290, 'Kết quả trung gian của bước trước là một đầu vào của bước sau.', { size: 14, tone: 'muted' });
  });
}

// C. Pipelining: row của kết quả trung gian đi tiếp ngay, không cần chỗ lưu cả kết quả.
export function figPipeline(svg) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 250`);
    const lane = (y, title, piped) => {
      p.text(0, y - 34, title, { size: 15, weight: 700, tone: piped ? 'index' : 'muted' });
      join(p, 40, y, 'join 1');
      join(p, 620, y, 'join 2');
      if (piped) {
        p.arrow(64, y, 594, y, { tone: 'index', width: 1.4 });
        [170, 290, 410, 530].forEach(x => p.rect(x - 14, y - 9, 28, 18, { tone: 'index', fill: 'index-wash', solid: true, width: 1.1, simple: true }));
        p.text(330, y + 32, 'mỗi row đi tiếp ngay khi vừa có', { size: 14, anchor: 'middle', tone: 'index' });
      } else {
        p.arrow(64, y, 236, y, { tone: 'muted' });
        p.rect(240, y - 30, 180, 60, { tone: 'muted', fill: 'faint', gap: 5, width: 1.3 });
        for (let r = 0; r < 4; r++) p.line(252, y - 18 + r * 12, 408, y - 18 + r * 12, { tone: 'muted', width: 1, simple: true });
        p.text(330, y + 50, 'lưu hết kết quả trung gian rồi mới chạy tiếp', { size: 14, anchor: 'middle', tone: 'muted' });
        p.arrow(424, y, 594, y, { tone: 'muted' });
      }
    };
    lane(60, 'Nếu lưu kết quả trung gian', false);
    lane(196, 'Pipelining', true);
  });
}

// D. N+1 selects: 1 query lấy N nhân viên, rồi N query lấy sales; JOIN chỉ một lần đi về.
export function figRoundTrips(svg, { n, rows }) {
  figure(svg, p => {
    const gap = 15, step = 2.6 * gap, H = 100 + (n + 1) * step;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const panel = (x0, title, trips, note) => {
      const app = x0 + 20, db = x0 + (x0 ? 250 : 270);
      p.text(x0, 18, title, { size: 15, weight: 700 });
      p.text(app, 44, 'Ứng dụng', { size: 14, tone: 'muted', anchor: 'middle' });
      p.text(db, 44, 'Database', { size: 14, tone: 'muted', anchor: 'middle' });
      p.line(app, 52, app, H - 30, { tone: 'faint', width: 1.2 });
      p.line(db, 52, db, H - 30, { tone: 'faint', width: 1.2 });
      trips.forEach(([q, r, hot], i) => {
        const y = 64 + i * step;
        p.arrow(app + 4, y, db - 4, y + gap * 0.6, { tone: hot ? 'match' : 'index', width: 1.3, simple: true });
        p.arrow(db - 4, y + gap * 1.1, app + 4, y + gap * 1.6, { tone: 'muted', width: 1, simple: true });
        if (q) p.text(app + 12, y - 3, q, { size: 13, tone: hot ? 'match' : 'index' });
        if (r) p.text(db - 12, y + gap * 1.1 + 12, r, { size: 13, tone: 'muted', anchor: 'end' });
      });
      p.text(x0, H - 6, note, { size: 15, weight: 700, tone: trips.length > 1 ? 'match' : 'index' });
    };
    const nplus = [['SELECT … employees', `${n} nhân viên`], ...Array.from({ length: n }, () => ['', '', true])];
    panel(0, 'N+1 selects', nplus, `1 + ${n} = ${n + 1} lần đi về`);
    // Ngoặc bên phải cho N query sales.
    const y0 = 64 + step, y1 = 64 + n * step + gap * 1.6, bx = 282;
    p.line(bx, y0, bx + 8, y0, { tone: 'match', width: 1.3, simple: true });
    p.line(bx + 8, y0, bx + 8, y1, { tone: 'match', width: 1.3, simple: true });
    p.line(bx, y1, bx + 8, y1, { tone: 'match', width: 1.3, simple: true });
    p.text(bx + 14, (y0 + y1) / 2 - 8, `${n} ×`, { size: 13, tone: 'match', weight: 700 });
    p.text(bx + 14, (y0 + y1) / 2 + 10, 'SELECT … sales', { size: 12, tone: 'match' });
    panel(400, 'Một câu JOIN', [['SELECT … JOIN …', `${fmt(rows)} row`]], '1 lần đi về');
  });
}

// E. Thời gian phản hồi: mỗi lần đi về tốn một khoảng độ trễ; lượng dữ liệu chỉ thêm chút ít.
export function figLatency(svg, { n }) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 190`);
    const L = 110, lat = 44, xfer = 6;
    const lane = (y, label, trips, last) => {
      p.text(0, y + 17, label, { size: 15, weight: 700 });
      let x = L;
      for (let i = 0; i < trips; i++) {
        p.rect(x, y, lat, ROW, { tone: 'match', fill: 'match-wash', solid: true, width: 1.1, simple: true });
        const t = i === trips - 1 ? last : xfer;
        p.rect(x + lat, y, t, ROW, { tone: 'index', fill: 'index', width: 1.1, simple: true, gap: 3 });
        x += lat + t + 2;
      }
      return x;
    };
    lane(20, 'N+1', n + 1, xfer);
    lane(70, 'JOIN', 1, 40);
    p.arrow(L, 122, W - 10, 122, { tone: 'muted', width: 1.1 });
    p.text(W - 10, 140, 'thời gian →', { size: 14, tone: 'muted', anchor: 'end' });
    p.rect(L, 156, 30, 16, { tone: 'match', fill: 'match-wash', solid: true, width: 1, simple: true });
    p.text(L + 38, 169, 'độ trễ mỗi lần đi về', { size: 14, tone: 'match' });
    p.rect(L + 230, 156, 30, 16, { tone: 'index', fill: 'index', width: 1, simple: true, gap: 3 });
    p.text(L + 268, 169, 'truyền dữ liệu', { size: 14, tone: 'index' });
  });
}

// F. Nested loops: mỗi row của query ngoài kéo theo một lần tra B-tree ở table bên trong.
export function figNestedLoops(svg, { n }) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 300`);
    p.text(0, 18, 'Query ngoài (driving)', { size: 15, weight: 700 });
    p.text(0, 38, `${n} nhân viên, qua emp_up_name`, { size: 13, tone: 'muted' });
    p.text(300, 18, 'Mỗi row: một lần tra B-tree', { size: 15, weight: 700 });
    p.text(520, 18, 'Sales tìm được', { size: 15, weight: 700 });
    const outer = ['nhân viên 1', 'nhân viên 2', 'nhân viên 3'];
    const found = [3, 1, 2];
    outer.forEach((t, i) => {
      const y = 60 + i * 74;
      cells(p, 0, y, 170, [t]);
      p.arrow(174, y + 12, 284, y + 12, { tone: 'index', width: 1.2 });
      tree(p, 320, y - 6, 34);
      p.text(360, y + 18, 'sales_emp', { size: 13, mono: true, tone: 'index' });
      p.arrow(440, y + 12, 512, y + 12, { tone: 'index', width: 1.2 });
      for (let k = 0; k < found[i]; k++) p.rect(520 + k * 40, y, 34, ROW, { tone: 'match', fill: 'match-wash', solid: true, width: 1.1, simple: true });
    });
    p.text(85, 262, '⋮', { size: 22, tone: 'muted', anchor: 'middle' });
    p.text(320, 262, '⋮', { size: 22, tone: 'muted', anchor: 'middle' });
    p.text(0, 294, `${n} row bên ngoài → ${n} lần duyệt tree của sales_emp.`, { size: 14, tone: 'muted' });
  });
}

// G. Hash join: dựng bảng băm từ employees một lần, rồi dò bằng từng row sales đã qua điều kiện ngày.
export function figHashJoin(svg) {
  const emps = ['30·123', '12·404', '57·981', '20·17', '45·9'];
  const bucketOf = [1, 3, 0, 3, 2];
  const sales = [['30·123', '2024-11-02', 1], ['57·981', '2021-03-14', -1], ['45·9', '2024-08-20', 2], ['20·17', '2019-05-01', -1], ['12·404', '2024-07-09', 3]];
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 270`);
    p.text(0, 18, '1 · Dựng bảng băm', { size: 15, weight: 700, tone: 'index' });
    p.text(0, 38, 'employees, đọc một lượt', { size: 13, tone: 'muted' });
    cells(p, 0, 54, 96, emps);
    p.text(0, 54 + emps.length * ROW + 18, 'key = join predicate', { size: 13, tone: 'muted' });
    p.text(0, 54 + emps.length * ROW + 34, '(subsidiary_id, employee_id)', { size: 13, tone: 'muted', mono: true });
    const bx = 220, by = 54, bh = 34;
    p.text(bx, 38, 'bảng băm (trong bộ nhớ)', { size: 13, tone: 'muted' });
    for (let b = 0; b < 4; b++) {
      p.rect(bx, by + b * bh, 150, bh - 4, { tone: 'index', width: 1.2, simple: true });
      p.text(bx + 8, by + b * bh + 20, b, { size: 13, tone: 'muted' });
      emps.forEach((e, i) => {
        if (bucketOf[i] !== b) return;
        const k = emps.filter((_, j) => j < i && bucketOf[j] === b).length;
        p.rect(bx + 26 + k * 62, by + b * bh + 4, 58, bh - 12, { tone: 'index', fill: 'index-wash', solid: true, width: 1, simple: true });
        p.text(bx + 55 + k * 62, by + b * bh + 20, e, { size: 12, anchor: 'middle', mono: true });
      });
    }
    emps.forEach((_, i) => p.arrow(98, 54 + i * ROW + 12, bx - 4, by + bucketOf[i] * bh + 14, { tone: 'faint', width: 1, simple: true }));
    p.text(450, 18, '2 · Dò bằng từng row sales', { size: 15, weight: 700, tone: 'match' });
    p.text(450, 38, "sale_date > '2024-06-30'", { size: 13, tone: 'muted', mono: true });
    sales.forEach(([k, d, b], i) => {
      const y = 54 + i * 30, keep = b >= 0;
      cells(p, 450, y, 70, [k], () => ({ tone: keep ? 'match' : 'faint' }));
      cells(p, 520, y, 100, [d], () => ({ tone: keep ? 'match' : 'faint', strike: !keep }));
      if (keep) p.arrow(448, y + 12, bx + 154, by + b * bh + 14, { tone: 'match', width: 1.2, bend: 0, simple: true });
    });
    p.text(450, 54 + sales.length * 30 + 16, 'gạch: bị bỏ bởi điều kiện ngày', { size: 13, tone: 'muted' });
    p.text(0, 262, 'Không có lần tra B-tree nào theo join predicate: chỉ một lần đọc mỗi table.', { size: 14, tone: 'muted' });
  });
}

// H. Index cho hash join đối xứng: dù table nào dựng bảng băm, index sales_date vẫn giúp phía sales.
export function figSymmetry(svg) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 220`);
    const panel = (x0, buildSales) => {
      p.text(x0, 18, buildSales ? 'Đảo thứ tự: sales dựng bảng băm' : 'employees dựng bảng băm', { size: 15, weight: 700 });
      const top = buildSales ? ['sales', 'qua sales_date'] : ['employees', 'full table scan'];
      const bottom = buildSales ? ['employees', 'full table scan'] : ['sales', 'qua sales_date'];
      const tbl = (y, [name, how]) => {
        const idx = how.startsWith('qua');
        box(p, x0, y, 130, 40, name, { tone: idx ? 'match' : 'index', fill: idx ? 'match-wash' : undefined, solid: true });
        p.text(x0 + 140, y + 25, how, { size: 13, tone: idx ? 'match' : 'muted', mono: idx });
      };
      tbl(48, top);
      p.arrow(x0 + 65, 90, x0 + 65, 116, { tone: 'muted' });
      box(p, x0, 120, 130, 34, 'bảng băm', { tone: 'muted', dash: [5, 4], size: 14 });
      tbl(170, bottom);
      p.arrow(x0 + 132, 186, x0 + 150, 140, { tone: 'muted', bend: 20, simple: true });
      p.text(x0 + 158, 150, 'dò', { size: 13, tone: 'muted' });
    };
    panel(0, false);
    panel(350, true);
  });
}

// J. Kích thước bảng băm: row hẹp hơn thì bảng băm vừa bộ nhớ; row rộng thì tràn ra đĩa tạm.
export function figHashSize(svg, cases) {
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 240`);
    const mem = 260;
    cases.forEach((c, i) => {
      const y = 30 + i * 104, w = Math.round(mem * c.need);
      p.text(0, y - 10, c.label, { size: 15, weight: 700 });
      p.text(0, y + 22, `${c.width} byte/row`, { size: 14, tone: 'muted' });
      const x0 = 130;
      p.rect(x0, y, mem, 36, { tone: 'ink', width: 1.6, dash: [6, 4] });
      const inMem = Math.min(w, mem);
      p.rect(x0 + 2, y + 4, inMem - 4, 28, { tone: 'index', fill: 'index-wash', solid: true, width: 1.1, simple: true });
      if (w > mem) {
        p.rect(x0 + mem + 8, y + 4, w - mem, 28, { tone: 'match', fill: 'match-wash', solid: true, width: 1.3, simple: true });
        p.text(x0, y + 52, `tràn ra đĩa tạm: ${c.batches} batch, ghi ${fmt(c.temp)} block`, { size: 14, tone: 'match', weight: 700 });
      } else {
        p.text(x0, y + 52, `vừa bộ nhớ: ${c.batches} batch, không ghi đĩa`, { size: 14, tone: 'index', weight: 700 });
      }
    });
    p.text(130, 236, `khung nét đứt: bộ nhớ cho bảng băm (${cases[0].hashMem})`, { size: 13, tone: 'muted' });
  });
}

// I. Sort merge: hai danh sách đã sắp theo join key, đi xuống song song như khóa kéo.
export function figZipper(svg) {
  const left = [1, 2, 3, 5, 6], right = [1, 1, 3, 4, 6, 6];
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} 266`);
    const lx = 140, rx = 420, top = 40;
    p.text(lx + 30, 22, 'employees (đã sắp)', { size: 14, tone: 'muted', anchor: 'middle' });
    p.text(rx + 30, 22, 'sales (đã sắp)', { size: 14, tone: 'muted', anchor: 'middle' });
    const lm = k => right.includes(k), rm = k => left.includes(k);
    cells(p, lx, top, 60, left.map(String), i => (lm(left[i]) ? { tone: 'index' } : { tone: 'match', fill: 'match-wash', solid: true }));
    cells(p, rx, top, 60, right.map(String), i => (rm(right[i]) ? { tone: 'index' } : { tone: 'match', fill: 'match-wash', solid: true }));
    right.forEach((k, j) => {
      const i = left.indexOf(k);
      if (i >= 0) p.line(lx + 62, top + i * ROW + 12, rx - 2, top + j * ROW + 12, { tone: 'index', width: 1.2, simple: true });
    });
    p.text(lx - 10, top + 1 * ROW + 17, 'chỉ left join giữ', { size: 13, tone: 'match', anchor: 'end' });
    p.text(lx - 10, top + 3 * ROW + 17, 'chỉ left join giữ', { size: 13, tone: 'match', anchor: 'end' });
    p.text(rx + 70, top + 3 * ROW + 17, 'chỉ right join giữ', { size: 13, tone: 'match' });
    p.arrow(lx + 30, top + 5 * ROW + 6, lx + 30, top + 5 * ROW + 40, { tone: 'muted' });
    p.arrow(rx + 30, top + 6 * ROW + 6, rx + 30, top + 6 * ROW + 34, { tone: 'muted' });
    p.text(W / 2, top + 6 * ROW + 26, 'hai con trỏ cùng đi xuống, không quay lại', { size: 14, tone: 'muted', anchor: 'middle' });
    p.text(W / 2, 258, 'Full outer join giữ cả hai phía: vẫn là một lượt đi như vậy.', { size: 14, anchor: 'middle' });
  });
}
