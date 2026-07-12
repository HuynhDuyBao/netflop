import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MovieSlider from '../components/MovieSlider.jsx';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

const TRAILER_BANNER_DURATION = 10000;
const IMAGE_BANNER_DURATION = 3000;

const sectionLinks = {
  latest: '/movies?sort=latest',
  popular: '/movies?sort=popular'
};

const railTabs = [
  { id: 'latest', label: 'Mới cập nhật', title: 'Mới cập nhật' },
  { id: 'popular', label: 'Xem nhiều', title: 'Xem nhiều' }
];

function BannerTrailerPlayer({ movie }) {
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      loop: '0',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      disablekb: '1',
      fs: '0',
      showinfo: '0',
      origin: window.location.origin
    });

    return `https://www.youtube-nocookie.com/embed/${movie.trailerKey}?${params.toString()}`;
  }, [movie.trailerKey]);

  return (
    <div className="banner-video" aria-hidden="true">
      <iframe
        src={embedUrl}
        title=""
        scrolling="no"
        tabIndex="-1"
        style={{ overflow: 'hidden' }}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <span className="banner-video-guard" />
    </div>
  );
}

function Home() {
  const [movies, setMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [activeRail, setActiveRail] = useState('latest');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHomeMovies() {
      try {
        const [latestResponse, popularResponse] = await Promise.all([
          movieApi.list({ limit: 24, sort: 'latest' }),
          movieApi.list({ limit: 24, sort: 'popular' })
        ]);

        setMovies(normalizeMovies(latestResponse.data.data || []));
        setPopularMovies(normalizeMovies(popularResponse.data.data || []));
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Không tải được danh sách phim.');
      } finally {
        setLoading(false);
      }
    }

    loadHomeMovies();
  }, []);

  const bannerMovies = useMemo(() => movies.slice(0, 6), [movies]);
  const featuredMovie = bannerMovies[activeBannerIndex] || movies[0];
  const bannerDuration = featuredMovie?.trailerKey
    ? TRAILER_BANNER_DURATION
    : IMAGE_BANNER_DURATION;
  const activeRailConfig = railTabs.find((tab) => tab.id === activeRail) || railTabs[0];
  const activeRailMovies = activeRail === 'popular' ? popularMovies : movies;

  useEffect(() => {
    if (activeBannerIndex >= bannerMovies.length) {
      setActiveBannerIndex(0);
    }
  }, [activeBannerIndex, bannerMovies.length]);

  const showNextBanner = useCallback(() => {
    setActiveBannerIndex((currentIndex) => {
      if (bannerMovies.length <= 1) return currentIndex;
      return (currentIndex + 1) % bannerMovies.length;
    });
  }, [bannerMovies.length]);

  useEffect(() => {
    if (bannerMovies.length <= 1 || !featuredMovie) {
      return undefined;
    }

    const timer = setTimeout(showNextBanner, bannerDuration);
    return () => clearTimeout(timer);
  }, [bannerDuration, bannerMovies.length, featuredMovie, showNextBanner]);

  function showPreviousBanner() {
    setActiveBannerIndex((currentIndex) => (
      currentIndex === 0 ? bannerMovies.length - 1 : currentIndex - 1
    ));
  }

  if (loading) {
    return <main className="page"><div className="loading">Đang tải...</div></main>;
  }

  if (error) {
    return <main className="page"><p className="form-error">{error}</p></main>;
  }

  if (!featuredMovie) {
    return (
      <main className="page auth-page">
        <h1>Chưa có phim trên trang chủ</h1>
        <p>Hãy vào Admin, tạo phim mới và bật trạng thái xuất bản.</p>
      </main>
    );
  }

  return (
    <main>
      <section className="home-hero banner-carousel" aria-label="Phim nổi bật">
        {featuredMovie.trailerKey ? (
          <BannerTrailerPlayer
            key={featuredMovie.id}
            movie={featuredMovie}
          />
        ) : (
          <div
            className="banner-image"
            style={{ backgroundImage: `url(${featuredMovie.banner || featuredMovie.poster})` }}
            aria-hidden="true"
          />
        )}
        <div className="hero-content banner-content">
          <div className="hero-kicker">{featuredMovie.type || 'Netflop'}</div>
          <h1>{featuredMovie.name}</h1>
          <div className="hero-rating-row">
            <span className="hero-rating">★ {Number(featuredMovie.rating || 0).toFixed(1)}</span>
            <span>Đa ngôn ngữ</span>
            <span>{featuredMovie.quality || 'Full HD'}</span>
          </div>
          <div className="banner-tags">
            {featuredMovie.country && <span>{featuredMovie.country}</span>}
            {featuredMovie.status && <span>{featuredMovie.status}</span>}
            {featuredMovie.year && <span>{featuredMovie.year}</span>}
          </div>
          <p>{featuredMovie.description || 'Thưởng thức bộ phim đang được giới thiệu trên Netflop.'}</p>
          <div className="hero-actions">
            <Link className="button primary" to={`/watch/${featuredMovie.id}`}>
              <span aria-hidden="true">&#9658;</span>
              Xem ngay
            </Link>
            <Link className="button secondary" to={`/movies/${featuredMovie.id}`}>Chi tiết</Link>
            <button className="hero-circle-action" type="button" aria-label="Yêu thích">♡</button>
            <button className="hero-circle-action" type="button" aria-label="Chia sẻ">↗</button>
          </div>
        </div>
        {bannerMovies.length > 1 && (
          <div className="banner-thumbs" aria-label="Danh sách phim nổi bật">
            {bannerMovies.slice(0, 6).map((movie, index) => (
              <button
                className={index === activeBannerIndex ? 'active' : ''}
                key={`${movie.id || movie.MaPhim || movie.name || 'banner'}-${index}`}
                type="button"
                onClick={() => setActiveBannerIndex(index)}
                aria-label={`Chuyển đến ${movie.name}`}
                style={index === activeBannerIndex ? { '--banner-duration': `${bannerDuration}ms` } : undefined}
              >
                {movie.banner || movie.poster ? <img src={movie.banner || movie.poster} alt="" /> : <span>{movie.name?.charAt(0) || 'M'}</span>}
                {index === activeBannerIndex && <span className="banner-thumb-progress" aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
        {bannerMovies.length > 1 && (
          <div className="banner-controls" aria-label="Điều hướng banner">
            <button type="button" onClick={showPreviousBanner} aria-label="Phim trước">&lsaquo;</button>
            <div className="banner-dots">
              {bannerMovies.map((movie, index) => (
                <button
                  className={index === activeBannerIndex ? 'active' : ''}
                  key={`${movie.id || movie.MaPhim || movie.name || 'banner-dot'}-${index}`}
                  type="button"
                  onClick={() => setActiveBannerIndex(index)}
                  aria-label={`Chuyển đến ${movie.name}`}
                />
              ))}
            </div>
            <button type="button" onClick={showNextBanner} aria-label="Phim tiếp theo">&rsaquo;</button>
          </div>
        )}
      </section>
      <section className="content-rail">
        <div className="quick-tabs home-rail-tabs" role="tablist" aria-label="Lọc phim trang chủ">
          {railTabs.map((tab) => (
            <button
              className={activeRail === tab.id ? 'active' : ''}
              key={tab.id}
              type="button"
              onClick={() => setActiveRail(tab.id)}
              aria-pressed={activeRail === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeRailMovies.length > 0 ? (
          <MovieSlider
            key={activeRail}
            title={activeRailConfig.title}
            movies={activeRailMovies}
            seeMoreTo={sectionLinks[activeRailConfig.id]}
          />
        ) : (
          <p className="home-rail-empty">Chưa có phim phù hợp.</p>
        )}
      </section>
    </main>
  );
}

export default Home;
