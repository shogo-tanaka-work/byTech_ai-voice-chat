import type { TtsProvider } from "@/types/api";
import type { TtsStrategy } from "./tts-strategy";
import { MinimaxSpeechStrategy } from "./minimax-speech";
import { ElevenLabsFlashStrategy } from "./elevenlabs-flash";
import { CartesiaSonicStrategy } from "./cartesia-sonic";

export function createTtsStrategy(provider: TtsProvider): TtsStrategy {
  switch (provider) {
    case "minimax-speech":
      return new MinimaxSpeechStrategy();
    case "elevenlabs-flash":
      return new ElevenLabsFlashStrategy();
    case "cartesia-sonic":
      return new CartesiaSonicStrategy();
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(
        `未対応のTTSプロバイダー: ${exhaustiveCheck as string}`,
      );
    }
  }
}
