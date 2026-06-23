import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: '商品管理' },
  { href: '/admin/categories', label: '分类管理' },
  { href: '/admin/orders', label: '订单管理' },
]

export function AdminSidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside className="relative w-64 bg-[#1A1A2E] text-white min-h-screen shrink-0 hidden md:block">
      <div className="p-4">
        <Link href="/admin" className="text-lg font-bold tracking-wide">
          Mini Mall
        </Link>
        <span className="ml-2 rounded bg-white/20 px-1.5 py-0.5 text-xs">Admin</span>
      </div>
      <nav className="mt-2">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? currentPath === item.href
            : currentPath.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="absolute bottom-0 w-64 p-4">
        <Link
          href="/"
          className="block text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          &larr; 返回前台
        </Link>
      </div>
    </aside>
  )
}
