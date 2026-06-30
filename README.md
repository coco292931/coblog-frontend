# coblog-frontend

**coco 的避风港 - 前端应用**

一个基于 **Vue 3 + Vite** 的博客前端，当前已接入文章时间线、搜索筛选、深浅色主题、写作页、个人中心、RSS 跳转和站点统计页脚等能力。

---

## 目录

- [技术栈](#技术栈)
- [当前功能](#当前功能)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [常用命令](#常用命令)
- [项目结构](#项目结构)
- [部署说明](#部署说明)

---

## 技术栈

### 核心依赖

- **Vue 3.5**
- **Vue Router 4**
- **Vite 7**
- **Axios 1**

### 工程能力

- `vite-plugin-vue-devtools`
- `vue-tsc`
- `prettier`
- `npm-run-all`

### 运行环境

- **Node.js**：`^20.19.0 || >=22.12.0`

---

## 当前功能

### 1. 响应式导航与主题切换

- `NavBar` 已支持桌面端 / 移动端菜单
- 集成全局搜索入口
- 已接入深浅色主题切换
- 主题状态通过 `src/composables/useTheme.js` 持久化到 `localStorage`
- 应用启动前会预先写入 `data-theme`，减少首屏闪烁

### 2. 首页与文章列表时间线

- 首页 `src/pages/home/index.vue` 使用 `ArticleTimeline.vue` 展示文章
- 文章列表页 `src/pages/search/index.vue` 支持：
  - 无限滚动加载
  - 按关键词搜索
  - 按分类筛选
  - 按标签筛选
  - URL 查询参数同步，方便分享筛选结果

### 3. 文章详情页

- 通过 `GET /api/articles/:id` 拉取文章 HTML
- 自动根据 `h2/h3/h4` 生成目录
- 支持点击分类跳转到对应筛选列表
- 展示创建时间、修改时间、阅读时长、浏览量、点赞量等信息

### 4. 写作页

新增 `src/pages/write/`，当前能力包括：

- 登录后进入写作页
- 支持 **Markdown / HTML 双模式**
- Markdown 模式调用后端 `/api/markdown/render` 进行实时预览
- 支持封面上传与正文插图上传
- 支持分类、标签、摘要、深度文章开关等元信息编辑
- 发布成功后自动跳转到文章详情页

### 5. 登录、注册与个人中心

- `src/pages/regAlogin/index.vue` 提供登录 / 注册双态界面
- 登录 token 支持“记住我”
- `src/utils/auth.js` 统一管理：
  - 登录 token
  - RSS token
  - 登录态判断
- `src/pages/me/index.vue` 会拉取用户信息并保存 RSS token

### 6. RSS 与站点统计

- `/rss` 路由会直接跳转到后端 RSS 接口
- 页脚 `Footer.vue` 会读取 `/api/site/info`
- 展示总字数、估算阅读时长与站点运行时间

### 7. 后端接口封装

当前已拆分 API 模块：

- `src/api/index.js`：Axios 实例与拦截器
- `src/api/auth.js`：登录 / 注册相关接口
- `src/api/article.js`：发文、图片上传、Markdown 预览

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/coco292931/coblog-frontend
cd coblog-frontend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
copy .env.example .env.local
```

### 4. 启动开发服务器

```bash
npm run dev
```

默认访问：`http://localhost:5173`

Vite 已配置：

- `host: 0.0.0.0`
- `port: 5173`

因此也可在局域网设备上联调。

---

## 环境变量

### `VITE_API_BASE_URL`

该变量应填写为**后端服务根地址**，不要额外拼接 `/api`。

推荐写法：

```env
VITE_API_BASE_URL=http://localhost:8080
```

或：

```env
VITE_API_BASE_URL=https://api.coco-29.wang
```

原因：当前前端代码会自行请求诸如：

- `/api/articles`
- `/api/site/info`
- `/api/rss`

如果把环境变量写成 `http://localhost:8080/api`，最终请求会变成 `/api/api/...`。

---

## 常用命令

```bash
# 开发
npm run dev

# 类型检查
npm run type-check

# 构建
npm run build

# 预览构建结果
npm run preview

# 格式化 src/
npm run format
```

---

## 项目结构

```text
coblog-frontend/
├── index.html
├── package.json
├── vite.config.js
├── Dockerfile
├── .env.example
├── public/
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── api/
│   │   ├── index.js
│   │   ├── auth.js
│   │   └── article.js
│   ├── assets/
│   │   ├── base.css
│   │   ├── main.css
│   │   └── image/
│   ├── components/
│   │   ├── NavBar.vue
│   │   ├── Footer.vue
│   │   ├── ArticleTimeline.vue
│   │   └── icons/
│   ├── composables/
│   │   └── useTheme.js
│   ├── pages/
│   │   ├── home/
│   │   ├── article/
│   │   ├── search/
│   │   ├── me/
│   │   ├── regAlogin/
│   │   ├── about/
│   │   └── write/
│   ├── router/
│   │   └── index.js
│   └── utils/
│       └── auth.js
└── 资料/
```

---

## 部署说明

### 本地构建

```bash
npm run build
```

产物位于 `dist/`。

### Docker

当前 `Dockerfile` 为多阶段构建：

1. `node:20` 构建前端
2. `nginx:1.25` 提供静态文件

构建与运行：

```bash
docker build -t coblog-frontend .
docker run -d -p 80:80 --name coblog-frontend coblog-frontend
```

### Nginx 提示

如果前端以 SPA 形式部署到自定义 Nginx，建议配置路由回退：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

否则刷新 `/articles/123`、`/me`、`/write` 等路径时可能返回 404。

---

## 许可证

详见 [LICENSE](LICENSE)

---

**Built with ❤️ by coco & koko**

通过 `utils/auth.js` 工具实现智能存储，支持**临时会话**和**持久化登录**。

```javascript
import { setToken } from '@/utils/auth';

setToken(token, rememberMe);
// rememberMe=true  → localStorage（永久）
// rememberMe=false → sessionStorage（关闭浏览器失效）
```

**应用场景：**

- 登录Token（用户认证，支持"记住我"）
- RSS Token（个性化订阅，永久存储）
- 用户偏好设置（主题等）

### 10. Vite开发服务器配置

#### 局域网访问支持

配置 `host: '0.0.0.0'` 允许**移动端和其他设备**访问开发服务器。

```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
```

#### Vue SFC类型检查

通过 `vue-tsc` 实现 `.vue` 单文件组件的完整类型检查。

- 编辑器：使用Volar插件
- 构建：`npm run type-check` 执行类型检查

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
│   ├── auth.js          # 认证相关API
│   └── article.js       # 文章相关API（创建、上传图片、Markdown渲染）
├── utils/               # 工具函数
│   └── auth.js          # Token管理工具（统一存储操作）
├── composables/         # 组合式函数
│   └── useTheme.js      # 主题切换（暗色/亮色，持久化到localStorage）
├── pages/               # 页面级组件
│   ├── home/            # 首页（文章时间轴，无限滚动）
│   ├── article/         # 文章详情
│   ├── search/          # 搜索/文章列表（筛选面板，无限滚动）
│   ├── write/           # 写文章（Markdown/HTML双模式，实时预览）
│   ├── me/              # 个人中心
│   ├── regAlogin/       # 注册/登录
│   └── about/           # 关于页面
├── components/          # 可复用组件
│   ├── NavBar.vue       # 导航栏（含主题切换按钮）
│   ├── Footer.vue       # 页脚
│   ├── ArticleTimeline.vue  # 文章时间轴
│   └── icons/           # 图标组件（含月亮/太阳主题图标）
└── assets/              # 静态资源
    ├── base.css         # 基础样式（CSS变量定义，主题色）
    ├── main.css         # 全局样式
    └── image/           # 图片资源
```

### 数据流架构

```
用户交互
  ↓
Vue组件（pages/）
  ↓
API调用（api/）
  ↓
Axios拦截器（自动注入Token）
  ↓
后端API（http://localhost:8080/api）
  ↓
响应拦截器（统一错误处理）
  ↓
组件更新渲染
```

### 主题系统架构

```
用户点击主题切换按钮
  ↓
NavBar.vue 调用 useTheme().toggle()
  ↓
theme ref 更新
  ↓
watchEffect 自动执行
  ↓
├─ document.documentElement.setAttribute('data-theme', value)
└─ localStorage.setItem('coblog-theme', value)
  ↓
CSS 变量（var(--color-*)）全局生效
  ↓
所有组件自动适配暗色/亮色
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
├── Dockerfile           # Docker部署配置（Nginx + 多阶段构建）
├── tsconfig.json        # TypeScript配置
├── jsconfig.json        # JavaScript配置
│
├── public/              # 静态资源（直接复制到dist）
│
├── src/
│   ├── main.js          # 应用入口（引入 base.css 主题变量）
│   ├── App.vue          # 根组件
│   │
│   ├── router/          # Vue Router配置
│   │   └── index.js     # 路由表（含 /write 写文章路由）
│   │
│   ├── api/             # API接口封装
│   │   ├── index.js     # Axios实例 + 拦截器配置
│   │   ├── auth.js      # 认证API（login/register/logout）
│   │   └── article.js   # 文章API（create/upload/render）
│   │
│   ├── composables/     # 组合式函数
│   │   └── useTheme.js  # 主题切换（全局单例，持久化）
│   │
│   ├── utils/           # 工具函数
│   │   └── auth.js      # Token管理工具（双存储机制）
│   │
│   ├── pages/           # 页面组件
│   │   ├── home/        # 首页（文章时间轴，无限滚动）
│   │   ├── article/     # 文章详情
│   │   ├── search/      # 搜索/文章列表（筛选面板 + 无限滚动）
│   │   ├── write/       # 写文章（Markdown/HTML双模式）
│   │   ├── me/          # 个人中心
│   │   ├── regAlogin/   # 登录注册
│   │   └── about/       # 关于页面
│   │
│   ├── components/      # 可复用组件
│   │   ├── NavBar.vue           # 导航栏（含主题切换按钮）
│   │   ├── Footer.vue           # 页脚
│   │   ├── ArticleTimeline.vue  # 文章时间轴
│   │   └── icons/               # 图标组件库（月亮/太阳等）
│   │
│   └── assets/          # 样式和图片
│       ├── base.css     # CSS变量定义（主题色系统）
│       ├── main.css     # 全局样式
│       └── image/       # 图片资源
│
├── 资料/                # 项目文档
│   ├── blog.xmind       # 脑图设计
│   └── blogAPI-v1.yaml  # API文档（OpenAPI格式）
│
├── .env.development     # 开发环境配置
├── .env.production      # 生产环境配置
└── .env.example         # 环境变量配置示例
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

项目使用多阶段构建Dockerfile，生产阶段基于 `nginx:alpine`，并自动生成 Nginx 配置。

```dockerfile
# 构建阶段
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 📝 许可证

详见 [LICENSE](LICENSE) 文件

---

**Built with ❤️ by coco & koko**