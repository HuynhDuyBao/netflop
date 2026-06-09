import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi.js';

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function loadMovies(params = {}) {
    try {
      const response = await adminApi.movies({ search, limit: 50, ...params });
      setMovies(response.data.data || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải được danh sách phim.');
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  async function togglePublished(movie) {
    setBusyId(movie.MaPhim);
    try {
      await adminApi.updateMovie(movie.MaPhim, { isPublished: !movie.is_published });
      loadMovies();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMovie(movie) {
    if (!window.confirm(`Xóa phim "${movie.TenPhim}"?`)) return;
    setBusyId(movie.MaPhim);
    try {
      await adminApi.deleteMovie(movie.MaPhim);
      loadMovies();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Nội dung</p>
          <h1>Quản lý phim</h1>
        </div>
        <Link className="button primary" to="/admin/movies/create">Thêm phim</Link>
      </div>
      <form className="admin-toolbar" onSubmit={(event) => { event.preventDefault(); loadMovies({ search }); }}>
        <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên phim" />
        <button className="button primary" type="submit">Tìm</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-table">
        <div className="admin-table-head movie-grid-admin">
          <span>ID</span><span>Poster</span><span>Tên phim</span><span>Năm</span><span>Quốc gia</span><span>Xuất bản</span><span></span>
        </div>
        {movies.map((movie) => (
          <div className="admin-table-row movie-grid-admin" key={movie.MaPhim}>
            <span>{movie.MaPhim}</span>
            {movie.HinhAnh || movie.HinhAnhBanner ? <img className="admin-poster" src={movie.HinhAnh || movie.HinhAnhBanner} alt={movie.TenPhim} /> : <span className="admin-poster placeholder">N/A</span>}
            <span>{movie.TenPhim}</span>
            <span>{movie.NamPhatHanh || '-'}</span>
            <span>{movie.TenQuocGia || '-'}</span>
            <button className={movie.is_published ? 'status-pill active' : 'status-pill'} type="button" onClick={() => togglePublished(movie)} disabled={busyId === movie.MaPhim}>
              {busyId === movie.MaPhim ? 'Đang lưu...' : movie.is_published ? 'Đang hiện' : 'Bản nháp'}
            </button>
            <span className="row-actions">
              <Link to={`/admin/movies/${movie.MaPhim}/edit`}>Sửa</Link>
              <button type="button" onClick={() => deleteMovie(movie)} disabled={busyId === movie.MaPhim}>Xóa</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MovieList;
