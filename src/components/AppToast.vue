<template>
    <Teleport to="body">
        <div class="toast-stack">
            <TransitionGroup name="toast">
                <div v-for="item in toasts" :key="item.id" class="toast" :class="`toast-${item.type}`" role="status"
                    @click="dismissToast(item.id)">
                    <span class="toast-icon">{{ ICONS[item.type] || ICONS.info }}</span>
                    <span class="toast-text">{{ item.text }}</span>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script setup>
import { toasts, dismissToast } from '../composables/useToast.js';

// 不同类型给不同图标，让用户一眼分辨严重程度
const ICONS = {
    success: '✅',
    error: '⛔',
    warning: '⚠️',
    info: 'ℹ️',
};
</script>

<style scoped>
.toast-stack {
    position: fixed;
    top: 76px;
    right: 20px;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: min(360px, calc(100vw - 40px));
    pointer-events: none;
}

.toast {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid var(--color-divider);
    border-left-width: 4px;
    background: var(--color-card-bg);
    color: var(--color-text);
    font-size: 0.92rem;
    line-height: 1.6;
    box-shadow: 0 10px 30px var(--color-shadow);
    cursor: pointer;
    pointer-events: auto;
    backdrop-filter: blur(8px);
    word-break: break-word;
}

.toast-icon {
    flex-shrink: 0;
    font-size: 1rem;
    line-height: 1.5;
}

.toast-text {
    flex: 1;
    min-width: 0;
}

/* 成功：青色系，与站内新增交互统一 */
.toast-success {
    border-left-color: var(--color-cyan);
    color: var(--color-text-heading);
}

/* 错误：醒目红色 */
.toast-error {
    border-left-color: #e74c3c;
}

/* 警告：琥珀色 */
.toast-warning {
    border-left-color: #e6a23c;
}

/* 普通提示 */
.toast-info {
    border-left-color: var(--color-cyan-border);
}

/* 进出场动画 */
.toast-enter-active,
.toast-leave-active {
    transition: all 0.28s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(24px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(24px);
}

.toast-move {
    transition: transform 0.28s ease;
}

@media (max-width: 640px) {
    .toast-stack {
        top: auto;
        bottom: 20px;
        left: 16px;
        right: 16px;
        max-width: none;
    }
}
</style>
