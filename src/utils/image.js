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
