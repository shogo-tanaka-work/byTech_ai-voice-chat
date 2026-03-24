export const STT_PROVIDERS = [
  "groq-whisper",
  "openai-whisper",
  "deepgram-nova",
  "google-cloud-stt",
] as const;

export type SttProvider = (typeof STT_PROVIDERS)[number];

export const TTS_PROVIDERS = [
  "minimax-speech",
  "elevenlabs-flash",
  "cartesia-sonic",
] as const;

export type TtsProvider = (typeof TTS_PROVIDERS)[number];

export const LLM_PROVIDER = "claude-haiku" as const;
export type LlmProvider = typeof LLM_PROVIDER;

export interface ProviderInfo {
  id: string;
  name: string;
}

export interface LlmProviderInfo {
  available: boolean;
  provider: LlmProvider;
  name: string;
}

export interface ProvidersResponse {
  stt: ProviderInfo[];
  llm: LlmProviderInfo;
  tts: ProviderInfo[];
}

export const STT_PROVIDER_NAMES: Record<SttProvider, string> = {
  "groq-whisper": "Groq Whisper Large v3",
  "openai-whisper": "OpenAI Whisper",
  "deepgram-nova": "Deepgram Nova-3",
  "google-cloud-stt": "Google Cloud STT",
};

export const TTS_PROVIDER_NAMES: Record<TtsProvider, string> = {
  "minimax-speech": "MINIMAX speech-2.6-turbo",
  "elevenlabs-flash": "ElevenLabs Flash",
  "cartesia-sonic": "Cartesia Sonic-3",
};
