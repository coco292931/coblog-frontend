<template>
    <div class="timeline-container">
        <!-- 时间线部分 -->
        <div class="timeline">
            <!-- TimeLine 标题 -->
            <div class="timeline-header">TimeLine</div>

            <!-- 时间线主体 -->
            <div class="timeline-line-wrapper">
                <div class="timeline-line"></div>

                <!-- 年份标签 -->
                <div v-for="(year, index) in yearMarkers" :key="`year-${year.year}`" class="year-marker"
                    :style="{ top: year.position + 'px' }">
                    {{ year.year }}
                </div>

                <!-- 文章圆点 -->
                <div v-for="(article, index) in articles" :key="`dot-${article.id}`" class="article-dot"
                    :ref="el => setDotRef(el, index)"></div>

                <!-- 结束三角形 -->
                <div class="timeline-end" :style="{ top: timelineHeight + 90 + 'px' }">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                        <polygon points="10,0 0,10 20,10" fill="#888" />
                    </svg>
                </div>
            </div>
        </div>

        <!-- 文章列表部分 -->
        <div class="article-list" ref="articleListRef">
            <div v-for="(article, index) in articles" :key="article.id" class="article"
                :ref="el => setArticleRef(el, index)"
                @click="goToArticle(article.id)">
                <img v-if="article.cover_image" :src="article.cover_image" class="article-photo"
                    @error="handleImageError" @load="updateDotPositions" />
                <img v-else src="../assets/image/article-placeholder.jpg" class="article-photo"
                    @load="updateDotPositions" />
                <div class="text">
                    <div class="title">{{ article.title }}</div>
                    <div class="intro">{{ article.description }}</div>
                    <div class="info">
                        <div class="up-date">
                            {{ formatDate(article.published_at || article.created_at) }}
                        </div>
                        <div class="tags" v-if="article.tags && article.tags.length">
                            <span v-for="tag in article.tags" :key="tag" class="tag">
                                {{ tag }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';

// Props
const props = defineProps({
    articles: {
        type: Array,
        default: () => []
    }
});

// Refs
const articleListRef = ref(null);
const articleRefs = ref([]);
const dotRefs = ref([]);
const activeArticleIndex = ref(0);
const timelineHeight = ref(0);
const router = useRouter();

// 设置文章引用
const setArticleRef = (el, index) => {
    if (el) {
        articleRefs.value[index] = el;
    }
};

// 设置圆点引用
const setDotRef = (el, index) => {
    if (el) {
        dotRefs.value[index] = el;
    }
};

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
};

// 获取年份
const getYear = (dateString) => {
    if (!dateString) return new Date().getFullYear();
    return new Date(dateString).getFullYear();
};

// 预估的文章高度（用于初始计算）
const ARTICLE_GAP = 20;
const TIMELINE_HEADER_HEIGHT = 60;

// 计算年份标记位置 - 使用ref而不是computed，这样可以动态更新
const yearMarkers = ref([]);

// 初始化年份标记
const initYearMarkers = () => {
    const markers = [];
    let lastYear = null;

    props.articles.forEach((article, index) => {
        const year = getYear(article.published_at || article.created_at);

        if (year !== lastYear && index > 0) {
            // 年份标签位置先设为0，等实际计算后更新
            markers.push({
                year: year,
                position: 0,
                index: index
            });
            lastYear = year;
        } else if (index === 0) {
            // 第一篇文章的年份放在timeline开头
            markers.push({
                year: year,
                position: 0,
                index: index
            });
            lastYear = year;
        }
    });

    yearMarkers.value = markers;
};

// 更新圆点位置和年份位置
const updateDotPositions = () => {
    nextTick(() => {
        if (!articleListRef.value) return;

        // 文章列表的margin-top就是圆点计算的起始位置
        const articleListMarginTop = 30; // 与CSS中.article-list的margin-top保持一致
        let totalHeight = articleListMarginTop;

        articleRefs.value.forEach((articleEl, index) => {
            if (articleEl && dotRefs.value[index]) {
                // 获取文章实际高度
                const articleHeight = articleEl.offsetHeight;
                // 圆点位置 = 累计高度 + 文章高度的一半
                const dotPosition = totalHeight + articleHeight / 2 - 50;

                dotRefs.value[index].style.top = `${dotPosition}px`;

                // 累加高度（文章高度 + 间距）
                totalHeight += articleHeight + ARTICLE_GAP;
            }
        });

        // 更新时间线高度（刚好到最后一个圆点位置）
        if (dotRefs.value.length > 0) {
            const lastDot = dotRefs.value[dotRefs.value.length - 1];
            if (lastDot && lastDot.style.top) {
                timelineHeight.value = parseFloat(lastDot.style.top) + 10;
            }
        }

        // 更新年份标签位置
        updateYearMarkerPositions();
    });
};

// 更新年份标签位置（基于圆点位置）
const updateYearMarkerPositions = () => {
    const yearPositions = new Map(); // 记录每个年份第一次出现的位置

    props.articles.forEach((article, index) => {
        const year = getYear(article.published_at || article.created_at);

        // 如果这个年份还没记录过，就记录它第一次出现时的圆点位置
        if (!yearPositions.has(year) && dotRefs.value[index]) {
            const dotTop = parseFloat(dotRefs.value[index].style.top);
            yearPositions.set(year, dotTop);
        }
    });

    // 更新所有年份标签的位置
    yearMarkers.value.forEach(marker => {
        const dotPosition = yearPositions.get(marker.year);
        if (dotPosition !== undefined) {
            // 年份标签显示在该年份第一个圆点上方55px
            marker.position = dotPosition - 55;
        }
    });
};

// 处理滚动事件（可选：高亮当前可见的文章）
const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;

    articleRefs.value.forEach((articleEl, index) => {
        if (articleEl) {
            const rect = articleEl.getBoundingClientRect();
            if (rect.top < windowHeight / 2 && rect.bottom > windowHeight / 2) {
                activeArticleIndex.value = index;
            }
        }
    });
};

// 图片加载错误处理
const handleImageError = (e) => {
    e.target.src = '../assets/image/article-placeholder.jpg';
};

// 处理文章跳转
const goToArticle = (id) => {
    if (id) {
        router.push(`/articles/${id}`);
    }
};

// 监听文章数据变化
watch(() => props.articles, () => {
    initYearMarkers();
    updateDotPositions();
}, { deep: true });

onMounted(() => {
    initYearMarkers();
    updateDotPositions();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateDotPositions);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', updateDotPositions);
});
</script>

<style scoped>
.timeline-container {
    width: 90%;
    max-width: 100vw;
    margin: 40px auto 0;
    display: flex;
    justify-content: center;
    position: relative;
    padding: 0;
    right:1%;
}

/* ========== 时间线样式 ========== */
.timeline {
    position: relative;
    width: 100px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.timeline-header {
    font-size: 16px;
    /* 18px * 0.66 ≈ 12px */
    font-weight: bold;
    color: #444;
    margin-bottom: 5px;
    text-align: center;
    z-index: 2;
    transform: translateY(-13px);
}

.timeline-line-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    height: 100%;
}

.timeline-line {
    width: 4px;
    background: linear-gradient(to bottom, #667eea, #764ba2);
    border-radius: 2px;
    position: absolute;
    top: 0;
    bottom: -15px;
    height: auto;
}

/* 年份标签 */
.year-marker {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 5px 16px;
    /* 8px * 0.66 ≈ 5px, 16px * 0.66 ≈ 11px */
    border-radius: 13px;
    /* 20px * 0.66 ≈ 13px */
    font-weight: bold;
    font-size: 14px;
    /* 16px * 0.66 ≈ 11px */
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    z-index: 3;
    white-space: nowrap;
}

/* 文章圆点 */
.article-dot {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 16px;
    background-color: #888;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 2;
}

/* 结束三角形 */
.timeline-end {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
}

/* ========== 文章列表样式 ========== */
.article-list {
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 800px;
    width: 800px;
    margin-top: 34px;
    /* TimeLine标题(60px) + 年份标签位置(50px) */
}

.article {
    width: 100%;
    max-width: 90vw;
    border: 1px solid gray;
    padding: 5px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    border-radius: 15px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    cursor: pointer;
}

.article:hover {
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
    transform: translateY(-2px);
}

.article-photo {
    width: 165px;
    height: 110px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
}

.text {
    margin-left: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.title {
    font-size: 17px;
    /* 25px * 0.66 ≈ 17px */
    font-weight: bold;
    color: #333;
    line-height: 1.4;
}

.intro {
    font-size: 13px;
    /* 20px * 0.66 ≈ 13px */
    color: #666;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.info {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    /* 15px * 0.66 ≈ 10px */
    font-size: 11px;
    /* 17px * 0.66 ≈ 11px */
    color: #999;
    margin-top: auto;
}

.tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.tag {
    background: #f0f0f0;
    padding: 3px 7px;
    /* 4px * 0.66 ≈ 3px, 10px * 0.66 ≈ 7px */
    border-radius: 8px;
    /* 12px * 0.66 ≈ 8px */
    font-size: 8px;
    /* 12px * 0.66 ≈ 8px */
    color: #666;
}

/* ========== 响应式设计 ========== */
@media (max-width: 800px) {
    .timeline-container {
        padding: 0;
        margin: 0;
    }

    .timeline {
        display: none;
    }

    .article-list {
        gap: 10px;
        margin: 20px;
    }

    .article {
        padding: 5px;
    }

    .article-photo {
        width: 129px;
        height: 86px;
    }

    .title {
        font-size: 12px;
        /* 18px * 0.66 ≈ 12px */
    }

    .intro {
        font-size: 11px;
        /* 16px * 0.66 ≈ 11px */
    }

    .info {
        font-size: 9px;
        /* 14px * 0.66 ≈ 9px */
    }
}

@media (max-width: 600px) {
    .article-photo {
        display: none;
    }

    .text {
        margin-left: 0;
    }
}
</style>
