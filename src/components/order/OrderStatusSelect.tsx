'use client'

import { useState } from 'react'
import { updateOrderStatus } from '@/actions/admin'
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS } from '@/lib/constants'
import type { OrderStatus } from '@/generated/client'

interface OrderStatusSelectProps {
  orderId: number
  currentStatus: string
}

export function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] ?? []

  if (allowed.length === 0) return null

  async function handleChange(status: OrderStatus) {
    setError('')
    setPending(true)
    const result = await updateOrderStatus(orderId, status)
    if (result.error) setError(result.error)
    setPending(false)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">变更状态：</span>
      {allowed.map((status) => (
        <button
          key={status}
          onClick={() => handleChange(status as OrderStatus)}
          disabled={pending}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {ORDER_STATUS_LABELS[status]}
        </button>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
