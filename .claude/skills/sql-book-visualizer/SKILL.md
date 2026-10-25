---
name: sql-book-visualizer
description: Use when building or editing a lesson page/visualization for the SQL Performance Explained learning site in this repo (indexes, B-tree, selectivity, joins, execution plans).
---

# sql-book-visualizer

Plan gốc: `sql-performance-explained-visualization-plan.md`. Đọc mục 5, 7, 12, 13 trước khi làm.

## Quy trình

1. **Hiểu nội dung trước khi vẽ:** ghi khái niệm, mục tiêu học tập, điều kiện áp dụng, ngoại lệ.
2. **Đề xuất trước khi code:** cấu trúc giải thích + loại minh họa (văn bản / sơ đồ tĩnh / SVG tương tác / biểu đồ). Không mặc định cần animation.
3. **Design system:** dùng token trong `styles/tokens.css`. Chưa có thì dừng lại, chốt art direction với người dùng trước.
4. **Công cụ tối thiểu:** HTML/CSS/JS + SVG. Chỉ thêm D3, Observable Plot, GSAP, Anime.js khi code thuần thực sự khó quản lý — ghi lý do.
5. **SQL thật:** schema/dữ liệu/truy vấn nằm trong `sql/`. Kết quả `EXPLAIN` lấy từ `data/*.json` do psql sinh ra. Không bịa cost, actual time, row count.
6. **Mô hình vs thực tế:** gắn nhãn rõ "mô hình khái niệm" / "dữ liệu minh họa" / "đo thực tế". Không khẳng định index luôn nhanh hơn seq scan.
7. **Kiểm tra:** responsive (≥320px), bàn phím, nội dung đọc được khi tắt JS/animation, `prefers-reduced-motion`.
8. **Chống AI slop:** bỏ gradient, card bo tròn lặp lại, icon ngẫu nhiên, hiệu ứng cuộn không phục vụ giải thích.
9. **Báo cáo:** file đã đổi, cách chạy, cách kiểm thử, phần nào chỉ là mô phỏng.

## Chạy SQL

```sh
PSQL="/c/Program Files/PostgreSQL/18/bin/psql"
"$PSQL" -U postgres -h localhost -c "CREATE DATABASE sqlperf"   # một lần
"$PSQL" -U postgres -h localhost -d sqlperf -f sql/schema.sql -f sql/seed.sql -f sql/benchmarks.sql -f sql/ch2-benchmarks.sql -f sql/blocks.sql
"$PSQL" -U postgres -h localhost -d sqlperf -f sql/ch3-benchmarks.sql   # chương 3: table scale_data 5 triệu row
sh sql/ch3-load.sh                                                    # chương 3: pgbench theo số query đồng thời
"$PSQL" -U postgres -h localhost -d sqlperf -f sql/ch4-benchmarks.sql   # chương 4: table sales 1 triệu row, nested loops/hash/merge
```

Xem site: `npm start` → http://localhost:8000 (cần server vì trang `fetch` dữ liệu trong `data/`). Test logic: `npm test`.

Chuyển động: Framer Motion bản DOM (`node_modules/framer-motion/dist/dom.js`, nạp bằng `<script>` → `window.Motion`), gói trong `scripts/motion.js` cùng motion token dùng chung (`t.enter`, `t.pop`, `t.press`, `ease`). Mọi chuyển động mới đi qua module này; không có Motion hoặc bật reduced motion thì nội dung phải hiện ngay ở trạng thái cuối. Section cần hiện dần thì thêm class `reveal` (con có `data-stagger` thì hiện lần lượt).

Thuật ngữ database giữ nguyên tiếng Anh (table, column, row, index, query, scan, filter, tree, leaf node, page, block, primary key, function, expression…), không Việt hoá. Cách viết bài: dạng blog lối ngrok cho người chưa đọc sách. Trang bài học có `<body class="read">`: một cột chữ Literata ở giữa. Mỗi section mở bằng `<div class="reveal">` (h2 + `.sub` 1–2 câu), sau đó mỗi ý là một `<div class="step reveal">`: h3, vài đoạn văn định nghĩa thuật ngữ ngay lần đầu dùng, câu SQL đầy đủ trong `pre.sql`, rồi hình minh họa ngay sau câu nhắc tới nó. Thuật ngữ tô cùng màu với hình: `<span class="t-index">` (index, xanh), `<span class="t-match">` (row khớp, cam). Mỗi nguyên nhân nên có một thí nghiệm thật tách riêng; plan PostgreSQL đầy đủ để trong `<details class="plan-more">`. Con số trong chữ đặt trong `<span data-fact="…">giá trị dự phòng</span>` và được điền từ `data/` khi trang tải; không gõ tay số đo.

Hình vẽ tay: mọi hình vẽ bằng `scripts/sketch.js` (rough.js, `node_modules/roughjs/bundled/rough.js` nạp bằng `<script>`). `figure(svg, p => …)` đăng ký một hình và trả về hàm vẽ lại; vẽ lại cả hình mỗi khi trạng thái đổi. Màu lấy từ biến `--sk-*` (tone: ink, muted, faint, index, match; fill thêm `index-wash`, `match-wash`), nên đổi nền sáng/tối tự vẽ lại. Hình có bảng điều khiển bên cạnh (`.fig-body.split`) tự nới ra ngoài cột chữ. Thành phần có sẵn: `planTable` (plan PostgreSQL trình bày như bảng execution plan trong sách) và `bars` (cột vẽ tay so số block) trong `plans.js`; các hình của sách trong `book-figures.js`.

Nền: `styles/tokens.css` có nền sáng (mực xanh navy) và nền tối (xanh đêm); nút `.theme-toggle` trong thanh điều hướng (`scripts/theme.js`), mỗi trang có dòng script đặt `data-theme` sớm trong `<head>`.

Kiểm tra giao diện trong trình duyệt thật: `npm run check:ui` (Playwright + Edge; cần `npm start` đang chạy). Nó bắt lỗi JS, cuộn ngang và nội dung còn bị ẩn sau khi cuộn hết trang, ở 1440/1024/768/375px, có và không có reduced motion, nền sáng và nền tối. Chạy qua PowerShell: sandbox của Bash làm Edge thoát ngay mà không báo lỗi.

Bám sát sách: mỗi chương đi đúng thứ tự mục và lập luận của sách (h2/h3 là tên mục tiếng Anh của sách kèm ý chính tiếng Việt), dùng đúng ví dụ, query và hình của sách. Không thêm thí nghiệm ngoài sách. Plan Oracle trong sách được thay bằng plan PostgreSQL của chính query đó; chỗ PostgreSQL làm khác Oracle thì ghi rõ. Tip/Important/Caution và các khung bên lề của sách thành `<aside class="box">`. Dữ liệu (`sql/seed.sql`) dựng theo kịch bản của sách (sáp nhập: subsidiary 30 lớn, WINAND là (123, 30), tên A–Z ngẫu nhiên như Hình 2.4).

Mẫu tham chiếu: `lessons/ch2-the-where-clause.html`.

Chạy SQL từ thư mục gốc repo (đường dẫn `\o data/...` là tương đối). Mật khẩu qua `PGPASSWORD` hoặc `%APPDATA%\postgresql\pgpass.conf`.
