import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Snowflake, Info, Loader2, AlertCircle, Coins, User as UserIcon, LogOut, Plus, CheckCircle, Mail, X, Download, Globe2 } from 'lucide-react';
import MenuParser from '../components/MenuParser';
import DishCard from '../components/DishCard';
import Snowfall from '../components/Snowfall';
import ChatBot from '../components/ChatBot';
import Auth from '../components/Auth';
import Pricing from '../components/Pricing';

import UserDashboard from '../components/UserDashboard';
import SupportPolicyModal from '../components/SupportPolicyModal';
import { Dish, PhotoStyle, ImageSize, PhotoQuality, STYLE_TOOLTIPS } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useCredits } from '../hooks/useCredits';
import JSZip from 'jszip';

const MrDeliveryLogo = ({ size = 24, className = "", idPrefix = "logo" }: { size?: number, className?: string, idPrefix?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <defs>
      <linearGradient id={`${idPrefix}topGrad`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4FB9E1" /><stop offset="100%" stopColor="#2E3192" /></linearGradient>
      <linearGradient id={`${idPrefix}bottomGrad`} x1="100%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#C1272D" /><stop offset="100%" stopColor="#F15A24" /></linearGradient>
    </defs>
    <g>
      <path d="M20 55 C20 30 40 10 70 10 L80 10 L30 65 L20 55Z" fill={`url(#${idPrefix}topGrad)`} />
      <path d="M80 45 C80 70 60 90 30 90 L20 90 L70 35 L80 45Z" fill={`url(#${idPrefix}bottomGrad)`} />
      <path d="M45 25 L50 30 L35 45 L30 40 Z M52 22 L55 25 M55 19 L58 22 M58 16 L61 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <path d="M55 70 C60 65 65 60 62 55 C59 50 54 52 49 57 C44 62 42 67 45 72 C48 77 50 75 55 70 Z" fill="white" opacity="0.9"/>
      <path d="M45 72 L35 82" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
    </g>
  </svg>
);

interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; subMessage?: string; }

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { chargeCredit, purchaseCredits } = useCredits();

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [style, setStyle] = useState<PhotoStyle>(PhotoStyle.NATURAL_DAYLIGHT);
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [quality, setQuality] = useState<PhotoQuality>(PhotoQuality.PREMIUM);
  const [isSnowing, setIsSnowing] = useState(true);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [locationImageReal, setLocationImageReal] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [isZipping, setIsZipping] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const activeGenerationsCount = dishes.filter(d => d.isLoading || d.isEditing).length;
  const isGenerationLimitReached = activeGenerationsCount >= 3;

  const addToast = (type: 'success' | 'error' | 'info', message: string, subMessage?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message, subMessage }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleDishesParsed = (parsedDishes: { name: string; description: string; referencePhoto?: string }[], referencePhoto?: string) => {
    if (!profile) { setShowAuth(true); return; }
    const newDishes = parsedDishes.map((d) => ({ ...d, id: Math.random().toString(36).substr(2, 9), referencePhoto: referencePhoto || d.referencePhoto, isLoading: false, isEditing: false, isAnalyzing: false }));
    setDishes((prev) => [...prev, ...newDishes]); setStep(2);
  };

  const handleChargeCredit = async (action: string, details: string) => {
    try {
      const result = await chargeCredit(action, details);
      addToast('success', 'Production Successful!', `1 credit used. ${result.creditsRemaining} remaining.`);
    } catch (error: any) {
      addToast('error', 'Action Failed', error.message);
      throw error;
    }
  };

  const updateDish = (id: string, updates: Partial<Dish>) => setDishes((prev) => prev.map((dish) => (dish.id === id ? { ...dish, ...updates } : dish)));
  const requestReset = () => { if (step === 2 && dishes.length > 0) { setDishes([]); setStep(1); setLogoImage(null); setLocationImageReal(null); setGlobalError(null); } };

  const handleDownloadAll = async () => {
    const generatedDishes = dishes.filter(d => d.imageUrl);
    if (generatedDishes.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      generatedDishes.forEach((dish) => { if (dish.imageUrl) { const base64Data = dish.imageUrl.split(',')[1]; zip.file(`${dish.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`, base64Data, { base64: true }); } });
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a'); link.href = url; link.download = `production_bundle_${new Date().getTime()}.zip`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch (error) { console.error("Export failed", error); } finally { setIsZipping(false); }
  };

  const handlePurchase = async (credits: number) => {
    try {
      await purchaseCredits(credits);
      setShowPricing(false);
      addToast('success', `Success! ${credits} credits added.`, "You're now Premium!");
    } catch (error: any) {
      addToast('error', 'Purchase Failed', error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowUserDashboard(false);
    addToast('info', 'Securely logged out');
  };

  const getCreditColor = (credits: number) => { if (credits >= 20) return 'text-green-500'; if (credits >= 5) return 'text-orange-500'; return 'text-red-500'; };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 selection:bg-orange-500/30 overflow-x-hidden relative">
      {isSnowing && <Snowfall />}
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      {showPricing && <Pricing onPurchase={handlePurchase} onClose={() => setShowPricing(false)} currentCurrency={profile?.preferred_currency as any || 'EUR'} onCurrencyChange={() => {}} />}
      <SupportPolicyModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} user={profile ? { credits: profile.credits, accountTier: profile.account_tier, email: profile.email } : null} />
      
      {showUserDashboard && profile && <UserDashboard onClose={() => setShowUserDashboard(false)} onOpenPricing={() => { setShowPricing(true); setShowUserDashboard(false); }} onOpenSupport={() => { setShowSupportModal(true); setShowUserDashboard(false); }} />}

      {/* Toast System */}
      <div className="fixed top-24 right-6 z-[1100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`p-4 rounded-2xl border flex items-center gap-4 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-right-10 pointer-events-auto max-w-sm ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
            <div className="flex flex-col"><span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>{toast.subMessage && <span className="text-[10px] opacity-70 font-medium">{toast.subMessage}</span>}</div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-auto p-1 hover:bg-white/10 rounded-lg"><X size={14} /></button>
          </div>
        ))}
      </div>

      <header className="sticky top-0 z-[150] bg-zinc-950/80 border-b border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-1 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-5 cursor-pointer shrink-0" onClick={requestReset}>
            <div className="bg-zinc-900 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner ring-1 ring-white/5"><MrDeliveryLogo size={24} className="sm:w-8 sm:h-8" idPrefix="header" /></div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-lg sm:text-2xl font-serif font-bold tracking-tight flex items-baseline"><span className="text-white">MrDelivery</span><span className="text-orange-500 italic mx-0.5">.AI</span><span className="text-white ml-1">Studio</span></h1>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 bg-sky-500/10 rounded-md border border-sky-500/20 text-sky-400" onClick={(e) => { e.stopPropagation(); setIsSnowing(!isSnowing); }}>
                  <Snowflake size={8} className={`${isSnowing ? 'animate-spin' : 'opacity-40'} sm:w-[10px] sm:h-[10px]`} style={{ animationDuration: '12s' }} />
                  <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-tighter">{isSnowing ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-6 ml-auto">
            {profile ? (
              <div className="flex items-center gap-1.5 sm:gap-5">
                {isAdmin && <button onClick={() => navigate('/admin')} className="flex items-center gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-zinc-900 hover:bg-orange-600/10 border border-zinc-800 hover:border-orange-500/40 rounded-xl sm:rounded-2xl transition-all text-orange-500 group shadow-lg"><span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest hidden md:inline">Admin</span></button>}
                <button onClick={() => setShowPricing(true)} className="flex items-center gap-1.5 sm:gap-4 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl sm:rounded-2xl transition-all group shadow-xl ring-1 ring-white/5">
                  <Coins size={14} className={`${getCreditColor(profile.credits)} sm:w-[18px] sm:h-[18px]`} />
                  <div className="flex flex-col items-start leading-none"><span className={`text-xs sm:text-sm font-black ${getCreditColor(profile.credits)}`}>{profile.credits}</span></div>
                  <div className="ml-1 p-0.5 sm:p-1 bg-orange-600 text-white rounded-md sm:rounded-lg group-hover:scale-110 transition-all shadow-xl shadow-orange-950/40 hidden xs:flex"><Plus size={8} className="sm:w-[10px] sm:h-[10px]" /></div>
                </button>
                <div className="flex items-center gap-2 sm:gap-4 pl-1.5 sm:pl-6 border-l border-zinc-800">
                  <div className="relative group/avatar cursor-pointer shrink-0" onClick={() => setShowUserDashboard(true)}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-[1rem] bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover/avatar:ring-orange-500/40 transition-all">
                      {profile.profile_photo ? <img src={profile.profile_photo} alt="" className="w-full h-full object-cover" /> : <UserIcon size={16} className="sm:w-5 sm:h-5" />}
                    </div>
                    <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-950 sm:w-2.5 sm:h-2.5 ${profile.account_tier === 'PREMIUM' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                  </div>
                  <button onClick={handleLogout} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all hidden sm:block"><LogOut size={20} /></button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="px-3 sm:px-8 py-2 sm:py-3 bg-white text-zinc-900 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] rounded-xl sm:rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl active:scale-95">Authorize</button>
            )}
          </div>
        </div>
      </header>

      {profile && profile.account_status === 'PENDING_VERIFICATION' && (
        <div className="bg-orange-600 text-white p-3 text-center animate-in slide-in-from-top duration-500 relative z-[200]">
          <div className="flex items-center justify-center gap-3">
            <Mail size={16} className="animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest">Action Required: Please verify your email to unlock credits.</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12 sm:py-24 relative z-10">
        {step === 1 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-1000">
            <div className="text-center mb-12 max-w-4xl">
              <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-zinc-900/50 border border-zinc-800 text-[9px] font-black text-orange-500/80 tracking-[0.3em] uppercase shadow-xl backdrop-blur-md">Infrastructure by MrDelivery AI Agency</div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight tracking-tight text-balance">Instant Menu Pictures</h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium text-zinc-600 mb-10 italic">Michelin Cinematic Engine</h2>
              <p className="text-sm sm:text-base text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">Turn any text or photo into a stunning menu image, customized with your logo and restaurant decor.</p>
            </div>
            <MenuParser onDishesParsed={handleDishesParsed} logoImage={logoImage} locationImage={locationImageReal} onLogoChange={setLogoImage} onLocationChange={setLocationImageReal} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {globalError === "quota_exceeded" && (
              <div className="mb-10 p-8 bg-orange-600/5 border border-orange-500/20 rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-8 backdrop-blur-3xl shadow-2xl">
                <div className="flex items-center gap-6"><div className="p-4 bg-orange-600/20 rounded-2xl border border-orange-500/30"><AlertCircle className="text-orange-500" size={32} /></div><div><p className="text-xl font-serif font-bold text-white leading-tight mb-1">Production Protocol Restriction (429)</p><p className="text-xs text-zinc-500">Cloud Infrastructure limit reached.</p></div></div>
              </div>
            )}

            <div className="mb-16 p-8 bg-zinc-900/40 border border-white/5 rounded-[3rem] flex flex-col gap-10 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 overflow-visible">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3"><Settings2 className="text-orange-500" size={20} /><span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em]">Production Specialists Protocol</span></div>
                <div className="flex flex-wrap gap-2.5 max-h-[400px] overflow-y-auto p-6 bg-zinc-950/50 rounded-[2.5rem] border border-zinc-900 custom-scrollbar overflow-visible ring-1 ring-inset ring-white/5">
                  {Object.values(PhotoStyle).map((s) => (
                    <div key={s} className="relative group">
                      <button onClick={() => setStyle(s)} className={`px-6 py-3 text-[10px] font-bold tracking-widest rounded-xl transition-all duration-500 border uppercase ${style === s ? 'bg-orange-600 border-orange-400 text-white shadow-[0_15px_30px_rgba(234,88,12,0.4)] -translate-y-1 scale-105 z-10' : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-orange-500/40 hover:bg-zinc-800'}`}>{s}</button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-5 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] pointer-events-none backdrop-blur-2xl">
                        <div className="text-xs text-white font-black mb-2 border-b border-zinc-800 pb-2 uppercase tracking-widest">{s}</div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{STYLE_TOOLTIPS[s]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-10 border-t border-white/5">
                <div className="flex flex-col sm:flex-row items-center gap-12 w-full lg:w-auto">
                  <div className="flex flex-col items-start gap-4 w-full sm:w-auto">
                    <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Compute Fidelity</span>
                    <div className="flex bg-zinc-950 p-2 rounded-2xl border border-zinc-900 w-full sm:w-auto ring-1 ring-inset ring-white/5 shadow-inner">
                      {Object.values(PhotoQuality).map((q) => (<button key={q} onClick={() => setQuality(q)} className={`flex-1 sm:flex-none px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${quality === q ? 'bg-zinc-800 text-orange-500 shadow-xl border border-orange-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}>{q}</button>))}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-4 w-full sm:w-auto">
                    <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">Spatial Density</span>
                    <div className="flex bg-zinc-950 p-2 rounded-2xl border border-zinc-900 w-full sm:w-auto ring-1 ring-inset ring-white/5 shadow-inner">
                      {Object.values(ImageSize).map((s) => (<button key={s} onClick={() => setSize(s)} className={`flex-1 sm:flex-none px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${size === s ? 'bg-zinc-800 text-orange-500 shadow-xl border border-orange-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}>{s}</button>))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                  {dishes.some(d => d.imageUrl) && (
                    <button onClick={handleDownloadAll} disabled={isZipping} className="flex-1 lg:flex-none flex items-center justify-center gap-4 px-12 py-5 bg-white text-zinc-900 text-xs font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50">
                      {isZipping ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />} Archival Export
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-14">
              {dishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} userCredits={profile?.credits || 0} currentStyle={style} currentSize={size} currentQuality={quality} logoImage={logoImage} locationImage={locationImageReal} onUpdate={updateDish} onCharge={handleChargeCredit} onOpenPricing={() => setShowPricing(true)} addToast={addToast} isGenerationLimitReached={isGenerationLimitReached} onKeyError={() => setGlobalError("quota_exceeded")} />
              ))}
            </div>
          </div>
        )}
      </main>

      <ChatBot />

      <footer className="py-24 text-center border-t border-white/5 bg-zinc-950/40 relative z-10">
        <div className="flex items-center justify-center gap-6 mb-8">
          <a href="https://mrdelivery.ro" target="_blank" className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-orange-500 transition-all shadow-xl hover:scale-110 active:scale-90"><Globe2 size={24} /></a>
        </div>
        <p className="text-zinc-400 text-sm font-medium tracking-wide px-6">&copy; 2026 MrDelivery AI Studio &bull; Proprietary Infrastructure of MrDelivery AI Agency</p>
        <button onClick={() => setShowSupportModal(true)} className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-3 hover:text-orange-500 transition-colors">Refund Policy & Support</button>
      </footer>
    </div>
  );
};

export default Index;
