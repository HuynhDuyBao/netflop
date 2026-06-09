import { useState } from 'react';
import { tmdbApi } from '../../services/tmdbApi.js';
import { movieApi } from '../../services/movieApi.js';

function TmdbImport() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');

  async function handleSearch(event) {
    event.preventDefault();
    const response = await tmdbApi.search({ query, type: 'movie' });
    setMovies(response.data.data || []);
  }

  async function handleImport(movie) {
    const response = await tmdbApi.importMovie({ tmdbId: movie.tmdbId, type: movie.mediaType || 'movie' });
    setSelected(response.data.data);
    setMessage('Đã lấy thông tin phim từ TMDB.');
  }

  async function handleSave() {
    if (!selected) return;
    await movieApi.create({
      name: selected.name,
      title: selected.title,
      description: selected.description,
      content: selected.content,
      duration: selected.duration,
      year: selected.year,
      rating: selected.rating,
      poster: selected.poster,
      banner: selected.banner,
      isPublished: false,
      genreIds: []
    });
    setMessage('Đã lưu phim vào database.');
  }

  return (
    <section className="admin-page">
      <h1>Import phim từ TMDb</h1>
      <form className="admin-form" onSubmit={handleSearch}>
        <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên phim" />
        <button className="button" type="submit">Tìm trên TMDb</button>
      </form>
      {message && <p>{message}</p>}
      <div className="admin-list">
        {movies.map((movie) => (
          <button className="admin-row" key={movie.tmdbId} type="button" onClick={() => handleImport(movie)}>
            <span>{movie.title}</span>
            <span>{movie.year || 'N/A'}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="admin-preview">
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
          <button className="button" type="button" onClick={handleSave}>Lưu phim</button>
        </div>
      )}
    </section>
  );
}

export default TmdbImport;
