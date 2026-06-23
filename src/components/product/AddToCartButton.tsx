'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addToCart } from '@/actions/cart'

const AUTH_ERROR = '请先登录'

interface AddToCartButtonProps {
  productId: number
  maxStock: number
}

export function AddToCartButton({ productId, maxStock }: AddToCartButtonProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const disabled = maxStock === 0 || pending

  async function handleAdd() {
    setError('')
    setSuccess(false)
    setPending(true)
    try {
      const result = await addToCart(productId, quantity)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      } else if (result.error) {
        if (result.error.includes(AUTH_ERROR)) {
          router.push('/auth/login')
        } else {
          setError(result.error)
        }
      }
    } catch {
      setError('操作失败，请重试')
    } finally {
      setPending(false)
    }
  }

  function handleBuyNow() {
    setError('')
    setPending(true)
    addToCart(productId, quantity).then((result) => {
      if (result.success) {
        router.push('/cart')
      } else if (result.error) {
        if (result.error.includes(AUTH_ERROR)) {
          router.push('/auth/login')
        } else {
          setError(result.error)
        }
        setPending(false)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={disabled}
          className="h-10 w-10 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          -
        </button>
        <input
          type="number"
          min={1}
          max={maxStock}
          value={quantity}
          onChange={(e) => setQuantity(Math.min(maxStock, Math.max(1, Number(e.target.value) || 1)))}
          className="h-10 w-16 rounded-md border border-slate-300 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 focus:border-[#1A1A2E]"
        />
        <button
          onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
          disabled={disabled}
          className="h-10 w-10 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          +
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={disabled}
          className="flex-1 h-10 rounded-md bg-[#1A1A2E] text-white text-sm font-medium hover:bg-[#1A1A2E]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A2E]/50 disabled:opacity-50 transition-colors"
        >
          {pending ? '处理中...' : '加入购物车'}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={disabled}
          className="flex-1 h-10 rounded-md bg-[#E94560] text-white text-sm font-medium hover:bg-[#E94560]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560]/50 disabled:opacity-50 transition-colors"
        >
          立即购买
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600">已加入购物车</p>
      )}
    </div>
  )
}
