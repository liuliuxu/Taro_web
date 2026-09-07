# 重工设备管理 - PC 管理后台

基于 React + TypeScript + Ant Design 的后台管理系统。

## 技术栈

- **框架**：React 18 + TypeScript
- **UI 库**：Ant Design 6.x
- **图表**：ECharts
- **构建**：Vite
- **HTTP**：Axios + JWT 认证

## 页面功能

| 页面 | 路径 | 说明 |
|------|------|------|
| 登录 | `/login` | 管理员登录 |
| 数据总览 | `/dashboard` | 工单统计、趋势图、饼图 |
| 数据图表 | `/charts` | 设备/工单/审批多维图表 |
| 设备管理 | `/devices` | 设备 CRUD、状态管理 |
| 维修工单 | `/workorders` | 工单列表、指派、处理 |
| 巡检保养 | `/inspection` | 巡检计划管理 |
| 工程管理 | `/projects` | 项目列表、创建 |
| 租赁管理 | `/rentals` | 租赁合同 |
| 供应商管理 | `/suppliers` | 供应商列表 |
| 采购管理 | `/purchases` | 采购单、入库 |
| 备件库存 | `/spare-parts` | 备件出入库 |
| 客户合同 | `/contracts` | 合同列表 |
| 审批配置 | `/approval/config` | 表单定义、流程定义、选项集 |
| 审批实例 | `/approval/instances` | 审批列表、发起、详情 |
| 公告通知 | `/announcements` | 公告管理 |
| 用户管理 | `/users` | 用户 CRUD、工龄/年假/调休 |
| 机构管理 | `/orgs` | 组织架构 |
| 菜单管理 | `/menus` | 系统菜单配置 |

## 开发

```bash
npm install
npm run dev              # 本地开发 (端口 10087，代理 /api → 8081)
```

## 构建部署

```bash
npm run build            # 构建产物 → dist/
rsync -a --delete dist/ root@<host>:/data/www/heavy-machinery/admin/
```

## 项目结构

```
admin/src/
├── main.tsx             # 入口
├── App.tsx              # 路由 + 布局
├── styles.css           # 全局样式 (登录页、布局、表格、弹窗)
├── api.ts               # Axios 封装 (JWT + 401 跳转)
├── types.ts             # TypeScript 类型定义
├── useCachedState.ts    # 状态缓存 Hook
├── pages/
│   ├── Login.tsx        # 登录
│   ├── Dashboard.tsx    # 数据总览
│   ├── Charts.tsx       # 数据图表
│   ├── Devices.tsx      # 设备管理
│   ├── WorkOrders.tsx   # 工单管理
│   ├── Users.tsx        # 用户管理
│   ├── ApprovalConfig.tsx  # 审批配置
│   ├── ApprovalInstances.tsx # 审批实例
│   └── .../
└── components/
    └── Topbar.tsx       # 顶部导航
```

## 审批配置

审批系统支持自定义表单和流程：

1. **选项集**：定义可复用的下拉/多选选项（如请假类型、部门）
2. **表单定义**：拖拽式配置字段（input/textarea/number/date/select/multiple/upload/tree）
3. **流程定义**：配置审批节点（角色/机构/指定用户），支持多级审批
4. **审批实例**：发起审批后自动流转，支持通过/驳回/撤回

### 预置表单

| 表单 | 业务类型 | 字段 |
|------|---------|------|
| 通用申请单 | common | 标题、部门、金额、事由、标签、附件、类别 |
| 采购申请单 | purchase | 物料名称、数量、供应商、说明 |
| 维修费用报销单 | workorder_cost | 工单号、报销金额、费用说明 |
| 请假申请单 | leave | 请假类型、起止日期、天数、事由、联系人 |
| 加班申请单 | overtime | 加班类型、日期、小时数、处理方式、说明 |

## 主题系统

支持通过 `styles.css` 中的 CSS 变量自定义主题：

```css
:root {
  --hm-color: #FF6B1A;    /* 主题色 */
  --hm-bg: #F0F2F5;       /* 背景色 */
  --hm-font: 14px;        /* 基础字号 */
}
```

支持三种菜单样式：高亮底色（`.hm-menu-fill`）、左侧指示条（`.hm-menu-bar`）、圆角块（`.hm-menu-rounded`）。
