import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  PieChart,
  AlertTriangle,
  Megaphone,
  ChevronUp,
  LogOut,
  UserCircle2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/',          label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/customers', label: 'Customers',    icon: Users },
  { to: '/analytics', label: 'Analytics',    icon: BarChart3 },
  { to: '/segments',  label: 'Segments',     icon: PieChart },
  { to: '/churn',     label: 'Churn',        icon: AlertTriangle },
  { to: '/marketing', label: 'Marketing',    icon: Megaphone },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <aside className="fixed inset-y-0 left-0 w-72 bg-gray-900 flex flex-col z-20">
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

      <div className="p-4 border-t border-gray-700 space-y-3">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="w-full rounded-xl border border-gray-800 bg-gray-800/80 px-3 py-3 text-left transition hover:border-gray-700 hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
                <UserCircle2 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.name || 'Guest'}</p>
                <p className="truncate text-xs text-gray-400">{user?.email || 'Not signed in'}</p>
              </div>
              <ChevronUp
                size={16}
                className={cn('text-gray-500 transition-transform', open && 'rotate-180')}
              />
            </div>
          </button>

          {open ? (
            <div className="absolute inset-x-0 bottom-full mb-2 rounded-xl border border-gray-800 bg-gray-900 p-2 shadow-xl">
              <button
                type="button"
                onClick={async () => {
                  setOpen(false)
                  await logout()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : null}
        </div>

        <p className="text-xs text-gray-500 text-center">v1.0.0</p>
      </div>
    </aside>
  )
}
