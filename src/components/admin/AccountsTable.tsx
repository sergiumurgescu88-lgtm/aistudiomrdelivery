import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, Coins, Shield, UserX, User as UserIcon, Crown, Check } from 'lucide-react';
import { Profile } from '@/hooks/useAuth';
import { AdminFilters, CreditTransaction } from '@/hooks/useAdminDashboard';
import UserDetailModal from './UserDetailModal';
import GrantCreditsModal from './GrantCreditsModal';

interface AccountsTableProps {
  users: Profile[];
  allFilteredCount: number;
  transactions: CreditTransaction[];
  filters: AdminFilters;
  setFilters: React.Dispatch<React.SetStateAction<AdminFilters>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  pageSize: number;
  onGrantCredits: (userId: string, amount: number, reason: string) => Promise<void>;
  onBulkGrantCredits: (userIds: string[], amount: number, reason: string) => Promise<void>;
  onUpdateStatus: (userId: string, status: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
}

const AccountsTable: React.FC<AccountsTableProps> = ({
  users, allFilteredCount, transactions, filters, setFilters, page, setPage, totalPages, pageSize,
  onGrantCredits, onBulkGrantCredits, onUpdateStatus,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [detailUser, setDetailUser] = useState<Profile | null>(null);
  const [grantUser, setGrantUser] = useState<Profile | null>(null);
  const [showBulkGrant, setShowBulkGrant] = useState(false);

  const toggleSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    if (users.every(u => selectedUsers.has(u.user_id))) {
      setSelectedUsers(prev => {
        const next = new Set(prev);
        users.forEach(u => next.delete(u.user_id));
        return next;
      });
    } else {
      setSelectedUsers(prev => {
        const next = new Set(prev);
        users.forEach(u => next.add(u.user_id));
        return next;
      });
    }
  };

  const handleSort = (col: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: col,
      sortDir: prev.sortBy === col && prev.sortDir === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (filters.sortBy !== col) return <ChevronDown size={10} className="text-zinc-700 opacity-0 group-hover:opacity-100" />;
    return filters.sortDir === 'asc' ? <ChevronUp size={10} className="text-orange-400" /> : <ChevronDown size={10} className="text-orange-400" />;
  };

  const selectedProfiles = users.filter(u => selectedUsers.has(u.user_id));

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search by name, email, or ID..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${
            showFilters ? 'bg-orange-600/10 border-orange-500/30 text-orange-400' : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-white'
          }`}
        >
          <Filter size={14} /> Filters
        </button>
        {selectedUsers.size > 0 && (
          <button
            onClick={() => setShowBulkGrant(true)}
            className="px-4 py-3 bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-orange-500 transition-all"
          >
            <Coins size={14} /> Grant to {selectedUsers.size} selected
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl animate-in fade-in slide-in-from-top-2">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as AdminFilters['status'] }))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING_VERIFICATION">Pending</option>
          </select>
          <select
            value={filters.tier}
            onChange={e => setFilters(prev => ({ ...prev, tier: e.target.value as AdminFilters['tier'] }))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="ALL">All Tiers</option>
            <option value="FREE">Free</option>
            <option value="PREMIUM">Premium</option>
          </select>
          <select
            value={filters.balanceRange}
            onChange={e => setFilters(prev => ({ ...prev, balanceRange: e.target.value as AdminFilters['balanceRange'] }))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="ALL">All Balances</option>
            <option value="ZERO">Zero balance</option>
            <option value="LOW">Low (1-10)</option>
            <option value="MEDIUM">Medium (11-50)</option>
            <option value="HIGH">High (50+)</option>
          </select>
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-4 py-4 w-10">
                  <button onClick={toggleAllOnPage} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    users.length > 0 && users.every(u => selectedUsers.has(u.user_id))
                      ? 'bg-orange-600 border-orange-500'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}>
                    {users.length > 0 && users.every(u => selectedUsers.has(u.user_id)) && <Check size={12} className="text-white" />}
                  </button>
                </th>
                {[
                  { key: 'full_name', label: 'User' },
                  { key: 'account_status', label: 'Status' },
                  { key: 'account_tier', label: 'Tier' },
                  { key: 'credits', label: 'Balance' },
                  { key: 'total_generations', label: 'Usage' },
                  { key: 'created_at', label: 'Joined' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 cursor-pointer hover:text-zinc-300 group transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {users.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-600 text-sm">No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors group/row">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelection(u.user_id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        selectedUsers.has(u.user_id) ? 'bg-orange-600 border-orange-500' : 'border-zinc-700 hover:border-zinc-500'
                      }`}>
                        {selectedUsers.has(u.user_id) && <Check size={12} className="text-white" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                          {u.profile_photo ? <img src={u.profile_photo} className="w-full h-full object-cover" /> : <UserIcon size={16} className="text-zinc-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">{u.full_name || 'Unnamed'}</div>
                          <div className="text-[10px] text-zinc-500 font-mono truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border ${
                        u.account_status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        u.account_status === 'SUSPENDED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>{u.account_status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {u.account_tier === 'PREMIUM' && <Crown size={12} className="text-orange-400" />}
                        <span className={`text-[10px] font-black uppercase ${u.account_tier === 'PREMIUM' ? 'text-orange-400' : 'text-zinc-500'}`}>{u.account_tier}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{u.credits}</span>
                        <div className="text-[9px] text-zinc-600">
                          <span className="text-zinc-500">{u.free_credits}f</span> · <span className="text-orange-400/60">{u.purchased_credits}p</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">{u.total_generations}</span>
                        <span className="text-[9px] text-zinc-600">({u.daily_usage}/day)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-zinc-500 font-mono">{new Date(u.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button onClick={() => setDetailUser(u)} className="p-2 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all" title="View details">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setGrantUser(u)} className="p-2 bg-zinc-800/60 hover:bg-orange-600/20 text-orange-400 rounded-lg transition-all" title="Grant credits">
                          <Coins size={14} />
                        </button>
                        <button
                          onClick={() => onUpdateStatus(u.user_id, u.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                          className={`p-2 bg-zinc-800/60 rounded-lg transition-all ${
                            u.account_status === 'ACTIVE' ? 'hover:bg-red-600/20 text-red-400' : 'hover:bg-green-600/20 text-green-400'
                          }`}
                          title={u.account_status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        >
                          {u.account_status === 'ACTIVE' ? <UserX size={14} /> : <Shield size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-zinc-800/60 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 font-bold">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, allFilteredCount)} of {allFilteredCount}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 bg-zinc-800/60 hover:bg-zinc-700 rounded-lg text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  p === page ? 'bg-orange-600 text-white' : 'bg-zinc-800/60 text-zinc-500 hover:bg-zinc-700 hover:text-white'
                }`}>{p}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 bg-zinc-800/60 hover:bg-zinc-700 rounded-lg text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          transactions={transactions}
          onClose={() => setDetailUser(null)}
          onGrantCredits={() => { setGrantUser(detailUser); setDetailUser(null); }}
          onToggleStatus={() => {
            onUpdateStatus(detailUser.user_id, detailUser.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
            setDetailUser(null);
          }}
        />
      )}

      {grantUser && (
        <GrantCreditsModal
          user={grantUser}
          onGrant={onGrantCredits}
          onClose={() => setGrantUser(null)}
        />
      )}

      {showBulkGrant && (
        <GrantCreditsModal
          user={null}
          bulkUsers={selectedProfiles}
          onGrant={onGrantCredits}
          onBulkGrant={onBulkGrantCredits}
          onClose={() => { setShowBulkGrant(false); setSelectedUsers(new Set()); }}
        />
      )}
    </div>
  );
};

export default AccountsTable;
