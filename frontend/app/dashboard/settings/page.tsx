import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsContent from './SettingsContent'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  return <SettingsContent profile={profile} />
}
