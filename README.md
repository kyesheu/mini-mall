# Mini Mall

微型电商 MVP，基于 Next.js 16 + TypeScript + Prisma + MySQL 8 + Tailwind CSS 4。

## 技术栈

- **框架**: Next.js 16, React 19
- **语言**: TypeScript (strict)
- **数据库**: MySQL 8
- **ORM**: Prisma 7 + MariaDB adapter
- **样式**: Tailwind CSS 4
- **认证**: JWT + httpOnly Cookie (jose)
- **密码**: bcryptjs
- **校验**: Zod 4

## 快速开始

### 1. 环境准备

- Node.js 20+
- MySQL 8（已创建数据库 `mini_mall`）

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 MySQL 连接信息
```

`.env` 内容：
```
DATABASE_URL="mysql://root:password@127.0.0.1:3306/mini_mall"
JWT_SECRET="your-secret-key"
```

### 3. 安装依赖并初始化数据库

```bash
npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 种子账号

| 邮箱 | 密码 | 角色 |
|------|------|------|
| admin@example.com | admin123 | 管理员 |
| user@example.com | user123 | 普通用户 |

## 项目结构

```
src/
  proxy.ts                 # Next.js 16 路由拦截
  app/                     # 页面路由
    (main)/                # 前台（商品/购物车/订单/认证）
    admin/                 # 后台管理
  server/
    db.ts                  # Prisma 单例
    auth/                  # JWT + 密码 + Session
    services/              # 业务逻辑层
  actions/                 # Server Actions（薄层）
  components/              # UI 组件
  lib/                     # 工具/常量/校验/错误
  types/                   # 共享类型
prisma/
  schema.prisma            # 数据库模型
  migrations/              # 迁移历史
  seed.ts                  # 种子数据
docs/                      # 设计文档
```

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:studio` | 打开 Prisma Studio |
| `npm run prisma:migrate` | 创建数据库迁移 |
| `npm run prisma:validate` | 校验 Prisma Schema |

## 功能列表

### 前台

- 商品列表（分页/筛选/搜索/排序）
- 商品详情
- 用户注册/登录/退出（JWT httpOnly Cookie）
- 购物车（增删改数量）
- 创建订单（事务：快照+扣库存）
- 订单列表/详情/模拟支付/取消（恢复库存）

### 后台

- Dashboard 统计面板
- 商品管理（新增/编辑/上架下架）
- 分类管理（新增）
- 订单管理（列表/详情/状态变更）

## 设计文档

详见 `docs/` 目录：

- `01-project-overview.md` — 项目定位与功能边界
- `02-architecture.md` — 分层架构
- `03-database.md` — 数据库设计
- `04-actions-and-services.md` — Action 与 Service 设计
- `05-ui-guidelines.md` — UI 规范
- `06-implementation-plan.md` — 实施计划
- `07-risk-and-decisions.md` — 风险与决策

## 后续扩展（非 MVP）

- REST API Routes（移动端对接）
- 真实支付（支付宝/微信）
- 商品评价/收藏
- 优惠券/促销
- Redis 库存预扣
- 物流追踪
- i18n 多语言
- 图片上传
- 生产部署（Vercel）
