import type { SttProvider } from "@/types/api";
import type { SttStrategy } from "./stt-strategy";
import { GroqWhisperStrategy } from "./groq-whisper";
import { OpenAIWhisperStrategy } from "./openai-whisper";
import { DeepgramNovaStrategy } from "./deepgram-nova";
import { GoogleCloudSttStrategy } from "./google-cloud-stt";

export function createSttStrategy(provider: SttProvider): SttStrategy {
  switch (provider) {
    case "groq-whisper":
      return new GroqWhisperStrategy();
    case "openai-whisper":
      return new OpenAIWhisperStrategy();
    case "deepgram-nova":
      return new DeepgramNovaStrategy();
    case "google-cloud-stt":
      return new GoogleCloudSttStrategy();
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`不明なSTTプロバイダー: ${exhaustiveCheck}`);
    }
  }
}

export type { SttResult, SttStrategy } from "./stt-strategy";
