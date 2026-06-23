import { formatCurrency } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge'

interface OrderItem {
  id: number
  productName: string
  productSku: string
  productSlug: string | null
  productImageUrl: string | null
  unitPriceCents: number
  quantity: number
  subtotalCents: number
}

interface Order {
  id: number
  orderNo: string
  status: string
  totalCents: number
  receiverName: string
  receiverPhone: string
  shippingAddress: string
  createdAt: Date
  items: OrderItem[]
}

export function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      {/* Order info header */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400">{order.orderNo}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-slate-400">收货人：</span>
            <span className="text-slate-700">{order.receiverName}</span>
          </div>
          <div>
            <span className="text-slate-400">电话：</span>
            <span className="text-slate-700">{order.receiverPhone}</span>
          </div>
          <div>
            <span className="text-slate-400">地址：</span>
            <span className="text-slate-700">{order.shippingAddress}</span>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">商品</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">单价</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">数量</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">小计</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.productImageUrl && (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-slate-700">{item.productName}</p>
                      <p className="text-xs text-slate-400">SKU: {item.productSku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {formatCurrency(item.unitPriceCents)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">
                  {formatCurrency(item.subtotalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-right">
        <span className="text-sm text-slate-500 mr-2">合计：</span>
        <span className="text-xl font-bold text-[#E94560]">
          {formatCurrency(order.totalCents)}
        </span>
      </div>
    </div>
  )
}
