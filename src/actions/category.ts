'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/server/auth/session'
import {
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
} from '@/server/services/category-service'
import { AppError, ValidationError, ForbiddenError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')
  return user
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  try {
    await createCategoryService({
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: (formData.get('description') as string) || null,
    })
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}

export async function updateCategory(id: number, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  try {
    await updateCategoryService(id, {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: (formData.get('description') as string) || null,
    })
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}
