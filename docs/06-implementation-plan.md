# 06 — 实施计划

## 12 步实施顺序

| 步骤 | 内容 | 交付物 | 验证方式 |
|------|------|--------|----------|
| **1** | 安装依赖 + 环境配置 | Prisma, jose, bcryptjs, zod, MySQL 驱动 | `npm ls` + `.env` 配置完成 + MySQL 连接验证 |
| **2** | Prisma Schema + 迁移 + Seed | `prisma/schema.prisma`, `prisma/seed.ts` | `npx prisma db push` + `npx prisma db seed` + `npx prisma studio` |
| **3** | 基础设施 | `server/db.ts`, `lib/*.ts`, `types/index.ts` | `npx tsc --noEmit` 通过 |
| **4** | 认证系统 | `server/auth/*`, `services/auth-service.ts`, `actions/auth.ts`, 登录/注册页面 | 注册→登录→退出 全流程 |
| **5** | proxy.ts 路由保护 | `src/proxy.ts` | 未登录访问 /cart → 重定向；USER 访问 /admin → 重定向 |
| **6** | 商品浏览 | `services/product-service.ts`, `services/category-service.ts`, 列表/详情/分类页面 | 分页、筛选、搜索正常 |
| **7** | 购物车 | `services/cart-service.ts`, `actions/cart.ts`, 购物车页面 | 加入/修改/删除 + 校验 |
| **8** | 下单 | `services/order-service.ts`, `actions/order.ts`, 订单确认/详情页 | 事务、扣库存、快照验证 |
| **9** | 模拟支付 + 订单列表 | 订单列表页、支付 Action | PENDING → PAID |
| **10** | 后台管理 | `services/admin-service.ts`, Dashboard、商品管理、分类管理、订单管理 | admin 功能完整 |
| **11** | 状态覆盖 | loading.tsx, error.tsx, empty state, skeleton | 每种状态可触发验证 |
| **12** | 收尾 | lint, typecheck, build, README | `npm run lint && npm run build` 零错误 |

---

## 各步骤详细说明

### Step 1: 安装依赖 + 环境配置

```bash
npm install prisma @prisma/client jose bcryptjs zod
npm install -D tsx
```

`.env` 文件：
```
DATABASE_URL="mysql://root:root@127.0.0.1:3306/mini_mall"
JWT_SECRET="dev-secret-key-change-in-production"
```

### Step 2: Prisma Schema + 迁移 + Seed

- 创建 `prisma/schema.prisma`（见 [03-database.md](03-database.md)）
- 创建 `prisma/seed.ts`：2 用户 + 3 分类 + ~20 商品 + 2-3 示例订单
- 执行 `npx prisma db push` → `npx tsx prisma/seed.ts`
- 用 `npx prisma studio` 可视化确认

### Step 3: 基础设施

创建文件：
- `src/server/db.ts` — Prisma 单例（globalThis 缓存）
- `src/lib/errors.ts` — AppError 类族
- `src/lib/validations.ts` — Zod schemas
- `src/lib/utils.ts` — formatCurrency, buildPagination, slugify
- `src/lib/constants.ts` — PAGE_SIZE, ORDER_STATUS_LABELS 等
- `src/types/index.ts` — 共享类型

### Step 4: 认证系统

创建文件：
- `src/server/auth/jwt.ts` — signToken / verifyToken（jose）
- `src/server/auth/password.ts` — hashPassword / verifyPassword（bcryptjs）
- `src/server/auth/session.ts` — getCurrentUser()
- `src/server/services/auth-service.ts` — register / login / logout
- `src/actions/auth.ts` — Server Actions
- `src/components/auth/LoginForm.tsx` — 客户端表单组件
- `src/components/auth/RegisterForm.tsx` — 客户端表单组件
- `src/app/(main)/auth/login/page.tsx`
- `src/app/(main)/auth/register/page.tsx`

### Step 5: proxy.ts 路由保护

创建 `src/proxy.ts`：
- 公开路径白名单放行
- `/admin/*` 需 ADMIN 角色
- `/cart`、`/orders/*` 需登录
- 未登录页面访问 → 重定向 `/auth/login`

### Step 6: 商品浏览

创建文件：
- `src/server/services/product-service.ts`
- `src/server/services/category-service.ts`
- `src/components/product/ProductCard.tsx`、`ProductGrid.tsx`、`ProductFilters.tsx`
- `src/app/(main)/products/page.tsx`
- `src/app/(main)/products/[slug]/page.tsx`
- `src/app/(main)/categories/[slug]/page.tsx`

### Step 7: 购物车

创建文件：
- `src/server/services/cart-service.ts`
- `src/actions/cart.ts`
- `src/components/cart/CartItemRow.tsx`、`CartSummary.tsx`、`CartQuantityControl.tsx`
- `src/app/(main)/cart/page.tsx`

### Step 8: 下单

创建文件：
- `src/server/services/order-service.ts`（含完整事务逻辑）
- `src/actions/order.ts`
- `src/components/order/OrderCard.tsx`、`OrderDetail.tsx`、`OrderStatusBadge.tsx`
- `src/app/(main)/orders/page.tsx`
- `src/app/(main)/orders/[id]/page.tsx`

关键测试：
1. 正常下单 → 库存正确扣减
2. 并发下单（两个用户同时买最后一个库存）→ 一个成功一个失败
3. 下单后 OrderItem 快照包含完整商品信息
4. 下单后购物车被清空

### Step 9: 模拟支付 + 取消订单 + 订单列表

- 在订单详情页添加"模拟支付"按钮
- 在订单详情页添加"取消订单"按钮（仅 PENDING 状态可见）
- 实现 `payOrder` Action + Service
- 实现 `cancelOrder` Action + Service（事务内恢复库存）
- `revalidatePath('/orders')` 刷新

### Step 10: 后台管理

创建文件：
- `src/server/services/admin-service.ts`
- `src/actions/product.ts`、`src/actions/category.ts`、`src/actions/admin.ts`
- `src/components/layout/AdminSidebar.tsx`、`AdminHeader.tsx`
- `src/components/product/ProductForm.tsx`（新建/编辑复用）
- `src/components/order/OrderStatusSelect.tsx`
- `src/app/admin/layout.tsx`、各子页面

所有后台 Action 和 Service 通过 `getCurrentUser()` 校验 ADMIN 角色。

### Step 11: 状态覆盖

为每个路由段创建：
- `loading.tsx` — 骨架屏 / Spinner
- `error.tsx` — 错误信息 + 重试按钮
- Empty state 处理（各页面内联）

### Step 12: 收尾

```bash
npm run lint        # ESLint 零错误
npx tsc --noEmit    # TypeScript 零错误
npm run build       # Next.js 生产构建零错误
```

更新 README.md：项目简介 + 启动指南 + 技术栈 + 功能列表。

---

## 性能优化清单

实施各步骤时同步应用：

1. **Service 读方法用 `React.cache()` 包装**（Step 3 起）
2. **Server Component 中 `Promise.all()` 并行获取数据**（Step 6 起）
3. **`revalidatePath()` 精准路径刷新，严禁 `revalidatePath('/')`**（Step 7 起）
4. **Client Boundary 最小化**：仅交互叶子组件标记 `'use client'`
5. **`next/image`** 用于所有商品图片，配置 `remotePatterns`（Step 6）
6. **每个路由段放 `loading.tsx`**，利用 Streaming SSR（Step 11）

---

## 手动验证流程

| 场景 | 预期行为 |
|------|---------|
| 未登录访问 `/cart` | 重定向 `/auth/login` |
| 未登录访问 `/admin` | 重定向 `/auth/login` |
| 普通用户访问 `/admin` | 重定向首页 `/` |
| 注册 → 登录 | 成功后重定向首页，Header 显示用户名 |
| 浏览商品列表 | 分页正常、分类筛选生效、搜索匹配结果 |
| 商品详情页 | 图片、价格（分→元）、库存展示正确 |
| 加入购物车 | 库存不足/已下架商品被拒绝 |
| 修改购物车数量 | 不超过库存上限 |
| 下单 | 扣库存成功，订单快照完整（productSku, unitPriceCents, subtotalCents） |
| 模拟支付 | PENDING → PAID |
| 取消订单（PENDING） | PENDING → CANCELLED，库存恢复 |
| 取消订单（PAID） | 被拒绝（仅 PENDING 可取消） |
| 查看历史订单 | 含收货信息、商品快照 |
| 修改已下单商品的价格 | 历史订单仍显示下单时的快照价格 |
| 下架已下单的商品 | 历史订单仍正常展示 |
| 管理员新增/编辑商品 | sku、分类、图片 URL 正确保存 |
| 管理员下架商品 | 已加入购物车的该商品不能下单但购物车中有提示 |
| 管理员修改订单状态 | PENDING → PAID → SHIPPED → DELIVERED，非法转换被拒绝 |
| 并发下单（最后一件库存） | 一个成功一个失败，提示库存不足 |

---

*关联文档：[04-actions-and-services.md](04-actions-and-services.md) | [05-ui-guidelines.md](05-ui-guidelines.md) | [07-risk-and-decisions.md](07-risk-and-decisions.md)*
