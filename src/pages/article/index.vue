<template>
    <div class="big-container">
        <NavBar />
        <!-- 文章封面区域 -->
        <div class="main-photo-article">
            <img src="../../assets/image/homepage-background.jpg" class='cover_image' />
            <div class="summary">
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
                        <span>{{ categories }}</span>
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
                <!-- 文章内容 -->
                <div class="article-content">
                    <div class="main-body" v-html="articleHtml">
                    </div>
                    <!-- 版权信息 -->
                    <div class="license-info">
                        <div class="license-title">📄 版权声明</div>
                        <div class="license-text">
                            本文作者：{{ author }}<br>
                            本文链接：{{ articleUrl }}<br>
                            版权声明：本博客所有文章除特别声明外，均采用 CC BY-NC-SA 4.0 许可协议。转载请注明出处！
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
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import './index.css';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import IconDocumentation from '../../components/icons/IconDocumentation.vue';
import IconHistory from '../../components/icons/IconHistory.vue';
import api from '../../api/index.js';

const route = useRoute();
const articleId = ref(route.params.article_id);

// 文章基本信息
const articleTitle = ref('加载中...');
const articleSubtitle = ref('');
const createTime = ref('');
const updateTime = ref('');
const categories = ref('');
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
            articleHtml.value = data.content || '<p>暂无内容</p>';
            
            // 处理时间字段
            createTime.value = data.createdAt ? formatDateTime(data.createdAt) : '';
            updateTime.value = data.updatedAt ? formatDateTime(data.updatedAt) : '';

            // 处理分类（数组转字符串）
            categories.value = Array.isArray(data.categories) ? data.categories.join(', ') : (data.categories || '未分类');

            // 处理标签（数组转字符串）
            tags.value = Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || '');

            readingTime.value = data.readingTime || data.reading_time || 0;
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

onMounted(() => {
    fetchArticleData();
});
</script>

<style scoped></style>
