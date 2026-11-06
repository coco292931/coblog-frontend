<template>
    <div class="page-about">
        <NavBar />
        <div class="content-container">
            <div class="left-container">
                <div class="info">
                    <img src="../../assets/image/avatar.jpg" class = 'avatar' alt="Avatar" />
                    <div class = 'name'>
                        coco_29
                    </div>
                </div>
                <div class="guid">
                    <div class = 'guid-item'>
                        <router-link class="guid-link" :class="{ active: isActive('/about/us') }" to="/about/us"
                            :aria-current="isActive('/about/us') ? 'page' : null">我们的避风港</router-link>
                    </div>
                    <div class = 'guid-item'>
                        <router-link class="guid-link" :class="{ active: isActive('/about/friends') }" to="/about/friends"
                            :aria-current="isActive('/about/friends') ? 'page' : null">我们的好朋友</router-link>
                    </div>
                </div>
            </div>
            <div class="right-container article-prose">
                <div class='us' v-if="tab =='/about/us'">
                    <h2 class='title' style="outline:none;">关于我们</h2>
                    coco&koko<br>
                    暂时没想好。。。<br>
                    蛋柿，想我了可以戳<span aria-hidden="true">👉</span><a class="prose-link" type="button" @click="copyEmail" href="mailto:coco@coco-29.wang">这里</a>与我联系 :P <br>

                    <h2 class='title'>关于本港湾</h2>
                    <p>温暖舒适的港湾，适合睡觉</p>
                    <p>可以去访问第一篇帖子获取更详细介绍哦<br />
                    >>> <a class="prose-link" href="/articles/4"> click here </a> <<<</p>
                </div>
                <div class='us' v-if="tab =='/about/friends'">
                    <h2 class='title'>好朋友们</h2>
                    <p class="main-content">
                    这里是我们的一些好朋友的链接<br><br /></p>
                    <p>诶？怎么是空的<br>
                    <del>其实是前端没写(</del>  会补上的</p>
                </div>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import './index.css';
import { useRouter, useRoute } from 'vue-router';
import { ref, watch } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';

const router = useRouter();
const route = useRoute();

// 当前展示的分区。
const tab = ref(route.path);

// /about 与 /about/us
// 统一落到带分区的那条地址上，否则复制出去的链接分不清停在哪一栏。
if (route.path === '/about') {
    router.replace('/about/us');
}

// /about/us 与 /about/friends 复用同一个组件实例，必须监听路径自己同步
watch(
    () => route.path,
    (path) => {
        tab.value = path;
    },
);

// 复制邮箱后的短暂反馈状态（供 copyEmail 使用）
const copied = ref(false);

const isActive = (path) => {
    return tab.value === path;
};

const copyEmail = async () => {
    try {
        await navigator.clipboard.writeText('coco@coco-29.wang');
        copied.value = true;
        window.setTimeout(() => {
            copied.value = false;
        }, 1600);
    } catch (error) {
        console.error('复制邮箱地址失败:', error);
    }
};

</script>

<style scoped>
</style>