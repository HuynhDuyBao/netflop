import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MovieWizard, { emptyMovieWizardForm } from '../components/MovieWizard.jsx';
import { adminApi } from '../../services/adminApi.js';

function mapMovieToForm(movie) {
  return {
    ...emptyMovieWizardForm,
    tmdbId: movie.tmdb_id || null,
    tmdbType: movie.tmdb_type || 'movie',
    name: movie.TenPhim || '',
    title: movie.TieuDe || '',
    description: movie.MoTa || '',
    content: movie.NoiDung || '',
    duration: movie.ThoiLuong || '',
    year: movie.NamPhatHanh || '',
    rating: movie.DanhGia || 0,
    views: movie.LuotXem || 0,
    status: movie.TinhTrang || emptyMovieWizardForm.status,
    type: movie.PhanLoai || emptyMovieWizardForm.type,
    poster: movie.HinhAnh || '',
    banner: movie.HinhAnhBanner || '',
    link: movie.TrailerURL || movie.Link || '',
    trailerKey: movie.TrailerYoutubeKey || '',
    videoUrl: movie.Link || '',
    hlsMasterUrl: movie.hls_master_url || '',
    countryId: movie.MaQuocGia || '',
    isPublished: Boolean(movie.is_published),
    genreIds: (movie.the_loai || []).map((genre) => genre.MaTheLoai),
    cast: (movie.dien_vien || []).map((person) => ({
      tmdbId: person.tmdb_id || null,
      name: person.TenDienVien || '',
      character: person.TenNhanVat || '',
      profile: person.HinhAnh || ''
    })),
    directors: (movie.dao_dien || []).map((person) => ({
      tmdbId: person.tmdb_id || null,
      name: person.TenDaoDien || '',
      job: person.VaiTro || 'Đạo diễn',
      profile: person.HinhAnh || ''
    }))
  };
}

function MovieEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyMovieWizardForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMovie() {
      try {
        const response = await adminApi.movie(id);
        setForm(mapMovieToForm(response.data.data));
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  async function updateMovie(payload) {
    await adminApi.updateMovie(id, payload);
    const response = await adminApi.movie(id);
    setForm(mapMovieToForm(response.data.data));
  }

  async function deleteMovie() {
    if (!window.confirm('Xóa phim này?')) return;
    await adminApi.deleteMovie(id);
    navigate('/admin/movies');
  }

  return (
    <MovieWizard
      initialForm={form}
      isEditing
      loading={loading}
      movieId={id}
      onDelete={deleteMovie}
      onSubmit={updateMovie}
      publicPath={`/movies/${id}`}
      title={`Chỉnh sửa phim #${id}`}
    />
  );
}

export default MovieEdit;
