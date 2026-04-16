import { cn } from '../../lib/utils'

const variants = {
  default:  'bg-gray-100 text-gray-700',
  success:  'bg-green-100 text-green-700',
  warning:  'bg-yellow-100 text-yellow-700',
  danger:   'bg-red-100 text-red-700',
  info:     'bg-blue-100 text-blue-700',
  indigo:   'bg-indigo-100 text-indigo-700',
}

export default function Badge({ variant = 'default', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant] ?? variants.default,
        className
      )}
    >
      {children}
    </span>
  )
}

export function churnRiskBadge(risk) {
  const map = { Low: 'success', Medium: 'warning', High: 'danger' }
  return <Badge variant={map[risk] ?? 'default'}>{risk}</Badge>
}
