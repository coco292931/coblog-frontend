# frontend/Dockerfile
FROM docker.1ms.run/library/node:20 AS build
WORKDIR /app

# 先拷贝依赖描述文件，最大化利用缓存
COPY package*.json ./

# npm 国内源（推荐）
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖（可按需加 --prefer-offline / --no-fund / --no-audit）
RUN npm install

# 再拷贝其余源码
COPY . .

# 构建
RUN npm run build

FROM docker.1ms.run/library/nginx:1.25
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]