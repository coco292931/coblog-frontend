<template>
    <div class="big-container">
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

            <!-- 结果统计 -->
            <div v-if="hasFetched" class="search-stats">
                <span v-if="isLoading">加载中...</span>
                <span v-else>
                    <template v-if="hasActiveFilter">符合条件的文章：</template>
                    <template v-else>全部文章：</template>
                    <strong>{{ total }}</strong> 篇
                    <span v-if="activeFilterText" class="active-filter-text">（{{ activeFilterText }}）</span>
                </span>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-container">
                <div class="loading-spinner"></div>
            </div>

            <!-- 文章列表 -->
            <div v-else-if="displayArticles.length > 0" class="search-results">
                <ArticleTimeline :articles="displayArticles" />

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

const displayArticles = computed(() => articles.value);

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
    const updatedTime = new Date(article.updatedAt || 0).getTime();
    const createdTime = new Date(article.createdAt || 0).getTime();
    const latestTime = !isNaN(updatedTime) && !isNaN(createdTime)
        ? Math.max(updatedTime, createdTime)
        : (!isNaN(createdTime) ? createdTime : (!isNaN(updatedTime) ? updatedTime : 0));

    return {
        id: article.id,
        cover_image: article.cover_image || '',
        title: article.title,
        description: article.summary || '',
        published_at: new Date(latestTime).toISOString(),
        created_at: article.createdAt,
        categories: parseJsonArray(article.category),
        tags: parseJsonArray(article.tags),
    };
};

// 按发布时间降序排序
const sortByLatest = (list) => list.sort((a, b) => {
    const timeA = new Date(b.published_at).getTime();
    const timeB = new Date(a.published_at).getTime();
    return (!isNaN(timeA) && !isNaN(timeB)) ? (timeA - timeB) : 0;
});

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

        const search = new URLSearchParams(query).toString();
        const result = await api.get(`/api/articles?${search}`);

        if (result.code === 200 && result.data && result.data.articles) {
            total.value = result.data.total ?? result.data.articles.length;
            const mapped = result.data.articles.map(mapArticle);

            if (append) {
                // 追加并整体重新排序，保证时间线连续
                articles.value = sortByLatest([...articles.value, ...mapped]);
            } else {
                articles.value = sortByLatest(mapped);
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

// 应用筛选：把输入框内容写进 URL（由 watch 统一触发请求）
const applyFilters = () => {
    const query = {};
    const q = searchInput.value.trim();
    const category = categoryInput.value.trim();
    const tag = tagInput.value.trim();
    if (q) query.q = q;
    if (category) query.category = category;
    if (tag) query.tag = tag;
    router.push({ path: route.path, query });
};

// 重置所有筛选
const resetFilters = () => {
    searchInput.value = '';
    categoryInput.value = '';
    tagInput.value = '';
    router.push({ path: route.path, query: {} });
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
