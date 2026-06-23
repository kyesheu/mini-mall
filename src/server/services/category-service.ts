import { cache } from 'react'
import { prisma } from '@/server/db'
import { categoryCreateSchema, categoryUpdateSchema } from '@/lib/validations'
import { getCurrentUser } from '@/server/auth/session'
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors'
import type { CategoryCreateInput, CategoryUpdateInput } from '@/lib/validations'

// ============================================================
// Read methods (React.cache() wrapped)
// ============================================================

export const getCategoryList = cache(async () => {
  return prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
  })
})

export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
})

// ============================================================
// Write methods (NO React.cache())
// ============================================================

export async function createCategory(input: CategoryCreateInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')

  const parsed = categoryCreateSchema.safeParse(input)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fields[issue.path.join('.')] = issue.message
    }
    throw new ValidationError('分类信息校验失败', fields)
  }

  return prisma.category.create({ data: parsed.data })
}

export async function updateCategory(id: number, input: CategoryUpdateInput) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')

  const parsed = categoryUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      fields[issue.path.join('.')] = issue.message
    }
    throw new ValidationError('分类信息校验失败', fields)
  }

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw new NotFoundError('分类不存在')

  return prisma.category.update({ where: { id }, data: parsed.data })
}
