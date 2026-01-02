import React, { useEffect } from 'react';
import { AppSettings } from '../types';
import { TEXT_MODEL, REASONING_MODEL, SETTINGS_KEY } from '../constants';

interface Props {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<Props> = ({ settings, setSettings, isOpen, onClose }) => {
  
  // Auto-save whenever settings change
  useEffect(() => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleChange = (key: keyof AppSettings, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-armin-primary/20 blur-[50px] rounded-full -mr-10 -mt-10"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <span className="text-3xl">⚙️</span> تنظیمات هسته مرکزی
            </h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all">✕</button>
        </div>

        <div className="space-y-6 relative z-10">
            {/* API Key */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-armin-secondary">🔑 کلید API (Gemini)</label>
                <div className="relative">
                    <input 
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => handleChange('apiKey', e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-armin-primary focus:ring-1 focus:ring-armin-primary focus:outline-none transition-all"
                    />
                </div>
                <p className="text-xs text-white/40">برای استفاده از قدرت ماورایی، کلید خود را از <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a> بگیرید.</p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-white/80">🧠 مدل هوش مصنوعی</label>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleChange('model', TEXT_MODEL)}
                        className={`p-3 rounded-xl border text-sm transition-all ${settings.model === TEXT_MODEL ? 'bg-armin-primary/20 border-armin-primary text-white' : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'}`}
                    >
                        سرعت بالا (Flash 2.0)
                    </button>
                    <button 
                        onClick={() => handleChange('model', REASONING_MODEL)}
                        className={`p-3 rounded-xl border text-sm transition-all ${settings.model === REASONING_MODEL ? 'bg-armin-secondary/20 border-armin-secondary text-white' : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'}`}
                    >
                        قدرت استدلال (Thinking)
                    </button>
                </div>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-sm font-bold text-white/80">🌡️ درجه خلاقیت (Temperature)</label>
                    <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white">{settings.temperature}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                    className="w-full accent-armin-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/30">
                    <span>دقیق و منطقی</span>
                    <span>خلاق و ماورایی</span>
                </div>
            </div>

            {/* Search Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">🌐 دسترسی به اینترنت</span>
                    <span className="text-xs text-white/50">جستجوی گوگل برای اطلاعات جدید</span>
                </div>
                <div 
                    onClick={() => handleChange('enableSearch', !settings.enableSearch)}
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.enableSearch ? 'bg-green-500' : 'bg-white/20'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.enableSearch ? 'translate-x-0' : '-translate-x-6'}`}></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
