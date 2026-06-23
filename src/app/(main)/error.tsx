'use client'

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-slate-400 text-lg mb-2">页面加载失败</p>
      <p className="text-slate-400 text-sm mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="inline-block rounded-md bg-[#1A1A2E] text-white px-6 py-2 text-sm font-medium hover:bg-[#1A1A2E]/90 transition-colors"
      >
        重试
      </button>
    </div>
  )
}
