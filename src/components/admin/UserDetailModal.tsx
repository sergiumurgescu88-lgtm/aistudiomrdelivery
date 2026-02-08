import React from 'react';
import { X, User as UserIcon, Coins, Crown, Shield, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Profile } from '@/hooks/useAuth';
import { CreditTransaction } from '@/hooks/useAdminDashboard';

interface UserDetailModalProps {
  user: Profile;
  transactions: CreditTransaction[];
  onClose: () => void;
  onGrantCredits: () => void;
  onToggleStatus: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, transactions, onClose, onGrantCredits, onToggleStatus }) => {
  const userTransactions = transactions
    .filter(t => t.user_id === user.user_id)
    .slice(0, 50);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden animate-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
              {user.profile_photo ? <img src={user.profile_photo} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-zinc-500" />}
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white">{user.full_name}</h3>
              <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-zinc-800 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <Coins size={16} className="text-orange-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white">{user.credits}</div>
              <div className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Total Credits</div>
              <div className="text-[10px] text-zinc-600 mt-1">{user.free_credits} free · {user.purchased_credits} purchased</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <TrendingUp size={16} className="text-blue-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white">{user.total_generations}</div>
              <div className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Generations</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <Crown size={16} className={`mx-auto mb-2 ${user.account_tier === 'PREMIUM' ? 'text-orange-400' : 'text-zinc-500'}`} />
              <div className="text-xl font-bold text-white">{user.account_tier}</div>
              <div className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Tier</div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <Shield size={16} className={`mx-auto mb-2 ${user.account_status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`} />
              <div className="text-xl font-bold text-white">{user.account_status}</div>
              <div className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Status</div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <div className="flex-1 flex items-center gap-2 bg-zinc-800/30 rounded-lg px-3 py-2">
              <Calendar size={12} className="text-zinc-600" />
              <span className="text-[10px] text-zinc-500">Joined: {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-zinc-800/30 rounded-lg px-3 py-2">
              <Clock size={12} className="text-zinc-600" />
              <span className="text-[10px] text-zinc-500">Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 border-b border-zinc-800 flex gap-2 shrink-0">
          <button onClick={onGrantCredits} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
            <Coins size={12} /> Grant Credits
          </button>
          <button onClick={onToggleStatus} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border ${
            user.account_status === 'ACTIVE'
              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
              : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
          }`}>
            <Shield size={12} /> {user.account_status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </button>
        </div>

        {/* Transaction History */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Transaction History</h4>
          {userTransactions.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-xs">No transactions found</div>
          ) : (
            <div className="space-y-1">
              {userTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5 px-3 hover:bg-zinc-800/30 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                      t.type === 'purchase' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      t.type === 'bonus' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      t.type === 'usage' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>{t.type}</span>
                    <span className="text-xs text-zinc-400 truncate max-w-[200px]">{t.description}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-xs font-bold ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
