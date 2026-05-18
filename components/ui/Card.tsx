import { type HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'lg', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-white dark:bg-slate-800
                  rounded-xl shadow-sm
                  border border-slate-200 dark:border-slate-700
                  ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-heading font-semibold text-slate-900 dark:text-slate-100 ${className}`}>
      {children}
    </h3>
  )
}
