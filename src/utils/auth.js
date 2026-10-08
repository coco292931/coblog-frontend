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
 * 移除认证Token（登出 / 登录失效）
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(RSS_TOKEN_KEY);
  sessionStorage.removeItem(RSS_TOKEN_KEY);

  // 登录时后端还会种一份 HttpOnly 的 cookie（供 /lite 这类后端直出的页面识别身份），
  // 那份 JS 删不掉，只能请后端清。不 await、不处理失败：
  // 本地已经清干净了，网络不通时也不应该让登出卡住。
  if (API_BASE) {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
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
