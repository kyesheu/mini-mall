'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { payOrder, cancelOrder } from '@/actions/order'

interface OrderActionsProps {
  orderId: number
  status: string
}

export function OrderActions({ orderId, status }: OrderActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setError('')
    setPending(true)
    const result = await payOrder(orderId)
    if (result.success) {
      router.refresh()
    } else if (result.error) {
      setError(result.error)
    }
    setPending(false)
  }

  async function handleCancel() {
    if (!confirm('确定要取消该订单吗？')) return
    setError('')
    setPending(true)
    const result = await cancelOrder(orderId)
    if (result.success) {
      router.refresh()
    } else if (result.error) {
      setError(result.error)
    }
    setPending(false)
  }

  return (
    <div className="flex gap-2">
      {status === 'PENDING' && (
        <>
          <button
            onClick={handlePay}
            disabled={pending}
            className="rounded-md bg-[#E94560] text-white px-6 py-2 text-sm font-medium hover:bg-[#E94560]/90 disabled:opacity-50 transition-colors"
          >
            {pending ? '处理中...' : '模拟支付'}
          </button>
          <button
            onClick={handleCancel}
            disabled={pending}
            className="rounded-md border border-slate-300 text-slate-600 px-6 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            取消订单
          </button>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
