'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Profile = {
  display_name: string | null
  email: string
}

export default function DashboardContent({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Splitwibe</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {/* Avatar Circle */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold mb-4">
              {displayName.charAt(0).toUpperCase()}
            </div>

            {/* Welcome Message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {displayName}!
            </h2>
            <p className="text-gray-600 mb-8">{profile?.email}</p>

            {/* Action Cards */}
            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Group Card */}
              <Link
                href="/dashboard/create-group"
                className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-6 hover:shadow-lg hover:border-indigo-300 transition group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Create Group</h3>
                  <p className="text-sm text-gray-600">Start a new group and invite friends</p>
                </div>
              </Link>

              {/* Join Group Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 opacity-50 cursor-not-allowed">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Join Group</h3>
                  <p className="text-sm text-gray-600">Enter an invite code (Coming Soon)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
