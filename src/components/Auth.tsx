import React, { useState } from 'react';
import { Mail, Chrome, X, CheckCircle2, Loader2, ShieldCheck, MailCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthProps {
  onAuthComplete: (user: UserType) => void;
  onClose: () => void;
  allUsers: UserType[];
}

type AuthMode = 'initial' | 'google-auth' | 'verification-sent' | 'suspended' | 'success';

const Auth: React.FC<AuthProps> = ({ onAuthComplete, onClose, allUsers }) => {
  const [mode, setMode] = useState<AuthMode>('initial');
  const [authProgress, setAuthProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempUser, setTempUser] = useState<UserType | null>(null);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const createNewUser = (emailAddr: string, name: string): UserType => {
    const now = new Date().toISOString();
    return {
      id: btoa(emailAddr).slice(0, 12),
      googleId: `google_${Math.random().toString(36).substr(2, 9)}`,
      email: emailAddr,
      fullName: name,
      profilePhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
      credits: 0, freeCredits: 0, purchasedCredits: 0,
      dailyUsage: 0, lastUsageDate: now,
      accountTier: 'FREE', accountStatus: 'PENDING_VERIFICATION',
      isLoggedIn: true, isEmailVerified: false,
      preferredCurrency: 'EUR', role: 'user',
      joinedAt: now, totalGenerations: 0
    };
  };

  const startGoogleAuthFlow = () => {
    if (!customGoogleEmail || !customGoogleName) return;
    if (!customGoogleEmail.toLowerCase().includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }

    setMode('google-auth');
    setAuthProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setAuthProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.random() * 20;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      const lowerEmail = customGoogleEmail.toLowerCase().trim();
      const existingUser = allUsers.find(u => u.email.toLowerCase() === lowerEmail);

      if (existingUser) {
        if (existingUser.accountStatus === 'SUSPENDED') { setMode('suspended'); return; }
        if (existingUser.accountStatus === 'PENDING_VERIFICATION') { setTempUser(existingUser); setMode('verification-sent'); return; }
        onAuthComplete({ ...existingUser, isLoggedIn: true, lastLogin: new Date().toISOString() });
      } else {
        const newUser = createNewUser(lowerEmail, customGoogleName);
        setTempUser(newUser);
        setMode('verification-sent');
        onAuthComplete(newUser);
      }
    }, 2000);
  };

  const simulateEmailConfirmation = () => {
    if (!tempUser) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const activatedUser: UserType = {
        ...tempUser, accountStatus: 'ACTIVE', isEmailVerified: true,
        freeCredits: 50, credits: 50 + tempUser.purchasedCredits
      };
      setTempUser(activatedUser);
      onAuthComplete(activatedUser);
      setMode('success');
    }, 2000);
  };

  if (mode === 'google-auth') {
    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-500">
        <div className="bg-zinc-900 border border-white/5 rounded-[3rem] w-full max-w-md p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
             <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${authProgress}%` }} />
          </div>
          <div className="mb-10 relative">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
               <Chrome size={48} className="text-[#4285F4]" />
            </div>
            <div className="absolute -bottom-2 right-1/2 translate-x-12">
               <div className="bg-blue-600 p-2 rounded-xl text-white shadow-xl"><Loader2 className="animate-spin" size={16} /></div>
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Google Security Check</h2>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-10">Verifying Identity Token...</p>
          <div className="flex flex-col gap-4 text-xs text-zinc-400 font-medium">
             <div className="flex items-center justify-center gap-3"><span className={authProgress > 30 ? 'text-green-500' : ''}>{authProgress > 30 ? '✓' : '○'} Connection Secure</span></div>
             <div className="flex items-center justify-center gap-3"><span className={authProgress > 60 ? 'text-green-500' : ''}>{authProgress > 60 ? '✓' : '○'} OAuth Token Valid</span></div>
             <div className="flex items-center justify-center gap-3"><span className={authProgress > 90 ? 'text-green-500' : ''}>{authProgress > 90 ? '✓' : '○'} Retrieving Profile</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'verification-sent') {
    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-300">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] w-full max-w-md p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-800"><div className="h-full bg-orange-500 animate-pulse w-full"></div></div>
          <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 mx-auto mb-8 shadow-inner ring-1 ring-orange-500/20"><MailCheck size={40} /></div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Confirm Your Email</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">We've sent a secure confirmation link to <span className="text-white font-bold">{tempUser?.email}</span>.</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-8 bg-zinc-950 p-3 rounded-xl border border-zinc-800">Confirm to unlock 50 Free Credits</p>
          <div className="space-y-4">
            <button onClick={simulateEmailConfirmation} disabled={isVerifying} className="w-full py-5 bg-white text-zinc-900 font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl hover:bg-zinc-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
              {isVerifying ? <><Loader2 className="animate-spin" size={18} /> Validating Token...</> : <><Mail size={18} strokeWidth={2.5} /> Simulate Clicking Link (Debug)</>}
            </button>
            <div className="flex gap-2">
              <button className="flex-1 py-4 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">Resend Email</button>
              <button onClick={onClose} className="flex-1 py-4 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">I'll do it later</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'success') {
    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6"><CheckCircle2 size={48} /></div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Account Activated!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">Identity verified. Your Michelin production engine is now online. <br/><span className="text-green-500 font-bold">50 free credits have been added.</span></p>
          <button onClick={onClose} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-orange-950/20">Start Editing</button>
        </div>
      </div>
    );
  }

  if (mode === 'suspended') {
    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
        <div className="bg-red-950/30 border border-red-900/50 rounded-[2.5rem] w-full max-w-md p-10 text-center shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-500/20"><AlertTriangle size={40} /></div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">Account Suspended</h2>
          <p className="text-red-200/70 mb-8 leading-relaxed text-sm">Your account has been suspended due to a violation of our terms. Please contact support for assistance.</p>
          <button onClick={onClose} className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-xs rounded-2xl transition-all border border-zinc-800">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
        <div className="p-6 sm:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">Studio Access</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-1">Google Authentication Only</p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all"><X size={18} /></button>
        </div>

        <div className="p-8 space-y-8 flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight leading-tight">{error}</p>
            </div>
          )}

          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center mb-2">Google Account Simulator</p>
            <input type="text" placeholder="Your Name (e.g. Chef Ramsey)" value={customGoogleName} onChange={(e) => setCustomGoogleName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
            <input type="email" placeholder="your.email@gmail.com" value={customGoogleEmail} onChange={(e) => setCustomGoogleEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
          </div>

          <button onClick={startGoogleAuthFlow} disabled={!customGoogleEmail || !customGoogleName} className="group relative flex items-center justify-center gap-4 py-4 px-6 bg-white hover:bg-zinc-100 text-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl active:scale-95 border-b-4 border-zinc-300 hover:border-zinc-400 w-full disabled:opacity-50 disabled:grayscale">
            <Chrome size={20} className="text-[#4285F4]" />
            Sign in with Google
          </button>

          <p className="text-[10px] text-center text-zinc-500 leading-relaxed px-4">
            By continuing, you agree to our Terms of Service. Authentication is handled exclusively via Google OAuth 2.0 protocol for maximum security.
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-zinc-950 border-t border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-600 font-medium leading-relaxed max-w-[250px] mx-auto flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-green-500/50" />
            Official Google Partner Integration
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
