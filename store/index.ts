import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TransactionFilters, TransactionType, TransactionStatus } from '@/types'

interface WealthLensStore {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void

  darkMode: boolean
  setDarkMode: (v: boolean) => void

  filters: TransactionFilters
  setFilters: (f: Partial<TransactionFilters>) => void
  resetFilters: () => void
}

const defaultFilters: TransactionFilters = {
  page: 1,
  limit: 20,
  sortBy: 'date',
  sortDir: 'desc',
}

export const useStore = create<WealthLensStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      darkMode: false,
      setDarkMode: (v) => {
        set({ darkMode: v })
        if (v) {
          document.documentElement.classList.add('dark')
          localStorage.setItem('wealthlens-theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('wealthlens-theme', 'light')
        }
      },

      filters: defaultFilters,
      setFilters: (f) =>
        set((s) => ({ filters: { ...s.filters, ...f, page: f.page ?? 1 } })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'wealthlens-store',
      skipHydration: true,
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, darkMode: s.darkMode }),
    }
  )
)
