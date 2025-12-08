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
                    <h1 class='title'>关于我们</h1>
                    <p class="main-content">———————————————————<br>
                    coco&koko<br>
                    不知道写什么，<br>
                    但总不能不写<br><br></p>

                    <h1 class='title'>本港湾</h1>
                    <p>温暖舒适的港湾，适合睡觉</p>
                </div>
                <div class='us' v-if="tab =='/about/friends'">
                    <h1 class='title'>好朋友们</h1>
                </div>
            </div>
        </div>
    </div>
    <Footer />
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