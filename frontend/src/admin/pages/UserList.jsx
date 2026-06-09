import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi.js';

const roleLabels = {
  user: 'Người dùng',
  moderator: 'Kiểm duyệt',
  admin: 'Quản trị'
};

const statusLabels = {
  active: 'Hoạt động',
  inactive: 'Tạm khóa',
  banned: 'Bị cấm'
};

function UserList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function loadUsers(params = {}) {
    try {
      const response = await adminApi.users({ search, limit: 50, ...params });
      setUsers(response.data.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải được danh sách người dùng.');
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateRole(id, role) {
    await adminApi.updateUserRole(id, role);
    loadUsers();
  }

  async function updateStatus(id, status) {
    await adminApi.updateUserStatus(id, status);
    loadUsers();
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Tài khoản</p>
          <h1>Quản lý người dùng</h1>
        </div>
      </div>
      <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); loadUsers({ search }); }}>
        <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm username, email, họ tên" />
        <button className="button primary" type="submit">Tìm</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-table">
        <div className="admin-table-head user-grid">
          <span>ID</span><span>Tên đăng nhập</span><span>Email</span><span>Họ tên</span><span>Vai trò</span><span>Trạng thái</span>
        </div>
        {users.map((user) => (
          <div className="admin-table-row user-grid" key={user.id}>
            <span>{user.id}</span>
            <span>{user.ten_dang_nhap}</span>
            <span>{user.email}</span>
            <span>{user.ho_ten || '-'}</span>
            <select value={user.vai_tro} onChange={(event) => updateRole(user.id, event.target.value)}>
              {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={user.trang_thai} onChange={(event) => updateStatus(user.id, event.target.value)}>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        ))}
        {users.length === 0 && <p className="admin-empty-state">Chưa có người dùng.</p>}
      </div>
    </section>
  );
}

export default UserList;
