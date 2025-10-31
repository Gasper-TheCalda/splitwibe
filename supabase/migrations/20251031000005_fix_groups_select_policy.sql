-- Drop the existing policy that only allows viewing groups where user is a member
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- Create a new policy that allows viewing groups where:
-- 1. User is a member (in group_members), OR
-- 2. User is the creator (created_by)
-- This allows creators to see groups immediately after creation, before being added to group_members
CREATE POLICY "Users can view their groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    -- User created the group
    auth.uid() = created_by
    OR
    -- User is a member of the group
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
    )
  );
