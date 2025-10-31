'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type JoinGroupResult = {
  success: boolean
  error?: string
  groupId?: string
  groupName?: string
}

export async function joinGroup(inviteCode: string): Promise<JoinGroupResult> {
  try {
    // Get the current user from the regular client
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Normalize the invite code
    const normalizedCode = inviteCode.trim().toUpperCase()

    if (normalizedCode.length !== 8) {
      return { success: false, error: 'Invite code must be 8 characters' }
    }

    // Create a service role client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the group by invite code
    const { data: group, error: groupError } = await serviceClient
      .from('groups')
      .select('id, name')
      .eq('invite_code', normalizedCode)
      .single()

    if (groupError || !group) {
      return { success: false, error: 'Invalid invite code' }
    }

    // Check if user is already a member
    const { data: existingMember } = await serviceClient
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return { success: false, error: 'You are already a member of this group' }
    }

    // Add user to the group
    const { error: memberError } = await serviceClient
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
      })

    if (memberError) {
      console.error('Error adding member:', memberError)
      return { success: false, error: 'Failed to join group' }
    }

    return {
      success: true,
      groupId: group.id,
      groupName: group.name,
    }
  } catch (err) {
    console.error('Unexpected error in joinGroup:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
