# 04 — 实施计划

## 12 步实施顺序

| 步骤 | 内容 | 交付物 | 状态 |
|------|------|--------|------|
| 1 | 安装依赖 + 环境配置 | Prisma, jose, bcryptjs, zod | ✅ |
| 2 | Prisma Schema + 迁移 + Seed | schema.prisma, migrations/, seed.ts | ✅ |
| 3 | 基础设施 | db.ts, errors, validations, utils, constants, types | ✅ |
| 4 | 认证系统 | jwt, password, session, auth-service, 登录/注册页面 | ✅ |
| 5 | proxy.ts 路由保护 | src/proxy.ts | ✅ |
| 6 | 商品浏览 | product-service, category-service, 列表/详情/分类页面 | ✅ |
| 7 | 购物车 | cart-service, actions/cart, 购物车页面 | ✅ |
| 8 | 下单 | order-service, actions/order, 结账/订单详情 | ✅ |
| 9 | 模拟支付 + 取消订单 | 支付/取消 Action | ✅ |
| 10 | 后台管理 | admin-service, Dashboard, 商品/分类/订单管理 | ✅ |
| 11 | 状态覆盖 | loading.tsx, error.tsx, empty state | ✅ |
| 12 | 收尾 | lint, tsc, build, README | ✅ |

## 验证命令

```bash
npm run prisma:validate   # Schema 校验
npx tsc --noEmit          # TypeScript 检查
npm run lint              # ESLint
npm run build             # 生产构建
npm run prisma:seed       # 重新填充种子数据
```

## 后续维护流程

1. 从 `main` 创建 `feature/*` 或 `fix/*` 分支
2. 开发完成后运行验证命令
3. 合并到 `main` 前执行冒烟测试（见 [05-test-and-release.md](05-test-and-release.md)）
4. 手动 push

---

*关联文档：[01-spec.md](01-spec.md) | [02-architecture.md](02-architecture.md)*
