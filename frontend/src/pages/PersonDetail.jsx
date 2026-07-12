import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { personApi } from '../services/personApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

function PersonDetail() {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    personApi.detail(id)
      .then((response) => {
        setActor(response.data.data.actor);
        setMovies(normalizeMovies(response.data.data.movies || []));
      })
      .catch((loadError) => {
        setError(loadError.response?.data?.message || 'Không tải được thông tin diễn viên.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <main className="person-detail-page"><div className="loading">Đang tải...</div></main>;
  }

  if (error || !actor) {
    return <main className="person-detail-page"><p className="form-error">{error || 'Không tìm thấy diễn viên.'}</p></main>;
  }

  return (
    <main className="person-detail-page">
      <section className="person-profile">
        <span className="person-profile-avatar">
          {actor.HinhAnh ? <img src={actor.HinhAnh} alt={actor.TenDienVien} /> : actor.TenDienVien?.slice(0, 1)}
        </span>
        <div>
          <h1>{actor.TenDienVien}</h1>
          {actor.TieuSu && <p>{actor.TieuSu}</p>}
        </div>
      </section>

      <section className="person-credits">
        <h2>Nội dung tham gia</h2>
        <div className="person-movie-row">
          {movies.map((movie, index) => (
            <Link className="person-movie-card" key={`${movie.id || movie.MaPhim || movie.name || 'credit'}-${index}`} to={`/movies/${movie.id}`}>
              <span>
                {movie.banner || movie.poster ? <img src={movie.banner || movie.poster} alt={movie.name} /> : <i>{movie.name?.slice(0, 1)}</i>}
                <small>{movie.quality || 'HD'}</small>
              </span>
              <strong>{movie.name}</strong>
            </Link>
          ))}
        </div>
        {movies.length === 0 && <p className="person-empty">Chưa có phim đã xuất bản của diễn viên này.</p>}
      </section>
    </main>
  );
}

export default PersonDetail;
