import { useNavigate } from 'react-router-dom';
import MovieWizard, { emptyMovieWizardForm } from '../components/MovieWizard.jsx';
import { adminApi } from '../../services/adminApi.js';

function MovieCreate() {
  const navigate = useNavigate();

  async function createMovie(payload) {
    const response = await adminApi.createMovie(payload);
    navigate(`/admin/movies/${response.data.data.MaPhim}/edit`);
  }

  return (
    <MovieWizard
      initialForm={emptyMovieWizardForm}
      onSubmit={createMovie}
      title="Thêm phim mới"
    />
  );
}

export default MovieCreate;
