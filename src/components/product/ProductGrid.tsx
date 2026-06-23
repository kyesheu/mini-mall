import { ProductCard } from '@/components/product/ProductCard'

interface Product {
  slug: string
  name: string
  priceCents: number
  imageUrls: unknown
  stock: number
  category?: { id: number; name: string; slug: string } | null
}

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-400 text-lg">暂无商品</p>
        <p className="text-slate-400 text-sm mt-1">换个关键词试试</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} {...product} />
      ))}
    </div>
  )
}
