<template>
    <div class="big-container">
        <div class="main-photo">
            <img src="../../assets/image/homepage-background.jpg" class='home-photo' />
            <div class="welcome-text">
                海内存知己，天涯若比邻_
            </div>
            <div class="triangle">
                <svg t="1765093670123" class="arrow" viewBox="0 0 1024 1024" width="60" height="60">
                    <path
                        d="M512 693.333333c-14.933333 0-29.866667-4.266667-40.533333-14.933333l-277.33333399-234.666667c-27.733333-23.466667-29.866667-64-8.53333301-89.6 23.466667-27.733333 64-29.866667 89.6-8.53333299L512 546.133333l236.8-200.53333299c27.733333-23.466667 68.266667-19.19999999 89.6 8.53333299 23.466667 27.733333 19.19999999 68.266667-8.53333301 89.6l-277.33333399 234.666667c-10.666667 10.666667-25.6 14.933333-40.533333 14.933333z"
                        fill="white" p-id="7744"></path>
                </svg>
            </div>
        </div>
        <div class="content-container">
            <div class="timeline">
                <div class="line">
                    <!-- Vertical Line -->
                </div>
                <!--剩下的用伪元素-->
            </div>
            <div class="article-line">
                <!-- Article Line -->
                <div class="article" v-for="item in articles" :key="item.id">
                    <!--<img :src="item.photo" class='article-photo' />-->
                    <img src='../../assets/image/article-placeholder.jpg' class='article-photo' />
                    <div class="text">
                        <div class="title">{{ item.title }}</div>
                        <div class="intro">{{ item.description }}</div>
                        <div class="info">
                            <div class="up-date">
                                2024-06-01
                            </div>
                            <div class="tags">
                                标签1 标签2
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bottom-bar" style="margin:20px 0 10px 0">
            <!--大概率用组件实现-->
            © 2024 Coco & Koko's Harbor. All rights reserved.
        </div>
    </div>
</template>

<script setup>
import './index.css';
import { useRouter, useRoute } from 'vue-router';
import { ref } from 'vue';

//<!--据说正式上线就可以正确加载图片,暂时先注释掉动态加载-->
const articles = ref([
    { id: 1, photo: '../../assets/image/article-placeholder.jpg', title: 'News Item 1', description: 'Description for News Item 1' },
    { id: 2, photo: '../../assets/image/article-placeholder.jpg', title: 'News Item 2', description: 'Description for News Item 2' },
    { id: 3, photo: '../../assets/image/article-placeholder.jpg', title: 'News Item 3', description: 'Description for News Item 3' },
]);

</script>

<style scoped>

</style>
