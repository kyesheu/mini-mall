import Link from 'next/link'
import { getCurrentUser } from '@/server/auth/session'
import { logout } from '@/actions/auth'

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center px-4">
      <Link href="/" className="text-lg font-bold text-[#1A1A2E]">
        Mini Mall
      </Link>

      <nav className="ml-auto flex items-center gap-4">
        <Link href="/products" className="text-sm text-slate-600 hover:text-[#1A1A2E] transition-colors">
          商品
        </Link>
        <Link href="/cart" className="text-sm text-slate-600 hover:text-[#1A1A2E] transition-colors">
          购物车
        </Link>
        <Link href="/orders" className="text-sm text-slate-600 hover:text-[#1A1A2E] transition-colors">
          订单
        </Link>

        {user?.role === 'ADMIN' && (
          <Link href="/admin" className="text-sm text-[#E94560] hover:text-[#E94560]/80 font-medium transition-colors">
            后台管理
          </Link>
        )}

        {user ? (
          <>
            <span className="text-sm text-slate-500">{user.name}</span>
            <form action={logout}>
              <button type="submit" className="text-sm text-slate-400 hover:text-red-600 transition-colors">
                退出
              </button>
            </form>
          </>
        ) : (
          <Link href="/auth/login" className="text-sm text-slate-600 hover:text-[#1A1A2E] transition-colors">
            登录
          </Link>
        )}
      </nav>
    </header>
  )
}
