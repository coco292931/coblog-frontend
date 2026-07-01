<template>
    <div class="me-container">
        <NavBar />
        <div class="me-page">
            <div v-if="loading" class="loading-container">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>

            <div v-else-if="userInfo" class="user-info-card">
                <div v-if="!userInfo.activated" class="activation-inline-card">
                    <div class="activation-header">
                        <div class="activation-badge">账户待激活</div>
                        <h2>请先完成邮箱激活</h2>
                        <p>未激活的账户的权限跟未登录时一致</p>
                    </div>

                    <div class="activation-actions">
                        <button
                            class="activation-button"
                            @click="handleResendActivation"
                            :disabled="resendLoading || resendCountdown > 0"
                        >
                            {{ resendCountdown > 0 ? `${resendCountdown}秒后可重发` : (resendLoading ? '发送中...' : '重新发送激活邮件') }}
                        </button>
                    </div>

                    <p v-if="activationMessage" class="activation-message">{{ activationMessage }}</p>

                </div>

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
                        <span class="info-label">✅ 账户激活状态：</span>
                        <span class="info-value" :class="userInfo.activated ? 'status-enabled' : 'status-disabled'">
                            {{ userInfo.activated ? '已激活' : '未激活' }}
                        </span>
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

            <div v-else class="activation-card">
                <div class="activation-header">
                    <div class="activation-badge">未登录</div>
                    <h2>请先登录</h2>
                    <p>需要先登录后，才能在“我的”页面查看账户激活状态。</p>
                </div>

                <div class="activation-actions">
                    <router-link to="/login" class="activation-link-button">返回登录</router-link>
                    <router-link to="/register" class="activation-link-button">去注册</router-link>
                </div>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import api from '../../api/index.js';
import { resendActivationEmail } from '../../api/auth.js';
import { getToken, removeToken, setRSSToken, isAuthenticated } from '../../utils/auth.js';
import './index.css';

const router = useRouter();
const loading = ref(true);
const userInfo = ref(null);
const resendLoading = ref(false);
const resendCountdown = ref(0);
const activationMessage = ref('');
let resendTimer = null;

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
            
            // 使用封装的工具保存 RSS token
            const rssToken = result.data.rssToken || result.data.rss_token;
            console.log('rssToken from API:', rssToken);
            
            if (rssToken) {
                setRSSToken(rssToken);
                console.log('RSS Token 已保存:', rssToken);
            } else {
                console.warn('API未返回 rssToken');
            }

            if (!result.data.activated) {
                activationMessage.value = '当前账户尚未激活，权限和访客一致。请完成激活以提升权限。';
            } else {
                activationMessage.value = '';
            }
            
            console.log('用户信息加载成功:', userInfo.value);
        } else {
            // 获取失败，跳转到登录页面
            console.error('获取用户信息失败 - code不是200:', result.msg);
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
    // 使用封装的工具清除所有token和用户信息
    removeToken();
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');
    
    console.log('已退出登录');
    
    // 跳转到登录页面
    router.push('/login');
};

const startResendCountdown = () => {
    resendCountdown.value = 60;
    if (resendTimer) {
        clearInterval(resendTimer);
    }
    resendTimer = setInterval(() => {
        resendCountdown.value -= 1;
        if (resendCountdown.value <= 0) {
            clearInterval(resendTimer);
            resendTimer = null;
        }
    }, 1000);
};

const handleResendActivation = async () => {
    if (!userInfo.value?.email) {
        activationMessage.value = '缺少待激活邮箱，请重新注册或登录。';
        return;
    }

    try {
        resendLoading.value = true;
        const result = await resendActivationEmail(userInfo.value.email);

        if (result.code === 200) {
            activationMessage.value = result.msg || '激活邮件已发送。';
            if (result.data?.alreadyActivated) {
                userInfo.value = {
                    ...userInfo.value,
                    activated: true,
                    permGroupID: 2,
                };
                return;
            }
            startResendCountdown();
        } else {
            activationMessage.value = result.msg || '重发失败，请稍后再试。';
        }
    } catch (error) {
        console.error('重发激活邮件失败:', error);
        activationMessage.value = error.response?.data?.msg || '重发失败，请稍后再试。';
    } finally {
        resendLoading.value = false;
    }
};

// 页面加载时检查 token 并获取用户信息
onMounted(() => {
    console.log('=== /me 页面加载 ===');
    
    // 使用封装的工具检查登录状态
    if (!isAuthenticated()) {
        // 没有 token，直接跳转到登录页面
        console.log('未登录（无token），跳转到登录页面');
        loading.value = false;
        router.push('/login');
        return;
    }
    
    const token = getToken();
    console.log('已登录，使用的token:', token);
    
    // 有 token，获取用户信息
    fetchUserInfo();
});

onBeforeUnmount(() => {
    if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
    }
});
</script>

<style scoped></style>
