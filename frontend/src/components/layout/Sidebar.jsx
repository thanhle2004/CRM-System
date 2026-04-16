import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  PieChart,
  AlertTriangle,
  Megaphone,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/',          label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/customers', label: 'Customers',    icon: Users },
  { to: '/analytics', label: 'Analytics',    icon: BarChart3 },
  { to: '/segments',  label: 'Segments',     icon: PieChart },
  { to: '/churn',     label: 'Churn',        icon: AlertTriangle },
  { to: '/marketing', label: 'Marketing',    icon: Megaphone },
]

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-gray-900 flex flex-col z-20">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <span className="text-white font-bold text-xl tracking-tight">
          <span className="text-indigo-400">CRM</span> System
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">v1.0.0</p>
      </div>
    </aside>
  )
}
