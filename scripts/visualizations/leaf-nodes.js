// Hình 1.1 vẽ tay, tĩnh: 3 leaf node (có thứ tự) trỏ vào table (heap) (không thứ tự).
import { figure } from '../sketch.js';

// Dữ liệu của Hình 1.1 trong sách.
const leafNodes = [
  { page: 7, entries: [[11, '3C AF'], [13, 'F3 91'], [18, '6F B2']] },
  { page: 2, entries: [[21, '2C 50'], [27, '0F 1B'], [27, '52 55']] },
  { page: 4, entries: [[34, '0D 1E'], [35, '44 53'], [39, '24 5D']] },
];
const tableBlocks = [
  [['0D 1E', 'A', 34, 1, 2], ['0F 1B', 'A', 27, 5, 9]],
  [['24 5D', 'A', 39, 2, 5], ['2C 50', 'X', 21, 7, 2]],
  [['3C AF', 'A', 11, 1, 6]],
  [['44 53', 'A', 35, 8, 3], ['52 55', 'X', 27, 3, 2]],
  [['6F B2', 'A', 18, 3, 6], ['F3 91', 'A', 13, 7, 4]],
];

const ROW = 26, KEY_W = 40, RID_W = 70, TOP = 60;
const LEAF_X = 90, NODE_GAP = 44, TABLE_X = 420, BLOCK_GAP = 16;
const COL_W = [30, 40, 30, 30];
const W = 640, H = 400;

export function leafFigure(root) {
  const svg = root.querySelector('svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const nodeTop = i => TOP + i * (3 * ROW + NODE_GAP);
  const rowY = new Map();
  let y = TOP;
  tableBlocks.forEach(block => {
    for (const [rid] of block) { rowY.set(rid, y); y += ROW; }
    y += BLOCK_GAP;
  });

  figure(svg, p => {
    p.text(LEAF_X, 20, 'Leaf node', { size: 17 });
    p.text(LEAF_X, 40, '(xếp theo thứ tự logic)', { size: 15, tone: 'muted' });
    p.text(TABLE_X, 20, 'Table (heap)', { size: 17 });
    p.text(TABLE_X, 40, '(không có thứ tự)', { size: 15, tone: 'muted' });

    // Con trỏ hai chiều giữa các leaf liền kề (doubly linked list).
    for (let i = 0; i + 1 < leafNodes.length; i++) {
      p.arrow(LEAF_X - 4, nodeTop(i) + 1.5 * ROW, LEAF_X - 4, nodeTop(i + 1) + 1.5 * ROW,
        { tone: 'muted', bend: -42, both: true, width: 1.2 });
    }

    tableBlocks.forEach((block, b) => {
      p.text(TABLE_X + 140, rowY.get(block[0][0]) + 18, `block ${b}`, { size: 14, tone: 'muted' });
      for (const [rid, ...cols] of block) {
        let x = TABLE_X;
        cols.forEach((c, k) => {
          p.rect(x, rowY.get(rid), COL_W[k], ROW, { fill: k === 1 ? 'faint' : undefined, width: 1.2, simple: true });
          p.text(x + COL_W[k] / 2, rowY.get(rid) + 18, c, { size: 15, anchor: 'middle' });
          x += COL_W[k];
        });
      }
    });

    // Leaf node và con trỏ ROWID tới table.
    leafNodes.forEach((node, i) => {
      const top = nodeTop(i);
      p.text(LEAF_X + KEY_W + RID_W, top - 8, `page ${node.page}`, { size: 14, tone: 'muted', anchor: 'end' });
      node.entries.forEach(([key, rid], j) => {
        const ry = top + j * ROW;
        p.arrow(LEAF_X + KEY_W + RID_W + 2, ry + ROW / 2, TABLE_X - 4, rowY.get(rid) + ROW / 2,
          { tone: 'faint', width: 1, roughness: 0.6 });
        p.rect(LEAF_X, ry, KEY_W, ROW, { tone: 'index', fill: j === 2 ? 'index-wash' : undefined, simple: true });
        p.rect(LEAF_X + KEY_W, ry, RID_W, ROW, { tone: 'index', simple: true });
        p.text(LEAF_X + KEY_W / 2, ry + 18, key, { size: 16, anchor: 'middle', tone: 'index' });
        p.text(LEAF_X + KEY_W + RID_W / 2, ry + 18, rid, { size: 14, anchor: 'middle', tone: 'muted' });
      });
    });
  });
}
