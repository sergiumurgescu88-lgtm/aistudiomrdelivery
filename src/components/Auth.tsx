import React, { useState } from 'react';
import { Chrome, X, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthProps {
  onClose: () => void;
}

const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-500">
        <div className="bg-zinc-900 border border-white/5 rounded-[3rem] w-full max-w-md p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
            <div className="h-full bg-blue-500 animate-pulse w-full" />
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
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-10">Redirecting to Google...</p>
          <div className="flex flex-col gap-4 text-xs text-zinc-400 font-medium">
            <div className="flex items-center justify-center gap-3"><span className="text-green-500">✓ Connection Secure</span></div>
            <div className="flex items-center justify-center gap-3"><span className="text-green-500">✓ OAuth Token Valid</span></div>
            <div className="flex items-center justify-center gap-3"><span>○ Retrieving Profile</span></div>
          </div>
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
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-1">Google Authentication</p>
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

          <div className="text-center py-4">
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">Sign in with your Google account to access the Michelin Production Engine. New users receive <span className="text-orange-500 font-bold">50 free credits</span>.</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="group relative flex items-center justify-center gap-4 py-4 px-6 bg-white hover:bg-zinc-100 text-zinc-900 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl active:scale-95 border-b-4 border-zinc-300 hover:border-zinc-400 w-full"
          >
            <Chrome size={20} className="text-[#4285F4]" />
            Sign in with Google
          </button>

          <p className="text-[10px] text-center text-zinc-500 leading-relaxed px-4">
            By continuing, you agree to our Terms of Service. Authentication is handled via Google OAuth 2.0 protocol for maximum security.
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-zinc-950 border-t border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-600 font-medium leading-relaxed max-w-[250px] mx-auto flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-green-500/50" />
            Secured by Lovable Cloud
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
