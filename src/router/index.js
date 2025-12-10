import { createRouter, createWebHistory } from 'vue-router'
import HelloWorld from '../components/HelloWorld.vue'
import TheWelcome from '../components/TheWelcome.vue'
import About from '../pages/about/index.vue'
import Home from '../pages/home/index.vue'
import Add from '../ADDD.vue'
import Turn from '../Turn.vue'
import Article from '../pages/article/index.vue'
import Search from '../pages/search/index.vue'


// // 简单的关于页面组件
// const About = { 
//   template: '<div style="padding: 20px; text-align: center;"><h1>关于我们</h1><p>这是关于我们页面</p></div>' 
// }

const routes = [
  {
    path: '/',
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
    path: '/home',
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router