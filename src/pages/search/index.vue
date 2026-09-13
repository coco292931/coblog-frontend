<template>
    <div class="page-search">
        <NavBar />
        <div class="search-page">
            <!-- 搜索栏（常驻） -->
            <div class="search-bar-container">
                <div class="search-bar">
                    <input v-model="searchInput" type="text" placeholder="搜索文章标题、内容或标签..." class="search-input"
                        @keyup.enter="applyFilters" />
                    <button class="filter-toggle" :class="{ active: showFilters || hasActiveFilter }"
                        @click="showFilters = !showFilters" title="筛选">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M3 5h18v2l-7 7v5l-4 2v-7L3 7V5z" />
                        </svg>
                    </button>
                    <button class="search-button" @click="applyFilters">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path
                                d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                    </button>
                </div>

                <!-- 可折叠筛选面板 -->
                <transition name="filter-slide">
                    <div v-if="showFilters" class="filter-panel">
                        <div class="filter-field">
                            <label>分类</label>
                            <input v-model="categoryInput" type="text" placeholder="按分类筛选，如：随笔"
                                @keyup.enter="applyFilters" />
                        </div>
                        <div class="filter-field">
                            <label>标签</label>
                            <input v-model="tagInput" type="text" placeholder="按标签筛选，如：vue"
                                @keyup.enter="applyFilters" />
                        </div>
                        <div class="filter-actions">
                            <button class="filter-apply" @click="applyFilters">应用</button>
                            <button class="filter-reset" @click="resetFilters">重置</button>
                        </div>
                    </div>
                </transition>
            </div>

            <!-- 结果统计 + 排序方式（同一水平行） -->
            <div class="stats-bar">
                <div class="search-stats">
                    <template v-if="hasFetched">
                        <span v-if="isLoading">加载中...</span>
                        <span v-else>
                            <template v-if="hasActiveFilter">符合条件的文章：</template>
                            <template v-else>全部文章：</template>
                            <strong>{{ total }}</strong> 篇
                            <span v-if="activeFilterText" class="active-filter-text">（{{ activeFilterText }}）</span>
                        </span>
                    </template>
                </div>

                <div class="sort-bar">
                    <span class="sort-label">排序</span>
                    <div class="sort-options">
                        <button type="button" class="sort-option" :class="{ active: sortKey === 'published' }"
                            @click="setSortKey('published')">最新发布</button>
                        <button type="button" class="sort-option" :class="{ active: sortKey === 'updated' }"
                            @click="setSortKey('updated')">最近修改</button>
                    </div>
                </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-container">
                <div class="loading-spinner"></div>
            </div>

            <!-- 文章列表 -->
            <div v-else-if="articles.length > 0" class="search-results">
                <ArticleTimeline :articles="articles" :date-key="activeDateKey" />

                <!-- 触底加载更多状态 -->
                <div class="load-more-status">
                    <div v-if="isLoadingMore" class="loading-spinner small"></div>
                    <span v-else-if="!hasMore" class="no-more-text">— 没有更多了 —</span>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="hasFetched" class="empty-state">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="#ddd">
                    <path
                        d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <p class="empty-message">没有找到匹配的文章</p>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ArticleTimeline from '../../components/ArticleTimeline.vue';
import './index.css';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import api from '../../api/index.js';
import { thumbUrl } from '../../utils/image.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const resolveImageUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url;
    return API_BASE.replace(/\/$/, '') + url;
};

const router = useRouter();
const route = useRoute();

// 每页条数
const PAGE_SIZE = 10;

// 编辑态（输入框内容，提交后才同步到 URL）
const searchInput = ref('');
const categoryInput = ref('');
const tagInput = ref('');
const showFilters = ref(false);

// 数据态
const articles = ref([]);
const total = ref(0);
const page = ref(1);
const isLoading = ref(false);    // 首次/重置加载
const isLoadingMore = ref(false); // 追加加载
const hasFetched = ref(false);

// 排序方式：published = 按发布时间（createdAt），updated = 按最后修改时间（updatedAt）。
// 顺序由后端负责（sort=updated → updated_at 倒序），前端不再本地重排：
// 无限滚动是逐页追加的，本地排序只能在已加载的几页内生效。
const SORT_KEYS = { published: 'published_at', updated: 'updated_at' };
const sortKey = computed(() => (route.query.sort === 'updated' ? 'updated' : 'published'));
// 当前排序对应的时间字段，供 ArticleTimeline 展示日期
const activeDateKey = computed(() => SORT_KEYS[sortKey.value]);

// 是否还有更多文章未加载
const hasMore = computed(() => articles.value.length < total.value);

// 是否存在生效的筛选/搜索条件（基于 URL）
const hasActiveFilter = computed(() =>
    !!(route.query.q || route.query.category || route.query.tag)
);

// 当前生效筛选的可读描述
const activeFilterText = computed(() => {
    const parts = [];
    if (route.query.q) parts.push(`搜索“${route.query.q}”`);
    if (route.query.category) parts.push(`分类“${route.query.category}”`);
    if (route.query.tag) parts.push(`标签“${route.query.tag}”`);
    return parts.join(' · ');
});

// 把 URL 查询参数同步到输入框
const syncInputsFromRoute = () => {
    searchInput.value = route.query.q || '';
    categoryInput.value = route.query.category || '';
    tagInput.value = route.query.tag || '';
    // 进入页面时若已有筛选条件，自动展开面板
    if (route.query.category || route.query.tag) {
        showFilters.value = true;
    }
};

// 把后端文章数据转换为 Timeline 所需格式
const mapArticle = (article) => {
    const createdTime = new Date(article.createdAt || 0).getTime();
    const updatedTime = new Date(article.updatedAt || 0).getTime();
    const safeCreated = isNaN(createdTime) ? 0 : createdTime;
    const safeUpdated = isNaN(updatedTime) ? 0 : updatedTime;

    return {
        id: article.id,
        cover_image: thumbUrl(resolveImageUrl(article.cover_image || '')),
        title: article.title,
        description: article.summary || '',
        // 发布时间（后端 createdAt）；修改时间（后端 updatedAt）。
        // 两个字段各自独立，供「最新发布 / 最近修改」两种排序使用。
        published_at: new Date(safeCreated || safeUpdated).toISOString(),
        updated_at: new Date(safeUpdated || safeCreated).toISOString(),
        created_at: article.createdAt,
        categories: parseJsonArray(article.category),
        tags: parseJsonArray(article.tags),
    };
};

// 从 API 获取文章数据
// append=false：重置加载第一页；append=true：追加下一页
const fetchArticles = async (append = false) => {
    if (append) {
        isLoadingMore.value = true;
    } else {
        isLoading.value = true;
        page.value = 1;
    }
    hasFetched.value = true;

    try {
        const query = { page: String(page.value), pageSize: String(PAGE_SIZE) };
        if (route.query.q) query.q = route.query.q;
        if (route.query.category) query.category = route.query.category;
        if (route.query.tag) query.tag = route.query.tag;
        if (route.query.sort) query.sort = route.query.sort; // 排序交给后端，保证跨页正确

        const search = new URLSearchParams(query).toString();
        const result = await api.get(`/api/articles?${search}`);

        if (result.code === 200 && result.data && result.data.articles) {
            total.value = result.data.total ?? result.data.articles.length;
            const mapped = result.data.articles.map(mapArticle);

            // 排序由后端保证，这里只负责合并数据
            if (append) {
                articles.value = [...articles.value, ...mapped];
            } else {
                articles.value = mapped;
            }
        } else {
            throw new Error(result.msg || result.message || '数据格式错误');
        }
    } catch (error) {
        console.error('获取文章失败:', error);
        if (!append) {
            articles.value = [];
            total.value = 0;
        }
    } finally {
        isLoading.value = false;
        isLoadingMore.value = false;
        // 若内容未填满视口且仍有更多，自动继续加载，确保滚动监听可被触发
        nextTick(() => {
            if (hasMore.value && document.documentElement.scrollHeight <= window.innerHeight) {
                loadMore();
            }
        });
    }
};

// 加载下一页（追加）
const loadMore = async () => {
    if (isLoading.value || isLoadingMore.value || !hasMore.value) return;
    page.value += 1;
    await fetchArticles(true);
};

// 滚动接近底部时自动加载更多
const handleScroll = () => {
    const scrollBottom = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 300;
    if (scrollBottom >= threshold) {
        loadMore();
    }
};

// 解析后端的 JSON 数组字段（category / tags），容错处理
const parseJsonArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            return [value];
        }
    }
    return [];
};

// 切换排序方式：写进 URL（由 watch 统一触发重新加载）
const setSortKey = (key) => {
    if (key === sortKey.value) return;
    const query = { ...route.query };
    if (key === 'published') {
        delete query.sort; // 默认排序不占用 URL
    } else {
        query.sort = key;
    }
    router.push({ path: route.path, query });
};

// 应用筛选：把输入框内容写进 URL（由 watch 统一触发请求）
const applyFilters = () => {
    const query = {};
    const q = searchInput.value.trim();
    const category = categoryInput.value.trim();
    const tag = tagInput.value.trim();
    if (q) query.q = q;
    if (category) query.category = category;
    if (tag) query.tag = tag;
    if (route.query.sort) query.sort = route.query.sort; // 保留当前排序方式
    router.push({ path: route.path, query });
};

// 重置所有筛选（保留排序方式）
const resetFilters = () => {
    searchInput.value = '';
    categoryInput.value = '';
    tagInput.value = '';
    const query = {};
    if (route.query.sort) query.sort = route.query.sort;
    router.push({ path: route.path, query });
};

// URL 查询参数变化时（提交、点击标签、前进后退）重置并重新加载第一页
watch(() => route.query, () => {
    syncInputsFromRoute();
    window.scrollTo(0, 0);
    fetchArticles(false);
}, { deep: true });

onMounted(() => {
    syncInputsFromRoute();
    fetchArticles(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});
</script>
