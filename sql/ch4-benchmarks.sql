-- Chương 4: The Join Operation. Chạy sau schema.sql + seed.sql (employees 100.000 row).
-- Chạy đúng các query join của sách trên PostgreSQL, lưu plan EXPLAIN (ANALYZE, BUFFERS) vào data/ch4/.
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
CREATE TEMP TABLE times (k text, ms numeric);
-- Một process như plan trong sách; parallel query sẽ chia row cho nhiều worker và mỗi worker dựng bảng băm riêng.
SET max_parallel_workers_per_gather = 0;

-- Trạng thái đầu: employees chỉ có primary key (employee_id, subsidiary_id).
DROP INDEX IF EXISTS emp_last_name, emp_name, emp_up_name, emp_up_name_ops, emp_dob, emp_test, emp_test2, emp_up_name_dob;

-- Bảng sales theo sách: mỗi lần bán thuộc về một nhân viên. 1.000.000 lần bán trong 10 năm 2015–2024,
-- nên sáu tháng gần nhất có khoảng 50.000 lần bán, cỡ như sách (49.244). Mỗi lần chọn ngẫu nhiên một nhân viên. (Chương 2 có bảng sales riêng, khác column.)
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
SELECT g, e.employee_id, e.subsidiary_id, s.d, s.v
  FROM (SELECT g, 1 + floor(random() * 100000)::int AS n,
               DATE '2015-01-01' + floor(random() * 3653)::int AS d,
               round((random() * 1000)::numeric, 2) AS v
          FROM generate_series(1, 1000000) g) s
  JOIN emp_n e ON e.n = s.n;
VACUUM ANALYZE sales;
ANALYZE employees;

-- ========== Nested Loops ==========
-- Index của sách: function-based index cho điều kiện tìm, concatenated index cho join predicate.
-- text_pattern_ops: với collation của database này, LIKE chỉ dùng được index có operator class này (chương 2).
CREATE INDEX emp_up_name ON employees (UPPER(last_name) text_pattern_ops);
CREATE INDEX sales_emp ON sales (subsidiary_id, employee_id);
ANALYZE employees;
\set q_nl 'SELECT * FROM employees e LEFT JOIN sales s ON e.subsidiary_id = s.subsidiary_id AND e.employee_id = s.employee_id WHERE UPPER(e.last_name) LIKE ''WIN%'''
\o data/ch4/nl.json
:explain :q_nl;
\o
INSERT INTO times VALUES ('nl', pg_temp.median_ms(:'q_nl'));

-- Một trong N+1 query của ORM: sales của một nhân viên (Markus Winand, 123/30).
\o data/ch4/nplus1-one.json
:explain SELECT * FROM sales WHERE subsidiary_id = 30 AND employee_id = 123;
\o

-- ========== Hash Join ==========
-- "Bây giờ" cố định là 31/12/2024, cuối dữ liệu. Sáu tháng gần nhất.
\set q_hash 'SELECT * FROM sales s JOIN employees e ON s.subsidiary_id = e.subsidiary_id AND s.employee_id = e.employee_id WHERE s.sale_date > DATE ''2024-12-31'' - INTERVAL ''6'' MONTH'
\set q_cols 'SELECT s.sale_date, s.eur_value, e.last_name, e.first_name FROM sales s JOIN employees e ON s.subsidiary_id = e.subsidiary_id AND s.employee_id = e.employee_id WHERE s.sale_date > DATE ''2024-12-31'' - INTERVAL ''6'' MONTH'
\o data/ch4/hash-full.json
:explain :q_hash;
\o
INSERT INTO times VALUES ('hash_full', pg_temp.median_ms(:'q_hash'));

-- Index cho independent predicate trên sale_date.
CREATE INDEX sales_date ON sales (sale_date);
ANALYZE sales;
\o data/ch4/hash-date.json
:explain :q_hash;
\o
INSERT INTO times VALUES ('hash_date', pg_temp.median_ms(:'q_hash'));

-- Chọn ít column hơn: bảng băm nhỏ hơn.
\o data/ch4/hash-cols.json
:explain :q_cols;
\o
INSERT INTO times VALUES ('hash_cols', pg_temp.median_ms(:'q_cols'));

-- ========== Sort Merge ==========
-- Sách không có query riêng. Tắt hash join (thay cho hint) để thấy cùng query chạy bằng Merge Join.
SET enable_hashjoin = off;
\o data/ch4/merge.json
:explain :q_cols;
\o
INSERT INTO times VALUES ('merge', pg_temp.median_ms(:'q_cols'));
RESET enable_hashjoin;

\o data/ch4/times.json
SELECT json_object_agg(k, round(ms, 3)) FROM times;
\o
\o data/ch4/counts.json
SELECT json_build_object(
  'employees',   (SELECT count(*) FROM employees),
  'sales',       (SELECT count(*) FROM sales),
  'win',         (SELECT count(*) FROM employees WHERE UPPER(last_name) LIKE 'WIN%'),
  'win_sales',   (SELECT count(*) FROM sales s JOIN employees e USING (subsidiary_id, employee_id) WHERE UPPER(e.last_name) LIKE 'WIN%'),
  'six_months',  (SELECT count(*) FROM sales WHERE sale_date > DATE '2024-12-31' - INTERVAL '6' MONTH),
  'work_mem',    current_setting('work_mem'),
  'hash_mem_multiplier', current_setting('hash_mem_multiplier')::numeric,
  'emp_mb',      round(pg_total_relation_size('employees') / 1048576.0, 1),
  'sales_mb',    round(pg_relation_size('sales') / 1048576.0, 1));
\o

-- Trả lại trạng thái đầu cho các script khác.
DROP INDEX emp_up_name;
ANALYZE employees;
