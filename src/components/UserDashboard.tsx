import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Shield, Clock, Coins, LogOut, X, Lock, CreditCard, ChevronRight, Zap, Crown, Headphones } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useActivityLogs } from '../hooks/useActivityLogs';

interface UserDashboardProps {
  onClose: () => void;
  onOpenPricing: () => void;
  onOpenSupport: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onClose, onOpenPricing, onOpenSupport }) => {
  const { profile, signOut, updateProfile } = useAuth();
  const { logs } = useActivityLogs();
  const [activeView, setActiveView] = useState<'overview' | 'security' | 'history' | 'support'>('overview');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    const calculateTimeLeft = () => {
      const lastUsage = new Date(profile.last_usage_date);
      const resetTime = new Date(lastUsage.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const diff = resetTime.getTime() - now.getTime();
      if (diff <= 0) return "00:00:00";
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [profile?.last_usage_date]);

  if (!profile) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setUploadError("File size exceeds 2MB limit."); return; }
      const reader = new FileReader();
      reader.onloadend = () => updateProfile({ profile_photo: reader.result as string });
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  const dailyLimit = profile.account_tier === 'PREMIUM' ? 100 : 10;
  const dailyRemaining = Math.max(0, dailyLimit - profile.daily_usage);

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
      <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-10 duration-500 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-zinc-900 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border shadow-lg ${profile.account_tier === 'PREMIUM' ? 'bg-orange-600/10 border-orange-500/20 text-orange-500' : 'bg-green-600/10 border-green-500/20 text-green-500'}`}><UserIcon size={24} /></div>
            <div><h2 className="text-2xl font-serif font-bold text-white tracking-tight">Operator Profile</h2></div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all border border-zinc-800"><X size={20} /></button>
        </div>

        <div className="flex px-8 py-4 gap-2 bg-zinc-950 border-b border-zinc-900 overflow-x-auto">
          {[{ id: 'overview', icon: Zap, label: 'Account' }, { id: 'history', icon: Clock, label: 'Credit History' }, { id: 'support', icon: Headphones, label: 'Support' }, { id: 'security', icon: Shield, label: 'Security' }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === tab.id ? 'bg-zinc-900 text-orange-500 border border-orange-500/20 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeView === 'overview' && (
            <div className="space-y-10 animate-in fade-in">
              <div className="text-center pb-8 border-b border-zinc-900/50">
                <div className="relative inline-block mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="relative w-28 h-28 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden shadow-2xl">
                    {profile.profile_photo ? <img src={profile.profile_photo} className="w-full h-full object-cover" alt="" /> : <UserIcon size={48} strokeWidth={1} />}
                  </div>
                  {profile.account_tier === 'PREMIUM' && <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full border-4 border-zinc-950 flex items-center justify-center text-white shadow-xl"><Crown size={14} fill="currentColor" /></div>}
                </div>
                {uploadError && <p className="mb-4 text-red-500 text-[10px] font-black uppercase">{uploadError}</p>}
                <h3 className="text-3xl font-serif font-bold text-white">{profile.full_name}</h3>
                <p className="text-zinc-500 font-mono text-xs mt-1">{profile.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl col-span-2">
                  <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Coins className="text-orange-500" size={18} /><span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Total Credits</span></div><div className="text-3xl font-serif font-bold text-white">{profile.credits}</div></div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800"><div><div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Purchased</div><div className="text-lg font-bold text-orange-400">{profile.purchased_credits}</div></div><div><div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Free</div><div className="text-lg font-bold text-zinc-400">{profile.free_credits}</div></div></div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl">
                  <div className="text-3xl font-serif font-bold text-white">{dailyRemaining}<span className="text-sm font-medium text-zinc-600 ml-1">/ {dailyLimit}</span></div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Daily Edits Left</div>
                  <div className="w-full bg-zinc-800 h-1 mt-3 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: `${(dailyRemaining / dailyLimit) * 100}%` }}></div></div>
                  <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between"><span className="text-[9px] text-zinc-600 font-bold uppercase">Resets in:</span><span className="text-[10px] font-mono text-zinc-400">{timeLeft}</span></div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-[2rem] shadow-xl">
                  <div className="text-3xl font-serif font-bold text-white">{profile.total_generations}</div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Lifetime Edits</div>
                </div>
              </div>

              <div className="space-y-4">
                <button onClick={onOpenPricing} className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl text-white shadow-xl group hover:opacity-90 transition-all"><div className="flex items-center gap-4"><CreditCard size={20} /><div className="text-left font-black uppercase text-xs tracking-widest">Buy More Credits</div></div><ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></button>
                <button onClick={handleLogout} className="w-full flex items-center gap-4 p-5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all"><LogOut size={20} /><div className="text-left font-black uppercase text-xs tracking-widest">Terminate Session</div></button>
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="space-y-6 animate-in fade-in">
              {logs.length > 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl overflow-hidden">
                  <table className="w-full text-left"><thead><tr className="bg-zinc-950/50 border-b border-zinc-800"><th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase">Time</th><th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase">Action</th><th className="px-6 py-4 text-[9px] font-black text-zinc-600 uppercase text-right">Delta</th></tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">{logs.map((log) => (<tr key={log.id} className="hover:bg-zinc-800/30 transition-colors"><td className="px-6 py-4 text-[10px] text-zinc-400 font-mono">{new Date(log.created_at).toLocaleString()}</td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${log.action === 'PURCHASE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>{log.action}</span></td><td className={`px-6 py-4 text-[11px] font-black text-right ${log.credits_affected > 0 ? 'text-green-500' : 'text-red-500'}`}>{log.credits_affected > 0 ? `+${log.credits_affected}` : log.credits_affected}</td></tr>))}</tbody></table>
                </div>
              ) : (<div className="text-center py-20"><Clock size={32} className="text-zinc-800 mx-auto mb-4" /><p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No history.</p></div>)}
            </div>
          )}

          {activeView === 'support' && (
            <div className="space-y-8 animate-in fade-in">
              <button onClick={onOpenSupport} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-3 hover:text-white"><Headphones size={16} /> Open Support Ticket & Policies</button>
            </div>
          )}

          {activeView === 'security' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl">
                <Shield size={32} className="text-orange-500 mb-6" />
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Access Security</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-8">Your account is secured via Google OAuth. Manage your authentication protocols.</p>
                <button className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-3"><Lock size={16} /> Reset Access Protocol</button>
              </div>
            </div>
          )}
        </div>
        <div className="p-8 border-t border-zinc-900 bg-zinc-950 text-center"><p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.4em]">mrdelivery infrastructure</p></div>
      </div>
    </div>
  );
};

export default UserDashboard;
