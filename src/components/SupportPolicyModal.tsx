import React, { useState } from 'react';
import { X, ShieldAlert, FileText, MessageSquare, AlertTriangle, CheckCircle, Clock, CreditCard, ChevronRight, HelpCircle } from 'lucide-react';
interface SupportUser {
  credits: number;
  accountTier: string;
  email: string;
}

interface SupportPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupportUser | null;
}

const SupportPolicyModal: React.FC<SupportPolicyModalProps> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'refunds' | 'rules' | 'contact'>('refunds');
  const [ticketSubject, setTicketSubject] = useState('Credits not added after purchase');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setSubmitted(true); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-800 rounded-xl border border-zinc-700 text-zinc-400"><HelpCircle size={24} /></div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">Support Center</h2>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Policies & Assistance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-xl"><X size={20} /></button>
        </div>

        <div className="flex px-8 py-4 gap-2 bg-zinc-950 border-b border-zinc-800 shrink-0">
          <button onClick={() => setActiveTab('refunds')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'refunds' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}><FileText size={14} /> Refund Policy</button>
          <button onClick={() => setActiveTab('rules')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rules' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}><ShieldAlert size={14} /> Credit Rules</button>
          <button onClick={() => setActiveTab('contact')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'contact' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}><MessageSquare size={14} /> Contact Support</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-zinc-900/50">
          {activeTab === 'refunds' && (
            <div className="space-y-10 max-w-3xl mx-auto animate-in slide-in-from-bottom-2">
              <div className="bg-green-900/10 border border-green-900/30 p-6 rounded-2xl">
                <h3 className="text-green-500 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={16} /> Refund Eligibility</h3>
                <ul className="space-y-3">
                  {['Technical issues preventing credit usage (with proof)', 'Duplicate charges on same transaction', 'Unauthorized charges (with verification)', 'Credits not delivered after confirmed payment'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>{item}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-zinc-500 font-medium">Request window: Within 14 days of purchase.</p>
              </div>
              <div className="bg-red-900/10 border border-red-900/30 p-6 rounded-2xl">
                <h3 className="text-red-500 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><X size={16} /> Non-Refundable</h3>
                <ul className="space-y-3">
                  {['Credits that have already been used/spent', 'Change of mind after using any credits', 'Dissatisfaction with edit quality (subjective)', 'Free/Promotional credits', 'Expired free credits'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-8 max-w-3xl mx-auto animate-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl"><CreditCard className="text-orange-500 mb-4" size={24} /><h4 className="text-white font-bold mb-2">Non-Transferable</h4><p className="text-xs text-zinc-500 leading-relaxed">Credits cannot be moved between accounts, gifted, or sold to third parties.</p></div>
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl"><ShieldAlert className="text-red-500 mb-4" size={24} /><h4 className="text-white font-bold mb-2">No Cash Exchange</h4><p className="text-xs text-zinc-500 leading-relaxed">Credits have no monetary value outside the platform and cannot be exchanged for cash.</p></div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] flex flex-col items-center text-center">
                <AlertTriangle size={48} className="text-red-500 mb-6" />
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Chargeback Warning</h3>
                <p className="text-sm text-zinc-300 max-w-lg mb-6 leading-relaxed">Initiating a payment dispute or chargeback without contacting support first will result in<span className="text-red-400 font-bold"> immediate account suspension</span> and specific legal action for fraud.</p>
                <button onClick={() => setActiveTab('contact')} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Contact Support First</button>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-2">
              {submitted ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6"><CheckCircle size={40} /></div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">Ticket Received</h3>
                  <p className="text-zinc-400 text-sm">Case ID: #SUP-{Math.floor(Math.random()*10000)}</p>
                  <button onClick={() => { setSubmitted(false); onClose(); }} className="mt-8 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Close</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 mb-8">
                    <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Clock size={16} className="text-orange-500" /> Response Times</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-xs text-zinc-500">Free Users: <span className="text-zinc-300">48-72h</span></div>
                      <div className="text-xs text-zinc-500">Starter/Popular: <span className="text-zinc-300">24-48h</span></div>
                      <div className="text-xs text-zinc-500">Pro Pack: <span className="text-zinc-300">12-24h</span></div>
                      <div className="text-xs text-zinc-500">Ultimate/Ent: <span className="text-zinc-300">6-12h</span></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Issue Type</label>
                    <select value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 appearance-none">
                      <option>Credits not added after purchase</option>
                      <option>Credit deducted but edit failed</option>
                      <option>Daily limit error</option>
                      <option>Refund Request</option>
                      <option>Other Technical Issue</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Transaction ID (Optional)</label>
                    <input type="text" placeholder="e.g. TXN-123456789" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Details</label>
                    <textarea required placeholder="Describe the issue in detail..." className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 resize-none" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-white hover:bg-zinc-200 text-zinc-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPolicyModal;
