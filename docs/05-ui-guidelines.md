# 05 — UI 设计规范

## 视觉定位

**方向：** 克制、专业、中性——像一个真实的电商系统而非模板 Demo。

**设计原则：**
- "专业感"来源于间距一致、对齐精准、状态覆盖完整
- 不经意的细节比刻意的装饰更有说服力
- 前台和后台用相同的设计语言但不同的信息密度（前台松弛、后台紧凑）

---

## 色彩系统

```
品牌色（Primary）:  #1A1A2E   深蓝黑 — 导航、主要操作按钮、侧边栏
强调色（Accent）:   #E94560   珊瑚红 — 价格、CTA 按钮、重要标记
成功色:             #16A34A   green-600 — 成功提示、PAID/SHIPPED 状态
警告色:             #D97706   amber-600 — 警告提示
错误色:             #DC2626   red-600 — 错误提示、CANCELLED 状态
中性色:              Slate 系列（slate-50 ~ slate-900）— 文字层级、边框、背景
前台背景:            #FAFAFA   近白色
后台背景:            #F1F5F9   slate-100
卡片背景:            #FFFFFF   白色
```

**设计决策：** 不选用常见的 warm cream / terracotta 组合，也不选用纯黑 + acid green。深蓝黑 + 珊瑚红的配对——深蓝给人信任感（适合电商），珊瑚红在 CTA 上有足够的视觉张力。

### Tailwind CSS 4 Theme 配置

```css
@import "tailwindcss";

@theme {
  --color-primary: #1A1A2E;
  --color-accent: #E94560;
  --color-primary-50: /* 手动定义色阶或使用 CSS color-mix() */;
}
```

---

## 字体

```css
--font-sans: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB",
             "Noto Sans CJK SC", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "Cascadia Code", "Fira Code", monospace;
```

**设计决策：** 电商系统字体最重要的是可读性和中英文混排兼容。PingFang SC + 系统字体栈是最安全方案。不引入 Web Font，避免加载开销和模板感。

### 字体规格

| 用途 | 大小 | 字重 | 行高 |
|------|------|------|------|
| 页面标题 (h1) | text-2xl ~ text-3xl | font-bold | leading-tight |
| 区块标题 (h2) | text-xl | font-semibold | leading-tight |
| 卡片标题 (h3) | text-base ~ text-lg | font-medium | leading-snug |
| 正文 | text-sm ~ text-base | font-normal | leading-relaxed |
| 辅助文字 | text-xs ~ text-sm | font-normal | leading-normal |
| 价格（强调） | text-lg ~ text-xl | font-bold | — |

---

## 布局

### 前台布局

```
┌──────────────────────────────────────────┐
│  Header (Logo + 搜索 + 购物车图标 + 用户)   │  h-16, sticky top-0, bg-white
├──────────────────────────────────────────┤
│                                          │
│  内容区（max-w-7xl, mx-auto, px-4, py-8） │
│                                          │
├──────────────────────────────────────────┤
│  Footer (简约：版权 + 链接)                 │  py-8, border-t
└──────────────────────────────────────────┘
```

### 后台布局

```
┌──────┬───────────────────────────────────┐
│      │  Admin Header (用户名 + 退出)       │  h-16
│      ├───────────────────────────────────┤
│ Side │                                   │
│ bar  │  内容区（px-6, py-6）              │
│ w-64 │                                   │
│      │                                   │
└──────┴───────────────────────────────────┘
```

- 侧边栏：固定宽度 256px，深色背景（primary），菜单项带 active 状态高亮
- 移动端：侧边栏改为可折叠抽屉

### 响应式断点

| 断点 | 宽度 | 布局变化 |
|------|------|---------|
| 默认（mobile-first） | < 640px | 单列，全宽卡片 |
| sm | ≥ 640px | 双列产品网格 |
| md | ≥ 768px | 三列产品网格，侧边栏固定显示 |
| lg | ≥ 1024px | 内容区最大宽度生效 |
| xl | ≥ 1280px | 四列产品网格 |

---

## 组件设计规范

### Button

```
变体：primary / secondary / danger / ghost
尺寸：sm (h-8) / md (h-10) / lg (h-12)
状态：default / hover / focus-visible (ring-2) / active / disabled (opacity-50)
```

- `primary`: bg-primary text-white, hover:bg-primary/90
- `accent/CTA`: bg-accent text-white, hover:bg-accent/90
- `secondary`: bg-white border border-slate-300 text-slate-700, hover:bg-slate-50
- `danger`: bg-red-600 text-white
- `ghost`: bg-transparent, hover:bg-slate-100
- 所有按钮最小触控区域 44×44px（移动端）

### Card

```
白底 (bg-white) + 1px 边框 (border border-slate-200)
rounded-lg (8px)
shadow-sm，hover 时 shadow-md
padding: p-4 ~ p-6
```

商品卡片额外：图片区（aspect-[4/3], object-cover）+ 信息区（名称截断 2 行、价格醒目）

### Input / Form

```
高度: h-10 (40px)
边框: border border-slate-300
focus: ring-2 ring-primary/20 border-primary
disabled: bg-slate-50 text-slate-400
error: border-red-500 ring-red-500/20
placeholder: text-slate-400
```

- label 放在 input 上方，font-medium
- 错误信息放在 input 下方，text-red-600 text-sm
- 表单组间距：gap-y-4
- Textarea：min-h-[120px]

### Badge

```
用于：订单状态、角色标签、上架/下架状态
样式：inline-flex, rounded-full, px-2.5 py-0.5, text-xs font-medium
```

| 状态/角色 | 颜色 |
|----------|------|
| PENDING | amber |
| PAID | blue |
| SHIPPED | purple |
| DELIVERED | green |
| CANCELLED | red |
| ADMIN | primary |
| USER | slate |
| 已上架 | green |
| 已下架 | slate |

### Modal

```
居中弹出 (fixed inset-0 flex items-center justify-center)
背景遮罩 (bg-black/50)
内容区 (bg-white rounded-lg shadow-xl max-w-md w-full mx-4)
ESC 关闭 + 点击遮罩关闭
focus trap（焦点锁在 modal 内）
```

### Pagination

```
样式：flex items-center gap-1
当前页：bg-primary text-white
其他页：hover:bg-slate-100
上一页/下一页：文字按钮 + disabled 状态
```

---

## 5 种必覆盖状态

每个页面/组件必须处理这 5 种状态。这是面试中最容易被注意到的细节：

| # | 状态 | 实现方式 |
|---|------|---------|
| **Loading** | 数据加载中 | 产品卡片骨架屏（animate-pulse），按钮 Spinner |
| **Empty** | 暂无数据 | "暂无数据" 文案 + 相关 CTA（如"去逛逛"） |
| **Error** | 加载/操作失败 | 错误信息 + 重试按钮（error.tsx 边界） |
| **Success** | 操作成功 | Toast 通知或页面内成功提示（如"下单成功"） |
| **Edge case** | 极端数据 | 超长名称截断（line-clamp-2）、极端价格、大量分页 |

### 具体页面的 Empty State

| 页面 | Empty 文案 | CTA |
|------|-----------|-----|
| 商品列表 | "暂无商品" | 管理员："去新增商品" |
| 搜索无结果 | "未找到相关商品" | "查看全部商品" |
| 购物车为空 | "购物车是空的" | "去逛逛" |
| 订单列表为空 | "暂无订单" | "去逛逛" |

---

## 避免的模板感

- ❌ Inter / Roboto 字体 → ✅ PingFang SC + 系统字体栈
- ❌ emoji 做图标 → ✅ 简洁 SVG icon（Heroicons 风格）
- ❌ 渐变按钮 → ✅ 纯色按钮 + 微妙 hover 变暗
- ❌ hero section with gradient background → ✅ 直接展示商品网格
- ❌ 过多分割线 → ✅ 用留白建立层次
- ❌ 商品图片大小不一 → ✅ 统一 4:3 宽高比，object-cover
- ❌ 表格无边距 → ✅ 表格有合理的 padding 和 hover 高亮行

---

## 无障碍（Accessibility）

- 所有交互元素可见 `focus-visible: ring-2 ring-primary/50` 焦点样式
- 表单错误使用 `aria-describedby` 关联错误信息
- Modal 打开时设置 `aria-modal="true"`，焦点锁定
- 图片有 `alt` 属性
- 按钮有明确的文本或 `aria-label`
- 移动端触控目标 ≥ 44×44px
- 颜色对比度满足 WCAG AA（文本 4.5:1，大文本 3:1）

---

## 性能相关 UI 策略

- 图片全部使用 `next/image`，配置 `remotePatterns`
- 产品列表使用 `loading.tsx`（骨架屏）+ Streaming SSR
- 搜索输入使用 `useTransition` 避免输入卡顿
- 购物车数量更新使用 `useOptimistic` 实现即时反馈

---

*关联文档：[01-project-overview.md](01-project-overview.md) | [06-implementation-plan.md](06-implementation-plan.md)*
