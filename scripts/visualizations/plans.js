// Plan PostgreSQL thật, trình bày như bảng execution plan trong sách (Operation, Name, Rows, Cost,
// rồi phần predicate), kèm biểu đồ cột vẽ tay để so số block giữa các plan.
import { animate, inView, stagger, moving, ease } from '../motion.js';
import { figure } from '../sketch.js';

export const fmt = n => n.toLocaleString('vi-VN');
export const blocks = p => p['Shared Hit Blocks'] + p['Shared Read Blocks'];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const flat = (p, d = 0) => [{ p, d }, ...(p.Plans ?? []).flatMap(c => flat(c, d + 1))];

// plan: phần tử đầu của file JSON do EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) sinh ra.
export function planTable(plan) {
  const nodes = flat(plan.Plan);
  const rows = nodes.map(({ p, d }, i) => `<tr>
      <td>${i}</td>
      <td style="--d:${d}">${esc(p['Node Type'])}</td>
      <td>${esc(p['Index Name'] ?? p['Relation Name'] ?? '')}</td>
      <td class="n">${fmt(p['Plan Rows'])}</td>
      <td class="n">${fmt(p['Actual Rows'])}</td>
      <td class="n">${fmt(Math.round(p['Total Cost']))}</td>
    </tr>`).join('');
  const preds = nodes.flatMap(({ p }, i) => [
    p['Index Cond'] && `<li><span>${i} · index cond</span><code>${esc(p['Index Cond'])}</code></li>`,
    p['Recheck Cond'] && !p['Index Cond'] && !(p.Plans ?? []).some(c => c['Index Cond'] === p['Recheck Cond']) &&
      `<li><span>${i} · recheck</span><code>${esc(p['Recheck Cond'])}</code></li>`,
    p.Filter && `<li class="filter"><span>${i} · filter</span><code>${esc(p.Filter)}</code>${
      p['Rows Removed by Filter'] ? ` <em>bỏ ${fmt(p['Rows Removed by Filter'])} row</em>` : ''}</li>`,
  ]).filter(Boolean).join('');
  return `<div class="scroll-x"><table class="plan-table">
      <thead><tr><th>Id</th><th>Operation</th><th>Name</th><th class="n">Rows ước tính</th><th class="n">Rows thật</th><th class="n">Cost</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    ${preds ? `<ul class="plan-preds">${preds}</ul>` : ''}
    <p class="plan-foot">Đọc <b>${fmt(blocks(plan.Plan))}</b> block · ${plan['Execution Time']} ms</p>`;
}

const NS = 'http://www.w3.org/2000/svg';
const narrow = () => matchMedia('(max-width: 560px)').matches;

// Biểu đồ cột ngang vẽ tay. items: [{ label, value, text, hot }]; hot = cột được nhấn (màu cam).
export function bars(el, items, note) {
  const max = Math.max(...items.map(r => r.value));
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'sk');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', items.map(r => `${r.label}: ${r.text}`).join('; '));
  el.replaceChildren(svg);
  let barsG;
  figure(svg, p => {
    const thin = narrow(), W = thin ? 400 : 680, step = thin ? 64 : 46;
    const x0 = thin ? 0 : 250, x1 = W - (thin ? 120 : 130), scale = (x1 - x0) / max;
    const h = items.length * step + (note ? 34 : 6);
    svg.setAttribute('viewBox', `0 0 ${W} ${h}`);
    barsG = document.createElementNS(NS, 'g');
    items.forEach((r, i) => {
      const y = i * step + (thin ? 26 : 8);
      p.text(0, thin ? y - 8 : y + 18, r.label, { size: 16 });
      const g = document.createElementNS(NS, 'g');
      barsG.append(g);
      p.rect(x0, y, Math.max(3, r.value * scale), 24,
        { tone: r.hot ? 'match' : 'index', fill: r.hot ? 'match' : 'index', gap: 3.5, width: r.hot ? 1.8 : 1.2, parent: g });
      p.text(x0 + Math.max(3, r.value * scale) + 10, y + 18, r.text, { size: 16, weight: 700, tone: r.hot ? 'match' : 'ink' });
    });
    svg.append(barsG);
    if (note) p.text(0, h - 8, note, { size: 14, tone: 'muted' });
  });
  if (moving()) {
    const gs = [...barsG.children];
    animate(gs, { clipPath: 'inset(0 100% 0 0)' }, { duration: 0 });
    inView(svg, () => animate(gs, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 0.9, ease: ease.out, delay: stagger(0.1) }), { amount: 0.4 });
  }
}
