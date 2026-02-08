import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  credits_affected: number;
  created_at: string;
}

export const useActivityLogs = (adminMode = false) => {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!adminMode || !isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as ActivityLog[]);
    }
    setIsLoading(false);
  }, [user, adminMode, isAdmin]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, isLoading, refreshLogs: fetchLogs };
};
