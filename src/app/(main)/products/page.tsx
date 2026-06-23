import { getProductList } from '@/server/services/product-service'
import { getCategoryList } from '@/server/services/category-service'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductFilters } from '@/components/product/ProductFilters'
import { Pagination } from '@/components/ui/Pagination'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string; sort?: string }>
}) {
  const params = await searchParams

  const [result, categories] = await Promise.all([
    getProductList({
      page: Number(params.page) || 1,
      categoryId: params.category ? Number(params.category) : undefined,
      q: params.q,
      sort: params.sort,
    }),
    getCategoryList(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">商品列表</h1>

      <div className="mb-6">
        <ProductFilters
          categories={categories}
          currentCategoryId={params.category ? Number(params.category) : undefined}
          currentQ={params.q}
          currentSort={params.sort}
        />
      </div>

      <ProductGrid products={result.items} />

      <div className="mt-8">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          basePath="/products"
        />
      </div>
    </div>
  )
}
