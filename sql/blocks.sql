-- Kích thước table và block chứa row WINAND (từ ctid), cho lưới block ở trang chủ.
\pset tuples_only on
\pset format unaligned
\o data/blocks.json
SELECT json_build_object(
  'block_size',   current_setting('block_size')::int,
  'table_blocks', pg_relation_size('employees') / current_setting('block_size')::int,
  'rows',         (SELECT count(*) FROM employees),
  'heap', json_build_object(
    'winand', (SELECT json_agg(DISTINCT (ctid::text::point)[0]::int) FROM employees WHERE last_name = 'WINAND')
  )
);
\o
