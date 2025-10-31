-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Allow users to view their own profile
-- This policy allows a user to SELECT their own row from the profiles table
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to view profiles of other users in their groups
-- This checks if there exists at least one group where both users are members
-- Useful for displaying group member information
CREATE POLICY "Users can view profiles of users in their groups"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm1
      INNER JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = profiles.id
    )
  );

-- Allow users to update only their own profile
-- Users can modify their display_name, but email is synced from auth.users
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: INSERT and DELETE are handled by triggers and cascade deletes
-- Users cannot directly insert or delete profiles

-- ============================================================================
-- GROUPS POLICIES
-- ============================================================================

-- Allow users to view groups they are members of
-- This joins with group_members to check membership
CREATE POLICY "Users can view groups they are members of"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
    )
  );

-- Allow any authenticated user to create a group
-- The created_by field will be set to their user ID
CREATE POLICY "Authenticated users can create groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow group creator to update their group
-- Only the user who created the group can modify it
CREATE POLICY "Group creators can update their groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow group creator to delete their group
-- When deleted, all group_members and expenses cascade delete automatically
CREATE POLICY "Group creators can delete their groups"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- ============================================================================
-- GROUP_MEMBERS POLICIES
-- ============================================================================

-- Allow users to view members of groups they belong to
-- Users can see who else is in their groups
CREATE POLICY "Users can view members of their groups"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

-- Allow users to join a group (add themselves as a member)
-- Application logic must validate the invite code before insertion
-- Users can only insert themselves, not other users
CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to remove themselves from a group
-- Users can leave any group they're a member of
CREATE POLICY "Users can leave groups"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow group creators to remove any member
-- This checks if the current user created the group, then allows deletion of any member
CREATE POLICY "Group creators can remove members"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
        AND groups.created_by = auth.uid()
    )
  );

-- ============================================================================
-- EXPENSES POLICIES
-- ============================================================================

-- Allow users to view expenses from groups they are members of
-- Users see all expenses in their groups regardless of who paid
CREATE POLICY "Users can view expenses in their groups"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = expenses.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- Allow users to create expenses in groups they are members of
-- The user must be a member of the group to add an expense
-- The paid_by field can be any group member (someone might add an expense on behalf of another)
CREATE POLICY "Users can create expenses in their groups"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = expenses.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- Allow users to update expenses they created (where they are the payer)
-- Only the person who paid can modify the expense details
CREATE POLICY "Users can update expenses they created"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = paid_by)
  WITH CHECK (auth.uid() = paid_by);

-- Allow users to delete expenses they created
-- Only the payer can delete an expense, which cascades to expense_splits
CREATE POLICY "Users can delete expenses they created"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = paid_by);

-- ============================================================================
-- EXPENSE_SPLITS POLICIES
-- ============================================================================

-- Allow users to view splits for expenses in their groups
-- Users can see how expenses are divided among group members
CREATE POLICY "Users can view splits in their groups"
  ON public.expense_splits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      INNER JOIN public.group_members ON group_members.group_id = expenses.group_id
      WHERE expenses.id = expense_splits.expense_id
        AND group_members.user_id = auth.uid()
    )
  );

-- Allow expense creation to insert splits
-- This policy allows the person who created the expense to insert splits
-- Used when creating equal splits for all group members
CREATE POLICY "Expense creators can create splits"
  ON public.expense_splits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_splits.expense_id
        AND expenses.paid_by = auth.uid()
    )
  );

-- Allow expense owners to update splits
-- Only the person who paid for the expense can modify the split amounts
CREATE POLICY "Expense creators can update splits"
  ON public.expense_splits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_splits.expense_id
        AND expenses.paid_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_splits.expense_id
        AND expenses.paid_by = auth.uid()
    )
  );

-- Allow expense owners to delete splits
-- When an expense is deleted, splits cascade delete automatically
-- This allows manual deletion/recreation if needed
CREATE POLICY "Expense creators can delete splits"
  ON public.expense_splits
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE expenses.id = expense_splits.expense_id
        AND expenses.paid_by = auth.uid()
    )
  );

-- ============================================================================
-- SETTLEMENTS POLICIES
-- ============================================================================

-- Allow users to view settlements in their groups
-- Users can see all settlement records within groups they belong to
CREATE POLICY "Users can view settlements in their groups"
  ON public.settlements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = settlements.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- Allow users to create settlements where they are paying (from_user)
-- Users can mark that they paid someone else in a group they're both in
-- Application logic should validate that both users are in the group
CREATE POLICY "Users can create settlements they are paying"
  ON public.settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = settlements.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- Allow users to delete settlements they created (as the payer)
-- Users can undo settlement records they created if they made a mistake
CREATE POLICY "Users can delete settlements they created"
  ON public.settlements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = from_user);

-- Allow recipients to delete settlements too (optional)
-- If someone marked a payment to you, you can delete it if incorrect
-- This prevents disputes by allowing both parties to manage settlements
CREATE POLICY "Settlement recipients can delete settlements"
  ON public.settlements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = to_user);
