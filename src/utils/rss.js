import { getRSSToken, isAuthenticated } from './auth.js';

export const getRSSUrl = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const rssURL = new URL('/api/rss', baseURL);

  if (isAuthenticated()) {
    const rssToken = getRSSToken();
    if (rssToken) {
      rssURL.searchParams.set('token', rssToken);
    }
  }

  return rssURL.toString();
};
