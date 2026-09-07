# 重工机械设备管理平台 (Heavy Machinery)

重工机械一体化管理平台，包含移动端 H5、PC 管理后台与 Spring Boot 后端服务。

## 技术栈

| 层级 | 技术 |
|------|------|
| 移动端 | Taro + React + TypeScript + TaroUI |
| PC 后台 | React + TypeScript + Ant Design 6.x |
| 后端 | Spring Boot 3 + Spring Security + JWT + JPA + MySQL |
| 部署 | Nginx + systemd |

## 项目结构

```
Taro_web/
├── mobile/          # 移动端 H5 / 小程序
├── admin/           # PC 管理后台
├── server/          # 后端服务 (Spring Boot)
└── README.md
```

## 端口规划

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 8081 | Spring Boot |
| 移动端 H5 | 8082 | Nginx |
| PC 管理后台 | 8083 | Nginx |

## 默认账号

| 角色 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 系统管理员 | admin | admin123 | 全权限 |
| 设备负责人 | manager | manager123 | 部门主管审批 |
| 一线维修工 | operator | operator123 | 基础操作 |
| 示例用户 | demo | demo123 | 只读浏览 |
| 分公司员 | sub1t | sub1t123 | 分公司 |
| 分公司管理员 | subA | subA123 | 分公司 |

## 快速开始

### 后端

```bash
cd server
mvn spring-boot:run                    # 本地 H2 内存库
mvn clean package -DskipTests          # 打包 jar
java -jar target/heavy-machinery-server-1.0.0.jar --spring.profiles.active=prod  # 生产
```

### 移动端 H5

```bash
cd mobile
npm install
npm run dev:h5                         # 本地开发 (代理 /api → 8081)
npm run build:h5                       # 生产构建 → dist/
```

### PC 管理后台

```bash
cd admin
npm install
npm run dev                            # 本地开发 (代理 /api → 8081)
npm run build                          # 生产构建 → dist/
```

## 数据库

- **开发环境**：H2 内存库（`application.yml`，默认）
- **生产环境**：MySQL 8（`application-prod.yml`，`--spring.profiles.active=prod`）

```bash
# 生产数据库
mysql -h127.0.0.1 -uheavy '-pHm@2026#Secure_Db' heavymachinery
```

## 生产部署

```bash
# 后端
scp server/target/heavy-machinery-server-1.0.0.jar root@<host>:/data/www/heavy-machinery/server/
ssh root@<host> "systemctl restart heavy-machinery"

# 移动端
rsync -a --delete mobile/dist/ root@<host>:/data/www/heavy-machinery/mobile/

# PC 后台
rsync -a --delete admin/dist/ root@<host>:/data/www/heavy-machinery/admin/
```

## 功能模块

### 移动端 (mobile)

- 首页仪表盘（工单统计、设备概览、待办）
- 设备管理（列表、详情、搜索）
- 工单管理（创建、详情、进度）
- 审批中心（发起、待办、详情）
- 项目管理、租赁管理、采购管理
- 巡检保养、备件库存
- 个人中心（资料编辑、年假/调休/加班）

### PC 后台 (admin)

- 数据总览与图表
- 设备管理、工单管理
- 审批配置（自定义表单/流程）与审批实例
- 采购管理、供应商管理、备件库存
- 合同管理、公告通知
- 用户管理、机构管理、菜单管理

## 功能亮点

- **自定义审批表单**：支持 input / textarea / number / date / select / multiple / upload / tree 等字段类型，选项集可复用
- **审批流程引擎**：多节点审批（角色/机构/指定用户），支持通过/驳回/撤回
- **请假/加班审批**：按工龄自动填充年假、调休、加班余额，预置示例数据
- **移动端主题系统**：支持深色模式、自定义强调色、菜单样式切换
