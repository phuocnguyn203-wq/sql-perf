-- Chương 3: Performance and Scalability. Tái hiện thí nghiệm scale_data của sách trên PostgreSQL.
-- section càng lớn càng nhiều row: section s có s × 1.000 row (sections 1–100, tổng 5.050.000 row).
-- id1 đánh số trong section, id2 ngẫu nhiên 1–100. Query của sách: count(*) theo section và id2.
\pset tuples_only on
\pset format unaligned

SELECT setseed(0.42);
DROP TABLE IF EXISTS scale_data;
CREATE TABLE scale_data (
  section integer NOT NULL,
  id1     integer NOT NULL,
  id2     integer NOT NULL
);
INSERT INTO scale_data
SELECT s, g, 1 + floor(random() * 100)::int
  FROM generate_series(1, 100) s, LATERAL generate_series(1, s * 1000) g;

-- Đo một section: chạy query 5 lần, lấy thời gian trung vị và số block của lần cuối.
CREATE OR REPLACE FUNCTION pg_temp.measure(sec int) RETURNS json LANGUAGE plpgsql AS $$
DECLARE j json; t numeric[] := '{}'; b int;
BEGIN
  FOR i IN 1..5 LOOP
    EXECUTE format('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT count(*) FROM scale_data WHERE section = %s AND id2 = 42', sec) INTO j;
    t := t || (j->0->>'Execution Time')::numeric;
    b := (j->0->'Plan'->>'Shared Hit Blocks')::int + (j->0->'Plan'->>'Shared Read Blocks')::int;
  END LOOP;
  RETURN json_build_object('section', sec, 'ms', (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x) FROM unnest(t) x), 'blocks', b);
END $$;

CREATE TEMP TABLE results (idx text, data json);

-- ---------- scale_slow: section đứng đầu, id2 đứng thứ ba ----------
CREATE INDEX scale_slow ON scale_data (section, id1, id2);
VACUUM ANALYZE scale_data;
\o data/ch3/plan-slow.json
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT count(*) FROM scale_data WHERE section = 100 AND id2 = 42;
\o
INSERT INTO results SELECT 'slow', json_agg(pg_temp.measure(s) ORDER BY s) FROM generate_series(1, 100) s;
DROP INDEX scale_slow;

-- ---------- scale_fast: section và id2 ở hai vị trí đầu ----------
CREATE INDEX scale_fast ON scale_data (section, id2, id1);
VACUUM ANALYZE scale_data;
\o data/ch3/plan-fast.json
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT count(*) FROM scale_data WHERE section = 100 AND id2 = 42;
\o
INSERT INTO results SELECT 'fast', json_agg(pg_temp.measure(s) ORDER BY s) FROM generate_series(1, 100) s;
DROP INDEX scale_fast;

\o data/ch3/volume.json
SELECT json_build_object(
  'slow', (SELECT data FROM results WHERE idx = 'slow'),
  'fast', (SELECT data FROM results WHERE idx = 'fast'),
  'rows', (SELECT count(*) FROM scale_data),
  'rows_section_1', (SELECT count(*) FROM scale_data WHERE section = 1),
  'rows_section_100', (SELECT count(*) FROM scale_data WHERE section = 100),
  'matches_section_100', (SELECT count(*) FROM scale_data WHERE section = 100 AND id2 = 42));
\o
-- scale_data được giữ lại cho sql/ch3-load.sh (đo theo tải đồng thời).
