import axiosClient from './axiosClient.js';

export const personApi = {
  detail: (id) => axiosClient.get(`/people/${id}`)
};
