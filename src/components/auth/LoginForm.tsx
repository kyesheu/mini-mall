'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/actions/auth'

const initialState = { error: '', fields: {} as Record<string, string> }

export function LoginForm() {
  const router = useRouter()

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await login(formData)
      if (result.success) {
        router.push('/')
        return initialState
      }
      return { error: result.error ?? '', fields: result.fields ?? {} }
    },
    initialState,
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.error && !Object.keys(state.fields).length && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 focus:border-[#1A1A2E]"
          placeholder="请输入邮箱"
        />
        {state.fields.email && (
          <p className="mt-1 text-sm text-red-600">{state.fields.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 focus:border-[#1A1A2E]"
          placeholder="请输入密码"
        />
        {state.fields.password && (
          <p className="mt-1 text-sm text-red-600">{state.fields.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full h-10 rounded-md bg-[#1A1A2E] text-white text-sm font-medium hover:bg-[#1A1A2E]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A2E]/50 disabled:opacity-50 transition-colors"
      >
        {pending ? '登录中...' : '登录'}
      </button>

      <p className="text-center text-sm text-slate-500">
        还没有账号？{' '}
        <a href="/auth/register" className="text-[#1A1A2E] font-medium hover:underline">
          立即注册
        </a>
      </p>
    </form>
  )
}
