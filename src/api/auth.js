import api from './index';

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @param {string} data.account - 账号(邮箱)
 * @param {string} data.password - 密码
 * @param {boolean} data.rememberMe - 记住我
 * @returns {Promise}
 */
export const login = (data) => {
  return api.post('/api/auth/login/combo', {
    account: data.account,
    password: data.password,
    rememberMe: data.rememberMe || false,
  })
};

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @param {string} data.account - 账号(邮箱)
 * @param {string} data.password - 密码
 * @param {string} data.username - 用户名
 * @returns {Promise}
 */
export const register = (data) => {
  return api.post('/api/auth/register', {
    email: data.account,
    password: data.password,
    username: data.username,
  })
};

/**
 * 获取用户信息
 * @returns {Promise}
 */
export const getUserInfo = () => {
  return api.get('/user/info/');
};

/**
 * 重发激活邮件
 * @param {string} email - 邮箱地址
 * @returns {Promise}
 */
export const resendActivationEmail = (email) => {
  return api.post('/api/auth/activate/resend', { email })
};
