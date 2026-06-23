import { getOrderById } from '@/server/services/order-service'
import { OrderDetail } from '@/components/order/OrderDetail'
import { OrderStatusSelect } from '@/components/order/OrderStatusSelect'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const orderId = Number(id)
  if (isNaN(orderId)) notFound()

  const order = await getOrderById(orderId)
  if (!order) notFound()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">订单详情</h1>
        <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-[#1A1A2E] transition-colors">
          &larr; 返回订单列表
        </Link>
      </div>

      <OrderDetail order={order} />

      <div className="mt-6">
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>
    </div>
  )
}
