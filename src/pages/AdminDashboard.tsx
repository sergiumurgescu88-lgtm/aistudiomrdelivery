import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Activity, BarChart3, ArrowLeft, RefreshCw, Download, Wifi, WifiOff, Loader2, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import AdminMetrics from '@/components/admin/AdminMetrics';
import AdminActivityFeed from '@/components/admin/AdminActivityFeed';
import AdminCharts from '@/components/admin/AdminCharts';
import AccountsTable from '@/components/admin/AccountsTable';

type Tab = 'dashboard' | 'accounts' | 'activity' | 'analytics';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const {
    users, filteredUsers, transactions, activityLogs, metrics, creditTrendData, topUsers,
    filters, setFilters, page, setPage, totalPages, pageSize,
    isLoading, connectionStatus, fetchData,
    grantCredits, bulkGrantCredits, updateAccountStatus, exportToCsv,
  } = useAdminDashboard();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm mb-6">You don't have permission to view this page.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-2xl border-b border-zinc-800/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} className="text-orange-500" />
              <div>
                <h1 className="text-lg font-serif font-bold text-white tracking-tight">Admin Console</h1>
                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.3em]">Account & Credit Management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
              connectionStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
              'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {connectionStatus === 'connected' ? <Wifi size={12} /> : connectionStatus === 'connecting' ? <Loader2 size={12} className="animate-spin" /> : <WifiOff size={12} />}
              {connectionStatus}
            </div>

            {/* Tabs */}
            <div className="hidden md:flex items-center bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <tab.icon size={13} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Export & Refresh */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => exportToCsv(activeTab === 'accounts' ? 'users' : activeTab === 'activity' ? 'logs' : 'transactions')}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all"
                title="Export CSV"
              >
                <Download size={16} />
              </button>
              <button onClick={fetchData} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all" title="Refresh">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto px-4 pb-2 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-orange-600 text-white' : 'text-zinc-500'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in">
                <AdminMetrics metrics={metrics} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <AdminCharts creditTrendData={creditTrendData} topUsers={topUsers} />
                  </div>
                  <div>
                    <AdminActivityFeed logs={activityLogs} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'accounts' && (
              <div className="animate-in fade-in">
                <AccountsTable
                  users={users}
                  allFilteredCount={filteredUsers.length}
                  transactions={transactions}
                  filters={filters}
                  setFilters={setFilters}
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onGrantCredits={grantCredits}
                  onBulkGrantCredits={bulkGrantCredits}
                  onUpdateStatus={updateAccountStatus}
                />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="animate-in fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-serif font-bold text-white">Activity Logs</h2>
                  <span className="text-[10px] text-zinc-600 font-bold">{activityLogs.length} entries</span>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/50">
                          <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">Time</th>
                          <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">User</th>
                          <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">Action</th>
                          <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500">Details</th>
                          <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 text-right">Credits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/30">
                        {activityLogs.slice(0, 100).map(log => (
                          <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="px-5 py-3 text-[10px] text-zinc-400 font-mono whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="px-5 py-3 text-xs font-bold text-white">{log.user_name || 'System'}</td>
                            <td className="px-5 py-3">
                              <span className="px-2.5 py-1 bg-orange-500/10 text-orange-400 text-[8px] font-black uppercase tracking-wider border border-orange-500/20 rounded-lg">{log.action}</span>
                            </td>
                            <td className="px-5 py-3 text-xs text-zinc-400 max-w-[300px] truncate">{log.details}</td>
                            <td className={`px-5 py-3 text-xs font-bold text-right ${log.credits_affected > 0 ? 'text-green-400' : log.credits_affected < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                              {log.credits_affected > 0 ? `+${log.credits_affected}` : log.credits_affected}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="animate-in fade-in space-y-6">
                <AdminMetrics metrics={metrics} />
                <AdminCharts creditTrendData={creditTrendData} topUsers={topUsers} />

                {/* Distribution breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5">
                    <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Credit Distribution</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Usage', value: metrics.totalCreditsConsumed, color: 'bg-orange-500' },
                        { label: 'Free Grants', value: metrics.freeCreditsDistributed, color: 'bg-purple-500' },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-400">{item.label}</span>
                            <span className="text-xs font-bold text-white">{item.value.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                              style={{ width: `${Math.min(100, (item.value / Math.max(metrics.totalCreditsConsumed, metrics.freeCreditsDistributed, 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5">
                    <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Account Tiers</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Free', value: metrics.totalAccounts - metrics.premiumUsers, color: 'bg-zinc-500' },
                        { label: 'Premium', value: metrics.premiumUsers, color: 'bg-orange-500' },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-zinc-400">{item.label}</span>
                            <span className="text-xs font-bold text-white">{item.value} ({metrics.totalAccounts > 0 ? Math.round((item.value / metrics.totalAccounts) * 100) : 0}%)</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                              style={{ width: `${metrics.totalAccounts > 0 ? (item.value / metrics.totalAccounts) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
