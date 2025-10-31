'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/AppHeader'

type Profile = {
  display_name: string | null
  email: string
}

export default function SettingsContent({ profile }: { profile: Profile | null }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [loading, setLoading] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <AppHeader
        displayName={profile?.display_name}
        showBackButton={true}
      />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Profile Info Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                Profile updated successfully!
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter your display name"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
