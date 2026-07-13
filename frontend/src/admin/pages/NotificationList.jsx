import { useEffect, useState } from 'react';
import { notificationApi } from '../../services/notificationApi.js';

const initialForm = {
  title: '',
  message: '',
  link: '',
  type: 'admin'
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-';
}

function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadNotifications() {
    try {
      setLoading(true);
      const response = await notificationApi.adminList({ limit: 50 });
      setNotifications(response.data.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải được danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  }

  async function createNotification(event) {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await notificationApi.create(form);
      setNotifications((current) => [response.data.data, ...current]);
      setForm(initialForm);
      setMessage('Đã gửi thông báo lên trang chủ.');
      setError('');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Không tạo được thông báo.');
      setMessage('');
    } finally {
      setSaving(false);
    }
  }

  async function deleteNotification(id) {
    try {
      await notificationApi.delete(id);
      setNotifications((current) => current.filter((item) => item.id !== id));
      setMessage('Đã xóa thông báo.');
      setError('');
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Không xóa được thông báo.');
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <section className="admin-page admin-notification-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Truyền thông</p>
          <h1>Thông báo trang chủ</h1>
        </div>
      </div>

      <div className="admin-notification-grid">
        <form className="admin-card admin-notification-form" onSubmit={createNotification}>
          <h2>Tạo thông báo</h2>
          <label>
            Tiêu đề
            <input
              className="input"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Ví dụ: Phim mới đã lên sóng"
              required
            />
          </label>
          <label>
            Nội dung
            <textarea
              className="input"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              placeholder="Nhập nội dung thông báo hiển thị cho người dùng"
              rows="5"
              required
            />
          </label>
          <label>
            Liên kết
            <input
              className="input"
              value={form.link}
              onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
              placeholder="/movies hoặc /movies/12"
            />
          </label>
          <button className="button primary" type="submit" disabled={saving}>
            {saving ? 'Đang gửi...' : 'Gửi thông báo'}
          </button>
        </form>

        <div className="admin-card admin-notification-list">
          <div className="panel-heading">
            <h2>Thông báo đã gửi</h2>
            <button className="button secondary" type="button" onClick={loadNotifications}>
              {loading ? 'Đang tải...' : 'Tải lại'}
            </button>
          </div>

          {message && <p className="admin-message">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <div className="admin-notice-stack">
            {notifications.map((item) => (
              <article className="admin-notice-item" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <small>{formatDate(item.created_at)}{item.link ? ` - ${item.link}` : ''}</small>
                </div>
                <button type="button" onClick={() => deleteNotification(item.id)}>Xóa</button>
              </article>
            ))}

            {!loading && notifications.length === 0 && (
              <p className="admin-empty-state">Chưa có thông báo nào.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NotificationList;
