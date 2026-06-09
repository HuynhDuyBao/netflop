import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MovieSlider from '../components/MovieSlider.jsx';
import { genreApi } from '../services/genreApi.js';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';
import { slugify } from '../utils/slugify.js';

function Genre() {
  const { slug } = useParams();
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadGenreMovies() {
      setLoading(true);
      setError('');

      try {
        const genreResponse = await genreApi.list();
        const nextGenres = genreResponse.data.data || [];
        const genre = nextGenres.find((item) => slugify(item.TenTheLoai) === slug || String(item.MaTheLoai) === slug);
        setGenres(nextGenres);
        setSelectedGenre(genre || null);

        if (!genre) {
          setMovies([]);
          return;
        }

        const movieResponse = await movieApi.list({ genreId: genre.MaTheLoai, limit: 24, sort: 'latest' });
        setMovies(normalizeMovies(movieResponse.data.data || []));
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Không tải được phim theo thể loại.');
      } finally {
        setLoading(false);
      }
    }

    loadGenreMovies();
  }, [slug]);

  if (loading) {
    return <main className="page"><div className="loading">Đang tải...</div></main>;
  }

  return (
    <main className="page">
      <h1>Thể loại: {selectedGenre?.TenTheLoai || slug}</h1>
      {error && <p className="form-error">{error}</p>}
      {!selectedGenre && (
        <div className="quick-tabs">
          {genres.map((genre) => <Link className="button secondary" key={genre.MaTheLoai} to={`/genre/${slugify(genre.TenTheLoai)}`}>{genre.TenTheLoai}</Link>)}
        </div>
      )}
      {selectedGenre && movies.length === 0 && <p>Chưa có phim nào trong thể loại này.</p>}
      {selectedGenre && <MovieSlider title={selectedGenre.TenTheLoai} movies={movies} />}
    </main>
  );
}

export default Genre;
