import { ORDER_STATUS_LABELS } from '@/lib/constants'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export function OrderStatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  )
}
