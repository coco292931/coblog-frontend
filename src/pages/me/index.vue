<template>
    <div class="me-container">
        <NavBar />
        <div class="me-page">
            <div v-if="loading" class="loading-container">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>

            <div v-else-if="userInfo" class="user-info-card">
                <div class="user-header">
                    <div class="avatar">
                        <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="头像" />
                        <div v-else class="avatar-placeholder">{{ userInfo.username?.charAt(0)?.toUpperCase() || 'U' }}</div>
                    </div>
                    <h2 class="username">{{ userInfo.username }}</h2>
                </div>

                <div class="user-details">
                    <div class="info-item">
                        <span class="info-label">📧 邮箱：</span>
                        <span class="info-value">{{ userInfo.email }}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">📝 深度模式权限：</span>
                        <span class="info-value" :class="{ 'status-enabled': userInfo.deepable || userInfo.can_enable_depth, 'status-disabled': !(userInfo.deepable || userInfo.can_enable_depth) }">
                            {{ (userInfo.deepable || userInfo.can_enable_depth) ? '已开通' : '未开通' }}
                        </span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">🔓 深度模式状态：</span>
                        <span class="info-value" :class="{ 'status-enabled': userInfo.isDeep || userInfo.depth_enabled, 'status-disabled': !(userInfo.isDeep || userInfo.depth_enabled) }">
                            {{ (userInfo.isDeep || userInfo.depth_enabled) ? '已启用' : '未启用' }}
                        </span>
                    </div>

                    <div class="info-item">
                        <span class="info-label">🔑 RSS Token：</span>
                        <span class="info-value rss-token">{{ userInfo.rssToken || userInfo.rss_token || '暂无' }}</span>
                    </div>
                </div>

                <div class="logout-section">
                    <button class="logout-button" @click="handleLogout">退出登录</button>
                </div>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import api from '../../api/index.js';
import './index.css';

const router = useRouter();
const loading = ref(true);
const userInfo = ref(null);

// 获取用户信息
const fetchUserInfo = async () => {
    try {
        console.log('开始获取用户信息...');
        const result = await api.get('/api/user/info/');
        
        console.log('API返回的用户数据:', result);
        console.log('result.code:', result.code);
        console.log('result.data:', result.data);
        
        if (result.code === 200 && result.data) {
            userInfo.value = result.data;
            
            // 保存 RSS token 到 localStorage（后端返回的是驼峰命名 rssToken）
            const rssToken = result.data.rssToken || result.data.rss_token;
            console.log('rssToken from API:', rssToken);
            
            if (rssToken) {
                localStorage.setItem('rss_token', rssToken);
                console.log('RSS Token 已保存到 localStorage:', rssToken);
            } else {
                console.warn('API未返回 rssToken');
            }
            
            console.log('用户信息加载成功:', userInfo.value);
        } else {
            // 获取失败，跳转到登录页面
            console.error('获取用户信息失败 - code不是200:', result.message || result.msg);
            console.error('完整响应:', result);
            router.push('/login');
        }
    } catch (error) {
        console.error('获取用户信息异常 - 捕获错误:', error);
        console.error('错误详情:', error.response);
        // 发生异常，跳转到登录页面
        router.push('/login');
    } finally {
        loading.value = false;
    }
};

// 退出登录
const handleLogout = () => {
    // 删除本地 token 和其他用户信息（localStorage 和 sessionStorage 都清除）
    localStorage.removeItem('token');
    localStorage.removeItem('rss_token');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
    
    console.log('已退出登录');
    
    // 跳转到登录页面
    router.push('/login');
};

// 页面加载时检查 token 并获取用户信息
onMounted(() => {
    // 先检查 localStorage，再检查 sessionStorage
    const tokenFromLocal = localStorage.getItem('token');
    const tokenFromSession = sessionStorage.getItem('token');
    const token = tokenFromLocal || tokenFromSession;
    
    console.log('=== /me 页面加载 ===');
    console.log('localStorage.token:', tokenFromLocal);
    console.log('sessionStorage.token:', tokenFromSession);
    console.log('使用的token:', token);
    
    if (!token) {
        // 没有 token，直接跳转到登录页面
        console.log('未登录（无token），跳转到登录页面');
        loading.value = false;
        router.push('/login');
        return;
    }
    
    // 有 token，获取用户信息
    console.log('已登录，开始获取用户信息');
    fetchUserInfo();
});
</script>

<style scoped></style>
