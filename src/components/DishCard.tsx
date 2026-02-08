import React, { useState, useRef, useEffect } from 'react';
import { Dish, ImageSize, PhotoStyle, PhotoQuality, AspectRatio } from '../types';
import {
  Edit2, RefreshCw, X, Check, Download, Image as ImageIcon,
  ScanEye, Upload, LucideIcon, Camera, Ratio,
  MapPin, BadgeCheck, Mic, MicOff, Loader2, AlertCircle,
  Info, Users, Search, ClipboardList, Utensils, Sparkles, Wand2, Eye, LayoutTemplate, Globe, Briefcase, Coffee, Coins,
  GlassWater, Sun, Building2, Home, Waves, Heart, Zap, BookOpen, Circle, DoorOpen, ShoppingBag, Lightbulb
} from 'lucide-react';
import { generateDishImage, editDishImage, analyzeDishNutrition, PREP_TEAM_PROMPT, DETECTION_SQUAD_PROMPT } from '../services/geminiService';

interface DishCardProps {
  dish: Dish;
  userCredits: number;
  currentStyle: PhotoStyle;
  currentSize: ImageSize;
  currentQuality: PhotoQuality;
  logoImage: string | null;
  locationImage: string | null;
  onUpdate: (id: string, updates: Partial<Dish>) => void;
  onCharge: (action: string, details: string) => void;
  onOpenPricing: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string, subMessage?: string) => void;
  isGenerationLimitReached: boolean;
  onKeyError?: () => void;
}

const ActionButton = ({
  icon: Icon, label, onClick, onClear, disabled = false, isActive = false, isMagic = false
}: {
  icon: LucideIcon, label: string, onClick: (e: React.MouseEvent) => void, onClear?: (e: React.MouseEvent) => void, disabled?: boolean, isActive?: boolean, isMagic?: boolean
}) => (
  <div className="relative w-full group/container">
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg transition-all text-[10px] font-black uppercase tracking-tighter disabled:opacity-30 disabled:cursor-not-allowed group/btn w-full ${
        isMagic
          ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/40 text-orange-400 hover:text-white hover:from-orange-600 hover:to-red-600 shadow-[0_0_15px_rgba(234,88,12,0.1)]'
          : isActive
            ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.1)]'
            : 'bg-zinc-900/40 hover:bg-zinc-800/80 border-zinc-800/50 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 shadow-sm'
      }`}
    >
      <Icon size={14} className={`${isMagic ? 'text-orange-500 group-hover/btn:text-white' : isActive ? 'text-orange-500' : 'text-zinc-500 group-hover/btn:text-orange-400'} transition-colors shrink-0`} />
      <span className="truncate relative z-10">{label}</span>
      {isMagic && <Sparkles size={10} className="absolute top-1 right-1 text-orange-500/40 group-hover/btn:text-white group-hover/btn:animate-ping" />}
    </button>
    {isActive && onClear && (
      <button
        onClick={(e) => { e.stopPropagation(); onClear(e); }}
        className="absolute -top-1.5 -right-1.5 p-1 bg-zinc-800 text-zinc-400 hover:text-white rounded-full border border-zinc-700 shadow-lg transition-all hover:bg-red-500/20 hover:border-red-500/40 z-20"
        title="Clear override"
      >
        <X size={10} />
      </button>
    )}
  </div>
);

const AspectRatioSelector = ({ value, onChange, disabled = false }: { value: AspectRatio, onChange: (val: AspectRatio) => void, disabled?: boolean }) => (
  <div className="relative group/select w-full">
    <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-zinc-500">
      <Ratio size={14} />
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AspectRatio)}
      disabled={disabled}
      className="appearance-none bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-lg pl-9 pr-2 py-2.5 w-full focus:outline-none focus:border-orange-500/50 cursor-pointer transition-all disabled:opacity-30"
      onClick={(e) => e.stopPropagation()}
    >
      <option value="1:1">1:1 SQUARE</option>
      <option value="3:4">3:4 PORTRAIT</option>
      <option value="4:3">4:3 LANDSCAPE</option>
      <option value="9:16">9:16 STORY</option>
      <option value="16:9">16:9 CINEMA</option>
    </select>
  </div>
);

const MAGIC_EXAMPLES: Record<string, any[]> = {
  location: [
    { id: "loc_dining", title: "Signature Dining", description: "Warm, inviting dining area with elegant settings", thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600", prompt: "Warm, inviting dining room with elegant table settings, soft ambient lighting from pendant fixtures, wooden tables with white tablecloths, wine glasses catching light, shallow depth of field focusing on nearest table, warm color temperature (2700K-3000K), professional food photography style", icon: Utensils, aspect: "4:5" },
    { id: "loc_kitchen", title: "Chef's Kitchen", description: "Dynamic behind-the-scenes plating action", thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600", prompt: "Dynamic shot of chef's hands plating a dish, steam rising from fresh ingredients, professional kitchen background slightly out of focus, dramatic side lighting creating depth, copper pots and stainless steel visible, motion captured mid-action, magazine aesthetic", icon: Zap, aspect: "1:1" },
    { id: "loc_patio", title: "Patio Ambiance", description: "Sunset terrace with Mediterranean furniture", thumbnail: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=600", prompt: "Sunset view of outdoor terrace with Mediterranean-style furniture, string lights beginning to glow, potted herbs on tables, city or nature backdrop, soft bokeh from fairy lights, blue hour timing, professional architectural quality", icon: Sun, aspect: "16:9" },
    { id: "loc_bar", title: "Bar & Cocktail", description: "Sophisticated station with backlit bottles", thumbnail: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600", prompt: "Sophisticated bar setup with bartender crafting cocktail, backlit liquor bottles creating amber glow, marble countertop with fresh ingredients, moody cinematic lighting, shallow focus on glass, beverage photography style", icon: GlassWater, aspect: "9:16" },
    { id: "loc_booth", title: "Intimate Booth", description: "Romantic booth with candles and flowers", thumbnail: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&q=80&w=600", prompt: "Cozy corner booth with plush velvet seating, intimate table for two set with candles and flowers, soft wall sconces creating romantic glow, wine bottle and glasses, upscale bistro atmosphere, lifestyle photography aesthetic", icon: Heart, aspect: "4:5" }
  ],
  logo: [
    { id: "logo_leather", title: "Leather Menu", description: "Embossed logo on rich chocolate cover", thumbnail: "https://images.unsplash.com/photo-1551024506-0bcc628d307?auto=format&fit=crop&q=80&w=600", prompt: "Premium leather-bound menu cover, logo embossed in gold foil, textured grain visible, product photography on dark wooden surface, dramatic side lighting, luxury restaurant aesthetic", icon: BookOpen, aspect: "1:1" },
    { id: "logo_ceramic", title: "Artisan Plate", description: "Subtle logo on rim of handcrafted plate", thumbnail: "https://images.unsplash.com/photo-1574966739982-2b7849ec330c?auto=format&fit=crop&q=80&w=600", prompt: "Handcrafted ceramic plate with restaurant logo subtly integrated into rim design, rustic-modern aesthetic, food-safe glaze finish, 45-degree angle on linen napkin, artisanal craftsmanship", icon: Circle, aspect: "1:1" },
    { id: "logo_sign", title: "Welcome Sign", description: "Laser-engraved logo on weathered wood", thumbnail: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=600", prompt: "Rustic reclaimed wood sign with laser-engraved logo and 'Welcome' message, hanging by rope, blurred greenery background, weathered wood texture, boutique restaurant entrance aesthetic", icon: DoorOpen, aspect: "4:5" },
    { id: "logo_takeout", title: "Branded Pack", description: "Premium eco-friendly box with logo", thumbnail: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=600", prompt: "Premium takeout box with logo prominently displayed, eco-friendly kraft paper, tied with branded ribbon, styled on marble counter, bright natural lighting, flat lay composition", icon: ShoppingBag, aspect: "1:1" },
    { id: "logo_wall", title: "Wall Installation", description: "3D backlit logo on textured brick wall", thumbnail: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600", prompt: "3D restaurant logo with backlit LED glow mounted on textured brick wall, warm white illumination creating halo effect, dusk atmosphere with ambient light, high-end installation aesthetic", icon: Lightbulb, aspect: "16:9" }
  ]
};

const DishCard: React.FC<DishCardProps> = ({ dish, userCredits, currentStyle, currentSize, currentQuality, logoImage, locationImage, onUpdate, onCharge, onOpenPricing, addToast, isGenerationLimitReached, onKeyError }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);
  const [magicCategory, setMagicCategory] = useState<'logo' | 'location'>('location');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isListening, setIsListening] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; callback: () => void; label: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setEditPrompt(prev => (prev.trim() + ' ' + transcript.trim()).trim());
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Recognition error', err);
      }
    }
  };

  const confirmPaidAction = (label: string, callback: () => void, type: string) => {
    if (userCredits < 1) {
      setPendingAction(null);
      addToast('error', 'Insufficient Credits', `You need 1 credit to edit. Current balance: ${userCredits} credits.`);
      onOpenPricing();
      return;
    }
    setPendingAction({ type, callback, label });
  };

  const executeGeneration = async () => {
    setPendingAction(null);
    onUpdate(dish.id, { isLoading: true, error: undefined });
    try {
      let finalDescription = dish.description;
      if (dish.magicLogoPrompt) finalDescription += `. ${dish.magicLogoPrompt}`;
      if (dish.magicLocationPrompt) finalDescription += `. ${dish.magicLocationPrompt}`;

      const imageUrl = await generateDishImage(
        dish.name, finalDescription, currentStyle, currentSize, currentQuality, aspectRatio,
        dish.logoImage || logoImage, dish.locationImage || locationImage, dish.referencePhoto
      );

      onCharge('PRODUCE', `${dish.name} (${currentStyle})`);
      onUpdate(dish.id, { imageUrl, isLoading: false });
    } catch (err: any) {
      let errorMsg = err?.message || "Generation failed.";
      if (errorMsg.includes("429")) {
        errorMsg = "QUOTA RESTRICTION: Paid Billing Required.";
        if (onKeyError) onKeyError();
      }
      onUpdate(dish.id, { isLoading: false, error: errorMsg });
      addToast('error', 'Technical Error', 'Edit failed due to server error. Your credit was NOT deducted.');
    }
  };

  const executeEdit = async (customPrompt?: string) => {
    setPendingAction(null);
    const promptToUse = customPrompt || editPrompt;
    if (!dish.imageUrl || !promptToUse.trim()) return;

    onUpdate(dish.id, { isEditing: true });
    try {
      const newImageUrl = await editDishImage(dish.imageUrl, promptToUse);
      onCharge('EDIT', `Magic Edit: ${dish.name}`);
      onUpdate(dish.id, { imageUrl: newImageUrl, isEditing: false });
      setIsEditMode(false);
      if (!customPrompt) setEditPrompt('');
    } catch (err: any) {
      onUpdate(dish.id, { isEditing: false, error: "Edit failed." });
      addToast('error', 'Technical Error', 'Edit failed due to server error. Your credit was NOT deducted.');
    }
  };

  const executeAnalyze = async () => {
    setPendingAction(null);
    if (!dish.imageUrl) return;
    onUpdate(dish.id, { isAnalyzing: true });
    try {
      const analysis = await analyzeDishNutrition(dish.imageUrl);
      onCharge('ANALYZE', `Analysis: ${dish.name}`);
      onUpdate(dish.id, { nutritionAnalysis: analysis, isAnalyzing: false });
      setShowNutrition(true);
    } catch (err: any) {
      onUpdate(dish.id, { isAnalyzing: false });
      addToast('error', 'Technical Error', 'Edit failed due to server error. Your credit was NOT deducted.');
    }
  };

  const handleDownload = () => {
    if (!dish.imageUrl) return;
    const link = document.createElement('a');
    link.href = dish.imageUrl;
    link.download = `${dish.name.replace(/\s+/g, '_').toLowerCase()}_michelin.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Download Started', 'Asset saved to your device.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'ref' | 'logo' | 'loc') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'ref') onUpdate(dish.id, { referencePhoto: base64, imageUrl: undefined });
        else if (type === 'logo') onUpdate(dish.id, { logoImage: base64 });
        else if (type === 'loc') onUpdate(dish.id, { locationImage: base64 });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const selectMagicExample = (ex: any) => {
    if (magicCategory === 'logo') onUpdate(dish.id, { magicLogoPrompt: ex.prompt });
    else onUpdate(dish.id, { magicLocationPrompt: ex.prompt });
    if (ex.aspect) setAspectRatio(ex.aspect as AspectRatio);
    setIsMagicModalOpen(false);
  };

  const isStudioFull = isGenerationLimitReached && !dish.isLoading && !dish.isEditing;
  const activeLogo = dish.logoImage || logoImage;
  const activeLocation = dish.locationImage || locationImage;

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'ref')} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={(e) => handleFileUpload(e, 'ref')} accept="image/*" capture="environment" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" className="hidden" />
      <input type="file" ref={locationInputRef} onChange={(e) => handleFileUpload(e, 'loc')} accept="image/*" className="hidden" />

      {pendingAction && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-sm p-10 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-6"><Coins size={32} /></div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">{pendingAction.label}</h3>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">Utilize 1 credit? (Balance: {userCredits})</p>
            <div className="space-y-3">
              <button onClick={pendingAction.callback} className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:opacity-90 transition-all">Confirm</button>
              <button onClick={() => setPendingAction(null)} className="w-full py-4 bg-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:text-white transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isMagicModalOpen && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-8" onClick={() => setIsMagicModalOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <h3 className="text-3xl font-serif font-bold text-white flex items-center gap-3"><Sparkles className="text-orange-500 animate-pulse" size={28} /> MAGIC EXAMPLES</h3>
              <button onClick={() => setIsMagicModalOpen(false)} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl transition-all"><X size={24} /></button>
            </div>
            <div className="flex p-6 gap-6 bg-zinc-950/50 border-b border-zinc-800">
              <button onClick={() => setMagicCategory('location')} className={`flex-1 max-w-[280px] h-20 rounded-2xl flex items-center justify-center gap-3 border transition-all ${magicCategory === 'location' ? 'bg-orange-600 text-white shadow-xl' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}><MapPin size={20} /> Locations</button>
              <button onClick={() => setMagicCategory('logo')} className={`flex-1 max-w-[280px] h-20 rounded-2xl flex items-center justify-center gap-3 border transition-all ${magicCategory === 'logo' ? 'bg-orange-600 text-white shadow-xl' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}><BadgeCheck size={20} /> Logo Placement</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {MAGIC_EXAMPLES[magicCategory].map((ex: any) => (
                <div key={ex.id} onClick={() => selectMagicExample(ex)} className="group cursor-pointer border border-zinc-800 bg-zinc-900/40 rounded-[2rem] overflow-hidden hover:border-orange-500/40 transition-all transform hover:-translate-y-2 flex flex-col h-full">
                  <div className="aspect-video bg-zinc-950 relative overflow-hidden shrink-0">
                    <img src={ex.thumbnail} alt={ex.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Sparkles className="text-white" size={32} /></div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-2">{ex.icon && <ex.icon className="text-orange-500" size={16} />}<h4 className="text-white font-bold text-base line-clamp-1">{ex.title}</h4></div>
                    <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed flex-grow">{ex.description}</p>
                    {ex.aspect && <span className="mt-4 text-[8px] font-black uppercase tracking-widest text-zinc-600">Optimized for {ex.aspect}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`bg-zinc-900/60 border rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-full transition-all duration-500 backdrop-blur-sm ${isStudioFull ? 'border-zinc-800 opacity-60' : 'border-zinc-800 hover:border-orange-500/30'}`}>
        <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden cursor-pointer group" onClick={() => { if(dish.imageUrl) setIsExpanded(true); }}>
          {dish.imageUrl ? (
            <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 p-6"><ImageIcon className="w-16 h-16 mb-3 opacity-10" /></div>
          )}

          {(dish.isLoading || dish.isEditing || dish.isAnalyzing) && (
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-10 p-6 text-center">
              <Loader2 className="animate-spin text-orange-500 w-12 h-12 mb-6" strokeWidth={1.5} />
              <span className="text-white text-sm font-black tracking-[0.2em] uppercase">Engaging AI Studio...</span>
            </div>
          )}

          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {activeLogo && <div className="bg-orange-600/80 backdrop-blur-md text-white p-2 rounded-xl border border-orange-400/30"><BadgeCheck size={16} /></div>}
            {activeLocation && <div className="bg-sky-600/80 backdrop-blur-md text-white p-2 rounded-xl border border-sky-400/30"><MapPin size={16} /></div>}
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-6">
            <h3 className="text-2xl font-serif font-bold text-zinc-100 mb-1.5 leading-tight">{dish.name}</h3>
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{dish.description}</p>
          </div>

          <div className="mt-auto space-y-3">
            <button
              onClick={() => confirmPaidAction(dish.imageUrl ? 'Regenerate' : 'Generate', executeGeneration, 'produce')}
              disabled={isStudioFull || dish.isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 text-white hover:opacity-90 active:scale-95 shadow-xl transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em]"
            >
              <RefreshCw size={18} className={dish.isLoading ? 'animate-spin' : ''} />
              {dish.imageUrl ? 'REGENERATE' : 'GENERATE (1 CR)'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} disabled={dish.isLoading} />
              <ActionButton icon={Upload} label="Upload Ref" onClick={() => fileInputRef.current?.click()} isActive={!!dish.referencePhoto} disabled={dish.isLoading} />
              <ActionButton icon={Camera} label="Live Ref" onClick={() => cameraInputRef.current?.click()} disabled={dish.isLoading} />
              <ActionButton icon={Edit2} label="Magic Edit" onClick={() => setIsEditMode(true)} disabled={!dish.imageUrl || dish.isLoading} />
              <ActionButton icon={BadgeCheck} label="Add Logo" onClick={() => logoInputRef.current?.click()} onClear={() => onUpdate(dish.id, { logoImage: undefined })} isActive={!!activeLogo} disabled={dish.isLoading} />
              <ActionButton icon={MapPin} label="Add Loc" onClick={() => locationInputRef.current?.click()} onClear={() => onUpdate(dish.id, { locationImage: undefined })} isActive={!!activeLocation} disabled={dish.isLoading} />
              <ActionButton icon={ScanEye} label="Nutrition" onClick={() => confirmPaidAction('Analyze', executeAnalyze, 'analyze')} disabled={!dish.imageUrl || dish.isLoading} />
              <ActionButton icon={Wand2} label="Magic Examples" isMagic={true} onClick={() => setIsMagicModalOpen(true)} disabled={dish.isLoading} />
            </div>

            {dish.imageUrl && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => confirmPaidAction('Deploy Prep Team', () => executeEdit(PREP_TEAM_PROMPT), 'edit')}
                  disabled={dish.isLoading || dish.isEditing}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-zinc-900/60 hover:bg-orange-600/20 border border-zinc-800 hover:border-orange-500/50 rounded-xl transition-all group/prep shadow-sm"
                >
                  <Users size={18} className="text-zinc-500 group-hover/prep:text-orange-500 group-hover/prep:scale-110 transition-all" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Prep Team</span>
                </button>
                <button
                  onClick={() => confirmPaidAction('Deploy Detection Squad', () => executeEdit(DETECTION_SQUAD_PROMPT), 'edit')}
                  disabled={dish.isLoading || dish.isEditing}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-zinc-900/60 hover:bg-sky-600/20 border border-zinc-800 hover:border-sky-500/50 rounded-xl transition-all group/det shadow-sm"
                >
                  <Search size={18} className="text-zinc-500 group-hover/det:text-sky-500 group-hover/det:scale-110 transition-all" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Detection Squad</span>
                </button>
              </div>
            )}

            {dish.imageUrl && (
              <button
                onClick={handleDownload}
                className="w-full mt-2 py-4 border-2 border-orange-600/60 hover:border-orange-500 rounded-2xl flex items-center justify-center gap-3 text-orange-500 font-black uppercase tracking-widest text-xs transition-all hover:bg-orange-600/5 active:scale-[0.98]"
              >
                <Download size={18} /> DOWNLOAD ASSET
              </button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && dish.imageUrl && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-4 sm:p-12 animate-in fade-in" onClick={() => setIsExpanded(false)}>
          <div className="relative max-w-7xl max-h-full">
            <img src={dish.imageUrl} alt={dish.name} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button className="absolute -top-16 right-0 p-3 bg-zinc-900/80 hover:bg-orange-600 rounded-full transition-all border border-white/10 shadow-xl"><X size={28} /></button>
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsEditMode(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={28} /></button>
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-orange-600/20 rounded-3xl flex items-center justify-center text-orange-500 mb-6 mx-auto shadow-xl"><Edit2 size={32} /></div>
              <h3 className="text-3xl font-serif font-bold text-white">Magic Retouch</h3>
              <p className="text-xs text-zinc-500 mt-2 font-black uppercase tracking-widest">1 Credit Required</p>
            </div>
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Ex: Change plate to rustic wood, add more basil..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl py-6 px-6 text-sm text-white focus:outline-none focus:border-orange-500/50 min-h-[120px] resize-none"
                />
                <button
                  onClick={toggleListening}
                  className={`absolute right-5 bottom-5 p-3.5 rounded-2xl shadow-xl border ${isListening ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                >
                  <Mic size={22} />
                </button>
              </div>
              <button
                onClick={() => confirmPaidAction('Magic Edit', executeEdit, 'edit')}
                disabled={!editPrompt.trim() || isStudioFull}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-orange-950/20 active:scale-95 transition-all"
              >
                Apply Magic (1 Credit)
              </button>
            </div>
          </div>
        </div>
      )}

      {showNutrition && dish.nutritionAnalysis && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8" onClick={() => setShowNutrition(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <h3 className="text-2xl font-serif font-bold text-white">Culinary Analysis</h3>
              <button onClick={() => setShowNutrition(false)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all shadow-md"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-zinc-950/30">
               <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-8 text-zinc-300 whitespace-pre-line text-sm leading-relaxed">{dish.nutritionAnalysis}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DishCard;
