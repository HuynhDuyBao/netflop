import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi.js';

function Setting() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.dashboard()
      .then(setDashboard)
      .catch((loadError) => setError(loadError.response?.data?.message || 'Không tải được cấu hình hệ thống.'));
  }, []);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Cài đặt</p>
          <h1>Cấu hình hệ thống</h1>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="settings-grid">
        <article className="admin-card">
          <h2>Trạng thái dịch vụ</h2>
          <div className="system-list">
            {(dashboard?.system || []).map((service) => (
              <div className="system-row" key={service.name}>
                <span>{service.name}</span>
                <strong>{service.status}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="admin-card">
          <h2>Tổng quan dữ liệu</h2>
          <div className="setting-metrics">
            <span><strong>{dashboard?.metrics?.users || 0}</strong>Người dùng</span>
            <span><strong>{dashboard?.metrics?.movies || 0}</strong>Phim</span>
            <span><strong>{dashboard?.metrics?.episodes || 0}</strong>Tập phim</span>
            <span><strong>{dashboard?.metrics?.comments || 0}</strong>Bình luận</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Setting;
