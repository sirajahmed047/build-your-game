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
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-8JC314QLY1'
  
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <div className="min-h-screen bg-gradient-sunset">
                <Navigation />
                <main className="relative">
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