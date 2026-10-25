// Biểu đồ đường vẽ tay (nét rough.js) cho các hình đo theo một biến: dữ liệu, tải.
// series: [{ label, points: [[x, y], ...], hot }]; hot = đường được nhấn (màu cam, nét đứt như sách).
import { figure } from '../sketch.js';

const narrow = () => matchMedia('(max-width: 560px)').matches;
const fmt = n => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

// Vạch chia "đẹp": 1, 2 hoặc 5 × 10^k, khoảng 5 vạch.
function ticks(max) {
  const raw = max / 5, p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map(m => m * p).find(s => s >= raw);
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

export function lineChart(svg, { series, xLabel, yLabel, xTicks }) {
  const xMax = Math.max(...series.flatMap(s => s.points.map(p => p[0])));
  const yt = ticks(Math.max(...series.flatMap(s => s.points.map(p => p[1]))));
  svg.setAttribute('aria-label', series.map(s => `${s.label}: ${s.points.map(([x, y]) => `${x} → ${fmt(y)}`).join(', ')}`).join('. '));
  figure(svg, p => {
    const thin = narrow(), W = thin ? 400 : 680, H = thin ? 300 : 320;
    const L = thin ? 52 : 64, R = W - (thin ? 70 : 90), T = 36, B = H - 50;
    const X = x => L + (x / xMax) * (R - L), Y = y => B - (y / yt.at(-1)) * (B - T);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    for (const t of yt) {
      p.line(L, Y(t), R, Y(t), { tone: 'faint', width: 0.8, roughness: 0.3 });
      p.text(L - 8, Y(t) + 5, fmt(t), { size: thin ? 15 : 14, tone: 'muted', anchor: 'end' });
    }
    p.line(L, B, R, B, { width: 1.3 });
    for (const t of xTicks) p.text(X(t), B + 20, t, { size: thin ? 15 : 14, tone: 'muted', anchor: 'middle' });
    p.text((L + R) / 2, H - 4, xLabel, { size: thin ? 15 : 14, tone: 'muted', anchor: 'middle' });
    p.text(L - (thin ? 48 : 60), T - 20, yLabel, { size: thin ? 15 : 14, tone: 'muted' });
    for (const s of series) {
      const pts = s.points.map(([x, y]) => [X(x), Y(y)]);
      // Nối điểm bằng đoạn thẳng: đường cong làm mượt sẽ vẽ ra giá trị không có thật giữa hai lần đo.
      for (let i = 1; i < pts.length; i++) {
        p.line(...pts[i - 1], ...pts[i], { tone: s.hot ? 'match' : 'index', width: s.hot ? 2.4 : 2.2, roughness: 0.4, simple: true, dash: s.hot ? [8, 6] : undefined });
      }
      const [lx, ly] = pts.at(-1);
      p.text(lx + 8, ly + 5, s.label, { size: thin ? 15 : 16, weight: 700, tone: s.hot ? 'match' : 'index' });
    }
  });
}
