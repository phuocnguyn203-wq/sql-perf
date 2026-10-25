// Framer Motion, bản DOM (không cần React): node_modules/framer-motion/dist/dom.js nạp trước bằng <script>
// và gắn vào window.Motion. Không có nó, hoặc người dùng bật giảm chuyển động, thì mọi thứ hiện ngay ở trạng thái cuối.
import { themeToggle } from './theme.js';

const M = globalThis.Motion;
export const { animate, inView, scroll, stagger, press } = M ?? {};
export const reduced = matchMedia('(prefers-reduced-motion: reduce)');
export const moving = () => Boolean(M) && !reduced.matches;

// Token dùng chung: vào màn hình = spring không nảy; phản hồi nhấn = spring ngắn, nảy nhẹ;
// tiến trình đều (scan table, thanh đọc) = linear.
export const ease = { out: [0.23, 1, 0.32, 1], inOut: [0.77, 0, 0.175, 1] };
export const t = {
  enter: { type: 'spring', duration: 0.7, bounce: 0 },
  pop: { type: 'spring', duration: 0.45, bounce: 0.25 },
  press: { type: 'spring', duration: 0.25, bounce: 0.3 },
  each: 0.05,
};

const isOnScreen = el => {
  const r = el.getBoundingClientRect();
  return r.top < innerHeight && r.bottom > 0;
};

// Mỗi .reveal: các phần tử con lần lượt hiện khi section vào màn hình.
// Con có [data-stagger] thì từng phần tử bên trong nó hiện lần lượt.
export function reveal(root = document) {
  if (!moving()) return;
  for (const sec of root.querySelectorAll('.reveal')) {
    const items = [...sec.children].flatMap(c => (c.hasAttribute('data-stagger') ? [...c.children] : [c]));
    const show = () => animate(items, { opacity: [0, 1], y: [24, 0] }, { ...t.enter, delay: stagger(t.each) });
    if (isOnScreen(sec)) { show(); continue; }
    animate(items, { opacity: 0, y: 24 }, { duration: 0 });
    // Theo mép trên chứ không theo tỉ lệ: khối cao hơn màn hình nhiều lần vẫn hiện khi vừa cuộn tới.
    inView(sec, show, { margin: '0px 0px -12% 0px' });
  }
}

// Phản hồi khi nhấn: thu nhẹ rồi bật lại, chạy được cả bằng chuột, chạm và bàn phím.
export function pressable(selector) {
  if (!moving()) return;
  press(selector, el => {
    animate(el, { scale: 0.96 }, t.press);
    return () => animate(el, { scale: 1 }, t.press);
  });
}

// Chữ INDEX ở chân trang: từng khối mọc lên từ đáy khi chân trang vào màn hình.
export function footMark() {
  const blocks = document.querySelectorAll('.foot-mark span');
  if (!moving() || !blocks.length) return;
  animate(blocks, { clipPath: 'inset(100% 0 0 0)' }, { duration: 0 });
  inView('.foot-mark', () => animate(blocks, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] },
    { duration: 0.8, ease: ease.out, delay: stagger(0.07) }), { amount: 0.4 });
}

// Thanh tiến độ đọc ở đầu trang bài học, chạy theo cuộn trang.
export function readingProgress() {
  const bar = document.querySelector('.progress');
  if (!M || !bar) return;
  bar.hidden = false;
  scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
}

export function site() {
  themeToggle();
  reveal();
  pressable('button, .cta, .foot-last .top');
  footMark();
  readingProgress();
  sideToc();
}

// Mục lục dọc bên trái trang bài học (chỉ hiện ở màn hình rộng, xem .side-toc trong CSS):
// mỗi h2 của section là một mục, các h3 của nó là mục con; mục con chỉ mở khi đang đọc section đó.
export function sideToc() {
  const secs = [...document.querySelectorAll('.read section[id]')].filter(s => s.querySelector('h2'));
  if (!secs.length) return;
  const nav = document.createElement('nav');
  nav.className = 'side-toc';
  nav.setAttribute('aria-label', 'Mục lục chương');
  const heads = [];
  const ol = document.createElement('ol');
  for (const sec of secs) {
    const li = document.createElement('li');
    const sub = [...sec.querySelectorAll('.step > h3')].map((h, i) => {
      h.id ||= `${sec.id}-${i + 1}`;
      heads.push([h, li]);
      // Tên mục con chỉ lấy phần trước dấu hai chấm: "Primary Keys: tra theo khóa…" → "Primary Keys".
      return `<li><a href="#${h.id}">${h.textContent.split(':')[0]}</a></li>`;
    }).join('');
    li.innerHTML = `<a href="#${sec.id}">${sec.querySelector('h2').textContent}</a>${sub && `<ol>${sub}</ol>`}`;
    heads.push([sec, li]);
    ol.append(li);
  }
  nav.append(ol);
  document.body.append(nav);
  heads.sort(([a], [b]) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const links = [...nav.querySelectorAll('a')];
  const spy = () => {
    const cur = heads.filter(([h]) => h.getBoundingClientRect().top < innerHeight * 0.3).at(-1);
    for (const li of ol.children) li.classList.toggle('open', li === cur?.[1]);
    for (const a of links) a.toggleAttribute('aria-current', a.hash === `#${cur?.[0].id}`);
  };
  addEventListener('scroll', () => requestAnimationFrame(spy), { passive: true });
  // Hình vẽ xong làm trang cao thêm mà không có sự kiện cuộn, nên theo dõi cả kích thước trang.
  new ResizeObserver(spy).observe(document.body);
  // Chân trang chiếm cả bề ngang (chữ INDEX): ẩn mục lục khi nó vào màn hình để khỏi đè lên.
  const foot = document.querySelector('.foot');
  if (foot) new IntersectionObserver(([e]) => nav.classList.toggle('off', e.isIntersecting)).observe(foot);
}
