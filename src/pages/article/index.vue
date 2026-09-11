<template>
    <div class="big-container">
        <NavBar style="position: fixed;" />
        <!-- 文章封面区域 -->
        <div class="main-photo-article">
            <img :src="coverImage" class='cover_image' @error="onCoverError" />
            <div class="summary">
                <!-- 管理入口：登录用户可见，置于封面标题区右上角，不与统计信息混在一起 -->
                <button v-if="loggedIn" class="manage-btn" @click="goToEdit" title="编辑这篇文章">
                    ✏️ 编辑
                </button>
                <div class="title">{{ articleTitle }}</div>
                <div class="subtitle">{{ articleSubtitle }}</div>
                <div class="splitline"></div>
                <div class="time">
                    <span class="time-label">创建：</span>{{ createTime }}
                    <span class="time-label" style="margin-left: 20px;">修改：</span>{{ updateTime }}
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
                        <div v-for="(item, index) in tocList" :key="index"
                            :class="['toc-item', `toc-level-${item.level}`]" @click="scrollToSection(item.id)">
                            {{ item.text }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="main-content">
                <!-- 文章内容：与写作页预览共用 article-prose 排版 -->
                <div class="article-content" @click="onContentClick" @error.capture="onContentError">
                    <div class="main-body article-prose" v-html="articleHtml">
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
            :alt="lightboxAlt" />
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import './index.css';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import IconDocumentation from '../../components/icons/IconDocumentation.vue';
import IconHistory from '../../components/icons/IconHistory.vue';
import api from '../../api/index.js';
import { isAuthenticated } from '../../utils/auth.js';
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
const coverImage = ref(fallbackCover);
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

// 图片查看器状态
const lightboxOpen = ref(false);
const lightboxSrc = ref('');
const lightboxOriginal = ref('');
const lightboxAlt = ref('');

// 滚动到指定章节
const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
            coverImage.value = resolveImageUrl(data.cover_image || '') || fallbackCover;
            articleHtml.value = data.content || '<p>暂无内容</p>';

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

            // 如果后端返回了目录数据，则使用；否则可以从 HTML 中提取
            if (data.toc && Array.isArray(data.toc)) {
                tocList.value = data.toc;
            } else {
                // 自动从 HTML 中提取标题生成目录
                generateTocFromHtml();
            }

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
 * 处理正文图片：
 * 1. 懒加载：滚动到位置才开始请求
 * 2. 显示压缩图：正文里存的是原图地址，这里换成后端生成的压缩图 `xxx_c.*`
 *    （后端规则：png 保持 png，其余格式统一转 jpg），首屏更省流量；
 *    原图地址保留在 data-original，供「查看大图 / 下载原图」使用
 * 3. 点击放大：用容器上的事件委托（见 onContentClick），
 *    因为 v-html 的节点由 Vue 管理，逐个 addEventListener 会在重渲染后失效
 */
const setupContentImages = async () => {
    await nextTick();

    const articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    articleContent.querySelectorAll('img').forEach((img) => {
        const original = img.getAttribute('src');
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        img.classList.add('content-image');

        if (!original) return;
        img.dataset.original = original;

        const thumb = toThumbUrl(original);
        if (thumb !== original) {
            img.setAttribute('src', thumb);
            // 压缩图缺失（老数据等）时回退到原图，避免白图
            img.addEventListener('error', function onThumbError() {
                img.removeEventListener('error', onThumbError);
                img.setAttribute('src', original);
            });
        }
    });
};

/**
 * 由原图地址推导后端生成的压缩图地址。
 * 与后端 fileService 的命名规则保持一致：
 *   - png 保持 png（保留透明通道）→ xxx.png  -> xxx_c.png
 *   - 其余格式统一转 jpg          → xxx.webp -> xxx_c.jpg
 * 已是压缩图则原样返回；外链图片没有对应的压缩版本，也原样返回。
 */
const toThumbUrl = (url) => {
    if (!url || !url.includes('/static/uploads/')) return url;
    if (/_c\.(png|jpe?g|webp|gif)$/i.test(url)) return url;

    const isPng = /\.png(\?.*)?$/i.test(url);
    const suffix = isPng ? '_c.png' : '_c.jpg';
    return url.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, suffix + '$1');
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
            openLightbox(original, target.getAttribute('alt') || '');
        }
    }
};

/** 图片加载失败时给个可见占位（同样用委托，避免监听器丢失） */
const onContentError = (e) => {
    if (e.target?.tagName === 'IMG') {
        e.target.classList.add('image-broken');
    }
};

const openLightbox = (originalUrl, alt) => {
    lightboxAlt.value = alt;
    lightboxOriginal.value = originalUrl;
    // 先展示压缩图（外链图片没有压缩版本，与原图相同）
    lightboxSrc.value = toThumbUrl(originalUrl);
    lightboxOpen.value = true;
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

// 从 HTML 内容中提取标题生成目录
const generateTocFromHtml = () => {
    // 等待 DOM 更新后再提取
    setTimeout(() => {
        const articleContent = document.querySelector('.article-content');
        if (!articleContent) return;

        const headings = articleContent.querySelectorAll('h2, h3, h4');
        const toc = [];

        headings.forEach((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;

            toc.push({
                id: id,
                text: heading.textContent,
                level: parseInt(heading.tagName.substring(1))
            });
        });

        tocList.value = toc;
    }, 100);
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
    if (e.target.src !== fallbackCover) {
        e.target.src = fallbackCover;
    }
};

onMounted(() => {
    fetchArticleData();
});
</script>
<style scoped></style>
