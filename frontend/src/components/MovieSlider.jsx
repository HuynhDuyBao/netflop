import { Link } from 'react-router-dom';
import MovieCard from './MovieCard.jsx';

function MovieSlider({ title = 'Phim nổi bật', movies = [], seeMoreTo = '' }) {
  return (
    <section className="movie-section">
      <div className="section-heading">
        <h2>{title}</h2>
        {seeMoreTo && <Link className="section-more-link" to={seeMoreTo}>Xem thêm</Link>}
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
