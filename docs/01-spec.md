# 01 — 项目规格与关键决策

## 项目定位

一个可运行、架构清晰、代码干净的全栈微型电商 MVP

**技术栈：** Next.js 16 + TypeScript + Prisma + MySQL 8 + Tailwind CSS 4 + JWT (jose) + bcryptjs + Zod

## MVP 功能边界

### 前台

- 商品列表（分页、分类筛选、关键词搜索、排序）
- 商品详情（图片、价格、库存、加购）
- 用户注册 / 登录 / 退出（JWT httpOnly Cookie，注册即登录无邮箱验证）
- 购物车（增删改数量，已下架商品禁用操作仅可删除）
- 创建订单（事务：校验库存 → 商品快照 → 条件扣库存 → 清空购物车）
- 订单列表 / 订单详情 / 模拟支付 / 取消订单（PENDING 恢复库存）

### 后台（ADMIN 角色）

- Dashboard（商品总数、已上架数、订单总数、待处理数、总销售额、用户总数）
- 商品管理（列表、新增、编辑、上架/下架，不支持真删除）
- 分类管理（列表、新增，不支持删除）
- 订单管理（全部订单列表、详情、状态变更）

### 明确不做的功能

API Routes、真实支付、会员、优惠券、Redis、MQ、多语言、图片上传、商品真删除、分类删除、邮箱验证、再次购买、生产部署

## 关键决策

### D1: 金额 Int 分单位

所有金额字段（priceCents / totalCents / unitPriceCents / subtotalCents）使用整数存储，单位分。避免浮点精度问题。

### D2: MySQL 8

更接近生产环境，InnoDB 行级锁支持库存防超卖，原生 JSON 类型。

### D3: Product 不支持真删除

仅做 `published = false` 下架。防止 CartItem 级联删除和 OrderItem 快照断裂。

### D4: 分类不支持删除

MVP 阶段只做新增和编辑。未来如需删除，先校验关联商品为空。

### D5: 不做 API Routes

前端全部通过 Server Components + Server Actions 实现。

### D6: Zod 校验仅在 Service 层

Service 层是唯一真相源。Actions 不写校验逻辑，只 catch ValidationError → `{error, fields}`。

### D7: getCurrentUser() 是唯一认证来源

proxy.ts 只做路由级 cookie 校验，不查 DB。Service 层通过 `getCurrentUser()` 查数据库获取最新角色。proxy headers 不作为权限依据。

### D8: React.cache() 仅用于读方法

商品列表、详情、分类、购物车、订单查询、Dashboard 统计可用。createOrder、addToCart、payOrder 等写方法禁用。

### D9: 库存扣减使用条件更新 + 事务

`prisma.$transaction` + `updateMany({ where: { stock: { gte: quantity } } })`，校验 `result.count === 1` 防超卖。条件更新降低显式锁复杂度，但仍需关注事务顺序和死锁重试。

### D10: 注册不做邮箱验证

注册即登录，`auth-service.register()` 内部调用 `setAuthCookie()`。

### D11: 图片仅 URL 输入，最多 6 张

不做文件上传。seed 使用 picsum.photos。允许 `imageUrls = []`，前端显示默认占位图。

### D12: 不做 i18n

所有文案简体中文硬编码。

### D13: 取消订单恢复库存（仅 PENDING）

PENDING → CANCELLED 时在同一事务内恢复库存。PAID/SHIPPED/DELIVERED 不支持取消。

### D14: orderNo 使用随机码

格式 `MM + YYYYMMDD + 8位随机码`（如 `MM20260623A8K2Q1`），避免递增序号竞态。`@unique` + 重试兜底。

### D15: 搜索使用 LIKE

Prisma `contains` 匹配 name/sku/description。MVP 不做 FULLTEXT 索引。

### D16: 购物车数量 1~99

Zod + 前端 + 下单前三重校验。

### D17: 图片允许为空

`imageUrls` 默认 `[]`，前端显示占位图。seed 数据保证有图片。

### D18: MVP 不做部署

本地 MySQL + `npm run build` 通过即为完成标准。

## 风险清单

| 风险 | 对策 |
|------|------|
| 订单号随机码冲突 | `@unique` + 重试最多 3 次 |
| 购物车商品被下架 | 下单时校验 `published`，已下架提示但不自动删除 |
| JWT 过期表单数据丢失 | 前端提交前验证登录状态（可选优化） |
| 图片 URL 数组过大 | 前端限制 6 张，Zod `max(6)` |
| 库存不足事务回滚 | 原子保证，前端提示具体商品 |
| 取消订单库存恢复失败 | 状态变更和恢复同事务 |

---

*关联文档：[02-architecture.md](02-architecture.md) | [03-database.md](03-database.md)*
