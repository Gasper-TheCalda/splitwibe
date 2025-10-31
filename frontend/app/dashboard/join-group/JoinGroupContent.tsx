'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { joinGroup } from '@/app/actions/groups'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/AppHeader'

export default function JoinGroupContent() {
  const searchParams = useSearchParams()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joinedGroup, setJoinedGroup] = useState<{ id: string; name: string } | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        setDisplayName(profile?.display_name || null)
      }
    }
    fetchProfile()
  }, [supabase])

  // Pre-fill invite code from query parameter
  useEffect(() => {
    const codeFromParam = searchParams.get('code')
    if (codeFromParam) {
      setInviteCode(codeFromParam.toUpperCase())
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await joinGroup(inviteCode)

      if (!result.success) {
        setError(result.error || 'Failed to join group')
      } else {
        setJoinedGroup({
          id: result.groupId!,
          name: result.groupName!,
        })
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (joinedGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <AppHeader
          displayName={displayName}
          showBackButton={true}
        />

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              {/* Success Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the group!</h2>
              <p className="text-gray-600 mb-6">You've successfully joined <span className="font-semibold">{joinedGroup.name}</span></p>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  href={`/dashboard/groups/${joinedGroup.id}`}
                  className="block w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition"
                >
                  View Group
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <AppHeader
        displayName={displayName}
        showBackButton={true}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Join a Group</h1>
          <p className="text-gray-600 mt-1">Enter an invite code to join an existing group</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="inviteCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Invite Code *
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400 text-center text-2xl font-bold tracking-widest uppercase"
                placeholder="ABC12345"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the 8-character invite code shared with you
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || inviteCode.length !== 8}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-indigo-900 mb-1">Need an invite code?</h4>
              <p className="text-sm text-indigo-700">
                Ask a group member to share their invite code with you, or request an invite link.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
