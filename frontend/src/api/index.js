import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export const getBoards = () => api.get('/boards');
export const createBoard = (data) => api.post('/boards', data);
export const updateBoard = (id, data) => api.put(`/boards/${id}`, data);
export const getBoard = (id) => api.get(`/boards/${id}`);

export const createList = (data) => api.post('/lists', data);
export const updateList = (id, data) => api.put(`/lists/${id}`, data);
export const deleteList = (id) => api.delete(`/lists/${id}`);
export const reorderLists = (lists) => api.put('/lists/reorder/batch', { lists });

export const createCard = (data) => api.post('/cards', data);
export const getCard = (id) => api.get(`/cards/${id}`);
export const updateCard = (id, data) => api.put(`/cards/${id}`, data);
export const deleteCard = (id) => api.delete(`/cards/${id}`);
export const reorderCards = (cards) => api.put('/cards/reorder/batch', { cards });
export const searchCards = (params) => api.get('/cards/search/query', { params });

export const addCardLabel = (cardId, labelId) => api.post(`/cards/${cardId}/labels`, { label_id: labelId });
export const removeCardLabel = (cardId, labelId) => api.delete(`/cards/${cardId}/labels/${labelId}`);

export const addCardMember = (cardId, memberId) => api.post(`/cards/${cardId}/members`, { member_id: memberId });
export const removeCardMember = (cardId, memberId) => api.delete(`/cards/${cardId}/members/${memberId}`);

export const addChecklist = (cardId, title) => api.post(`/cards/${cardId}/checklists`, { title });
export const deleteChecklist = (cardId, clId) => api.delete(`/cards/${cardId}/checklists/${clId}`);
export const addChecklistItem = (cardId, clId, text) => api.post(`/cards/${cardId}/checklists/${clId}/items`, { text });
export const updateChecklistItem = (cardId, clId, itemId, data) => api.put(`/cards/${cardId}/checklists/${clId}/items/${itemId}`, data);
export const deleteChecklistItem = (cardId, clId, itemId) => api.delete(`/cards/${cardId}/checklists/${clId}/items/${itemId}`);

export const addComment = (cardId, data) => api.post(`/cards/${cardId}/comments`, data);

export const getMembers = () => api.get('/members');
