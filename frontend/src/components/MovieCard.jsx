import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

function formatRating(value) {
  return Number(value || 0).toFixed(1);
}

function MovieCard({ movie }) {
  const cardRef = useRef(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [previewPosition, setPreviewPosition] = useState(null);
  const movieId = movie?.id || 1;
  const title = movie?.name || 'Tên phim';
  const poster = movie?.poster || movie?.banner;
  const banner = movie?.banner || movie?.poster;
  const cardArt = banner || poster;

  useEffect(() => {
    const closePreview = () => setPreviewPosition(null);
    window.addEventListener('scroll', closePreview, { passive: true });
    window.addEventListener('resize', closePreview);

    return () => {
      window.clearTimeout(openTimerRef.current);
      window.clearTimeout(closeTimerRef.current);
      window.removeEventListener('scroll', closePreview);
      window.removeEventListener('resize', closePreview);
    };
  }, []);

  function schedulePreview() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    window.clearTimeout(closeTimerRef.current);
    window.clearTimeout(openTimerRef.current);

    openTimerRef.current = window.setTimeout(() => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(286, window.innerWidth - 24);
      const estimatedHeight = 365;
      const left = Math.min(
        Math.max(12, rect.left + (rect.width - width) / 2),
        Math.max(12, window.innerWidth - width - 12)
      );
      const top = Math.min(
        Math.max(72, rect.top - 32),
        Math.max(76, window.innerHeight - estimatedHeight - 12)
      );

      setPreviewPosition({ left, top, width });
    }, 260);
  }

  function scheduleClose() {
    window.clearTimeout(openTimerRef.current);
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setPreviewPosition(null), 120);
  }

  return (
    <article
      className="movie-card"
      ref={cardRef}
      onMouseEnter={schedulePreview}
      onMouseLeave={scheduleClose}
      onFocus={schedulePreview}
      onBlur={scheduleClose}
    >
      <Link className="movie-card-main" to={`/movies/${movieId}`}>
        <div className="poster">
          {cardArt ? <img src={cardArt} alt={title} loading="lazy" decoding="async" /> : <span>{title.charAt(0) || 'M'}</span>}
          <span className="quality-badge">{movie?.quality || 'HD'}</span>
        </div>
        <h3>{title}</h3>
        <p>{movie?.year || 2026} • {formatRating(movie?.rating)}</p>
      </Link>

      {previewPosition && createPortal(
        <aside
          className="movie-preview-popover"
          style={previewPosition}
          onMouseEnter={() => window.clearTimeout(closeTimerRef.current)}
          onMouseLeave={scheduleClose}
        >
          <Link className="movie-preview-art" to={`/movies/${movieId}`}>
            {banner ? <img src={banner} alt="" loading="eager" decoding="async" /> : <span>{title.charAt(0) || 'M'}</span>}
          </Link>
          <div className="movie-preview-body">
            <div className="movie-preview-actions">
              <Link className="button primary" to={`/watch/${movieId}`}>
                <span aria-hidden="true">▶</span> Xem ngay
              </Link>
              <button type="button" aria-label="Yêu thích">♡</button>
              <button type="button" aria-label="Chia sẻ">↗</button>
            </div>
            <Link className="movie-preview-title" to={`/movies/${movieId}`}>{title}</Link>
            <div className="movie-preview-tags">
              <span className="rating">★ {formatRating(movie?.rating)}</span>
              <span>{movie?.quality || 'HD'}</span>
              {movie?.country && <span>{movie.country}</span>}
            </div>
            <p className="movie-preview-meta">
              {movie?.year || 'N/A'} • {movie?.status || 'Đang chiếu'} • {movie?.type || 'Phim'}
            </p>
            <p className="movie-preview-desc">{movie?.description || 'Nội dung phim đang được cập nhật.'}</p>
            <Link className="movie-preview-detail" to={`/movies/${movieId}`}>
              Xem chi tiết
            </Link>
          </div>
        </aside>,
        document.body
      )}
    </article>
  );
}

export default MovieCard;
