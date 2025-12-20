<template>
    <div class="big-container">
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
                        <a class="guid-link" :class="{ active: isActive('/about/us') }" @click.prevent="handleLinkClick($event, '/about/us')">我们的避风港</a>
                    </div>
                    <div class = 'guid-item'>
                        <a class="guid-link" :class="{ active: isActive('/about/friends') }" @click.prevent="handleLinkClick($event, '/about/friends')">我们的好朋友</a>
                    </div>
                </div>
            </div>
            <div class="right-container">
                <div class='us' v-if="tab =='/about/us'">
                    <h2 class='title'>关于我们</h2>
                    coco&koko<br>
                    暂时没想好。。。<br><br>

                    <h2 class='title'>关于本港湾</h2>
                    <p>温暖舒适的港湾，适合睡觉</p>
                    <p>可以去访问第一篇帖子获取更详细介绍哦<br />
                    >>><a href="/articles/4">click here</a><<<</p>
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
import { ref } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';

const router = useRouter();
const route = useRoute();

let tab = ref(route.path); // 动态变量，F: '/about/us'
if (tab.value === '/about') {
  tab.value = '/about/us';
}

// 判断当前路径，决定激活态
/*这行代码的解释汪~
:class="{ active: isActive('/about/us') }" 是 Vue 的动态 class 绑定语法：

:class 是 v-bind:class 的缩写
{ active: isActive('/about/us') } 是一个对象
active 是要添加的 CSS 类名 

isActive('/about/us') 是条件，返回 true 或 false
当条件为 true 时，就会添加 active 类；为 false 时就移除*/

const isActive = (path) => {
    return tab.value === path;
};

// 处理点击跳转事件，延迟跳转
const handleLinkClick = (event, path) => {
    const link = event.currentTarget;
    //link.classList.add('clicked');
    tab.value = path;
    /*
    console.log('Navigating to:', path);
    console.log('Current tab:', tab.value);
    console.log('Active state for /about/us:', isActive('/about/us'));
    setTimeout(() => {
        router.push(path);
    }, 100);*/
};

// 鼠标离开时移除点击效果，解除点击事件
const handleMouseLeave = (event) => {
    /*const link = event.currentTarget;
    link.classList.remove('clicked');*/
};
</script>

<style scoped>
</style>