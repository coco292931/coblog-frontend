/**
 * 全局轻提示（Toast）
 *
 * 用途：上传进度、成功/失败等需要「醒目且自动消失」的反馈。
 *
 * 用法：
 *   import { toast } from '@/composables/useToast.js';
 *   toast.success('上传成功');
 *   const id = toast.loading('上传中…');   // 返回 id，可后续更新
 *   toast.update(id, { type: 'success', text: '完成' });
 */
import { ref } from 'vue';

// 供 AppToast.vue 渲染
const toasts = ref([]);
export { toasts };

let seed = 0;

// 默认停留时长：成功/提示短一些，错误留久一点方便看清
const DEFAULT_DURATION = {
    success: 2200,
    info: 2600,
    warning: 3600,
    error: 4600,
    loading: 0, // 0 表示不自动消失，需手动更新为其它类型
};

const remove = (id) => {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
        toasts.value.splice(idx, 1);
    }
};

// 供 AppToast.vue 点击关闭
export const dismissToast = remove;

const showToast = (text, type = 'info', duration) => {
    const id = ++seed;
    const ms = duration ?? DEFAULT_DURATION[type] ?? 2600;

    // 同时最多保留 4 条，超出时移除最早的，避免刷屏
    if (toasts.value.length >= 4) {
        toasts.value.shift();
    }

    toasts.value.push({ id, text, type, timer: null });

    if (ms > 0) {
        const entry = toasts.value.find((t) => t.id === id);
        entry.timer = setTimeout(() => remove(id), ms);
    }

    return id;
};

/** 更新已有提示的内容/类型（常用于把「上传中」改成「上传成功」） */
const updateToast = (id, { text, type = 'success', duration } = {}) => {
    const entry = toasts.value.find((t) => t.id === id);
    if (!entry) return;

    if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
    }

    if (text !== undefined) entry.text = text;
    entry.type = type;

    const ms = duration ?? DEFAULT_DURATION[type] ?? 2200;
    if (ms > 0) {
        entry.timer = setTimeout(() => remove(id), ms);
    }
};

export const toast = {
    success: (text, duration) => showToast(text, 'success', duration),
    error: (text, duration) => showToast(text, 'error', duration),
    warning: (text, duration) => showToast(text, 'warning', duration),
    info: (text, duration) => showToast(text, 'info', duration),
    loading: (text) => showToast(text, 'loading', 0),
    update: updateToast,
};
