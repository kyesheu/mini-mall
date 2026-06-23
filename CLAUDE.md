# Mini Mall

这是一个微型电商 MVP。

目标：做一个能跑起来、架构清楚、代码干净、方便讲解的全栈项目。

技术栈：

- Next.js
- TypeScript
- Prisma
- MySQL 8
- Tailwind CSS
- JWT + httpOnly Cookie
- bcryptjs
- Zod

## 文档入口

详细设计以 `docs/` 为准：

- `docs/01-spec.md`：项目规格、MVP 范围、关键决策、风险清单
- `docs/02-architecture.md`：分层架构、Action/Service 设计、UI 规范
- `docs/03-database.md`：Prisma Schema、领域模型、订单状态机
- `docs/04-implementation-plan.md`：12 步实施顺序与验证命令
- `docs/05-test-and-release.md`：测试用例、冒烟测试、发布与回滚策略

执行任务前，先读取相关文档，不要凭记忆修改架构、数据库或业务规则。

## MVP 边界

第一版不做：

- API Routes
- 真实支付
- 会员
- 优惠券
- Redis
- MQ
- 多语言
- 图片上传
- 商品真删除
- 分类删除
- 生产部署

## 硬规则

- 数据库使用 MySQL 8。
- 金额全部用整数分单位，例如 `priceCents`、`totalCents`。
- Prisma 只能出现在 `src/server/db.ts` 和 `src/server/services/*`。
- Server Component 和 Server Action 只能调用 Service，不能直接访问 Prisma。
- Service 层负责业务规则、权限校验、Zod 校验和事务。
- Server Action 只负责接收输入、调用 Service、处理错误、执行 `revalidatePath()`。
- 不使用旧 `middleware.ts`，如需路由保护使用 `src/proxy.ts`。
- 权限判断以 `getCurrentUser()` 为准，不信任 proxy headers。
- 商品不真删除，只能下架。
- OrderItem 必须保存商品快照。
- 下单必须使用事务和条件扣库存。
- 取消订单只允许 `PENDING -> CANCELLED`，并在事务中恢复库存。
- 一个可验证功能完成后，优先使用 `git-commit-standard` 生成 Conventional Commits，并提交到当前 feature branch；一组相关功能完成且验证通过后，再确认是否 merge 到 `main`。

## 开发流程

按 `docs/04-implementation-plan.md` 分阶段实现。

每次只做一个阶段。

每完成一个阶段：

1. 停下来说明改了什么
2. 展示变更文件
3. 运行对应验证命令
4. 等我确认后再继续下一阶段
