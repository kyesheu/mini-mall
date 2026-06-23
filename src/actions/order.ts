'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/server/auth/session'
import {
  createOrder as createOrderService,
  cancelOrder as cancelOrderService,
  payOrder as payOrderService,
} from '@/server/services/order-service'
import { AppError, ValidationError, UnauthorizedError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError('请先登录')
  return user
}

export async function createOrder(
  formData: FormData,
): Promise<ActionResult & { orderId?: number }> {
  const user = await requireUser()
  try {
    const order = await createOrderService(user.id, {
      receiverName: formData.get('receiverName') as string,
      receiverPhone: formData.get('receiverPhone') as string,
      shippingAddress: formData.get('shippingAddress') as string,
    })
    revalidatePath('/orders')
    revalidatePath('/cart')
    return { success: true, orderId: order.id }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}

export async function cancelOrder(orderId: number): Promise<ActionResult> {
  const user = await requireUser()
  try {
    await cancelOrderService(user.id, orderId)
    revalidatePath('/orders')
    return { success: true }
  } catch (e) {
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}

export async function payOrder(orderId: number): Promise<ActionResult> {
  const user = await requireUser()
  try {
    await payOrderService(user.id, orderId)
    revalidatePath('/orders')
    return { success: true }
  } catch (e) {
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}
