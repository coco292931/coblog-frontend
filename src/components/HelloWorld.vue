<script setup>
import { useRouter } from 'vue-router';
import { computed } from 'vue';

defineProps({
  msg: {
    type: String,
    required: true,
  },
})

const router = useRouter();

// 从路由配置中获取所有路由
const allRoutes = computed(() => {
  return router.options.routes.map(route => ({
    name: route.name,
    path: route.path,
    component: route.component?.name || '未命名组件'
  }));
});
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>
      You’ve successfully created a project with
      <a href="https://vite.dev/" target="_blank" rel="noopener">Vite</a> +
      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>.
    </h3>
    <h2>导航站 - 所有页面</h2>
    <div class="nav-container">
      <div
        v-for="route in allRoutes"
        :key="route.path"
        class="nav-item"
      >
        <router-link :to="route.path" class="nav-link">
          <div class="route-info">
            <strong>{{ route.name || '未命名' }}</strong>
            <span class="route-path">{{ route.path }}</span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h2 {
  font-size: 1.8rem;
  margin: 20px 0;
  text-align: center;
  color: #42b883;
}

.greetings h1 {
  text-align: center;
}

.nav-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.nav-item {
  background-color: #f8f8f8;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  border-color: #42b883;
  box-shadow: 0 4px 8px rgba(66, 184, 131, 0.2);
  transform: translateY(-2px);
}

.nav-link {
  display: block;
  padding: 15px 20px;
  text-decoration: none;
  color: inherit;
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.route-info strong {
  font-size: 1.2rem;
  color: #2c3e50;
}

.route-path {
  font-size: 0.9rem;
  color: #42b883;
  font-family: monospace;
}

@media (min-width: 1024px) {
  .greetings h1 {
    text-align: left;
  }
}
</style>
