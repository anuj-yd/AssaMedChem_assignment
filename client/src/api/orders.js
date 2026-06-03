import api from './axios';

export const getOrders         = (params) => api.get('/orders', { params });
export const getOrder          = (id)     => api.get(`/orders/${id}`);
export const createOrder       = (data)   => api.post('/orders', data);
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);
export const cancelOrder       = (id)     => api.patch(`/orders/${id}/cancel`);
export const getOrderStats     = ()       => api.get('/orders/stats');
