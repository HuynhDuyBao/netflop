import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieSlider from '../components/MovieSlider.jsx';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

const sections = [
  { title: 'Mới cập nhật', params: { sort: 'latest', limit: 24 } },
  { title: 'Xem nhiều', params: { sort: 'popular', limit: 24 } },
  { title: 'Đánh giá cao', params: { sort: 'rating', limit: 24 } },
  { title: 'Năm mới', params: { sort: 'year', limit: 24 } }
];

function MovieList() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const validType = type === 'Bộ' || type === 'Lẻ' ? type : '';
  const [movieSections, setMovieSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMovies() {
      try {
        const responses = await Promise.all(sections.map((section) => movieApi.list({
          ...section.params,
          ...(validType ? { type: validType } : {})
        })));
        setMovieSections(responses.map((response, index) => ({
          title: sections[index].title,
          movies: normalizeMovies(response.data.data || [])
        })));
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Không tải được danh sách phim.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [validType]);

  if (loading) {
    return <main className="page"><div className="loading">Đang tải...</div></main>;
  }

  return (
    <main className="page">
      <h1>{validType ? `Phim ${validType.toLowerCase()}` : 'Danh sách phim'}</h1>
      {error && <p className="form-error">{error}</p>}
      {!error && movieSections.every((section) => section.movies.length === 0) && <p>Chưa có phim nào được xuất bản.</p>}
      {movieSections.map((section) => (
        section.movies.length > 0 && <MovieSlider key={section.title} title={section.title} movies={section.movies} />
      ))}
    </main>
  );
}

export default MovieList;
