'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { updateCartItem, removeFromCart } from '@/actions/cart'

interface CartItem {
  id: number
  quantity: number
  product: {
    id: number
    name: string
    slug: string
    priceCents: number
    imageUrls: unknown
    stock: number
    published: boolean
  }
}

export function CartItemRow({ item }: { item: CartItem }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const images = item.product.imageUrls as string[]
  const imageUrl = images.length > 0 ? images[0] : null
  const quantity = item.quantity

  async function handleQuantityChange(newQty: number) {
    if (newQty < 1 || newQty > item.product.stock || newQty === quantity) return
    setError('')
    setPending(true)
    const result = await updateCartItem(item.id, newQty)
    if (!result.success && result.error) {
      setError(result.error)
    }
    setPending(false)
  }

  async function handleRemove() {
    setError('')
    setPending(true)
    const result = await removeFromCart(item.id)
    if (!result.success && result.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <div className="h-20 w-20 rounded-md bg-slate-100 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 text-xs">无图</div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.product.slug}`}
          className="text-sm font-medium text-slate-900 hover:text-[#1A1A2E] truncate block"
        >
          {item.product.name}
        </Link>
        <p className="text-sm text-slate-400 mt-0.5">
          {formatCurrency(item.product.priceCents)}
        </p>
        {!item.product.published && (
          <span className="inline-block mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
            商品已下架，仅可删除
          </span>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={pending || quantity <= 1 || !item.product.published}
          className="h-8 w-8 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          -
        </button>
        <span className="w-8 text-center text-sm">{quantity}</span>
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={pending || quantity >= item.product.stock || !item.product.published}
          className="h-8 w-8 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          +
        </button>
      </div>

      <div className="w-20 text-right">
        <p className="text-sm font-semibold text-[#E94560]">
          {formatCurrency(item.product.priceCents * quantity)}
        </p>
      </div>

      <button
        onClick={handleRemove}
        disabled={pending}
        className="shrink-0 rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="删除"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
