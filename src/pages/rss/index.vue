<template>
    <div class="big-container">
        <NavBar />
        <main class="rss-page">
            <section class="rss-card">
                <div class="rss-badge">RSS</div>
                <h1>RSS 订阅</h1>
                <p class="rss-intro">
                    复制下面的订阅地址，或在新标签页打开。
                </p>

                <div class="rss-url-box">
                    <span class="rss-url">{{ rssUrl }}</span>
                    <button type="button" @click="copyRSSUrl">{{ copied ? '已复制' : '复制' }}</button>
                </div>

                <div class="rss-actions">
                    <a class="primary-link" :href="rssUrl" target="_blank" rel="noopener noreferrer">打开 RSS</a>
                    <router-link class="secondary-link" to="/me">查看 Token</router-link>
                </div>

                <p class="rss-note">
                    已登录用户会自动携带 RSS Token，你可以使用token访问深度模式等的文章。
                </p>
            </section>
        </main>
        <Footer />
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import { getRSSUrl } from '../../utils/rss.js';
import './index.css';

const copied = ref(false);
const rssUrl = computed(() => getRSSUrl());

const copyRSSUrl = async () => {
    try {
        await navigator.clipboard.writeText(rssUrl.value);
        copied.value = true;
        window.setTimeout(() => {
            copied.value = false;
        }, 1600);
    } catch (error) {
        console.error('复制 RSS 地址失败:', error);
    }
};
</script>

<style scoped></style>
