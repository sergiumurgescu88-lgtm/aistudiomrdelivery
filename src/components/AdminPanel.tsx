import React, { useState, useMemo } from 'react';
import { Users, Database, Search, Plus, Minus, ArrowLeft, ShieldCheck, User as UserIcon, Coins, Image as ImageIcon, RefreshCw, Zap } from 'lucide-react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useActivityLogs } from '../hooks/useActivityLogs';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { users, fetchUsers, updateUserCredits } = useAdminUsers();
  const { logs, refreshLogs } = useActivityLogs(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'activity'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ), [users, searchQuery]);

  const filteredLogs = useMemo(() => logs.filter(l =>
    l.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase())
  ), [logs, searchQuery]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalCredits: users.reduce((acc, u) => acc + u.credits, 0),
    totalGenerations: users.reduce((acc, u) => acc + u.total_generations, 0),
    activeToday: Math.floor(users.length * 0.65),
  }), [users]);

  const handleRefresh = () => {
    fetchUsers();
    refreshLogs();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-2xl p-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition-all active:scale-95"><ArrowLeft size={20} /></button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3"><ShieldCheck className="text-orange-500" size={24} /><h2 className="text-2xl font-serif font-bold text-white tracking-tight">Admin Console</h2></div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1 ml-9">Unified Infrastructure • mrdelivery.ro</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
            {(['dashboard', 'users', 'activity'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab ? 'bg-orange-600 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>{tab}</button>
            ))}
          </div>
          <button onClick={handleRefresh} className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition-all"><RefreshCw size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Cloud Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'System Liquidity', value: `${stats.totalCredits} CR`, icon: Coins, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                  { label: 'Total Productions', value: stats.totalGenerations, icon: ImageIcon, color: 'text-green-500', bg: 'bg-green-500/10' },
                  { label: 'Active Channels', value: stats.activeToday, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900/60 border border-zinc-800/80 p-8 rounded-[2rem] hover:border-zinc-700 transition-all shadow-2xl backdrop-blur-md group">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}><stat.icon size={24} /></div>
                    </div>
                    <div className="text-4xl font-serif font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="relative w-full max-w-xl group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={22} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search operators..." className="w-full bg-zinc-900/60 border border-zinc-800 rounded-3xl py-5 pl-16 pr-6 text-base text-white focus:outline-none focus:border-orange-500/50 transition-all shadow-xl placeholder-zinc-700" />
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[3rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-zinc-800 bg-zinc-950/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tier</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Balance</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-800/40 transition-all group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-3xl bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden shrink-0">
                              {u.profile_photo ? <img src={u.profile_photo} className="w-full h-full object-cover" /> : <UserIcon size={24} />}
                            </div>
                            <div>
                              <div className="text-base font-bold text-white">{u.full_name}</div>
                              <div className="text-[11px] text-zinc-500 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${u.account_tier === 'PREMIUM' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{u.account_tier}</span>
                        </td>
                        <td className="px-8 py-6"><div className="flex items-center gap-2.5"><Coins size={18} className="text-orange-500" /><span className="text-lg font-black text-white">{u.credits}</span></div></td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => updateUserCredits(u.user_id, 50)} className="p-3 bg-zinc-950 hover:bg-green-600/20 text-green-500 rounded-xl border border-zinc-800 transition-all"><Plus size={18} /></button>
                            <button onClick={() => updateUserCredits(u.user_id, -50)} className="p-3 bg-zinc-950 hover:bg-red-600/20 text-red-500 rounded-xl border border-zinc-800 transition-all"><Minus size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-7xl mx-auto space-y-8">
              <h3 className="text-3xl font-serif font-bold text-white flex items-center gap-4"><Database size={32} className="text-orange-500" /> Global Production Archive</h3>
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[3rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-zinc-800 bg-zinc-950/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Time</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Operator</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Action</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Delta</th>
                  </tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-8 py-6 text-sm text-zinc-400 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-8 py-6 text-sm font-bold text-white">{log.user_name}</td>
                        <td className="px-8 py-6"><span className="px-4 py-1.5 bg-orange-600/10 text-orange-500 text-[10px] font-black uppercase tracking-[0.1em] border border-orange-500/20 rounded-xl">{log.action}</span></td>
                        <td className={`px-8 py-6 text-base font-black text-right ${log.credits_affected > 0 ? 'text-green-500' : 'text-red-500'}`}>{log.credits_affected > 0 ? `+${log.credits_affected}` : log.credits_affected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
