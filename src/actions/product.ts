'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/server/auth/session'
import {
  createProduct as createProductService,
  updateProduct as updateProductService,
  togglePublish as togglePublishService,
} from '@/server/services/product-service'
import { AppError, ValidationError, ForbiddenError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')
  return user
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  try {
    const categoryId = formData.get('categoryId')
    const priceCents = formData.get('priceCents')
    const stock = formData.get('stock')
    const published = formData.get('published')
    const imageUrlsRaw = formData.get('imageUrls')

    let imageUrls: string[] = []
    if (typeof imageUrlsRaw === 'string' && imageUrlsRaw.trim()) {
      imageUrls = imageUrlsRaw.split('\n').map((u) => u.trim()).filter(Boolean)
    }

    await createProductService({
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      priceCents: Number(priceCents),
      imageUrls,
      stock: Number(stock),
      published: published === 'true' || published === 'on',
      categoryId: categoryId ? Number(categoryId) : null,
    })
    revalidatePath('/admin/products')
    revalidatePath('/products')
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}

export async function updateProduct(id: number, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  try {
    const data: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      if (key === 'priceCents' || key === 'stock') data[key] = Number(value)
      else if (key === 'published') data[key] = value === 'true' || value === 'on'
      else if (key === 'categoryId') data[key] = value ? Number(value) : null
      else if (key === 'imageUrls' && typeof value === 'string') {
        data[key] = value.split('\n').map((u) => u.trim()).filter(Boolean)
      }
      else data[key] = value
    }
    await updateProductService(id, data as Parameters<typeof updateProductService>[1])
    revalidatePath('/admin/products')
    revalidatePath('/products')
    revalidatePath(`/products/${formData.get('_slug')}`)
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) return { error: e.message, fields: e.fields }
    if (e instanceof AppError) return { error: e.message }
    throw e
  }
}

export async function togglePublish(id: number): Promise<ActionResult> {
  await requireAdmin()
  await togglePublishService(id)
  revalidatePath('/admin/products')
  revalidatePath('/products')
  return { success: true }
}
