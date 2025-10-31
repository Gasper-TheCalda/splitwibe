'use client'

import Link from 'next/link'
import AppHeader from '@/components/AppHeader'

type Profile = {
  display_name: string | null
  email: string
}

type Group = {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count: number
}

export default function DashboardContent({
  profile,
  groups
}: {
  profile: Profile | null
  groups: Group[]
}) {
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <AppHeader displayName={displayName} />

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
            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
              <Link
                href="/dashboard/join-group"
                className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Join Group</h3>
                  <p className="text-sm text-gray-600">Enter an invite code to join</p>
                </div>
              </Link>
            </div>

            {/* Groups List */}
            <div className="max-w-2xl mx-auto text-left">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">My Groups</h3>
                <span className="text-sm text-gray-600">{groups.length} {groups.length === 1 ? 'group' : 'groups'}</span>
              </div>

              {groups.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <p className="text-gray-500">You're not in any groups yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/dashboard/groups/${group.id}`}
                      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                            {group.name}
                          </h4>
                          {group.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {group.description}
                            </p>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
