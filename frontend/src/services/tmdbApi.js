import axiosClient from './axiosClient.js';

export const tmdbApi = {
  search: (params) => axiosClient.get('/tmdb/search', { params }),
  importMovie: (data) => axiosClient.post('/tmdb/import', data)
};
