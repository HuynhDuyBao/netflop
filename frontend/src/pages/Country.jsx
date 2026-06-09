import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MovieSlider from '../components/MovieSlider.jsx';
import { genreApi } from '../services/genreApi.js';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from '../utils/normalizeMovie.js';
import { slugify } from '../utils/slugify.js';

function Country() {
  const { slug } = useParams();
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCountryMovies() {
      setLoading(true);
      setError('');

      try {
        const countryResponse = await genreApi.countries();
        const nextCountries = countryResponse.data.data || [];
        const country = nextCountries.find((item) => slugify(item.TenQuocGia) === slug || String(item.MaQuocGia) === slug);
        setCountries(nextCountries);
        setSelectedCountry(country || null);

        if (!country) {
          setMovies([]);
          return;
        }

        const movieResponse = await movieApi.list({ countryId: country.MaQuocGia, limit: 24, sort: 'latest' });
        setMovies(normalizeMovies(movieResponse.data.data || []));
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Không tải được phim theo quốc gia.');
      } finally {
        setLoading(false);
      }
    }

    loadCountryMovies();
  }, [slug]);

  if (loading) {
    return <main className="page"><div className="loading">Đang tải...</div></main>;
  }

  return (
    <main className="page">
      <h1>Quốc gia: {selectedCountry?.TenQuocGia || slug}</h1>
      {error && <p className="form-error">{error}</p>}
      {!selectedCountry && (
        <div className="quick-tabs">
          {countries.map((country) => <Link className="button secondary" key={country.MaQuocGia} to={`/country/${slugify(country.TenQuocGia)}`}>{country.TenQuocGia}</Link>)}
        </div>
      )}
      {selectedCountry && movies.length === 0 && <p>Chưa có phim nào trong quốc gia này.</p>}
      {selectedCountry && <MovieSlider title={selectedCountry.TenQuocGia} movies={movies} />}
    </main>
  );
}

export default Country;
