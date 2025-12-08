import './assets/main.css'
import router from './router/' //index.js 可以省略(defult)
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).use(router).mount('#app')