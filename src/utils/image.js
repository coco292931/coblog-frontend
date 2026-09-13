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
