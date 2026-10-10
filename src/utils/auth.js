/**
 * 认证工具模块
 * 统一管理Token和用户认证状态
 */

const TOKEN_KEY = 'token';
const RSS_TOKEN_KEY = 'rss_token';

// 后端根地址（与 api/index.js 的 baseURL 同源配置）
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

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
  localStorage.removeItem(RSS_TOKEN_KEY);
  sessionStorage.removeItem(RSS_TOKEN_KEY);

  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY); // 避免重复存储
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * 替换认证Token，沿用原来的存储位置（改密后后端会换发新 token，旧的随即失效）
 * @param {string} token - 新 Token
 */
export const replaceToken = (token) => {
  if (localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * 移除认证Token（登出 / 登录失效）
 */
export const removeToken = () => {
  // 先取出再删：登出接口要靠它把这个 token 在服务端吊销
  const token = getToken();

  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(RSS_TOKEN_KEY);
  sessionStorage.removeItem(RSS_TOKEN_KEY);

  if (API_BASE) {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: token } : {},
    }).catch(() => {});
  }
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
  sessionStorage.removeItem(RSS_TOKEN_KEY);
};
