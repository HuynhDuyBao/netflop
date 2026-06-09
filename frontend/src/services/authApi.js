import axiosClient from './axiosClient.js';

export const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  register: (data) => axiosClient.post('/auth/register', data),
  me: () => axiosClient.get('/auth/me'),
  updateMe: (data) => axiosClient.patch('/auth/me', data),
  changePassword: (data) => axiosClient.patch('/auth/me/password', data),
  myComments: (params) => axiosClient.get('/auth/me/comments', { params }),
  myRatings: (params) => axiosClient.get('/auth/me/ratings', { params })
};
