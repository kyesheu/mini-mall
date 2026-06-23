import { prisma } from '@/server/db'
import { getCurrentUser } from '@/server/auth/session'
import { cartQuantitySchema } from '@/lib/validations'
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '@/lib/errors'

export async function addToCart(userId: number, productId: number, quantity: number) {
  const parsed = cartQuantitySchema.safeParse(quantity)
  if (!parsed.success) {
    throw new ValidationError('数量无效', { quantity: parsed.error.issues[0].message })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, published: true, stock: true, name: true },
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
