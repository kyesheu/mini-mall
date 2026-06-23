'use server'

import { getCurrentUser } from '@/server/auth/session'
import { addToCart as addToCartService } from '@/server/services/cart-service'
import { AppError, ValidationError, UnauthorizedError } from '@/lib/errors'
import { revalidatePath } from 'next/cache'

export async function addToCart(productId: number, quantity: number) {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError('请先登录')

  try {
    await addToCartService(user.id, productId, quantity)
    revalidatePath('/cart')
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) {
      return { error: e.message, fields: e.fields }
    }
    if (e instanceof AppError) {
      return { error: e.message }
    }
    throw e
  }
}
