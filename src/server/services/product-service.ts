import { cache } from 'react'
import { prisma } from '@/server/db'
import { buildPagination, slugify } from '@/lib/utils'
import { productCreateSchema, productUpdateSchema } from '@/lib/validations'
import { getCurrentUser } from '@/server/auth/session'
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors'
import type { ProductCreateInput, ProductUpdateInput } from '@/lib/validations'
import { PAGE_SIZE } from '@/lib/constants'

// ============================================================
// Read methods (React.cache() wrapped)
// ============================================================

export const getProductList = cache(async (params: {
  page?: number
  categoryId?: number
  q?: string
  sort?: string
}) => {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = PAGE_SIZE

    const where: Record<string, unknown> = { published: true }

    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    if (params.q) {
      where.OR = [
        { name: { contains: params.q } },
        { sku: { contains: params.q } },
        { description: { contains: params.q } },
      ]
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (params.sort === 'price_asc') orderBy = { priceCents: 'asc' }
    if (params.sort === 'price_desc') orderBy = { priceCents: 'desc' }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ])

    return { items, ...buildPagination(total, page, pageSize) }
  },
)

export const getProductBySlug = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug, published: true },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
  return product
})

// ============================================================
// Write methods (NO React.cache())
// ============================================================

export async function createProduct(input: ProductCreateInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')

  const parsed = productCreateSchema.safeParse(input)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fields[issue.path.join('.')] = issue.message
    }
    throw new ValidationError('商品信息校验失败', fields)
  }

  const data = parsed.data
  const slug = slugify(data.name)

  return prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      slug,
      description: data.description,
      priceCents: data.priceCents,
      imageUrls: data.imageUrls ?? [],
      stock: data.stock,
      published: data.published,
      categoryId: data.categoryId ?? null,
    },
  })
}

export async function updateProduct(id: number, input: ProductUpdateInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')

  const parsed = productUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fields[issue.path.join('.')] = issue.message
    }
    throw new ValidationError('商品信息校验失败', fields)
  }

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('商品不存在')

  const data = parsed.data
  const slug = data.name ? slugify(data.name) : undefined

  return prisma.product.update({
    where: { id },
    data: {
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.name !== undefined && { name: data.name }),
      ...(slug !== undefined && { slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
      ...(data.imageUrls !== undefined && { imageUrls: data.imageUrls }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
    },
  })
}

export async function togglePublish(id: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new NotFoundError('商品不存在')

  return prisma.product.update({
    where: { id },
    data: { published: !product.published },
  })
}

// Admin: get all products including unpublished
export const getProductListAdmin = cache(async (params: {
  page?: number
  categoryId?: number
  q?: string
}) => {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = PAGE_SIZE

    const where: Record<string, unknown> = {}
    if (params.categoryId) where.categoryId = params.categoryId
    if (params.q) {
      where.OR = [
        { name: { contains: params.q } },
        { sku: { contains: params.q } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ])

    return { items, ...buildPagination(total, page, pageSize) }
  },
)
