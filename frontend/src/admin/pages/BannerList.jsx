import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi.js';

function BannerList() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.movies({ limit: 30, publicOnly: false, sort: 'latest' })
      .then((response) => setMovies((response.data.data || []).filter((movie) => movie.HinhAnhBanner || movie.HinhAnh)))
      .catch((loadError) => setError(loadError.response?.data?.message || 'Không tải được banner.'));
  }, []);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Trang chủ</p>
          <h1>Quản lý banner phim</h1>
        </div>
        <Link className="button primary" to="/admin/movies/create">Thêm phim</Link>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="banner-admin-grid">
        {movies.map((movie) => (
          <article className="banner-admin-card" key={movie.MaPhim}>
            <img src={movie.HinhAnhBanner || movie.HinhAnh} alt={movie.TenPhim} />
            <div>
              <strong>{movie.TenPhim}</strong>
              <span>{movie.NamPhatHanh || '-'} · {movie.TinhTrang || 'Chưa có trạng thái'}</span>
              <Link to={`/admin/movies/${movie.MaPhim}/edit`}>Chỉnh sửa</Link>
            </div>
          </article>
        ))}
        {movies.length === 0 && <p className="admin-empty-state">Chưa có phim có ảnh banner. Hãy thêm banner trong phần chỉnh sửa phim.</p>}
      </div>
    </section>
  );
}

export default BannerList;
