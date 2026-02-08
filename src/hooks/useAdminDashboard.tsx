import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, Profile } from './useAuth';

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  credits_affected: number;
  created_at: string;
}

export interface AdminFilters {
  search: string;
  status: 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  tier: 'ALL' | 'FREE' | 'PREMIUM';
  balanceRange: 'ALL' | 'ZERO' | 'LOW' | 'MEDIUM' | 'HIGH';
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export interface DashboardMetrics {
  totalAccounts: number;
  newThisMonth: number;
  totalCreditsConsumed: number;
  freeCreditsDistributed: number;
  premiumUsers: number;
  activeUsers: number;
}

export const useAdminDashboard = () => {
  const { isAdmin } = useAuth();

  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const [filters, setFilters] = useState<AdminFilters>({
    search: '',
    status: 'ALL',
    tier: 'ALL',
    balanceRange: 'ALL',
    sortBy: 'created_at',
    sortDir: 'desc',
  });

  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);

    const [usersRes, transRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    if (usersRes.data) setUsers(usersRes.data as Profile[]);
    if (transRes.data) setTransactions(transRes.data as CreditTransaction[]);
    if (logsRes.data) setActivityLogs(logsRes.data as ActivityLog[]);
    setIsLoading(false);
  }, [isAdmin]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!isAdmin) return;

    fetchData();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(u => u.user_id === (payload.new as Profile).user_id ? payload.new as Profile : u));
        } else if (payload.eventType === 'INSERT') {
          setUsers(prev => [payload.new as Profile, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'credit_transactions' }, (payload) => {
        setTransactions(prev => [payload.new as CreditTransaction, ...prev.slice(0, 499)]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setActivityLogs(prev => [payload.new as ActivityLog, ...prev.slice(0, 499)]);
      })
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : status === 'CLOSED' ? 'disconnected' : 'connecting');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchData]);

  // Computed metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalAccounts: users.length,
      newThisMonth: users.filter(u => new Date(u.created_at) >= monthStart).length,
      totalCreditsConsumed: transactions
        .filter(t => t.type === 'usage')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      freeCreditsDistributed: transactions
        .filter(t => t.type === 'bonus')
        .reduce((sum, t) => sum + t.amount, 0),
      premiumUsers: users.filter(u => u.account_tier === 'PREMIUM').length,
      activeUsers: users.filter(u => {
        if (!u.last_login) return false;
        const lastLogin = new Date(u.last_login);
        return (now.getTime() - lastLogin.getTime()) < 7 * 24 * 60 * 60 * 1000;
      }).length,
    };
  }, [users, transactions]);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.user_id.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.status !== 'ALL') {
      result = result.filter(u => u.account_status === filters.status);
    }

    // Tier filter
    if (filters.tier !== 'ALL') {
      result = result.filter(u => u.account_tier === filters.tier);
    }

    // Balance range filter
    if (filters.balanceRange !== 'ALL') {
      result = result.filter(u => {
        switch (filters.balanceRange) {
          case 'ZERO': return u.credits === 0;
          case 'LOW': return u.credits > 0 && u.credits <= 10;
          case 'MEDIUM': return u.credits > 10 && u.credits <= 50;
          case 'HIGH': return u.credits > 50;
          default: return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      const key = filters.sortBy as keyof Profile;
      const aVal = a[key];
      const bVal = b[key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return filters.sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return filters.sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return result;
  }, [users, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  // Credit usage trend data (last 30 days)
  const creditTrendData = useMemo(() => {
    const days = 30;
    const now = new Date();
    const data: { date: string; usage: number; bonus: number; purchase: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayTx = transactions.filter(t => t.created_at.startsWith(dateStr));
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        usage: dayTx.filter(t => t.type === 'usage').reduce((s, t) => s + Math.abs(t.amount), 0),
        bonus: dayTx.filter(t => t.type === 'bonus').reduce((s, t) => s + t.amount, 0),
        purchase: dayTx.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0),
      });
    }
    return data;
  }, [transactions]);

  // Top users by usage
  const topUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => b.total_generations - a.total_generations)
      .slice(0, 10);
  }, [users]);

  // Grant credits to a user
  const grantCredits = useCallback(async (userId: string, amount: number, reason: string) => {
    if (!isAdmin) return;

    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;

    const newFreeCredits = targetUser.free_credits + amount;
    const newCredits = newFreeCredits + targetUser.purchased_credits;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        free_credits: newFreeCredits,
        credits: newCredits,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log the transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'bonus' as const,
      amount,
      balance_after: newCredits,
      description: `Admin grant: ${reason}`,
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      user_name: targetUser.full_name,
      action: 'ADMIN_CREDIT_GRANT',
      details: `Granted ${amount} credits: ${reason}`,
      credits_affected: amount,
    });
  }, [isAdmin, users]);

  // Bulk grant credits
  const bulkGrantCredits = useCallback(async (userIds: string[], amount: number, reason: string) => {
    if (!isAdmin) return;

    for (const userId of userIds) {
      await grantCredits(userId, amount, reason);
    }
  }, [isAdmin, grantCredits]);

  // Update account status
  const updateAccountStatus = useCallback(async (userId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    if (!isAdmin) return;

    const { error } = await supabase
      .from('profiles')
      .update({ account_status: status })
      .eq('user_id', userId);

    if (error) throw error;

    const targetUser = users.find(u => u.user_id === userId);
    await supabase.from('activity_logs').insert({
      user_id: userId,
      user_name: targetUser?.full_name || '',
      action: status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_ACTIVATED',
      details: `Account ${status.toLowerCase()} by admin`,
      credits_affected: 0,
    });
  }, [isAdmin, users]);

  // Export to CSV
  const exportToCsv = useCallback((dataType: 'users' | 'transactions' | 'logs') => {
    let csvContent = '';
    let filename = '';

    if (dataType === 'users') {
      csvContent = 'User ID,Name,Email,Tier,Status,Credits,Free Credits,Purchased Credits,Total Generations,Created At\n';
      filteredUsers.forEach(u => {
        csvContent += `${u.user_id},"${u.full_name}","${u.email}",${u.account_tier},${u.account_status},${u.credits},${u.free_credits},${u.purchased_credits},${u.total_generations},${u.created_at}\n`;
      });
      filename = 'users_export.csv';
    } else if (dataType === 'transactions') {
      csvContent = 'ID,User ID,Type,Amount,Balance After,Description,Created At\n';
      transactions.forEach(t => {
        csvContent += `${t.id},${t.user_id},${t.type},${t.amount},${t.balance_after},"${t.description}",${t.created_at}\n`;
      });
      filename = 'transactions_export.csv';
    } else {
      csvContent = 'ID,User ID,User Name,Action,Details,Credits Affected,Created At\n';
      activityLogs.forEach(l => {
        csvContent += `${l.id},${l.user_id},"${l.user_name}","${l.action}","${l.details}",${l.credits_affected},${l.created_at}\n`;
      });
      filename = 'activity_logs_export.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredUsers, transactions, activityLogs]);

  return {
    users: paginatedUsers,
    allUsers: users,
    filteredUsers,
    transactions,
    activityLogs,
    metrics,
    creditTrendData,
    topUsers,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    pageSize,
    isLoading,
    connectionStatus,
    fetchData,
    grantCredits,
    bulkGrantCredits,
    updateAccountStatus,
    exportToCsv,
  };
};
