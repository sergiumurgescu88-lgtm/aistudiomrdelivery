-- Fix Issue #3: Add INSERT policy for profiles table
-- Profiles are created by the handle_new_user trigger (SECURITY DEFINER),
-- but we add a restrictive INSERT policy for defense-in-depth
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);