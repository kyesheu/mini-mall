import { getCurrentUser } from '@/server/auth/session'
import { getCartItems } from '@/server/services/cart-service'
import { CheckoutForm } from '@/components/order/CheckoutForm'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function CheckoutPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
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

  const items = await getCartItems(user.id)

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-lg mb-2">购物车是空的</p>
        <Link
          href="/products"
          className="inline-block mt-4 rounded-md bg-[#1A1A2E] text-white px-6 py-2 text-sm font-medium hover:bg-[#1A1A2E]/90 transition-colors"
        >
          去逛逛
        </Link>
      </div>
    )
  }

  const totalCents = items.reduce((s, i) => s + i.product.priceCents * i.quantity, 0)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">确认订单</h1>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-6">
        <p className="text-sm text-slate-500 mb-2">商品数量：{items.length} 种</p>
        <p className="text-sm font-semibold">
          合计：<span className="text-[#E94560] text-lg">{formatCurrency(totalCents)}</span>
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-4">收货信息</h2>
        <CheckoutForm />
      </div>
    </div>
  )
}
