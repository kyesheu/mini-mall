import { cache } from 'react'
import { prisma } from '@/server/db'
import { getCurrentUser } from '@/server/auth/session'
import { ForbiddenError } from '@/lib/errors'
import type { DashboardStats } from '@/types'

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') throw new ForbiddenError('仅管理员可操作')

  const [
    totalProducts,
    publishedProducts,
    totalOrders,
    pendingOrders,
    totalSales,
    totalUsers,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ['PENDING', 'PAID'] } } }),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      _sum: { totalCents: true },
    }),
    prisma.user.count(),
  ])

  return {
    totalProducts,
    publishedProducts,
    totalOrders,
    pendingOrders,
    totalSalesCents: totalSales._sum.totalCents ?? 0,
    totalUsers,
  }
})
