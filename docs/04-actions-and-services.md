# 04 — Server Action 与 Service 设计

## 调用关系

```
Server Component (读)  ──→ Service Layer ──→ Prisma
Server Action (写)     ──→ Service Layer ──→ Prisma → revalidatePath()
```

- Server Component 直接调用 Service 层读方法（用 `React.cache()` 包装）
- Server Action 调用 Service 层写方法 + `revalidatePath()` 精准刷新缓存
- **MVP 不做 API Routes**，不在 `src/app/api/` 下创建任何文件

## React.cache() 使用规则

`React.cache()` 仅用于 **读方法**，严禁用于写方法。

| 允许（读方法） | Service 文件 |
|---------------|-------------|
| getProductList | product-service.ts |
| getProductBySlug | product-service.ts |
| getCategoryList | category-service.ts |
| getCategoryBySlug | category-service.ts |
| getCartItems | cart-service.ts |
| getOrders | order-service.ts |
| getOrderById | order-service.ts |
| getDashboardStats | admin-service.ts |

| 禁止（写方法） | Service 文件 |
|---------------|-------------|
| createOrder | order-service.ts |
| addToCart | cart-service.ts |
| updateCartItem | cart-service.ts |
| removeFromCart | cart-service.ts |
| payOrder | order-service.ts |
| createProduct | product-service.ts |
| updateProduct | product-service.ts |
| togglePublish | product-service.ts |
| createCategory | category-service.ts |
| updateCategory | category-service.ts |
| updateOrderStatus | order-service.ts |
| login / register / logout | auth-service.ts |

## Zod 校验策略

**Service 层是唯一真相源。** Actions 不写校验逻辑：

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

## Server Actions 接口

### auth.ts

```typescript
// 登录
login(email: string, password: string): Promise<{ error?: string }>

// 注册（注册即登录，无邮箱验证）
register(email: string, password: string, name: string): Promise<{ error?: string; fields?: Record<string, string> }>

// 退出
logout(): Promise<void>
```

### cart.ts

```typescript
// 加入购物车（已存在则 upsert 增加数量）
addToCart(productId: number, quantity: number): Promise<{ error?: string }>

// 更新购物车商品数量
updateCartItem(cartItemId: number, quantity: number): Promise<{ error?: string }>

// 移除购物车商品
removeFromCart(cartItemId: number): Promise<void>
```

### order.ts

```typescript
// 创建订单（事务：校验库存 → 快照 → 扣库存 → 清空购物车）
createOrder(formData: {
  receiverName: string
  receiverPhone: string
  shippingAddress: string
}): Promise<{ error?: string; orderId?: number }>

// 模拟支付（PENDING → PAID）
payOrder(orderId: number): Promise<{ error?: string }>

// 取消订单（仅 PENDING → CANCELLED，同一事务内恢复库存）
cancelOrder(orderId: number): Promise<{ error?: string }>
```

### product.ts（管理端）

```typescript
// 新增商品
createProduct(formData: FormData): Promise<{ error?: string; fields?: Record<string, string> }>

// 编辑商品
updateProduct(id: number, formData: FormData): Promise<{ error?: string; fields?: Record<string, string> }>

// 上架/下架切换
togglePublish(id: number): Promise<void>
```

### category.ts（管理端）

```typescript
// 新增分类
createCategory(formData: FormData): Promise<{ error?: string; fields?: Record<string, string> }>

// 编辑分类
updateCategory(id: number, formData: FormData): Promise<{ error?: string; fields?: Record<string, string> }>

// 注意：不支持删除分类
```

### admin.ts（管理端）

```typescript
// 更新订单状态（校验状态转换合法性）
updateOrderStatus(orderId: number, status: OrderStatus): Promise<{ error?: string }>

// Dashboard 统计数据（读方法，用 React.cache() 包装）
getDashboardStats(): Promise<{
  totalProducts: number
  publishedProducts: number
  totalOrders: number
  pendingOrders: number
  totalSalesCents: number | null
  totalUsers: number
}>
```

## Service 层方法签名

### auth-service.ts

```typescript
register(email: string, password: string, name: string): Promise<User>
  // Zod 校验 → 检查邮箱唯一 → bcryptjs 哈希 → 创建 User → 签发 JWT → 返回 User
  // throw ValidationError | ConflictError

login(email: string, password: string): Promise<User>
  // 查 User → bcryptjs 比对 → 签发 JWT → 返回 User
  // throw ValidationError | UnauthorizedError

logout(): Promise<void>
  // 清除 Cookie

setAuthCookie(userId: number, role: string): Promise<void>
  // 签发 JWT → Set-Cookie（httpOnly, secure, sameSite=lax, maxAge=7天）
```

### product-service.ts

```typescript
getProductList(params: {
  page?: number, categoryId?: number, q?: string, sort?: string
}): Promise<{ items: Product[], total: number, page: number, totalPages: number }>
  // React.cache() 包装
  // 支持：分页（默认 12 条/页）、分类筛选、关键词搜索（Prisma contains，匹配 name/sku/description）、排序
  // MVP 使用 LIKE 查询，不做 MySQL FULLTEXT 索引

getProductBySlug(slug: string): Promise<Product | null>
  // React.cache() 包装
  // 返回商品详情（含 category 关联）

createProduct(data: CreateProductInput): Promise<Product>
  // Zod 校验（sku, name, slug, description, priceCents, imageUrls, stock, categoryId）
  // getCurrentUser() → 校验 ADMIN
  // 自动生成 slug（如果未提供）

updateProduct(id: number, data: UpdateProductInput): Promise<Product>
  // 同上权限校验
  // 部分更新

togglePublish(id: number): Promise<Product>
  // getCurrentUser() → 校验 ADMIN
  // 切换 published 字段
  // 注意：不做真删除
```

### category-service.ts

```typescript
getCategoryList(): Promise<Category[]>
  // React.cache() 包装

getCategoryBySlug(slug: string): Promise<Category | null>
  // React.cache() 包装

createCategory(data: CreateCategoryInput): Promise<Category>
  // Zod 校验 → getCurrentUser() → 校验 ADMIN

updateCategory(id: number, data: UpdateCategoryInput): Promise<Category>
  // 同上

// 不支持删除分类
```

### cart-service.ts

```typescript
getCartItems(userId: number): Promise<CartItem[]>
  // React.cache() 包装
  // 含关联 Product 信息

addToCart(userId: number, productId: number, quantity: number): Promise<CartItem>
  // 校验：product.published = true
  // 校验：quantity ≤ product.stock
  // 校验：quantity 范围 1~99（Zod）
  // upsert（利用 @@unique([userId, productId])）

updateCartItem(cartItemId: number, quantity: number): Promise<CartItem>
  // 校验：quantity ≤ product.stock
  // 校验：quantity 范围 1~99（Zod）
  // 校验：cartItem 属于当前用户

removeFromCart(cartItemId: number): Promise<void>
  // 校验：cartItem 属于当前用户
```

### order-service.ts

```typescript
getOrders(userId: number): Promise<Order[]>
  // React.cache() 包装
  // 按 createdAt desc 排序

getOrderById(orderId: number): Promise<Order | null>
  // React.cache() 包装
  // 含 OrderItem 关联

createOrder(userId: number, data: CreateOrderInput): Promise<Order>
  // prisma.$transaction:
  //   ① 查询用户购物车（含 Product）
  //   ② 校验购物车非空
  //   ③ 逐商品：校验 published = true
  //   ④ 逐商品：校验 quantity ≤ stock
  //   ⑤ 生成 orderNo
  //   ⑥ 计算 totalCents
  //   ⑦ 创建 Order
  //   ⑧ 逐商品创建 OrderItem（完整快照）
  //   ⑨ 逐商品扣减库存（updateMany + stock >= quantity）
  //   ⑩ 校验每个 updateMany count === 1
  //   ⑪ 清空购物车
  // throw ValidationError | ConflictError

payOrder(userId: number, orderId: number): Promise<Order>
  // 校验：订单属于当前用户
  // 校验：状态为 PENDING
  // 校验状态转换：PENDING → PAID 合法

cancelOrder(userId: number, orderId: number): Promise<Order>
  // prisma.$transaction:
  //   ① 校验：订单属于当前用户
  //   ② 校验：状态为 PENDING（只有 PENDING 可取消）
  //   ③ 更新 status = CANCELLED
  //   ④ 遍历 OrderItem，逐商品恢复库存（updateMany increment）
  //   ⑤ 恢复库存必须和状态变更在同一事务内，避免重复恢复
  // PAID / SHIPPED / DELIVERED 订单不支持取消 → throw ConflictError

updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order>
  // getCurrentUser() → 校验 ADMIN
  // 校验状态转换合法性（状态机）
```

### admin-service.ts

```typescript
getDashboardStats(): Promise<DashboardStats>
  // React.cache() 包装
  // 返回 6 项指标：
  //   totalProducts, publishedProducts, totalOrders,
  //   pendingOrders, totalSalesCents, totalUsers
```

## Action 标准代码模式

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { someServiceMethod } from '@/server/services/some-service'
import { AppError, ValidationError } from '@/lib/errors'

export async function someAction(formData: FormData) {
  try {
    const result = await someServiceMethod(/* ... */)
    revalidatePath('/some-path')
    return { success: true, data: result }
  } catch (e) {
    if (e instanceof ValidationError) {
      return { error: e.message, fields: e.fields }
    }
    if (e instanceof AppError) {
      return { error: e.message }
    }
    // 未预期错误，抛出让 error.tsx 处理
    throw e
  }
}
```

## 后续扩展：API Routes

> **非 MVP 范围。** 如未来需要 REST API（移动端 App 对接），在 `src/app/api/` 下创建路由文件，每个 API Route 调用对应 Service 层方法，转换为 JSON Response。API Route 不调用 Server Action。

---

*关联文档：[02-architecture.md](02-architecture.md) | [03-database.md](03-database.md) | [06-implementation-plan.md](06-implementation-plan.md)*
