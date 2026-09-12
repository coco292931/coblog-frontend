import { ref, watchEffect } from 'vue';

const STORAGE_KEY = 'coblog-theme';

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY);
}

// 全局单例，跨组件共享
const theme = ref(getSavedTheme() || getSystemTheme());

watchEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.value);
    localStorage.setItem(STORAGE_KEY, theme.value);
});

// 切换主题时临时打开全局颜色过渡（对应 base.css 里的 html.theme-transitioning），
// 让导航/背景/卡片平滑变色；过渡结束就摘掉类，
// 避免平时给所有元素挂着 transition 影响 hover 手感。
const TRANSITION_CLASS = 'theme-transitioning';
const TRANSITION_MS = 400;
let transitionTimer = null;

export function useTheme() {
    const toggle = () => {
        const root = document.documentElement;
        root.classList.add(TRANSITION_CLASS);
        if (transitionTimer) window.clearTimeout(transitionTimer);
        transitionTimer = window.setTimeout(() => {
            root.classList.remove(TRANSITION_CLASS);
            transitionTimer = null;
        }, TRANSITION_MS);

        theme.value = theme.value === 'dark' ? 'light' : 'dark';
    };

    return { theme, toggle };
}
