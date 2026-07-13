import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MovieSlider from '../components/MovieSlider.jsx';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovie } from '../utils/normalizeMovie.js';
import { loadGenreRecommendations } from '../utils/movieRecommendations.js';
import { useAuth } from '../hooks/useAuth.js';

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMovie() {
      setLoading(true);
      setError('');

      try {
        const [detailResponse, episodesResponse] = await Promise.all([
          movieApi.detail(id),
          movieApi.episodes(id)
        ]);
        if (cancelled) return;

        const nextMovie = normalizeMovie(detailResponse.data.data);
        const nextEpisodes = (episodesResponse.data.data || []).map((episode, index) => ({
          id: episode.MaTap,
          title: episode.TenTap || `Tập ${index + 1}`,
          thumbnail: episode.thumbnail_url || nextMovie.banner,
          duration: episode.duration,
          status: episode.upload_status
        })).filter((episode) => episode.status !== 'deleted');

        setMovie(nextMovie);
        setFavorite(Boolean(nextMovie?.isFavorite));
        setEpisodes(nextEpisodes);

        const nextRelatedMovies = await loadGenreRecommendations(nextMovie, id, { limit: 8, sort: 'popular' });
        if (!cancelled) setRelatedMovies(nextRelatedMovies);
      } catch (loadError) {
        if (!cancelled) setError(loadError.response?.data?.message || 'Không tìm thấy phim.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMovie();
    return () => {
      cancelled = true;
    };
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

  const isSeries = movie.type === 'Bộ' || episodes.length > 1;
  const firstEpisodeUrl = episodes[0]
    ? `/watch/${movie.id}?episode=${episodes[0].id}`
    : `/watch/${movie.id}`;
  const recommendationMoreTo = movie.genres?.[0]?.id ? `/genre/${movie.genres[0].id}` : '/movies?sort=popular';
  const trailerImage = movie.banner || movie.poster;

  return (
    <main className="movie-detail-page">
      <section className="movie-detail-hero" style={{ '--detail-bg': movie.banner ? `url(${movie.banner})` : 'none' }}>
        <button className="detail-back-button" type="button" onClick={() => navigate(-1)} aria-label="Quay lại">‹</button>

        <div className="detail-hero-copy">
          <h1>{movie.name}</h1>
          <div className="detail-meta-row">
            {movie.year && <span>{movie.year}</span>}
            {movie.quality && <span>{movie.quality}</span>}
            {movie.duration && <span>{movie.duration} phút</span>}
            {movie.country && <span>{movie.country}</span>}
            <span>{movie.type || 'Phim'}</span>
          </div>
          <div className="detail-score-row">
            <strong>{Number(movie.rating || 0).toFixed(1)}/10</strong>
            <span>IMDb</span>
          </div>
          <p>{movie.description || 'Chưa có mô tả cho phim này.'}</p>
          <div className="detail-action-row">
            <Link className="button primary" to={firstEpisodeUrl}>
              <span aria-hidden="true">▶</span>
              {isSeries ? 'Chọn tập' : 'Xem ngay'}
            </Link>
            {user && (
              <button className={favorite ? 'button secondary is-active' : 'button secondary'} type="button" onClick={toggleFavorite} disabled={favoriteBusy}>
                <span aria-hidden="true">＋</span>
                {favoriteBusy ? 'Đang lưu...' : favorite ? 'Bỏ khỏi danh sách' : 'Danh sách của tôi'}
              </button>
            )}
            <button className="detail-icon-button" type="button" aria-label="Thông tin">ⓘ</button>
          </div>
        </div>
      </section>

      <section className="detail-content-shell">
        <nav className="detail-tabs" aria-label="Nội dung phim">
          <a className="active" href="#overview">Tổng quan</a>
          <a href="#cast">Diễn viên</a>
          <a href="#trailer">Trailer & Video</a>
          <a href="#related">Phim liên quan</a>
        </nav>

        <div className="detail-main-grid" id="overview">
          <aside className="detail-overview-card">
            {movie.directors.length > 0 && (
              <PeopleBlock title="Đạo diễn" people={movie.directors.slice(0, 4)} />
            )}
            {movie.cast.length > 0 && (
              <PeopleBlock title="Diễn viên" people={movie.cast.slice(0, 6)} />
            )}
            {movie.genres.length > 0 && (
              <InfoBlock title="Thể loại" value={movie.genres.map((genre) => genre.name).join(', ')} />
            )}
            <InfoBlock title="Ngày phát hành" value={movie.releaseDate || movie.year || 'Đang cập nhật'} />
          </aside>

          <section className="detail-trailer-card" id="trailer">
            {movie.trailerKey ? (
              <div className="detail-trailer-art detail-trailer-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                  title={`Trailer ${movie.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <Link className="detail-trailer-art" to={firstEpisodeUrl}>
                {trailerImage ? <img src={trailerImage} alt="" /> : <span>{movie.name?.charAt(0) || 'M'}</span>}
                <b aria-hidden="true">▶</b>
              </Link>
            )}
            <div>
              <strong>{movie.trailerKey ? 'Trailer' : 'Xem phim'}</strong>
              <span>{movie.duration ? `${movie.duration} phút` : movie.quality || 'HD'}</span>
            </div>
          </section>

          <aside className="detail-related-panel" id="related">
            <header>
              <h2>Phim liên quan</h2>
              <Link to={recommendationMoreTo}>Xem thêm</Link>
            </header>
            <div className="detail-related-list">
              {relatedMovies.slice(0, 4).map((relatedMovie) => (
                <Link className="detail-related-item" to={`/movies/${relatedMovie.id}`} key={relatedMovie.id}>
                  <span>{relatedMovie.poster || relatedMovie.banner ? <img src={relatedMovie.poster || relatedMovie.banner} alt="" /> : relatedMovie.name?.charAt(0)}</span>
                  <div>
                    <strong>{relatedMovie.name}</strong>
                    <small>{relatedMovie.year || relatedMovie.quality || 'HD'}</small>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        {isSeries && episodes.length > 0 && (
          <section className="detail-episode-section" id="episode-list">
            <div className="section-heading">
              <h2>Danh sách tập</h2>
              <span>{episodes.length} tập</span>
            </div>
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
          </section>
        )}

        {relatedMovies.length > 4 && (
          <MovieSlider title="Có thể bạn cũng thích" movies={relatedMovies.slice(4)} seeMoreTo={recommendationMoreTo} />
        )}
      </section>
    </main>
  );
}

function InfoBlock({ title, value }) {
  return (
    <div className="detail-info-block">
      <span>{title}</span>
      <p>{value}</p>
    </div>
  );
}

function PeopleBlock({ title, people }) {
  return (
    <div className="detail-info-block detail-people-block">
      <span>{title}</span>
      <div className="detail-person-list">
        {people.map((person, index) => (
          <Link
            className="detail-person-pill"
            to={person.id ? `/people/${person.id}` : '#'}
            key={`${person.id || person.name}-${index}`}
            onClick={(event) => {
              if (!person.id) event.preventDefault();
            }}
          >
            <i>
              {person.profile ? <img src={person.profile} alt="" /> : person.name?.slice(0, 1)}
            </i>
            <b>{person.name}</b>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MovieDetail;
