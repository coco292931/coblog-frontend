<template>
    <div class="big-container">
        <NavBar />
        <div class="forgot-container">
            <div class="forgot-box">
                <h2>找回密码</h2>
                <p class="forgot-tip">
                    输入注册邮箱，我们会发送一封包含验证码的邮件。<br>
                    验证通过后即可设置新密码。
                </p>

                <form class="form" @submit.prevent="handleSubmit">
                    <div class="form-group">
                        <input type="email" id="email" class="form__input" placeholder=" " v-model="email" required />
                        <label for="email" class="form__label">注册邮箱</label>
                    </div>

                    <div class="form-group code-group">
                        <input type="text" id="code" class="form__input" placeholder=" " inputmode="numeric"
                            maxlength="6" v-model="code" required />
                        <label for="code" class="form__label">邮箱验证码</label>
                        <button type="button" class="send-code-btn" @click="handleSendCode"
                            :disabled="sendCodeLoading || codeCountdown > 0">
                            {{ codeCountdown > 0 ? `${codeCountdown}s` : (sendCodeLoading ? '发送中' : '获取验证码') }}
                        </button>
                    </div>

                    <div class="form-group password-group">
                        <input :type="showPassword ? 'text' : 'password'" id="newPassword" class="form__input"
                            placeholder=" " v-model="newPassword" required />
                        <label for="newPassword" class="form__label">新密码</label>
                        <button type="button" class="toggle-password" @click="showPassword = !showPassword"
                            v-if="newPassword" :title="showPassword ? '隐藏密码' : '显示密码'">
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

                    <div class="form-group password-group">
                        <input :type="showConfirmPassword ? 'text' : 'password'" id="confirmPassword" class="form__input"
                            placeholder=" " v-model="confirmPassword" required />
                        <label for="confirmPassword" class="form__label">确认新密码</label>
                        <button type="button" class="toggle-password"
                            @click="showConfirmPassword = !showConfirmPassword" v-if="confirmPassword"
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

                    <p class="password-rule">{{ PASSWORD_RULE_TEXT }}</p>

                    <div class="alert-box" v-if="alertMessage" :class="alertType">
                        <span class="alert-icon">{{ alertType === 'success' ? '✅' : '⚠️' }}</span>
                        <span class="alert-text">{{ alertMessage }}</span>
                    </div>

                    <button type="submit" class="submit-btn" :disabled="isSubmitting">
                        {{ isSubmitting ? '提交中...' : '重置密码' }}
                    </button>

                    <div class="switch-mode">
                        <router-link to="/login" class="link">返回登录</router-link>
                    </div>
                </form>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import { resetPassword, sendCode } from '../../api/auth.js';
import { CODE_PURPOSE, PASSWORD_RULE_TEXT, validateNewPassword } from '../../constants/account.js';
import './index.css';

const router = useRouter();

const email = ref('');
const code = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const isSubmitting = ref(false);
const sendCodeLoading = ref(false);
const codeCountdown = ref(0);
let codeTimer = null;

const alertMessage = ref('');
const alertType = ref('error');

const showAlert = (msg, type = 'error') => {
    alertMessage.value = msg;
    alertType.value = type;
};

const startCodeCountdown = () => {
    codeCountdown.value = 60;
    if (codeTimer) {
        clearInterval(codeTimer);
    }
    codeTimer = setInterval(() => {
        codeCountdown.value -= 1;
        if (codeCountdown.value <= 0) {
            clearInterval(codeTimer);
            codeTimer = null;
        }
    }, 1000);
};

const handleSendCode = async () => {
    if (sendCodeLoading.value || codeCountdown.value > 0) {
        return;
    }
    if (!email.value) {
        showAlert('请先填写注册邮箱');
        return;
    }

    sendCodeLoading.value = true;
    alertMessage.value = '';
    try {
        const result = await sendCode(email.value, CODE_PURPOSE.RESET);
        if (result.code === 200) {
            showAlert(result.msg || '验证码已发送，请查收邮箱。', 'success');
            startCodeCountdown();
        } else {
            showAlert(result.msg || '验证码发送失败');
        }
    } catch (error) {
        console.error('发送验证码失败:', error);
        showAlert(error.response?.data?.msg || '验证码发送失败，请稍后重试');
    } finally {
        sendCodeLoading.value = false;
    }
};

const handleSubmit = async () => {
    if (isSubmitting.value) {
        return;
    }
    if (!email.value) {
        showAlert('请填写注册邮箱');
        return;
    }
    if (!code.value) {
        showAlert('请填写邮箱验证码');
        return;
    }

    const ruleError = validateNewPassword(newPassword.value, confirmPassword.value);
    if (ruleError) {
        showAlert(ruleError);
        return;
    }

    isSubmitting.value = true;
    alertMessage.value = '';
    try {
        const result = await resetPassword({
            email: email.value,
            verificationCode: code.value,
            newPassword: newPassword.value,
        });

        if (result.code === 200) {
            showAlert(result.msg || '密码重置成功，正在跳转登录…', 'success');
            setTimeout(() => router.push('/login'), 1200);
        } else {
            showAlert(result.msg || '密码重置失败');
        }
    } catch (error) {
        console.error('重置密码失败:', error);
        showAlert(error.response?.data?.msg || '密码重置失败，请稍后重试');
    } finally {
        isSubmitting.value = false;
    }
};

onBeforeUnmount(() => {
    if (codeTimer) {
        clearInterval(codeTimer);
        codeTimer = null;
    }
});
</script>

<style scoped></style>
