'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppHeader from '@/components/AppHeader'

type Group = {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_by: string
}

export type Member = {
  user_id: string
  profiles: {
    id: string
    display_name: string | null
    email: string
  } | null
}

export type Expense = {
  id: string
  description: string
  amount: string
  date: string
  paid_by: string
  created_at: string
  profiles: {
    display_name: string | null
    email: string
  } | null
}

type Profile = {
  display_name: string | null
  email: string
}

type MemberBalance = {
  userId: string
  displayName: string
  balance: number
}

export default function GroupContent({
  group,
  members,
  expenses,
  currentUserBalance,
  totalExpenses,
  currentUserId,
  currentUserProfile,
  memberBalances,
}: {
  group: Group
  members: Member[]
  expenses: Expense[]
  currentUserBalance: number
  totalExpenses: number
  currentUserId: string
  currentUserProfile: Profile | null
  memberBalances: MemberBalance[]
}) {
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settlingUserId, setSettlingUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const amountNum = parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Amount must be a positive number')
      }

      // Create the expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: group.id,
          description,
          amount: amountNum,
          paid_by: paidBy,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (expenseError) throw expenseError

      // Calculate equal split
      const splitAmount = amountNum / members.length

      // Create expense splits for all members
      const splits = members.map((member) => ({
        expense_id: expense.id,
        user_id: member.user_id,
        amount_owed: splitAmount,
      }))

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splits)

      if (splitsError) throw splitsError

      // Reset form
      setDescription('')
      setAmount('')
      setPaidBy(currentUserId)
      setShowAddExpense(false)

      // Refresh the page
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const handleSettleBalance = async (toUserId: string, amount: number) => {
    setSettlingUserId(toUserId)

    try {
      const { error: settlementError } = await supabase
        .from('settlements')
        .insert({
          from_user: currentUserId,
          to_user: toUserId,
          group_id: group.id,
          amount: Math.abs(amount),
        })

      if (settlementError) throw settlementError

      // Refresh the page
      router.refresh()
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to record settlement')
    } finally {
      setSettlingUserId(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const displayName = currentUserProfile?.display_name || currentUserProfile?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <AppHeader
        displayName={displayName}
        showBackButton={true}
        title={group.name}
        subtitle={group.description || undefined}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Content - Expenses and Summary */}
          <div className="xl:col-span-3 space-y-6">
            {/* Balance Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Balance Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Your Balance</h3>
                <p className={`text-3xl font-bold ${currentUserBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentUserBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentUserBalance >= 0 ? 'You are owed' : 'You owe'}
                </p>
              </div>

              {/* Total Expenses */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Expenses</h3>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</p>
              </div>

              {/* Members */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Members</h3>
                <p className="text-3xl font-bold text-gray-900">{members.length}</p>
                <p className="text-xs text-gray-500 mt-1">Group members</p>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
                <button
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition"
                >
                  {showAddExpense ? 'Cancel' : 'Add Expense'}
                </button>
              </div>

              {/* Add Expense Form */}
              {showAddExpense && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Expense</h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        id="description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                        placeholder="Dinner, groceries, etc."
                      />
                    </div>

                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900 placeholder:text-gray-400"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-1">
                        Paid By *
                      </label>
                      <select
                        id="paidBy"
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900"
                      >
                        {members.map((member) => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.profiles?.display_name || member.profiles?.email || 'Unknown'}
                            {member.user_id === currentUserId ? ' (You)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                  </form>
                </div>
              )}

              {/* Expenses List */}
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No expenses yet</h3>
                  <p className="text-gray-600">Add your first expense to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => {
                    const payer = members.find((m) => m.user_id === expense.paid_by)
                    const payerName = payer?.profiles?.display_name || payer?.profiles?.email || 'Unknown'

                    return (
                      <div
                        key={expense.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{expense.description}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Paid by {payerName}
                              {expense.paid_by === currentUserId ? ' (You)' : ''}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(expense.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(Number(expense.amount))}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatCurrency(Number(expense.amount) / members.length)} per person
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Member Balances */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Balances</h2>
              <div className="space-y-3">
                {memberBalances
                  .filter((member) => member.userId !== currentUserId)
                  .map((member) => (
                    <div
                      key={member.userId}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {member.displayName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.balance === 0
                                ? 'Settled up'
                                : member.balance > 0
                                  ? 'They owe you'
                                  : 'You owe them'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${member.balance === 0
                                ? 'text-gray-500'
                                : member.balance > 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                          >
                            {formatCurrency(Math.abs(member.balance))}
                          </p>
                        </div>
                      </div>
                      {member.balance < 0 && (
                        <button
                          onClick={() => handleSettleBalance(member.userId, member.balance)}
                          disabled={settlingUserId === member.userId}
                          className="w-full mt-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {settlingUserId === member.userId ? 'Settling...' : 'Settle Up'}
                        </button>
                      )}
                    </div>
                  ))}
                {memberBalances.filter((m) => m.userId !== currentUserId).length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4">
                    No other members yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
