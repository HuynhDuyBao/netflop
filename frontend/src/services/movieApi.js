import axiosClient from './axiosClient.js';

export const movieApi = {
  list: (params) => axiosClient.get('/movies', { params }),
  detail: (id) => axiosClient.get(`/movies/${id}`),
  episodes: (id) => axiosClient.get(`/movies/${id}/episodes`),
  comments: (id, params) => axiosClient.get(`/movies/${id}/comments`, { params }),
  createComment: (id, data) => axiosClient.post(`/movies/${id}/comments`, data),
  deleteComment: (id, commentId) => axiosClient.delete(`/movies/${id}/comments/${commentId}`),
  favorites: (params) => axiosClient.get('/me/favorites', { params }),
  history: (params) => axiosClient.get('/me/history', { params }),
  addFavorite: (id) => axiosClient.post(`/movies/${id}/favorite`),
  removeFavorite: (id) => axiosClient.delete(`/movies/${id}/favorite`),
  rate: (id, data) => axiosClient.post(`/movies/${id}/rating`, data),
  trackView: (id) => axiosClient.post(`/movies/${id}/view`),
  saveHistory: (id, data) => axiosClient.post(`/movies/${id}/history`, data),
  create: (data) => axiosClient.post('/admin/movies', data),
  update: (id, data) => axiosClient.patch(`/admin/movies/${id}`, data),
  remove: (id) => axiosClient.delete(`/admin/movies/${id}`)
};
