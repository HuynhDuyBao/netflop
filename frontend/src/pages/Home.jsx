import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MovieSlider from '../components/MovieSlider.jsx';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

const TRAILER_BANNER_DURATION = 10000;
const IMAGE_BANNER_DURATION = 3000;

const sectionLinks = {
  latest: '/movies?sort=latest',
  popular: '/movies?sort=popular',
  rating: '/movies?sort=rating',
  series: '/movies?type=Bộ',
  single: '/movies?type=Lẻ'
};

const categoryTiles = [
  { label: 'Hành động', to: '/genre/hanh-dong' },
  { label: 'Phiêu lưu', to: '/genre/phieu-luu' },
  { label: 'Khoa học viễn tưởng', to: '/genre/khoa-hoc-vien-tuong' },
  { label: 'Kinh dị', to: '/genre/kinh-di' },
  { label: 'Hài hước', to: '/genre/hai-huoc' },
  { label: 'Tình cảm', to: '/genre/tinh-cam' }
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

function uniqueMovies(...groups) {
  const seen = new Set();
  return groups.flat().filter((movie) => {
    if (!movie?.id || seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

function Home() {
  const [movieGroups, setMovieGroups] = useState({
    latest: [],
    popular: [],
    rating: [],
    series: [],
    single: []
  });
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function list(params) {
      const response = await movieApi.list(params);
      return normalizeMovies(response.data.data || []);
    }

    async function loadHomeMovies() {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          list({ limit: 24, sort: 'latest' }),
          list({ limit: 24, sort: 'popular' }),
          list({ limit: 24, sort: 'rating' }),
          list({ limit: 18, type: 'Bộ', sort: 'popular' }),
          list({ limit: 18, type: 'Lẻ', sort: 'popular' })
        ]);

        if (cancelled) return;

        setMovieGroups({
          latest: results[0].status === 'fulfilled' ? results[0].value : [],
          popular: results[1].status === 'fulfilled' ? results[1].value : [],
          rating: results[2].status === 'fulfilled' ? results[2].value : [],
          series: results[3].status === 'fulfilled' ? results[3].value : [],
          single: results[4].status === 'fulfilled' ? results[4].value : []
        });
        setError('');
      } catch (loadError) {
        if (!cancelled) setError(loadError.response?.data?.message || 'Không tải được danh sách phim.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHomeMovies();
    return () => {
      cancelled = true;
    };
  }, []);

  const bannerMovies = useMemo(
    () => uniqueMovies(movieGroups.popular, movieGroups.latest, movieGroups.rating).slice(0, 5),
    [movieGroups.latest, movieGroups.popular, movieGroups.rating]
  );
  const featuredMovie = bannerMovies[activeBannerIndex] || movieGroups.latest[0] || movieGroups.popular[0];
  const bannerDuration = featuredMovie?.trailerKey ? TRAILER_BANNER_DURATION : IMAGE_BANNER_DURATION;
  const continueMovies = uniqueMovies(movieGroups.series, movieGroups.popular, movieGroups.latest).slice(0, 5);

  useEffect(() => {
    if (activeBannerIndex >= bannerMovies.length) setActiveBannerIndex(0);
  }, [activeBannerIndex, bannerMovies.length]);

  const showNextBanner = useCallback(() => {
    setActiveBannerIndex((currentIndex) => {
      if (bannerMovies.length <= 1) return currentIndex;
      return (currentIndex + 1) % bannerMovies.length;
    });
  }, [bannerMovies.length]);

  useEffect(() => {
    if (bannerMovies.length <= 1 || !featuredMovie) return undefined;

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
    <main className="cinema-home showcase-home">
      <section className="home-hero banner-carousel" aria-label="Phim nổi bật">
        {featuredMovie.trailerKey ? (
          <BannerTrailerPlayer key={featuredMovie.id} movie={featuredMovie} />
        ) : (
          <div
            className="banner-image"
            style={{ backgroundImage: `url(${featuredMovie.banner || featuredMovie.poster})` }}
            aria-hidden="true"
          />
        )}
        <div className="hero-content banner-content">
          <h1 className="hero-title">{featuredMovie.name}</h1>
          <div className="hero-rating-row">
            <span className="hero-rating">{Number(featuredMovie.rating || 0).toFixed(1)}</span>
            <span>{featuredMovie.year || '2026'}</span>
            <span>{featuredMovie.duration ? `${featuredMovie.duration} phút` : '120 phút'}</span>
            <span>{featuredMovie.quality || 'HD'}</span>
            <span>{featuredMovie.type || '16+'}</span>
          </div>
          <p>{featuredMovie.description || 'Thưởng thức bộ phim đang được giới thiệu trên Netflop.'}</p>
          <div className="hero-actions">
            <Link className="button primary" to={`/watch/${featuredMovie.id}`}>
              <span aria-hidden="true">▶</span>
              Xem ngay
            </Link>
            <Link className="button secondary" to="/account?tab=favorites">
              <span aria-hidden="true">＋</span>
              Danh sách của tôi
            </Link>
          </div>
        </div>

        {bannerMovies.length > 1 && (
          <>
            <button className="hero-edge-control hero-edge-prev" type="button" onClick={showPreviousBanner} aria-label="Phim trước">‹</button>
            <button className="hero-edge-control hero-edge-next" type="button" onClick={showNextBanner} aria-label="Phim tiếp theo">›</button>
          </>
        )}
        {bannerMovies.length > 1 && (
          <div className="banner-dots showcase-dots">
            {bannerMovies.map((movie, index) => (
              <button
                className={index === activeBannerIndex ? 'active' : ''}
                key={`${movie.id || movie.name || 'banner-dot'}-${index}`}
                type="button"
                onClick={() => setActiveBannerIndex(index)}
                aria-label={`Chuyển đến ${movie.name}`}
                style={index === activeBannerIndex ? { '--banner-duration': `${bannerDuration}ms` } : undefined}
              />
            ))}
          </div>
        )}
      </section>

      <section className="content-rail home-stack">
        {continueMovies.length > 0 && <ContinueStrip movies={continueMovies} />}

        {movieGroups.popular.length > 0 && (
          <MovieSlider title="Phim thịnh hành" movies={movieGroups.popular} seeMoreTo={sectionLinks.popular} />
        )}

        <CategoryStrip />

        {movieGroups.latest.length > 0 && (
          <MovieSlider title="Mới cập nhật" movies={movieGroups.latest} seeMoreTo={sectionLinks.latest} />
        )}
        {movieGroups.series.length > 0 && (
          <MovieSlider title="Phim bộ đang hot" movies={movieGroups.series} seeMoreTo={sectionLinks.series} />
        )}
        {movieGroups.single.length > 0 && (
          <MovieSlider title="Phim lẻ đáng xem" movies={movieGroups.single} seeMoreTo={sectionLinks.single} />
        )}
        {movieGroups.rating.length > 0 && (
          <MovieSlider title="Điểm cao nổi bật" movies={movieGroups.rating} seeMoreTo={sectionLinks.rating} />
        )}
      </section>
    </main>
  );
}

function ContinueStrip({ movies }) {
  return (
    <section className="home-continue-strip" aria-label="Tiếp tục xem">
      <div className="section-heading">
        <h2>Tiếp tục xem</h2>
      </div>
      <div className="continue-strip-row">
        {movies.map((movie, index) => (
          <Link className="continue-strip-card" to={`/watch/${movie.id}`} key={`${movie.id || movie.name}-continue`}>
            <span className="continue-strip-art">
              {movie.banner || movie.poster ? <img src={movie.banner || movie.poster} alt="" /> : <i>{movie.name?.charAt(0) || 'M'}</i>}
              <b aria-hidden="true">▶</b>
            </span>
            <strong>{movie.name}</strong>
            <small>{movie.year || movie.status || 'Đang xem'}</small>
            <em><span style={{ width: `${Math.min(26 + index * 13, 82)}%` }} /></em>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoryStrip() {
  return (
    <section className="home-category-strip" aria-label="Thể loại phổ biến">
      <div className="section-heading">
        <h2>Thể loại phổ biến</h2>
      </div>
      <div className="category-strip-row">
        {categoryTiles.map((category, index) => (
          <Link className="category-tile" to={category.to} key={category.label} style={{ '--category-index': index }}>
            <span>{category.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Home;
