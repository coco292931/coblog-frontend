<template>
    <router-view></router-view>
    <!-- 全局轻提示：挂在根组件，任意页面都能调用 toast.* -->
    <AppToast />
</template>

<script setup>
import { RouterView } from 'vue-router';
import AppToast from './components/AppToast.vue';
</script>