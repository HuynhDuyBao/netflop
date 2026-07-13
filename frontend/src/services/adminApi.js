import axiosClient from './axiosClient.js';

export const adminApi = {
  dashboard: async (params) => {
    const response = await axiosClient.get('/admin/dashboard', { params });
    return response.data.data;
  },
  users: (params) => axiosClient.get('/admin/users', { params }),
  updateUserRole: (id, role) => axiosClient.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id, status) => axiosClient.patch(`/admin/users/${id}/status`, { status }),
  movies: (params) => axiosClient.get('/admin/movies', { params }),
  movie: (id) => axiosClient.get(`/admin/movies/${id}`),
  createMovie: (data) => axiosClient.post('/admin/movies', data),
  updateMovie: (id, data) => axiosClient.patch(`/admin/movies/${id}`, data),
  deleteMovie: (id) => axiosClient.delete(`/admin/movies/${id}`),
  genres: () => axiosClient.get('/catalog/genres'),
  countries: () => axiosClient.get('/catalog/countries'),
  createGenre: (name) => axiosClient.post('/admin/genres', { name }),
  updateGenre: (id, name) => axiosClient.patch(`/admin/genres/${id}`, { name }),
  deleteGenre: (id) => axiosClient.delete(`/admin/genres/${id}`),
  comments: (params) => axiosClient.get('/comments', { params }),
  ratings: (params) => axiosClient.get('/ratings', { params }),
  contacts: (params) => axiosClient.get('/admin/contacts', { params }),
  updateContactStatus: (id, status) => axiosClient.patch(`/admin/contacts/${id}/status`, { status })
};
