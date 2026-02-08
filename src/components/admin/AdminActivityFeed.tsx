import React from 'react';
import { Clock, Coins, UserPlus, Zap } from 'lucide-react';
import { ActivityLog } from '@/hooks/useAdminDashboard';

interface AdminActivityFeedProps {
  logs: ActivityLog[];
}

const getActionIcon = (action: string) => {
  if (action.includes('PURCHASE')) return <Coins size={14} className="text-green-400" />;
  if (action.includes('GRANT') || action.includes('BONUS')) return <Zap size={14} className="text-purple-400" />;
  if (action.includes('SIGNUP') || action.includes('NEW')) return <UserPlus size={14} className="text-blue-400" />;
  return <Clock size={14} className="text-orange-400" />;
};

const getTimeAgo = (dateStr: string) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const AdminActivityFeed: React.FC<AdminActivityFeedProps> = ({ logs }) => {
  const recentLogs = logs.slice(0, 15);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Live Activity</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] text-zinc-600 font-bold uppercase">Real-time</span>
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-zinc-800/30">
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 text-xs">No recent activity</div>
        ) : (
          recentLogs.map((log) => (
            <div key={log.id} className="px-5 py-3 hover:bg-zinc-800/20 transition-colors flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-1.5 rounded-lg bg-zinc-800/50">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{log.user_name || 'Unknown'}</span>
                  <span className="text-[9px] text-zinc-600 font-mono shrink-0">{getTimeAgo(log.created_at)}</span>
                </div>
                <div className="text-[10px] text-zinc-500 truncate">{log.action}: {log.details}</div>
              </div>
              {log.credits_affected !== 0 && (
                <span className={`text-xs font-black shrink-0 ${log.credits_affected > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {log.credits_affected > 0 ? '+' : ''}{log.credits_affected}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminActivityFeed;
