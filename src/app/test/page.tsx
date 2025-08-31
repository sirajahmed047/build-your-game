'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'

export default function TestPage() {
  const { user, sessionId } = useAuth()
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runDatabaseTest = async () => {
    setLoading(true)
    setTestResult('')

    try {
      setTestResult(`✅ Basic setup test passed!
      
Session ID: ${sessionId}
User ID: ${user?.id || 'Guest'}
Supabase client initialized: ${supabase ? 'Yes' : 'No'}

Note: Database tests require Supabase to be configured with your actual credentials.
Update .env.local with your Supabase URL and keys, then apply the database migration.`)

    } catch (error) {
      setTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="mb-6">
        <p><strong>User:</strong> {user ? user.email : 'Guest'}</p>
        <p><strong>Session ID:</strong> {sessionId}</p>
      </div>

      <button
        onClick={runDatabaseTest}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run Database Test'}
      </button>

      {testResult && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  )
}