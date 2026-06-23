import { cache } from 'react'
import { prisma } from '@/server/db'
import { getCurrentUser } from '@/server/auth/session'
import { createOrderSchema } from '@/lib/validations'
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '@/lib/errors'
import { ORDER_STATUS_TRANSITIONS } from '@/lib/constants'
import type { CreateOrderInput } from '@/lib/validations'
import type { OrderStatus } from '@/generated/client'

// ============================================================
// Helpers
// ============================================================

function generateOrderNo(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let random = ''
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `MM${y}${m}${d}${random}`
}

function validateStatusTransition(
  current: string,
  target: string,
): void {
  const allowed = ORDER_STATUS_TRANSITIONS[current]
  if (!allowed || !allowed.includes(target)) {
    throw new ConflictError(
      `不允许从 ${current} 变更为 ${target}`,
    )
  }
}

// ============================================================
// Read methods
// ============================================================

export const getOrders = cache(async (userId: number) => {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })
})

export const getOrderById = cache(async (orderId: number) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
})

export const getOrdersAdmin = cache(async () => {
  return prisma.order.findMany({
    include: { items: true, user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
})

// ============================================================
// createOrder — full transaction
// ============================================================

export async function createOrder(userId: number, input: CreateOrderInput) {
  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fields[issue.path.join('.')] = issue.message
    }
    throw new ValidationError('收货信息校验失败', fields)
  }
  const { receiverName, receiverPhone, shippingAddress } = parsed.data

  return prisma.$transaction(async (tx) => {
    // ① 查询购物车（含商品）
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            slug: true,
            priceCents: true,
            imageUrls: true,
            stock: true,
            published: true,
          },
        },
      },
    })

    // ② 校验非空
    if (cartItems.length === 0) {
      throw new ValidationError('购物车为空')
    }

    // ③④ 逐商品校验
    for (const ci of cartItems) {
      if (!ci.product.published) {
        throw new ConflictError(`商品 "${ci.product.name}" 已下架，请先删除`)
      }
      if (ci.quantity > ci.product.stock) {
        throw new ConflictError(`商品 "${ci.product.name}" 库存不足`)
      }
    }

    // ⑤⑥ 生成 orderNo，计算 totalCents
    const orderNo = generateOrderNo()
    const totalCents = cartItems.reduce(
      (sum, ci) => sum + ci.product.priceCents * ci.quantity,
      0,
    )

    // ⑦ 创建 Order
    const order = await tx.order.create({
      data: {
        orderNo,
        userId,
        totalCents,
        receiverName,
        receiverPhone,
        shippingAddress,
      },
    })

    // ⑧ 创建 OrderItem 快照
    for (const ci of cartItems) {
      const imageUrls = ci.product.imageUrls as string[]
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: ci.product.id,
          productName: ci.product.name,
          productSku: ci.product.sku,
          productSlug: ci.product.slug,
          productImageUrl: imageUrls.length > 0 ? imageUrls[0] : null,
          unitPriceCents: ci.product.priceCents,
          quantity: ci.quantity,
          subtotalCents: ci.product.priceCents * ci.quantity,
        },
      })
    }

    // ⑨⑩ 扣减库存（条件更新）
    for (const ci of cartItems) {
      const result = await tx.product.updateMany({
        where: {
          id: ci.product.id,
          stock: { gte: ci.quantity },
        },
        data: {
          stock: { decrement: ci.quantity },
        },
      })
      if (result.count === 0) {
        throw new ConflictError(`商品 "${ci.product.name}" 库存不足`)
      }
    }

    // ⑪ 清空购物车
    await tx.cartItem.deleteMany({ where: { userId } })

    return order
  })
}

// ============================================================
// cancelOrder — PENDING only, restore stock in transaction
// ============================================================

export async function cancelOrder(userId: number, orderId: number) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) throw new NotFoundError('订单不存在')
    if (order.userId !== userId) throw new ForbiddenError('无权操作')

    validateStatusTransition(order.status, 'CANCELLED')

    // Update status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    })

    // Restore stock for each item
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
  })
}

// ============================================================
// payOrder — PENDING → PAID (Step 9, placed here for completeness)
// ============================================================

export async function payOrder(userId: number, orderId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new NotFoundError('订单不存在')
  if (order.userId !== userId) throw new ForbiddenError('无权操作')

  validateStatusTransition(order.status, 'PAID')

  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID' },
  })
}

// ============================================================
// updateOrderStatus — admin only, validates transitions
// ============================================================

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new NotFoundError('订单不存在')

  validateStatusTransition(order.status, status)

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  })
}
