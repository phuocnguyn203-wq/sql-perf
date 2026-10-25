-- Dữ liệu giả lập theo kịch bản chương 2 của sách: một vụ sáp nhập công ty.
-- Công ty gốc là subsidiary 30 (10.000 người). Công ty mua về có 90.000 người, chia đều cho
-- 90 subsidiary khác (1–29, 31–91), mỗi nơi 1.000 người. employee_id của hai công ty trùng nhau,
-- nên khóa phải gồm cả subsidiary_id.
-- Row được ghi theo thứ tự ngẫu nhiên (như dữ liệu tích lũy lâu năm), last_name là chuỗi A–Z
-- dài 3–10 ký tự giống các tên ở Hình 2.4 của sách. setseed cố định => cùng dữ liệu mỗi lần chạy.
SELECT setseed(0.42);

INSERT INTO employees (employee_id, subsidiary_id, first_name, last_name, date_of_birth, phone_number)
SELECT e.employee_id,
       e.subsidiary_id,
       'FIRST' || e.employee_id,
       (SELECT string_agg(chr(65 + floor(random() * 26)::int), '')
          FROM generate_series(1, 3 + floor(random() * 8)::int + 0 * e.employee_id)),
       date '1950-01-01' + (random() * 20000)::int,
       '+1-555-' || lpad(e.employee_id::text, 6, '0')
FROM (
  SELECT g AS employee_id, 30 AS subsidiary_id FROM generate_series(1, 10000) g
  UNION ALL
  SELECT g, CASE WHEN (g - 1) % 90 + 1 >= 30 THEN (g - 1) % 90 + 2 ELSE (g - 1) % 90 + 1 END
    FROM generate_series(1, 90000) g
) e
ORDER BY random();

-- Nhân viên 123 của công ty gốc là tác giả sách, như ví dụ trong sách.
UPDATE employees
   SET first_name = 'MARKUS', last_name = 'WINAND', date_of_birth = '1977-01-01'
 WHERE employee_id = 123 AND subsidiary_id = 30;

ANALYZE employees;
