<template>
    <nav class="navbar">
        <div class="navbar-container">
            <div class="navbar-brand">
                <router-link to="/" class="brand-link">
                    Coco & Koko's Harbor
                </router-link>
            </div>
            
            <div class="navbar-menu" :class="{ 'is-active': isMenuOpen }">
                <router-link to="/" class="navbar-item" @click="closeMenu">首页</router-link>
                <router-link to="/about" class="navbar-item" @click="closeMenu">关于</router-link>
                <router-link to="/firstpage" class="navbar-item" @click="closeMenu">页面</router-link>
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

const isMenuOpen = ref(false);

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
    isMenuOpen.value = false;
};
</script>

<style scoped>
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding: 0 20px;
}

.navbar-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
}

.navbar-brand {
    font-size: 1.5rem;
    font-weight: bold;
}

.brand-link {
    text-decoration: none;
    color: rgb(31, 239, 239);
    transition: color 0.3s;
}

.brand-link:hover {
    color: rgb(20, 180, 180);
}

.navbar-menu {
    display: flex;
    gap: 30px;
}

.navbar-item {
    text-decoration: none;
    color: #333;
    font-size: 1rem;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.3s;
    position: relative;
}

.navbar-item:hover {
    background-color: rgba(31, 239, 239, 0.1);
    color: rgb(31, 239, 239);
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
    }
}
</style>
