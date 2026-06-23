import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL environment variable is required')
const adapter = new PrismaMariaDb(databaseUrl)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================================
  // Users
  // ============================================================
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: adminPassword, name: '管理员', role: 'ADMIN' },
  })
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: { email: 'user@example.com', password: userPassword, name: '测试用户', role: 'USER' },
  })
  console.log('  ✅ Users created')

  // ============================================================
  // Categories
  // ============================================================
  const categories = [
    { name: '电子产品', slug: 'electronics', description: '手机、电脑、耳机等电子设备' },
    { name: '服装', slug: 'clothing', description: '男装、女装、配饰' },
    { name: '图书', slug: 'books', description: '小说、技术书籍、杂志' },
  ]

  const createdCategories: { id: number; name: string; slug: string }[] = []
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    createdCategories.push(c)
  }
  console.log('  ✅ Categories created')

  // ============================================================
  // Products (~20)
  // ============================================================
  const products = [
    // 电子产品 (7)
    { sku: 'ELEC-001', name: '无线蓝牙耳机 Pro', slug: 'wireless-bluetooth-earphones-pro', description: '主动降噪，40小时续航，IPX5防水', priceCents: 29990, imageUrls: ['https://picsum.photos/seed/p1/400/300', 'https://picsum.photos/seed/p1b/400/300'], stock: 150, categorySlug: 'electronics' },
    { sku: 'ELEC-002', name: 'USB-C 快充数据线 2米', slug: 'usb-c-fast-charging-cable-2m', description: '100W PD快充，编织材质，兼容所有USB-C设备', priceCents: 3990, imageUrls: ['https://picsum.photos/seed/p2/400/300'], stock: 500, categorySlug: 'electronics' },
    { sku: 'ELEC-003', name: '机械键盘 87键 青轴', slug: 'mechanical-keyboard-87-blue', description: 'RGB背光，全键无冲，Type-C可拆卸线', priceCents: 45990, imageUrls: ['https://picsum.photos/seed/p3/400/300', 'https://picsum.photos/seed/p3b/400/300', 'https://picsum.photos/seed/p3c/400/300'], stock: 80, categorySlug: 'electronics' },
    { sku: 'ELEC-004', name: '便携式蓝牙音箱', slug: 'portable-bluetooth-speaker', description: '360°环绕立体声，IPX7防水，20小时播放', priceCents: 19990, imageUrls: ['https://picsum.photos/seed/p4/400/300'], stock: 200, categorySlug: 'electronics' },
    { sku: 'ELEC-005', name: '27英寸 4K 显示器', slug: '27-inch-4k-monitor', description: 'IPS面板，HDR400，Type-C 65W供电', priceCents: 299900, imageUrls: ['https://picsum.photos/seed/p5/400/300'], stock: 30, categorySlug: 'electronics' },
    { sku: 'ELEC-006', name: '无线鼠标 静音版', slug: 'wireless-mouse-silent', description: '双模蓝牙/2.4G，人体工学设计，静音按键', priceCents: 9990, imageUrls: ['https://picsum.photos/seed/p6/400/300'], stock: 300, categorySlug: 'electronics' },
    { sku: 'ELEC-007', name: '手机三脚架自拍杆', slug: 'phone-tripod-selfie-stick', description: '铝合金材质，蓝牙遥控，360°旋转', priceCents: 7990, imageUrls: ['https://picsum.photos/seed/p7/400/300', 'https://picsum.photos/seed/p7b/400/300'], stock: 0, categorySlug: 'electronics' },

    // 服装 (7)
    { sku: 'CLTH-001', name: '纯棉圆领T恤 白色', slug: 'cotton-crew-neck-tee-white', description: '100%精梳棉，宽松版型，男女同款', priceCents: 7990, imageUrls: ['https://picsum.photos/seed/p8/400/300'], stock: 400, categorySlug: 'clothing' },
    { sku: 'CLTH-002', name: '修身牛仔裤 深蓝色', slug: 'slim-fit-jeans-dark-blue', description: '弹力棉混纺，修身剪裁，四季可穿', priceCents: 25990, imageUrls: ['https://picsum.photos/seed/p9/400/300'], stock: 120, categorySlug: 'clothing' },
    { sku: 'CLTH-003', name: '轻薄羽绒服 黑色', slug: 'lightweight-down-jacket-black', description: '90%白鹅绒填充，防风防水面料', priceCents: 59900, imageUrls: ['https://picsum.photos/seed/p10/400/300', 'https://picsum.photos/seed/p10b/400/300'], stock: 50, categorySlug: 'clothing' },
    { sku: 'CLTH-004', name: '运动跑步鞋 透气款', slug: 'running-shoes-breathable', description: 'EVA缓震中底，飞织鞋面，超轻设计', priceCents: 39990, imageUrls: ['https://picsum.photos/seed/p11/400/300'], stock: 90, categorySlug: 'clothing' },
    { sku: 'CLTH-005', name: '羊毛围巾 格纹款', slug: 'wool-scarf-checkered', description: '100%美利奴羊毛，柔软亲肤', priceCents: 12990, imageUrls: ['https://picsum.photos/seed/p12/400/300', 'https://picsum.photos/seed/p12b/400/300'], stock: 180, categorySlug: 'clothing' },
    { sku: 'CLTH-006', name: '帆布双肩包 复古绿', slug: 'canvas-backpack-vintage-green', description: '16L大容量，加厚肩垫，防泼水', priceCents: 16990, imageUrls: ['https://picsum.photos/seed/p13/400/300'], stock: 0, categorySlug: 'clothing' },
    { sku: 'CLTH-007', name: '防晒冰袖 两件装', slug: 'uv-protection-arm-sleeves-2pack', description: 'UPF50+，冰丝材质，透气速干', priceCents: 2990, imageUrls: ['https://picsum.photos/seed/p14/400/300'], stock: 600, categorySlug: 'clothing' },

    // 图书 (6)
    { sku: 'BOOK-001', name: 'JavaScript高级程序设计 第4版', slug: 'js-advanced-programming-4th', description: '前端开发者必读经典，全面覆盖ES2020+新特性', priceCents: 12990, imageUrls: ['https://picsum.photos/seed/p15/400/300'], stock: 250, categorySlug: 'books' },
    { sku: 'BOOK-002', name: '深入浅出设计模式', slug: 'head-first-design-patterns-cn', description: '用通俗易懂的方式讲解23种经典设计模式', priceCents: 7990, imageUrls: ['https://picsum.photos/seed/p16/400/300'], stock: 180, categorySlug: 'books' },
    { sku: 'BOOK-003', name: '算法导论 原书第4版', slug: 'introduction-to-algorithms-4th', description: '计算机科学经典教材，MIT算法课程指定用书', priceCents: 18990, imageUrls: ['https://picsum.photos/seed/p17/400/300', 'https://picsum.photos/seed/p17b/400/300'], stock: 60, categorySlug: 'books' },
    { sku: 'BOOK-004', name: '三体 全集', slug: 'three-body-trilogy', description: '刘慈欣科幻巨著，雨果奖获奖作品', priceCents: 9990, imageUrls: ['https://picsum.photos/seed/p18/400/300'], stock: 400, categorySlug: 'books' },
    { sku: 'BOOK-005', name: 'React 设计原理', slug: 'react-design-principles', description: '深入React内部机制，从源码层面理解框架设计', priceCents: 10990, imageUrls: ['https://picsum.photos/seed/p19/400/300'], stock: 100, categorySlug: 'books' },
    { sku: 'BOOK-006', name: 'Node.js 实战 第2版', slug: 'nodejs-in-action-2nd', description: '从零构建全栈应用，涵盖Express、Koa、NestJS', priceCents: 8990, imageUrls: ['https://picsum.photos/seed/p20/400/300'], stock: 140, categorySlug: 'books' },
  ]

  const categoryMap = new Map(createdCategories.map((c) => [c.slug, c.id]))

  for (const p of products) {
    const categoryId = categoryMap.get(p.categorySlug) ?? null
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        imageUrls: p.imageUrls,
        stock: p.stock,
        published: true,
        categoryId,
      },
    })
  }
  console.log(`  ✅ ${products.length} products created`)

  // ============================================================
  // Sample orders (2)
  // ============================================================
  const electronics = await prisma.product.findFirst({ where: { slug: 'wireless-bluetooth-earphones-pro' } })
  const cable = await prisma.product.findFirst({ where: { slug: 'usb-c-fast-charging-cable-2m' } })
  const tee = await prisma.product.findFirst({ where: { slug: 'cotton-crew-neck-tee-white' } })
  const jeans = await prisma.product.findFirst({ where: { slug: 'slim-fit-jeans-dark-blue' } })
  const book = await prisma.product.findFirst({ where: { slug: 'three-body-trilogy' } })

  if (electronics && cable && tee) {
    const order1Total = electronics.priceCents * 1 + cable.priceCents * 2
    await prisma.order.create({
      data: {
        orderNo: 'MM20260623SEED0001',
        userId: user.id,
        status: 'PAID',
        totalCents: order1Total,
        receiverName: '张三',
        receiverPhone: '13800138000',
        shippingAddress: '北京市朝阳区建国路100号',
        items: {
          create: [
            {
              productId: electronics.id,
              productName: electronics.name,
              productSku: electronics.sku,
              productSlug: electronics.slug,
              productImageUrl: (electronics.imageUrls as string[])[0] ?? null,
              unitPriceCents: electronics.priceCents,
              quantity: 1,
              subtotalCents: electronics.priceCents * 1,
            },
            {
              productId: cable.id,
              productName: cable.name,
              productSku: cable.sku,
              productSlug: cable.slug,
              productImageUrl: (cable.imageUrls as string[])[0] ?? null,
              unitPriceCents: cable.priceCents,
              quantity: 2,
              subtotalCents: cable.priceCents * 2,
            },
          ],
        },
      },
    })
    console.log('  ✅ Order 1 (PAID) created')
  }

  if (tee && jeans && book) {
    const order2Total = tee.priceCents * 2 + jeans.priceCents * 1 + book.priceCents * 1
    await prisma.order.create({
      data: {
        orderNo: 'MM20260623SEED0002',
        userId: user.id,
        status: 'PENDING',
        totalCents: order2Total,
        receiverName: '张三',
        receiverPhone: '13800138000',
        shippingAddress: '北京市朝阳区建国路100号',
        items: {
          create: [
            {
              productId: tee.id,
              productName: tee.name,
              productSku: tee.sku,
              productSlug: tee.slug,
              productImageUrl: (tee.imageUrls as string[])[0] ?? null,
              unitPriceCents: tee.priceCents,
              quantity: 2,
              subtotalCents: tee.priceCents * 2,
            },
            {
              productId: jeans.id,
              productName: jeans.name,
              productSku: jeans.sku,
              productSlug: jeans.slug,
              productImageUrl: (jeans.imageUrls as string[])[0] ?? null,
              unitPriceCents: jeans.priceCents,
              quantity: 1,
              subtotalCents: jeans.priceCents * 1,
            },
            {
              productId: book.id,
              productName: book.name,
              productSku: book.sku,
              productSlug: book.slug,
              productImageUrl: (book.imageUrls as string[])[0] ?? null,
              unitPriceCents: book.priceCents,
              quantity: 1,
              subtotalCents: book.priceCents * 1,
            },
          ],
        },
      },
    })
    console.log('  ✅ Order 2 (PENDING) created')
  }

  console.log('\n🎉 Seed complete!')
  console.log('  Admin: admin@example.com / admin123')
  console.log('  User:  user@example.com / user123')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
