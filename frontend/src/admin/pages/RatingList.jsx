import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-';
}

function RatingList() {
  const [ratings, setRatings] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadFeedback(params = {}) {
    try {
      setLoading(true);
      const query = { limit: 50, search, ...params };
      const ratingResponse = await adminApi.ratings(query);
      setRatings(ratingResponse.data.data || []);
      setError('');
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Khong tai duoc phan hoi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  const feedback = ratings.map((rating) => ({
      id: `rating-${rating.TenDN}-${rating.MaPhim}-${rating.ThoiGian}`,
      username: rating.TenDN || '-',
      movie: rating.TenPhim || `#${rating.MaPhim}`,
      score: rating.SoDiem ? `${rating.SoDiem}/10` : '-',
      comment: rating.BinhLuan || '-',
      time: rating.ThoiGian
    }));

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Phản hồi</p>
          <h1>Quản lý đánh giá</h1>
        </div>
      </div>
      <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); loadFeedback({ search }); }}>
        <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm người dùng, phim, nội dung" />
        <button className="button primary" type="submit">{loading ? 'Đang tải...' : 'Tìm'}</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-table">
        <div className="admin-table-head feedback-grid-admin">
          <span>Người dùng</span><span>Phim</span><span>Đánh giá</span><span>Nhận xét</span><span>Thời gian</span>
        </div>
        {feedback.map((item) => (
          <div className="admin-table-row feedback-grid-admin" key={item.id}>
            <span>{item.username}</span>
            <span>{item.movie}</span>
            <span className={item.score !== '-' ? 'dash-pill' : ''}>{item.score}</span>
            <span>{item.comment}</span>
            <span>{formatDate(item.time)}</span>
          </div>
        ))}
        {!loading && feedback.length === 0 && <p className="admin-empty-state">Chưa có đánh giá.</p>}
      </div>
    </section>
  );
}

export default RatingList;
