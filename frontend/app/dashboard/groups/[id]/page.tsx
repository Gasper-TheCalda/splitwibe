import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupContent, { Expense, Member } from './GroupContent'

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
    .overrideTypes<Member[]>()

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
    .overrideTypes<Expense[]>()

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

  // Fetch settlements
  const { data: settlements } = await supabase
    .from('settlements')
    .select('from_user, to_user, amount')
    .eq('group_id', id)

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

    // Add settlements received
    settlements?.forEach((settlement) => {
      if (settlement.to_user === userId) {
        balances[userId] += Number(settlement.amount)
      }
    })

    // Subtract settlements paid
    settlements?.forEach((settlement) => {
      if (settlement.from_user === userId) {
        balances[userId] -= Number(settlement.amount)
      }
    })
  })

  const currentUserBalance = balances[user.id] || 0
  const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

  // Calculate pairwise balances between current user and each member
  // Positive = current user is owed money by this member
  // Negative = current user owes money to this member
  const memberBalances = members?.map((member) => {
    const memberId = member.user_id
    let pairwiseBalance = 0

    // Skip if this is the current user
    if (memberId === user.id) {
      return {
        userId: memberId,
        displayName: member.profiles?.display_name || member.profiles?.email?.split('@')[0] || 'Unknown',
        balance: 0,
      }
    }

    // Calculate what member owes current user from expenses current user paid
    allSplits.forEach((split) => {
      const expense = expenses?.find((e) => e.id === split.expense_id)
      if (expense && expense.paid_by === user.id && split.user_id === memberId) {
        pairwiseBalance += Number(split.amount_owed)
      }
    })

    // Subtract what current user owes member from expenses member paid
    allSplits.forEach((split) => {
      const expense = expenses?.find((e) => e.id === split.expense_id)
      if (expense && expense.paid_by === memberId && split.user_id === user.id) {
        pairwiseBalance -= Number(split.amount_owed)
      }
    })

    // Adjust for settlements between current user and this member
    settlements?.forEach((settlement) => {
      if (settlement.from_user === user.id && settlement.to_user === memberId) {
        // Current user paid this member
        pairwiseBalance += Number(settlement.amount)
      }
      if (settlement.from_user === memberId && settlement.to_user === user.id) {
        // This member paid current user
        pairwiseBalance -= Number(settlement.amount)
      }
    })

    return {
      userId: memberId,
      displayName: member.profiles?.display_name || member.profiles?.email?.split('@')[0] || 'Unknown',
      balance: pairwiseBalance,
    }
  }).filter((m) => m.userId !== user.id) || []

  return (
    <GroupContent
      group={group}
      members={members || []}
      expenses={expenses || []}
      currentUserBalance={currentUserBalance}
      totalExpenses={totalExpenses}
      currentUserId={user.id}
      currentUserProfile={currentUserProfile}
      memberBalances={memberBalances}
    />
  )
}
