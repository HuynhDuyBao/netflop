import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MovieSlider from '../components/MovieSlider.jsx';
import Trailer from '../components/Trailer.jsx';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovie, normalizeMovies } from '../utils/normalizeMovie.js';
import { useAuth } from '../hooks/useAuth.js';

function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    async function loadMovie() {
      setLoading(true);
      setError('');

      try {
        const [detailResponse, relatedResponse, episodesResponse] = await Promise.all([
          movieApi.detail(id),
          movieApi.list({ limit: 12, sort: 'popular' }),
          movieApi.episodes(id)
        ]);
        const nextMovie = normalizeMovie(detailResponse.data.data);
        setMovie(nextMovie);
        setFavorite(Boolean(nextMovie?.isFavorite));
        setRelatedMovies(normalizeMovies(relatedResponse.data.data || []).filter((item) => String(item.id) !== String(id)));
        setEpisodes((episodesResponse.data.data || []).map((episode, index) => ({
          id: episode.MaTap,
          title: episode.TenTap || `Tập ${index + 1}`,
          thumbnail: episode.thumbnail_url || nextMovie.banner,
          duration: episode.duration,
          status: episode.upload_status
        })).filter((episode) => episode.status !== 'deleted'));
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Không tìm thấy phim.');
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  async function toggleFavorite() {
    if (!user || !movie) return;

    setFavoriteBusy(true);
    try {
      if (favorite) {
        await movieApi.removeFavorite(movie.id);
        setFavorite(false);
        return;
      }

      await movieApi.addFavorite(movie.id);
      setFavorite(true);
    } catch (favoriteError) {
      setError(favoriteError.response?.data?.message || 'Không cập nhật được yêu thích.');
    } finally {
      setFavoriteBusy(false);
    }
  }

  if (loading) {
    return <main className="page"><div className="loading">Đang tải...</div></main>;
  }

  if (error || !movie) {
    return <main className="page"><p className="form-error">{error || 'Không tìm thấy phim.'}</p></main>;
  }

  if (movie.type === 'Bộ' && episodes.length === 0) {
    return <Navigate to={`/watch/${movie.id}`} replace />;
  }

  const isSeries = movie.type === 'Bộ' || episodes.length > 1;
  const firstEpisodeUrl = episodes[0]
    ? `/watch/${movie.id}?episode=${episodes[0].id}`
    : `/watch/${movie.id}`;

  return (
    <main>
      <section className="detail-hero" style={{ backgroundImage: movie.banner ? `url(${movie.banner})` : undefined }}>
        <div className="detail-info">
          {movie.poster ? <img src={movie.poster} alt={movie.name} /> : <div className="poster"><span>{movie.name?.charAt(0) || 'N'}</span></div>}
          <div>
            <h1>{movie.name}</h1>
            <p>{movie.description || 'Chưa có mô tả cho phim này.'}</p>
            <div className="meta-line">
              <span>{movie.quality}</span>
              {movie.year && <span>{movie.year}</span>}
              {movie.duration && <span>{movie.duration} phút</span>}
              {movie.rating ? <span>{movie.rating}</span> : null}
              {movie.country && <span>{movie.country}</span>}
            </div>
            {movie.genres.length > 0 && (
              <div className="tag-list">
                {movie.genres.map((genre) => <span key={genre.id || genre.name}>{genre.name}</span>)}
              </div>
            )}
            {movie.directors.length > 0 && <p>Đạo diễn: {movie.directors.map((person) => person.name).join(', ')}</p>}
            {movie.cast.length > 0 && <p>Diễn viên: {movie.cast.slice(0, 6).map((person) => person.name).join(', ')}</p>}
            <div className="hero-actions">
              {isSeries && episodes.length > 0 ? (
                <a className="button primary" href="#episode-list">Chọn tập</a>
              ) : (
                <Link className="button primary" to={firstEpisodeUrl}>Xem ngay</Link>
              )}
              {movie.trailer && <a className="button secondary" href={movie.trailer} target="_blank" rel="noreferrer">Trailer</a>}
              {user && (
                <button className={favorite ? 'button secondary is-active' : 'button secondary'} type="button" onClick={toggleFavorite} disabled={favoriteBusy}>
                  {favoriteBusy ? 'Đang lưu...' : favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="content-rail">
        {isSeries && (
          <section className="movie-section detail-episode-section" id="episode-list">
            <div className="section-heading">
              <h2>Danh sách tập</h2>
              <span>{episodes.length} tập</span>
            </div>
            {episodes.length > 0 ? (
              <div className="detail-episode-grid">
                {episodes.map((episode, index) => (
                  <Link className="detail-episode-card" key={episode.id} to={`/watch/${movie.id}?episode=${episode.id}`}>
                    <span style={{ backgroundImage: episode.thumbnail ? `url(${episode.thumbnail})` : undefined }}>
                      <i>{index + 1}</i>
                      <b aria-hidden="true">▶</b>
                    </span>
                    <div>
                      <strong>{episode.title}</strong>
                      <small>{episode.duration ? `${episode.duration} giây` : 'Sẵn sàng phát'}</small>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="detail-episode-empty">Phim bộ này chưa có tập để phát.</p>
            )}
          </section>
        )}
        <section className="movie-section">
          <div className="section-heading">
            <h2>Trailer</h2>
          </div>
          <Trailer youtubeKey={movie.trailerKey} />
        </section>
        <MovieSlider title="Có thể bạn thích" movies={relatedMovies} />
      </section>
    </main>
  );
}

export default MovieDetail;
