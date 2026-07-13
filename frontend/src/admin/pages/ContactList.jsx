import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi.js';

const statusLabels = {
  new: 'Mới gửi',
  reviewing: 'Đang xử lý',
  done: 'Đã xử lý'
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-';
}

function ContactList() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadContacts(params = {}) {
    try {
      setLoading(true);
      const response = await adminApi.contacts({ limit: 80, search, status, ...params });
      setContacts(response.data.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải được danh sách liên hệ.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, nextStatus) {
    try {
      await adminApi.updateContactStatus(id, nextStatus);
      setContacts((current) => current.map((item) => (
        item.id === id ? { ...item, status: nextStatus } : item
      )));
    } catch (updateError) {
      setError(updateError.response?.data?.message || 'Không cập nhật được trạng thái.');
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Hộp thư</p>
          <h1>Liên hệ từ người dùng</h1>
        </div>
      </div>

      <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); loadContacts({ search, status }); }}>
        <input
          className="input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm tên, email, chủ đề hoặc nội dung"
        />
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="new">Mới gửi</option>
          <option value="reviewing">Đang xử lý</option>
          <option value="done">Đã xử lý</option>
        </select>
        <button className="button primary" type="submit">{loading ? 'Đang tải...' : 'Tìm'}</button>
      </form>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-contact-list">
        {contacts.map((contact) => (
          <article className="admin-contact-card" key={contact.id}>
            <div className="admin-contact-top">
              <div>
                <strong>{contact.name}</strong>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
              <span className={`contact-status contact-status-${contact.status}`}>
                {statusLabels[contact.status] || contact.status}
              </span>
            </div>
            <div className="admin-contact-meta">
              <span>{contact.topic}</span>
              <span>{formatDate(contact.created_at)}</span>
            </div>
            <p>{contact.message}</p>
            <div className="admin-contact-actions">
              <button type="button" onClick={() => updateStatus(contact.id, 'reviewing')}>Đang xử lý</button>
              <button type="button" onClick={() => updateStatus(contact.id, 'done')}>Đã xử lý</button>
            </div>
          </article>
        ))}

        {!loading && contacts.length === 0 && <p className="admin-empty-state">Chưa có liên hệ nào.</p>}
      </div>
    </section>
  );
}

export default ContactList;
