-- Seq scan vs index scan cho cùng một truy vấn. Chạy sau schema.sql + seed.sql.
-- Kết quả là kế hoạch thật từ máy đang chạy; ghi kèm version() khi lưu.
\pset tuples_only on
\pset format unaligned

\o data/environment.txt
SELECT version();
\o

DROP INDEX IF EXISTS emp_last_name;
\o data/explain-seq-scan.json
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT first_name, last_name FROM employees WHERE last_name = 'WINAND';
\o

CREATE INDEX emp_last_name ON employees (last_name);
ANALYZE employees;
\o data/explain-index-scan.json
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT first_name, last_name FROM employees WHERE last_name = 'WINAND';
\o

-- Hình dạng thật của B-tree vừa tạo (tree_level = số tầng phía trên leaf).
CREATE EXTENSION IF NOT EXISTS pgstattuple;
\o data/index-stats.json
SELECT row_to_json(s) FROM pgstatindex('emp_last_name') s;
\o
