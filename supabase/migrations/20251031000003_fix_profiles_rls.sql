-- Drop the problematic profile viewing policy
DROP POLICY IF EXISTS "Users can view profiles of users in their groups" ON public.profiles;

-- Recreate with a simpler approach that avoids recursion
-- Allow users to view profiles of other authenticated users
-- This is safe because profiles only contain display_name and email (non-sensitive)
-- and we need this for displaying group member information
CREATE POLICY "Users can view other user profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Alternative approach if you want to be more restrictive:
-- Only allow viewing profiles when explicitly queried through group context
-- This would require application-level filtering instead of RLS
-- For now, we use the simpler approach above since profile data is not sensitive
