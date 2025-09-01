'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { AuthButton } from '@/components/auth/AuthButton'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-sunset relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-sage-200/30 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-ocean-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-warm-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-accent-lavender/30 rounded-full blur-xl animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-[85vh] text-center px-6">
        <div className="animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gradient-primary mb-6">
            Interactive Story Generator
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl leading-relaxed">
            Discover who you really are through the choices you make. 
            Create personalized narratives, compare your decisions with millions of players, 
            and build a unique personality profile.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up">
          <Link href="/story-demo">
            <Button size="lg" className="btn-primary px-8 py-4 text-lg font-semibold rounded-xl">
              <span className="mr-2">✨</span>
              Start Your Story
            </Button>
          </Link>
          {!user && (
            <AuthButton mode="signup" variant="outline" size="lg" className="btn-ghost px-8 py-4 text-lg font-semibold rounded-xl">
              <span className="mr-2">🌟</span>
              Create Free Account
            </AuthButton>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl animate-scale-in">
          <div className="card-floating p-8 text-center group">
            <div className="text-4xl mb-6 animate-float">🎭</div>
            <h3 className="text-xl font-semibold mb-4 text-gradient-primary">AI-Generated Stories</h3>
            <p className="text-neutral-600 leading-relaxed">Dynamic narratives in Fantasy, Mystery, and Sci-Fi genres that adapt to your unique choices</p>
            <div className="mt-4 w-12 h-1 bg-gradient-to-r from-sage-400 to-ocean-400 rounded-full mx-auto"></div>
          </div>
          
          <div className="card-floating p-8 text-center group">
            <div className="text-4xl mb-6 animate-float" style={{ animationDelay: '0.5s' }}>📊</div>
            <h3 className="text-xl font-semibold mb-4 text-gradient-primary">Choice Analytics</h3>
            <p className="text-neutral-600 leading-relaxed">See how your decisions compare to millions of other players and discover your patterns</p>
            <div className="mt-4 w-12 h-1 bg-gradient-to-r from-warm-400 to-accent-coral rounded-full mx-auto"></div>
          </div>
          
          <div className="card-floating p-8 text-center group">
            <div className="text-4xl mb-6 animate-float" style={{ animationDelay: '1s' }}>🏆</div>
            <h3 className="text-xl font-semibold mb-4 text-gradient-primary">Collect Endings</h3>
            <p className="text-neutral-600 leading-relaxed">Discover rare story endings and build your collection of unique narrative experiences</p>
            <div className="mt-4 w-12 h-1 bg-gradient-to-r from-accent-purple to-accent-lavender rounded-full mx-auto"></div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 glass p-6 rounded-2xl max-w-md animate-pulse-soft">
          <p className="text-sm text-neutral-600 mb-2">Join thousands of storytellers</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-gradient-to-br from-sage-300 to-ocean-300 rounded-full border-2 border-white"></div>
              ))}
            </div>
            <span className="text-sm text-neutral-500 ml-3">+12,847 active players</span>
          </div>
        </div>
      </div>
    </div>
  )
}