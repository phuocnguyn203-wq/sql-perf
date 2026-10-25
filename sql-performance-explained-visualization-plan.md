# Kế hoạch xây dựng tài liệu trực quan cho *SQL Performance Explained*

## 1. Mục tiêu

Biến kiến thức trong sách thành một website học tập trực quan, có phong cách thiết kế riêng, giúp người học hiểu cách PostgreSQL xử lý truy vấn — không chỉ đọc văn bản và code block.

Nguyên tắc:
- **Đúng kỹ thuật trước, đẹp sau.** Mô phỏng phải phản ánh đúng khái niệm SQL và hành vi của PostgreSQL.
- **Ưu tiên visualization tạo bằng code.** Không phụ thuộc vào ảnh AI cho sơ đồ cần chính xác hoặc tương tác.
- **Tránh giao diện tài liệu đại trà.** Thiết kế một hệ thống thị giác thống nhất thay vì ghép các template phổ biến.
- **Tách nội dung, dữ liệu, visualization và giao diện** để dễ kiểm thử và cập nhật.

## 2. Công nghệ chính

### Nền tảng website
- **HTML** — cấu trúc bài học và nội dung ngữ nghĩa.
- **CSS** — typography, layout, màu sắc, responsive, animation và design system.
- **JavaScript** — tương tác, điều khiển mô phỏng và cập nhật visualization.
- **SVG** — vẽ sơ đồ sắc nét, có thể tương tác: B-tree, luồng JOIN, cây execution plan.
- **PostgreSQL** — chạy truy vấn thực tế và lấy kết quả `EXPLAIN` / `EXPLAIN ANALYZE`.

### Thư viện visualization (chọn theo nhu cầu)
- **D3.js** — khi cần kiểm soát chi tiết sơ đồ, node, cạnh, trạng thái và animation.
  - Repo: https://github.com/d3/d3
- **Observable Plot** — biểu đồ dữ liệu như số row được đọc, selectivity hoặc thời gian thực thi.
  - Repo: https://github.com/observablehq/plot
- Không cần dùng cả hai ở mọi nơi. Dùng SVG/DOM thuần cho minh họa đơn giản; chọn thư viện khi độ phức tạp thực sự cần thiết.

### Visualization execution plan có sẵn để tham khảo
- **Dalibo explain.dalibo.com** — tham khảo cách trình bày cây PostgreSQL execution plan.
  - Website: https://explain.dalibo.com/
- Dùng kết quả PostgreSQL thật làm dữ liệu; không tự bịa cost, thời gian hoặc số row rồi trình bày như số liệu thực.

## 3. Repo tham khảo về phong cách và cách tổ chức

Các repo dưới đây là nguồn tham khảo, không phải template bắt buộc phải sao chép. Kiểm tra tình trạng dự án và giấy phép trước khi tái sử dụng code hoặc asset.

- **Brutalist Framework** — tham khảo typography, grid, border và phong cách có cá tính.
  - https://github.com/pinecreativelabs/Brutalist-Framework
- **magick.css** — tham khảo cách tạo diện mạo riêng bằng CSS, ít phụ thuộc framework lớn.
  - https://github.com/wintermute-cell/magick.css
- **DOMStack** — tham khảo cách tổ chức website nhiều trang từ HTML, Markdown, CSS và JavaScript.
  - https://github.com/bcomnes/domstack
- **Microsoft Atlas Design** — tham khảo cách tổ chức component, token và tài liệu kỹ thuật.
  - https://microsoft.github.io/atlas-design/get-started.html
- **Front End Design Basics** — tham khảo cách trình bày nguyên lý thiết kế qua ví dụ trực quan.
  - https://frontenddesignbasics.vercel.app/

**Lưu ý:** chỉ dùng những repo này để nghiên cứu nguyên tắc phù hợp. Không mặc định rằng mọi repo đều hoàn toàn thủ công, luôn được duy trì, hoặc cho phép sao chép mọi nội dung.

## 4. Asset: cần gì và tạo bằng cách nào?

### Nên tạo bằng code
- **B-tree / index:** SVG hoặc DOM, với node, cạnh, khóa và trạng thái tìm kiếm.
- **Sequential scan vs. index scan:** bảng row minh họa, đánh dấu những row/page được truy cập theo từng bước.
- **JOIN:** sơ đồ hai bảng và các bước ghép dữ liệu.
- **Execution plan:** cây node tương ứng với dữ liệu `EXPLAIN ANALYZE`.
- **Biểu đồ:** dùng dữ liệu benchmark có ghi rõ môi trường và cách đo.
- **Animation:** JavaScript/CSS để cho người học tiến, lùi hoặc chuyển từng bước.

### Có thể dùng asset có sẵn
- Icon từ thư viện có giấy phép phù hợp.
- Font từ nguồn hợp pháp, kiểm tra giấy phép nhúng và phân phối.
- Texture hoặc hình trang trí chỉ khi thực sự giúp ích cho nội dung.
- Ảnh AI chỉ dành cho hình trang trí/ẩn dụ; không dùng ảnh AI làm nguồn chân lý cho sơ đồ kỹ thuật.

## 5. Các visualization nên xây dựng

1. **Index cơ bản:** so sánh sequential scan với index scan.
2. **B-tree:** minh họa cấu trúc và đường tìm kiếm; ghi rõ đây là mô hình khái niệm nếu không mô phỏng đúng cấu trúc nội bộ PostgreSQL.
3. **Selectivity:** cho thay đổi điều kiện lọc và xem số row ước lượng/được trả về.
4. **Execution plan:** trình bày node, estimated rows, actual rows, cost và actual time khi có dữ liệu thật.
5. **JOIN:** minh họa cách các chiến lược join hoạt động bằng dữ liệu nhỏ, có thể kiểm tra kết quả.
6. **Đo hiệu năng:** so sánh truy vấn với điều kiện giống nhau, ghi rõ dữ liệu, index, phiên bản PostgreSQL và môi trường đo.

Không phải mọi phần trong sách đều cần animation. Dùng hình tĩnh cho ý tưởng đơn giản; chỉ thêm tương tác khi nó giúp người đọc hiểu quan hệ nhân quả.

## 6. Quy trình thực hiện

1. **Chia sách thành các khái niệm nhỏ.** Với mỗi khái niệm, ghi lại luận điểm, truy vấn ví dụ và điều người học cần hiểu.
2. **Xác định kiểu minh họa.** Chọn văn bản, sơ đồ tĩnh, biểu đồ hoặc mô phỏng tương tác — tránh animation không có giá trị học tập.
3. **Thiết kế design system trước.** Chốt palette, typography, kích thước chữ, grid, khoảng cách, border, kiểu code block, icon và chuyển động.
4. **Tạo một trang mẫu hoàn chỉnh.** Nên bắt đầu bằng sequential scan vs. index scan vì dễ liên kết giữa truy vấn, sơ đồ và kết quả.
5. **Chạy truy vấn trong PostgreSQL.** Lưu SQL, dữ liệu mẫu và kết quả `EXPLAIN (ANALYZE, BUFFERS)` khi phù hợp.
6. **Viết visualization bằng SVG/JS hoặc thư viện đã chọn.**
7. **Kiểm chứng nội dung.** Phân biệt estimated với actual; không khẳng định index luôn nhanh hơn; không so sánh benchmark nếu điều kiện không tương đương.
8. **Kiểm tra responsive, accessibility và hiệu năng.**
9. **Mở rộng từng chương** bằng cách tái sử dụng component và design system.

## 7. Quy tắc để tránh “AI slop”

- Không yêu cầu AI “làm website đẹp” một cách chung chung.
- Cung cấp design system, ảnh tham chiếu, cấu trúc trang và ví dụ về kiểu trình bày mong muốn.
- Tránh gradient trang trí, card bo tròn lặp lại, icon ngẫu nhiên và animation không phục vụ giải thích.
- Mỗi trang cần một mục tiêu học tập rõ ràng và một bố cục phù hợp với nội dung.
- Tách dữ liệu mẫu khỏi code vẽ để kiểm thử được.
- Dùng nội dung SQL và kết quả thực tế; đánh dấu rõ mọi dữ liệu minh họa giả lập.
- Kiểm tra giấy phép của repo, font, icon và asset trước khi tái sử dụng.

## 8. Cấu trúc thư mục gợi ý

```text
sql-performance-guide/
├── index.html
├── lessons/
│   ├── indexes.html
│   ├── selectivity.html
│   ├── joins.html
│   └── execution-plans.html
├── styles/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   └── components.css
├── scripts/
│   ├── app.js
│   └── visualizations/
│       ├── btree.js
│       ├── scan-comparison.js
│       ├── joins.js
│       └── execution-plan.js
├── data/
│   └── examples.js
└── sql/
    ├── schema.sql
    ├── seed.sql
    └── benchmarks.sql
```

Đây chỉ là cấu trúc khởi đầu. Nếu dự án phát triển lớn, có thể bổ sung bundler, module system, test và pipeline build sau; không cần thêm framework ngay từ đầu.

## 9. Phạm vi MVP

Xây dựng trước **một bài học hoàn chỉnh**:
- Giải thích ngắn về sequential scan và index scan.
- Một bảng dữ liệu ví dụ và SQL có thể chạy lại.
- Visualization cho phép chuyển giữa hai phương pháp.
- Kết quả `EXPLAIN ANALYZE` thật kèm giải thích các trường quan trọng.
- Một phong cách thiết kế nhất quán, có typography và màu sắc riêng.
- Giao diện dùng được trên desktop và màn hình nhỏ.

Khi MVP rõ ràng, đúng kỹ thuật và dễ hiểu, hãy dùng cùng hệ thống để mở rộng sang các chương khác.

## 10. Checklist công cụ

- [ ] HTML, CSS, JavaScript
- [ ] PostgreSQL và môi trường chạy truy vấn
- [ ] SVG/DOM cho sơ đồ đơn giản
- [ ] D3.js khi cần visualization tùy biến phức tạp
- [ ] Observable Plot khi cần biểu đồ dữ liệu
- [ ] Dalibo Explain để tham khảo execution plan
- [ ] Repo thiết kế tham khảo: GooseDesigns, Codrops, Brutalist Framework hoặc magick.css
- [ ] Animation: CSS/SVG trước; GSAP hoặc Anime.js khi cần timeline phức tạp
- [ ] Chọn art direction và design tokens trước khi xây nhiều trang
- [ ] Kiểm tra `prefers-reduced-motion` và bảo đảm nội dung vẫn rõ khi tắt animation
- [ ] Design system riêng
- [ ] SQL và dữ liệu mẫu có thể tái lập
- [ ] Kiểm tra tính đúng đắn, accessibility, responsive và giấy phép


## 11. Design inspiration và animation

Mục tiêu không chỉ là làm visualization đúng, mà còn tạo một website có nhận diện riêng. Hãy nghiên cứu các nguồn dưới đây để học nguyên tắc và kỹ thuật; không sao chép nguyên xi giao diện.

### Design và art direction
- **GooseDesigns** — tham khảo nhiều hướng art direction như brutalist, editorial, blueprint và terminal-dark.
  - https://github.com/NewGooseFactory/GooseDesigns
- **Codrops** — tutorial và demo về thiết kế web sáng tạo, typography, hover, chuyển cảnh và tương tác.
  - https://tympanus.net/codrops/
- **Brutalist Framework** — tham khảo grid, border, typography và phong cách có chủ đích.
  - https://github.com/pinecreativelabs/Brutalist-Framework
- **magick.css** — tham khảo cách tạo giao diện cá tính bằng CSS.
  - https://github.com/wintermute-cell/magick.css

### Animation
- **GSAP** — timeline animation, scroll-triggered effects, SVG và chuyển cảnh.
  - https://github.com/greensock/GSAP
  - Dùng khi cần điều khiển chính xác chuỗi sự kiện, ví dụ lần lượt làm sáng các node khi truy vấn đi qua B-tree.
- **Anime.js** — animation cho CSS, SVG, DOM và các thuộc tính JavaScript.
  - https://github.com/juliangarnier/anime
  - Dùng cho chuyển động nhỏ, đổi trạng thái node và di chuyển các phần tử trong sơ đồ.
- **Motion Canvas** — tạo animation giải thích bằng code, phù hợp hơn với video hoặc cảnh giải thích được dựng trước.
  - https://github.com/motion-canvas/motion-canvas
- **Three.js** — đồ họa 3D/WebGL; chỉ dùng nếu 3D thực sự giúp giải thích hoặc tạo visual chủ đạo.
  - https://github.com/mrdoob/three.js

### Cách chọn
- HTML/CSS transitions: hiệu ứng đơn giản, hover, focus và trạng thái giao diện.
- SVG + JavaScript: sơ đồ nhỏ và animation theo bước.
- GSAP: timeline phức tạp hoặc đồng bộ nhiều đối tượng.
- D3.js: sơ đồ dữ liệu cần bố trí, cập nhật hoặc tương tác tùy biến.
- Observable Plot: biểu đồ số liệu.
- Motion Canvas: video giải thích dựng trước.
- Three.js: chỉ cho trường hợp có lý do rõ ràng để dùng 3D.

Không cần cài tất cả các thư viện. Bắt đầu với CSS + SVG + JavaScript; chỉ thêm thư viện khi một yêu cầu cụ thể khiến code thuần trở nên khó quản lý.

## 12. Nguyên tắc thẩm mỹ và motion

- Chốt **art direction** trước khi viết component: ví dụ technical editorial, scientific notebook, blueprint hoặc terminal-inspired.
- Định nghĩa design tokens: palette, typography, grid, spacing, border, code block, trạng thái tương tác và motion.
- Mỗi animation phải giải thích một điều: thứ tự xử lý, đường đi tìm kiếm, thay đổi trạng thái hoặc quan hệ giữa dữ liệu.
- Ưu tiên chuyển động có kiểm soát, thời lượng ngắn vừa đủ, easing nhất quán và khả năng tắt/giảm chuyển động (`prefers-reduced-motion`).
- Tránh hiệu ứng scroll chỉ để gây ấn tượng, parallax quá mức, gradient trang trí và card giống nhau lặp lại.
- Luôn bảo đảm nội dung vẫn hiểu được khi animation bị tắt hoặc người dùng không tương tác.
- Dùng screenshot/demo tham khảo để chỉ rõ bố cục, mật độ, typography và chuyển động mong muốn khi giao việc cho AI; đừng chỉ yêu cầu chung chung là “làm đẹp”.

### Workflow thẩm mỹ đề xuất
1. Chọn 2–3 nguồn tham khảo và ghi rõ điều muốn học từ mỗi nguồn.
2. Tạo một moodboard ngắn: palette, typography, layout, ví dụ code và motion.
3. Xây một trang mẫu hoàn chỉnh trước khi mở rộng.
4. Kiểm tra trang ở trạng thái tĩnh, khi tương tác, khi cuộn và trên màn hình nhỏ.
5. Chỉ sau khi style đã nhất quán mới nhân rộng sang các chương khác.



## 13. AI skills cho workflow

Skills nên đóng vai trò là **quy trình và tiêu chuẩn làm việc**, không phải danh sách prompt dài. Chỉ thêm skill khi nó giải quyết một nhiệm vụ lặp lại.

### Skill có sẵn để tham khảo
- **Frontend design** — tìm một skill phù hợp với agent đang dùng để định hướng art direction, typography, layout và tránh giao diện template đại trà. Kiểm tra nguồn, phạm vi và hướng dẫn cài đặt trước khi sử dụng; tên skill có thể khác nhau giữa các hệ sinh thái.
- **Figma implement motion** — chỉ cần nếu thiết kế/motion được dựng trong Figma rồi mới chuyển thành HTML/CSS/JS.
- Các skill thiết kế khác là tùy chọn. Không cần thêm skill chỉ để dùng GSAP, D3.js hoặc CSS; đó là thư viện kỹ thuật.

### Skill dự án đề xuất: `sql-book-visualizer`

Tạo một skill riêng trong hệ thống agent bạn dùng (ví dụ theo cấu trúc `SKILL.md` nếu hệ thống hỗ trợ). Skill này nên yêu cầu AI:

1. **Hiểu nội dung trước khi vẽ:** xác định khái niệm, mục tiêu học tập, điều kiện áp dụng và các ngoại lệ.
2. **Chọn hình thức phù hợp:** văn bản, sơ đồ tĩnh, SVG/DOM tương tác, biểu đồ hoặc animation — không mặc định mọi nội dung đều cần chuyển động.
3. **Tuân thủ design system:** dùng đúng palette, typography, grid, spacing, border, code style và motion đã thống nhất.
4. **Dùng công cụ tối thiểu:** HTML/CSS/JS và SVG trước; chỉ thêm GSAP, Anime.js, D3.js hoặc Observable Plot khi có lý do cụ thể.
5. **Kiểm chứng SQL:** ưu tiên ví dụ chạy được trên PostgreSQL; lưu truy vấn, schema và dữ liệu mẫu; không bịa `EXPLAIN ANALYZE`, cost, actual time hoặc row counts rồi trình bày như dữ liệu thật.
6. **Phân biệt mô hình và thực tế:** đánh dấu rõ sơ đồ khái niệm, dữ liệu minh họa và kết quả đo thực tế; không khẳng định index luôn nhanh hơn sequential scan.
7. **Kiểm tra giao diện:** responsive, keyboard accessibility, trạng thái tĩnh khi JavaScript/animation tắt và hỗ trợ `prefers-reduced-motion`.
8. **Tự review chống AI slop:** loại bỏ gradient, card, icon, hiệu ứng cuộn và trang trí không phục vụ nội dung; mỗi trang phải có bố cục được quyết định bởi mục tiêu giải thích.
9. **Báo cáo kết quả:** liệt kê file đã thay đổi, cách chạy, cách kiểm thử và phần nào vẫn chỉ là mô phỏng.

### Quy trình dùng skill
1. Đưa nội dung/chủ đề của sách và mục tiêu học tập.
2. Yêu cầu skill đề xuất cấu trúc giải thích và loại visualization trước khi viết code.
3. Duyệt art direction và bản phác thảo của một trang.
4. Triển khai, chạy ví dụ SQL và kiểm thử tương tác.
5. Review độ chính xác kỹ thuật và tính nhất quán thiết kế trước khi nhân rộng.

**Không cần cài nhiều skill cùng lúc.** Bắt đầu với một skill thiết kế giao diện đáng tin cậy (nếu agent có sẵn) và skill dự án `sql-book-visualizer`; bổ sung skill khác chỉ khi workflow thực tế cần nó.
