// Kiểm tra giao diện bằng trình duyệt thật (Playwright): không lỗi JavaScript, và mọi nội dung
// được giấu chờ chuyển động đều hiện ra sau khi cuộn hết trang, ở cả chế độ giảm chuyển động, nền sáng và nền tối.
// Cần server đang chạy: `npm start`, rồi `npm run check:ui`. Ảnh chụp cả trang lưu vào .taste-skill/ui/.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:8000/';
const OUT = '.taste-skill/ui';
const PAGES = ['index.html', 'lessons/ch1-anatomy-of-an-index.html', 'lessons/ch2-the-where-clause.html', 'lessons/ch3-performance-and-scalability.html', 'lessons/ch4-the-join-operation.html'];
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' });
let failed = 0;

for (const reducedMotion of ['no-preference', 'reduce']) {
  // Nền tối chỉ kiểm thêm ở khổ desktop cho đỡ tốn thời gian.
  for (const [vpName, viewport, colorScheme] of Object.entries(VIEWPORTS).flatMap(([n, v]) =>
    n === 'desktop' ? [[n, v, 'light'], [n, v, 'dark']] : [[n, v, 'light']])) {
    const ctx = await browser.newContext({ viewport, reducedMotion, colorScheme });
    for (const path of PAGES) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => m.type() === 'error' && !/favicon/.test(m.location().url) && errors.push(m.text()));
      await page.goto(BASE + path, { waitUntil: 'networkidle' });

      // Cuộn từng đoạn như người đọc thật để mọi inView được kích hoạt, rồi chờ chuyển động chạy xong.
      // Đọc lại chiều cao mỗi bước: trang dài thêm khi plan và hình được chèn vào.
      for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += viewport.height * 0.6) {
        await page.mouse.wheel(0, viewport.height * 0.6);
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(2000);

      // Phần tử còn mờ hoặc còn bị cắt (bỏ qua input ẩn trong nút chọn, nút bị vô hiệu, bên trong SVG,
      // và mục lục dọc: nó cố ý ẩn khi chân trang vào màn hình).
      const hidden = await page.evaluate(() => [...document.querySelectorAll('body *')]
        .filter(el => el.getClientRects().length && !el.closest('svg') && !el.matches('input, :disabled, .sr-only') && !el.closest('.side-toc.off'))
        .filter(el => {
          const s = getComputedStyle(el);
          return parseFloat(s.opacity) < 0.99 || /100%/.test(s.clipPath);
        })
        .map(el => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`));

      // Trang không được cuộn ngang (sơ đồ rộng nằm trong khung .scroll-x riêng).
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 1) errors.push(`cuộn ngang ${overflow}px`);

      const name = `${path.split('/').pop().replace('.html', '')}-${vpName}-${colorScheme}-${reducedMotion}`;
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      const ok = !errors.length && !hidden.length;
      if (!ok) failed++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${errors.length ? `\n     lỗi: ${errors.join(' | ')}` : ''}` +
        `${hidden.length ? `\n     còn ẩn: ${[...new Set(hidden)].slice(0, 8).join(', ')}` : ''}`);
      await page.close();
    }
    await ctx.close();
  }
}

await browser.close();
process.exit(failed ? 1 : 0);
