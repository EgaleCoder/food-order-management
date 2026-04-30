import api from '../api/axiosInstance';

export const fetchMenuItems = () => api.get('/menu').then((r) => r.data.data);

export const fetchMenuItemById = (id) => api.get(`/menu/${id}`).then((r) => r.data.data);
