import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, X, Send, Loader2, Bot, User, Mic, MicOff,
  Volume2, VolumeX, Play, Square, Headphones, Settings,
  History, Info, Camera, Image as ImageIcon, Sparkles,
  Radio, Zap, BrainCircuit
} from 'lucide-react';
import { chatWithConcierge, speakText, sendLiveConciergeMessage } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: string;
}

type AgentState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'THINKING' | 'SPEAKING' | 'LIVE';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Hi there! I\'m Maya. I have "Thinking Mode" enabled to solve your complex menu problems. How can I help today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [currentState, setCurrentState] = useState<AgentState>('IDLE');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const chatCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentState]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
      };
      recognitionRef.current.onerror = () => setCurrentState('IDLE');
      recognitionRef.current.onend = () => {
        if (currentState === 'LISTENING') setCurrentState('IDLE');
      };
    }
  }, [currentState]);

  const stopSpeaking = () => {
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch (e) {}
      activeSourceRef.current = null;
    }
    setCurrentState('IDLE');
  };

  const playResponse = async (text: string) => {
    if (!isTtsEnabled) {
      setCurrentState('IDLE');
      return;
    }

    try {
      setCurrentState('SPEAKING');
      const buffer = await speakText(text);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const dataInt16 = new Int16Array(buffer);
      const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setCurrentState('IDLE');
        activeSourceRef.current = null;
      };
      activeSourceRef.current = source;
      source.start();
    } catch (err) {
      console.error('TTS failed', err);
      setCurrentState('IDLE');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPendingImage(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSend = async (msgText: string = input) => {
    const text = msgText.trim();
    if (!text && !pendingImage) return;

    if (currentState === 'SPEAKING') stopSpeaking();

    const currentPendingImage = pendingImage;
    setPendingImage(null);
    setInput('');

    const userMsg: Message = {
      role: 'user',
      text: text || "Analyze this image.",
      image: currentPendingImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setCurrentState('THINKING');

    try {
      const fullResponse = await chatWithConcierge(text, messages.map(m => ({ role: m.role, text: m.text })), currentPendingImage);

      const botMsg: Message = {
        role: 'model',
        text: fullResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);

      await playResponse(fullResponse);
    } catch (error) {
      console.error('Maya Error:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'I hit a technical snag. Please try again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setCurrentState('IDLE');
    }
  };

  const toggleTalk = () => {
    if (currentState === 'LISTENING') {
      recognitionRef.current?.stop();
      setCurrentState('THINKING');
      return;
    }
    if (currentState === 'SPEAKING') stopSpeaking();
    setCurrentState('LISTENING');
    try { recognitionRef.current?.start(); } catch (err) { setCurrentState('IDLE'); }
  };

  const toggleLiveMode = () => {
    if (currentState === 'LIVE') {
      setCurrentState('IDLE');
      return;
    }
    setCurrentState('LIVE');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[300]">
      <input type="file" ref={chatImageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={chatCameraInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[#FF6B35] hover:bg-[#E05A2A] text-white rounded-full shadow-[0_8px_32px_rgba(255,107,53,0.4)] transition-all active:scale-90 flex items-center justify-center group border border-white/20"
        >
          <div className="absolute inset-0 bg-[#FF6B35] rounded-full animate-ping opacity-20 scale-125"></div>
          <MessageCircle size={28} strokeWidth={2.5} className="group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}

      {isOpen && (
        <div className="w-[350px] sm:w-[420px] h-[680px] bg-zinc-900/98 border border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden">

          <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/50 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <button onClick={toggleLiveMode} className={`p-2 rounded-xl border transition-all ${currentState === 'LIVE' ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'}`}>
                   <Radio size={18} className={currentState === 'LIVE' ? 'animate-pulse' : ''} />
                </button>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${currentState === 'THINKING' ? 'bg-orange-500/10 border-orange-500/40 text-orange-500' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'}`}>
                  <BrainCircuit size={14} className={currentState === 'THINKING' ? 'animate-spin' : ''} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Thought</span>
                </div>
              </div>
              <button onClick={() => { stopSpeaking(); setIsOpen(false); }} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="relative mb-4">
              <div className={`w-24 h-24 rounded-full border-4 border-zinc-800 overflow-hidden shadow-2xl transition-all duration-500 ${currentState === 'SPEAKING' ? 'scale-110 border-orange-500' : ''}`}>
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256" alt="Maya" className="w-full h-full object-cover" />
              </div>
              <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-zinc-900 flex items-center justify-center ${currentState === 'IDLE' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
            </div>

            <h3 className="text-lg font-serif font-bold text-white mb-1">Maya</h3>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              {currentState === 'IDLE' && 'Operator Concierge Ready'}
              {currentState === 'LISTENING' && 'Receiving Voice Stream...'}
              {currentState === 'THINKING' && 'Engaging Deep Thinking...'}
              {currentState === 'SPEAKING' && 'Generating Audio Response...'}
              {currentState === 'LIVE' && 'Live Native Stream Active'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-950/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                {msg.image && <img src={msg.image} className="max-w-[180px] rounded-xl mb-2 border border-white/10 shadow-lg" />}
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm relative group ${
                  msg.role === 'user'
                    ? 'bg-orange-600 text-white rounded-tr-none shadow-lg shadow-orange-950/20'
                    : 'bg-zinc-800/80 text-zinc-200 border border-zinc-800 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed">{msg.text || (i === messages.length - 1 && currentState === 'THINKING' && <Loader2 size={16} className="animate-spin opacity-50" />)}</p>
                  <span className={`text-[8px] mt-2 block opacity-50 font-black uppercase tracking-tighter ${msg.role === 'user' ? 'text-right' : ''}`}>{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-8 border-t border-zinc-800/50 bg-zinc-900/50 flex flex-col items-center gap-6">
            {pendingImage && (
              <div className="w-full flex items-center gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800 animate-in zoom-in-95">
                <img src={pendingImage} className="w-12 h-12 rounded-lg object-cover" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex-1">Image Staged for Analysis</span>
                <button onClick={() => setPendingImage(null)} className="p-1.5 text-zinc-600 hover:text-white"><X size={16} /></button>
              </div>
            )}

            <div className="flex items-center gap-4 w-full justify-center">
              <button onClick={() => chatImageInputRef.current?.click()} className="p-3 bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl border border-zinc-700 transition-all"><ImageIcon size={20} /></button>
              <button onClick={() => chatCameraInputRef.current?.click()} className="p-3 bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl border border-zinc-700 transition-all"><Camera size={20} /></button>
              <button onClick={toggleTalk} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 border-4 border-zinc-800 ${
                currentState === 'LISTENING' ? 'bg-[#E74C3C]' : currentState === 'SPEAKING' ? 'bg-[#27AE60]' : 'bg-[#FF6B35]'
              }`}>
                {currentState === 'LISTENING' ? <Square size={24} fill="white" /> : currentState === 'SPEAKING' ? <Volume2 className="text-white animate-bounce" size={24} /> : <Mic size={24} className="text-white" />}
              </button>
              <button onClick={stopSpeaking} disabled={currentState !== 'SPEAKING'} className="p-3 bg-zinc-800 text-zinc-500 hover:text-red-500 rounded-2xl border border-zinc-700 disabled:opacity-30"><Square size={20} /></button>
            </div>

            <div className="w-full relative flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Maya anything..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-5 pr-12 text-sm text-zinc-200 focus:outline-none focus:border-orange-500/50 transition-all placeholder-zinc-700" />
              <button onClick={() => handleSend()} disabled={!input.trim() && !pendingImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-orange-500 disabled:opacity-0 transition-all"><Send size={20} /></button>
            </div>
            <p className="text-[8px] text-zinc-700 text-center font-black uppercase tracking-[0.4em]">Maya Intelligence Engine • Michelin Protocol Enabled</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
