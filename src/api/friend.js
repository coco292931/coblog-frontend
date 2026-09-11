import api from './index.js';

export const fetchFriendLinks = () => {
  return api.get('/api/friends');
};
