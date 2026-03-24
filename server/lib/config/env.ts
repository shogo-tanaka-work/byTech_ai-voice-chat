import type { ProviderInfo } from "@/types/api";
import {
  STT_PROVIDER_NAMES,
  TTS_PROVIDER_NAMES,
  type SttProvider,
  type TtsProvider,
} from "@/types/api";

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value;
}

export function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

const STT_ENV_KEYS: Record<SttProvider, string[]> = {
  "groq-whisper": ["GROQ_API_KEY"],
  "openai-whisper": ["OPENAI_API_KEY"],
  "deepgram-nova": ["DEEPGRAM_API_KEY"],
  "google-cloud-stt": ["GOOGLE_CLOUD_API_KEY"],
};

const TTS_ENV_KEYS: Record<TtsProvider, string[]> = {
  "minimax-speech": ["MINIMAX_API_KEY", "MINIMAX_GROUP_ID"],
  "elevenlabs-flash": ["ELEVENLABS_API_KEY"],
  "cartesia-sonic": ["CARTESIA_API_KEY"],
};

function hasAllKeys(keys: string[]): boolean {
  return keys.every((key) => !!process.env[key]);
}

export function getAvailableSttProviders(): ProviderInfo[] {
  return (
    Object.entries(STT_ENV_KEYS) as [SttProvider, string[]][]
  )
    .filter(([_, keys]) => hasAllKeys(keys))
    .map(([id]) => ({
      id,
      name: STT_PROVIDER_NAMES[id],
    }));
}

export function getAvailableTtsProviders(): ProviderInfo[] {
  return (
    Object.entries(TTS_ENV_KEYS) as [TtsProvider, string[]][]
  )
    .filter(([_, keys]) => hasAllKeys(keys))
    .map(([id]) => ({
      id,
      name: TTS_PROVIDER_NAMES[id],
    }));
}

export function isLlmAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
