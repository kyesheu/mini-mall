'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Category {
  id: number
  name: string
  slug: string
}

interface ProductFiltersProps {
  categories: Category[]
  currentCategoryId?: number
  currentQ?: string
  currentSort?: string
}

export function ProductFilters({
  categories,
  currentCategoryId,
  currentQ,
  currentSort,
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      // Reset to page 1 when filters change
      params.delete('page')
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => router.push('/products')}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            !currentCategoryId
              ? 'bg-[#1A1A2E] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              updateParams({ category: String(cat.id) })
            }
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              currentCategoryId === cat.id
                ? 'bg-[#1A1A2E] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="search"
          placeholder="搜索商品..."
          defaultValue={currentQ}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParams({ q: e.currentTarget.value || undefined })
            }
          }}
          className="h-9 w-full sm:w-48 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 focus:border-[#1A1A2E]"
        />
        <select
          value={currentSort ?? ''}
          onChange={(e) => updateParams({ sort: e.target.value || undefined })}
          className="h-9 rounded-md border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 focus:border-[#1A1A2E]"
        >
          <option value="">最新</option>
          <option value="price_asc">价格从低到高</option>
          <option value="price_desc">价格从高到低</option>
        </select>
      </div>
    </div>
  )
}
