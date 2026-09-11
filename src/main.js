import './assets/base.css'
import './assets/main.css'
// 文章正文共享样式：写作页预览与文章详情页共用同一套排版
import './assets/article-prose.css'
import router from './router/'
import { createApp } from 'vue'
import App from './App.vue'

// 挂载前初始化主题，避免首屏闪烁
const saved = localStorage.getItem('coblog-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));

const app = createApp(App)
app.use(router)
app.mount('#app')