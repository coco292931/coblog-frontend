import api from './index';

/**
 * 创建（发表）文章
 * @param {Object} data - 文章数据
 * @param {string} data.title - 标题（必填）
 * @param {string} data.subtitle - 副标题
 * @param {string} data.summary - 摘要
 * @param {string} data.cover_image - 封面图 URL
 * @param {string} data.content - 富文本(HTML)正文，html 模式时使用
 * @param {string} data.md_content - Markdown 正文，md 模式时使用
 * @param {string} data.category - 分类，JSON 数组字符串，如 '["技术"]'
 * @param {string} data.tags - 标签，JSON 数组字符串
 * @param {boolean} data.is_deep - 是否为深度文章
 * @returns {Promise}
 */
export const createArticle = (data) => {
  return api.post('/api/articles', data);
};

/**
 * 上传图片，返回可访问的图片 URL
 * @param {File} file - 图片文件
 * @returns {Promise}
 */
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 图片压缩可能耗时较长，单独放宽到 2 分钟
  });
};

/**
 * Markdown 预览：将 Markdown 转换为 HTML（与后端渲染保持一致）
 * @param {string} markdown - Markdown 文本
 * @returns {Promise}
 */
export const renderMarkdown = (markdown) => {
  return api.post('/api/markdown/render', { markdown });
};
