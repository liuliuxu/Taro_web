# 重工机械设备商城 (Taro_web)

重工机械移动端商城 + 管理后台前后端分离项目。

## 项目结构

```
Taro_web/
├── mobile/   # 移动端 H5 / 小程序 (Taro + React + TypeScript + TaroUI)
└── server/   # 后端服务 (Spring Boot + JWT + JPA)
```

## 端口规划

| 服务 | 端口 |
| ---- | ---- |
| 后端 API | 8081 |
| H5 前端 (Nginx) | 8082 |

> 原 80 / 8080 / 9090 已被占用，故使用 8081 / 8082。

## 快速开始

### 后端

```bash
cd server
mvn spring-boot:run        # 默认 H2 内存库，端口 8081
mvn clean package          # 打包可执行 jar
```

默认账号：
- 管理员：`admin / admin123`
- 顾客：`demo / demo123`

### 移动端 H5

```bash
cd mobile
npm install
npm run dev:h5             # 本地开发，devServer 代理 /api → 8081
npm run build:h5           # 生产构建，产物在 dist/
```

## 数据库

- 开发：H2 内存库（`application.yml`）
- 生产：MySQL（`application-prod.yml`，通过 `--spring.profiles.active=prod` + 环境变量启用）

## 生产部署

1. 后端：`java -jar heavy-machinery-server-1.0.0.jar --spring.profiles.active=prod`，端口 8081
2. 前端：构建 `dist/` 部署到 Nginx，8082 端口，`/api` 反向代理到 127.0.0.1:8081

## 管理后台（PC）

`server` 已预留 `/api/admin/**` 接口（设备/订单/用户管理），供后续 PC 后台管理系统使用。
