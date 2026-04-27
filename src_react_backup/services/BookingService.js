import apiClient from '../api/apiClient';

const BookingService = {
  create: async (data) => {
    const response = await apiClient.post('/Booking', data);
    return response.data;
  },

  getManagement: async (params = {}) => {
    const response = await apiClient.get('/Booking/management', { params });
    return response.data;
  },

  getByPnr: async (pnr) => {
    const response = await apiClient.get(`/Booking/${pnr}`);
    return response.data;
  },

  getMyBookings: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get('/Booking/my-bookings', { params: { page, pageSize } });
    return response.data;
  },

  getDetailById: async (id) => {
    const response = await apiClient.get(`/Booking/detail/${id}`);
    return response.data;
  },

  cancel: async (data) => {
    await apiClient.post('/Booking/cancel', data);
  }
};

export default BookingService;
