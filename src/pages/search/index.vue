<template>
    <div class="big-container">
        <NavBar />
        <div class="search-page">
            <!-- 搜索栏 (仅在搜索页显示) -->
            <div v-if="!isArticleListMode" class="search-bar-container">
                <div class="search-bar">
                    <input v-model="searchQuery" type="text" placeholder="搜索文章标题、内容或标签..." class="search-input"
                        @keyup.enter="handleSearch" />
                    <button class="search-button" @click="handleSearch">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path
                                d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                    </button>
                </div>

                <!-- 搜索提示 -->
                <div v-if="searchQuery && !hasSearched" class="search-hint">
                    按 Enter 或点击搜索按钮开始搜索
                </div>
            </div>

            <!-- 搜索结果统计 (仅在搜索页显示) -->
            <div v-if="!isArticleListMode && hasSearched" class="search-stats">
                <span v-if="isLoading">正在搜索...</span>
                <span v-else-if="displayArticles.length > 0">
                    找到 <strong>{{ displayArticles.length }}</strong> 篇相关文章
                </span>
                <span v-else>未找到相关文章</span>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-container">
                <div class="loading-spinner"></div>
            </div>

            <!-- 使用 ArticleTimeline 组件展示文章 -->
            <div v-if="(isArticleListMode || hasSearched) && displayArticles.length > 0" class="search-results">
                <ArticleTimeline :articles="displayArticles" />
            </div>

            <!-- 空状态 (仅在搜索页显示) -->
            <div v-else-if="!isArticleListMode && hasSearched && displayArticles.length === 0" class="empty-state">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="#ddd">
                    <path
                        d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <p class="empty-message">没有找到匹配的文章</p>
                <p class="empty-hint">尝试使用不同的关键词</p>
            </div>

            <!-- 初始状态提示 (仅在搜索页显示) -->
            <div v-else-if="!isArticleListMode" class="initial-state">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="#ddd">
                    <path
                        d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <p class="initial-message">输入关键词开始搜索</p>
            </div>

        </div>
        <Footer />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ArticleTimeline from '../../components/ArticleTimeline.vue';
import './index.css';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';

// Router
const router = useRouter();
const route = useRoute();

// 判断是否为文章列表模式
const isArticleListMode = computed(() => route.path === '/articles');

// 状态
const searchQuery = ref('');
const hasSearched = ref(false);
const isLoading = ref(false);
const useRealAPI = ref(true); // 是否使用真实API

// 模拟文章数据（实际使用时应该从API获取）
const articles = ref([
    {
        id: 1,
        title: 'Vue 3 组合式 API 入门教程',
        description: '深入浅出地介绍 Vue 3 的 Composition API，包括 setup、ref、reactive 等核心概念。',
        cover_image: '',
        published_at: '2024-03-15',
        tags: ['Vue', '前端', '教程']
    },
    {
        id: 2,
        title: 'JavaScript 异步编程完全指南',
        description: '从回调函数到 Promise，再到 async/await，全面讲解 JavaScript 异步编程的各种方式。',
        cover_image: '',
        published_at: '2024-03-10',
        tags: ['JavaScript', '异步编程']
    },
    {
        id: 3,
        title: 'CSS Grid 布局实战技巧',
        description: '通过实际案例学习 CSS Grid 布局系统，掌握现代网页布局的强大工具。',
        cover_image: '',
        published_at: '2024-03-05',
        tags: ['CSS', '布局', '前端']
    },
    // 可以添加更多文章...
]);

// 显示的文章列表（直接显示后端返回的数据）
const displayArticles = computed(() => articles.value);

// 从 API 获取文章数据
const fetchArticles = async (query = '') => {
    console.log('fetchArticles called, useRealAPI:', useRealAPI.value, 'query:', query);
    if (!useRealAPI.value) {
        // 使用模拟数据
        return;
    }
    console.log('fetchArticles called, useingRealAPI!');
    try {
        const url = 'http://127.0.0.1:4523/m1/7489100-7224477-6663459';
        // 如果有搜索关键词，添加到URL参数
        const apiUrl = query ? `${url}/api/articles?q=${encodeURIComponent(query)}` : `${url}/api/articles`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('获取文章失败');
        }
        const data = await response.json();
        console.log('API返回数据:', data);
        
        // API 返回格式: { code: 200, message: "...", data: { articles: [...], total: 8, page: 23, page_size: 89 } }
        if (data.code === 200 && data.data && Array.isArray(data.data.articles)) {
            articles.value = data.data.articles.map(article => ({
                id: article.id,
                title: article.title,
                description: article.summary, // summary 映射到 description
                cover_image: article.cover_image,
                published_at: article.created_at,
                created_at: article.created_at,
                updated_at: article.updated_at,
                tags: article.categories || [], // categories 映射到 tags
                word_count: article.word_count,
                is_public: article.is_public
            }));
            console.log('成功加载文章数量:', articles.value.length);
        } else if (data.data && Array.isArray(data.data)) {
            articles.value = data.data;
        } else if (Array.isArray(data)) {
            articles.value = data;
        }
    } catch (error) {
        console.error('获取文章失败，使用模拟数据:', error);
        useRealAPI.value = false; // 切换到模拟数据
    }
};

// 处理搜索
const handleSearch = async () => {
    // 更新 URL 查询参数（空搜索框也允许）
    if (searchQuery.value.trim()) {
        router.push({
            path: '/search',
            query: { q: searchQuery.value }
        });
    } else {
        router.push({
            path: '/search'
        });
    }

    hasSearched.value = true;
    isLoading.value = true;

    // 从 API 获取文章数据，传递搜索关键词
    await fetchArticles(searchQuery.value.trim());
    
    isLoading.value = false;
};

// 加载所有文章（文章列表模式）
const loadAllArticles = async () => {
    isLoading.value = true;
    hasSearched.value = true;
    
    // 从 API 获取所有文章
    await fetchArticles();
    
    isLoading.value = false;
};

// 从 URL 初始化搜索
const initSearchFromUrl = async () => {
    const q = route.query.q;
    if (q) {
        searchQuery.value = q;
        hasSearched.value = true;
        isLoading.value = true;

        // 从 API 获取文章数据，传递搜索关键词
        await fetchArticles(q);
        
        isLoading.value = false;
    }
};

// 监听路由变化
watch(() => route.query.q, (newQuery) => {
    if (newQuery) {
        searchQuery.value = newQuery;
        hasSearched.value = true;
    }
});

// 页面加载时初始化
onMounted(() => {
    if (isArticleListMode.value) {
        // 文章列表模式：直接加载所有文章
        loadAllArticles();
    } else {
        // 搜索模式：从URL初始化搜索
        initSearchFromUrl();
    }
});
</script>
