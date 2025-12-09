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
import { useRouter, useRoute } from 'vue-router';
import { ref, onMounted } from 'vue';

// 文章列表数据
const articles = ref([]);
const loading = ref(false);
const error = ref(null);

// 获取文章列表
const fetchArticles = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        // 替换成实际的API地址
        const response = await fetch('/api/articles');
        //page,page_size,category,tag,q 搜索共用
        
        if (!response.ok) {
            throw new Error('获取文章列表失败');
        }
        
        const result = await response.json();
        
        if (result.code === 0 && result.data && result.data.articles) {
            // 转换API数据格式为组件所需格式
            const articleList = result.data.articles.map(article => ({
                id: article.id,
                cover_image: article.cover_image || '',
                title: article.title,
                description: article.summary, // API用的是summary字段
                published_at: article.published_at || article.created_at, // 优先使用published_at，否则使用created_at
                created_at: article.created_at,
                updated_at: article.updated_at,
                tags: article.categories || [] // API用的是categories字段
            }));
            
            // 按照时间降序排序（最新的在前）
            // 优先级: updated_at > published_at > created_at
            articles.value = articleList.sort((a, b) => {
                const getLatestTime = (article) => {
                    const times = [
                        article.updated_at,
                        article.published_at,
                        article.created_at
                    ].filter(Boolean).map(t => new Date(t).getTime());
                    return Math.max(...times);
                };
                
                return getLatestTime(b) - getLatestTime(a);
            });
            
            console.log('排序后的文章列表:', articles.value.map(a => ({ 
                id: a.id, 
                title: a.title, 
                published_at: a.published_at,
                created_at: a.created_at,
                updated_at: a.updated_at
            })));
        } else {
            throw new Error(result.message || '数据格式错误');
        }
    } catch (err) {
        console.error('获取文章列表失败:', err);
        error.value = err.message;
        
        // 使用默认示例数据
        articles.value = [
            { 
                id: '1', 
                cover_image: '',
                title: 'Vue 3 组合式 API 最佳实践', 
                description: 'Vue 3 带来了全新的组合式 API，让我们的代码更加灵活和可维护。本文将介绍一些最佳实践...',
                published_at: '2024-06-01',
                created_at: '2024-06-01',
                tags: ['Vue', '前端']
            },
            { 
                id: '2', 
                cover_image: '', 
                title: 'TypeScript 进阶技巧', 
                description: 'TypeScript 为 JavaScript 带来了强类型系统，本文将深入探讨一些高级技巧和模式...',
                published_at: '2024-05-15',
                created_at: '2024-05-15',
                tags: ['TypeScript', '进阶']
            },
            { 
                id: '0', 
                cover_image: '', 
                title: 'CSS Grid 布局完全指南', 
                description: 'CSS Grid 是现代网页布局的强大工具，通过本指南你将掌握 Grid 布局的所有核心概念...',
                published_at: '2223-12-20',
                created_at: '2332-12-20',
                tags: ['CSS','ts', '布局']
            },
        ];
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchArticles();
});

</script>

<style scoped></style>
