import React, { useState, useRef, useEffect } from 'react';
import { Message, AppSettings, Persona, Attachment } from '../types';
import { streamResponse, explainStepByStep, generateImage } from '../services/geminiService';
import Notification from './Notification';

// Icons
const EditIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const RefreshIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const SearchIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

declare global { interface Window { MathJax: any; webkitSpeechRecognition: any; } }

const MessageBubble: React.FC<{ 
    msg: Message, 
    onEdit: (id: string, newText: string) => void,
    onShowSteps: (id: string) => void,
    settings: AppSettings
}> = ({ msg, onEdit, onShowSteps, settings }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(msg.content);

    useEffect(() => {
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise();
        }
    }, [msg.content, msg.steps]);

    const handleSave = () => { setIsEditing(false); onEdit(msg.id, editText); };

    // Basic Markdown Parser (simplified for React)
    const renderContent = (text: string) => {
        // Split by code blocks and images
        const parts = text.split(/(```[\s\S]*?```|\[GENERATE_IMAGE:.*?\])/g);
        return parts.map((part, i) => {
            if (part.startsWith('```')) {
                const lines = part.replace(/```(\w+)?\n?/, '').replace(/```$/, '').split('\n');
                const lang = part.match(/```(\w+)/)?.[1] || 'code';
                return (
                    <div key={i} className="my-3 rounded-lg overflow-hidden bg-[#1e1e1e] border border-white/10 shadow-lg text-left" dir="ltr">
                        <div className="bg-[#2d2d2d] px-3 py-1 text-xs text-white/50 flex justify-between">
                            <span>{lang}</span>
                            <button onClick={() => navigator.clipboard.writeText(lines.join('\n'))} className="hover:text-white">Copy</button>
                        </div>
                        <pre className="p-3 text-sm text-green-400 font-mono overflow-x-auto">
                            {lines.join('\n')}
                        </pre>
                    </div>
                );
            }
            if (part.startsWith('[GENERATE_IMAGE:')) {
                return <div key={i} className="text-armin-secondary text-xs animate-pulse my-2">🎨 در حال پردازش تصویر: {part.slice(16, -1)}...</div>;
            }
            // Paragraphs & Math
            return <p key={i} className="whitespace-pre-wrap mb-2 leading-7" dangerouslySetInnerHTML={{
                __html: part
                    .replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-bold">$1</b>')
                    .replace(/__(.*?)__/g, '<i>$1</i>')
                    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-pink-300 font-mono text-xs">$1</code>')
            }} />;
        });
    };

    return (
        <div className={`flex w-full mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
            <div className={`relative max-w-[95%] md:max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' 
                ? 'bg-armin-primary/20 border border-armin-primary/50 text-white rounded-tr-none' 
                : 'bg-slate-800/80 backdrop-blur border border-white/10 rounded-tl-none shadow-[0_0_15px_rgba(0,0,0,0.3)]'} `}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-2 opacity-50 text-[10px]">
                    <span>{msg.role === 'user' ? 'شما' : 'Armin AI'}</span>
                    <span className="flex gap-2">
                        {new Date(msg.timestamp).toLocaleTimeString('fa-IR')}
                        {msg.role === 'user' && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><EditIcon/></button>
                        )}
                    </span>
                </div>

                {/* Attachments */}
                {msg.attachments && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {msg.attachments.map((att, i) => (
                            <div key={i} className="bg-black/30 p-2 rounded flex items-center gap-2 text-xs border border-white/10">
                                <span className="text-lg">{att.type === 'image' ? '🖼️' : '📄'}</span>
                                <span className="max-w-[150px] truncate">{att.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="bg-black/40 border border-white/20 rounded p-2 text-white w-full h-24" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsEditing(false)} className="text-xs text-white/50">لغو</button>
                            <button onClick={handleSave} className="text-xs bg-armin-primary px-3 py-1 rounded">ذخیره و ارسال</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm md:text-base text-gray-200">
                        {renderContent(msg.content)}
                    </div>
                )}

                {/* Generated Images */}
                {msg.images && msg.images.map((img, i) => (
                    <div key={i} className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-lg relative group/img">
                        <img src={img} className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <a href={img} download={`armin-ai-${Date.now()}.png`} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold">دانلود تصویر</a>
                        </div>
                    </div>
                ))}

                {/* Sources / Search Results */}
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {msg.sources.map((s, i) => (
                            <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/5 p-2 rounded hover:bg-white/10 transition-colors text-xs text-blue-300 truncate">
                                <SearchIcon /> {s.title}
                            </a>
                        ))}
                    </div>
                )}

                {/* Steps / Reasoning */}
                {msg.role === 'model' && !msg.isStreaming && !msg.isError && (
                    <div className="mt-3 flex gap-2">
                        <button onClick={() => onShowSteps(msg.id)} className="text-[10px] bg-armin-secondary/20 hover:bg-armin-secondary/40 text-armin-secondary px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                           👣 نمایش مراحل تفکر
                        </button>
                    </div>
                )}
                
                {msg.steps && (
                    <div className="mt-3 p-3 bg-black/20 rounded-lg border-r-2 border-armin-secondary text-xs text-gray-400 animate-fade-in">
                        <div className="font-bold text-armin-secondary mb-1">مسیر استدلال:</div>
                        {msg.steps}
                    </div>
                )}

                {msg.isError && <div className="mt-2 text-xs text-red-400 bg-red-900/10 p-2 rounded">⚠️ {msg.content}</div>}
            </div>
        </div>
    );
};

interface Props {
  persona: Persona;
  settings: AppSettings;
  onError: (msg: string) => void;
}

const ChatInterface: React.FC<Props> = ({ persona, settings, onError }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = async (text: string = input, overrideHistory?: Message[]) => {
      if (!text.trim() && attachments.length === 0) return;
      if (!settings.apiKey) return onError("کلید API را در تنظیمات وارد کنید!");

      const abortCtrl = new AbortController();
      setController(abortCtrl);
      setLoading(true);
      setInput('');

      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now(), attachments: [...attachments] };
      const newHistory = overrideHistory ? [...overrideHistory, userMsg] : [...messages, userMsg];
      setMessages(newHistory);
      setAttachments([]);

      const botId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botId, role: 'model', content: '', timestamp: Date.now(), isStreaming: true }]);

      try {
          const res = await streamResponse(settings, newHistory, persona.systemPrompt, (chunk) => {
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: m.content + chunk } : m));
          }, abortCtrl.signal);
          
          // Post-processing: Check for image tags
          const imgMatch = res.text.match(/\[GENERATE_IMAGE: (.*?)\]/);
          let imageUrls: string[] = [];
          if (imgMatch) {
               try {
                   const img = await generateImage(imgMatch[1], settings);
                   imageUrls.push(img);
               } catch(e) { onError("خطا در تولید تصویر"); }
          }

          setMessages(prev => prev.map(m => m.id === botId ? { 
              ...m, 
              content: res.text, 
              sources: res.sources, 
              isStreaming: false,
              images: imageUrls.length ? imageUrls : undefined
          } : m));

      } catch (err: any) {
          if (err.name !== 'AbortError') {
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, isError: true, content: err.message, isStreaming: false } : m));
              onError(err.message);
          }
      } finally {
          setLoading(false);
          setController(null);
      }
  };

  const handleEdit = (id: string, newText: string) => {
      const idx = messages.findIndex(m => m.id === id);
      if (idx === -1) return;
      const historyUntilNow = messages.slice(0, idx); // Cut history
      handleSend(newText, historyUntilNow);
  };

  const handleShowSteps = async (id: string) => {
      const idx = messages.findIndex(m => m.id === id);
      if (idx === -1) return;
      const msg = messages[idx];
      if (msg.steps) return; // Already loaded

      const userMsg = messages[idx - 1];
      try {
          setMessages(prev => prev.map(m => m.id === id ? { ...m, steps: 'در حال تحلیل...' } : m));
          const steps = await explainStepByStep(userMsg?.content || "Context", msg.content, settings);
          setMessages(prev => prev.map(m => m.id === id ? { ...m, steps: steps } : m));
      } catch (e: any) { onError(e.message); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newAtts: Attachment[] = [];
          for (const file of Array.from(e.target.files)) {
              if (file.size > 4 * 1024 * 1024) { onError(`${file.name} خیلی حجیم است.`); continue; }
              const isImage = file.type.startsWith('image/');
              const isText = file.type.includes('json') || file.type.includes('csv') || file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.txt');
              
              const reader = new FileReader();
              const p = new Promise<void>(resolve => {
                  reader.onload = (ev) => {
                      const res = ev.target?.result as string;
                      if (isText) {
                          newAtts.push({ type: 'file', mimeType: 'text/plain', data: '', name: file.name, content: res });
                      } else {
                          newAtts.push({ type: isImage ? 'image' : 'file', mimeType: file.type, data: res.split(',')[1], name: file.name });
                      }
                      resolve();
                  };
                  if (isText) reader.readAsText(file); else reader.readAsDataURL(file);
              });
              await p;
          }
          setAttachments(prev => [...prev, ...newAtts]);
      }
  };

  const stop = () => { controller?.abort(); setLoading(false); };

  return (
    <div className={`flex flex-col h-full relative ${persona.bgColor}`}>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-white/20 animate-fade-in">
                    <span className="text-8xl mb-4 grayscale opacity-20">{persona.icon}</span>
                    <h2 className="text-2xl font-bold">{persona.name}</h2>
                    <p className="text-sm mt-2">{persona.description}</p>
                </div>
            )}
            {messages.map(m => (
                <MessageBubble key={m.id} msg={m} onEdit={handleEdit} onShowSteps={handleShowSteps} settings={settings} />
            ))}
            {loading && <div className="text-center text-xs text-armin-accent animate-pulse">🔮 آرمین در حال تفکر فرازمینی...</div>}
            <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/90 border-t border-white/10 backdrop-blur-xl relative z-20">
            {/* Attachment Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                    {attachments.map((a, i) => (
                        <div key={i} className="bg-white/10 px-3 py-1 rounded-full text-xs flex items-center gap-2 text-white whitespace-nowrap">
                            <span>{a.type === 'image' ? '🖼️' : '📄'}</span> {a.name} 
                            <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400">×</button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="max-w-4xl mx-auto flex items-end gap-3">
                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.txt,.csv,.json,.js,.py" />
                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/70 transition-colors" title="آپلود فایل">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                    placeholder={`پیام به ${persona.name}... (برای جستجو بپرسید، برای تصویر بنویسید "تصویر بساز")`}
                    className="flex-1 bg-white/5 border border-white/10 focus:border-armin-primary/50 rounded-2xl px-4 py-3 text-white max-h-32 min-h-[50px] resize-none focus:outline-none transition-all placeholder:text-white/20"
                />

                {loading ? (
                    <button onClick={stop} className="p-3 bg-red-500/80 hover:bg-red-600 rounded-full text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
                        <span className="w-6 h-6 block font-bold text-center">■</span>
                    </button>
                ) : (
                    <button onClick={() => handleSend()} disabled={!input.trim() && !attachments.length} className="p-3 bg-gradient-to-r from-armin-primary to-armin-secondary rounded-full text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100">
                        <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default ChatInterface;
