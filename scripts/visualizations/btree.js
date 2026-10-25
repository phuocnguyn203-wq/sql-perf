// Hình B-tree vẽ tay của sách: root, branch và leaf node; tô đường đi khi tìm một key.
import { figure } from '../sketch.js';
import { leaves, branches, root, search } from '../btree-model.js';

const ROW = 22, NODE_W = 38, KEY_W = 34, RID_W = 66, TOP = 56;
const ROOT_X = 14, BRANCH_X = 114, LEAF_X = 216;
const LEAF_STRIDE = 3 * ROW + 18;
const H = TOP + leaves.length * LEAF_STRIDE;
const W = LEAF_X + KEY_W + RID_W + 14;

const leafTop = i => TOP + i * LEAF_STRIDE;
const leafMid = i => leafTop(i) + 1.5 * ROW;
const branchMid = b => branches[b].children.reduce((s, i) => s + leafMid(i), 0) / branches[b].children.length;
const branchTop = b => branchMid(b) - branches[b].keys.length * ROW / 2;
const rootTop = () => branches.reduce((s, b, i) => s + branchMid(i), 0) / branches.length - root.keys.length * ROW / 2;

// Trạng thái hiển thị suy từ các bước tree traversal và leaf node chain.
function stateOf(steps) {
  const st = { visited: new Set(), on: new Set(), hits: new Set(), edges: new Set() };
  for (const s of steps) {
    if (s.level === 'root') {
      st.visited.add('r');
      if (s.entry >= 0) { st.on.add(`r-${s.entry}`); st.edges.add(`er${s.entry}`); }
    } else if (s.level === 'branch') {
      st.visited.add(`b${s.node}`);
      st.on.add(`b${s.node}-${s.entry}`);
      st.edges.add(`eb${s.node}-${s.entry}`);
    } else if (s.level === 'leaf') {
      st.visited.add(`l${s.node}`);
      s.hits.forEach(j => st.hits.add(`l${s.node}-${j}`));
      if (s.phase === 'chain') st.edges.add(`c${s.node - 1}`);
    }
  }
  return st;
}

function keyColumn(p, k, x, top, keys, st) {
  keys.forEach((key, j) => {
    const on = st.on.has(`${k}-${j}`);
    p.rect(x, top + j * ROW, NODE_W, ROW, {
      tone: st.visited.has(k) ? 'match' : 'index', width: on ? 2.4 : 1.3, simple: true,
      fill: on ? 'match-wash' : j === keys.length - 1 ? 'index-wash' : undefined,
    });
    p.text(x + NODE_W / 2, top + j * ROW + 16, key, { size: 15, anchor: 'middle', tone: on ? 'match' : 'index', weight: on ? 700 : 400 });
  });
}

const edgeOpts = on => ({ tone: on ? 'match' : 'faint', width: on ? 2 : 1, roughness: 0.7 });

function drawTree(p, st) {
  [['Root', ROOT_X], ['Branch', BRANCH_X], ['Leaf', LEAF_X]].forEach(([t, x]) => p.text(x, 22, t, { size: 17, tone: 'muted' }));

  const rt = rootTop();
  root.keys.forEach((_, j) => p.arrow(ROOT_X + NODE_W, rt + j * ROW + ROW / 2, BRANCH_X - 4, branchMid(j), edgeOpts(st.edges.has(`er${j}`))));
  keyColumn(p, 'r', ROOT_X, rt, root.keys, st);

  branches.forEach((b, bi) => {
    const top = branchTop(bi);
    b.children.forEach((leaf, e) => p.arrow(BRANCH_X + NODE_W, top + e * ROW + ROW / 2, LEAF_X - 4, leafMid(leaf), edgeOpts(st.edges.has(`eb${bi}-${e}`))));
    keyColumn(p, `b${bi}`, BRANCH_X, top, b.keys, st);
  });

  leaves.forEach((entries, i) => {
    const k = `l${i}`, vis = st.visited.has(k);
    entries.forEach(([key, rid], j) => {
      const y = leafTop(i) + j * ROW, hit = st.hits.has(`${k}-${j}`);
      const tone = vis ? 'match' : 'index', width = vis ? 2 : 1.3;
      p.rect(LEAF_X, y, KEY_W, ROW, { tone, width, simple: true, fill: hit ? 'match-wash' : j === 2 ? 'index-wash' : undefined });
      p.rect(LEAF_X + KEY_W, y, RID_W, ROW, { tone, width, simple: true, fill: hit ? 'match-wash' : undefined });
      p.text(LEAF_X + KEY_W / 2, y + 16, key, { size: 15, anchor: 'middle', tone: hit ? 'match' : 'index', weight: hit ? 700 : 400 });
      p.text(LEAF_X + KEY_W + RID_W / 2, y + 16, rid, { size: 14, anchor: 'middle', tone: 'muted' });
    });
    // Leaf chain: con trỏ xuống và lên giữa hai leaf liền kề.
    if (i + 1 < leaves.length) {
      const y1 = leafTop(i) + 3 * ROW, y2 = leafTop(i + 1), on = st.edges.has(`c${i}`);
      p.arrow(LEAF_X + 22, y1 + 2, LEAF_X + 22, y2 - 2, { ...edgeOpts(on), tone: on ? 'match' : 'muted' });
      p.arrow(LEAF_X + 36, y2 - 2, LEAF_X + 36, y1 + 2, { ...edgeOpts(on), tone: on ? 'match' : 'muted' });
    }
  });
}

// Hình 1.2: btreeFigure(svg). Hình 1.3: btreeFigure(svg, 57), đường tìm key như trong sách.
export function btreeFigure(svg, key) {
  const st = stateOf(key == null ? [] : search(key));
  figure(svg, p => {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    drawTree(p, st);
  });
}
