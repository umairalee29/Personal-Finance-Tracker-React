'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useStore } from '@/store'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/transactions', label: 'Transactions', icon: '💳' },
  { href: '/budgets', label: 'Budgets', icon: '🎯' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { sidebarCollapsed, setSidebarCollapsed } = useStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const collapsed = mounted ? sidebarCollapsed : false

  return (
    <aside
      className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30
                  bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
                  transition-all duration-300
                  ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
        <span className="text-2xl flex-shrink-0">💎</span>
        {!collapsed && (
          <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
            WealthLens
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                         transition-all duration-150 group
                         ${active
                           ? 'bg-primary/10 text-primary dark:text-primary-300'
                           : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                         }`}
            >
              <span className="text-lg flex-shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + collapse toggle */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
        {session?.user && !collapsed && (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                     text-xs text-slate-500 dark:text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
