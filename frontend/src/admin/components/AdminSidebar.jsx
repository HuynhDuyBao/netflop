import { NavLink } from 'react-router-dom';

const navGroups = [
  {
    title: 'Tổng quan',
    items: [
      { to: '/admin', label: 'Bảng điều khiển', icon: 'D' }
    ]
  },
  {
    title: 'Quản lý phim',
    items: [
      { to: '/admin/movies', label: 'Danh sách phim', icon: 'P' },
      { to: '/admin/movies/create', label: 'Thêm phim', icon: '+' },
      { to: '/admin/episodes', label: 'Tập phim', icon: 'E' },
      { to: '/admin/genres', label: 'Thể loại', icon: 'G' },
      { to: '/admin/banners', label: 'Banner phim', icon: 'B' }
    ]
  },
  {
    title: 'Streaming',
    items: [
      { to: '/admin/episodes/create', label: 'Tải video', icon: 'U' },
      { to: '/admin/tmdb-import', label: 'Nhập từ TMDb', icon: 'M' }
    ]
  },
  {
    title: 'Người dùng',
    items: [
      { to: '/admin/users', label: 'Người dùng', icon: 'N' },
      { to: '/admin/feedback', label: 'Phản hồi', icon: 'F' },
      { to: '/admin/contacts', label: 'Liên hệ', icon: 'L' },
      { to: '/admin/notifications', label: 'Thông báo', icon: '!' }
    ]
  },
  {
    title: 'Cài đặt',
    items: [
      { to: '/admin/settings', label: 'Cấu hình hệ thống', icon: 'S' }
    ]
  }
];

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img src="/netflop-logo.svg" alt="Netflop" />
        <div>
          <strong>NET<b>FLOP</b></strong>
          <small>Quản trị hệ thống</small>
        </div>
      </div>

      <nav>
        {navGroups.map((group) => (
          <div className="admin-nav-group" key={group.title}>
            <p>{group.title}</p>
            {group.items.map((item) => (
              <NavLink end={item.to === '/admin'} key={`${group.title}-${item.to}-${item.label}`} to={item.to}>
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <NavLink className="admin-logout-link" to="/">
        <span>↗</span>
        Về trang web
      </NavLink>
    </aside>
  );
}

export default AdminSidebar;
