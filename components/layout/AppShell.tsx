'use client'

import { useStore } from '@/store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useStore()

  return (
    <main
      className={`pt-14 pb-16 lg:pb-0 transition-all duration-300
                  ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'}`}
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</div>
    </main>
  )
}
