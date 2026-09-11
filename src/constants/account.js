/**
 * 账户安全相关的常量与校验
 * 供「找回密码」页与「我的」页复用，避免两处硬编码不一致。
 */

/** 邮箱验证码用途，需与后端 mailService.CodePurpose 保持一致 */
export const CODE_PURPOSE = {
    REGISTER: 'register',
    RESET: 'reset',
    CHANGE_PWD: 'change_pwd',
    LOGIN: 'login',
};

/** 新密码强度提示，与实际校验规则放在一起，避免文案与实现不符 */
export const PASSWORD_RULE_TEXT = '至少 6 位，建议同时包含字母与数字';

/** 校验新密码，返回错误文案；通过时返回空字符串 */
export const validateNewPassword = (password, confirmPassword) => {
    if (!password) return '请输入新密码';
    if (password.length < 6) return '新密码长度至少需要6位字符';
    if (password !== confirmPassword) return '两次输入的密码不一致，请重新输入';
    return '';
};
