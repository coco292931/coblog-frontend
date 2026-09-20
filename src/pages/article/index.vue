<template>
    <div class="page-article">
        <NavBar style="position: fixed;" />
        <!-- 文章封面区域 -->
        <div class="main-photo-article">
            <!-- 没拿到封面地址时不渲染 img：空 src 会去请求当前页面，也会白闪一张默认封面 -->
            <img v-if="coverDisplay" :src="coverDisplay" class='cover_image' @error="onCoverError" />
            <div class="summary">
                <!-- 管理入口：登录用户可见，置于封面标题区右上角，不与统计信息混在一起 -->
                <button v-if="loggedIn" class="manage-btn" @click="goToEdit" title="编辑这篇文章">
                    ✏️ 编辑
                </button>
                <div class="title">{{ articleTitle }}</div>
                <div class="subtitle">{{ articleSubtitle }}</div>
                <div class="splitline"></div>
                <div class="time">
                    <span class="time-item"><span class="time-label">创建：</span>{{ createTime }}</span>
                    <span class="time-item"><span class="time-label">修改：</span>{{ updateTime }}</span>
                </div>
                <div class="info">
                    <div class="categories">
                        <IconDocumentation class="info-icon" style="transform: scale(1);transform: translateY(2px);" />
                        <span v-if="categories.length">
                            <span v-for="(cat, index) in categories" :key="cat" class="category-chip"
                                @click="goToCategory(cat)">{{ cat }}</span>
                        </span>
                        <span v-else>未分类</span>
                    </div>
                    <!--<div class="tags">
                        <span class="info-icon">🏷️</span>
                        <span>{{ tags }}</span>
                    </div>-->
                    <div class="reading-time">
                        <IconHistory class="info-icon" style="transform: scale(0.9);" />
                        <span>{{ readingTime }} min</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 文章主体内容区域 -->
        <div class="body-content">
            <!-- 侧边栏目录 -->
            <div class="side-content">
                <div class="toc-container">
                    <div class="toc-title">📑 目录</div>
                    <div class="toc-list">
                        <div v-for="item in tocList" :key="item.id"
                            :class="['toc-item', `toc-level-${item.level}`, { 'is-active': item.id === activeHeadingId }]"
                            @click="scrollToSection(item.id)">
                            {{ item.text }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="main-content">
                <!-- 文章内容：与写作页预览共用 article-prose 排版 -->
                <div class="article-content" @click="onContentClick" @error.capture="onContentError">
                    <div ref="proseRef" class="main-body article-prose" v-html="articleHtml">
                    </div>
                    <!-- 版权信息 -->
                    <div class="license-info">
                        <div class="license-icon">📄</div>
                        <div class="license-body">
                            <div class="license-title">版权声明</div>
                            <div class="license-text">
                                本文作者：{{ author }}<br>
                                本文链接：<span class="license-link">{{ articleUrl }}</span><br>
                                除特别声明外，本文采用 <span class="license-strong">CC BY-NC-SA 4.0</span> 许可协议，转载请注明出处。
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 文章统计信息 -->
                <div class="article-info">
                    <div class="info-title">📊 文章统计</div>
                    <div class="info-items">
                        <div class="info-item">
                            <span class="info-label">👁️ 浏览量：</span>
                            <span class="info-value">{{ views }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">👍 点赞量：</span>
                            <span class="info-value">{{ likes }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">💬 评论数：</span>
                            <span class="info-value">{{ comments }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Footer />

        <!-- 图片查看器：点击正文图片打开，支持缩放、查看原图与下载 -->
        <ImageLightbox v-model:open="lightboxOpen" :src="lightboxSrc" :original="lightboxOriginal"
            :can-compare="lightboxCanCompare" :variant-pending="lightboxVariantPending"
            :initial-variant="lightboxInitialVariant" :alt="lightboxAlt" />
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import './index.css';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import IconDocumentation from '../../components/icons/IconDocumentation.vue';
import IconHistory from '../../components/icons/IconHistory.vue';
import api from '../../api/index.js';
import { isAuthenticated } from '../../utils/auth.js';
import { thumbUrl, stripThumb, probeThumbVariant } from '../../utils/image.js';
import { enhanceProse } from '../../utils/prose.js';
import ImageLightbox from '../../components/ImageLightbox.vue';
import fallbackCover from '../../assets/image/homepage-background.jpg';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const SITE_HOST = 'coco-29.wang';
const resolveImageUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url;
    return API_BASE.replace(/\/$/, '') + url;
};

const isExternalLink = (href) => {
    try {
        const url = new URL(href, window.location.origin);
        return url.protocol.startsWith('http') && url.hostname !== SITE_HOST && !url.hostname.endsWith(`.${SITE_HOST}`);
    } catch {
        return false;
    }
};

const route = useRoute();
const router = useRouter();
const articleId = ref(route.params.article_id);

// 编辑入口仅对登录用户展示，无权限时由后端返回的业务 code 兜底提示
const loggedIn = ref(isAuthenticated());
watch(() => route.fullPath, () => {
    loggedIn.value = isAuthenticated();
});

// 文章基本信息
const articleTitle = ref('加载中...');
const articleSubtitle = ref('');
// 封面原图地址（空 = 这篇文章没有封面），仅在加载失败时被替换成默认封面
const coverImage = ref('');
// 当前显示的封面：先缩略图打底，原图加载完再换上；为空表示还没确定封面，不渲染 img
const coverDisplay = ref('');
const createTime = ref('');
const updateTime = ref('');
const categories = ref([]);
const tags = ref('');
const readingTime = ref(0);
const author = ref('coco_29');
const articleUrl = ref(window.location.href);

// 文章内容（后端返回的HTML）
const articleHtml = ref('<p>加载中...</p>');

// 统计信息
const views = ref(0);
const likes = ref(0);
const comments = ref(0);

// 目录数据
const tocList = ref([]);
// 当前所处章节，用于目录高亮（滚动联动）
const activeHeadingId = ref('');

// 正文（v-html）容器：渲染完成后的增强都从它取真实节点
const proseRef = ref(null);

// 图片查看器状态
const lightboxOpen = ref(false);
const lightboxSrc = ref('');
const lightboxOriginal = ref('');
const lightboxAlt = ref('');
// 首帧显示哪一张：正文图已升级到原图时用 'original'（复用正文里那张已解码的图）
const lightboxInitialVariant = ref('thumb');
// 后端是否确认存在独立的压缩图（决定要不要显示「原图/压缩图」切换）
const lightboxCanCompare = ref(false);
// 是否还在向后端确认（灯箱里按钮先隐形占位，避免工具栏跳一下）
const lightboxVariantPending = ref(false);

// 滚动到指定章节
const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * 目录滚动联动：判定带（视口上沿往下 80px~30% 的区域）里出现了哪些标题，
 * 取文档顺序最靠前的那个作为「当前章节」。
 * 用 IntersectionObserver 而不是 scroll 事件，省掉每帧的位置计算。
 */
let tocObserver = null;
const observeHeadings = (headings) => {
    tocObserver?.disconnect();
    tocObserver = null;
    activeHeadingId.value = '';
    if (!headings.length) return;

    const visible = new Set();
    tocObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
        });
        const current = headings.find((heading) => visible.has(heading.id));
        if (current) activeHeadingId.value = current.id;
    }, { rootMargin: '-80px 0px -70% 0px' });   // 上沿 80px 对应固定导航栏的高度

    headings.forEach((heading) => tocObserver.observe(heading));
};

/**
 * 从渲染后的正文里提取标题生成目录。调用前需确保 v-html 的内容已就位。
 * 标题 id 由后端渲染时就写好了（services/markdownService/headingID.go），
 * 这里只做兜底：老文章入库时还没有 id，补一个位置编号，保证目录仍然可用。
 */
const buildToc = () => {
    const container = proseRef.value;
    if (!container) return;

    const headings = [...container.querySelectorAll('h2, h3, h4')];
    tocList.value = headings.map((heading, index) => {
        if (!heading.id) heading.id = `heading-${index}`;
        return {
            id: heading.id,
            text: heading.textContent.trim(),
            level: parseInt(heading.tagName.substring(1), 10),
        };
    });
    observeHeadings(headings);
};

/**
 * 带 #锚点 打开时，正文是异步取回来的 —— 浏览器解析 HTML 那一刻找不到目标元素，
 * 首次定位必然落空，所以正文渲染完再补一次跳转。
 */
const scrollToHashHeading = () => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
};

// 从后端获取文章数据
const fetchArticleData = async () => {
    try {
        // 使用axios调用API获取文章数据
        const result = await api.get(`/api/articles/${articleId.value}`);

        console.log('API返回的原始数据:', result);

        if (result.code === 200 && result.data) {
            const data = result.data;
            console.log('文章详情数据:', data);

            // 更新文章信息（使用驼峰命名）
            articleTitle.value = data.title || '无标题';
            articleSubtitle.value = data.subtitle || '';
            // 有封面就用文章自己的封面；没有封面才退回默认图。
            // 默认图不再作为初始值抢跑，避免「先请求默认封面、再换成真封面」白跑一次。
            const cover = resolveImageUrl(data.cover_image || '');
            if (cover) {
                coverImage.value = cover;
                coverDisplay.value = thumbUrl(cover);
                preloadCover(cover);
            } else {
                coverImage.value = '';
                coverDisplay.value = fallbackCover;
            }
            articleHtml.value = withThumbSrc(data.content || '<p>暂无内容</p>');

            // 处理时间字段
            createTime.value = data.createdAt ? formatDateTime(data.createdAt) : '';
            updateTime.value = data.updatedAt ? formatDateTime(data.updatedAt) : '';

            // 处理分类（解析为数组，供独立 chip 展示与跳转）
            categories.value = (() => {
                if (!data.category) return [];
                try {
                    const parsed = JSON.parse(data.category);
                    if (Array.isArray(parsed)) return parsed;
                    return parsed ? [String(parsed)] : [];
                } catch {
                    // 非 JSON 时按逗号分割（兼容老数据）
                    return data.category.split(/[,，]/).map(s => s.trim()).filter(Boolean);
                }
            })();

            // 处理标签（数组转字符串）
            tags.value = Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || '');

            if (data.words < 200) {
                readingTime.value = 1;
                //console.log('文章字数少于200字，阅读时间设为1分钟');
            } else {
                readingTime.value = Math.ceil(data.words / 200);
            }


            //readingTime.value = data.readingTime || data.reading_time || 0;
            author.value = data.author || 'coco_29';

            // 更新统计信息
            views.value = data.views || 0;
            likes.value = data.likes || 0;
            comments.value = data.commentsCount || data.comments_count || 0;

            // 正文由 v-html 渲染，下面几件事都依赖真实 DOM，先等一次更新
            await nextTick();
            buildToc();
            scrollToHashHeading();
            enhanceProse(proseRef.value);
            configureExternalLinks();
            setupContentImages();

            console.log('文章数据加载成功');
        } else {
            throw new Error(result.msg || result.message || '数据格式错误');
        }
    } catch (error) {
        console.error('获取文章数据失败:', error);
        articleTitle.value = '加载失败';
        articleHtml.value = `<p style="color: red;">加载文章失败，请稍后重试。</p><p>错误信息：${error.message}</p>`;
    }
};

// 站外链接在新窗口打开，站内链接保持当前窗口跳转
const configureExternalLinks = async () => {
    await nextTick();

    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    articleContent.querySelectorAll('a[href]').forEach((link) => {
        if (isExternalLink(link.getAttribute('href'))) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        } else {
            link.removeAttribute('target');
            link.removeAttribute('rel');
        }
    });
};

/**
 * 渲染前把正文里的 src 换成压缩图地址。
 * 正文存的是原图地址，若不先改写，浏览器一解析到 <img src> 就会去拉原图，
 * 既抢带宽、又会因随后改 src 被取消，白跑一次请求。
 */
const withThumbSrc = (html) =>
    html.replace(/(<img\b[^>]*?\bsrc=)(["'])([^"']+)\2/gi, (all, pre, quote, url) => `${pre}${quote}${thumbUrl(url)}${quote}`);

/**
 * 处理正文图片：
 * 1. 懒加载：滚动到位置才开始请求（压缩图）
 * 2. 正文只显示压缩图，**不在正文里预载原图**：正文栏宽最多 ~760px，
 *    压缩图完全够看；而弱网下 N 张原图（1.5~2MB/张）会把正文的文本/CSS 挤掉。
 *    原图地址留在 data-original 里，交给灯箱在用户已聚焦这张图之后按需加载。
 * 3. 点击放大：用容器上的事件委托（见 onContentClick），
 *    因为 v-html 的节点由 Vue 管理，逐个 addEventListener 会在重渲染后失效
 */
const setupContentImages = async () => {
    await nextTick();

    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    articleContent.querySelectorAll('img').forEach((img) => {
        const thumb = img.getAttribute('src');
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        img.classList.add('content-image');

        if (!thumb) return;

        // src 已在渲染前换成压缩图，原图地址去掉参数即可还原（灯箱用它）
        const original = stripThumb(thumb);
        img.dataset.original = original;
        // 外链图 / 本来就没有独立变体：没什么可回退的
        if (original === thumb) return;

        // 压缩图缺失（老数据等）时回退到原图，避免白图
        img.addEventListener('error', function onThumbError() {
            img.removeEventListener('error', onThumbError);
            img.setAttribute('src', original);
        });
    });
};

/** 封面先缩略图打底，原图在后台加载，好了再换上 */
const preloadCover = (original) => {
    if (original === coverDisplay.value) return;

    const img = new Image();
    img.onload = () => {
        // 期间可能已经切到别的文章
        if (coverImage.value === original) coverDisplay.value = original;
    };
    img.src = original;
};

/**
 * 问后端确实有没有独立的压缩图（HEAD，零字节）；拿不到就不显示切换按钮。
 * 探测结果按地址记忆（见 utils/image.js），同一张图反复打开灯箱不会重复请求。
 */
const confirmThumbVariant = async (baseUrl, probeUrl) => {
    const canCompare = await probeThumbVariant(probeUrl);
    // 探测期间用户可能点开了别的图，避免结果写到新图上
    if (lightboxOriginal.value !== baseUrl) return;
    // 确认结束：占位的按钮要么显形、要么消失
    lightboxVariantPending.value = false;
    if (canCompare !== null) lightboxCanCompare.value = canCompare;
};

/**
 * 正文点击事件委托：命中图片则打开灯箱。
 * 绑定在容器（而非图片本身），因此不受 v-html 重渲染影响。
 */
const onContentClick = (e) => {
    const target = e.target;
    if (target?.tagName === 'IMG') {
        // 优先用原图；外链图片没有 data-original，回退到当前 src
        const original = target.dataset.original || target.getAttribute('src');
        if (original) {
            // 第三参是正文此刻实际显示的那张：它必然已加载解码，灯箱首帧复用它就不会黑屏
            openLightbox(original, target.getAttribute('alt') || '', target.getAttribute('src') || '');
        }
    }
};

/** 图片加载失败时给个可见占位（同样用委托，避免监听器丢失） */
const onContentError = (e) => {
    if (e.target?.tagName === 'IMG') {
        e.target.classList.add('image-broken');
    }
};

const openLightbox = (originalUrl, alt, shownUrl) => {
    lightboxAlt.value = alt;
    // 下载与「查看原图」都用正文里存的原图地址
    lightboxOriginal.value = originalUrl;
    lightboxSrc.value = thumbUrl(originalUrl);
    // 正文这张已经升级到原图 → 首帧就直接显示原图，复用正文里已解码的位图；
    // 否则首帧显示压缩图（正文此刻显示的就是它）
    lightboxInitialVariant.value = shownUrl && shownUrl === originalUrl ? 'original' : 'thumb';
    // 等后端确认确实有压缩图，再让「原图/压缩图」按钮出现
    lightboxCanCompare.value = false;
    lightboxVariantPending.value = lightboxSrc.value !== originalUrl;
    lightboxOpen.value = true;

    if (lightboxSrc.value !== originalUrl) {
        confirmThumbVariant(originalUrl, lightboxSrc.value);
    }
};

// 格式化日期时间
const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // 检查是否为无效日期（如 0001-01-01）
    if (date.getFullYear() < 2000) return '';
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 点击分类：跳转到文章列表并按该分类筛选
const goToCategory = (category) => {
    if (category) {
        router.push({ path: '/articles', query: { category } });
    }
};

// 进入编辑器修改当前文章
const goToEdit = () => {
    router.push(`/write/${articleId.value}`);
};

const onCoverError = (e) => {
    if (e.target.src === fallbackCover) return;

    e.target.src = fallbackCover;
    // 同步状态，避免后续重渲染又把坏地址写回去
    coverImage.value = fallbackCover;
    coverDisplay.value = fallbackCover;
};

onMounted(() => {
    fetchArticleData();
});

onBeforeUnmount(() => {
    tocObserver?.disconnect();
    tocObserver = null;
});
</script>
<style scoped></style>
