'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/server/auth/session'
import {
  addToCart as addToCartService,
  updateCartItem as updateCartItemService,
  removeFromCart as removeFromCartService,
} from '@/server/services/cart-service'
import { AppError, ValidationError, UnauthorizedError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError('请先登录')
  return user
}

export async function addToCart(
  productId: number,
  quantity: number,
): Promise<ActionResult> {
  try {
    const user = await requireUser()
    await addToCartService(user.id, productId, quantity)
    revalidatePath('/cart')
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number,
): Promise<ActionResult> {
  try {
    const user = await requireUser()
    await updateCartItemService(cartItemId, user.id, quantity)
    revalidatePath('/cart')
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}

export async function removeFromCart(cartItemId: number): Promise<ActionResult> {
  try {
    const user = await requireUser()
    await removeFromCartService(cartItemId, user.id)
    revalidatePath('/cart')
    return { success: true }
  } catch (e) {
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}
