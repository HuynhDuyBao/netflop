import axiosClient from './axiosClient.js';

export const contactApi = {
  send: (data) => axiosClient.post('/contact', data)
};
