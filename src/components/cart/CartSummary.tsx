import { formatCurrency } from '@/lib/utils'

interface CartSummaryProps {
  totalCents: number
  itemCount: number
}

export function CartSummary({ totalCents, itemCount }: CartSummaryProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">订单摘要</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>商品数量</span>
          <span>{itemCount} 种</span>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold">
          <span className="text-[#1A1A2E]">合计</span>
          <span className="text-[#E94560]">{formatCurrency(totalCents)}</span>
        </div>
      </div>
    </div>
  )
}
