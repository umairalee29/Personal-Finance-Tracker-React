'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useStore } from '@/store'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/transactions/new': 'New Transaction',
  '/budgets': 'Budgets',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

export function Topbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { darkMode, setDarkMode, sidebarCollapsed } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const title = PAGE_TITLES[pathname] ?? 'WealthLens'

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-14 flex items-center
                  bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm
                  border-b border-slate-200 dark:border-slate-800
                  transition-all duration-300
                  ${sidebarCollapsed ? 'left-16' : 'left-0 lg:left-60'}`}
    >
      <div className="flex items-center justify-between w-full px-4 gap-4">
        <h1 className="font-heading font-semibold text-slate-900 dark:text-slate-100 text-lg">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 flex items-center justify-center rounded-lg
                       text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800
                       transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                         hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                {session?.user?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200">
                {session?.user?.name}
              </span>
              <span className="text-slate-400 text-xs">▾</span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-48
                           bg-white dark:bg-slate-800
                           rounded-xl shadow-lg border border-slate-200 dark:border-slate-700
                           py-1 z-50"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/login' }) }}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 dark:text-rose-400
                             hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  )
}
