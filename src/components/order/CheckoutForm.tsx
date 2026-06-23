'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/actions/order'

const initialState = { error: '', fields: {} as Record<string, string>, orderId: undefined as number | undefined }

export function CheckoutForm() {
  const router = useRouter()

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await createOrder(formData)
      if (result.success && result.orderId) {
        router.push(`/orders/${result.orderId}`)
        return initialState
      }
      return { error: result.error ?? '', fields: result.fields ?? {}, orderId: undefined }
    },
    initialState,
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.error && !Object.keys(state.fields).length && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="receiverName" className="block text-sm font-medium text-slate-700 mb-1">
          收货人姓名
        </label>
        <input
          id="receiverName"
          name="receiverName"
          type="text"
          required
          className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 focus:border-[#1A1A2E]"
          placeholder="请输入收货人姓名"
        />
        {state.fields.receiverName && (
          <p className="mt-1 text-sm text-red-600">{state.fields.receiverName}</p>
        )}
      </div>

      <div>
        <label htmlFor="receiverPhone" className="block text-sm font-medium text-slate-700 mb-1">
          收货人电话
        </label>
        <input
          id="receiverPhone"
          name="receiverPhone"
          type="tel"
          required
          className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 focus:border-[#1A1A2E]"
          placeholder="请输入收货人电话"
        />
        {state.fields.receiverPhone && (
          <p className="mt-1 text-sm text-red-600">{state.fields.receiverPhone}</p>
        )}
      </div>

      <div>
        <label htmlFor="shippingAddress" className="block text-sm font-medium text-slate-700 mb-1">
          收货地址
        </label>
        <textarea
          id="shippingAddress"
          name="shippingAddress"
          rows={3}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 focus:border-[#1A1A2E] resize-none"
          placeholder="请输入详细收货地址"
        />
        {state.fields.shippingAddress && (
          <p className="mt-1 text-sm text-red-600">{state.fields.shippingAddress}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full h-10 rounded-md bg-[#E94560] text-white text-sm font-medium hover:bg-[#E94560]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560]/50 disabled:opacity-50 transition-colors"
      >
        {pending ? '提交中...' : '提交订单'}
      </button>
    </form>
  )
}
