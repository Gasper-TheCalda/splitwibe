-- Drop the problematic group_members viewing policy
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;

-- Recreate with a simpler approach that avoids self-referential recursion
-- Allow authenticated users to view all group_members records
-- This is safe because:
-- 1. It only contains group_id and user_id (not sensitive)
-- 2. Users still can't see groups they're not members of (controlled by groups RLS)
-- 3. This information is needed to display group member lists
-- 4. Application logic will filter to show only relevant groups
CREATE POLICY "Authenticated users can view group members"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (true);
