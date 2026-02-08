import React, { useState } from 'react';
import { X, Check, Zap, ShieldCheck, Globe, CreditCard, ArrowRight, Coins, Crown, Star, Tag } from 'lucide-react';
import { Currency } from '../types';

interface PricingProps {
  onPurchase: (credits: number) => void;
  onClose: () => void;
  currentCurrency: Currency;
  onCurrencyChange: (curr: Currency) => void;
}

const BASE_RATES = { RON: 1, USD: 0.25, EUR: 0.20 };

const PACKAGES = [
  { id: 'starter', name: 'Starter Pack', credits: 100, price: { EUR: 18.00, USD: 22.50, RON: 90.00 }, discount: '10% OFF', perCredit: { EUR: '€0.18', USD: '$0.23', RON: '0.90 lei' } },
  { id: 'popular', name: 'Popular Pack', credits: 250, price: { EUR: 42.50, USD: 53.13, RON: 212.50 }, discount: '15% OFF', bestValue: false, mostPopular: true, perCredit: { EUR: '€0.17', USD: '$0.21', RON: '0.85 lei' } },
  { id: 'pro', name: 'Pro Pack', credits: 500, price: { EUR: 80.00, USD: 100.00, RON: 400.00 }, discount: '20% OFF', bonus: 'Priority Support', perCredit: { EUR: '€0.16', USD: '$0.20', RON: '0.80 lei' } },
  { id: 'ultimate', name: 'Ultimate Pack', credits: 1000, price: { EUR: 150.00, USD: 187.50, RON: 750.00 }, discount: '25% OFF', bestValue: true, bonus: 'Priority + Early Access', perCredit: { EUR: '€0.15', USD: '$0.19', RON: '0.75 lei' } },
  { id: 'enterprise', name: 'Enterprise Pack', credits: 2500, price: { EUR: 350.00, USD: 437.50, RON: 1750.00 }, discount: '30% OFF', bonus: 'Dedicated Manager', perCredit: { EUR: '€0.14', USD: '$0.18', RON: '0.70 lei' } },
] as const;

const CURRENCY_SYMBOLS: Record<Currency, string> = { EUR: '€', USD: '$', RON: 'RON' };

const Pricing: React.FC<PricingProps> = ({ onPurchase, onClose, currentCurrency, onCurrencyChange }) => {
  const [selectedId, setSelectedId] = useState('popular');

  const getSavings = (credits: number, price: number) => {
    const basePrice = credits * BASE_RATES[currentCurrency];
    const savings = basePrice - price;
    return savings > 0 ? savings.toFixed(2) : null;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/50">
          <div>
            <h3 className="text-3xl font-serif font-bold text-white">Credit Packages</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">1 Credit = 1 Photo Edit</span>
              <span className="text-[10px] text-orange-500 uppercase tracking-widest font-black">• Credits Never Expire</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {(['EUR', 'USD', 'RON'] as Currency[]).map((curr) => (
                <button key={curr} onClick={() => onCurrencyChange(curr)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentCurrency === curr ? 'bg-zinc-800 text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}>{curr}</button>
              ))}
            </div>
            <button onClick={onClose} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-xl"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PACKAGES.map((pkg) => {
              const savings = getSavings(pkg.credits, pkg.price[currentCurrency]);
              return (
                <div key={pkg.id} onClick={() => setSelectedId(pkg.id)} className={`relative group cursor-pointer border rounded-3xl p-5 transition-all duration-300 flex flex-col h-full ${selectedId === pkg.id ? 'bg-orange-600/10 border-orange-500 shadow-[0_0_30px_rgba(234,88,12,0.15)] scale-105 z-10' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                  {'bestValue' in pkg && pkg.bestValue && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1"><Crown size={10} /> Best Value</div>}
                  {'mostPopular' in pkg && pkg.mostPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-zinc-900 text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1"><Star size={10} fill="black" /> Popular</div>}

                  <div className="text-center mb-4 mt-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{pkg.name}</div>
                    <div className={`text-3xl font-serif font-bold mb-1 ${selectedId === pkg.id ? 'text-white' : 'text-zinc-300'}`}>{pkg.credits}</div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 inline-block px-2 py-0.5 rounded">{pkg.discount}</div>
                      {savings && <div className="text-[8px] font-bold text-zinc-500 flex items-center gap-1"><Tag size={8} /> Save {CURRENCY_SYMBOLS[currentCurrency]}{savings}</div>}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center border-t border-zinc-800/50 py-4 my-2 gap-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-zinc-400 text-xs font-medium">{CURRENCY_SYMBOLS[currentCurrency]}</span>
                      <span className="text-2xl font-bold text-white">{pkg.price[currentCurrency].toFixed(2)}</span>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-mono">{pkg.perCredit[currentCurrency]} / credit</span>
                  </div>

                  {'bonus' in pkg && pkg.bonus && (
                     <div className="mb-4 text-center">
                        <span className="text-[9px] font-bold text-orange-400 border border-orange-500/30 px-2 py-1 rounded-md bg-orange-500/10">{pkg.bonus}</span>
                     </div>
                  )}

                  <button className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedId === pkg.id ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}`}>{selectedId === pkg.id ? 'Selected' : 'Select'}</button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 bg-zinc-950/50 rounded-[2rem] border border-zinc-800 p-8">
            <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={16} className="text-orange-500" /> Premium Account Benefits</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="flex items-start gap-4"><div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-orange-500"><Zap size={18} /></div><div><h5 className="text-zinc-300 font-bold text-xs uppercase tracking-wide mb-1">100 Daily Edits</h5><p className="text-zinc-500 text-[10px] leading-relaxed">Upgrade from 10 to 100 edits per 24-hour cycle instantly.</p></div></div>
               <div className="flex items-start gap-4"><div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-orange-500"><Coins size={18} /></div><div><h5 className="text-zinc-300 font-bold text-xs uppercase tracking-wide mb-1">No Expiration</h5><p className="text-zinc-500 text-[10px] leading-relaxed">Purchased credits never expire. Use them whenever you need.</p></div></div>
               <div className="flex items-start gap-4"><div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-orange-500"><Globe size={18} /></div><div><h5 className="text-zinc-300 font-bold text-xs uppercase tracking-wide mb-1">Priority Node</h5><p className="text-zinc-500 text-[10px] leading-relaxed">Access high-speed generation queue for faster results.</p></div></div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center"><CreditCard size={14} className="text-zinc-500" /></div>
              <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center"><Check size={14} className="text-green-500" /></div>
            </div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Secure Payment Processing</p>
          </div>
          <button
            onClick={() => { const pkg = PACKAGES.find(p => p.id === selectedId); if (pkg) onPurchase(pkg.credits); }}
            className="w-full sm:w-auto px-12 py-4 bg-white text-zinc-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
            Purchase & Upgrade <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
