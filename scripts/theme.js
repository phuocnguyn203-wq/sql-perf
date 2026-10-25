// Nút đổi nền sáng/tối. Mặc định theo hệ điều hành; lựa chọn của người đọc được nhớ lại.
// Trang đặt data-theme sớm bằng một dòng script trong <head> để khỏi chớp màu khi tải.
// Mỗi lần nền đổi, phát sự kiện 'themechange' để các hình vẽ tay vẽ lại bằng màu mới.
const KEY = 'theme';
const root = document.documentElement;
const media = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : media.matches);
const changed = () => document.dispatchEvent(new CustomEvent('themechange'));

export function themeToggle() {
  const btn = document.querySelector('.theme-toggle');
  const label = () => {
    if (!btn) return;
    btn.textContent = isDark() ? 'Nền sáng' : 'Nền tối';
    btn.setAttribute('aria-label', isDark() ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối');
  };
  btn?.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch { /* trình duyệt chặn lưu trữ: chỉ đổi cho lần xem này */ }
    label();
    changed();
  });
  media.addEventListener('change', () => { label(); changed(); });
  label();
}
