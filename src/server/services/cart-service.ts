import { cache } from 'react'
import { prisma } from '@/server/db'
import { cartQuantitySchema } from '@/lib/validations'
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '@/lib/errors'

const cartInclude = {
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
}

// ============================================================
// Read methods (React.cache() wrapped)
// ============================================================

export const getCartItems = cache(async (userId: number) => {
  return prisma.cartItem.findMany({
    where: { userId },
    include: cartInclude,
    orderBy: { createdAt: 'desc' },
  })
})

// ============================================================
// Write methods (NO React.cache())
// ============================================================

export async function addToCart(userId: number, productId: number, quantity: number) {
  const parsed = cartQuantitySchema.safeParse(quantity)
  if (!parsed.success) {
    throw new ValidationError('数量无效', { quantity: parsed.error.issues[0].message })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, published: true, stock: true },
  })
  if (!product) throw new NotFoundError('商品不存在')
  if (!product.published) throw new ConflictError('该商品已下架')
  if (product.stock < parsed.data) throw new ConflictError('库存不足')

  return prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, quantity: parsed.data },
    update: { quantity: { increment: parsed.data } },
  })
}

export async function updateCartItem(cartItemId: number, userId: number, quantity: number) {
  const parsed = cartQuantitySchema.safeParse(quantity)
  if (!parsed.success) {
    throw new ValidationError('数量无效', { quantity: parsed.error.issues[0].message })
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: { select: { stock: true, published: true } } },
  })
  if (!item) throw new NotFoundError('购物车商品不存在')
  if (item.userId !== userId) throw new ForbiddenError('无权操作')
  if (!item.product.published) throw new ConflictError('商品已下架，无法修改数量')

  if (parsed.data > item.product.stock) {
    throw new ConflictError('库存不足')
  }

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: parsed.data },
  })
}

export async function removeFromCart(cartItemId: number, userId: number) {
  const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } })
  if (!item) throw new NotFoundError('购物车商品不存在')
  if (item.userId !== userId) throw new ForbiddenError('无权操作')

  return prisma.cartItem.delete({ where: { id: cartItemId } })
}
