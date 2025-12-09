import './assets/main.css'
import router from './router/' //index.js 可以省略(defult)
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(router)
app.mount('#app')