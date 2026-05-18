'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { sidebarCollapsed } = useStore()

  useEffect(() => setMounted(true), [])

  const collapsed = mounted ? sidebarCollapsed : false

  return (
    <main
      className={`pt-14 pb-16 lg:pb-0 transition-all duration-300
                  ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}
    >
      <div className="px-1 sm:px-2 lg:px-3 xl:px-4 py-5 sm:py-6 max-w-7xl mx-auto">{children}</div>
    </main>
  )
}
