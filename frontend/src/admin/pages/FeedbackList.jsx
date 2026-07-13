import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/adminApi.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-';
}

function FeedbackList() {
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ratingRows = useMemo(() => ratings.map((rating) => ({
    id: `rating-${rating.TenDN}-${rating.MaPhim}-${rating.ThoiGian}`,
    username: rating.TenDN || '-',
    movie: rating.TenPhim || `#${rating.MaPhim}`,
    score: rating.SoDiem ? `${rating.SoDiem}/10` : '-',
    comment: rating.BinhLuan || '-',
    time: rating.ThoiGian
  })), [ratings]);

  async function loadFeedback(params = {}) {
    try {
      setLoading(true);
      const query = { limit: 50, search, ...params };
      const [commentResponse, ratingResponse] = await Promise.all([
        adminApi.comments(query),
        adminApi.ratings(query)
      ]);
      setComments(commentResponse.data.data || []);
      setRatings(ratingResponse.data.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải được phản hồi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Kiểm duyệt</p>
          <h1>Bình luận & đánh giá</h1>
        </div>
      </div>

      <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); loadFeedback({ search }); }}>
        <input
          className="input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm người dùng, phim, nội dung"
        />
        <button className="button primary" type="submit">{loading ? 'Đang tải...' : 'Tìm'}</button>
      </form>

      <div className="admin-feedback-tabs" role="tablist" aria-label="Loại phản hồi">
        <button className={activeTab === 'comments' ? 'active' : ''} type="button" onClick={() => setActiveTab('comments')}>
          Bình luận <span>{comments.length}</span>
        </button>
        <button className={activeTab === 'ratings' ? 'active' : ''} type="button" onClick={() => setActiveTab('ratings')}>
          Đánh giá <span>{ratingRows.length}</span>
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {activeTab === 'comments' ? (
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
      ) : (
        <div className="admin-table">
          <div className="admin-table-head feedback-grid-admin">
            <span>Người dùng</span><span>Phim</span><span>Đánh giá</span><span>Nhận xét</span><span>Thời gian</span>
          </div>
          {ratingRows.map((item) => (
            <div className="admin-table-row feedback-grid-admin" key={item.id}>
              <span>{item.username}</span>
              <span>{item.movie}</span>
              <span className={item.score !== '-' ? 'dash-pill' : ''}>{item.score}</span>
              <span>{item.comment}</span>
              <span>{formatDate(item.time)}</span>
            </div>
          ))}
          {!loading && ratingRows.length === 0 && <p className="admin-empty-state">Chưa có đánh giá.</p>}
        </div>
      )}
    </section>
  );
}

export default FeedbackList;
