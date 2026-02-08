import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, Profile } from './useAuth';

export const useAdminUsers = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setIsLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserCredits = useCallback(async (userId: string, amount: number) => {
    if (!isAdmin) return;

    // Find the user
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;

    const newPurchased = Math.max(0, targetUser.purchased_credits + amount);
    const newCredits = targetUser.free_credits + newPurchased;

    const { error } = await supabase
      .from('profiles')
      .update({
        purchased_credits: newPurchased,
        credits: newCredits,
      })
      .eq('user_id', userId);

    if (!error) {
      await fetchUsers();
    }
  }, [isAdmin, users, fetchUsers]);

  return { users, isLoading, fetchUsers, updateUserCredits };
};
