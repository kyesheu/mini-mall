# 10 — 测试、发布与回滚策略

本文档描述 Mini Mall 的测试与发布流程设计。当前项目处于本地开发阶段，未部署到生产环境；本文策略为工程化设计，可在面试中讲解。

---

## 1. 分支工作流

采用 **Trunk-Based Development**（简化版）：

```
main
  ├── feature/auth          # 认证系统
  ├── feature/products      # 商品浏览
  ├── feature/cart          # 购物车
  ├── feature/orders        # 下单
  ├── feature/admin         # 后台管理
  ├── feature/polish        # 状态覆盖+收尾
  ├── fix/auth-navigation   # 缺陷修复
  └── docs/test-and-release # 文档
```

**规则：**
- `main` 始终保持可构建、可运行
- 每个功能在独立 `feature/*` 或 `fix/*` 分支开发
- 功能完成并通过验证后合并到 `main`
- 不直接在 `main` 上提交业务代码
- 每次合并前执行以下检查（见第 2 节）

### 合并到 main 的流程

```
feature 分支 → 本地验证 → merge 到 main → 冒烟测试 → 推送远程
```

---

## 2. 合并前检查（Pre-merge Checklist）

每次将功能分支合并到 `main` 之前，必须全部通过：

| # | 检查项 | 命令 |
|---|--------|------|
| 1 | Prisma Schema 校验 | `npm run prisma:validate` |
| 2 | TypeScript 类型检查 | `npx tsc --noEmit` |
| 3 | 生产构建 | `npm run build` |
| 4 | Lint 检查（如有 script） | `npm run lint`（如果 `package.json` 中存在，则要求 0 errors） |
| 5 | Working tree clean | `git status --short` 无输出 |

> **说明：** 如果 `package.json` 中不存在 `lint` script，则以 `npx tsc --noEmit` 和 `npm run build` 通过为最低标准。Mini Mall 当前已配置 `eslint`，lint 为强制检查项。

如果功能分支涉及数据库 Schema 变更，还需额外检查：

| # | 检查项 |
|---|--------|
| 6 | 迁移文件已生成且可回滚 |
| 7 | Seed 数据与迁移兼容 |

### 当前项目状态

Mini Mall 的分层架构（Server Component / Server Action → Service → Prisma）天然支持这个流程：Service 层是纯 TypeScript，不需要数据库就能进行类型检查；`npm run build` 会执行 TypeScript 编译和 Next.js 生产构建，捕捉所有类型和导入错误。

---

## 3. 冒烟测试（Smoke Test）

详见 [09-smoke-test-checklist.md](09-smoke-test-checklist.md)，18 条 P0 用例约 20~30 分钟可执行完成。

**执行时机：**
- 每次合并到 `main` 之后
- 部署到 staging 环境之后
- 生产部署之后

**通过标准：** 18 条全部通过。任一失败则阻塞发布。

---

## 4. 回归测试（Regression Test）

完整测试用例见 [08-test-cases.md](08-test-cases.md)，76 条用例覆盖 14 个模块。

**执行时机：**
- 每个功能分支合并前（选取关联模块的用例）
- 大版本发布前（执行全部 76 条）

**当前项目推荐：** 因 MVP 无自动化测试，回归测试为手动执行。按模块优先级选择：
1. 认证（AUTH，7 条）
2. 下单（ORDER，14 条含支付+取消）
3. 购物车（CART，11 条）
4. 后台管理（ADM*，16 条含商品/分类/状态）

---

## 5. 探索测试（Exploratory Testing）

在手动回归测试之外，增加 15 分钟的探索测试，自由操作，尝试发现：

- 异常输入（超长文本、特殊字符、负数、SQL 注入尝试）
- 快速连续点击（重复提交表单）
- 浏览器前进/后退
- 多标签页同时操作
- Cookie 清除后的行为
- 直接在地址栏输入路由

**目标：** 发现测试用例未覆盖的边界问题。

---

## 6. Staging / 预发环境设计

### 当前阶段

Mini Mall 当前仅在本地开发环境运行，未部署到 staging 或生产环境。

### 设计的 staging 方案

```
本地开发（localhost）→ Staging 环境 → 生产环境
```

**Staging 环境配置：**

| 项目 | 配置 |
|------|------|
| 部署平台 | Vercel（Preview Deployment）或自有服务器 |
| 数据库 | 独立 MySQL 实例，与生产隔离 |
| 域名 | `mini-mall-staging.vercel.app` |
| 环境变量 | `JWT_SECRET` 独立生成，`DATABASE_URL` 指向 staging DB |
| 种子数据 | 与生产一致的匿名化种子数据 |
| 访问控制 | 仅开发团队可访问（Vercel 支持密码保护） |

**Staging 验证流程：**
1. 合并到 `main` 后自动部署到 staging（Vercel Git integration）
2. 执行冒烟测试 18 条
3. 执行回归测试（关联模块）
4. 探索测试 15 分钟
5. 全部通过后，手动触发生产部署

### Vercel Serverless + MySQL 注意事项

Next.js 部署到 Vercel 后运行在 serverless 环境中，需关注数据库连接数：

- **问题：** Serverless 函数按需启动，每次冷启动创建新数据库连接。高并发时可能耗尽 MySQL `max_connections`（默认 151）
- **方案一（推荐）：** 使用 Prisma Accelerate 或类似托管连接池，统一管理 serverless 函数到 MySQL 的连接
- **方案二：** 使用 MySQL 连接池中间件（如 `PgBouncer` for MySQL），部署在固定 IP 的服务器上，所有 serverless 函数通过连接池访问数据库
- **方案三：** 在 Prisma Client 中配置 `connection_limit`（通过 MariaDB adapter 的 `connectionLimit` 参数），限制每个函数实例的连接数
- **Mini Mall 当前：** 开发阶段使用 `PrismaMariaDb(databaseUrl)` 直连 MySQL，单用户无连接池压力。部署到 Vercel 前需评估并发量并选择上述方案之一

---

## 7. 灰度发布方案（设计）

> 当前项目未实施，此为设计方案，适合面试讲解。

### 蓝绿部署（Blue-Green）

```
Blue 环境（当前生产）──→ 用户流量
Green 环境（新版本）  ──→ 验证通过后切换流量
```

### 金丝雀发布（Canary）

1. 部署新版本到少量实例
2. 先切 5% 流量到新版本
3. 监控错误率、响应时间
4. 逐步扩大到 25% → 50% → 100%
5. 出现问题立即回滚

### Mini Mall 的简化方案

因为 Mini Mall 是单体应用 + MySQL，推荐使用 Vercel 的 Preview Deployment 作为可灰度验证的基础：

1. 每个 PR / 分支自动生成 Preview URL
2. Preview 环境连接 staging 数据库
3. 团队成员验证 Preview 环境
4. 验证通过后合并到 `main` 触发生产部署
5. 生产部署后执行冒烟测试确认

---

## 8. 监控指标

### 应用级指标

| 指标 | 含义 | 获取方式 |
|------|------|---------|
| 错误率 | 500 / 4xx 请求占比 | Vercel Analytics / 日志 |
| 响应时间 (p95) | 95% 请求在多少毫秒内完成 | Vercel Analytics |
| 下单成功率 | 下单成功数 / 下单请求数 | 数据库查询 `Order` 表 |
| 库存异常 | 出现负库存的次数 | 数据库约束检查 |
| 登录失败率 | 登录失败 / 登录尝试 | 日志或 Metrics endpoint |

### 业务级指标（简要）

| 指标 | SQL 示例 |
|------|---------|
| 日订单量 | `SELECT COUNT(*) FROM \`Order\` WHERE DATE(createdAt) = CURDATE()` |
| 日销售额 | `SELECT SUM(totalCents) FROM \`Order\` WHERE status IN ('PAID','SHIPPED','DELIVERED') AND DATE(createdAt) = CURDATE()` |
| 待处理订单数 | `SELECT COUNT(*) FROM \`Order\` WHERE status IN ('PENDING','PAID')` |

### 告警规则（设计）

| 告警 | 条件 | 通知方式 |
|------|------|---------|
| 服务宕机 | 健康检查连续 3 次失败 | 邮件 / 即时通讯 |
| 错误率飙升 | 5 分钟内错误率 > 5% | 即时通讯 |
| 库存异常 | `stock < 0` 出现 | 即时通讯 |
| 构建失败 | `npm run build` exit ≠ 0 | CI 通知 |

---

## 9. 回滚策略

### 代码回滚

```bash
# Vercel: 在 Dashboard 点击上一次成功的 Deployment → "Promote to Production"
# 或通过 CLI:
vercel rollback

# 手动回滚（非 Vercel）:
git revert <bad-commit>
git push origin main
```

### 数据库回滚

Prisma migration 不提供自动回滚命令。回滚需要提前准备：

- **每个 migration 必须提前编写对应的 rollback SQL**，在执行 `prisma migrate dev` 前通过 `prisma migrate diff` 生成回滚脚本，与 migration SQL 一并存档
- **破坏性迁移（DROP TABLE / DROP COLUMN / 修改字段类型）：**
  1. 先部署兼容旧 Schema 的应用代码
  2. 确认无流量命中旧字段后再执行迁移
  3. 保留回滚窗口（至少 24 小时）
- **紧急回滚流程：**
  1. `git revert` 回滚 migration 文件
  2. 手动执行预先准备的 rollback SQL
  3. 验证数据完整性

Mini Mall 的 migration 文件位于 `prisma/migrations/`，每次 `prisma migrate dev` 前应生成对应的 rollback SQL 并纳入版本管理。

### 数据恢复

- MySQL 每日备份策略：`mysqldump` + 定时任务
- 恢复流程：从备份恢复 → 应用 migration 到目标版本

---

## 10. Mini Mall 简化落地方案

当前项目处于 MVP 阶段，实际落地策略：

| 阶段 | 内容 | 状态 |
|------|------|------|
| **本地开发** | 功能分支开发 → 合并前验证 → merge main | ✅ 已执行 |
| **质量保障** | lint + tsc + build + 手动冒烟测试 | ✅ 已定义 (18 条) |
| **文档** | 8 份设计文档 + 测试用例 + 发布策略 | ✅ 已完成 |
| **Staging** | Vercel Preview Deployment（计划） | 📋 后续 |
| **生产部署** | Vercel + 独立 MySQL 实例（计划） | 📋 后续 |
| **监控告警** | 基础健康检查 + 错误率 | 📋 后续 |
| **CI/CD** | GitHub Actions + Vercel Git Integration | 📋 后续 |

### 最低发布标准

满足以下条件即可认为当前版本可以发布：

1. `npm run lint` — 0 errors（当前项目已配置，如未配置则以 tsc + build 为准）
2. `npx tsc --noEmit` — 零错误
3. `npm run build` — 编译成功
4. 18 条冒烟测试全部通过
5. 所有 feature 分支已合并到 `main`
6. 文档齐全（10 份）

---

## 11. 简历 / 面试可讲述版本

### 30 秒版本

> Mini Mall 是我用 Next.js 16 + TypeScript + Prisma + MySQL 8 做的全栈电商 MVP。我设计了完整的分层架构（Service → Action → Component），实现了 JWT 认证、购物车、下单事务（含库存防超卖和商品快照）、订单状态机和后台管理。我定义了 76 条手动测试用例和 18 条 P0 冒烟测试，设计了 staging 预发、灰度发布和回滚方案，并制定了合并前验证清单确保 main 分支始终可构建。

### 按话题展开

**架构设计：** "前后端分层：Server Component 读数据、Server Action 处理表单、Service 层做业务逻辑和 Zod 校验、Prisma 只出现在 db.ts 和 services。这个约束保证了每一层都能独立测试和替换。"

**发布策略：** "我为项目设计了 Trunk-Based Development 分支工作流，每次合并前执行 5 项验证（Prisma validate + tsc + lint + build + clean tree），定义了 18 条 P0 冒烟测试覆盖核心流程。生产部署上设计了蓝绿部署和金丝雀发布方案，以及数据库回滚策略。"

**库存防超卖：** "下单在 Prisma 事务内用条件更新 `UPDATE ... WHERE stock >= quantity` 扣库存，MySQL InnoDB 行级锁保证当前读，并发下只有一个事务能成功满足条件。条件更新相比显式 `SELECT ... FOR UPDATE` 降低了锁复杂度，但仍需关注事务内操作顺序、死锁重试机制和数据库死锁监控。取消 PENDING 订单时在同一事务内恢复库存，避免状态不一致。"

**测试体系：** "我按模块拆分了 76 条手动测试用例，覆盖正常流程和异常场景（未登录重定向、角色权限、库存不足、已下架商品、状态机非法转换）。从中提炼了 18 条 P0 冒烟测试，覆盖从注册到下单再到取消的完整核心流程，执行只需 20 分钟。"

---

*关联文档：[08-test-cases.md](08-test-cases.md) | [09-smoke-test-checklist.md](09-smoke-test-checklist.md)*
