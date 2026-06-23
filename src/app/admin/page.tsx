import { getDashboardStats } from '@/server/services/admin-service'
import { formatCurrency } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()

  const cards = [
    { label: '商品总数', value: stats.totalProducts },
    { label: '已上架', value: stats.publishedProducts },
    { label: '订单总数', value: stats.totalOrders },
    { label: '待处理订单', value: stats.pendingOrders },
    { label: '总销售额', value: formatCurrency(stats.totalSalesCents ?? 0) },
    { label: '用户总数', value: stats.totalUsers },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-[#1A1A2E]">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
