import axiosClient from './axiosClient.js';

export const notificationApi = {
  public: (params) => axiosClient.get('/notifications/public', { params }),
  adminList: (params) => axiosClient.get('/admin/notifications', { params }),
  create: (data) => axiosClient.post('/admin/notifications', data),
  delete: (id) => axiosClient.delete(`/admin/notifications/${id}`)
};
