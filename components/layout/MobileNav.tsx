'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/transactions', label: 'Transactions', icon: '💳' },
  { href: '/budgets', label: 'Budgets', icon: '🎯' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30
                    bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800
                    flex items-stretch h-16">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs
                       transition-colors
                       ${active
                         ? 'text-primary dark:text-primary-300'
                         : 'text-slate-500 dark:text-slate-400'
                       }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="font-medium">{label}</span>
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
