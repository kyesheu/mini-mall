import { getCurrentUser } from '@/server/auth/session'
import { getCartItems } from '@/server/services/cart-service'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { CartSummary } from '@/components/cart/CartSummary'
import Link from 'next/link'

export default async function CartPage() {
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

  const items = await getCartItems(user.id)

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
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

  const totalCents = items.reduce((sum, item) => {
    return sum + item.product.priceCents * item.quantity
  }, 0)
  const itemCount = items.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">购物车</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <div className="lg:col-span-1">
          <CartSummary totalCents={totalCents} itemCount={itemCount} />
          <Link
            href="/checkout"
            className="mt-4 block w-full rounded-md bg-[#E94560] text-white text-center py-3 text-sm font-medium hover:bg-[#E94560]/90 transition-colors"
          >
            去结算
          </Link>
        </div>
      </div>
    </div>
  )
}
