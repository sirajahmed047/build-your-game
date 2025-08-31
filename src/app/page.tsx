'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthButton } from '@/components/auth/AuthButton'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6">
          Interactive Story Generator
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl">
          Discover who you really are through the choices you make. 
          Create personalized narratives, compare your decisions with millions of players, 
          and build a unique personality profile.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="/story-demo">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold transition-all transform hover:scale-105">
              Start Your Story
            </Button>
          </Link>
          {!user && (
            <AuthButton mode="signup" variant="outline" size="lg" className="border-2 border-white text-white px-8 py-4 text-lg font-semibold hover:bg-white hover:text-purple-900 transition-all">
              Create Free Account
            </AuthButton>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white hover:bg-white/20 transition-all">
            <div className="text-3xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold mb-2">AI-Generated Stories</h3>
            <p className="text-blue-100">Dynamic narratives in Fantasy, Mystery, and Sci-Fi genres</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white hover:bg-white/20 transition-all">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Choice Statistics</h3>
            <p className="text-blue-100">See how your decisions compare to millions of other players</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white hover:bg-white/20 transition-all">
            <div className="text-3xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Collect Endings</h3>
            <p className="text-blue-100">Discover rare story endings and build your collection</p>
          </div>
        </div>
      </div>
    </div>
  )
}