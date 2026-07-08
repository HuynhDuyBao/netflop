import axiosClient from './axiosClient.js';

export const uploadApi = {
  uploadMedia: (formData) => axiosClient.post('/uploads/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  uploadVideo: (formData) => axiosClient.post('/uploads/videos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  syncVideoStatus: (episodeId) => axiosClient.post(`/uploads/videos/${episodeId}/sync`)
};
