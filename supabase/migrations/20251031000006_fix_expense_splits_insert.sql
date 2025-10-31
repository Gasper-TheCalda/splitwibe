-- Drop the restrictive expense_splits INSERT policy
DROP POLICY IF EXISTS "Expense creators can create splits" ON public.expense_splits;

-- Create a new policy that allows any group member to create splits
-- This enables users to add expenses on behalf of other group members
CREATE POLICY "Group members can create splits"
  ON public.expense_splits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      INNER JOIN public.group_members ON group_members.group_id = expenses.group_id
      WHERE expenses.id = expense_splits.expense_id
        AND group_members.user_id = auth.uid()
    )
  );

-- Also update the UPDATE and DELETE policies for consistency
DROP POLICY IF EXISTS "Expense creators can update splits" ON public.expense_splits;
DROP POLICY IF EXISTS "Expense creators can delete splits" ON public.expense_splits;

CREATE POLICY "Group members can update splits"
  ON public.expense_splits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      INNER JOIN public.group_members ON group_members.group_id = expenses.group_id
      WHERE expenses.id = expense_splits.expense_id
        AND group_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses
      INNER JOIN public.group_members ON group_members.group_id = expenses.group_id
      WHERE expenses.id = expense_splits.expense_id
        AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can delete splits"
  ON public.expense_splits
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses
      INNER JOIN public.group_members ON group_members.group_id = expenses.group_id
      WHERE expenses.id = expense_splits.expense_id
        AND group_members.user_id = auth.uid()
    )
  );
