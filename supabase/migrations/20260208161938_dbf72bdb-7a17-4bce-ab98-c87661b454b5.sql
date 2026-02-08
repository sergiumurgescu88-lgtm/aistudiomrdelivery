-- Prevent all DELETE operations on profiles (use soft deletes at app level instead)
CREATE POLICY "No direct profile deletion"
ON public.profiles
FOR DELETE
USING (false);