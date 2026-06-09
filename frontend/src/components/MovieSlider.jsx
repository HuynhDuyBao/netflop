import MovieCard from './MovieCard.jsx';

function MovieSlider({ title = 'Phim nổi bật', movies = [] }) {
  return (
    <section className="movie-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <button type="button">Xem thêm</button>
      </div>
      <div className="movie-row">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}

export default MovieSlider;
