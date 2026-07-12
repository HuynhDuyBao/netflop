import { Link } from 'react-router-dom';
import MovieCard from './MovieCard.jsx';

function getMovieKey(movie, index) {
  return `${movie?.id || movie?.MaPhim || movie?.slug || movie?.name || 'movie'}-${index}`;
}

function MovieSlider({ title = 'Phim nổi bật', movies = [], seeMoreTo = '' }) {
  return (
    <section className="movie-section">
      <div className="section-heading">
        <h2>{title}</h2>
        {seeMoreTo && <Link className="section-more-link" to={seeMoreTo}>Xem thêm</Link>}
      </div>
      <div className="movie-row">
        {movies.map((movie, index) => (
          <MovieCard key={getMovieKey(movie, index)} movie={movie} />
        ))}
      </div>
    </section>
  );
}

export default MovieSlider;
