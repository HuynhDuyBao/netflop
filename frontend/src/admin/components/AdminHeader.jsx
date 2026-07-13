import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const pageTitles = [
  ['/admin/movies/create', ['Thêm phim', 'Tạo nội dung phim mới']],
  ['/admin/movies', ['Danh sách phim', 'Quản lý thư viện phim']],
  ['/admin/episodes/create', ['Tải video', 'Thêm tập phim và video']],
  ['/admin/episodes', ['Tập phim', 'Quản lý danh sách tập']],
  ['/admin/genres', ['Thể loại', 'Sắp xếp danh mục phim']],
  ['/admin/users', ['Người dùng', 'Quản lý tài khoản']],
  ['/admin/feedback', ['Phản hồi', 'Bình luận và đánh giá']],
  ['/admin/comments', ['Bình luận', 'Kiểm duyệt thảo luận']],
  ['/admin/contacts', ['Liên hệ', 'Phản hồi từ người dùng']],
  ['/admin/ratings', ['Đánh giá', 'Theo dõi phản hồi']],
  ['/admin/tmdb-import', ['Nhập từ TMDb', 'Nhập dữ liệu phim']],
  ['/admin/banners', ['Banner phim', 'Quản lý khu vực nổi bật']],
  ['/admin/settings', ['Cấu hình hệ thống', 'Thiết lập quản trị']]
];

function formatCurrentTime(date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

function AdminHeader() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [currentTime, setCurrentTime] = useState(() => formatCurrentTime(new Date()));
  const matched = pageTitles.find(([path]) => pathname.startsWith(path));
  const [title, subtitle] = matched?.[1] || ['Bảng điều khiển', 'Tổng quan hệ thống'];
  const displayName = user?.ho_ten || user?.ten_dang_nhap || user?.email || 'Admin';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(formatCurrentTime(new Date()));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="admin-header">
      <div className="admin-titlebar">
        <button className="admin-icon-button" type="button" aria-label="Mở menu">☰</button>
        <div className="admin-title-copy">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
      </div>
      <div className="admin-header-actions">
        <span className="date-chip">{currentTime}</span>
        <button className="admin-icon-button" type="button" aria-label="Thông báo">!</button>
        <Link className="admin-avatar" to="/">
          <span>{displayName.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{displayName}</strong>
            <small>Quản trị viên</small>
          </div>
        </Link>
        <button className="admin-ghost-button" type="button" onClick={logout}>Đăng xuất</button>
      </div>
    </header>
  );
}

export default AdminHeader;
