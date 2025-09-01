'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthButton } from '@/components/auth/AuthButton'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { cn } from '@/lib/utils'

interface NavigationProps {
  className?: string
}

export function Navigation({ className }: NavigationProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/story-demo', label: 'Play', icon: '🎭' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊', requiresAuth: true },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className={cn('glass border-b border-white/20 backdrop-blur-md sticky top-0 z-50', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-2xl animate-float">📚</div>
            <span className="font-bold text-xl text-gradient-primary group-hover:scale-105 transition-transform duration-300">
              Story Generator
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-sage-100 to-ocean-100 text-sage-700 shadow-soft'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50 hover:shadow-soft'
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block glass px-3 py-1 rounded-xl">
                  <span className="text-sm text-neutral-600">
                    {user.email}
                  </span>
                </div>
                <AuthButton mode="signout" variant="ghost" size="sm">
                  <span className="mr-1">👋</span>
                  Sign Out
                </AuthButton>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <AuthButton mode="signin" variant="ghost" size="sm">
                  Sign In
                </AuthButton>
                <AuthButton mode="signup" variant="sage" size="sm">
                  <span className="mr-1">✨</span>
                  Sign Up
                </AuthButton>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-white/50 transition-all duration-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 glass-dark backdrop-blur-lg">
            <div className="space-y-2">
              {navItems.map((item) => {
                if (item.requiresAuth && !user) return null
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300',
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-sage-100 to-ocean-100 text-sage-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/30'
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile Auth */}
            {!user && (
              <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
                <AuthButton mode="signin" variant="ghost" className="w-full justify-center">
                  Sign In
                </AuthButton>
                <AuthButton mode="signup" variant="sage" className="w-full justify-center">
                  <span className="mr-2">✨</span>
                  Sign Up
                </AuthButton>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export function NavigationSkeleton() {
  return (
    <nav className="glass border-b border-white/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-sage-200 to-ocean-200 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gradient-to-r from-sage-200 to-ocean-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-8 bg-gradient-to-r from-sage-200 to-ocean-200 rounded-xl animate-pulse"></div>
            <div className="w-20 h-8 bg-gradient-to-r from-sage-200 to-ocean-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </nav>
  )
}