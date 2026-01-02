import React, { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';
import Settings from './Settings';
import Notification from './Notification';
import { Persona, AppSettings, NotificationType } from '../types';
import { PERSONAS, TEXT_MODEL, SETTINGS_KEY, API_KEY_KEY } from '../constants';

const App: React.FC = () => {
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    model: TEXT_MODEL,
    temperature: 0.7,
    enableSearch: true,
    apiKey: ''
  });

  useEffect(() => {
    // Load settings from local storage
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            setSettings(JSON.parse(saved));
        } catch { /* ignore */ }
    } else {
        // First time load: show settings to ask for key
        setTimeout(() => {
             setShowSettings(true);
             setNotification({ id: 'welcome', type: 'info', message: 'به آرمین خوش آمدید. لطفاً برای شروع کلید API را وارد کنید.' });
        }, 1000);
    }
  }, []);

  const handleError = (msg: string) => {
      setNotification({ id: Date.now().toString(), type: 'error', message: msg });
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-white overflow-hidden font-sans" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-50 pointer-events-none"></div>

      <Notification notification={notification} onClose={() => setNotification(null)} />
      <Settings settings={settings} setSettings={setSettings} isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-black bg-opacity-40 backdrop-blur-xl border-l border-white border-opacity-5 p-4 z-20">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-l from-purple-600 to-yellow-500 animate-pulse">
                Armin AI
            </h1>
            <p className="text-xs tracking-widest text-white text-opacity-40 mt-1 uppercase">Extraterrestrial Intelligence</p>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto pr-1 pl-1">
            <div className="text-xs text-white text-opacity-30 px-2 mb-1">پرسوناها (مشاغل)</div>
            {PERSONAS.map(p => (
                <button
                    key={p.id}
                    onClick={() => setActivePersona(p)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${activePersona.id === p.id
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 border-white border-opacity-20 text-white shadow-lg transform scale-105'
                        : 'bg-white bg-opacity-5 border-transparent text-white text-opacity-60 hover:bg-white hover:bg-opacity-10 hover:text-white'}`}
                >
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm">{p.name}</span>
                        <span className="text-xs opacity-70 truncate max-w-32">{p.description}</span>
                    </div>
                </button>
            ))}
        </nav>

        <button
            onClick={() => setShowSettings(true)}
            className={`mt-4 w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white bg-opacity-5 hover:bg-white hover:bg-opacity-10 transition-all border border-white border-opacity-5 ${!settings.apiKey ? 'border-red-500 animate-pulse text-red-400' : 'text-white text-opacity-50'}`}
        >
            <span>⚙️</span>
            <span className="text-sm font-bold">تنظیمات سیستم</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full">
         {/* Mobile Header */}
         <div className="md:hidden h-16 bg-black bg-opacity-50 backdrop-blur flex items-center justify-between px-4 border-b border-white border-opacity-10 z-30">
            <div className="flex items-center gap-2">
                <span className="text-2xl">{activePersona.icon}</span>
                <span className="font-bold">{activePersona.name}</span>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2">⚙️</button>
         </div>

         {/* Chat Area */}
         <div className="flex-1 relative">
            <ChatInterface key={activePersona.id} persona={activePersona} settings={settings} onError={handleError} />
         </div>
      </main>
    </div>
  );
};

export default App;
