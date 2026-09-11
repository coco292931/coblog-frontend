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
                        <span class="info-value rss-token">{{ userInfo.rssToken || '暂无' }}</span>
                    </div>
                </div>

                <!-- 账户安全：修改密码 -->
                <div class="security-section">
                    <button class="security-toggle" @click="toggleSection('password')">
                        <span>🔒 修改密码</span>
                        <span class="security-arrow" :class="{ open: openSection === 'password' }">›</span>
                    </button>

                    <div v-if="openSection === 'password'" class="security-panel">
                        <div class="panel-field">
                            <label>当前密码</label>
                            <input :type="showOldPwd ? 'text' : 'password'" v-model="pwdForm.oldPassword"
                                placeholder="请输入当前密码" autocomplete="current-password" />
                        </div>
                        <div class="panel-field">
                            <label>新密码</label>
                            <input :type="showNewPwd ? 'text' : 'password'" v-model="pwdForm.newPassword"
                                :placeholder="PASSWORD_RULE_TEXT" autocomplete="new-password" />
                        </div>
                        <div class="panel-field">
                            <label>确认新密码</label>
                            <input :type="showNewPwd ? 'text' : 'password'" v-model="pwdForm.confirmPassword"
                                placeholder="请再次输入新密码" autocomplete="new-password" />
                        </div>

                        <label class="pwd-visibility">
                            <input type="checkbox" v-model="showNewPwd" />
                            <span>显示新密码</span>
                        </label>

                        <p v-if="pwdMessage" class="panel-message" :class="pwdMessageType">{{ pwdMessage }}</p>

                        <button class="panel-btn" :disabled="pwdSubmitting" @click="handleChangePwd">
                            {{ pwdSubmitting ? '提交中…' : '确认修改' }}
                        </button>
                    </div>
                </div>

                <!-- 账户安全：重置 RSS Token -->
                <div class="security-section">
                    <button class="security-toggle" @click="toggleSection('rss')">
                        <span>🔄 重置 RSS Token</span>
                        <span class="security-arrow" :class="{ open: openSection === 'rss' }">›</span>
                    </button>

                    <div v-if="openSection === 'rss'" class="security-panel">
                        <p class="panel-hint">
                            重置后旧的 RSS 订阅地址会立即失效，需要在阅读器中重新订阅。
                        </p>

                        <p v-if="rssMessage" class="panel-message" :class="rssMessageType">{{ rssMessage }}</p>

                        <button class="panel-btn danger" :disabled="rssSubmitting" @click="handleResetRSSToken">
                            {{ rssSubmitting ? '重置中…' : '确认重置' }}
                        </button>
                    </div>
                </div>

                <div class="logout-section">
                    <button class="logout-button" @click="handleLogout">退出登录</button>
                </div>
            </div>

            <div v-else class="activation-card">
                <div class="activation-header">
                    <div class="activation-badge">{{ permDenied ? '权限不足' : '暂时无法显示' }}</div>
                    <h2>{{ permDenied ? '无法查看个人信息' : '获取信息失败' }}</h2>
                    <p>{{ permDenied
                        ? '你的账户已登录，但当前权限组还不能读取个人信息。通常是账户尚未完成邮箱激活，激活后即可正常查看。'
                        : (fetchError || '请稍后重试。') }}</p>
                </div>

                <div class="activation-actions">
                    <router-link to="/activate" class="activation-link-button">去激活账户</router-link>
                    <router-link to="/" class="activation-link-button">返回首页</router-link>
                    <button class="activation-link-button" @click="handleLogout">退出登录</button>
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
import { resendActivationEmail, changePassword, resetRSSToken } from '../../api/auth.js';
import { PASSWORD_RULE_TEXT, validateNewPassword } from '../../constants/account.js';
import { removeToken, setRSSToken } from '../../utils/auth.js';
import './index.css';

const router = useRouter();
const loading = ref(true);
const userInfo = ref(null);
const resendLoading = ref(false);
const resendCountdown = ref(0);
const activationMessage = ref('');
let resendTimer = null;

/** 账户已登录，但权限组不允许读取个人信息（如未激活账户） */
const permDenied = ref(false);
/** 其它非登录态的获取失败提示 */
const fetchError = ref('');

/** 当前展开的安全面板：'' | 'password' | 'rss' */
const openSection = ref('');

// 修改密码表单
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const showOldPwd = ref(false);
const showNewPwd = ref(false);
const pwdSubmitting = ref(false);
const pwdMessage = ref('');
const pwdMessageType = ref('info');

// 重置 RSS Token
const rssSubmitting = ref(false);
const rssMessage = ref('');
const rssMessageType = ref('info');

// 手风琴：同一时间只展开一个面板
const toggleSection = (name) => {
    openSection.value = openSection.value === name ? '' : name;
};

// 获取用户信息
const fetchUserInfo = async () => {
    try {
        const result = await api.get('/api/user/info/');

        if (result.code === 200 && result.data) {
            userInfo.value = result.data;

            // 使用封装的工具保存 RSS token
            const rssToken = result.data.rssToken;
            if (rssToken) {
                setRSSToken(rssToken);
            }

            if (!result.data.activated) {
                activationMessage.value = '当前账户尚未激活，权限和访客一致。请完成激活以提升权限。';
            } else {
                activationMessage.value = '';
            }
        } else if (result.code === 1002) {
            // 1002 = 用户无此权限。账户本身是登录着的，只是权限组不允许读取个人信息
            // （例如未激活的 GUEST 账户）。此时绝不能清 token 或跳登录页，
            // 否则会出现“明明已登录却被踢回登录页”的假象。
            permDenied.value = true;
            activationMessage.value = result.msg || '当前账户无权查看个人信息，请先完成邮箱激活。';
        } else {
            // 其余业务错误：保留在页面上提示，交由 axios 拦截器处理登录态
            fetchError.value = result.msg || '获取用户信息失败';
        }
    } catch (error) {
        console.error('获取用户信息异常:', error);
        fetchError.value = error.response?.data?.msg || '获取用户信息失败，请稍后重试';
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
    if (resendLoading.value || resendCountdown.value > 0) {
        return;
    }

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

// 页面加载时获取用户信息（登录态已由全局路由守卫保证）
onMounted(() => {
    console.log('=== /me 页面加载 ===');
    fetchUserInfo();
});

// 修改密码：校验新密码后调用后端
const handleChangePwd = async () => {
    if (pwdSubmitting.value) {
        return;
    }

    pwdMessage.value = '';
    if (!pwdForm.value.oldPassword) {
        pwdMessage.value = '请输入当前密码';
        pwdMessageType.value = 'error';
        return;
    }

    const ruleError = validateNewPassword(pwdForm.value.newPassword, pwdForm.value.confirmPassword);
    if (ruleError) {
        pwdMessage.value = ruleError;
        pwdMessageType.value = 'error';
        return;
    }

    pwdSubmitting.value = true;
    try {
        const result = await changePassword({
            oldPassword: pwdForm.value.oldPassword,
            newPassword: pwdForm.value.newPassword,
        });

        if (result.code === 200) {
            pwdMessage.value = result.msg || '密码修改成功';
            pwdMessageType.value = 'success';
            pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
            showOldPwd.value = false;
            showNewPwd.value = false;
        } else {
            pwdMessage.value = result.msg || '密码修改失败';
            pwdMessageType.value = 'error';
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        pwdMessage.value = error.response?.data?.msg || '密码修改失败，请稍后重试';
        pwdMessageType.value = 'error';
    } finally {
        pwdSubmitting.value = false;
    }
};

// 重置 RSS Token：成功后同步刷新本地存储与页面展示
const handleResetRSSToken = async () => {
    if (rssSubmitting.value) {
        return;
    }
    if (!window.confirm('确定要重置 RSS Token 吗？旧订阅地址将立即失效。')) {
        return;
    }

    rssMessage.value = '';
    rssSubmitting.value = true;
    try {
        const result = await resetRSSToken();

        if (result.code === 200) {
            const newToken = result.data?.newToken;
            if (newToken) {
                setRSSToken(newToken);
                if (userInfo.value) {
                    userInfo.value = { ...userInfo.value, rssToken: newToken };
                }
            }
            rssMessage.value = result.msg || 'RSS Token 已重置';
            rssMessageType.value = 'success';
        } else {
            rssMessage.value = result.msg || 'RSS Token 重置失败';
            rssMessageType.value = 'error';
        }
    } catch (error) {
        console.error('重置 RSS Token 失败:', error);
        rssMessage.value = error.response?.data?.msg || 'RSS Token 重置失败，请稍后重试';
        rssMessageType.value = 'error';
    } finally {
        rssSubmitting.value = false;
    }
};

onBeforeUnmount(() => {
    if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
    }
});</script>

<style scoped></style>
