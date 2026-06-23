'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/actions/product'
interface Category {
  id: number
  name: string
  slug: string
}

const initialState = { error: '', fields: {} as Record<string, string> }

interface ProductFormProps {
  categories: Category[]
  defaultValues?: {
    id: number
    sku: string
    name: string
    slug: string
    description: string
    priceCents: number
    imageUrls: string[]
    stock: number
    published: boolean
    categoryId: number | null
  }
}

export function ProductForm({ categories, defaultValues }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!defaultValues

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = isEdit
        ? await updateProduct(defaultValues!.id, formData)
        : await createProduct(formData)
      if (result.success) {
        router.push('/admin/products')
        return initialState
      }
      return { error: result.error ?? '', fields: result.fields ?? {} }
    },
    initialState,
  )

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      {state.error && !Object.keys(state.fields).length && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{state.error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
        <input name="sku" defaultValue={defaultValues?.sku} required className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
        {state.fields.sku && <p className="mt-1 text-sm text-red-600">{state.fields.sku}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">商品名称</label>
        <input name="name" defaultValue={defaultValues?.name} required className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
        {state.fields.name && <p className="mt-1 text-sm text-red-600">{state.fields.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
        <textarea name="description" defaultValue={defaultValues?.description} required rows={4} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">价格（分）</label>
          <input name="priceCents" type="number" defaultValue={defaultValues?.priceCents ?? ''} required className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">库存</label>
          <input name="stock" type="number" defaultValue={defaultValues?.stock ?? ''} required className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
        <select name="categoryId" defaultValue={defaultValues?.categoryId ?? ''} className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20">
          <option value="">无分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">图片 URL（每行一个，最多 6 张）</label>
        <textarea name="imageUrls" defaultValue={defaultValues?.imageUrls.join('\n') ?? ''} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 resize-none" placeholder="https://picsum.photos/400/300" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="published" id="published" defaultChecked={defaultValues?.published ?? false} className="rounded" />
        <label htmlFor="published" className="text-sm text-slate-700">立即上架</label>
      </div>

      {isEdit && <input type="hidden" name="_slug" value={defaultValues?.slug} />}

      <button type="submit" disabled={pending} className="w-full h-10 rounded-md bg-[#1A1A2E] text-white text-sm font-medium hover:bg-[#1A1A2E]/90 disabled:opacity-50 transition-colors">
        {pending ? '保存中...' : isEdit ? '保存修改' : '创建商品'}
      </button>
    </form>
  )
}
