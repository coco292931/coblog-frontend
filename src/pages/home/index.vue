<template>
    <div class="big-container">
        <NavBar style="position: fixed;"/>
        <div class="main-photo">
            <img src="../../assets/image/homepage-background.jpg" class='home-photo' />
            <div class="welcome-text">
                海内存知己，天涯若比邻_
            </div>
            <div class="triangle">
                <svg t="1765093670123" class="arrow" viewBox="0 0 1024 1024" width="60" height="60">
                    <path
                        d="M512 693.333333c-14.933333 0-29.866667-4.266667-40.533333-14.933333l-277.33333399-234.666667c-27.733333-23.466667-29.866667-64-8.53333301-89.6 23.466667-27.733333 64-29.866667 89.6-8.53333299L512 546.133333l236.8-200.53333299c27.733333-23.466667 68.266667-19.19999999 89.6 8.53333299 23.466667 27.733333 19.19999999 68.266667-8.53333301 89.6l-277.33333399 234.666667c-10.666667 10.666667-25.6 14.933333-40.533333 14.933333z"
                        fill="white" p-id="7744"></path>
                </svg>
            </div>
        </div>
        
        <!-- 使用新的时间线组件 -->
        <ArticleTimeline :articles="articles" />

        <!-- 触底加载状态 -->
        <div class="load-more-status">
            <div v-if="isLoadingMore" class="loading-spinner"></div>
            <span v-else-if="!hasMore && articles.length > 0" class="no-more-text">— 没有更多了 —</span>
        </div>

        <Footer />
    </div>
</template>

<script setup>
import './index.css';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import ArticleTimeline from '../../components/ArticleTimeline.vue';
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import api from '../../api/index.js';

const PAGE_SIZE = 10;

const articles = ref([]);
const total = ref(0);
const page = ref(1);
const isLoading = ref(false);
const isLoadingMore = ref(false);

const hasMore = computed(() => articles.value.length < total.value);

const parseCategories = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : (parsed ? [String(parsed)] : []);
    } catch {
        return raw.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    }
};

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
        categories: parseCategories(article.category),
    };
};

const fetchArticles = async (append = false) => {
    if (append) {
        isLoadingMore.value = true;
    } else {
        isLoading.value = true;
        page.value = 1;
    }

    try {
        const result = await api.get(`/api/articles?page=${page.value}&pageSize=${PAGE_SIZE}`);

        if (result.code === 200 && result.data && result.data.articles) {
            total.value = result.data.total ?? result.data.articles.length;
            const mapped = result.data.articles.map(mapArticle)
                .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

            if (append) {
                articles.value = [...articles.value, ...mapped]
                    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
            } else {
                articles.value = mapped;
            }
        }
    } catch (err) {
        console.error('获取文章列表失败:', err);
        if (!append) articles.value = [];
    } finally {
        isLoading.value = false;
        isLoadingMore.value = false;
        nextTick(() => {
            if (hasMore.value && document.documentElement.scrollHeight <= window.innerHeight) {
                loadMore();
            }
        });
    }
};

const loadMore = async () => {
    if (isLoading.value || isLoadingMore.value || !hasMore.value) return;
    page.value += 1;
    await fetchArticles(true);
};

const handleScroll = () => {
    const scrollBottom = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 300;
    if (scrollBottom >= threshold) loadMore();
};

onMounted(() => {
    fetchArticles(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});
</script>
