# API 使用说明

## 登录接口

### 请求格式
```json
{
    "account": "user@example.com",
    "password": "yourpassword",
    "rememberMe": true
}
```

### 响应格式
```json
{
    "code": 200,
    "message": "登录成功",
    "data": {
        "token": "your-jwt-token",
        "userId": "user-id-123",
        "username": "用户名",
        "userType": "student"
    }
}
```

## 注册接口

### 请求格式
```json
{
    "account": "user@example.com",
    "password": "yourpassword",
    "username": "用户名",
    "verification_code": "123456"
}
```

## Token 使用

登录成功后，token 会自动保存到 localStorage，并在后续所有请求的请求头中自动携带：

```
Authorization: <token>
```

注意：不是 `Bearer <token>` 格式，直接发送 token 值。

## 本地存储

登录成功后会保存以下信息到 localStorage：

- `token`: JWT token
- `userInfo`: 用户信息对象 (userId, username, userType)
- `rememberMe`: 是否记住我
- `userAccount`: 用户账号（仅在勾选"记住我"时保存）

## 环境配置

在 `.env` 文件中配置 API 基础路径：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```
