-- Create function to recalculate expense splits when a new member joins
CREATE OR REPLACE FUNCTION public.recalculate_expense_splits()
RETURNS TRIGGER AS $$
DECLARE
  expense_record RECORD;
  member_record RECORD;
  member_count INTEGER;
  split_amount NUMERIC(10, 2);
BEGIN
  -- Get the count of members in the group (including the new member)
  SELECT COUNT(*) INTO member_count
  FROM public.group_members
  WHERE group_id = NEW.group_id;

  -- Loop through all expenses in this group
  FOR expense_record IN
    SELECT id, amount
    FROM public.expenses
    WHERE group_id = NEW.group_id
  LOOP
    -- Delete existing splits for this expense
    DELETE FROM public.expense_splits
    WHERE expense_id = expense_record.id;

    -- Calculate new split amount
    split_amount := expense_record.amount / member_count;

    -- Create new splits for all current members (including the new one)
    FOR member_record IN
      SELECT user_id
      FROM public.group_members
      WHERE group_id = NEW.group_id
    LOOP
      INSERT INTO public.expense_splits (expense_id, user_id, amount_owed)
      VALUES (expense_record.id, member_record.user_id, split_amount);
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after a new member is added to a group
CREATE TRIGGER recalculate_splits_on_member_join
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_expense_splits();

-- Comment for documentation
COMMENT ON FUNCTION public.recalculate_expense_splits() IS 'Recalculates all expense splits in a group when a new member joins, ensuring equal distribution among all current members';
