<template>
    <nav class="navbar">
        <!-- 遮罩放在 Teleport 里：.navbar 有 backdrop-filter，会成为 fixed 子元素的包含块，
             直接放在 nav 里的话遮罩只会盖住 60px 高的导航条。
             放在 nav 内部（而不是和 nav 并列）是为了保持单根节点 ——
             首页/文章页给 <NavBar style="position: fixed"> 传了 style，多根会导致它被丢掉。 -->
        <Teleport to="body">
            <Transition name="scrim-fade">
                <div v-if="isMenuOpen" class="navbar-scrim" @click="closeMenu"></div>
            </Transition>
        </Teleport>

        <div class="navbar-container">
            <div class="navbar-brand">
                <router-link to="/" class="brand-link">
                    Coco の 避风港
                </router-link>
            </div>

            <div><!--留给动态增加--></div>

            <div id="navbar-menu" class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
                <div class="search">
                    <div id="search-input" style="display: flex; position: relative; align-items: center;overflow: hidden;border-radius: 999px;">
                        <input type="text" v-model="searchQuery" id="search-input-text" placeholder="搜点什么..." @keyup.enter="handleSearch" />
                        <router-link :to="`/search?q=${searchQuery}`" @click="closeMenu" id="search-icon"
                            aria-label="搜索">
                            <IconSearch class="nav-icon" style="transform: scale(1.15)" />
                        </router-link>
                    </div>
                </div>
                <router-link :to="`/articles`" class="navbar-item" id="search-article-list" @click="closeMenu">
                    <IconHistory class="nav-icon" style="transform: scale(1.03)" />足迹
                </router-link>
                <router-link v-if="loggedIn" to="/write" class="navbar-item" @click="closeMenu">
                    <IconArticles class="nav-icon" />写作
                </router-link>
                <router-link to="/rss" class="navbar-item" id="search-rss" @click="closeMenu">
                    <IconRSS class="nav-icon" style="transform: scale(0.97)" />RSS
                </router-link>
                <router-link to="/about" class="navbar-item" :class="{ 'router-link-active': route.path.startsWith('/about') }"
                    @click="closeMenu">
                    <IconInfo class="nav-icon" style="transform: scale(1.59)" />关于
                </router-link>
                <router-link to="/me" class="navbar-item" @click="closeMenu">
                    <IconUser class="nav-icon" style="transform: scale(1.71)" />我的
                </router-link>
                <button class="navbar-item theme-toggle" @click="toggleTheme" :title="isDark ? '切换到亮色' : '切换到暗色'"
                    :aria-label="isDark ? '切换到亮色' : '切换到暗色'">
                    <IconStyleMoon v-if="isDark" class="nav-icon" style="transform: scale(1.09)" />
                    <IconStyleSun v-else class="nav-icon" style="transform: scale(1.32)" />
                </button>
            </div>

            <button type="button" class="navbar-burger" :class="{ 'is-active': isMenuOpen }"
                :aria-expanded="isMenuOpen ? 'true' : 'false'" aria-controls="navbar-menu" aria-label="导航菜单"
                @click="toggleMenu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </nav>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { isAuthenticated } from '../utils/auth.js';
import { useTheme } from '../composables/useTheme.js';
import IconSearch from './icons/IconSearch.vue';
import IconArticles from './icons/IconArticles.vue';
import IconHistory from './icons/IconHistory.vue';
import IconRSS from './icons/IconRSS.vue';
import IconInfo from './icons/IconInfo.vue';
import IconUser from './icons/IconUser.vue';
import IconStyleMoon from './icons/IconStyleMoon.vue';
import IconStyleSun from './icons/IconStyleSun.vue';

const router = useRouter();
const route = useRoute();
const isMenuOpen = ref(false);
const searchQuery = ref('');
const loggedIn = ref(isAuthenticated());

// 路由变化时重新检测登录态（登录/登出后导航栏不会重建，需主动刷新）
watch(() => route.fullPath, () => {
    loggedIn.value = isAuthenticated();
    // 前进/后退等非点击式跳转也要收起菜单
    isMenuOpen.value = false;
});

// 搜索框回填：进入 /search?q=xxx 时把关键词带进导航栏输入框。
watch(
    () => route.query.q,
    (q) => {
        if (typeof q === 'string') searchQuery.value = q;
    },
    { immediate: true }
);

const { theme, toggle: toggleTheme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
    isMenuOpen.value = false;
};

const handleSearch = () => {
    if (searchQuery.value.trim()) {
        router.push(`/search?q=${searchQuery.value}`);
        closeMenu();
    }
};

// 菜单展开时锁住页面滚动
watch(isMenuOpen, (open) => {
    document.documentElement.classList.toggle('menu-open', open);
});

const onKeydown = (e) => {
    if (e.key === 'Escape' && isMenuOpen.value) closeMenu();
};


const mobileQuery = window.matchMedia('(max-width: 800px)');
const onBreakpointChange = (e) => {
    if (!e.matches) closeMenu();
};

onMounted(() => {
    window.addEventListener('keydown', onKeydown);
    mobileQuery.addEventListener('change', onBreakpointChange);
});

onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    mobileQuery.removeEventListener('change', onBreakpointChange);
    document.documentElement.classList.remove('menu-open');
});
</script>

<style scoped>
.navbar {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    background-color: var(--color-background-glass);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding: 0 20px;
    box-sizing: border-box;
}

.navbar-container {
    max-width: 1500px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    opacity: 1;
}

.navbar-brand {
    font-size: 1.5rem;
    font-weight: bold;
}

.brand-link {
    text-decoration: none;
    color: var(--color-brand-title);
    font-weight: bold;
    transition: color 0.3s, text-shadow 0.3s;
    /* 两层阴影交叉淡入淡出：亮色是黑色投影，暗色是青色辉光。
       拆成两个可插值的颜色变量，免得切换时黑色投影和青色辉光互相硬切。 */
    text-shadow: 0 1px 3px var(--color-brand-ink), 0 0 12px var(--color-brand-glow);
    letter-spacing: 0.5px;
}

.brand-link:hover {
    color: var(--color-cyan);
    text-shadow: 0 1px 6px var(--color-cyan-shadow);
}

/* 暗色模式：深底上用聚拢的青色辉光，避免亮色下那种浑浊光晕。
   颜色与辉光都交给 --color-brand-title / --color-brand-* 变量（见 base.css），
   这里只保留 hover 的增强。 */
html[data-theme="dark"] .brand-link:hover {
    color: rgb(120, 250, 250);
    text-shadow: 0 0 18px rgba(31, 239, 239, 0.8);
}

.navbar-menu {
    display: flex;
    gap: 8px;
}

.navbar-item {
    text-decoration: none;
    color: var(--color-text);
    font-size: 1rem;
    font-weight: 500;
    padding: 8px 8px;
    border-radius: 8px;
    transition: all 0s;
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
}

.nav-icon {
    width: 18px;
    height: 18px;
    color: var(--color-brand);
    fill: var(--color-brand);
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-icon :deep(svg) {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.navbar-item:hover {
    animation: navbar-item--hover 0.5s forwards;
}
@keyframes navbar-item--hover {
    0% {}
    60% {
        color: var(--color-brand);
    }
    100% {
        background-color: var(--color-cyan-soft);
        color: var(--color-brand);
    }
}

.navbar-item.router-link-active {
    color: var(--color-brand);
}

.navbar-item.router-link-active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 2px;
    background-color: var(--color-brand);
    border-radius: 1px;
}

.navbar-burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 30px;
    height: 25px;
    padding: 0;
    border: 0;
    background: none;
    appearance: none;
    cursor: pointer;
    position: relative;
}

/* 视觉尺寸不变，点击热区向外扩 10px */
.navbar-burger::before {
    content: "";
    position: absolute;
    inset: -10px;
}

.navbar-burger:focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 3px;
    border-radius: 4px;
}

/* 菜单展开时的遮罩：点一下就收起，同时用暗度把底下的正文压下去 */
.navbar-scrim {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(0, 0, 0, 0.45);
}

.scrim-fade-enter-active,
.scrim-fade-leave-active {
    transition: opacity 0.25s ease;
}

/* 退场时立刻取消点击拦截：万一过渡没跑完（页面被节流等），
   一个 opacity:0 的全屏 fixed 元素会一直挡住整页的点击。 */
.scrim-fade-leave-active {
    pointer-events: none;
}

.scrim-fade-enter-from,
.scrim-fade-leave-to {
    opacity: 0;
}

.navbar-burger span {
    display: block;
    width: 100%;
    height: 3px;
    background-color: var(--color-text);
    border-radius: 2px;
    transition: all 0.3s;
}

.search {
    display: flex;
    align-items: center;
}

#search-input-text {
    outline: none;
    padding: 0.4rem 2rem 0.4rem 0.7rem;
    border-radius: 999px;
    background-color: transparent;
    border: 2px solid var(--color-brand);
    width: 10rem;
    font-family: inherit;
    line-height: 1.2;
    transition: all 0.3s ease-out;
    color: var(--color-text);
}

#search-input-text::placeholder {
color: rgba(124, 124, 124, 0.8);
}

#search-icon .nav-icon {
    position: absolute;
    right: -0.1rem;
    top: 50%;
    transform: translate(-50%,-50%) scale(1.8)!important ;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem;
    cursor: pointer;
    background-color: var(--color-brand);
    border-radius: 0 999px 999px 0;
    color: rgb(240, 248, 255) !important;
    fill: rgb(240, 248, 255) !important;
    aspect-ratio: 1;
    transition: all 0.3s ease-out;
}

#search-input-text:focus {
    background-color: var(--color-background-soft);
    transition: all 0.1s ease-in;
}

.theme-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 8px;
}


/* 响应式：小屏幕 */
@media (max-width: 800px) {
    .navbar-burger {
        display: flex;
    }

    .navbar-menu {
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        background-color: var(--color-background-overlay);
        flex-direction: column;
        gap: 0;
        padding: 20px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        transform: translateY(-100%);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .navbar-menu.is-active {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
    }

    .navbar-item {
        padding: 12px 16px;
        width: 100%;
        font-size: 1.5rem;
        transition: all 0s;
    }

    /* 移动端菜单以前只剩纯文字（≤1300px 把 .nav-icon 全隐藏了），
       和桌面端是两套样子。这里把图标放回来，两端口径一致。 */
    .navbar-item .nav-icon,
    .navbar-item .nav-icon :deep(svg) {
        display: flex;
        width: 20px;
        height: 20px;
    }

    #search-input-text {
        display: none;
    }

    #seach-input {
        position: static !important;
    }

    #search-icon {
        position: static !important;
        text-decoration: none;
        color: var(--color-text);
        font-size: 1.5rem;
        font-weight: 500;
        padding: 12px 16px;
        border-radius: 8px;
        width: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    #search-icon::after {
        content: "搜索";
        color: var(--color-brand);
    }

    #search-icon .nav-icon {
        display: none;
    }

    .search {
        width: 100%;
    }
}

@media (max-width: 1100px) {

    #search-input-text {
        animation: search-text--hide 0.5s forwards;
    }
    @keyframes search-text--hide {
        0% {
        }
        99% {
            width: 0.4rem;
            height:0.4rem;
            font-size: 0.4rem;
            opacity: 0;
            transform: translateX(1.5rem);
        }
        100% {
            display: none;
        }
    }

    #search-input {
        position: static !important;
        transition: all 0.3s ease-out;
    }

    #search-icon {
        position: static !important;
        border-radius: 999px!important;
    }

    #search-icon .nav-icon {
        position: static !important;
        padding: 0 !important;
        background-color: transparent !important;
        border-radius: 0 !important;
        color: var(--color-brand) !important;
        fill: var(--color-brand) !important;
        transform: translateY(0) !important;
        transition:  all 0.3s ease-out;
        border-radius: 999px!important;
    }

    .search {
        display: flex;
        align-items: center;
    }
}

@media (max-width: 1300px) {
    .nav-icon {
        display: none;
    }

    .theme-toggle .nav-icon {
        display: flex;
    }

    .navbar-item {
        color: var(--color-brand);
    }

    .theme-toggle {
        color: var(--color-brand);
    }
}

</style>
