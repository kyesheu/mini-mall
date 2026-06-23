# Mini Mall 架构设计计划

## Context

从零搭建微型电商项目 Mini Mall，技术栈 Next.js 16 + TypeScript + Prisma latest / 6+ + SQLite + TailwindCSS 4。涵盖前台商品浏览、用户认证、购物车、下单支付、后台管理全流程。

---

## 1. 数据库设计 (Prisma Schema)

### 设计要点
- **金额字段统一用 `Int`（分单位）**：`priceCents`、`totalCents`，避免 SQLite / Decimal / JSON 序列化精度问题
- **OrderItem 快照**：`productName`、`productSlug`、`productImageUrl`、`priceCents` 全部快照，Product 删除后订单历史不受影响
- **Product 删除时 OrderItem.productId 设为 NULL**（`onDelete: SetNull`）
- `CartItem` 有 `@@unique([userId, productId])`，支持 upsert
- `imageUrls` 存 JSON 字符串数组（SQLite 无原生 JSON 类型）
- `slug` 用于 SEO 友好的 URL

### Schema

```prisma
// ============================================================
// Mini Mall 数据库设计
// 金额字段统一使用 Int（分单位），避免 SQLite 浮点精度问题
// 带 @unique 的字段已自动创建索引，无需重复 @@index
// ============================================================

// 用户角色
enum Role {
  USER   // 普通用户
  ADMIN  // 管理员
}

// 订单状态
enum OrderStatus {
  PENDING   // 待支付
  PAID      // 已支付
  SHIPPED   // 已发货
  DELIVERED // 已签收
  CANCELLED // 已取消
}

// ============================================================
// 用户表
// ============================================================
model User {
  id        Int        @id @default(autoincrement()) // 用户ID，自增主键
  email     String     @unique                        // 邮箱，唯一登录凭证
  password  String                                    // 密码哈希（bcryptjs）
  name      String                                    // 用户昵称
  role      Role       @default(USER)                 // 角色：USER | ADMIN
  createdAt DateTime   @default(now())                // 注册时间
  updatedAt DateTime   @updatedAt                     // 最后更新时间

  cartItems CartItem[] // 购物车商品列表
  orders    Order[]    // 订单列表
}

// ============================================================
// 分类表
// ============================================================
model Category {
  id          Int       @id @default(autoincrement()) // 分类ID，自增主键
  name        String    @unique                        // 分类名称（唯一）
  slug        String    @unique                        // URL 友好标识（唯一，如 "electronics"）
  description String?                                  // 分类描述（可选）
  createdAt   DateTime  @default(now())                // 创建时间
  updatedAt   DateTime  @updatedAt                     // 最后更新时间

  products    Product[] // 该分类下的商品列表
}

// ============================================================
// 商品表
// ============================================================
model Product {
  id          Int        @id @default(autoincrement()) // 商品ID，自增主键
  sku         String?    @unique                        // SKU 编码（可选，唯一）
  name        String                                    // 商品名称
  slug        String     @unique                        // URL 友好标识（唯一）
  description String                                    // 商品描述
  priceCents  Int                                       // 价格（单位：分，19990 = ¥199.90）
  imageUrls   String     @default("[]")                 // 图片URL列表（JSON字符串数组）
  stock       Int        @default(0)                    // 库存数量
  published   Boolean    @default(false)                // 是否上架
  categoryId  Int?                                      // 所属分类ID（可选）
  createdAt   DateTime   @default(now())                // 创建时间
  updatedAt   DateTime   @updatedAt                     // 最后更新时间

  category    Category?  @relation(fields: [categoryId], references: [id]) // 所属分类
  cartItems   CartItem[] // 被加入购物车的记录
  orderItems  OrderItem[] // 订单快照记录

  @@index([categoryId]) // 按分类查询
  @@index([published])  // 按上架状态查询
  @@index([createdAt])  // 按创建时间排序
}

// ============================================================
// 购物车表
// ============================================================
model CartItem {
  id        Int      @id @default(autoincrement()) // 购物车项ID，自增主键
  userId    Int                                     // 用户ID
  productId Int                                     // 商品ID
  quantity  Int      @default(1)                    // 数量（1~99）
  createdAt DateTime @default(now())                // 加入时间
  updatedAt DateTime @updatedAt                     // 最后更新时间

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)    // 所属用户
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)  // 对应商品

  @@unique([userId, productId]) // 同一用户对同一商品只有一条记录，支持 upsert
  @@index([userId])             // 按用户查询购物车
}

// ============================================================
// 订单表
// ============================================================
model Order {
  id              Int         @id @default(autoincrement()) // 订单ID，自增主键
  userId          Int                                       // 下单用户ID
  status          OrderStatus @default(PENDING)             // 订单状态
  totalCents      Int                                       // 订单总金额（单位：分）
  receiverName    String                                    // 收货人姓名
  receiverPhone   String                                    // 收货人电话
  shippingAddress String                                    // 收货地址
  createdAt       DateTime    @default(now())               // 下单时间
  updatedAt       DateTime    @updatedAt                    // 最后更新时间

  user  User        @relation(fields: [userId], references: [id]) // 下单用户
  items OrderItem[] // 订单商品快照列表

  @@index([userId])    // 按用户查询订单
  @@index([status])    // 按状态筛选
  @@index([createdAt]) // 按时间排序
}

// ============================================================
// 订单商品快照表
// 下单时快照商品信息，确保商品后续修改/删除后订单历史仍完整
// ============================================================
model OrderItem {
  id              Int      @id @default(autoincrement()) // 订单项ID，自增主键
  orderId         Int                                    // 所属订单ID
  productId       Int?                                   // 原商品ID（商品删除后置NULL）
  productName     String                                 // 商品名称快照
  productSlug     String?                                // 商品slug快照
  productImageUrl String?                                // 商品首图快照
  priceCents      Int                                    // 成交单价快照（单位：分）
  quantity        Int                                    // 购买数量

  order   Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)   // 所属订单
  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull) // 原商品（删除后置NULL）

  @@index([orderId]) // 按订单查询订单项
}
```

> **落地说明**：以上 Schema 的纯代码版本写入 `prisma/schema.prisma`，带中文注释版本同时输出到 `docs/database.md` 作为数据库设计文档。

### Seed 数据
1 个管理员 (`admin@example.com` / `admin123`) + 1 个普通用户 (`user@example.com` / `user123`) + 3 个分类（电子产品、服装、图书）+ ~20 个示例商品。图片用 `picsum.photos` 占位，金额以分为单位（如 `priceCents: 19990` 即 ¥199.90）。

---

## 2. 目录结构

```
src/
  proxy.ts                          # Next.js 16 路由拦截（替代 middleware.ts）

  app/
    globals.css                     # @import "tailwindcss" + @theme
    layout.tsx                      # 根布局
    page.tsx                        # 首页

    (main)/                         # 前台路由组
      products/
        page.tsx                    # 商品列表（分页+筛选）
        [slug]/page.tsx             # 商品详情
      categories/[slug]/page.tsx    # 分类商品列表
      search/page.tsx               # 搜索结果
      cart/page.tsx                 # 购物车
      orders/
        page.tsx                    # 订单列表
        [id]/page.tsx               # 订单详情
      auth/
        login/page.tsx
        register/page.tsx

    admin/                          # 后台路由组（需要 ADMIN 角色）
      layout.tsx                    # 后台布局（侧边栏）
      page.tsx                      # Dashboard
      products/
        page.tsx                    # 商品管理列表
        new/page.tsx                # 新建商品
        [id]/edit/page.tsx          # 编辑商品
      categories/
        page.tsx                    # 分类管理
        new/page.tsx
        [id]/edit/page.tsx
      orders/
        page.tsx                    # 订单管理
        [id]/page.tsx               # 订单详情+状态变更

    api/                            # API 路由
      auth/register/route.ts        # POST
      auth/login/route.ts           # POST
      auth/logout/route.ts          # POST
      auth/me/route.ts              # GET
      products/route.ts             # GET
      products/[id]/route.ts        # GET, PUT, DELETE
      categories/route.ts           # GET, POST
      categories/[id]/route.ts      # PUT, DELETE
      cart/route.ts                 # GET, POST
      orders/route.ts               # GET, POST
      orders/[id]/route.ts          # GET
      orders/[id]/pay/route.ts      # POST
      orders/[id]/status/route.ts   # PUT

  components/
    ui/          # Button, Input, Card, Badge, Modal, Pagination, SearchBar 等
    layout/      # Header, Footer, AdminSidebar, AdminHeader
    product/     # ProductCard, ProductGrid, ProductFilters, ProductForm 等
    cart/        # CartItemRow, CartSummary, CartQuantityControl
    order/       # OrderCard, OrderDetail, OrderStatusBadge, OrderStatusSelect
    auth/        # LoginForm, RegisterForm

  server/
    db.ts                             # Prisma 单例
    auth/
      session.ts                      # getCurrentUser()（查数据库，不只信 JWT）
      password.ts                     # bcryptjs 哈希/验证
      jwt.ts                          # JWT 签发/验证（jose）
    services/
      auth-service.ts                 # 注册、登录、登出
      product-service.ts              # 商品 CRUD、列表查询
      category-service.ts             # 分类 CRUD、slug 查询
      cart-service.ts                 # 购物车增删改查
      order-service.ts                # 下单事务、支付、状态变更
      admin-service.ts                # Dashboard 统计

  actions/
    auth.ts           # login, register, logout（调用 auth-service）
    cart.ts           # addToCart, updateCartItem, removeFromCart
    order.ts          # createOrder, payOrder
    product.ts        # createProduct, updateProduct, deleteProduct
    category.ts       # createCategory, updateCategory, deleteCategory
    admin.ts          # getDashboardStats, updateOrderStatus

  lib/
    utils.ts          # formatCurrency (cents→¥), buildPagination, slugify, parseImageUrls
    constants.ts      # PAGE_SIZE, 状态标签映射
    validations.ts    # Zod schemas

  types/
    index.ts
```

### 调用关系

```
Server Action ──→ Service Layer (category-service.ts) ──→ Prisma (server/db.ts) ──→ SQLite
API Route     ──→ Service Layer (category-service.ts) ──→ Prisma (server/db.ts) ──→ SQLite
Server Component ─→ Service Layer ──→ Prisma (server/db.ts) ──→ SQLite
```

- **Service 层承载核心业务逻辑**，Prisma 只在 `server/db.ts` 和 Service 层内访问
- Server Action 和 API Route 都是薄调用层，不直接写业务代码
- API Route 不调用 Action，两者平级调用 Service

---

## 3. 路由拦截方案（proxy.ts）

Next.js 16 使用 `src/proxy.ts` 替代 `middleware.ts`：

```ts
// src/proxy.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_COOKIE = 'token'

// JWT_SECRET 必须在 .env 中配置，不允许默认值
const secret = process.env.JWT_SECRET
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET = new TextEncoder().encode(secret)

const publicPaths = ['/', '/products', '/categories', '/search', '/auth/login', '/auth/register']

function isPublic(pathname: string): boolean {
  return publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

/** 未认证时：API 返回 401 JSON，页面重定向登录页 */
function unauthorized(request: NextRequest) {
  if (isApiRoute(request.nextUrl.pathname)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.redirect(new URL('/auth/login', request.url))
}

/** token 无效/过期时：清除 cookie，API 返回 401，页面重定向 */
function invalidToken(request: NextRequest) {
  if (isApiRoute(request.nextUrl.pathname)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = NextResponse.redirect(new URL('/auth/login', request.url))
  res.cookies.delete(AUTH_COOKIE)
  return res
}

function injectUserHeaders(request: NextRequest, payload: { sub?: unknown; role?: unknown }) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', String(payload.sub ?? ''))
  requestHeaders.set('x-user-role', String(payload.role ?? ''))
  return requestHeaders
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路径直接放行
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value

  // admin 路径：需要登录 + ADMIN 角色
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!token) return unauthorized(request)
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (payload.role !== 'ADMIN') {
        // 已登录但非管理员访问页面 → 重定向首页；API → 403
        if (isApiRoute(pathname)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/', request.url))
      }
      return NextResponse.next({
        request: { headers: injectUserHeaders(request, payload) },
      })
    } catch {
      return invalidToken(request)
    }
  }

  // 受保护路径：/cart, /orders, /api/cart, /api/orders
  if (pathname.startsWith('/cart') || pathname.startsWith('/orders')
      || pathname.startsWith('/api/cart') || pathname.startsWith('/api/orders')) {
    if (!token) return unauthorized(request)
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      return NextResponse.next({
        request: { headers: injectUserHeaders(request, payload) },
      })
    } catch {
      return invalidToken(request)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/cart',
    '/orders/:path*',
    '/api/admin/:path*',
    '/api/cart',
    '/api/orders/:path*',
  ],
}
```

**关键原则：**
- proxy.ts 只做轻量鉴权，不访问 Prisma。真正的权限校验在 Server Action / Service 层二次确认
- `/api/*` 请求未认证/授权时返回 JSON 错误（401/403），**不重定向**
- `/cart`、`/orders`、`/admin` 等页面请求未认证时重定向到 `/auth/login`

---

## 4. 路由与页面设计

### 前台页面

| 路由 | 渲染方式 | 鉴权 | 说明 |
|---|---|---|---|
| `/` | Server Component | 无 | 首页，轮播 + 推荐商品 |
| `/products` | Server Component | 无 | 分页列表，`?page=&category=&q=&sort=` |
| `/products/[slug]` | Server Component | 无 | 商品详情 + 加入购物车 |
| `/categories/[slug]` | Server Component | 无 | 按分类筛选 |
| `/search?q=` | Server Component | 无 | 搜索结果 |
| `/cart` | Server Component | 需登录 | 购物车，修改数量/删除 |
| `/orders` | Server Component | 需登录 | 订单列表 |
| `/orders/[id]` | Server Component | 需登录 | 订单详情 + 模拟支付 |
| `/auth/login` | Server Component | 无 | 登录表单 |
| `/auth/register` | Server Component | 无 | 注册表单 |

### 后台页面（全部需 ADMIN）

| 路由 | 说明 |
|---|---|
| `/admin` | Dashboard 统计 |
| `/admin/products` | 商品管理表格 |
| `/admin/products/new` | 新建商品 |
| `/admin/products/[id]/edit` | 编辑商品 |
| `/admin/categories` | 分类 CRUD |
| `/admin/orders` | 全部订单管理 |
| `/admin/orders/[id]` | 订单详情 + 状态变更 |

---

## 5. 认证方案

**JWT + httpOnly Cookie，使用 `jose` 库**（Edge Runtime 兼容）

### 安全细节

- Cookie 属性：`httpOnly: true`、`secure: true`（生产）、`sameSite: 'lax'`、`path: '/'`、`maxAge: 7天`
- JWT payload 只放最小信息：`{ sub: userId, role, exp }`
- **`getCurrentUser()` 不直接信 JWT payload**，解析后查数据库拿最新用户信息（角色变更能及时感知）
- ADMIN 页面和后台操作在 Server Action / Service 层再次校验 role
- `JWT_SECRET` 环境变量**强制要求**，不允许默认值，开发环境也通过 `.env` 提供

### 关键模块

```ts
// server/auth/jwt.ts — 签发/验证 JWT（jose），secret 从环境变量强制读取
// server/auth/password.ts — bcryptjs 哈希/验证（salt rounds = 10）
// server/auth/session.ts — getCurrentUser()：解析 cookie → JWT 验证 → 查数据库返回最新 User
```

### getCurrentUser 实现要点

```ts
// server/auth/session.ts
import { cookies } from 'next/headers'
import { jwtVerify, JWT_SECRET } from './jwt'
import { prisma } from '@/server/db'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    // 查数据库拿最新信息，不直接信 JWT payload 里的 role
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, email: true, name: true, role: true },
    })
    return user
  } catch {
    return null
  }
}
```

---

## 6. 数据流

### 调用层次

```
Browser Request
    │
    ▼
proxy.ts（轻量鉴权 + 重定向）
    │
    ├── Server Component（读）→ Service Layer → Prisma → SQLite
    ├── Server Action（写）   → Service Layer → Prisma → SQLite → revalidatePath()
    └── API Route（JSON）     → Service Layer → Prisma → SQLite
```

### 各层职责

| 层 | 职责 |
|---|---|
| Server Component | 读数据渲染页面，直接调用 Service 或 Prisma |
| Server Action | 处理表单提交、页面交互，调用 Service，`revalidatePath()` 刷新缓存 |
| API Route | 返回 JSON，供外部程序化调用 |
| Service | 核心业务逻辑、事务管理、校验，是 Prisma 的主要入口 |
| proxy.ts | 仅做 cookie 级鉴权 + 重定向，不查数据库 |

---

## 7. 关键实现模式

### 7.1 金额展示

```ts
// lib/utils.ts
export function formatCurrency(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}
// 19990 → "¥199.90"
```

### 7.2 下单事务（Service 层）

完整事务流程，放在 `server/services/order-service.ts`：

```
prisma.$transaction:
  1. 获取当前用户购物车（含 product）
  2. 校验购物车不为空
  3. 校验每个商品 published = true
  4. 校验每个商品库存足够（quantity ≤ stock）
  5. 计算 totalCents
  6. 创建 Order（含 receiverName/receiverPhone/shippingAddress）
  7. 创建 OrderItem 快照
  8. 扣减库存（条件更新，防超卖）
  9. 清空购物车
```

**扣库存用条件更新**，防止超卖：

```ts
const result = await tx.product.updateMany({
  where: {
    id: productId,
    stock: { gte: quantity },
  },
  data: {
    stock: { decrement: quantity },
  },
})
// 如果 result.count !== 1，说明库存不足，回滚事务
```

### 7.3 模拟支付

```ts
// server/services/order-service.ts
export async function payOrder(userId: number, orderId: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: 'PENDING' },
  })
  if (!order) throw new Error('订单不存在或状态不可支付')
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID' },
  })
}
```

### 7.4 分页

Server Component 中 `await searchParams` 读取 page 参数，Service 层用 Prisma skip/take 查询，返回 `{ items, total, page, totalPages }`。

### 7.5 Next.js 16 异步 params / searchParams

```tsx
// app/(main)/products/page.tsx
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string; sort?: string }>
}) {
  const params = await searchParams
  // ...
}
```

### 7.6 购物车校验

- quantity 范围 1~99（Zod + Server Action 双重校验）
- 加入购物车时校验商品 `published = true`
- 修改数量时校验不超过当前库存
- 已存在则 upsert（利用 `@@unique([userId, productId])`）
- 商品下架后不能加入购物车

### 7.7 图片处理

- `imageUrls` 字段存 JSON 字符串数组
- 开发阶段用 `picsum.photos` 占位图
- `next.config.ts` 配置 `images.remotePatterns` 允许 picsum 域名

### 7.8 错误处理

- `error.tsx` 错误边界组件
- `loading.tsx` 加载骨架屏
- Server Action 中用 try/catch 返回 `{ error }` 对象
- 所有用户输入用 Zod schema 校验

---

## 8. 实施顺序

| 步骤 | 内容 | 交付物 |
|---|---|---|
| 1 | 初始化 Next.js 16 + TypeScript + TailwindCSS 4 | 项目骨架、配置文件 |
| 2 | 安装 Prisma、jose、bcryptjs、zod | package.json 依赖 |
| 3 | 设计 Prisma Schema（金额用 cents 整数） | `prisma/schema.prisma` |
| 4 | 编写 seed 数据 | `prisma/seed.ts` |
| 5 | 实现 db 单例、utils、constants、validations | `server/db.ts`, `lib/*` |
| 6 | 实现认证系统：注册、登录、logout、getCurrentUser、proxy.ts | `server/auth/*`, `src/proxy.ts`, 登录/注册页面 |
| 7 | 实现商品浏览：Service → Actions → 列表/详情/分类/搜索页面 | products 完整链路 |
| 8 | 实现购物车：校验 + upsert + 数量控制 + 购物车页面 | cart 完整链路 |
| 9 | 实现订单：下单事务（快照+扣库存）、模拟支付、订单页面 | order 完整链路 |
| 10 | 实现后台管理：Dashboard、商品 CRUD、分类 CRUD、订单状态管理 | admin 完整链路 |
| 11 | 增加 loading、error、empty state、响应式适配 | 所有页面的状态覆盖 |
| 12 | 运行 lint、typecheck、build，修复所有错误 | 无报错的生产构建 |

---

## 9. 验证方式

### 自动化检查

```bash
npm run lint
npm run build
npx prisma db push
npx tsx prisma/seed.ts
npx prisma studio          # 可视化确认数据结构
```

### 手动验证流程

| 场景 | 预期行为 |
|---|---|
| 未登录访问 `/cart` | 跳转 `/auth/login` |
| 未登录访问 `/admin` | 跳转 `/auth/login` |
| 普通用户访问 `/admin` | 跳转首页 |
| 注册 → 登录 | 成功后跳转首页，Header 显示用户名 |
| 浏览商品列表 | 分页正常，筛选生效 |
| 搜索商品 | 关键字匹配结果正确 |
| 商品详情页 | 图片、价格（分→元）、库存展示正确 |
| 加入购物车 | 库存不足/已下架商品被拒绝 |
| 修改购物车数量 | 不超过库存上限 |
| 下单 | 扣库存成功，订单快照完整 |
| 模拟支付 | PENDING → PAID 状态变更 |
| 查看历史订单 | 含收货信息、商品快照 |
| **删除已下单商品** | 历史订单仍正常展示（快照 + SetNull） |
| 管理员新建/编辑商品 | sku、分类、图片正确保存 |
| 管理员下架商品 | 已加入购物车的该商品不能再下单 |
| 管理员修改订单状态 | 状态变更正确 |
| 库存不足时下单 | 事务回滚，提示库存不足 |

---

## 10. 技术风险与对策

| 风险 | 对策 |
|---|---|
| SQLite 不支持 Decimal | 金额全部用 Int（分单位），展示时转换 |
| Edge Runtime 不支持 Node crypto | JWT 用 `jose` 替代 `jsonwebtoken`，不含 Node 原生依赖 |
| 库存超卖 | `updateMany` 加 `stock >= quantity` 条件 + 事务内校验 |
| 商品删除破坏历史订单 | OrderItem 全量快照 + `onDelete: SetNull` |
| proxy.ts 鉴权被绕过 | Server Action / Service 层必须做二次 role 校验 |
| JWT role 过期不准确 | `getCurrentUser()` 查数据库拿最新 role |
| JWT_SECRET 泄漏或使用弱密钥 | 强制环境变量配置，不允许默认值；开发环境也通过 `.env` 提供 |
| API 路由鉴权重定向破坏调用方 | `/api/*` 统一返回 401/403 JSON，不重定向登录页 |
