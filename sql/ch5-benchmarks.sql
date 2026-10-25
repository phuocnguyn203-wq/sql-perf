-- Chương 5: Clustering Data. Chạy sau schema.sql + seed.sql (employees 100.000 row).
-- Chạy đúng các query của sách trên PostgreSQL, lưu plan EXPLAIN (ANALYZE, BUFFERS) vào data/ch5/.
\pset tuples_only on
\pset format unaligned
\set explain 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)'

-- Thời gian trung vị của 21 lần chạy (ms), như ch2-benchmarks.sql.
CREATE OR REPLACE FUNCTION pg_temp.median_ms(sql text) RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE j json; t numeric[] := '{}';
BEGIN
  FOR i IN 1..21 LOOP
    EXECUTE 'EXPLAIN (ANALYZE, TIMING OFF, FORMAT JSON) ' || sql INTO j;
    t := t || (j->0->>'Execution Time')::numeric;
  END LOOP;
  RETURN (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x) FROM unnest(t) x);
END $$;
-- Chạy một câu lệnh, trả về 'ok' hoặc thông báo lỗi của PostgreSQL.
CREATE OR REPLACE FUNCTION pg_temp.try(sql text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE sql; RETURN 'ok'; EXCEPTION WHEN others THEN RETURN SQLERRM; END $$;
CREATE TEMP TABLE times (k text, ms numeric);
-- Một process như plan trong sách.
SET max_parallel_workers_per_gather = 0;

-- ========== Index Filter Predicates Used Intentionally ==========
-- Primary key với subsidiary_id đứng đầu, như sau chương 2.
DROP INDEX IF EXISTS emp_last_name, emp_name, emp_up_name, emp_up_name_ops, empsubupnam, empsubname;
ALTER TABLE employees DROP CONSTRAINT employees_pkey;
ALTER TABLE employees ADD CONSTRAINT employees_pkey PRIMARY KEY (subsidiary_id, employee_id);
VACUUM ANALYZE employees;
\set q_filter 'SELECT first_name, last_name, subsidiary_id, phone_number FROM employees WHERE subsidiary_id = 7 AND UPPER(last_name) LIKE ''%INA%'''
\o data/ch5/filter-pk.json
:explain :q_filter;
\o
INSERT INTO times VALUES ('filter_pk', pg_temp.median_ms(:'q_filter'));

-- Index của sách: thêm UPPER(last_name) làm index filter predicate.
CREATE INDEX empsubupnam ON employees (subsidiary_id, UPPER(last_name));
ANALYZE employees;
-- (a) PostgreSQL tự chọn: nó không dùng index mới.
\o data/ch5/filter-ext.json
:explain :q_filter;
\o
-- (b) Ép dùng empsubupnam (bỏ tạm primary key, tắt seq scan và bitmap trong một transaction rồi rollback)
-- để thấy điều kiện LIKE được kiểm tra ở đâu.
BEGIN;
ALTER TABLE employees DROP CONSTRAINT employees_pkey;
SET LOCAL enable_seqscan = off;
SET LOCAL enable_bitmapscan = off;
\o data/ch5/filter-forced.json
:explain :q_filter;
\o
SELECT pg_temp.median_ms(:'q_filter') AS forced_ms \gset
ROLLBACK;
INSERT INTO times VALUES ('filter_forced', :forced_ms);
DROP INDEX empsubupnam;

-- Ví dụ INCLUDE của sách (SQL Server); PostgreSQL có INCLUDE từ bản 11. Index chứa mọi column của query.
CREATE INDEX empsubname ON employees (subsidiary_id, last_name) INCLUDE (phone_number, first_name);
VACUUM ANALYZE employees;
\o data/ch5/filter-include.json
:explain :q_filter;
\o
INSERT INTO times VALUES ('filter_include', pg_temp.median_ms(:'q_filter'));
DROP INDEX empsubname;

-- Row sequencing: sắp lại row của table theo thứ tự index. Làm trên một bản sao giữ nguyên thứ tự row,
-- để table employees của các chương khác không đổi.
DROP TABLE IF EXISTS employees_copy;
CREATE TABLE employees_copy AS SELECT * FROM employees;
ALTER TABLE employees_copy ADD CONSTRAINT employees_copy_pkey PRIMARY KEY (subsidiary_id, employee_id);
VACUUM ANALYZE employees_copy;
\set q_copy 'SELECT first_name, last_name, subsidiary_id, phone_number FROM employees_copy WHERE subsidiary_id = 7 AND UPPER(last_name) LIKE ''%INA%'''
CREATE TEMP TABLE corr (k text, v numeric);
INSERT INTO corr SELECT 'emp_sub_before', correlation FROM pg_stats WHERE tablename = 'employees_copy' AND attname = 'subsidiary_id';
\o data/ch5/cluster-before.json
:explain :q_copy;
\o
INSERT INTO times VALUES ('cluster_before', pg_temp.median_ms(:'q_copy'));
CLUSTER employees_copy USING employees_copy_pkey;
VACUUM ANALYZE employees_copy;
INSERT INTO corr SELECT 'emp_sub_after', correlation FROM pg_stats WHERE tablename = 'employees_copy' AND attname = 'subsidiary_id';
\o data/ch5/cluster-after.json
:explain :q_copy;
\o
INSERT INTO times VALUES ('cluster_after', pg_temp.median_ms(:'q_copy'));
DROP TABLE employees_copy;

-- ========== Index-Only Scan ==========
-- Bảng sales như chương 4, nhưng row được thêm theo thứ tự thời gian, như một table bán hàng thật:
-- lần bán mới luôn nằm ở cuối table. 1.000.000 lần bán trong 2015–2024.
SELECT setseed(0.42);
DROP TABLE IF EXISTS sales;
CREATE TABLE sales (
  sale_id       integer       PRIMARY KEY,
  employee_id   integer       NOT NULL,
  subsidiary_id integer       NOT NULL,
  sale_date     date          NOT NULL,
  eur_value     numeric(17,2) NOT NULL
);
CREATE TEMP TABLE emp_n AS SELECT row_number() OVER (ORDER BY employee_id, subsidiary_id) AS n, employee_id, subsidiary_id FROM employees;
INSERT INTO sales
SELECT row_number() OVER (ORDER BY s.d, s.g), e.employee_id, e.subsidiary_id, s.d, s.v
  FROM (SELECT g, 1 + floor(random() * 100000)::int AS n,
               DATE '2015-01-01' + floor(random() * 3653)::int AS d,
               round((random() * 1000)::numeric, 2) AS v
          FROM generate_series(1, 1000000) g) s
  JOIN emp_n e ON e.n = s.n
 ORDER BY s.d, s.g;
VACUUM ANALYZE sales;
INSERT INTO corr SELECT 'sales_' || attname, correlation FROM pg_stats WHERE tablename = 'sales' AND attname IN ('sale_date', 'subsidiary_id');

\set q_sum 'SELECT SUM(eur_value) FROM sales WHERE subsidiary_id = 20'
-- So sánh: index chỉ có subsidiary_id, phải vào table để lấy eur_value.
CREATE INDEX sales_sub ON sales (subsidiary_id);
ANALYZE sales;
\o data/ch5/ios-noios.json
:explain :q_sum;
\o
INSERT INTO times VALUES ('ios_noios', pg_temp.median_ms(:'q_sum'));
DROP INDEX sales_sub;

-- Index của sách: thêm eur_value để query không cần vào table.
CREATE INDEX sales_sub_eur ON sales (subsidiary_id, eur_value);
VACUUM ANALYZE sales;
\o data/ch5/ios-sum.json
:explain :q_sum;
\o
INSERT INTO times VALUES ('ios_sum', pg_temp.median_ms(:'q_sum'));

-- Thêm điều kiện sale_date: column không có trong sales_sub_eur. Index sales_date còn lại từ chương 4.
CREATE INDEX sales_date ON sales (sale_date);
ANALYZE sales;
\set q_date 'SELECT SUM(eur_value) FROM sales WHERE subsidiary_id = 20 AND sale_date > DATE ''2024-06-30'''
\o data/ch5/ios-date.json
:explain :q_date;
\o
INSERT INTO times VALUES ('ios_date', pg_temp.median_ms(:'q_date'));

-- ========== Giới hạn kích thước index ==========
CREATE TEMP TABLE long_keys (t text);
CREATE INDEX long_keys_t ON long_keys (t);

\o data/ch5/times.json
SELECT json_object_agg(k, round(ms, 3)) FROM times;
\o
\o data/ch5/counts.json
SELECT json_build_object(
  'sub7',         (SELECT count(*) FROM employees WHERE subsidiary_id = 7),
  'ina',          (SELECT count(*) FROM employees WHERE subsidiary_id = 7 AND UPPER(last_name) LIKE '%INA%'),
  'emp_blocks',   pg_relation_size('employees') / current_setting('block_size')::int,
  'sales',        (SELECT count(*) FROM sales),
  'sales_sub20',  (SELECT count(*) FROM sales WHERE subsidiary_id = 20),
  'sales_date20', (SELECT count(*) FROM sales WHERE subsidiary_id = 20 AND sale_date > DATE '2024-06-30'),
  'sales_date',   (SELECT count(*) FROM sales WHERE sale_date > DATE '2024-06-30'),
  'sales_blocks', pg_relation_size('sales') / current_setting('block_size')::int,
  'corr',         (SELECT json_object_agg(k, round(v, 3)) FROM corr),
  'long_key',     pg_temp.try('INSERT INTO long_keys SELECT string_agg(md5(g::text), '''') FROM generate_series(1, 100) g'));
\o

-- Trả lại trạng thái đầu cho các script khác.
DROP INDEX sales_sub_eur;
ALTER TABLE employees DROP CONSTRAINT employees_pkey;
ALTER TABLE employees ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id, subsidiary_id);
ANALYZE employees;
