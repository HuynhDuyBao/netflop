import axiosClient from './axiosClient.js';

export const episodeApi = {
  list: (params) => axiosClient.get('/episodes', { params }),
  create: (data) => axiosClient.post('/episodes', data),
  update: (id, data) => axiosClient.patch(`/episodes/${id}`, data),
  remove: (id) => axiosClient.delete(`/episodes/${id}`),
  addSubtitle: (id, data) => axiosClient.post(`/episodes/${id}/subtitles`, data),
  removeSubtitle: (id, subtitleId) => axiosClient.delete(`/episodes/${id}/subtitles/${subtitleId}`)
};
