import { useEffect, useState } from 'react';
import MovieSlider from '../components/MovieSlider.jsx';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';

function Search() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const response = await movieApi.list({ search: query.trim(), limit: 24, sort: query.trim() ? 'latest' : 'popular' });
        setMovies(normalizeMovies(response.data.data || []));
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Không tìm được phim.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <main className="page">
      <h1>Tìm kiếm</h1>
      <input
        className="input search-input-large"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Tìm tên phim, diễn viên, đạo diễn"
      />
      {error && <p className="form-error">{error}</p>}
      {loading ? <div className="loading">Đang tải...</div> : <MovieSlider title={query.trim() ? 'Kết quả tìm kiếm' : 'Phim gợi ý'} movies={movies} />}
      {!loading && !error && movies.length === 0 && <p>Không có phim phù hợp.</p>}
    </main>
  );
}

export default Search;
