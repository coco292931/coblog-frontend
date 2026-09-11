import api from './index';

/**
 * 把表单状态组装成后端需要的文章 payload（创建 / 更新共用）
 * @param {Object} form - { title, subtitle, summary, cover_image, is_deep, hidden, no_stats }
 * @param {string} categoriesText - 逗号分隔的分类文本
 * @param {string} tagsText - 逗号分隔的标签文本
 * @param {'md'|'html'} contentType - 正文类型
 * @param {string} editorContent - 正文内容
 * @returns {Object}
 */
export const buildArticlePayload = (form, categoriesText, tagsText, contentType, editorContent) => {
  // 逗号（中英文）分隔 -> 去空白数组 -> JSON 数组字符串
  const splitList = (text) =>
    (text || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean);

  const payload = {
    title: (form.title || '').trim(),
    subtitle: (form.subtitle || '').trim(),
    summary: (form.summary || '').trim(),
    cover_image: (form.cover_image || '').trim(),
    category: JSON.stringify(splitList(categoriesText)),
    tags: JSON.stringify(splitList(tagsText)),
    is_deep: !!form.is_deep,
    hidden: !!form.hidden,
    no_stats: !!form.no_stats,
  };

  if (contentType === 'md') {
    payload.md_content = editorContent;
  } else {
    payload.content = editorContent;
  }

  return payload;
};

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
 * @param {boolean} data.hidden - 是否对所有人隐藏
 * @param {boolean} data.no_stats - 是否不计入站点统计
 * @returns {Promise}
 */
export const createArticle = (data) => {
  return api.post('/api/articles', data);
};

/**
 * 获取文章原文（含 Markdown），供编辑回填
 * @param {string|number} id - 文章 ID
 * @returns {Promise}
 */
export const getArticleForEdit = (id) => {
  return api.get(`/api/articles/${id}/edit`);
};

/**
 * 更新文章（整体替换，PUT 语义）
 * @param {string|number} id - 文章 ID
 * @param {Object} data - 与创建文章相同的字段结构
 * @returns {Promise}
 */
export const updateArticle = (id, data) => {
  return api.put(`/api/articles/${id}`, data);
};

/**
 * 删除文章
 * @param {string|number} id - 文章 ID
 * @returns {Promise}
 */
export const deleteArticle = (id) => {
  return api.delete(`/api/articles/${id}`);
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
