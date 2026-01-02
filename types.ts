export interface Attachment {
  type: 'image' | 'file';
  mimeType: string;
  data: string; // base64
  name: string;
  content?: string; // Text content for parsed files
}

export interface SearchResult {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
  timestamp: number;
  sources?: SearchResult[];
  isStreaming?: boolean;
  images?: string[]; // Generated images by AI
  imageError?: boolean;
  attachments?: Attachment[]; // User uploaded attachments
  steps?: string; // Detailed reasoning/steps
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  themeColor: string;
  bgColor: string;
  icon: string;
}

export interface AppSettings {
  model: string;
  temperature: number;
  enableSearch: boolean;
  apiKey: string;
}

export interface NotificationType {
  id: string;
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
}
