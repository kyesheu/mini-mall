import { getOrdersAdmin } from '@/server/services/order-service'
import { formatCurrency } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'
import Link from 'next/link'

export default async function AdminOrdersPage() {
  const orders = await getOrdersAdmin()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">订单管理</h1>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">订单号</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">用户</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">金额</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500">状态</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">时间</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{o.orderNo}</td>
                <td className="px-4 py-3">{o.user.email}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(o.totalCents)}</td>
                <td className="px-4 py-3 text-center"><OrderStatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${o.id}`} className="text-sm text-[#1A1A2E] hover:underline">详情</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
