import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCredits = () => {
  const { profile, refreshProfile, user } = useAuth();

  const chargeCredit = useCallback(async (action: string, details: string) => {
    if (!profile || !user) throw new Error('Not authenticated');

    if (profile.account_status !== 'ACTIVE') {
      throw new Error('Account not active. Please verify your email.');
    }

    // Check daily limit
    const now = new Date();
    const lastUsage = new Date(profile.last_usage_date);
    let currentDailyUsage = profile.daily_usage;
    if (now.getTime() - lastUsage.getTime() > 24 * 60 * 60 * 1000) {
      currentDailyUsage = 0;
    }

    const dailyLimit = profile.account_tier === 'PREMIUM' ? 100 : 10;
    if (currentDailyUsage >= dailyLimit) {
      throw new Error('Daily limit reached. Upgrade for more!');
    }

    // Deduct credit
    let newFree = profile.free_credits;
    let newPurchased = profile.purchased_credits;
    let deductedFrom = '';

    if (newFree > 0) {
      newFree--;
      deductedFrom = 'Free';
    } else if (newPurchased > 0) {
      newPurchased--;
      deductedFrom = 'Purchased';
    } else {
      throw new Error('Out of credits! Purchase a package.');
    }

    const newTier = newPurchased > 0 ? 'PREMIUM' : 'FREE';
    const newCredits = newFree + newPurchased;

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        free_credits: newFree,
        purchased_credits: newPurchased,
        credits: newCredits,
        total_generations: profile.total_generations + 1,
        daily_usage: currentDailyUsage + 1,
        last_usage_date: now.toISOString(),
        account_tier: newTier as 'FREE' | 'PREMIUM',
      })
      .eq('user_id', user.id);

    if (profileError) throw profileError;

    // Log the transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      type: 'usage' as const,
      amount: -1,
      balance_after: newCredits,
      description: `${action}: ${details} (${deductedFrom})`,
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_name: profile.full_name,
      action,
      details: `${details} (${deductedFrom})`,
      credits_affected: -1,
    });

    await refreshProfile();
    return { creditsRemaining: newCredits, deductedFrom };
  }, [profile, user, refreshProfile]);

  const purchaseCredits = useCallback(async (credits: number) => {
    if (!profile || !user) throw new Error('Not authenticated');

    if (profile.account_status !== 'ACTIVE') {
      throw new Error('Please verify email first.');
    }

    const newPurchased = profile.purchased_credits + credits;
    const newCredits = profile.free_credits + newPurchased;

    const { error } = await supabase
      .from('profiles')
      .update({
        purchased_credits: newPurchased,
        credits: newCredits,
        account_tier: 'PREMIUM' as const,
      })
      .eq('user_id', user.id);

    if (error) throw error;

    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      type: 'purchase' as const,
      amount: credits,
      balance_after: newCredits,
      description: `Credit Package: ${credits} credits`,
    });

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_name: profile.full_name,
      action: 'PURCHASE',
      details: `Credit Package: ${credits} credits`,
      credits_affected: credits,
    });

    await refreshProfile();
  }, [profile, user, refreshProfile]);

  return { chargeCredit, purchaseCredits, profile };
};
