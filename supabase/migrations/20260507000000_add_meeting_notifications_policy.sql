-- Allow authenticated users to insert notifications (e.g. for meeting invitations)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.staff_notifications;
CREATE POLICY "Users can insert notifications"
ON public.staff_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update notifications they created or are invited to (specifically to mark them as read)
DROP POLICY IF EXISTS "Users can update/delete their own notifications" ON public.staff_notifications;
DROP POLICY IF EXISTS "Users can manage their relevant notifications" ON public.staff_notifications;
CREATE POLICY "Users can manage their relevant notifications"
ON public.staff_notifications FOR ALL
TO authenticated
USING (created_by = auth.uid() OR auth.uid() = ANY(target_users))
WITH CHECK (created_by = auth.uid() OR auth.uid() = ANY(target_users));
