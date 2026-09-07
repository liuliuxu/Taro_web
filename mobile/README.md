# 重工设备管理 - 移动端 H5

基于 Taro + React + TypeScript 的移动端应用，支持 H5 和小程序。

## 技术栈

- **框架**：Taro 3 + React 18
- **语言**：TypeScript
- **UI 库**：TaroUI
- **构建**：Vite
- **HTTP**：Taro.request + JWT 认证

## 页面功能

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/pages/index` | 工单统计、设备概览、快捷操作、公告 |
| 设备列表 | `/pages/device-list` | 设备搜索、分类筛选 |
| 设备详情 | `/pages/device-detail` | 设备信息、维修记录 |
| 工单列表 | `/pages/workorder-list` | 我的工单、状态筛选 |
| 工单创建 | `/pages/workorder-create` | 新建维修/保养工单 |
| 工单详情 | `/pages/workorder-detail` | 工单进度、处理记录 |
| 审批列表 | `/pages/approval-list` | 待办/已办/我发起的 |
| 发起审批 | `/pages/approval-create` | 选择流程、填写表单、提交 |
| 审批详情 | `/pages/approval-detail` | 审批流程、表单数据、通过/驳回 |
| 项目管理 | `/pages/project-list` | 项目列表、创建 |
| 租赁管理 | `/pages/rental-list` | 租赁合同列表 |
| 采购管理 | `/pages/purchase-list` | 采购单列表 |
| 巡检保养 | `/pages/inspect-list` | 巡检计划列表 |
| 备件库存 | `/pages/spare-part-list` | 备件查询 |
| 公告通知 | `/pages/announcement-list` | 系统公告 |
| 个人中心 | `/pages/profile` | 用户信息、年假/调休/加班 |
| 个人资料编辑 | `/pages/edit-profile` | 修改电话/邮箱/工龄 |
| 登录 | `/pages/login` | 账号密码登录 |

## 开发

```bash
npm install
npm run dev:h5          # 本地开发 (端口 10086，代理 /api → 8081)
```

## 构建部署

```bash
npm run build:h5        # 构建产物 → dist/
rsync -a --delete dist/ root@<host>:/data/www/heavymachinery/mobile/
```

## 项目结构

```
mobile/src/
├── app.config.ts       # 路由配置
├── app.scss            # 全局样式 + 设计系统变量
├── pages/
│   ├── index/          # 首页
│   ├── login/          # 登录
│   ├── profile/        # 个人中心
│   ├── edit-profile/   # 个人资料编辑
│   ├── approval-create/ # 发起审批
│   ├── approval-detail/ # 审批详情
│   └── .../
├── services/
│   ├── api.ts          # 接口定义
│   └── request.ts      # HTTP 请求封装 (JWT + 401 处理)
└── types/
    └── index.ts        # TypeScript 类型定义
```

## 设计系统

全局变量定义在 `app.scss` 的 `:root` 中：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `--ink` | 主深墨蓝 | `#16283B` |
| `--orange` | 工程橙 | `#FF6B1A` |
| `--bg` | 页面背景 | `#F3F5F7` |
| `--text-1/2/3` | 文字色阶 | 深/中/浅 |
| `--shadow-1/2` | 阴影 | 轻/重 |

支持深色模式（`data-theme="dark"`）和自定义强调色（`data-color`）。
