import { getCurrentUser } from '@/server/auth/session'
import { getOrders } from '@/server/services/order-service'
import { OrderCard } from '@/components/order/OrderCard'
import Link from 'next/link'

export default async function OrdersPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-lg mb-4">请先登录</p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md bg-[#1A1A2E] text-white px-6 py-2 text-sm font-medium hover:bg-[#1A1A2E]/90 transition-colors"
        >
          去登录
        </Link>
      </div>
    )
  }

  const orders = await getOrders(user.id)

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-lg mb-2">暂无订单</p>
        <Link
          href="/products"
          className="inline-block mt-4 rounded-md bg-[#1A1A2E] text-white px-6 py-2 text-sm font-medium hover:bg-[#1A1A2E]/90 transition-colors"
        >
          去逛逛
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">我的订单</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} {...order} />
        ))}
      </div>
    </div>
  )
}
