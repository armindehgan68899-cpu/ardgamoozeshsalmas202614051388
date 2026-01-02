import { GoogleGenAI } from "@google/genai";
import { AppSettings, Message, Attachment } from '../types';
import { IMAGE_MODEL, TEXT_MODEL, VISION_MODEL } from '../constants';

const getClient = (apiKey: string) => {
    // Prioritize environment variable as per coding guidelines
    const key = process.env.API_KEY || apiKey;
    if (!key) throw new Error("کلید API یافت نشد.");
    return new GoogleGenAI({ apiKey: key });
};

// Helper to parse text-based files locally to save complex processing
const parseFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

const readFileBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const res = e.target?.result as string;
            resolve(res.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const streamResponse = async (
    settings: AppSettings,
    history: Message[],
    systemInstruction: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal
): Promise<{ text: string, sources: any[], steps?: string }> => {
    const ai = getClient(settings.apiKey);
    
    // Prepare history
    const contents = history.map(msg => {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.attachments) {
            msg.attachments.forEach(att => {
                // If it's a text file (CSV/JSON/Code), we inject it as text for better reasoning
                if (att.content) {
                    parts.push({ text: `\n--- FILE: ${att.name} ---\n${att.content}\n--- END FILE ---\n` });
                } else {
                    parts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
                }
            });
        }
        return { role: msg.role, parts };
    });

    // Configuration
    const tools: any[] = [];
    if (settings.enableSearch) {
        tools.push({ googleSearch: {} });
    }

    const chat = ai.chats.create({
        model: settings.model || TEXT_MODEL,
        config: {
            systemInstruction,
            temperature: settings.temperature,
            tools: tools,
        },
        history: contents.slice(0, -1) // All except last
    });

    const lastMsg = contents[contents.length - 1];
    
    try {
        const result = await chat.sendMessageStream({ 
            message: lastMsg.parts 
        });

        let fullText = "";
        let sources: any[] = [];
        
        for await (const chunk of result) {
            if (signal?.aborted) break;
            
            const text = chunk.text;
            if (text) {
                fullText += text;
                onChunk(text);
            }
            
            // Extract grounding (Search results)
            const grounding = chunk.candidates?.[0]?.groundingMetadata;
            if (grounding?.groundingChunks) {
                grounding.groundingChunks.forEach((c: any) => {
                    if (c.web?.uri) {
                        sources.push({ title: c.web.title || "منبع وب", uri: c.web.uri });
                    }
                });
            }
        }
        
        // Dedup sources
        sources = sources.filter((v,i,a)=>a.findIndex(t=>(t.uri===v.uri))===i);

        return { text: fullText, sources };

    } catch (error: any) {
        console.error("Gemini API Error", error);
        let msg = error.message || "خطای ناشناخته";
        if (msg.includes("429") || msg.includes("quota")) msg = "سهمیه استفاده تمام شده است (Quota Exceeded). لطفاً کمی صبر کنید.";
        if (msg.includes("API key")) msg = "کلید API نامعتبر است.";
        throw new Error(msg);
    }
};

export const generateImage = async (prompt: string, settings: AppSettings): Promise<string> => {
    const ai = getClient(settings.apiKey);
    try {
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: { parts: [{ text: prompt }] },
            config: {} // defaults
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("تصویری تولید نشد. مدل متن برگرداند.");
    } catch (e: any) {
        throw new Error("خطا در تولید تصویر: " + e.message);
    }
};

export const generateImageContent = async (prompt: string, settings: AppSettings): Promise<string> => {
    return generateImage(prompt, settings);
};

export const analyzeFile = async (
    files: File[], 
    prompt: string, 
    model: string, 
    systemInstruction: string, 
    settings: AppSettings
): Promise<string> => {
    const ai = getClient(settings.apiKey);
    
    const parts: any[] = [{ text: prompt }];

    for (const file of files) {
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            const base64 = await readFileBase64(file);
            parts.push({
                inlineData: {
                    mimeType: file.type,
                    data: base64
                }
            });
        } else {
            const text = await parseFileContent(file);
            parts.push({ text: `\n--- File: ${file.name} ---\n${text}\n--- End File ---\n` });
        }
    }

    const response = await ai.models.generateContent({
        model: model || TEXT_MODEL,
        contents: { parts },
        config: { systemInstruction }
    });

    return response.text || "تحلیلی دریافت نشد.";
};

export const analyzeImage = async (file: File, prompt: string, model: string, settings: AppSettings): Promise<string> => {
    const ai = getClient(settings.apiKey);
    const base64 = await readFileBase64(file);
    
    const response = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: {
            parts: [
                { inlineData: { mimeType: file.type, data: base64 } },
                { text: prompt }
            ]
        }
    });
    
    return response.text || "توضیحی دریافت نشد.";
};

export const explainStepByStep = async (question: string, answer: string, settings: AppSettings): Promise<string> => {
    const ai = getClient(settings.apiKey);
    const prompt = `Question: ${question}\nYour Answer: ${answer}\n\nExplain the logic step-by-step in detail (Persian).`;
    const response = await ai.models.generateContent({
        model: settings.model || TEXT_MODEL,
        contents: prompt
    });
    return response.text || "توضیحی موجود نیست.";
};