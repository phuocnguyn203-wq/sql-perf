-- Chương 2: mệnh đề WHERE. Chạy sau schema.sql + seed.sql (+ benchmarks.sql).
-- Mỗi mục chạy đúng query của sách trên PostgreSQL và lưu plan EXPLAIN (ANALYZE, BUFFERS) vào data/ch2/.
\pset tuples_only on
\pset format unaligned
\set explain 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)'

-- Chạy một câu lệnh, trả về 'ok' hoặc thông báo lỗi của PostgreSQL (để ghi lại các lỗi sách nhắc tới).
CREATE OR REPLACE FUNCTION pg_temp.try(sql text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE sql; RETURN 'ok'; EXCEPTION WHEN others THEN RETURN SQLERRM; END $$;

-- Thời gian trung vị của 21 lần chạy (ms). Một lần EXPLAIN ANALYZE dao động quá nhiều để so tốc độ.
-- TIMING OFF: không đo từng node, để phần đo không làm chậm plan đọc nhiều row hơn.
CREATE OR REPLACE FUNCTION pg_temp.median_ms(sql text) RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE j json; t numeric[] := '{}';
BEGIN
  FOR i IN 1..21 LOOP
    EXECUTE 'EXPLAIN (ANALYZE, TIMING OFF, FORMAT JSON) ' || sql INTO j;
    t := t || (j->0->>'Execution Time')::numeric;
  END LOOP;
  RETURN (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x) FROM unnest(t) x);
END $$;
CREATE TEMP TABLE slow_times (k text, ms numeric);

-- Trạng thái đầu: chỉ có primary key (employee_id, subsidiary_id) như sau vụ sáp nhập.
DROP INDEX IF EXISTS emp_last_name, emp_name, emp_up_name, emp_up_name_ops, emp_dob, emp_test, emp_test2, emp_up_name_dob;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE employees ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id, subsidiary_id);
ANALYZE employees;

-- ========== The Equality Operator ==========

-- Primary Keys: trước sáp nhập, table chỉ có công ty gốc và khóa là employee_id.
DROP TABLE IF EXISTS employees_before;
CREATE TABLE employees_before AS SELECT * FROM employees WHERE subsidiary_id = 30;
ALTER TABLE employees_before ADD PRIMARY KEY (employee_id);
ANALYZE employees_before;
\o data/ch2/pk-lookup.json
:explain SELECT first_name, last_name FROM employees_before WHERE employee_id = 123;
\o

-- Concatenated Indexes: khóa hai column.
\o data/ch2/concat-full.json
:explain SELECT first_name, last_name FROM employees WHERE employee_id = 123 AND subsidiary_id = 30;
\o data/ch2/concat-sub.json
:explain SELECT first_name, last_name FROM employees WHERE subsidiary_id = 20;
\o
-- Đảo thứ tự column của primary key.
ALTER TABLE employees DROP CONSTRAINT employees_pkey;
ALTER TABLE employees ADD CONSTRAINT employees_pkey PRIMARY KEY (subsidiary_id, employee_id);
ANALYZE employees;
\o data/ch2/concat-rev-sub.json
:explain SELECT first_name, last_name FROM employees WHERE subsidiary_id = 20;
\o data/ch2/concat-rev-full.json
:explain SELECT first_name, last_name FROM employees WHERE employee_id = 123 AND subsidiary_id = 30;
\o

-- Slow Indexes, Part II: query của ứng dụng danh bạ nội bộ.
-- (1) Không có statistics cho subsidiary_id (sách: "ví dụ vì chúng bị xóa"): planner dùng ước tính mặc định.
DELETE FROM pg_statistic
 WHERE starelid = 'employees'::regclass
   AND staattnum = (SELECT attnum FROM pg_attribute WHERE attrelid = 'employees'::regclass AND attname = 'subsidiary_id');
\o data/ch2/slow-nostats.json
:explain SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30;
\o
INSERT INTO slow_times VALUES ('nostats', pg_temp.median_ms($q$SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30$q$));
-- (2) Statistics đúng.
ANALYZE employees;
\o data/ch2/slow-stats.json
:explain SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30;
\o
INSERT INTO slow_times VALUES ('bitmap', pg_temp.median_ms($q$SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30$q$));
-- PostgreSQL dùng bitmap (đọc mỗi block một lần). Tắt bitmap để thấy đúng cách sách mô tả:
-- INDEX RANGE SCAN rồi lấy từng row riêng lẻ theo ROWID.
SET enable_bitmapscan = off;
SET enable_seqscan = off;
\o data/ch2/slow-indexscan.json
:explain SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30;
\o
INSERT INTO slow_times VALUES ('indexscan', pg_temp.median_ms($q$SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30$q$));
-- Tương đương hint NO_INDEX trong sách: không cho dùng index.
RESET enable_seqscan;
SET enable_indexscan = off;
\o data/ch2/slow-seq.json
:explain SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30;
\o
INSERT INTO slow_times VALUES ('seq', pg_temp.median_ms($q$SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30$q$));
RESET enable_bitmapscan;
RESET enable_indexscan;
-- (3) Index riêng cho last_name.
CREATE INDEX emp_name ON employees (last_name);
ANALYZE employees;
\o data/ch2/slow-name.json
:explain SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30;
\o
INSERT INTO slow_times VALUES ('name', pg_temp.median_ms($q$SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE last_name = 'WINAND' AND subsidiary_id = 30$q$));

\o data/ch2/slow-times.json
SELECT json_object_agg(k, round(ms, 3)) FROM slow_times;
\o

-- ========== Functions ==========

\o data/ch2/fn-upper-bad.json
:explain SELECT first_name, last_name, phone_number FROM employees WHERE UPPER(last_name) = UPPER('winand');
\o
-- Function-based index. Chưa ANALYZE: PostgreSQL chưa có statistics cho expression mới.
CREATE INDEX emp_up_name ON employees (UPPER(last_name));
\o data/ch2/fn-upper-nostats.json
:explain SELECT first_name, last_name, phone_number FROM employees WHERE UPPER(last_name) = UPPER('winand');
\o
ANALYZE employees;
\o data/ch2/fn-upper-good.json
:explain SELECT first_name, last_name, phone_number FROM employees WHERE UPPER(last_name) = UPPER('winand');
\o

-- User-Defined Functions: get_age dùng ngày hiện tại nên không deterministic.
CREATE OR REPLACE FUNCTION get_age(date_of_birth date) RETURNS int LANGUAGE sql
AS $$ SELECT extract(year FROM age(current_date, date_of_birth))::int $$;

-- Over-Indexing: LOWER không dùng được index trên UPPER.
\o data/ch2/fn-lower.json
:explain SELECT first_name, last_name, phone_number FROM employees WHERE LOWER(last_name) = LOWER('winand');
\o

-- ========== Parameterized Queries ==========
-- Chỉ còn primary key (subsidiary_id, employee_id). Subsidiary 20 nhỏ (1.000 người), 30 lớn (10.000 người).
DROP INDEX emp_name, emp_up_name;
ANALYZE employees;
\o data/ch2/param-20.json
:explain SELECT first_name, last_name FROM employees WHERE subsidiary_id = 20;
\o data/ch2/param-30.json
:explain SELECT first_name, last_name FROM employees WHERE subsidiary_id = 30;
\o
-- Cùng query với bind parameter, plan dựng một lần cho mọi giá trị (generic plan).
PREPARE by_sub(int) AS SELECT first_name, last_name FROM employees WHERE subsidiary_id = $1;
SET plan_cache_mode = force_generic_plan;
\o data/ch2/param-generic-20.json
:explain EXECUTE by_sub(20);
\o data/ch2/param-generic-30.json
:explain EXECUTE by_sub(30);
\o
RESET plan_cache_mode;
DEALLOCATE by_sub;

-- ========== Searching for Ranges ==========

-- Greater, Less and BETWEEN: subsidiary 27, sinh từ 1/1 tới 9/1/1971.
CREATE INDEX emp_test ON employees (date_of_birth, subsidiary_id);
ANALYZE employees;
\o data/ch2/range-test.json
:explain SELECT first_name, last_name, date_of_birth FROM employees
 WHERE date_of_birth >= DATE '1971-01-01' AND date_of_birth <= DATE '1971-01-09' AND subsidiary_id = 27;
\o
DROP INDEX emp_test;
CREATE INDEX emp_test2 ON employees (subsidiary_id, date_of_birth);
ANALYZE employees;
\o data/ch2/range-test2.json
:explain SELECT first_name, last_name, date_of_birth FROM employees
 WHERE date_of_birth >= DATE '1971-01-01' AND date_of_birth <= DATE '1971-01-09' AND subsidiary_id = 27;
\o
DROP INDEX emp_test2;

-- Indexing LIKE Filters. Index UPPER(last_name) thường, rồi với operator class text_pattern_ops.
CREATE INDEX emp_up_name ON employees (UPPER(last_name));
ANALYZE employees;
\o data/ch2/like-plain.json
:explain SELECT first_name, last_name, date_of_birth FROM employees WHERE UPPER(last_name) LIKE 'WIN%D';
\o
CREATE INDEX emp_up_name_ops ON employees (UPPER(last_name) text_pattern_ops);
ANALYZE employees;
\o data/ch2/like-wi.json
:explain SELECT first_name, last_name, date_of_birth FROM employees WHERE UPPER(last_name) LIKE 'WI%ND';
\o data/ch2/like-win.json
:explain SELECT first_name, last_name, date_of_birth FROM employees WHERE UPPER(last_name) LIKE 'WIN%D';
\o data/ch2/like-wina.json
:explain SELECT first_name, last_name, date_of_birth FROM employees WHERE UPPER(last_name) LIKE 'WINA%';
\o data/ch2/like-lead.json
:explain SELECT first_name, last_name, date_of_birth FROM employees WHERE UPPER(last_name) LIKE '%NAND';
\o
-- Bind parameter cho LIKE: sách nói PostgreSQL khi đó không dùng index.
PREPARE by_name(text) AS SELECT first_name, last_name, date_of_birth FROM employees WHERE UPPER(last_name) LIKE $1;
SET plan_cache_mode = force_generic_plan;
\o data/ch2/like-bind.json
:explain EXECUTE by_name('WINA%');
\o
RESET plan_cache_mode;
DEALLOCATE by_name;
DROP INDEX emp_up_name_ops;

-- Index Merge: hai điều kiện khoảng độc lập.
CREATE INDEX emp_dob ON employees (date_of_birth);
ANALYZE employees;
\o data/ch2/merge-two.json
:explain SELECT first_name, last_name, date_of_birth FROM employees
 WHERE UPPER(last_name) < 'B' AND date_of_birth < DATE '1953-01-01';
\o
-- Không cho Index Scan thường: PostgreSQL phải ghép hai index bằng bitmap trong bộ nhớ (BitmapAnd).
SET enable_indexscan = off;
\o data/ch2/merge-bitmap.json
:explain SELECT first_name, last_name, date_of_birth FROM employees
 WHERE UPPER(last_name) < 'B' AND date_of_birth < DATE '1953-01-01';
\o
RESET enable_indexscan;
DROP INDEX emp_up_name, emp_dob;
CREATE INDEX emp_up_name_dob ON employees (UPPER(last_name), date_of_birth);
ANALYZE employees;
\o data/ch2/merge-one.json
:explain SELECT first_name, last_name, date_of_birth FROM employees
 WHERE UPPER(last_name) < 'B' AND date_of_birth < DATE '1953-01-01';
\o
DROP INDEX emp_up_name_dob;

-- ========== Partial Indexes ==========
-- Hàng đợi tin nhắn: 200.000 tin, 1.000 người nhận, 1% chưa xử lý.
SELECT setseed(0.42);
DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  message_id integer PRIMARY KEY,
  receiver   integer NOT NULL,
  processed  char(1) NOT NULL,
  message    text    NOT NULL
);
INSERT INTO messages
SELECT g, 1 + floor(random() * 1000)::int, CASE WHEN g > 198000 THEN 'N' ELSE 'Y' END, 'message ' || g
  FROM generate_series(1, 200000) g;
CREATE INDEX messages_todo ON messages (receiver, processed);
VACUUM ANALYZE messages;
\o data/ch2/partial-full.json
:explain SELECT message FROM messages WHERE processed = 'N' AND receiver = 42;
\o
CREATE TEMP TABLE sizes AS SELECT pg_relation_size('messages_todo') AS full_size;
DROP INDEX messages_todo;
CREATE INDEX messages_todo ON messages (receiver) WHERE processed = 'N';
ANALYZE messages;
\o data/ch2/partial-todo.json
:explain SELECT message FROM messages WHERE processed = 'N' AND receiver = 42;
\o data/ch2/partial-sizes.json
SELECT json_build_object(
  'rows',         (SELECT count(*) FROM messages),
  'todo',         (SELECT count(*) FROM messages WHERE processed = 'N'),
  'full_bytes',   (SELECT full_size FROM sizes),
  'partial_bytes', pg_relation_size('messages_todo'),
  'block_size',   current_setting('block_size')::int);
\o

-- ========== Obfuscated Conditions ==========

-- Bảng sales: 100.000 lần bán trong 2023–2024. sale_date có cả giờ; sale_day + sale_time là cùng thời điểm, tách hai column.
SELECT setseed(0.42);
DROP TABLE IF EXISTS sales;
CREATE TABLE sales (
  sale_id   integer   PRIMARY KEY,
  sale_date timestamp NOT NULL,
  sale_day  date      NOT NULL,
  sale_time time      NOT NULL,
  amount    numeric(8,2) NOT NULL
);
INSERT INTO sales
SELECT g, t, t::date, t::time, round((random() * 500)::numeric, 2)
  FROM (SELECT g, timestamp '2023-01-01' + random() * interval '730 days' AS t FROM generate_series(1, 100000) g) s;
CREATE INDEX sales_date ON sales (sale_date);
CREATE INDEX sales_day_time ON sales (sale_day, sale_time);
VACUUM ANALYZE sales;

-- Date Types. "Hôm qua" cố định là 14/6/2024 để kết quả không đổi theo ngày chạy.
\o data/ch2/date-trunc.json
:explain SELECT * FROM sales WHERE date_trunc('day', sale_date) = date_trunc('day', TIMESTAMP '2024-06-14 09:00');
\o data/ch2/date-tochar.json
:explain SELECT * FROM sales WHERE TO_CHAR(sale_date, 'YYYY-MM-DD') = '2024-06-14';
\o data/ch2/date-range.json
:explain SELECT * FROM sales WHERE sale_date >= DATE '2024-06-14' AND sale_date < DATE '2024-06-14' + INTERVAL '1' DAY;
\o
-- quarter_begin / quarter_end đúng như code PostgreSQL trong sách (plpgsql, không khai báo gì thêm => VOLATILE).
CREATE OR REPLACE FUNCTION quarter_begin(dt timestamp with time zone)
RETURNS timestamp with time zone AS $$
BEGIN
    RETURN date_trunc('quarter', dt);
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION quarter_end(dt timestamp with time zone)
RETURNS timestamp with time zone AS $$
BEGIN
   RETURN   date_trunc('quarter', dt)
          + interval '3 month'
          - interval '1 microsecond';
END;
$$ LANGUAGE plpgsql;
\o data/ch2/date-quarter-volatile.json
:explain SELECT * FROM sales WHERE sale_date BETWEEN quarter_begin('2024-05-20') AND quarter_end('2024-05-20');
\o
-- Khai báo STABLE: kết quả không đổi trong một câu lệnh, nên planner tính trước rồi dùng index.
ALTER FUNCTION quarter_begin(timestamp with time zone) STABLE;
ALTER FUNCTION quarter_end(timestamp with time zone) STABLE;
\o data/ch2/date-quarter.json
:explain SELECT * FROM sales WHERE sale_date BETWEEN quarter_begin('2024-05-20') AND quarter_end('2024-05-20');
\o

-- Numeric Strings và Math: bảng numbers (sách gọi là table_name).
SELECT setseed(0.42);
DROP TABLE IF EXISTS numbers;
CREATE TABLE numbers (
  numeric_string text    NOT NULL,
  numeric_number integer NOT NULL,
  a integer NOT NULL,
  b integer NOT NULL
);
INSERT INTO numbers SELECT g::text, g, g % 1000, floor(random() * 3000)::int FROM generate_series(1, 100000) g;
CREATE INDEX num_string ON numbers (numeric_string);
CREATE INDEX num_number ON numbers (numeric_number);
VACUUM ANALYZE numbers;
\o data/ch2/num-string.json
:explain SELECT * FROM numbers WHERE numeric_string = '42';
\o data/ch2/num-string-cast.json
:explain SELECT * FROM numbers WHERE numeric_string::integer = 42;
\o data/ch2/num-number-string.json
:explain SELECT * FROM numbers WHERE numeric_number = '42';
\o data/ch2/num-number-cast.json
:explain SELECT * FROM numbers WHERE numeric_number::text = '42';
\o

-- Combining Columns: mọi lần bán trong 24 giờ gần nhất. "Bây giờ" cố định là 31/12/2024 00:00, cuối dữ liệu.
\o data/ch2/combine-bad.json
:explain SELECT * FROM sales WHERE sale_day + sale_time > TIMESTAMP '2024-12-31 00:00' - INTERVAL '1' DAY;
\o data/ch2/combine-redundant.json
:explain SELECT * FROM sales WHERE sale_day + sale_time > TIMESTAMP '2024-12-31 00:00' - INTERVAL '1' DAY
                             AND sale_day >= DATE '2024-12-30';
\o data/ch2/combine-row.json
:explain SELECT * FROM sales WHERE (sale_day, sale_time) > (DATE '2024-12-30', TIME '00:00');
\o

-- Smart Logic: một câu cho mọi tổ hợp filter. Index: primary key (subsidiary_id, employee_id) và UPPER(last_name).
CREATE INDEX emp_up_name ON employees (UPPER(last_name));
ANALYZE employees;
PREPARE smart(int, int, text) AS
  SELECT first_name, last_name, subsidiary_id, employee_id FROM employees
   WHERE ( subsidiary_id    = $1 OR $1 IS NULL )
     AND ( employee_id      = $2 OR $2 IS NULL )
     AND ( UPPER(last_name) = $3 OR $3 IS NULL );
PREPARE dynamic(text) AS
  SELECT first_name, last_name, subsidiary_id, employee_id FROM employees WHERE UPPER(last_name) = $1;
SET plan_cache_mode = force_generic_plan;
\o data/ch2/smart-generic.json
:explain EXECUTE smart(NULL, NULL, 'WINAND');
\o data/ch2/smart-dynamic.json
:explain EXECUTE dynamic('WINAND');
\o
RESET plan_cache_mode;
DEALLOCATE ALL;
\o data/ch2/smart-literal.json
:explain SELECT first_name, last_name, subsidiary_id, employee_id FROM employees
 WHERE ( subsidiary_id    = NULL     OR NULL IS NULL )
   AND ( employee_id      = NULL     OR NULL IS NULL )
   AND ( UPPER(last_name) = 'WINAND' OR 'WINAND' IS NULL );
\o
DROP INDEX emp_up_name;

-- Math.
\o data/ch2/math-minus.json
:explain SELECT numeric_number FROM numbers WHERE numeric_number - 1000 > 99000;
\o data/ch2/math-ab.json
:explain SELECT a, b FROM numbers WHERE 3*a + 5 = b;
\o
CREATE INDEX math ON numbers ((3*a - b));
ANALYZE numbers;
\o data/ch2/math-ab-index.json
:explain SELECT a, b FROM numbers WHERE 3*a - b = -5;
\o

-- Các lỗi sách nhắc tới, đúng như PostgreSQL báo.
\o data/ch2/errors.json
SELECT json_build_object(
  'get_age_index', pg_temp.try('CREATE INDEX emp_age ON employees (get_age(date_of_birth))'),
  'numeric_string', pg_temp.try('SELECT * FROM numbers WHERE numeric_string = 42'),
  'date_like',     pg_temp.try('SELECT * FROM sales WHERE sale_date LIKE now()'));

-- Các con số dùng trong bài: số entry mỗi query phải scan, kích thước subsidiary.
\o data/ch2/counts.json
SELECT json_build_object(
  'rows',        (SELECT count(*) FROM employees),
  'sub20',       (SELECT count(*) FROM employees WHERE subsidiary_id = 20),
  'sub30',       (SELECT count(*) FROM employees WHERE subsidiary_id = 30),
  'subsidiaries', (SELECT count(DISTINCT subsidiary_id) FROM employees),
  'range_dob',   (SELECT count(*) FROM employees WHERE date_of_birth BETWEEN DATE '1971-01-01' AND DATE '1971-01-09'),
  'range_sub27', (SELECT count(*) FROM employees WHERE subsidiary_id = 27),
  'range_both',  (SELECT count(*) FROM employees WHERE subsidiary_id = 27 AND date_of_birth BETWEEN DATE '1971-01-01' AND DATE '1971-01-09'),
  'like_wi',     (SELECT count(*) FROM employees WHERE UPPER(last_name) LIKE 'WI%'),
  'like_win',    (SELECT count(*) FROM employees WHERE UPPER(last_name) LIKE 'WIN%'),
  'like_wina',   (SELECT count(*) FROM employees WHERE UPPER(last_name) LIKE 'WINA%'),
  'merge_name',  (SELECT count(*) FROM employees WHERE UPPER(last_name) < 'B'),
  'merge_dob',   (SELECT count(*) FROM employees WHERE date_of_birth < DATE '1953-01-01'),
  'merge_both',  (SELECT count(*) FROM employees WHERE UPPER(last_name) < 'B' AND date_of_birth < DATE '1953-01-01'),
  'table_blocks', pg_relation_size('employees') / current_setting('block_size')::int,
  'collation',   (SELECT datcollate FROM pg_database WHERE datname = current_database()));
\o

-- Trả lại trạng thái đầu cho các script sau (blocks.sql) và cho lần chạy lại.
DROP FUNCTION get_age(date);
DROP FUNCTION quarter_begin(timestamp with time zone), quarter_end(timestamp with time zone);
DROP TABLE employees_before;
ALTER TABLE employees DROP CONSTRAINT employees_pkey;
ALTER TABLE employees ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id, subsidiary_id);
ANALYZE employees;
