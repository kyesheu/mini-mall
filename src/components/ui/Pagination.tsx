import Link from 'next/link'

interface PaginationProps {
  page: number
  totalPages: number
  basePath: string
}

export function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={`${basePath}?page=${page - 1}`}
          className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          上一页
        </Link>
      ) : (
        <span className="rounded-md px-3 py-2 text-sm text-slate-300 cursor-not-allowed">
          上一页
        </span>
      )}

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={`${basePath}?page=${p}`}
          className={`rounded-md px-3 py-2 text-sm transition-colors ${
            p === page
              ? 'bg-[#1A1A2E] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {p}
        </Link>
      ))}

      {page < totalPages ? (
        <Link
          href={`${basePath}?page=${page + 1}`}
          className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          下一页
        </Link>
      ) : (
        <span className="rounded-md px-3 py-2 text-sm text-slate-300 cursor-not-allowed">
          下一页
        </span>
      )}
    </div>
  )
}
