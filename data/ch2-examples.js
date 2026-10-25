// Dữ liệu minh họa cho chương 2 (không phải số đo). Hình 2.2–2.4 lấy đúng dữ liệu in trong sách.

// Hình 2.2 / 2.3 của sách: (date_of_birth, subsidiary_id).
const near = [
  ['1970-12-28', 4], ['1971-01-01', 3], ['1971-01-01', 6], ['1971-01-02', 1], ['1971-01-04', 1],
  ['1971-01-05', 3], ['1971-01-06', 4], ['1971-01-06', 11], ['1971-01-08', 6], ['1971-01-08', 27],
  ['1971-01-09', 10], ['1971-01-09', 17], ['1971-01-09', 17], ['1971-01-09', 30], ['1971-01-12', 3],
];
const sub27 = ['1964-11-23', '1969-06-25', '1969-09-23', '1972-09-26', '1973-10-04', '1975-12-18',
  '1976-08-16', '1976-08-23', '1978-07-30', '1984-09-14', '1988-03-09', '1991-10-08'];
export const births = [
  ...near, ...sub27.map(d => [d, 27]), ['1983-09-01', 26], ['1953-09-30', 30],
].map(([date_of_birth, subsidiary_id]) => ({ date_of_birth, subsidiary_id }));

// Hình 2.4 của sách: các tên bắt đầu bằng WI.
export const names = ['WIAW', 'WIBLQQNPUA', 'WIBYHSNZ', 'WIFMDWUQMB', 'WIGLZX', 'WIH', 'WIHTFVZNLC',
  'WIJYAXPP', 'WINAND', 'WINBKYDSKW', 'WIPOJ', 'WISRGPK', 'WITJIVQJ', 'WIW', 'WIWGPJMQGG',
  'WIWKHLBJ', 'WIYETHN', 'WIYJ'].map(last_name => ({ last_name }));

// Bàn cờ: 40 người, tên (chữ cái đầu) và năm sinh, sinh giả ngẫu nhiên có seed cố định.
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const letter = () => String.fromCharCode(65 + Math.floor(rnd() * 26));
export const people = Array.from({ length: 40 }, () => ({
  last_name: letter() + letter().toLowerCase(),
  year: 1950 + Math.floor(rnd() * 50),
}));
