import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  const left  = Math.max(1, page - delta)
  const right = Math.min(totalPages, page + delta)

  for (let i = left; i <= right; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      <Button
        variant="ghost"
        size="sm"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft size={16} />
      </Button>

      {left > 1 && (
        <>
          <Btn n={1} cur={page} onPage={onPage} />
          {left > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {pages.map((n) => <Btn key={n} n={n} cur={page} onPage={onPage} />)}

      {right < totalPages && (
        <>
          {right < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
          <Btn n={totalPages} cur={page} onPage={onPage} />
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}

function Btn({ n, cur, onPage }) {
  return (
    <button
      onClick={() => onPage(n)}
      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
        n === cur
          ? 'bg-indigo-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {n}
    </button>
  )
}
