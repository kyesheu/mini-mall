'use client'

import { useActionState } from 'react'
import { createCategory } from '@/actions/category'

const initialState = { error: '', fields: {} as Record<string, string> }

export function CreateCategoryForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await createCategory(formData)
      if (result.success) return initialState
      return { error: result.error ?? '', fields: result.fields ?? {} }
    },
    initialState,
  )

  return (
    <form action={formAction} className="flex gap-2 items-start">
      <div className="flex-1">
        <input name="name" placeholder="分类名称" required className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
        {state.fields.name && <p className="mt-1 text-xs text-red-600">{state.fields.name}</p>}
      </div>
      <div className="flex-1">
        <input name="slug" placeholder="slug（如 electronics）" required className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
        {state.fields.slug && <p className="mt-1 text-xs text-red-600">{state.fields.slug}</p>}
      </div>
      <div className="flex-1">
        <input name="description" placeholder="描述（可选）" className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
        {state.fields.description && <p className="mt-1 text-xs text-red-600">{state.fields.description}</p>}
      </div>
      <button type="submit" disabled={pending} className="h-10 rounded-md bg-[#1A1A2E] text-white px-6 text-sm font-medium hover:bg-[#1A1A2E]/90 disabled:opacity-50 transition-colors shrink-0">
        {pending ? '创建中...' : '创建'}
      </button>
      {state.error && !Object.keys(state.fields).length && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  )
}
