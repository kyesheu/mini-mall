import { getCategoryBySlug } from '@/server/services/category-service'
import { ProductGrid } from '@/components/product/ProductGrid'
import { notFound } from 'next/navigation'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-sm text-slate-500 mb-6">{category.description}</p>
      )}

      <ProductGrid products={category.products} />
    </div>
  )
}
