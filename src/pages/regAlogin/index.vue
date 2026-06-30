<template>
    <div class="big-container">
        <NavBar />
        <div class="login-container">
            <div class="login-box">
                <h2>{{ isLogin ? '登录' : '注册' }}</h2>
                <form @submit.prevent="handleSubmit" class="form">
                    <div class="form-group" v-if="!isLogin">
                        <input 
                            type="text" 
                            id="username" 
                            class="form__input" 
                            placeholder=" " 
                            v-model="formData.username"
                            required
                        />
                        <label for="username" class="form__label">用户名</label>
                    </div>
                    
                    <div class="form-group">
                        <input 
                            type="email" 
                            id="account" 
                            class="form__input" 
                            placeholder=" "
                            v-model="formData.account"
                            required
                        />
                        <label for="account" class="form__label">邮箱</label>
                    </div>

                    <div class="form-group password-group">
                        <input :type="showPassword ? 'text' : 'password'" id="password" class="form__input"
                            placeholder=" " v-model="formData.password" required />
                        <label for="password" class="form__label">密码</label>
                        <button type="button" class="toggle-password" @click="showPassword = !showPassword"
                            v-if="formData.password" :title="showPassword ? '隐藏密码' : '显示密码'">
                            <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path
                                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24">
                                </path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        </button>
                    </div>

                    <div class="login-options" v-if="isLogin">
                        <label class="remember-me">
                            <input type="checkbox" v-model="formData.rememberMe" />
                            <span>记住我</span>
                        </label>
                        <a href="#" class="forgot-password" @click.prevent="handleForgotPassword">忘记密码？</a>
                    </div>

                    <div class="form-group password-group" v-if="!isLogin">
                        <input :type="showConfirmPassword ? 'text' : 'password'" id="confirmPassword"
                            class="form__input" placeholder=" " v-model="formData.confirmPassword" required />
                        <label for="confirmPassword" class="form__label">确认密码</label>
                        <button type="button" class="toggle-password"
                            @click="showConfirmPassword = !showConfirmPassword" v-if="formData.confirmPassword"
                            :title="showConfirmPassword ? '隐藏密码' : '显示密码'">
                            <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path
                                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24">
                                </path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        </button>
                    </div>

                    <p v-if="!isLogin" class="register-tip">
                        注册成功后请使用邮件中的链接完成账户激活。
                    </p>

                    <div class="alert-box" v-if="alertMessage">
                        <span class="alert-icon">⚠️</span>
                        <span class="alert-text">{{ alertMessage }}</span>
                    </div>

                    <button type="submit" class="submit-btn" :disabled="isSubmitting">
                        {{ isSubmitting ? '处理中...' : (isLogin ? '登录' : '注册') }}
                    </button>

                    <div class="switch-mode">
                        <span v-if="isLogin">
                            还没有账号？
                            <router-link to="/register" class="link">立即注册</router-link>
                        </span>
                        <span v-else>
                            已有账号？
                            <router-link to="/login" class="link">立即登录</router-link>
                        </span>
                    </div>
                </form>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import './index.css';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import { login, register } from '../../api/auth';
import { setToken } from '../../utils/auth.js';

const route = useRoute();
const router = useRouter();

// 判断是登录还是注册
const isLogin = computed(() => route.path === '/login');

// 表单数据
const formData = ref({
    account: '',
    password: '',
    confirmPassword: '',
    username: '',
    rememberMe: false
});

// 警示消息
const alertMessage = ref('');

// 显示/隐藏密码
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 提交状态
const isSubmitting = ref(false);

// 监听路由变化，清空表单
watch(() => route.path, () => {
    formData.value = {
        account: '',
        password: '',
        confirmPassword: '',
        username: '',
        rememberMe: false
    };
    alertMessage.value = '';
});

// 处理表单提交
const handleSubmit = async () => {
    alertMessage.value = '';
    
    if (isLogin.value) {
        // 登录逻辑
        try {
            isSubmitting.value = true;
            
            const response = await login({
                account: formData.value.account,
                password: formData.value.password,
                rememberMe: formData.value.rememberMe
            });
            
            // 检查响应code
            if (response.code === 200 && response.data) {
                if (response.data.token) {
                    setToken(response.data.token, formData.value.rememberMe);
                }
                
                // 保存用户信息
                const userInfo = {
                    userID: response.data.userID,
                    userId: response.data.userID,
                    username: response.data.username,
                    userType: response.data.userType,
                    activated: !!response.data.activated,
                };
                const storage = formData.value.rememberMe ? localStorage : sessionStorage;
                storage.setItem('userInfo', JSON.stringify(userInfo));
                
                alertMessage.value = response.msg || '登录成功！';
                
                // 跳转到我的页面，让前端通过 userinfo 获取真实激活状态
                setTimeout(() => {
					router.push('/me');
                }, 1000);
            } else {
                alertMessage.value = response.msg || '登录失败！';
            }
            
        } catch (error) {
            console.error('登录失败:', error);
            alertMessage.value = error.response?.data?.msg || '登录失败，请检查账号和密码！';
        } finally {
            isSubmitting.value = false;
        }
    } else {
        // 注册逻辑
        if (!formData.value.username) {
            alertMessage.value = '请输入用户名！';
            return;
        }
        
        if (formData.value.password !== formData.value.confirmPassword) {
            alertMessage.value = '两次输入的密码不一致，请重新输入！';
            return;
        }

        if (formData.value.password.length < 6) {
            alertMessage.value = '密码长度至少需要6位字符！';
            return;
        }
        
        try {
            isSubmitting.value = true;
            
            const response = await register({
                account: formData.value.account,
                password: formData.value.password,
                username: formData.value.username,
            });

            if (response.code === 200) {
                alertMessage.value = response.msg || '注册成功，激活邮件已发送！';

                setTimeout(() => {
					router.push('/login');
                }, 1200);
            } else {
                alertMessage.value = response.msg || '注册失败，请稍后重试！';
            }
            
        } catch (error) {
            console.error('注册失败:', error);
            alertMessage.value = error.response?.data?.msg || '注册失败，请稍后重试！';
        } finally {
            isSubmitting.value = false;
        }
    }
};

// 处理忘记密码
const handleForgotPassword = () => {
    console.log('忘记密码');
    // TODO: 跳转到忘记密码页面或显示重置密码弹窗
    alert('忘记密码功能开发中...');
};
</script>

<style scoped></style>