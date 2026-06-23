import Link from 'next/link'
import { getProductList } from '@/server/services/product-service'
import { getCategoryList } from '@/server/services/category-service'
import { getCurrentUser } from '@/server/auth/session'
import { ProductGrid } from '@/components/product/ProductGrid'

export default async function HomePage() {
  const [result, categories, user] = await Promise.all([
    getProductList({ page: 1 }),
    getCategoryList(),
    getCurrentUser(),
  ])

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-3">Mini Mall</h1>
        <p className="text-slate-500 text-lg">微型电商 — 简洁、干净、完整的全栈 Demo</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/products"
            className="rounded-md bg-[#1A1A2E] text-white px-6 py-2.5 text-sm font-medium hover:bg-[#1A1A2E]/90 transition-colors"
          >
            浏览商品
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-md border border-slate-300 text-slate-700 px-6 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              后台管理
            </Link>
          )}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">商品分类</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="rounded-full bg-slate-100 text-slate-700 px-4 py-2 text-sm hover:bg-[#1A1A2E] hover:text-white transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#1A1A2E]">推荐商品</h2>
          <Link href="/products" className="text-sm text-[#1A1A2E] hover:underline">
            查看全部 &rarr;
          </Link>
        </div>
        <ProductGrid products={result.items.slice(0, 8)} />
      </section>
    </div>
  )
}
