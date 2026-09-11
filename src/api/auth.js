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
  return api.get('/api/user/info/');
};

/**
 * 发送邮箱验证码
 * @param {string} email - 邮箱地址
 * @param {'register'|'reset'|'login'} purpose - 验证码用途
 * @returns {Promise}
 */
export const sendCode = (email, purpose) => {
  return api.post('/api/auth/code/send', { email, purpose });
};

/**
 * 通过邮箱验证码重置密码（找回密码，无需登录）
 * @param {Object} data
 * @param {string} data.email - 邮箱地址
 * @param {string} data.verificationCode - 验证码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise}
 */
export const resetPassword = (data) => {
  return api.post('/api/auth/pwd/reset', {
    email: data.email,
    verificationCode: data.verificationCode,
    newPassword: data.newPassword,
  });
};

/**
 * 修改密码（已登录）
 * @param {Object} data
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise}
 */
export const changePassword = (data) => {
  return api.put('/api/user/pwd/', {
    oldPassword: data.oldPassword,
    newPassword: data.newPassword,
  });
};

/**
 * 重置 RSS Token
 * @returns {Promise}
 */
export const resetRSSToken = () => {
  return api.put('/api/user/rst-rss/');
};

/**
 * 重发激活邮件
 * @param {string} email - 邮箱地址
 * @returns {Promise}
 */
export const resendActivationEmail = (email) => {
  return api.post('/api/auth/activate/resend', { email })
};
