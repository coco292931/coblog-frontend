<template>
    <div class="big-container">
        <NavBar />
        <div class="activate-page">
            <div class="activate-card">
                <div class="activate-status" :class="statusClass">{{ statusLabel }}</div>
                <h1>{{ title }}</h1>
                <p>{{ message }}</p>

                <div class="activate-actions">
                    <router-link v-if="success" to="/login" class="primary-link">去登录</router-link>
                    <router-link v-else to="/me" class="primary-link">返回我的页面</router-link>
                    <router-link to="/" class="secondary-link">返回首页</router-link>
                </div>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import api from '../../api/index.js';
import './index.css';

const route = useRoute();

const loading = ref(true);
const success = ref(false);
const title = ref('正在验证激活链接');
const message = ref('请稍候，正在为你完成账户激活。');

const statusClass = computed(() => {
    if (loading.value) return 'status-loading';
    return success.value ? 'status-success' : 'status-error';
});

const statusLabel = computed(() => {
    if (loading.value) return '处理中';
    return success.value ? '已激活' : '激活失败';
});

onMounted(async () => {
    const token = route.query.token;

    if (!token || typeof token !== 'string') {
        loading.value = false;
        title.value = '激活链接无效';
        message.value = '缺少激活参数，请重新从邮件中打开完整链接。';
        return;
    }

    try {
        const result = await api.get('/api/auth/activate', {
            params: { token }
        });

        if (result.code === 200) {
            success.value = true;
            title.value = '账户激活成功';
            message.value = result.msg || '你的账户已成功激活，现在可以正常登录。';
        } else {
            title.value = '账户激活失败';
            message.value = result.msg || '激活链接已失效，请返回“我的”页面重新发送激活邮件。';
        }
    } catch (error) {
        console.error('账户激活失败:', error);
        title.value = '账户激活失败';
        message.value = error.response?.data?.msg || '激活请求失败，请稍后重试。';
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped></style>