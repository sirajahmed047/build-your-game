import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Navigation } from '@/components/ui/Navigation'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { logProductionReadiness } from '@/lib/utils/production-check'

// Run production readiness check on startup
if (typeof window === 'undefined') {
  logProductionReadiness()
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Interactive Story Generator',
  description: 'Discover who you really are through the choices you make',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <div className="min-h-screen bg-gray-50">
                <Navigation />
                <main>
                  {children}
                </main>
              </div>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}