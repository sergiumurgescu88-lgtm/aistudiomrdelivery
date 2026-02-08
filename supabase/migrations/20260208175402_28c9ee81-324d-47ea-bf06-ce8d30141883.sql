
-- ============================================================
-- FIX 1: Change ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- ============================================================

-- activity_logs
DROP POLICY IF EXISTS "Admins can insert any logs" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can view own logs" ON activity_logs;

CREATE POLICY "Admins can insert any logs" ON activity_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all logs" ON activity_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own logs" ON activity_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own logs" ON activity_logs AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- credit_transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;

CREATE POLICY "Admins can view all transactions" ON credit_transactions AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own transactions" ON credit_transactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON credit_transactions AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "No direct profile deletion" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Admins can update all profiles" ON profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all profiles" ON profiles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "No direct profile deletion" ON profiles AS PERMISSIVE FOR DELETE TO authenticated USING (false);
CREATE POLICY "Users can update own profile" ON profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON profiles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Admins can manage roles" ON user_roles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all roles" ON user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- FIX 3: Create atomic credit deduction function (SECURITY DEFINER)
-- Uses auth.uid() internally so users can only deduct their own credits
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_credit(
  p_amount integer DEFAULT 1,
  p_reason text DEFAULT 'AI usage'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile RECORD;
  v_free_used integer;
  v_purchased_used integer;
  v_new_free integer;
  v_new_purchased integer;
  v_new_credits integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Lock the row to prevent race conditions
  SELECT free_credits, purchased_credits, credits, account_status, daily_usage, account_tier, last_usage_date
  INTO v_profile
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_profile.account_status != 'ACTIVE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account not active');
  END IF;

  IF v_profile.credits < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Check daily limit
  DECLARE
    v_daily_limit integer := CASE WHEN v_profile.account_tier = 'PREMIUM' THEN 100 ELSE 10 END;
    v_current_usage integer := CASE 
      WHEN (now() - v_profile.last_usage_date) > interval '1 day' THEN 0 
      ELSE v_profile.daily_usage 
    END;
  BEGIN
    IF v_current_usage >= v_daily_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'Daily limit reached');
    END IF;
  END;

  -- Deduct from free credits first, then purchased
  IF v_profile.free_credits >= p_amount THEN
    v_free_used := p_amount;
    v_purchased_used := 0;
  ELSE
    v_free_used := v_profile.free_credits;
    v_purchased_used := p_amount - v_free_used;
  END IF;

  v_new_free := v_profile.free_credits - v_free_used;
  v_new_purchased := v_profile.purchased_credits - v_purchased_used;
  v_new_credits := v_new_free + v_new_purchased;

  UPDATE profiles
  SET free_credits = v_new_free,
      purchased_credits = v_new_purchased,
      credits = v_new_credits,
      daily_usage = CASE 
        WHEN (now() - v_profile.last_usage_date) > interval '1 day' THEN 1 
        ELSE v_profile.daily_usage + 1 
      END,
      total_generations = total_generations + 1,
      last_usage_date = now()
  WHERE user_id = v_user_id;

  -- Log the transaction
  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
  VALUES (v_user_id, 'usage', -p_amount, v_new_credits, p_reason);

  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', v_new_credits,
    'deducted', p_amount
  );
END;
$$;
