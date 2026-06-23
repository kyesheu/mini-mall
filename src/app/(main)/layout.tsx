import { Header } from '@/components/layout/Header'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />
      <main>{children}</main>
      <footer className="py-8 border-t border-slate-200 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Mini Mall
      </footer>
    </div>
  )
}
