import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-';
}

function CommentList() {
  const [comments, setComments] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadComments(params = {}) {
    try {
      setLoading(true);
      const response = await adminApi.comments({ limit: 50, search, ...params });
      setComments(response.data.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải được bình luận.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, []);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Kiểm duyệt</p>
          <h1>Quản lý bình luận</h1>
        </div>
      </div>
      <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); loadComments({ search }); }}>
        <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm nội dung, người dùng, phim" />
        <button className="button primary" type="submit">{loading ? 'Đang tải...' : 'Tìm'}</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-table">
        <div className="admin-table-head comment-grid-admin">
          <span>ID</span><span>Người dùng</span><span>Phim</span><span>Nội dung</span><span>Thời gian</span>
        </div>
        {comments.map((comment) => (
          <div className="admin-table-row comment-grid-admin" key={comment.MaBinhLuan}>
            <span>{comment.MaBinhLuan}</span>
            <span>{comment.TenDN || '-'}</span>
            <span>{comment.TenPhim || `#${comment.MaPhim}`}</span>
            <span>{comment.NoiDung}</span>
            <span>{formatDate(comment.ThoiGian)}</span>
          </div>
        ))}
        {!loading && comments.length === 0 && <p className="admin-empty-state">Chưa có bình luận.</p>}
      </div>
    </section>
  );
}

export default CommentList;
