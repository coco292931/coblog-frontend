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

export function useTheme() {
    const toggle = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
    };

    return { theme, toggle };
}
