<template>
    <nav class="navbar">
        <div class="navbar-container">
            <div class="navbar-brand">
                <router-link to="/" class="brand-link">
                    Coco の 避风港
                </router-link>
            </div>

            <div><!--留给动态增加--></div>

            <div class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
                <div class="search">
                    <div id="search-input" style="display: flex; position: relative; align-items: center;overflow: hidden;border-radius: 999px;">
                        <input type="text" v-model="searchQuery" id="search-input-text" placeholder="搜点什么..." @keyup.enter="handleSearch" />
                        <router-link :to="`/search?q=${searchQuery}`" @click="closeMenu" id="search-icon">
                            <IconSearch class="nav-icon" style="transform: scale(1.15)" />
                        </router-link>
                    </div>
                </div>
                <router-link :to="`/articles`" class="navbar-item" id="search-article-list" @click="closeMenu">
                    <IconHistory class="nav-icon" />足迹
                </router-link>
                <router-link :to="`/rss`" class="navbar-item" id="search-rss" @click="closeMenu">
                    <IconRSS class="nav-icon" style="transform: scale(0.9)" />RSS
                </router-link>
                <router-link to="/about" class="navbar-item" @click="closeMenu">
                    <IconInfo class="nav-icon" style="transform: scale(1.6)" />关于
                </router-link>
                <router-link to="/me" class="navbar-item" @click="closeMenu">
                    <IconUser class="nav-icon" style="transform: scale(1.8) translateY(0.5px)" />我的
                </router-link>
            </div>

            <div class="navbar-burger" @click="toggleMenu">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import IconSearch from './icons/IconSearch.vue';
import IconArticles from './icons/IconArticles.vue';
import IconHistory from './icons/IconHistory.vue';
import IconRSS from './icons/IconRSS.vue';
import IconInfo from './icons/IconInfo.vue';
import IconUser from './icons/IconUser.vue';

const router = useRouter();
const isMenuOpen = ref(false);
const searchQuery = ref('');

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
    isMenuOpen.value = false;
};
//搜索空值校验
const handleSearch = () => {
    if (searchQuery.value.trim()) {
        router.push(`/search?q=${searchQuery.value}`);
        closeMenu();
    }
};
</script>

<style scoped>
.navbar {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.6);
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
    color: hwb(180 31% 16%);
    transition: color 0.3s;
    text-shadow: 2px 2px 5px rgba(87, 87, 87, 0.25);
}

.brand-link:hover {
    color: rgb(20, 180, 180);
}

.navbar-menu {
    display: flex;
    gap: 8px;
}

.navbar-item {
    text-decoration: none;
    color: #333;
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
    color: rgb(31, 239, 239);
    fill: rgb(31, 239, 239);
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
        color: rgb(31, 239, 239);
    }
    100% {
        background-color: rgba(31, 239, 239, 0.1);
        color: rgb(31, 239, 239);
    }
}

.navbar-item.router-link-active {
    color: rgb(31, 239, 239);
}

.navbar-item.router-link-active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 2px;
    background-color: rgb(31, 239, 239);
    border-radius: 1px;
}

.navbar-burger {
    display: none;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    width: 30px;
    height: 25px;
}

.navbar-burger span {
    display: block;
    width: 100%;
    height: 3px;
    background-color: #333;
    border-radius: 2px;
    transition: all 0.3s;
}

.search {
    display: flex;
    align-items: center;
}

#search-input-text {
    outline: none;
    padding: 0.4rem 0.6rem 0.4rem 0.6rem;
    border-radius: 999px;
    background-color: transparent;
    border: 1px solid rgb(31, 239, 239);
    width: 10rem;
    font-family: inherit;
    line-height: 1.2;
    transition: all 0.3s ease-out;
    color: #333;
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
    background-color: rgb(31, 239, 239);
    border-radius: 0 999px 999px 0;
    color: rgb(240, 248, 255) !important;
    fill: rgb(240, 248, 255) !important;
    aspect-ratio: 1;
    transition: all 0.3s ease-out;
}

#search-input-text:focus {
    /*border: 1px solid rgb(31, 239, 239);*/
    background-color: rgba(255, 255, 255, 0.8);
    transition: all 0.1s ease-in;
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
        background-color: rgba(255, 255, 255, 0.98);
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

    #search-input-text {
        display: none;
    }

    #seach-input {
        position: static !important;
    }

    #search-icon {
        position: static !important;
        text-decoration: none;
        color: #333;
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
        color: rgb(30, 233, 233);
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
        color: rgb(31, 239, 239) !important;
        fill: rgb(31, 239, 239) !important;
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

    .navbar-item {
        color: rgb(30, 233, 233);
    }
}

</style>
