# coblog-frontend

**coco的避风港 - 前端系统**

一个基于 Vue 3 + Vite 构建的现代化单页应用（SPA），采用组合式API设计，支持响应式布局、JWT认证、动态路由等完整博客前端功能。

---

## 📋 目录

- [技术栈](#技术栈)
- [核心特性](#核心特性)
- [项目架构](#项目架构)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [项目结构](#项目结构)
- [构建部署](#构建部署)

---

## 🛠 技术栈

### 核心框架
- **Vue 3.5.25** - 组合式API（Composition API）
- **Vite 7.2.6** - 极速开发服务器和构建工具
- **Vue Router 4.6.3** - 官方路由管理器
- **TypeScript 5.0** - 类型安全支持

### 关键依赖
- **Axios 1.13.2** - HTTP客户端，支持拦截器
- **Vite Plugin Vue DevTools** - Vue开发者工具集成
- **Prettier 3.0** - 代码格式化

### 环境要求
- **Node.js**: ^20.19.0 || >=22.12.0
- **包管理器**: npm / pnpm / yarn

---

## ✨ 核心特性

### 1. Axios拦截器机制

#### 统一请求/响应处理
通过Axios拦截器实现**全局Token注入**和**统一错误处理**。

**请求拦截器（Request Interceptor）：**
```javascript
// 自动从localStorage获取Token并注入Authorization头
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});
```

**响应拦截器（Response Interceptor）：**
```javascript
api.interceptors.response.use(
  (response) => response.data,  // 自动解包响应数据
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';  // 自动跳转登录
    }
    // 403/404/500等状态码统一处理...
  }
);
```

**技术优势：**
- **DRY原则**：所有API调用无需手动添加Token
- **集中管理**：Token过期自动登出，统一跳转逻辑
- **错误隔离**：业务代码无需关心HTTP状态码处理

### 2. 环境配置系统

#### 多环境API地址管理
支持通过环境变量动态配置API服务器地址。

**配置方式：**
```javascript
// .env.development
VITE_API_BASE_URL=http://localhost:8080/api

// .env.production
VITE_API_BASE_URL=https://api.coco-29.wang/api
```

**使用方式：**
```javascript
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
```

**优势：**
- 开发环境自动连接本地后端
- 生产环境自动切换线上API
- 无需修改代码即可切换环境

### 3. Vue Router路由守卫

#### 智能路由处理
实现了**动态路由参数**和**路由级别的业务逻辑**。

**动态路由示例：**
```javascript
{
  path: '/articles/:article_id',
  name: 'Article',
  component: Article  // 文章详情页，自动获取路由参数
}
```

**路由守卫应用（RSS跳转）：**
```javascript
{
  path: '/rss',
  beforeEnter: () => {
    const rssToken = localStorage.getItem('rss_token') || '';
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${baseURL}/api/rss?token=${rssToken}`;
  }
}
```

**特点：**
- 支持URL参数传递（如文章ID）
- 路由级别的权限控制
- 外部资源智能跳转（RSS订阅）

### 4. 本地存储策略

#### Token双存储机制
支持**临时会话（sessionStorage）**和**持久化登录（localStorage）**。

```javascript
// 记住我：永久存储
if (rememberMe) {
  localStorage.setItem('token', token);
} else {
  sessionStorage.setItem('token', token);  // 关闭浏览器后失效
}
```

**应用场景：**
- 登录Token（用户认证）
- RSS Token（个性化订阅）
- 用户偏好设置

### 5. Vite开发服务器配置

#### 局域网访问支持
配置`host: '0.0.0.0'`允许**移动端和其他设备**访问开发服务器。

```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // 监听所有网络接口
    port: 5173,       // 默认端口
  },
});
```


#### Vue SFC类型检查
通过`vue-tsc`实现`.vue`单文件组件的完整类型检查。

**配置：**
- 编辑器：使用Volar插件（替代Vetur）
- 构建：`npm run type-check`执行类型检查
- CI/CD：构建前自动类型校验（`npm run build`）

---

## 🏗 项目架构

### 目录结构设计

```
src/
├── main.js              # 应用入口
├── App.vue              # 根组件
├── router/              # 路由配置
│   └── index.js         # 路由表定义
├── api/                 # API接口层
│   ├── index.js         # Axios实例 + 拦截器
│   └── auth.js          # 认证相关API
├── pages/               # 页面级组件
│   ├── home/            # 首页
│   ├── article/         # 文章详情
│   ├── search/          # 搜索/文章列表
│   ├── me/              # 个人中心
│   ├── regAlogin/       # 注册/登录
│   └── about/           # 关于页面
├── components/          # 可复用组件
│   ├── NavBar.vue       # 导航栏
│   ├── Footer.vue       # 页脚
│   ├── ArticleTimeline.vue  # 文章时间轴
│   └── icons/           # 图标组件
└── assets/              # 静态资源
    ├── main.css         # 全局样式
    └── image/           # 图片资源
```

### 数据流架构

```
用户交互
  ↓
Vue组件（pages/）
  ↓
API调用（api/auth.js）
  ↓
Axios拦截器（自动注入Token）
  ↓
后端API（http://localhost:8080/api）
  ↓
响应拦截器（统一错误处理）
  ↓
组件更新渲染
```
---

## 🚀 快速开始

### 前置要求
- Node.js 20.19+ 或 22.12+
- npm / pnpm / yarn

### 安装步骤

**1. 克隆项目**
```bash
git clone https://github.com/coco292931/coblog-frontend
cd ./coblog-frontend
```

**2. 安装依赖**
```bash
npm install
```

**3. 配置环境变量（可选）**
```bash
# 创建 .env.development.local
echo "VITE_API_BASE_URL=http://localhost:8080" > .env.development.local
```

**4. 启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:5173`（或终端显示的地址）

### Windows PowerShell执行策略
```powershell
# 如果遇到脚本执行策略限制
powershell -ExecutionPolicy Bypass
npm run dev
```
---

## 🔧 开发指南

### 常用命令

```bash
# 启动开发服务器
npm run dev

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```
---

## 📁 项目结构

```
coblog-frontend/
├── index.html           # HTML入口模板
├── package.json         # 项目依赖和脚本
├── vite.config.js       # Vite配置文件
├── tsconfig.json        # TypeScript配置
├── jsconfig.json        # JavaScript配置
│
├── public/              # 静态资源（直接复制到dist）
│
├── src/
│   ├── main.js          # 应用入口
│   ├── App.vue          # 根组件
│   │
│   ├── router/          # Vue Router配置
│   │   └── index.js     # 路由表
│   │
│   ├── api/             # API接口封装
│   │   ├── index.js     # Axios实例配置
│   │   └── auth.js      # 认证API（login/register/logout）
│   │
│   ├── pages/           # 页面组件
│   │   ├── home/        # 首页
│   │   ├── article/     # 文章详情
│   │   ├── search/      # 搜索页
│   │   ├── me/          # 个人中心
│   │   ├── regAlogin/   # 登录注册
│   │   └── about/       # 关于页面
│   │
│   ├── components/      # 可复用组件
│   │   ├── NavBar.vue           # 导航栏
│   │   ├── Footer.vue           # 页脚
│   │   ├── ArticleTimeline.vue  # 文章时间轴
│   │   └── icons/               # 图标组件库
│   │
│   └── assets/          # 样式和图片
│       ├── main.css     # 全局样式
│       ├── base.css     # 基础样式
│       └── image/       # 图片资源
│
└── 资料/                # 项目文档
    ├── blog.xmind       # 脑图设计
    └── blogAPI-v1.yaml  # API文档（OpenAPI格式）
```

---

## 📦 构建部署

### 本地构建

```bash
# 类型检查 + 构建优化
npm run build

# 输出目录：dist/
# 包含压缩后的HTML、CSS、JS和静态资源
```

### 构建产物

```
dist/
├── index.html          # 单页应用入口
├── assets/
│   ├── index-[hash].js    # 应用主逻辑（含代码分割）
│   ├── index-[hash].css   # 样式文件
│   └── [name]-[hash].js   # 动态导入的chunk
└── [静态资源]           # public/目录内容
```

### 部署建议

**静态托管平台：**
- Vercel / Netlify（自动CI/CD）
- GitHub Pages
- 阿里云OSS + CDN
- Nginx静态服务器

**Nginx配置示例：**
```nginx
server {
    listen 80;
    server_name coco-29.wang;
    
    root /var/www/coblog-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;  # SPA路由回退
    }
}
```

**Docker部署：**
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 📝 许可证

详见 [LICENSE](LICENSE) 文件

---

**Built with ❤️ by coco&koko**