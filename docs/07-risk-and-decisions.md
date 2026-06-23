# 07 — 风险清单与关键决策

## 关键决策记录（ADR 风格）

### D1: 金额存储使用 Int 分单位

**决策：** 所有金额字段（priceCents、totalCents、unitPriceCents、subtotalCents）使用整数存储，单位为分（1/100 元）。

**原因：**
- MySQL Decimal 类型在 JavaScript 中序列化后可能丢失精度
- Int 不受浮点精度影响，计算可逆
- 面试时可讨论电商系统金额处理的常见陷阱

**影响：** 前端展示时必须通过 `formatCurrency()` 转换。所有涉及金额的计算都在整数域完成。

---

### D2: 使用 MySQL 8 而非 SQLite

**决策：** 数据库使用 MySQL 8。

**原因：**
- 更接近真实生产环境，面试展示更有说服力
- 支持事务隔离级别的行级锁（库存防超卖依赖 InnoDB 行级锁）
- 原生 JSON 类型支持（imageUrls 字段）
- 仅 MVP 有额外运维成本（需本地安装 MySQL），但面试价值大于成本

**影响：** 需要 `.env` 中配置 `DATABASE_URL`。Prisma schema 使用 `provider = "mysql"`。

---

### D3: Product 不支持真删除，仅下架

**决策：** 后台不提供商品删除功能，只做上架/下架切换（`published` 字段）。

**原因：**
- 真删除会导致 CartItem CASCADE 删除（用户购物车商品静默消失）
- 真删除会导致 OrderItem.productId 被 SetNull（订单追溯断裂）
- "不下架就不出错"是最简单的数据完整性保护
- 电商系统中商品通常也是"下架"而非"删除"

**影响：** 后台商品管理页面没有删除按钮。未来如需真删除，必须先检查 `CartItem` 和 `OrderItem` 关联。

---

### D4: 分类不支持删除

**决策：** 后台不提供分类删除功能，只做新增和编辑。

**原因：**
- 分类有关联商品时删除会导致 categoryId 被 SetNull
- MVP 阶段分类数量少，不需要删除
- 未来如需删除，先在 Service 层校验 `products.length === 0`

**影响：** 后台分类管理页面没有删除按钮。

---

### D5: MVP 不做 API Routes

**决策：** 第一版不创建 `src/app/api/*` 路由文件。前端全部通过 Server Components（读）+ Server Actions（写）实现。

**原因：**
- 前端不需要 REST API——Server Components 和 Server Actions 已覆盖所有需求
- 减少约 20% 开发量
- 避免 API Route vs Server Action 的功能重叠混淆
- 面试时能讲清楚"为什么没有用 API Route"

**影响：** proxy.ts matcher 不包含 `/api/*` 路径。后续如需 REST API（移动端 App 对接），在 `src/app/api/` 下创建路由文件，每个 Route 调用对应 Service 层方法。

---

### D6: Zod 校验以 Service 层为唯一真相源

**决策：** 所有 Zod schema 定义和校验逻辑只存在于 Service 层。Server Actions 不做校验。

**原因：**
- 避免校验逻辑在两处重复（Action 和 Service）
- 校验靠近数据操作层更安全——即使未来新增调用方（如 API Routes），校验仍然生效
- Service 层校验失败 throw ValidationError → Action catch 转换为 `{ error, fields }` 返回

**影响：** Actions 代码更薄。每个 Action 的 try/catch 需要正确处理 ValidationError。

---

### D7: getCurrentUser() 是权限判断唯一来源

**决策：** proxy.ts 只做轻量路由拦截（验证 Cookie + 重定向）。所有 Service 层权限判断必须通过 `getCurrentUser()` 查数据库拿最新用户角色。

**原因：**
- proxy.ts 运行在 Edge Runtime，不应依赖 Prisma
- JWT payload 中的 role 可能过期（用户角色被修改后 token 未失效）
- 双重鉴权确保即使 proxy.ts 被绕过（如新增路由忘了加 matcher），Service 层仍然拒绝未授权操作
- 数据库查询开销可接受（每次请求一次简单的主键查询）

**影响：** proxy.ts 注入的 `x-user-id` / `x-user-role` header 不允许作为权限判断依据。所有 Service 层写方法第一行必须是 `const user = await getCurrentUser()`。

---

### D8: React.cache() 仅用于读方法

**决策：** `React.cache()` 只允许包装 Service 层的读方法（查询类），严禁用于写方法（create/update/delete/toggle/pay）。

**原因：**
- `React.cache()` 用于请求级去重——同一请求中多次调用相同参数的读方法只执行一次查询
- 写方法有副作用（修改数据），去重会导致操作只执行一次而后续调用返回过期结果
- 语义不匹配：cache 暗示幂等，写操作不是幂等的

**影响：** Service 层文件内部明确区分读方法（export const getX = cache(async () => ...)）和写方法（export async function createX() {...}）。

---

### D9: 库存扣减使用条件更新 + 事务

**决策：** 使用 `prisma.$transaction` + `updateMany({ where: { stock: { gte: quantity } } })` 实现库存扣减。

**原因：**
- MySQL InnoDB 在事务内对 UPDATE 行加排他锁，保证当前读
- 条件更新无死锁风险（相比 SELECT ... FOR UPDATE）
- 实现简洁，不需要引入 Redis
- MVP 并发量不构成瓶颈

**影响：** 事务内必须校验每个 `updateMany` 的 `count === 1`。不满足则回滚并抛出 ConflictError。

---

### D10: 注册不做邮箱验证

**决策：** 注册成功后直接签发 JWT 并登录，不发送验证邮件。

**原因：**
- MVP Demo 场景下，面试官不需要等邮件，体验更流畅
- 避免引入邮件服务依赖
- 可以讲"后续用 Resend / Nodemailer 扩展验证流程"

**影响：** 注册即登录，`auth-service.register()` 内部调用 `setAuthCookie()`。

---

### D11: 图片仅 URL 输入，不做上传

**决策：** 后台新增/编辑商品时，图片仅支持填写外部 URL，不做文件上传。

**原因：**
- 文件上传需要处理 multipart/form-data、存储（本地/OOS）、next.config 配置
- MVP 阶段这些不是核心功能
- URL 输入更能展示数据类型处理能力（JSON 数组）

**影响：** 商品图片最多 6 张。seed 数据使用 picsum.photos 占位图。前端用 `next/image` 渲染，需配置 `remotePatterns`。

---

### D12: 不做 i18n

**决策：** 所有界面文案使用简体中文硬编码，不引入 i18n 方案。

**原因：**
- MVP 不需要多语言
- i18n 会增加路由和组件的复杂度
- 面试时可以讲"后续用 next-intl 扩展"

**影响：** 所有文案直接写在组件中。

---

### D13: 取消订单恢复库存（仅 PENDING）

**决策：** PENDING 状态订单取消时，在同一个事务内恢复所有 OrderItem 对应商品的库存。PAID / SHIPPED / DELIVERED 订单不支持取消。

**原因：**
- 只有 PENDING（未支付）的订单取消才有恢复库存的语义——用户改变了主意
- PAID 及以上状态的订单已经进入履约流程，取消应该走退款/退货流程（MVP 不做）
- 恢复库存和状态变更在同一事务内，避免"状态变了但库存没恢复"或"库存恢复了但状态没变"的不一致
- 不会重复恢复——状态机保证 PENDING → CANCELLED 只能执行一次

**影响：**
- `order-service.cancelOrder()` 使用 `prisma.$transaction`
- 事务内：update status → 遍历 OrderItem → updateMany increment stock

---

### D14: orderNo 使用随机码而非递增序号

**决策：** orderNo 格式为 `MM` + `YYYYMMDD` + 8 位随机码（大写字母 + 数字），如 `MM20260623A8K2Q1`。

**原因：**
- 递增序号方案（查当日最大序号 + 1）在并发下有竞态条件，两个事务可能读到相同序号
- 随机码天然避开了这个竞态——冲突概率极低
- `@unique` 约束 + 重试（最多 3 次）兜底

**影响：** orderNo 不再携带序号信息，但这对展示无影响。

---

### D15: 搜索使用 LIKE 查询

**决策：** MVP 阶段商品搜索使用 Prisma `contains`（即 SQL `LIKE %keyword%`），匹配 `name`、`sku`、`description` 三个字段。

**原因：**
- 20 个商品规模下 LIKE 性能完全足够
- MySQL FULLTEXT 索引需要额外配置和迁移
- 后续量大时再扩展 FULLTEXT

**影响：** 不创建 FULLTEXT 索引。搜索不支持分词和相关性排序。

---

### D16: 购物车数量范围 1~99

**决策：** 购物车商品数量固定范围 1~99。加入购物车、修改数量、下单前均需校验。

**原因：**
- 防止恶意请求创建超大订单
- 99 已经覆盖所有合理购物场景
- 三重校验：Zod schema（Service 层）+ 前端 input max 属性 + 下单前二次校验

**影响：** `CartItem.quantity` 的 Zod schema 使用 `z.number().int().min(1).max(99)`。

---

### D17: 商品图片允许为空

**决策：** `imageUrls` 允许为空数组 `[]`。前端无图片时显示默认占位图。但 seed 数据必须尽量都有图片，保证演示效果。

**原因：**
- 后台新增商品时管理员可能暂时没有图片 URL
- 默认占位图保证前端不因缺少图片而布局错乱
- 面试演示时有真实图片效果更好

**影响：** 所有商品卡片渲染时判断 `imageUrls.length === 0` → 显示占位图。

---

### D18: MVP 不做部署

**决策：** 第一阶段不做 Vercel 部署。本地 MySQL + `npm run build` 通过即为完成标准。部署放到 README 扩展章节。

**原因：**
- MVP 目标是跑通功能 + 代码展示，不是上线
- 部署涉及环境变量、数据库连接字符串、SSL 等额外配置
- 本地运行对面试展示已经足够

**影响：** 无需配置 Vercel、无需生产环境变量、无需 CI/CD。

---

## 风险清单

| # | 风险 | 影响 | 对策 |
|----|------|------|------|
| R1 | 订单号随机码冲突 | 极低概率两个事务生成相同随机码 | `@unique` 约束 + 事务内重试（最多 3 次），冲突时重新生成 |
| R2 | 购物车商品在加入后被下架 | 下单时校验失败 | 下单时逐商品校验 `published = true`，已下架商品提示但不自动清除 |
| R3 | JWT 过期导致表单数据丢失 | 用户填写收货信息后提交时发现已过期 | 前端提交前验证登录状态（可选优化，MVP 优先级低） |
| R4 | 图片 URL 数组过大 | Json 字段存过多数据 | 前端限制最多 6 张，Zod schema 校验 `max(6)` |
| R5 | 下单事务中某商品库存不足 | 整个事务回滚，用户需重新操作 | 事务原子性保证。前端提示具体哪个商品库存不足 |
| R6 | 管理员下架正在被浏览的商品 | 用户加入购物车时校验失败 | 加入购物车时校验 `published = true` |
| R7 | 数据库中存储明文密码（人为错误） | 安全漏洞 | Service 层 `register()` 强制 bcryptjs 哈希，不允许绕过 |
| R8 | 取消订单时库存恢复失败 | 状态已改但库存未恢复 | 状态变更和库存恢复在同一事务内，原子保证 |

---

## 已确认的补充决策（Q1~Q6 用户已确认）

以下 6 项已由用户确认，已作为正式 ADR 写入本文档：

| # | 问题 | 确认结果 | 对应 ADR |
|---|------|---------|----------|
| Q1 | 订单取消后库存是否恢复？ | 恢复。仅 PENDING → CANCELLED，和状态变更同事务 | D13 |
| Q2 | 搜索用 LIKE 还是全文索引？ | MVP 用 LIKE（contains），匹配 name/sku/description | D15 |
| Q3 | 商品图片是否允许为空？ | 允许空数组，显示默认占位图。seed 要有图片 | D17 |
| Q4 | 购物车数量上限？ | 1~99，三重校验 | D16 |
| Q5 | orderNo 前缀 MM？ | 确认。改用随机码而非递增序号 | D14 |
| Q6 | 是否需要部署到 Vercel？ | MVP 不做部署，本地 build 通过即可 | D18 |

---

## 无待确认问题

以上 18 项关键决策（D1~D18）已全部确认，8 项风险已有明确对策。设计方案可以进入实施阶段。

---

*关联文档：[03-database.md](03-database.md) | [06-implementation-plan.md](06-implementation-plan.md)*
