import type { TtsProvider } from "@/types/api";
import { getRequiredEnv } from "@server/lib/config/env";
import type { TtsOptions, TtsResult, TtsStrategy } from "./tts-strategy";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export class ElevenLabsFlashStrategy implements TtsStrategy {
  readonly provider: TtsProvider = "elevenlabs-flash";
  private readonly apiKey: string;

  constructor() {
    this.apiKey = getRequiredEnv("ELEVENLABS_API_KEY");
  }

  async synthesize(options: TtsOptions): Promise<TtsResult> {
    const start = performance.now();
    const voiceId = options.voiceId ?? DEFAULT_VOICE_ID;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: options.text,
          model_id: "eleven_flash_v2_5",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const audio = Buffer.from(arrayBuffer);
      const durationMs = performance.now() - start;

      return {
        audio,
        mimeType: "audio/mpeg",
        durationMs,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "不明なエラー";
      throw new Error(`ElevenLabs TTS変換に失敗しました: ${message}`);
    }
  }
}
