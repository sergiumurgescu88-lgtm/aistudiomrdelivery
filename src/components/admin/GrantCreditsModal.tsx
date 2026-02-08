import React, { useState } from 'react';
import { X, Coins, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { Profile } from '@/hooks/useAuth';

interface GrantCreditsModalProps {
  user: Profile | null;
  bulkUsers?: Profile[];
  onGrant: (userId: string, amount: number, reason: string) => Promise<void>;
  onBulkGrant?: (userIds: string[], amount: number, reason: string) => Promise<void>;
  onClose: () => void;
}

const PRESETS = [10, 50, 100, 500];

const GrantCreditsModal: React.FC<GrantCreditsModalProps> = ({ user, bulkUsers, onGrant, onBulkGrant, onClose }) => {
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const isBulk = bulkUsers && bulkUsers.length > 0;
  const targetCount = isBulk ? bulkUsers.length : 1;
  const effectiveAmount = customAmount ? parseInt(customAmount, 10) : amount;

  const handleGrant = async () => {
    if (!reason.trim()) return;
    if (isNaN(effectiveAmount) || effectiveAmount <= 0) return;

    setIsGranting(true);
    try {
      if (isBulk && onBulkGrant) {
        const ids = bulkUsers.map(u => u.user_id);
        const total = ids.length;
        // Grant one by one for progress
        for (let i = 0; i < ids.length; i++) {
          await onGrant(ids[i], effectiveAmount, reason);
          setProgress(Math.round(((i + 1) / total) * 100));
        }
      } else if (user) {
        await onGrant(user.user_id, effectiveAmount, reason);
      }
      setIsSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('Grant failed:', err);
    } finally {
      setIsGranting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in" onClick={onClose}>
        <div className="bg-zinc-900 border border-green-500/30 rounded-3xl p-10 max-w-md w-full mx-4 text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
          <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-white mb-2">Credits Granted!</h3>
          <p className="text-zinc-400 text-sm">{effectiveAmount} credits → {targetCount} account{targetCount > 1 ? 's' : ''}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full mx-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Coins size={20} className="text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">
                {isBulk ? `Bulk Grant — ${targetCount} users` : 'Grant Free Credits'}
              </h3>
              {!isBulk && user && (
                <p className="text-xs text-zinc-500">{user.full_name} ({user.email})</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Amount presets */}
        <div className="mb-5">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Amount</label>
          <div className="flex gap-2 mb-3">
            {PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => { setAmount(preset); setCustomAmount(''); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${
                  !customAmount && amount === preset
                    ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/30'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-orange-500/40 hover:text-white'
                }`}
              >
                +{preset}
              </button>
            ))}
          </div>
          <div className="relative">
            <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="number"
              placeholder="Custom amount..."
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">Reason (required)</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Loyalty reward, bug compensation, promo campaign..."
            rows={3}
            className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 resize-none"
          />
        </div>

        {/* Preview */}
        <div className="bg-zinc-800/40 border border-zinc-700/60 rounded-xl p-4 mb-6">
          <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">Preview</div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              {effectiveAmount > 0 ? `+${effectiveAmount}` : 0} credits × {targetCount} user{targetCount > 1 ? 's' : ''}
            </span>
            <span className="text-lg font-bold text-orange-400">
              = {(effectiveAmount > 0 ? effectiveAmount : 0) * targetCount} total
            </span>
          </div>
        </div>

        {/* Progress bar for bulk */}
        {isGranting && isBulk && (
          <div className="mb-4">
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-[10px] text-zinc-500 text-center mt-1">{progress}% complete</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleGrant}
            disabled={!reason.trim() || isGranting || isNaN(effectiveAmount) || effectiveAmount <= 0}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGranting ? <Loader2 size={14} className="animate-spin" /> : <Coins size={14} />}
            {isGranting ? 'Granting...' : 'Confirm Grant'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrantCreditsModal;
