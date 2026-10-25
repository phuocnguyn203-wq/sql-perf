// Vẽ hình nét tay kiểu Excalidraw bằng rough.js (thư viện nét vẽ tay mà Excalidraw dùng; nạp trước bằng <script>, window.rough).
// Vẽ kiểu "chế độ tức thời": mỗi lần trạng thái đổi thì vẽ lại cả hình. Nét được đánh seed theo thứ tự vẽ,
// nên vẽ lại không làm nét "rung". Màu đọc từ biến CSS --sk-* lúc vẽ, nên đổi nền sáng/tối thì vẽ lại là đủ.
const NS = 'http://www.w3.org/2000/svg';
const figures = [];

const color = name => getComputedStyle(document.documentElement).getPropertyValue(`--sk-${name}`).trim();

function pen(container) {
  const svg = container.ownerSVGElement ?? container;
  const rc = globalThis.rough.svg(svg);
  let seed = 1;
  const opts = (o = {}) => ({
    seed: seed++,
    roughness: o.roughness ?? 1,
    bowing: 1,
    stroke: o.stroke === false ? 'none' : color(o.tone ?? 'ink'),
    strokeWidth: o.width ?? 1.3,
    fill: o.fill ? color(o.fill) : undefined,
    fillStyle: o.solid ? 'solid' : 'hachure',
    hachureGap: o.gap ?? 4,
    disableMultiStroke: o.simple ?? false,
    strokeLineDash: o.dash,
  });
  const add = (node, o) => {
    if (o?.cls) node.setAttribute('class', o.cls);
    (o?.parent ?? container).append(node);
    return node;
  };
  return {
    rect: (x, y, w, h, o) => add(rc.rectangle(x, y, w, h, opts(o)), o),
    line: (x1, y1, x2, y2, o) => add(rc.line(x1, y1, x2, y2, opts(o)), o),
    curve: (pts, o) => add(rc.curve(pts, opts(o)), o),
    circle: (x, y, d, o) => add(rc.circle(x, y, d, opts(o)), o),
    // Mũi tên: đường thẳng hoặc cong (bend) và hai nét đầu mũi; both: mũi ở cả hai đầu.
    arrow(x1, y1, x2, y2, o = {}) {
      const g = document.createElementNS(NS, 'g');
      const mx = (x1 + x2) / 2 + (o.bend ?? 0), my = (y1 + y2) / 2 + (o.bendY ?? 0);
      const curved = o.bend || o.bendY;
      g.append(curved ? rc.curve([[x1, y1], [mx, my], [x2, y2]], opts(o)) : rc.line(x1, y1, x2, y2, opts(o)));
      const head = (hx, hy, fx, fy) => {
        const a = Math.atan2(hy - fy, hx - fx);
        for (const s of [-1, 1]) {
          const t = a + Math.PI - s * 0.45;
          g.append(rc.line(hx, hy, hx + 8 * Math.cos(t), hy + 8 * Math.sin(t), opts({ ...o, simple: true })));
        }
      };
      head(x2, y2, curved ? mx : x1, curved ? my : y1);
      if (o.both) head(x1, y1, curved ? mx : x2, curved ? my : y2);
      return add(g, o);
    },
    text(x, y, str, o = {}) {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', x);
      t.setAttribute('y', y);
      t.setAttribute('class', `sk-text tone-${o.tone ?? 'ink'}${o.mono ? ' sk-mono' : ''}`);
      t.setAttribute('font-size', o.size ?? 15);
      if (o.anchor) t.setAttribute('text-anchor', o.anchor);
      if (o.weight) t.setAttribute('font-weight', o.weight);
      t.textContent = str;
      return add(t, o);
    },
  };
}

function render(f) {
  f.container.replaceChildren();
  f.draw(pen(f.container));
}

// Đăng ký một hình (container là <svg> hoặc một <g> bên trong): vẽ ngay, vẽ lại khi đổi nền
// hoặc khi màn hình qua mốc hẹp. Trả về hàm vẽ lại để gọi khi trạng thái của hình thay đổi.
export function figure(container, draw) {
  const f = { container, draw };
  figures.push(f);
  render(f);
  return () => render(f);
}

// Bỏ các hình đã bị gỡ khỏi trang (ví dụ khi đổi tab), vẽ lại phần còn lại.
const redrawAll = () => {
  for (let i = figures.length - 1; i >= 0; i--) if (!figures[i].container.isConnected) figures.splice(i, 1);
  figures.forEach(render);
};
document.addEventListener('themechange', redrawAll);
matchMedia('(max-width: 560px)').addEventListener('change', redrawAll);
