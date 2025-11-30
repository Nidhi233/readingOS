import api from './api';

export const aiService = {
  getConversations: async () => {
    const response = await api.get('/ai/conversations');
    return response.data.conversations;
  },

  createConversation: async (bookId, title) => {
    const response = await api.post('/ai/conversations', { bookId, title });
    return response.data.conversation;
  },

  getConversation: async (id) => {
    const response = await api.get(`/ai/conversations/${id}`);
    return response.data;
  },

  sendMessage: async (conversationId, content) => {
    const response = await api.post(`/ai/conversations/${conversationId}/messages`, { content });
    return response.data;
  },

  deleteConversation: async (id) => {
    const response = await api.delete(`/ai/conversations/${id}`);
    return response.data;
  },
};