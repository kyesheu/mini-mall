import { getProductBySlug } from '@/server/services/product-service'
import { formatCurrency } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { AddToCartButton } from '@/components/product/AddToCartButton'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const images = product.imageUrls as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-auto">
              {images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${product.name} ${i + 1}`}
                  className="h-20 w-20 rounded-md object-cover border border-slate-200"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.category && (
            <p className="text-sm text-slate-400 mb-2">{product.category.name}</p>
          )}
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">{product.name}</h1>
          <p className="text-xs text-slate-400 mb-4">SKU: {product.sku}</p>

          <p className="text-3xl font-bold text-[#E94560] mb-6">
            {formatCurrency(product.priceCents)}
          </p>

          <div className="prose prose-sm text-slate-600 mb-6 whitespace-pre-line">
            {product.description}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-slate-500">库存：</span>
            {product.stock > 0 ? (
              <span className="text-sm text-slate-700">
                {product.stock <= 10
                  ? `仅剩 ${product.stock} 件`
                  : `${product.stock} 件`}
              </span>
            ) : (
              <span className="text-sm text-red-600 font-medium">已售罄</span>
            )}
          </div>

          <AddToCartButton
            productId={product.id}
            maxStock={product.stock}
          />
        </div>
      </div>
    </div>
  )
}
