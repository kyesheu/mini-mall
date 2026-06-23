'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/server/auth/session'
import { updateOrderStatus as updateOrderStatusService } from '@/server/services/order-service'
import { AppError, ForbiddenError } from '@/lib/errors'
import type { ActionResult } from '@/types'
import type { OrderStatus } from '@/generated/client'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')
  return user
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
): Promise<ActionResult> {
  await requireAdmin()
  try {
    await updateOrderStatusService(orderId, status)
    revalidatePath('/admin/orders')
    revalidatePath('/orders')
    return { success: true }
  } catch (e) {
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}
