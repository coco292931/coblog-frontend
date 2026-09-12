<template>
    <Teleport to="body">
        <!-- 显式指定 duration：离开动画若被打断（如连点），
             transitionend 可能不再触发，Vue 会一直等待导致遮罩永久残留。
             指定 duration 后由定时器兜底移除元素。 -->
        <Transition name="lightbox" :duration="{ enter: 200, leave: 200 }">
            <div v-if="open" class="lightbox-mask" @click.self="close" @wheel.prevent="onWheel">
                <!-- 工具栏 -->
                <div class="lightbox-toolbar" @click.stop>
                    <button class="lb-btn" :disabled="scale <= MIN_SCALE" title="缩小" @click="zoomBy(-0.25)">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round">
                            <circle cx="11" cy="11" r="7"></circle>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                            <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                    <span class="lb-scale">{{ Math.round(scale * 100) }}%</span>
                    <button class="lb-btn" :disabled="scale >= MAX_SCALE" title="放大" @click="zoomBy(0.25)">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round">
                            <circle cx="11" cy="11" r="7"></circle>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                    <button class="lb-btn" title="重置" @click="resetScale">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round">
                            <path d="M3 12a9 9 0 1 0 3-6.7"></path>
                            <polyline points="3 4 3 9 8 9"></polyline>
                        </svg>
                    </button>
                    <span class="lb-divider"></span>
                    <!-- 原图切换：无独立原图（外链图片）时不显示 -->
                    <button v-if="hasDistinctOriginal" class="lb-btn lb-text-btn" :disabled="originalLoading"
                        :title="showingOriginal ? '查看压缩图' : '查看原图'" @click="toggleOriginal">
                        <span v-if="originalLoading" class="lb-spinner"></span>
                        <template v-else>{{ showingOriginal ? '压缩图' : '原图' }}</template>
                    </button>
                    <button class="lb-btn" :title="downloading ? '下载中…' : '下载原图'" :disabled="downloading"
                        @click="download">
                        <svg v-if="!downloading" viewBox="0 0 24 24" width="18" height="18" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span v-else class="lb-spinner"></span>
                    </button>
                    <button class="lb-btn lb-close" title="关闭 (Esc)" @click="close">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <!-- 单击关闭，按住拖动平移；两张图都留在 DOM 里，只切可见性 -->
                <div class="lightbox-stage" @click.self="close">
                    <div ref="canvasRef" class="lightbox-canvas" :class="{ dragging: isDragging }"
                        :style="{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` }"
                        @pointerdown="onPointerDown"
                        @pointermove="onPointerMove"
                        @pointerup="onPointerUp"
                        @pointercancel="onPointerUp"
                        @click="onImageClick">
                        <img :src="src" :alt="alt" class="lightbox-img" :class="{ 'is-hidden': showingOriginal }"
                            draggable="false" />
                        <img v-if="hasDistinctOriginal" ref="originalImgRef" :src="originalImgSrc" :alt="alt"
                            class="lightbox-img" :class="{ 'is-hidden': !showingOriginal }" draggable="false" />
                    </div>
                </div>

                <div class="lightbox-tip">单击关闭 · 按住拖动 · 滚轮缩放 · Esc 退出</div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { toast } from '../composables/useToast.js';

const MIN_SCALE = 0.4;
const MAX_SCALE = 4;

// 位移超过该像素数才认定为「拖动」，以此区分单击与拖拽
const DRAG_THRESHOLD = 4;

const props = defineProps({
    // 是否显示
    open: { type: Boolean, default: false },
    // 当前显示的图（本站图片为压缩图，外链图片即其自身）
    src: { type: String, default: '' },
    // 原图地址：用于下载与「查看原图」。外链图片或没有压缩版本时与 src 相同
    original: { type: String, default: '' },
    // 无障碍描述与下载文件名
    alt: { type: String, default: '' },
});

const emit = defineEmits(['update:open']);

const scale = ref(1);
const downloading = ref(false);
const canvasRef = ref(null);
// 原图元素（仅存在独立原图时渲染）
const originalImgRef = ref(null);
const originalLoading = ref(false);
// 原图 src：首次切换时才赋值（undefined 时 Vue 不渲染该属性，不发请求）
const originalImgSrc = ref(undefined);
const showingOriginal = ref(false);

// 下载与原图查看都以原图为准；没传 original 时退化为 src
const originalUrl = computed(() => props.original || props.src);
// 是否存在与显示图不同的原图
const hasDistinctOriginal = computed(
    () => !!props.original && props.original !== props.src
);

// 拖动平移偏移
const offsetX = ref(0);
const offsetY = ref(0);
const isDragging = ref(false);

// 本次手势是否发生了拖动（用于抑制拖动结束后的 click）
let didDrag = false;
// 是否处于按下状态：未收到 pointerdown 就不允许拖动，
// 否则一旦丢失 pointerdown，位移会被算成绝对坐标导致图片瞬间飞出
let pointerActive = false;
// 拖动起点与按下时的偏移快照
let startX = 0;
let startY = 0;
let originOffsetX = 0;
let originOffsetY = 0;

/**
 * 限制平移范围：不让图片被拖到完全看不见。
 * 最多允许图片自身尺寸一半的位移，保证总有一半在视口内。
 */
const clampOffset = () => {
    const el = canvasRef.value;
    if (!el) return;
    const maxX = (el.offsetWidth * scale.value) / 2;
    const maxY = (el.offsetHeight * scale.value) / 2;
    offsetX.value = Math.max(-maxX, Math.min(maxX, offsetX.value));
    offsetY.value = Math.max(-maxY, Math.min(maxY, offsetY.value));
};

const onPointerDown = (e) => {
    // 仅响应鼠标左键（触摸/笔的 button 为 0）
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    didDrag = false;
    pointerActive = true;
    startX = e.clientX;
    startY = e.clientY;
    originOffsetX = offsetX.value;
    originOffsetY = offsetY.value;

    // 捕获指针，确保移出图片后仍能收到 move/up
    e.currentTarget.setPointerCapture?.(e.pointerId);
};

const onPointerMove = (e) => {
    // 未按下时不处理：没有起点就无法计算相对位移
    if (!pointerActive) return;
    if (e.buttons === 0) {
        pointerActive = false;
        return;
    }

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 未超过阈值时不进入拖动，避免轻微抖动就变成拖拽
    if (!isDragging.value && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    isDragging.value = true;
    didDrag = true;
    offsetX.value = originOffsetX + dx;
    offsetY.value = originOffsetY + dy;
    clampOffset();
};

const onPointerUp = (e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    pointerActive = false;
    isDragging.value = false;
    // didDrag 保留到 click 事件后再由下一次 pointerdown 重置
};

const onImageClick = () => {
    // 拖动结束后的 click 不应当关闭
    if (didDrag) {
        didDrag = false;
        return;
    }
    close();
};

watch(() => props.open, (open) => {
    if (open) {
        // 每次打开重置缩放、平移与「原图」状态
        scale.value = 1;
        offsetX.value = 0;
        offsetY.value = 0;
        isDragging.value = false;
        didDrag = false;
        pointerActive = false;
        // 一律先看压缩图（原图是异步探测出来的，避免画面突然换大图）
        showingOriginal.value = false;
        originalImgSrc.value = undefined;
        originalLoading.value = false;
    } else {
        // 关闭时复位交互状态，避免下次打开残留 didDrag 导致单击失效
        isDragging.value = false;
        pointerActive = false;
        didDrag = false;
    }
});

/** 等某张图真的加载解码完成（已完成则直接返回） */
const imageLoaded = (el) =>
    new Promise((resolve) => {
        if (!el) return resolve(false);
        if (el.complete) return resolve(el.naturalWidth > 0);

        const done = (ok) => {
            el.removeEventListener('load', onLoad);
            el.removeEventListener('error', onError);
            resolve(ok);
        };
        const onLoad = () => done(true);
        const onError = () => done(false);
        el.addEventListener('load', onLoad);
        el.addEventListener('error', onError);
    });

/** 切换压缩图/原图。首次切原图要等它加载完，否则会闪空白 */
const toggleOriginal = async () => {
    if (!hasDistinctOriginal.value || originalLoading.value) return;

    if (!showingOriginal.value && originalImgSrc.value === undefined) {
        originalLoading.value = true;
        originalImgSrc.value = originalUrl.value;
        await nextTick();
        const ok = await imageLoaded(originalImgRef.value);
        originalLoading.value = false;

        if (!ok) {
            originalImgSrc.value = undefined;
            toast.warning('原图加载失败，仍显示压缩图');
            return;
        }
    }

    showingOriginal.value = !showingOriginal.value;
    // 两张图尺寸可能不同，旧的平移偏移不再适用
    offsetX.value = 0;
    offsetY.value = 0;
};

const close = () => {
    emit('update:open', false);
};

const zoomBy = (delta) => {
    const target = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value + delta));
    scale.value = Number(target.toFixed(2));
    clampOffset();
};

const resetScale = () => {
    scale.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
};

const onWheel = (e) => {
    // 向上滚动放大，向下缩小；步长小一点，手感更细腻
    zoomBy(e.deltaY < 0 ? 0.15 : -0.15);
};

// 锁滚动靠拦输入：滚轮 @wheel.prevent、触摸 touch-action:none、滚动按键在这里拦。
// 不用 body{overflow:hidden}：html 已是滚动容器，那会把文档高度塔陷、滚动位置被清零。
const SCROLL_KEYS = [
    ' ', 'Spacebar', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End',
];

const onKeydown = (e) => {
    if (!props.open) return;
    if (e.key === 'Escape') {
        close();
        return;
    }
    // 遮罩下面就是正文，别让空格 / 方向键把背景滚走
    if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
};

window.addEventListener('keydown', onKeydown);
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

/**
 * 下载图片。
 * 由于图片可能来自不同源，`<a download>` 会被浏览器忽略，
 * 因此先 fetch 成 blob 再触发下载；失败则退化为新标签页打开。
 */
const download = async () => {
    if (downloading.value) return;
    const url = originalUrl.value;
    if (!url) return;

    downloading.value = true;
    const loadingId = toast.loading('正在准备下载…');
    try {
        // cache:'no-cache'：<img> 加载过的缓存响应不带 ACAO，直接 fetch 会 CORS 失败
        const resp = await fetch(url, { mode: 'cors', cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();

        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        // 文件名优先用 alt，回退到 URL 末段
        const urlName = decodeURIComponent(url.split('/').pop().split('?')[0] || 'image');
        const dot = urlName.lastIndexOf('.');
        const name = (props.alt || '').trim() || urlName;
        // alt 常是描述文字（没有后缀），补上图片自身的后缀
        a.download = /\.[a-z0-9]+$/i.test(name) ? name : name + (dot > 0 ? urlName.slice(dot) : '');
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

        toast.update(loadingId, { type: 'success', text: '图片已开始下载' });
    } catch (error) {
        console.error('下载图片失败:', error);
        toast.update(loadingId, { type: 'warning', text: '无法直接下载，已在新标签页打开' });
        window.open(url, '_blank', 'noopener');
    } finally {
        downloading.value = false;
    }
};
</script>

<style scoped>
.lightbox-mask {
    position: fixed;
    inset: 0;
    z-index: 4000;
    background: rgba(0, 0, 0, 0.86);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    /* 触摸也不该滚动背景（touch-action 会同时作用于后代） */
    touch-action: none;
}

.lightbox-toolbar {
    position: absolute;
    top: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(30, 30, 30, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.lb-btn {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: rgba(255, 255, 255, 0.88);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
}

.lb-btn:hover:not(:disabled) {
    background: rgba(31, 239, 239, 0.22);
    color: rgb(31, 239, 239);
}

.lb-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.lb-close:hover {
    background: color-mix(in srgb, var(--color-danger) 30%, transparent);
    color: #ff8a7a;
}

/* 文字型按钮（原图 / 压缩图切换） */
.lb-text-btn {
    width: auto;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-family: inherit;
}

.lb-scale {
    min-width: 48px;
    text-align: center;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    color: rgba(255, 255, 255, 0.75);
}

.lb-divider {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: rgba(255, 255, 255, 0.18);
}

.lb-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: rgb(31, 239, 239);
    border-radius: 50%;
    animation: lb-spin 0.7s linear infinite;
}

@keyframes lb-spin {
    to {
        transform: rotate(360deg);
    }
}

.lightbox-stage {
    flex: 1;
    width: 100%;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    /* 改为 hidden：平移完全由 transform 接管，避免与滚动条互相干扰 */
    overflow: hidden;
}

/* 变换挂在这里，两张图共用 */
.lightbox-canvas {
    position: relative;
    cursor: grab;
    transition: transform 0.18s ease;
    transform-origin: center center;
    user-select: none;
    /* 阻止拖动时触发系统手势或选中 */
    touch-action: none;
}

/* 拖动中：取消过渡与 grab 光标，跟手感更好 */
.lightbox-canvas.dragging {
    cursor: grabbing;
    transition: none;
}

.lightbox-img {
    display: block;
    max-width: min(92vw, 1400px);
    max-height: 82vh;
    object-fit: contain;
    border-radius: 6px;
    -webkit-user-drag: none;
}

/* 隐藏的那张不占尺寸，切回来无需重新请求 */
.lightbox-img.is-hidden {
    position: absolute;
    inset: 0;
    visibility: hidden;
}

.lightbox-tip {
    position: absolute;
    bottom: 18px;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.45);
    pointer-events: none;
}

.lightbox-enter-active,
.lightbox-leave-active {
    transition: opacity 0.22s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
    opacity: 0;
}

@media (max-width: 640px) {
    .lb-scale,
    .lightbox-tip {
        display: none;
    }

    .lightbox-img {
        max-height: 74vh;
    }
}
</style>
