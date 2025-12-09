<template>
    <div class="footer-container">
        <div class="footer-content">
            <div class="copyright">
                © 2025 coco_29. All Rights Reserved.
            </div>
            <div class="stats">
                <span class="stat-item">🖊️ 站点总字数 ≈ {{ formatNumber(siteStats.total_words) }}</span>
                <span class="separator">|</span>
                <span class="stat-item">🍵 阅读时长 ≈ {{ readingTime }}</span>
            </div>
            <div class="uptime" >
                {{ uptimeDisplay }}
            </div>
            <div class="powered">
                Powered by Vue & GO
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 网站统计数据
const siteStats = ref({
    total_articles: 0,
    total_words: 0,
    total_visits: 0,
    total_visitors: 0,
    uptime: '',
    started_time: ''
});

// 当前时间（用于计算运行时长）
const currentTime = ref(new Date());
let timer = null;

// 格式化数字（5000 -> 5k）
const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'm';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
};

// 计算阅读时长（假设每分钟阅读300字）
const readingTime = computed(() => {
    const minutes = Math.ceil(siteStats.value.total_words / 300);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    return `0:${mins.toString().padStart(2, '0')}`;
});

// 获取开放时间（后端数据或默认值）
const openTime = computed(() => {
    if (siteStats.value.started_time) {
        return new Date(siteStats.value.started_time);
    }
    // 默认开放时间：2025年12月20日
    return new Date('2025-12-20T00:00:00');
});

// 计算运行时长
const uptimeDisplay = computed(() => {
    const startTime = openTime.value;
    const diff = currentTime.value - startTime;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const displaySeconds = seconds % 60;
    const displayMinutes = minutes % 60;
    const displayHours = hours % 24;
    
        
    if (diff > 0) {
        return `已避风 ${days}天${displayHours}时${displayMinutes}分${displaySeconds}秒`;
    }
    return `本港湾还有 ${-days}天${-displayHours}时${-displayMinutes}分${-displaySeconds}秒 开放`;
});

// 获取网站统计数据
const fetchSiteStats = async () => {
    try {
        // 这里替换成实际的API地址
        const url="http://127.0.0.1:4523/m1/7489100-7224477-6663459"
        const response = await fetch(`${url}/api/site/info`);
        if (response.ok) {
            const data = await response.json();
            siteStats.value = data.data;
        }
    } catch (error) {
        console.error('获取网站统计数据失败:', error);
        // 使用默认数据
        siteStats.value = {
            total_articles: 0,
            total_words: 5000,
            total_visits: 0,
            total_visitors: 0,
            uptime: '',
            started_time: '' // 空字符串时使用默认开放时间 2025-12-20
        };
    }
};

onMounted(() => {
    // 每秒更新一次时间（先启动定时器，确保即使API失败也能更新）
    timer = setInterval(() => {
        currentTime.value = new Date();
    }, 1000);
    
    // 获取统计数据
    fetchSiteStats();
});

onUnmounted(() => {
    if (timer) {
        clearInterval(timer);
    }
});
</script>

<style scoped>
.footer-container {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px 20px;
    margin-top: 60px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
}

.footer-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.copyright {
    font-size: 14px;
    font-weight: 500;
    opacity: 0.95;
}

.stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    opacity: 0.9;
}

.stat-item {
    display: inline-flex;
    align-items: center;
}

.separator {
    opacity: 0.6;
    display: inline-flex;
    align-items: center;
}

.uptime {
    font-size: 13px;
    opacity: 0.9;
    font-family: 'Courier New', monospace;
}

.powered {
    font-size: 12px;
    opacity: 0.8;
    font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .footer-container {
        padding: 20px 15px;
    }
    
    .stats {
        flex-direction: column;
        gap: 5px;
    }
    
    .separator {
        display: none;
    }
    
    .footer-content {
        gap: 10px;
    }
}
</style>
