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

        <Footer />
    </div>
</template>

<script setup>
import './index.css';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import ArticleTimeline from '../../components/ArticleTimeline.vue';
import { ref, onMounted } from 'vue';
import api from '../../api/index.js';


// 文章列表数据
const articles = ref([]);
const loading = ref(false);
const error = ref(null);

// 获取文章列表
const fetchArticles = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        // 使用axios调用API获取文章列表
        const result = await api.get('/api/articles');
        
        console.log('API返回的原始数据:', result);
        
        if (result.code === 200 && result.data && result.data.articles) {
            console.log('文章列表原始数据:', result.data.articles);
            
            // 转换API数据格式为组件所需格式
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
            console.log('获取文章列表成功，共', articles.value.length, '篇文章');
        } else {
            throw new Error(result.message || '数据格式错误');
        }
    } catch (err) {
        console.error('获取文章列表失败:', err);
        error.value = err.message || '获取文章列表失败，请稍后重试';
        articles.value = [];
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchArticles();
});

</script>

<style scoped></style>
