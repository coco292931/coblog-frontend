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
                <span v-else="displayArticles.length > 0">
                    搜索完成，找到 <strong>{{ displayArticles.length }}</strong> 篇文章
                </span>
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
import api from '../../api/index.js';

// Router
const router = useRouter();
const route = useRoute();

// 判断是否为文章列表模式
const isArticleListMode = computed(() => route.path === '/articles');

// 状态
const searchQuery = ref('');
const hasSearched = ref(false);
const isLoading = ref(false);

// 文章列表数据
const articles = ref([]);

// 显示的文章列表（直接显示后端返回的数据）
const displayArticles = computed(() => articles.value);

// 从 API 获取文章数据
const fetchArticles = async (query = '') => {
    try {
        // 使用axios调用API，如果有搜索关键词则添加到URL参数
        const apiUrl = query ? `/api/articles?q=${encodeURIComponent(query)}` : '/api/articles';
        const result = await api.get(apiUrl);
        
        console.log('API返回的原始数据:', result);
        
        if (result.code === 200 && result.data && result.data.articles) {
            console.log('文章列表原始数据:', result.data.articles);
            
            // 转换API数据格式为组件所需格式（使用驼峰命名）
            articles.value = result.data.articles.map(article => {
                // 获取时间戳，如果解析失败则为 NaN
                const updatedTime = new Date(article.updatedAt || 0).getTime();
                const createdTime = new Date(article.createdAt || 0).getTime();
                
                // 使用最新时间，容错处理 NaN 的情况
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
                    tags: article.category ? (typeof article.category === 'string' ? JSON.parse(article.category) : article.category) : []
                };
            }).sort((a, b) => {
                // 按照最新时间降序排序，容错处理无效时间
                const timeA = new Date(b.published_at).getTime();
                const timeB = new Date(a.published_at).getTime();
                return (!isNaN(timeA) && !isNaN(timeB)) ? (timeA - timeB) : 0;
            });
            
            console.log('转换后的文章数据:', articles.value);
            console.log('成功加载文章数量:', articles.value.length);
        } else {
            throw new Error(result.msg || result.message || '数据格式错误');
        }
    } catch (error) {
        console.error('获取文章失败:', error);
        articles.value = [];
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

// 监听路由变化，确保在切换到文章列表模式时重新加载数据
watch(() => route.path, (newPath) => {
    if (newPath === '/articles') {
        loadAllArticles();
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
