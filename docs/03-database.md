# 03 — 数据库设计

## 数据库

- **数据库：** MySQL 8
- **ORM：** Prisma（provider = `"mysql"`）
- **金额字段统一使用 `Int`（分单位）**，避免浮点精度问题

## 金额字段命名规范

| 表 | 字段 | 含义 | 示例 |
|----|------|------|------|
| Product | `priceCents` | 商品单价 | 19990 = ¥199.90 |
| Order | `totalCents` | 订单总金额 | 59970 = ¥599.70 |
| OrderItem | `unitPriceCents` | 成交单价快照 | 19990 = ¥199.90 |
| OrderItem | `subtotalCents` | 小计快照 | 59970 = ¥599.70 |

前端展示用 `formatCurrency(cents: number): string` → `¥199.90`。

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================================
// 枚举
// ============================================================
enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING    // 待支付
  PAID       // 已支付
  SHIPPED    // 已发货
  DELIVERED  // 已签收
  CANCELLED  // 已取消
}

// ============================================================
// 用户表
// ============================================================
model User {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  password  String                       // bcryptjs 哈希
  name      String
  role      Role       @default(USER)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  cartItems CartItem[]
  orders    Order[]
}

// ============================================================
// 分类表（不支持删除，只做新增和编辑）
// ============================================================
model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  slug        String    @unique
  description String?   @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products    Product[]
}

// ============================================================
// 商品表
// 不支持真删除，后台只能下架（published = false）
// 图片最多 6 张，存为 Json 数组
// ============================================================
model Product {
  id          Int      @id @default(autoincrement())
  sku         String   @unique
  name        String
  slug        String   @unique
  description String   @db.Text
  priceCents  Int                        // 单价（分）
  imageUrls   Json     @default("[]")    // 图片 URL 数组，最多 6 张
  stock       Int      @default(0)
  published   Boolean  @default(false)   // 上架状态（false=下架）
  categoryId  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category    Category?  @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  cartItems   CartItem[]
  orderItems  OrderItem[]

  @@index([categoryId])
  @@index([published])
  @@index([createdAt])
}

// ============================================================
// 购物车表
// @@unique([userId, productId]) 支持 upsert
// ============================================================
model CartItem {
  id        Int      @id @default(autoincrement())
  userId    Int
  productId Int
  quantity  Int      @default(1)         // 1~99
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([userId])
}

// ============================================================
// 订单表
// ============================================================
model Order {
  id              Int         @id @default(autoincrement())
  orderNo         String      @unique        // MM + YYYYMMDD + 4位序号
  userId          Int
  status          OrderStatus @default(PENDING)
  totalCents      Int                         // 订单总金额（分）
  receiverName    String                      // 收货人姓名
  receiverPhone   String                      // 收货人电话
  shippingAddress String                      // 收货地址
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user  User        @relation(fields: [userId], references: [id])
  items OrderItem[]

  @@index([userId])
  @@index([orderNo])
  @@index([status])
  @@index([createdAt])
}

// ============================================================
// 订单商品快照表
// 下单时完整快照，确保后续商品编辑/删除不影响订单历史
// ============================================================
model OrderItem {
  id              Int     @id @default(autoincrement())
  orderId         Int
  productId       Int?                      // 原商品ID（商品删除后置 NULL）
  productName     String                    // 商品名称快照
  productSku      String                    // SKU 快照
  productSlug     String?                   // slug 快照
  productImageUrl String?                   // 首图快照
  unitPriceCents  Int                       // 成交单价快照（分）
  quantity        Int                       // 购买数量
  subtotalCents   Int                       // 小计快照（分）

  order   Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([orderId])
}
```

## 领域模型要点

### Product 不支持真删除

后台只有"下架"操作（`published = false`）。如果未来需要真删除，必须先检查是否有关联的 OrderItem。这样可以确保：
- 任何历史订单中的商品快照都能追溯到原始商品（productId 不为 NULL）
- 不会因误删除导致订单历史不完整

### OrderItem 是完整的商品快照

快照字段：`productName`、`productSku`、`productSlug`、`productImageUrl`、`unitPriceCents`、`quantity`、`subtotalCents`。

即便商品被删除（productId → NULL）或价格被修改，订单历史仍然完整可追溯。

### CartItem 与 Product 的关系

- User 删除 → CartItem CASCADE 删除
- Product 不支持真删除，所以 `onDelete: Cascade` 不会实际触发
- 下架商品在购物车中显示"已下架"标记，不能下单但不自动清除

### 订单状态机

合法转换路径：

```
PENDING ──→ PAID ──→ SHIPPED ──→ DELIVERED
   │
   └──→ CANCELLED（恢复库存）
```

- PENDING → CANCELLED：**允许**，且必须恢复库存（同一事务内）
- PAID / SHIPPED / DELIVERED：**不支持取消**
- CANCELLED 是终态，不可再转换
- DELIVERED 是终态
- Service 层 (`order-service.ts`) 必须校验状态转换合法性

### orderNo 生成规则

格式：`MM` + `YYYYMMDD` + 8 位短随机码（大写字母 + 数字），如 `MM20260623A8K2Q1`。

**生成方式：** 使用 `crypto.randomUUID()` 或 `Math.random()` 生成 8 位随机字符串，而非数据库序号递增。避免并发时查当日最大序号带来的竞态条件。

**冲突处理：** `orderNo @unique` 约束 + 事务内重试（最多 3 次），冲突时重新生成随机码。

## Dashboard 查询口径

| 指标 | 计算方式 |
|------|---------|
| 商品总数 | `prisma.product.count()` |
| 已上架商品数 | `prisma.product.count({ where: { published: true } })` |
| 订单总数 | `prisma.order.count()` |
| 待处理订单数 | `prisma.order.count({ where: { status: { in: ['PENDING', 'PAID'] } } })` |
| 总销售额 | `prisma.order.aggregate({ where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } }, _sum: { totalCents: true } })` |
| 用户总数 | `prisma.user.count()` |

## Seed 数据计划

### 用户（2 个）

| 邮箱 | 密码 | 角色 |
|------|------|------|
| admin@example.com | admin123 | ADMIN |
| user@example.com | user123 | USER |

### 分类（3 个）

电子产品、服装、图书（含 slug）

### 商品（~20 个）

每分类 6-7 个商品：
- 价格范围：priceCents 990 ~ 99900（¥9.90 ~ ¥999.00）
- 库存范围：0 ~ 500（包含至少 1 个库存为 0 的商品，测试 edge case）
- 图片：picsum.photos 占位图，每个商品 2-4 张（seed 数据尽量都有图片保证演示效果。imageUrls 允许为空数组 `[]`，前端显示默认占位图）
- 至少 2 个商品初始 published = false（测试下架状态）

### 示例订单（2-3 个）

- 1 个 PENDING 订单（含 2 个 OrderItem）
- 1 个 PAID 订单（含 3 个 OrderItem）

---

*关联文档：[02-architecture.md](02-architecture.md) | [04-actions-and-services.md](04-actions-and-services.md) | [07-risk-and-decisions.md](07-risk-and-decisions.md)*
