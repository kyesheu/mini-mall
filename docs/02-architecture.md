# 02 — 分层架构与目录结构

## 分层架构

```
┌──────────────────────────────────────────────────────┐
│  Browser Request                                     │
├──────────────────────────────────────────────────────┤
│  proxy.ts        ← 轻量鉴权（cookie 级，不查 DB）      │
├──────────────────────────────────────────────────────┤
│  Server Component  │  Server Action                  │
│  (读数据渲染页面)    │  (表单提交 + revalidatePath)     │
├──────────────────────────────────────────────────────┤
│  Service Layer     ← 核心业务逻辑 + 事务 + Zod 校验    │
│  src/server/services/                                │
├──────────────────────────────────────────────────────┤
│  Prisma Client     ← src/server/db.ts（单例）         │
├──────────────────────────────────────────────────────┤
│  MySQL 8                                              │
└──────────────────────────────────────────────────────┘
```

## 调用关系

```
Server Component (读)  ──→ Service Layer ──→ Prisma ──→ MySQL 8
Server Action (写)     ──→ Service Layer ──→ Prisma ──→ MySQL 8 → revalidatePath()
```

- Server Component 直接调用 Service 层读方法获取数据渲染页面
- Server Action 调用 Service 层写方法 + `revalidatePath()` 刷新缓存
- **MVP 不做 API Routes**（后续如需 REST API 对接移动端再扩展）

## 关键约束

1. **Prisma 只允许出现在两处：** `src/server/db.ts`（单例导出）、`src/server/services/*`（数据访问）
2. **Server Component 调用 Service 层读方法**，用 `React.cache()` 包装，实现请求级去重
3. **Server Action 调用 Service 层写方法** + `revalidatePath()` 精准刷新
4. **Server Action 和 Server Component 都只调用 Service 层**，不直接访问 Prisma
5. **MVP 不做 API Routes**，不在 `src/app/api/` 下创建任何文件

## React.cache() 使用规则

| 允许（读方法） | 禁止（写方法） |
|---------------|---------------|
| getProductList | createOrder |
| getProductBySlug | addToCart |
| getCategoryList | updateCartItem |
| getCategoryBySlug | removeFromCart |
| getCartItems | payOrder |
| getOrders | createProduct |
| getOrderById | updateProduct |
| getDashboardStats | togglePublish |
| getUserCount | createCategory |
| getPublishedProductCount | updateCategory |
| | updateOrderStatus |
| | login / register / logout |

## 目录结构

```
src/
  proxy.ts                          # Next.js 16 路由拦截（替代 middleware.ts）

  app/
    globals.css                     # @import "tailwindcss" + @theme
    layout.tsx                      # 根布局
    page.tsx                        # 首页

    (main)/                         # 前台路由组（共享 Header/Footer）
      layout.tsx
      products/
        page.tsx                    # 商品列表（分页 + 筛选 + 搜索）
        [slug]/page.tsx             # 商品详情
      categories/[slug]/page.tsx    # 分类商品列表
      cart/page.tsx                 # 购物车
      orders/
        page.tsx                    # 我的订单列表
        [id]/page.tsx               # 订单详情 + 模拟支付
      auth/
        login/page.tsx
        register/page.tsx

    admin/                          # 后台路由组（共享侧边栏布局）
      layout.tsx
      page.tsx                      # Dashboard
      products/
        page.tsx                    # 商品管理列表
        new/page.tsx                # 新增商品
        [id]/edit/page.tsx          # 编辑商品
      categories/page.tsx           # 分类管理
      orders/
        page.tsx                    # 订单管理列表
        [id]/page.tsx               # 订单详情 + 状态变更

  components/
    ui/                             # Button, Input, Card, Badge, Modal, Pagination
    layout/                         # Header, Footer, AdminSidebar, AdminHeader
    product/                        # ProductCard, ProductGrid, ProductFilters, ProductForm
    cart/                           # CartItemRow, CartSummary, CartQuantityControl
    order/                          # OrderCard, OrderDetail, OrderStatusBadge, OrderStatusSelect
    auth/                           # LoginForm, RegisterForm

  server/
    db.ts                           # Prisma 单例
    auth/
      jwt.ts                        # JWT 签发/验证（jose）
      password.ts                   # bcryptjs 哈希/验证
      session.ts                    # getCurrentUser()：查数据库拿最新信息
    services/
      auth-service.ts               # 注册、登录、登出
      product-service.ts            # 商品 CRUD、列表查询、分页筛选
      category-service.ts           # 分类 CRUD
      cart-service.ts               # 购物车增删改查 + 校验
      order-service.ts              # 下单事务、支付、状态变更、库存扣减
      admin-service.ts              # Dashboard 统计

  actions/
    auth.ts                         # login / register / logout
    cart.ts                         # addToCart / updateCartItem / removeFromCart
    order.ts                        # createOrder / payOrder
    product.ts                      # createProduct / updateProduct / togglePublish
    category.ts                     # createCategory / updateCategory
    admin.ts                        # updateOrderStatus

  lib/
    utils.ts                        # formatCurrency, buildPagination, slugify
    constants.ts                    # PAGE_SIZE, ORDER_STATUS_LABELS, ROLE_LABELS
    validations.ts                  # Zod schemas（Service 层唯一真相源）
    errors.ts                       # AppError 类族

  types/
    index.ts                        # 共享 TypeScript 类型
```

## Zod 校验策略

**Service 层是唯一真相源。** Actions 不写校验逻辑。

```
Server Action（薄层）
  → 接收 FormData
  → 调用 service.createProduct(data)
       → Service 内部：Zod schema.parse(data)
       → 失败 throw ValidationError({ fields })
  → Action catch ValidationError → return { error, fields }
  → Action catch other AppError → return { error }
  → 成功 → revalidatePath() → return { success: true }
```

Actions 和 Service 层绝不重复写两套校验。

## 错误处理

### 错误类族（`src/lib/errors.ts`）

```
AppError (base, statusCode)
  ├── ValidationError (422, fields: Record<string, string>)
  ├── NotFoundError (404)
  ├── UnauthorizedError (401)
  ├── ForbiddenError (403)
  └── ConflictError (409, 库存不足等)
```

### 各层处理规则

| 层 | 处理方式 |
|----|---------|
| **Service** | throw 具体 AppError 子类 |
| **Server Action** | try/catch AppError → return `{ error: string, fields? }` |
| **Server Component** | 不 catch（让 error.tsx 边界处理），可恢复错误用 try/catch |

### Action 标准模式

```typescript
'use server'
import { addToCart as addToCartService } from '@/server/services/cart-service'
import { revalidatePath } from 'next/cache'

export async function addToCart(productId: number, quantity: number) {
  try {
    await addToCartService(productId, quantity)
    revalidatePath('/cart')
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e // 未预期错误，让 error.tsx 处理
  }
}
```

## getCurrentUser() — 唯一认证来源

`src/server/auth/session.ts`：

```typescript
export async function getCurrentUser() {
  // 1. 从 cookies() 读取 token
  // 2. jwtVerify 验证签名
  // 3. 查数据库 prisma.user.findUnique({ where: { id } })
  // 4. 返回 { id, email, name, role } 或 null
  // 5. 每次都查 DB，确保拿到最新 role
}
```

**proxy.ts 注入的 `x-user-id` / `x-user-role` header 不允许作为权限判断依据。** 所有 Service 层权限判断必须通过 `getCurrentUser()` 查数据库。

## 权限检查模式（Service 层）

```typescript
// 每个需要权限的 Service 方法第一行：
const user = await getCurrentUser()
if (!user) throw new UnauthorizedError('请先登录')
if (user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')
```

## 后续扩展：API Routes

> **非 MVP 范围。** 如未来需要 REST API（移动端 App 对接），在 `src/app/api/` 下创建路由文件，每个 API Route 调用对应 Service 层方法，转换为 JSON Response。API Route 不调用 Server Action。

---

*关联文档：[01-project-overview.md](01-project-overview.md) | [03-database.md](03-database.md) | [04-actions-and-services.md](04-actions-and-services.md)*
