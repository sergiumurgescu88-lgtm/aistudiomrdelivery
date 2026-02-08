import React from 'react';
import { Users, TrendingUp, Coins, Gift, Crown, Activity } from 'lucide-react';
import { DashboardMetrics } from '@/hooks/useAdminDashboard';

interface AdminMetricsProps {
  metrics: DashboardMetrics;
}

const AdminMetrics: React.FC<AdminMetricsProps> = ({ metrics }) => {
  const cards = [
    { label: 'Total Accounts', value: metrics.totalAccounts, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'New This Month', value: metrics.newThisMonth, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Credits Consumed', value: metrics.totalCreditsConsumed, icon: Coins, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Free Distributed', value: metrics.freeCreditsDistributed, icon: Gift, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Premium Users', value: metrics.premiumUsers, icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Active (7d)', value: metrics.activeUsers, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`${card.bg} border ${card.border} p-5 rounded-2xl transition-all hover:scale-[1.02] group backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between mb-3">
            <card.icon size={18} className={`${card.color} group-hover:scale-110 transition-transform`} />
          </div>
          <div className={`text-2xl font-serif font-bold text-white`}>{card.value.toLocaleString()}</div>
          <div className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em] mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default AdminMetrics;
