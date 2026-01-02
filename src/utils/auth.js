/**
 * 认证工具模块
 * 统一管理Token和用户认证状态
 */

const TOKEN_KEY = 'token';
const RSS_TOKEN_KEY = 'rss_token';

/**
 * 获取认证Token
 * 优先从localStorage获取，其次从sessionStorage
 * @returns {string|null} Token字符串或null
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

/**
 * 设置认证Token
 * @param {string} token - JWT Token
 * @param {boolean} rememberMe - 是否持久化存储（记住我）
 */
export const setToken = (token, rememberMe = false) => {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY); // 避免重复存储
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * 移除认证Token（登出）
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * 获取RSS订阅Token
 * @returns {string|null}
 */
export const getRSSToken = () => {
  return localStorage.getItem(RSS_TOKEN_KEY);
};

/**
 * 设置RSS订阅Token
 * @param {string} token - RSS Token
 */
export const setRSSToken = (token) => {
  localStorage.setItem(RSS_TOKEN_KEY, token);
};

/**
 * 移除RSS订阅Token
 */
export const removeRSSToken = () => {
  localStorage.removeItem(RSS_TOKEN_KEY);
};
