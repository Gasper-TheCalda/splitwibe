import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardContent from './DashboardContent'

export default async function DashboardPage() {
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

  // Fetch groups the user is a member of
  const { data: userGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = userGroups?.map((ug) => ug.group_id) || []

  // Fetch group details with member counts
  let groups: any[] = []
  if (groupIds.length > 0) {
    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name, description, created_at')
      .in('id', groupIds)
      .order('created_at', { ascending: false })

    if (groupsData) {
      // Fetch member counts for each group
      const groupsWithCounts = await Promise.all(
        groupsData.map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          return {
            ...group,
            member_count: count || 0,
          }
        })
      )

      groups = groupsWithCounts
    }
  }

  return <DashboardContent profile={profile} groups={groups} />
}
