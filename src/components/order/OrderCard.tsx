import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'

interface OrderItem {
  id: number
  productName: string
  quantity: number
  unitPriceCents: number
  subtotalCents: number
  productImageUrl: string | null
}

interface OrderCardProps {
  id: number
  orderNo: string
  status: string
  totalCents: number
  createdAt: Date
  items: OrderItem[]
}

export function OrderCard({ id, orderNo, status, totalCents, createdAt, items }: OrderCardProps) {
  return (
    <Link
      href={`/orders/${id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400">{orderNo}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
        <OrderStatusBadge status={status} />
      </div>

      <div className="space-y-1">
        {items.slice(0, 2).map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            {item.productImageUrl && (
              <img
                src={item.productImageUrl}
                alt={item.productName}
                className="h-8 w-8 rounded object-cover"
              />
            )}
            <span className="text-slate-700 truncate flex-1">
              {item.productName}
            </span>
            <span className="text-slate-400 shrink-0">x{item.quantity}</span>
          </div>
        ))}
        {items.length > 2 && (
          <p className="text-xs text-slate-400">...还有 {items.length - 2} 件商品</p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-sm text-slate-500">
          共 {items.reduce((s, i) => s + i.quantity, 0)} 件
        </span>
        <span className="text-lg font-bold text-[#E94560]">
          {formatCurrency(totalCents)}
        </span>
      </div>
    </Link>
  )
}
