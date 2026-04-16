import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function KpiCard({ title, value, sub, icon: Icon, color = 'indigo', trend }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  ring: 'ring-green-100'  },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    ring: 'ring-red-100'    },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'ring-blue-100'   },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  ring: 'ring-amber-100'  },
  }
  const c = colors[color] ?? colors.indigo

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex gap-4 items-start">
      <div className={cn('p-3 rounded-xl ring-1 shrink-0', c.bg, c.ring)}>
        <Icon size={22} className={c.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
        {trend != null && (
          <div className={cn('flex items-center gap-1 mt-1 text-xs font-medium',
            trend >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  )
}
