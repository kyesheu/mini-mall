import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface ProductCardProps {
  slug: string
  name: string
  priceCents: number
  imageUrls: unknown
  stock: number
  category?: { id: number; name: string; slug: string } | null
}

export function ProductCard({ slug, name, priceCents, imageUrls, stock, category }: ProductCardProps) {
  const images = imageUrls as string[]
  const imageUrl = images.length > 0 ? images[0] : null

  return (
    <Link
      href={`/products/${slug}`}
      className="group block rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] overflow-hidden rounded-t-lg bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        {category && (
          <p className="mb-1 text-xs text-slate-400">{category.name}</p>
        )}
        <h3 className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#E94560]">
            {formatCurrency(priceCents)}
          </span>
          {stock === 0 ? (
            <span className="text-xs text-slate-400">已售罄</span>
          ) : stock <= 10 ? (
            <span className="text-xs text-amber-600">仅剩 {stock} 件</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
