/** 允许上传的图片扩展名（与后端按内容判定的格式一致：jpg / png / gif / webp） */
export const IMAGE_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

/** 给 <input accept> 用的写法，与上面的白名单保持一致 */
export const IMAGE_ACCEPT_ATTR = IMAGE_UPLOAD_EXTENSIONS.map((ext) => `.${ext}`).join(',');

/** 单张图片大小上限：10 MiB（与后端一致） */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * 校验待上传的图片：先卡扩展名，再看 MIME 与大小。
 * 扩展名白名单是第一道防线（挡掉 .svg / .html 等危险或非图片格式）。
 * @param {File} file
 * @returns {{ ok: true } | { ok: false, reason: 'ext'|'type'|'size', message: string }}
 */
export const validateImageFile = (file) => {
    if (!file) {
        return { ok: false, reason: 'type', message: '没有选择文件' };
    }

    const name = file.name || '';
    const hasExt = /\.[^.]+$/.test(name);
    const ext = hasExt ? name.split('.').pop().toLowerCase() : '';

    // 剪贴板粘贴的图可能没有文件名后缀，这种情况退化为 MIME 判断
    if (hasExt && !IMAGE_UPLOAD_EXTENSIONS.includes(ext)) {
        return {
            ok: false,
            reason: 'ext',
            message: `${name} 格式不支持，仅允许 ${IMAGE_UPLOAD_EXTENSIONS.join(' / ')}`,
        };
    }

    if (!file.type.startsWith('image/')) {
        return { ok: false, reason: 'type', message: `${name || '该文件'} 不是图片，已跳过` };
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return { ok: false, reason: 'size', message: `${name} 超过 10MB 上限` };
    }

    return { ok: true };
};

/**
 * 压缩图地址：本站上传的图由后端按 ?thumb=1 换成压缩图（没有则回退原图），
 * 外链图片原样返回。
 */
export const thumbUrl = (url) => {
    if (!url || !url.includes('/static/uploads/')) return url;
    return url + (url.includes('?') ? '&' : '?') + 'thumb=1';
};

/** 去掉压缩图参数拿回原图地址（与 thumbUrl 互逆） */
export const stripThumb = (url) => {
    if (!url || !url.includes('thumb=1')) return url;
    return url
        .replace(/([?&])thumb=1(?=&|$)/, '$1')
        .replace(/[?&]$/, '')
        .replace(/\?&/, '?');
};

/**
 * 探测某个地址实际返回的是压缩图还是原图：HEAD 读响应头 X-Image-Variant，零字节。
 * 结果（含进行中的 Promise）按地址记忆，避免同一张图反复打开灯箱就反复请求。
 * @param {string} probeUrl 带 ?thumb=1 的地址
 * @returns {Promise<boolean|null>} true=存在独立压缩图；null=探测失败（不缓存，下次可重试）
 */
const thumbVariantCache = new Map();

export const probeThumbVariant = (probeUrl) => {
    if (!probeUrl) return Promise.resolve(null);

    const cached = thumbVariantCache.get(probeUrl);
    if (cached) return cached;

    const pending = fetch(probeUrl, { method: 'HEAD', mode: 'cors', cache: 'no-cache' })
        .then((resp) => resp.headers.get('x-image-variant') === 'thumb')
        .catch(() => {
            // 失败不留在缓存里，否则一次网络抖动会让按钮永久消失
            thumbVariantCache.delete(probeUrl);
            return null;
        });

    thumbVariantCache.set(probeUrl, pending);
    return pending;
};
