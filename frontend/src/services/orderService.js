import api from '../api/axiosInstance';

export const placeOrder = (orderData) => api.post('/orders', orderData).then((r) => r.data.data);

export const fetchOrderById = (id) => api.get(`/orders/${id}`).then((r) => r.data.data);

export const fetchAllOrders = () => api.get('/orders').then((r) => r.data.data);

export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data.data);
