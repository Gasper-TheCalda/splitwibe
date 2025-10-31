import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupContent from './GroupContent'

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch group details
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name, description, invite_code, created_by')
    .eq('id', id)
    .single()

  if (groupError || !group) {
    notFound()
  }

  // Verify user is a member
  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // Fetch current user's profile
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  // Fetch group members
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, display_name, email)')
    .eq('group_id', id)

  // Fetch expenses with splits
  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      id,
      description,
      amount,
      date,
      paid_by,
      created_at,
      profiles(display_name, email)
    `)
    .eq('group_id', id)
    .order('date', { ascending: false })

  // Fetch all expense splits for this group
  const expenseIds = expenses?.map((e) => e.id) || []
  let allSplits: any[] = []

  if (expenseIds.length > 0) {
    const { data: splits } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount_owed')
      .in('expense_id', expenseIds)

    allSplits = splits || []
  }

  // Calculate balances
  const balances: Record<string, number> = {}
  members?.forEach((member) => {
    const userId = member.user_id
    balances[userId] = 0

    // Add amounts they paid
    expenses?.forEach((expense) => {
      if (expense.paid_by === userId) {
        balances[userId] += Number(expense.amount)
      }
    })

    // Subtract amounts they owe
    allSplits.forEach((split) => {
      if (split.user_id === userId) {
        balances[userId] -= Number(split.amount_owed)
      }
    })
  })

  const currentUserBalance = balances[user.id] || 0
  const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

  return (
    <GroupContent
      group={group}
      members={members || []}
      expenses={expenses || []}
      currentUserBalance={currentUserBalance}
      totalExpenses={totalExpenses}
      currentUserId={user.id}
      currentUserProfile={currentUserProfile}
    />
  )
}
