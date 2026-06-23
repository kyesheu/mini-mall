export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header placeholder — to be replaced in Step 6+ */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center px-4">
        <a href="/" className="text-lg font-bold text-[#1A1A2E]">
          Mini Mall
        </a>
        <nav className="ml-auto flex items-center gap-4">
          <a href="/products" className="text-sm text-slate-600 hover:text-[#1A1A2E]">
            商品
          </a>
          <a href="/cart" className="text-sm text-slate-600 hover:text-[#1A1A2E]">
            购物车
          </a>
          <a href="/orders" className="text-sm text-slate-600 hover:text-[#1A1A2E]">
            订单
          </a>
          <a href="/auth/login" className="text-sm text-slate-600 hover:text-[#1A1A2E]">
            登录
          </a>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="py-8 border-t border-slate-200 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Mini Mall
      </footer>
    </div>
  )
}
