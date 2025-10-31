'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AppHeaderProps = {
  displayName?: string | null
  showBackButton?: boolean
  backHref?: string
  title?: string
  subtitle?: string
}

export default function AppHeader({
  displayName,
  showBackButton = false,
  backHref = '/dashboard',
  title,
  subtitle,
}: AppHeaderProps) {
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white shadow-sm h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left side - Back button or Logo */}
          <div className="flex-shrink-0">
            {showBackButton ? (
              <Link
                href={backHref}
                className="inline-flex items-center text-gray-700 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </Link>
            ) : (
              <span className="text-2xl font-bold text-gray-900">Splitwibe</span>
            )}
          </div>

          {/* Center - Title */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            {title && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 text-center">{title}</h1>
                {subtitle && <p className="text-gray-600 text-sm text-center mt-1">{subtitle}</p>}
              </>
            )}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {displayName && (
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{displayName}</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
