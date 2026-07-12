import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard.jsx';
import MovieSlider from '../components/MovieSlider.jsx';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

const sectionConfigs = [
  { title: 'Mới cập nhật', params: { sort: 'latest', limit: 24 }, seeMoreTo: '/movies?sort=latest' },
  { title: 'Xem nhiều', params: { sort: 'popular', limit: 24 }, seeMoreTo: '/movies?sort=popular' },
  { title: 'Đánh giá cao', params: { sort: 'rating', limit: 24 }, seeMoreTo: '/movies?sort=rating' },
  { title: 'Năm mới', params: { sort: 'year', limit: 24 }, seeMoreTo: '/movies?sort=year' }
];

const sortTitles = {
  latest: 'Mới cập nhật',
  popular: 'Xem nhiều',
  rating: 'Đánh giá cao',
  year: 'Năm mới'
};

function getValidType(type) {
  return type === 'Bộ' || type === 'Lẻ' ? type : '';
}

function getValidSort(sort) {
  return Object.prototype.hasOwnProperty.call(sortTitles, sort) ? sort : '';
}

function MovieList() {
  const [searchParams] = useSearchParams();
  const validType = getValidType(searchParams.get('type') || '');
  const validSort = getValidSort(searchParams.get('sort') || '');
  const focusedMode = Boolean(validType || validSort);
  const [movieSections, setMovieSections] = useState([]);
  const [movies, setMovies] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => {
    if (validType) return `Phim ${validType.toLowerCase()}`;
    if (validSort) return sortTitles[validSort];
    return 'Danh sách phim';
  }, [validSort, validType]);

  useEffect(() => {
    setPage(1);
  }, [validSort, validType]);

  useEffect(() => {
    let ignore = false;

    async function loadMovies() {
      setLoading(true);
      setError('');

      try {
        if (focusedMode) {
          const response = await movieApi.list({
            limit: 24,
            page: 1,
            sort: validSort || 'latest',
            ...(validType ? { type: validType } : {})
          });

          if (ignore) return;

          setMovies(normalizeMovies(response.data.data || []));
          setMeta(response.data.meta || null);
          setMovieSections([]);
          return;
        }

        const responses = await Promise.all(sectionConfigs.map((section) => movieApi.list(section.params)));

        if (ignore) return;

        setMovieSections(responses.map((response, index) => ({
          title: sectionConfigs[index].title,
          movies: normalizeMovies(response.data.data || []),
          seeMoreTo: sectionConfigs[index].seeMoreTo
        })));
        setMovies([]);
        setMeta(null);
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.response?.data?.message || 'Không tải được danh sách phim.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      ignore = true;
    };
  }, [focusedMode, validSort, validType]);

  async function loadMore() {
    if (!focusedMode || loadingMore || !meta || page >= meta.totalPages) {
      return;
    }

    const nextPage = page + 1;
    setLoadingMore(true);
    setError('');

    try {
      const response = await movieApi.list({
        limit: meta.limit || 24,
        page: nextPage,
        sort: validSort || 'latest',
        ...(validType ? { type: validType } : {})
      });

      setMovies((currentMovies) => [
        ...currentMovies,
        ...normalizeMovies(response.data.data || [])
      ]);
      setMeta(response.data.meta || meta);
      setPage(response.data.meta?.page || nextPage);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không tải thêm được phim.');
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return <main className="page"><div className="loading">Đang tải...</div></main>;
  }

  const hasMore = focusedMode && meta && page < meta.totalPages;

  return (
    <main className="page movie-list-page">
      <h1>{title}</h1>
      {error && <p className="form-error">{error}</p>}

      {focusedMode ? (
        <>
          {!error && movies.length === 0 && <p>Chưa có phim nào được xuất bản.</p>}
          <div className="movie-grid-list">
            {movies.map((movie, index) => (
              <MovieCard key={`${movie.id || movie.MaPhim || movie.name || 'movie'}-${index}`} movie={movie} />
            ))}
          </div>
          {hasMore && (
            <div className="movie-list-actions">
              <button className="section-more-link" type="button" disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? 'Đang tải...' : 'Tải thêm'}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {!error && movieSections.every((section) => section.movies.length === 0) && <p>Chưa có phim nào được xuất bản.</p>}
          {movieSections.map((section) => (
            section.movies.length > 0 && (
              <MovieSlider
                key={section.title}
                title={section.title}
                movies={section.movies}
                seeMoreTo={section.seeMoreTo}
              />
            )
          ))}
        </>
      )}
    </main>
  );
}

export default MovieList;
