import { getCurrentUser } from '@/server/auth/session'
import { logout } from '@/actions/auth'
import Link from 'next/link'

export async function AdminHeader() {
  const user = await getCurrentUser()

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Link href="/admin" className="text-sm font-bold text-[#1A1A2E]">
          Mini Mall Admin
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-slate-500">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-slate-400 hover:text-red-600 transition-colors"
              >
                退出
              </button>
            </form>
          </>
        )}
      </div>
    </header>
  )
}
