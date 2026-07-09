import axiosClient from './axiosClient.js';

export const authApi = {
  config: () => axiosClient.get('/auth/config'),
  login: (data) => axiosClient.post('/auth/login', data),
  register: (data) => axiosClient.post('/auth/register', data),
  confirm: (data) => axiosClient.post('/auth/confirm', data),
  resendCode: (data) => axiosClient.post('/auth/resend-code', data),
  challenge: (data) => axiosClient.post('/auth/challenge', data),
  socialUrl: (params) => axiosClient.get('/auth/social-url', { params }),
  hostedUrl: (params) => axiosClient.get('/auth/hosted-url', { params }),
  logoutUrl: () => axiosClient.get('/auth/logout-url'),
  socialCallback: (data) => axiosClient.post('/auth/social-callback', data),
  me: () => axiosClient.get('/auth/me'),
  updateMe: (data) => axiosClient.patch('/auth/me', data),
  changePassword: (data) => axiosClient.patch('/auth/me/password', data),
  myComments: (params) => axiosClient.get('/auth/me/comments', { params }),
  myRatings: (params) => axiosClient.get('/auth/me/ratings', { params })
};
