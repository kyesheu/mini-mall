import { getProductListAdmin } from '@/server/services/product-service'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>
}) {
  const params = await searchParams
  const result = await getProductListAdmin({
    page: Number(params.page) || 1,
    categoryId: params.category ? Number(params.category) : undefined,
    q: params.q,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">商品管理</h1>
        <Link href="/admin/products/new" className="rounded-md bg-[#1A1A2E] text-white px-4 py-2 text-sm font-medium hover:bg-[#1A1A2E]/90 transition-colors">
          + 新增商品
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">商品</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">价格</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">库存</th>
              <th className="text-center px-4 py-3 font-medium text-slate-500">状态</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.items.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <p className="text-slate-900 font-medium">{p.name}</p>
                  <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(p.priceCents)}</td>
                <td className="px-4 py-3 text-right">{p.stock}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {p.published ? '已上架' : '已下架'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-sm text-[#1A1A2E] hover:underline mr-3">
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?page=${p}`}
              className={`rounded-md px-3 py-1.5 text-sm ${p === result.page ? 'bg-[#1A1A2E] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
