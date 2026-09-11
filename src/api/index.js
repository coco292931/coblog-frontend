import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

// 后端业务错误码：登录态失效相关（见后台 common/exception/exceptionCodes.go）
// 1001 = 用户未登录，1006 = 用户登录无效
const AUTH_FAIL_CODES = [1001, 1006];

// 未登录时清理凭证并跳转登录页（带上 redirect 便于登录后回跳）
const redirectToLogin = () => {
  removeToken();
  // 使用动态导入router避免循环依赖
  import('../router').then(({ default: router }) => {
    const current = router.currentRoute.value.fullPath;
    if (current.startsWith('/login')) {
      return;
    }
    router.push({ path: '/login', query: { redirect: current } });
  });
};

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 使用封装的Token工具获取token
    const token = getToken();
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 后端业务错误统一返回 HTTP 200 + 业务 code，
    // 因此这里在成功分支上补一层登录态判断，但不改变返回结构，
    // 调用方仍可继续按 result.code 判断是否成功。
    const body = response.data;
    if (body && AUTH_FAIL_CODES.includes(body.code)) {
      redirectToLogin();
    }
    return body;
  },
  (error) => {
    // 处理错误
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除登录/RSS token 并跳转到登录页（兜底非统一错误中间件的路由）
          redirectToLogin();
          break;
        case 403:
          console.error('没有权限访问');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
        default:
          console.error('请求失败:', error.response.data.message || '未知错误');
      }
    } else if (error.request) {
      console.error('网络错误，请检查您的网络连接');
    } else {
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
