import axiosClient from './axiosClient.js';

export const genreApi = {
  list: () => axiosClient.get('/catalog/genres'),
  countries: () => axiosClient.get('/catalog/countries'),
  create: (data) => axiosClient.post('/admin/genres', data)
};
