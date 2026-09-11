import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../utils/auth'
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
import Write from '../pages/write/index.vue'
import Activate from '../pages/activate/index.vue'
import ForgotPassword from '../pages/forgotPassword/index.vue'
import NotFound from '../pages/notFound/index.vue'
import RSS from '../pages/rss/index.vue'

// 需要登录才能访问的路由，统一通过 meta.requiresAuth 标记
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
    path: '/about/friends',
    name: 'AboutFriends',
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
    // 通过邮箱验证码找回密码（无需登录）
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword
  },
  {
    path: '/me',
    name: 'Me',
    component: Me,
    meta: { requiresAuth: true }
  },
  {
    path: '/activate',
    name: 'Activate',
    component: Activate
  },
  {
    path: '/write',
    name: 'Write',
    component: Write,
    meta: { requiresAuth: true }
  },
  {
    // 复用写作页做编辑，文章原文由 /api/articles/:id/edit 回填
    path: '/write/:article_id',
    name: 'WriteEdit',
    component: Write,
    meta: { requiresAuth: true }
  },
  {
    path: '/rss',
    name: 'RSS',
    component: RSS
  },
  {
    // 404 兜底：必须放在最后，Vue Router 会优先匹配更具体的路由
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫：滚动到顶部 + 登录态拦截
router.beforeEach((to, from, next) => {
  window.scrollTo(0, 0);

  // 需要登录的页面：未登录时跳登录页，并带上当前地址以便登录后回跳
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  next();
});

export default router
