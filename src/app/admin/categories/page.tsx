import { getCategoryList } from '@/server/services/category-service'
import { CreateCategoryForm } from '@/components/admin/CreateCategoryForm'

export default async function AdminCategoriesPage() {
  const categories = await getCategoryList()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">分类管理</h1>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">名称</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">描述</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.slug}</td>
                <td className="px-4 py-3 text-slate-500">{c.description ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">新增分类</h2>
        <CreateCategoryForm />
      </div>
    </div>
  )
}
