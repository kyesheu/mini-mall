import { getCurrentUser } from '@/server/auth/session'
import { getOrderById } from '@/server/services/order-service'
import { OrderDetail } from '@/components/order/OrderDetail'
import { OrderActions } from '@/components/order/OrderActions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) notFound()

  const order = await getOrderById(orderId)
  if (!order) notFound()
  if (order.userId !== user.id) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">订单详情</h1>
        <Link
          href="/orders"
          className="text-sm text-slate-500 hover:text-[#1A1A2E] transition-colors"
        >
          &larr; 返回订单列表
        </Link>
      </div>

      <OrderDetail order={order} />

      <div className="mt-6">
        <OrderActions orderId={order.id} status={order.status} />
      </div>
    </div>
  )
}
