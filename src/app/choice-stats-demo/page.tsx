'use client'

import { useState } from 'react'
import { ChoiceStatistics } from '../../components/story/ChoiceStatistics'
import { PersonalityComparison } from '../../components/story/PersonalityComparison'
import { CronJobMonitor } from '../../components/admin/CronJobMonitor'
import type { PersonalityTraits } from '@/types/story'

const mockPersonalityTraits: PersonalityTraits = {
  riskTaking: 75,
  empathy: 45,
  pragmatism: 60,
  creativity: 80,
  leadership: 55
}

export default function ChoiceStatsDemoPage() {
  const [selectedDemo, setSelectedDemo] = useState<'statistics' | 'personality' | 'monitor'>('statistics')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choice Statistics & Analytics Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Explore the choice statistics and personality comparison features
          </p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setSelectedDemo('statistics')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedDemo === 'statistics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Choice Statistics
            </button>
            <button
              onClick={() => setSelectedDemo('personality')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedDemo === 'personality'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Personality Comparison
            </button>
            <button
              onClick={() => setSelectedDemo('monitor')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedDemo === 'monitor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cron Job Monitor
            </button>
          </div>
        </div>

        {selectedDemo === 'statistics' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Choice Statistics Demo</h2>
              <p className="text-gray-600 mb-6">
                This component shows global choice percentages and rarity indicators.
                In a real story, this would display after a player makes a choice.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium mb-4">Sample Story Choice: &quot;Trust the Stranger&quot;</h3>
                <ChoiceStatistics
                  choiceSlug="trust_stranger"
                  genre="fantasy"
                  selectedOptionId="A"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Features Implemented</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-green-800 mb-2">✅ Completed</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Choice aggregates tracking (impressions/selections)</li>
                    <li>• Backfill guards to prevent double-counting</li>
                    <li>• Public read policy on choice_aggregates</li>
                    <li>• Choice rarity calculation and display</li>
                    <li>• Personality comparison analytics</li>
                    <li>• Cron job for refreshing statistics</li>
                    <li>• Realtime updates support</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">🔧 Technical Details</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• PostgreSQL materialized views for performance</li>
                    <li>• Row Level Security for data isolation</li>
                    <li>• Automated cron job monitoring</li>
                    <li>• Graceful error handling</li>
                    <li>• Supabase Realtime integration</li>
                    <li>• React hooks for easy integration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedDemo === 'personality' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Personality Comparison Demo</h2>
            <p className="text-gray-600 mb-6">
              This component shows how a player&apos;s personality traits compare to global averages.
              It provides insights into decision-making patterns.
            </p>
            
            <PersonalityComparison
              currentTraits={mockPersonalityTraits}
            />
          </div>
        )}

        {selectedDemo === 'monitor' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Cron Job Monitor Demo</h2>
              <p className="text-gray-600 mb-6">
                This component monitors the health of the choice statistics refresh job.
                It shows success/error rates and allows manual refresh.
              </p>
            </div>
            
            <CronJobMonitor />
            
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-medium text-blue-800 mb-2">About the Cron Job</h3>
              <p className="text-sm text-blue-700">
                The cron job runs every 5 minutes to refresh the materialized view that powers
                choice statistics. This ensures users see up-to-date percentages while maintaining
                good performance through caching.
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Summary</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Database Layer</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• choice_aggregates table</li>
                <li>• choice_statistics view</li>
                <li>• Materialized view caching</li>
                <li>• RLS policies</li>
                <li>• Cron job monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-purple-800 mb-2">API Layer</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Increment functions</li>
                <li>• Statistics queries</li>
                <li>• Health monitoring</li>
                <li>• Error handling</li>
                <li>• Rate limiting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-800 mb-2">Frontend Layer</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• React hooks</li>
                <li>• Statistics components</li>
                <li>• Realtime updates</li>
                <li>• Backfill guards</li>
                <li>• Admin monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}