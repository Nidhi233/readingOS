import api from './api';

export const booksService = {
  getLibrary: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/library', { params });
    return response.data.books;
  },

  addBook: async (bookData) => {
    const response = await api.post('/library/books', bookData);
    return response.data.book;
  },

  getBookDetail: async (id) => {
    const response = await api.get(`/library/books/${id}`);
    return response.data.book;
  },

  updateBook: async (id, updates) => {
    const response = await api.patch(`/library/books/${id}`, updates);
    return response.data.book;
  },

  deleteBook: async (id) => {
    const response = await api.delete(`/library/books/${id}`);
    return response.data;
  },
};