import type { SttProvider, TtsProvider } from "./api";

export interface ChatUsage {
  stt: SttUsage;
  llm: LlmUsage;
  tts: TtsUsage;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  usage?: ChatUsage;
  timestamp: number;
}

export type ChatStatus =
  | "idle"
  | "recording"
  | "transcribing"
  | "thinking"
  | "speaking";

export interface ChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | null;
}

export interface ChatRequest {
  audio: Blob;
  sttProvider: SttProvider;
  ttsProvider: TtsProvider;
  messages: ChatMessage[];
}

export interface SttUsage {
  provider: string;
  durationMs: number;
}

export interface LlmUsage {
  provider: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export interface TtsUsage {
  provider: string;
  characters: number;
  durationMs: number;
}

export interface ChatResponse {
  transcript: string;
  response: string;
  audioBase64: string;
  audioMimeType: string;
  usage: {
    stt: SttUsage;
    llm: LlmUsage;
    tts: TtsUsage;
  };
}
