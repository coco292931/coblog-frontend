import { createRouter, createWebHistory } from 'vue-router'
import { getRSSToken } from '../utils/auth'
import HelloWorld from '../components/HelloWorld.vue'
import TheWelcome from '../components/TheWelcome.vue'
import About from '../pages/about/index.vue'
import Home from '../pages/home/index.vue'
import Add from '../ADDD.vue'
import Turn from '../Turn.vue'
import Article from '../pages/article/index.vue'
import Search from '../pages/search/index.vue'
import RaL from '../pages/regAlogin/index.vue'
import Me from '../pages/me/index.vue'

const routes = [
  {
    path: '/HelloWorld',
    name: 'HelloWorld',
    component: HelloWorld
  },
  {
    path: '/pages',
    name: 'AllPages',
    component: HelloWorld
  },
  {
    path: '/firstpage',
    name: 'Firstpage',
    component: TheWelcome
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/about/us',
    name: 'AboutUs',
    component: About
  },
  {
    path: '/add',
    name: 'Add',
    component: Add
  },
  {
    path: '/turn',
    name: 'Turn',
    component: Turn
  },
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/articles',
    name: 'ArticleList',
    component: Search
  },
  {
    path: '/articles/:article_id',
    name: 'Article',
    component: Article
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/login',
    name: 'login',
    component: RaL
  },
  {
    path: '/register',
    name: 'register',
    component: RaL
  },
  {
    path: '/me',
    name: 'Me',
    component: Me
  },
  {
    path: '/rss',
    name: 'RSS',
    beforeEnter: () => {
      // 使用封装的工具获取RSS Token
      const rssToken = getRSSToken() || '';
      // 获取 API 基础地址，默认使用当前页面的 origin
      const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      // 直接跳转到后端 RSS 接口（使用 replace 避免产生历史记录）
      window.location.href = `${baseURL}/api/rss?token=${encodeURIComponent(rssToken)}`;
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 添加全局前置守卫，监听路由变化并滚动到页面顶部
router.beforeEach((to, from, next) => {
  window.scrollTo(0, 0);
  next();
});

export default router