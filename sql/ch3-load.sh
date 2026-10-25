#!/bin/sh
# Chương 3, Hình 3.4: thời gian phản hồi theo số query chạy đồng thời, section lớn nhất (100).
# Chạy sau ch3-benchmarks.sql (cần table scale_data). Dùng pgbench đi kèm PostgreSQL.
# Mật khẩu qua PGPASSWORD hoặc pgpass. Kết quả: data/ch3/load.json.
set -e
BIN="${PGBIN:-/c/Program Files/PostgreSQL/18/bin}"
DB="-U postgres -h localhost -d sqlperf"
SCRIPT=$(mktemp)
printf '\\set id2 random(1, 100)\nSELECT count(*) FROM scale_data WHERE section = 100 AND id2 = :id2;\n' > "$SCRIPT"

run() { # $1 = tên index, $2 = định nghĩa column
  "$BIN/psql" $DB -qAt -c "DROP INDEX IF EXISTS scale_slow, scale_fast" -c "CREATE INDEX $1 ON scale_data $2" -c "VACUUM ANALYZE scale_data" >/dev/null
  first=1
  for c in 1 5 10 15 20 25; do
    ms=$("$BIN/pgbench" $DB -n -c $c -j $c -T 8 -f "$SCRIPT" 2>/dev/null | sed -n 's/^latency average = \([0-9.]*\) ms$/\1/p')
    [ $first = 1 ] || printf ','
    printf '{"clients":%s,"ms":%s}' "$c" "$ms"
    first=0
  done
}

{
  printf '{"cpus":%s,"slow":[' "$(nproc)"; run scale_slow "(section, id1, id2)"
  printf '],"fast":['; run scale_fast "(section, id2, id1)"
  printf ']}\n'
} > data/ch3/load.json
"$BIN/psql" $DB -qAt -c "DROP INDEX IF EXISTS scale_slow, scale_fast" >/dev/null
rm -f "$SCRIPT"
cat data/ch3/load.json
