<template>
    <div class="big-container">
        <NavBar />
        <div class="login-container">
            <div class="login-box">
                <h2>{{ isLogin ? '登录' : '注册' }}</h2>
                <form @submit.prevent="handleSubmit" class="form">
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

                    <div class="form-group verification-group" v-if="!isLogin">
                        <input 
                            type="text" 
                            id="verificationCode" 
                            class="form__input" 
                            placeholder=" "
                            v-model="formData.verification_code"
                            required
                        />
                        <label for="verificationCode" class="form__label">验证码</label>
                        <button 
                            type="button" 
                            class="send-code-btn"
                            @click="handleSendCode"
                            :disabled="codeSending || countdown > 0"
                        >
                            {{ countdown > 0 ? `${countdown}秒后重试` : (codeSending ? '发送中...' : '发送验证码') }}
                        </button>
                    </div>

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
import { login, register, sendVerificationCode } from '../../api/auth';

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
    verification_code: '',
    rememberMe: false
});

// 警示消息
const alertMessage = ref('');

// 显示/隐藏密码
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 提交状态
const isSubmitting = ref(false);

// 验证码相关
const codeSending = ref(false);
const countdown = ref(0);
let countdownTimer = null;

// 监听路由变化，清空表单
watch(() => route.path, () => {
    formData.value = {
        account: '',
        password: '',
        confirmPassword: '',
        username: '',
        verification_code: '',
        rememberMe: false
    };
    alertMessage.value = '';
    countdown.value = 0;
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
});

// 发送验证码
const handleSendCode = async () => {
    if (!formData.value.account) {
        alertMessage.value = '请先输入邮箱地址！';
        return;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.value.account)) {
        alertMessage.value = '请输入有效的邮箱地址！';
        return;
    }

    try {
        codeSending.value = true;
        alertMessage.value = '';
        
        await sendVerificationCode(formData.value.account);
        
        // 开始倒计时
        countdown.value = 60;
        countdownTimer = setInterval(() => {
            countdown.value--;
            if (countdown.value <= 0) {
                clearInterval(countdownTimer);
                countdownTimer = null;
            }
        }, 1000);

        alertMessage.value = '验证码已发送，请查收邮箱！';
        setTimeout(() => {
            if (alertMessage.value === '验证码已发送，请查收邮箱！') {
                alertMessage.value = '';
            }
        }, 3000);
    } catch (error) {
        console.error('发送验证码失败:', error);
        alertMessage.value = error.response?.data?.message || '发送验证码失败，请稍后重试！';
    } finally {
        codeSending.value = false;
    }
};

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
                // 保存token
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                
                // 保存用户信息
                const userInfo = {
                    userId: response.data.userId,
                    username: response.data.username,
                    userType: response.data.userType
                };
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                
                // 如果选择记住我，保存账号
                if (formData.value.rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('userAccount', formData.value.account);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('userAccount');
                }
                
                alertMessage.value = response.message || '登录成功！';
                
                // 跳转到首页
                setTimeout(() => {
                    router.push('/');
                }, 1000);
            } else {
                alertMessage.value = response.message || '登录失败！';
            }
            
        } catch (error) {
            console.error('登录失败:', error);
            alertMessage.value = error.response?.data?.message || '登录失败，请检查账号和密码！';
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
        
        if (!formData.value.verification_code) {
            alertMessage.value = '请输入验证码！';
            return;
        }
        
        try {
            isSubmitting.value = true;
            
            const response = await register({
                account: formData.value.account,
                password: formData.value.password,
                username: formData.value.username,
                verification_code: formData.value.verification_code
            });
            
            alertMessage.value = response.message || '注册成功！即将跳转到登录页...';
            
            // 跳转到登录页
            setTimeout(() => {
                router.push('/login');
            }, 1500);
            
        } catch (error) {
            console.error('注册失败:', error);
            alertMessage.value = error.response?.data?.message || '注册失败，请稍后重试！';
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