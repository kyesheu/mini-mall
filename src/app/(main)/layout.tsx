import Link from 'next/link'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="h-16 border-b border-slate-200 bg-white flex items-center px-4">
        <Link href="/" className="text-lg font-bold text-[#1A1A2E]">
          Mini Mall
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <Link href="/products" className="text-sm text-slate-600 hover:text-[#1A1A2E]">
            商品
          </Link>
          <Link href="/cart" className="text-sm text-slate-600 hover:text-[#1A1A2E]">
            购物车
          </Link>
          <Link href="/orders" className="text-sm text-slate-600 hover:text-[#1A1A2E]">
            订单
          </Link>
          <Link href="/auth/login" className="text-sm text-slate-600 hover:text-[#1A1A2E]">
            登录
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="py-8 border-t border-slate-200 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Mini Mall
      </footer>
    </div>
  )
}
