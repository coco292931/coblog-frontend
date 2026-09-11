<template>
    <div class="big-container">
        <NavBar />
        <div class="notfound-page">
            <div class="notfound-card">
                <div class="notfound-code">404</div>
                <h1>{{ title }}</h1>
                <p>{{ message }}</p>
                <p class="notfound-tips">{{ tips }}</p>
                <p class="notfound-path">当前地址：{{ currentPath }}</p>

                <div class="notfound-actions">
                    <router-link to="/" class="primary-link">返回首页</router-link>
                    <a class="secondary-link" @click.prevent="goBack">返回上一页</a>
                    <router-link to="/articles" class="secondary-link">浏览全部文章</router-link>
                </div>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import './index.css';

const route = useRoute();
const router = useRouter();

const currentPath = computed(() => route.fullPath);

const title = '这里什么都没有';
const message = '你要找的页面可能已被移动、删除，或者从未存在过。';
const tips = '也可能只是coco太饿，已经吃到肚子里了';

const goBack = () => {
    // 直接打开该地址时没有历史记录，回退到首页
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/');
    }
};
</script>

<style scoped></style>
