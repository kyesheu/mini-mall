# 02 — 架构与设计规范

## 分层架构

```
Browser Request
  → proxy.ts（轻量鉴权，不查 DB）
    → Server Component（读） / Server Action（写）
      → Service Layer（业务逻辑 + Zod 校验 + 事务）
        → Prisma Client（src/server/db.ts 单例）
          → MySQL 8
```

## 关键约束

1. **Prisma 仅在两处出现：** `src/server/db.ts` + `src/server/services/*`
2. **Server Component / Server Action 都只调用 Service 层**，不直接访问 Prisma
3. **Service 层承载全部业务逻辑、权限校验、Zod 校验和事务**
4. **Server Action 只负责：** 接收 FormData → 调 Service → 处理错误 → `revalidatePath()`
5. **MVP 不做 API Routes**
6. **权限以 `getCurrentUser()` 为准**，不信任 proxy headers

## React.cache() 规则

| 允许（读） | 禁止（写） |
|-----------|-----------|
| getProductList, getProductBySlug | createOrder, addToCart |
| getCategoryList, getCategoryBySlug | updateCartItem, removeFromCart |
| getCartItems, getOrders, getOrderById | payOrder, createProduct |
| getDashboardStats | updateProduct, togglePublish |
| getProductListAdmin | createCategory, updateCategory, updateOrderStatus |
| | login, register, logout |

## Server Actions 接口

```typescript
// auth.ts
login(email, password) / register(email, password, name) / logout()

// cart.ts
addToCart(productId, quantity) / updateCartItem(cartItemId, quantity) / removeFromCart(cartItemId)

// order.ts
createOrder(formData) / payOrder(orderId) / cancelOrder(orderId)

// product.ts (admin)
createProduct(formData) / updateProduct(id, formData) / togglePublish(id)

// category.ts (admin)
createCategory(formData) / updateCategory(id, formData)

// admin.ts
updateOrderStatus(orderId, status)
```

## Action 标准模式

```typescript
'use server'
async function someAction(formData) {
  try {
    await someService(/* ... */)
    revalidatePath('/path')
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e  // 未预期错误 → error.tsx
  }
}
```

## 错误处理

```
AppError (base, statusCode)
  ├── ValidationError (422, fields)
  ├── NotFoundError (404)
  ├── UnauthorizedError (401)
  ├── ForbiddenError (403)
  └── ConflictError (409)
```

Service → throw AppError → Action catch → `{error, fields}` → Client 展示

## 认证与权限

- **JWT：** jose HS256，payload `{ sub, role }`，7 天有效期
- **Cookie：** httpOnly, secure(生产), sameSite=lax, path=/
- **proxy.ts：** 仅做 cookie 验证 + 重定向，不查 DB
  - 公开路径：`/, /products, /categories, /search, /auth/login, /auth/register`
  - `/admin/*`：需 ADMIN role
  - `/cart, /checkout, /orders/*`：需登录
- **getCurrentUser()：** 每次查数据库拿最新 role，是权限判断唯一来源

## 目录结构

```
src/
  proxy.ts                    # 路由保护
  app/
    (main)/                   # 前台路由组
    admin/                    # 后台路由组
  server/
    db.ts                     # Prisma 单例
    auth/                     # jwt / password / session
    services/                 # 6 个 service 文件
  actions/                    # 6 个 action 文件
  components/                 # ui / layout / product / cart / order / auth / admin
  lib/                        # errors / validations / utils / constants
  types/                      # 共享类型
```

## UI 设计规范

### 色彩

```
Primary (品牌):   #1A1A2E  — 导航、主要按钮
Accent (强调):    #E94560  — 价格、CTA
Success:          #16A34A  — 成功状态
Warning:          #D97706  — 警告状态
Error:            #DC2626  — 错误状态
Neutral:          Slate 50~900
前台背景:          #FAFAFA
后台背景:          #F1F5F9
```

### 字体

```
PingFang SC → Microsoft YaHei → system-ui → sans-serif
```

### 5 种必覆盖状态

每个页面/组件必须处理：Loading（骨架屏）、Empty（空状态+CTA）、Error（错误+重试）、Success（操作反馈）、Edge case（截断/极端值）

### 组件规范

| 组件 | 规范 |
|------|------|
| Button | primary/secondary/danger/ghost，高度 40px，focus-visible ring |
| Card | 白底 1px 边框 rounded-lg，hover:shadow-md |
| Input | 高 40px，focus ring primary，disabled 灰底，error 红边框 |
| Badge | rounded-full，状态色映射 |
| Modal | 居中+遮罩，ESC 关闭，focus trap |

### 响应式

mobile-first：默认单列 → sm:双列 → md:三列 → lg:四列产品网格

### 避免的模板感

不使用 Inter/Roboto、emoji 图标、渐变按钮、hero gradient background。用留白建立层次，商品图片统一 4:3 object-cover。

---

*关联文档：[01-spec.md](01-spec.md) | [03-database.md](03-database.md)*
