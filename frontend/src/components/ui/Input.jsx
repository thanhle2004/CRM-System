import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-white hover:border-gray-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, className, children, ...props },
  ref
) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white',
          error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
