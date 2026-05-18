'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          className: '',
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #1e293b)',
            border: '1px solid var(--toast-border, #e2e8f0)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#fff' },
          },
        }}
      />
    </SessionProvider>
  )
}
