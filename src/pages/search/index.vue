<template>
    <div class="search-page">
        <!-- 搜索栏 -->
        <div class="search-bar-container">
            <div class="search-bar">
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="搜索文章标题、内容或标签..."
                    class="search-input"
                    @keyup.enter="handleSearch"
                />
                <button class="search-button" @click="handleSearch">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                </button>
            </div>
            
            <!-- 搜索提示 -->
            <div v-if="searchQuery && !hasSearched" class="search-hint">
                按 Enter 或点击搜索按钮开始搜索
            </div>
        </div>

        <!-- 搜索结果统计 -->
        <div v-if="hasSearched" class="search-stats">
            <span v-if="isLoading">正在搜索...</span>
            <span v-else-if="filteredArticles.length > 0">
                找到 <strong>{{ filteredArticles.length }}</strong> 篇相关文章
            </span>
            <span v-else>未找到相关文章</span>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
        </div>

        <!-- 使用 ArticleTimeline 组件展示搜索结果 -->
        <div v-else-if="hasSearched && filteredArticles.length > 0" class="search-results">
            <ArticleTimeline :articles="filteredArticles" />
        </div>

        <!-- 空状态 -->
        <div v-else-if="hasSearched && filteredArticles.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" width="80" height="80" fill="#ddd">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <p class="empty-message">没有找到匹配的文章</p>
            <p class="empty-hint">尝试使用不同的关键词</p>
        </div>

        <!-- 初始状态提示 -->
        <div v-else class="initial-state">
            <svg viewBox="0 0 24 24" width="80" height="80" fill="#ddd">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <p class="initial-message">输入关键词开始搜索</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ArticleTimeline from '../../components/ArticleTimeline.vue';
import './index.css';

// Router
const router = useRouter();
const route = useRoute();

// 状态
const searchQuery = ref('');
const hasSearched = ref(false);
const isLoading = ref(false);

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

// 过滤文章
const filteredArticles = computed(() => {
    if (!searchQuery.value.trim()) {
        return [];
    }

    const query = searchQuery.value.toLowerCase().trim();
    
    return articles.value.filter(article => {
        // 搜索标题
        const titleMatch = article.title.toLowerCase().includes(query);
        
        // 搜索描述
        const descMatch = article.description.toLowerCase().includes(query);
        
        // 搜索标签
        const tagMatch = article.tags && article.tags.some(tag => 
            tag.toLowerCase().includes(query)
        );
        
        return titleMatch || descMatch || tagMatch;
    });
});

// 处理搜索
const handleSearch = () => {
    if (!searchQuery.value.trim()) {
        return;
    }
    
    // 更新 URL 查询参数
    router.push({
        path: '/search',
        query: { q: searchQuery.value }
    });
    
    hasSearched.value = true;
    isLoading.value = true;
    
    // 模拟搜索延迟（实际使用时这里应该是 API 调用）
    setTimeout(() => {
        isLoading.value = false;
    }, 500);
};

// 从 URL 初始化搜索
const initSearchFromUrl = () => {
    const q = route.query.q;
    if (q) {
        searchQuery.value = q;
        hasSearched.value = true;
        isLoading.value = true;
        
        // 模拟搜索延迟
        setTimeout(() => {
            isLoading.value = false;
        }, 500);
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
    initSearchFromUrl();
});
</script>
