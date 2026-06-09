import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const pageTitles = [
  ['/admin/movies/create', ['Thêm phim', 'Tạo nội dung phim mới']],
  ['/admin/movies', ['Danh sách phim', 'Quản lý thư viện phim']],
  ['/admin/episodes/create', ['Tải video', 'Thêm tập phim và video']],
  ['/admin/episodes', ['Tập phim', 'Quản lý danh sách tập']],
  ['/admin/genres', ['Thể loại', 'Sắp xếp danh mục phim']],
  ['/admin/users', ['Người dùng', 'Quản lý tài khoản']],
  ['/admin/comments', ['Bình luận', 'Kiểm duyệt thảo luận']],
  ['/admin/ratings', ['Đánh giá', 'Theo dõi phản hồi']],
  ['/admin/tmdb-import', ['Nhập từ TMDb', 'Nhập dữ liệu phim']],
  ['/admin/banners', ['Banner phim', 'Quản lý khu vực nổi bật']],
  ['/admin/settings', ['Cấu hình hệ thống', 'Thiết lập quản trị']]
];

function AdminHeader() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const matched = pageTitles.find(([path]) => pathname.startsWith(path));
  const [title, subtitle] = matched?.[1] || ['Bảng điều khiển', 'Tổng quan hệ thống'];
  const username = user?.ten_dang_nhap || 'Admin';

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
        <span className="date-chip">20/05/2025 - 26/05/2025</span>
        <button className="admin-icon-button" type="button" aria-label="Thông báo">!</button>
        <Link className="admin-avatar" to="/">
          <span>{username.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{username}</strong>
            <small>Quản trị viên</small>
          </div>
        </Link>
        <button className="admin-ghost-button" type="button" onClick={logout}>Đăng xuất</button>
      </div>
    </header>
  );
}

export default AdminHeader;
