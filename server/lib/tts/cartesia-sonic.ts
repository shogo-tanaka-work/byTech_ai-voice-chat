import type { TtsProvider } from "@/types/api";
import { getRequiredEnv } from "@server/lib/config/env";
import type { TtsOptions, TtsResult, TtsStrategy } from "./tts-strategy";

const DEFAULT_VOICE_ID = "a0e99841-438c-4a64-b679-ae501e7d6091";
const CARTESIA_API_URL = "https://api.cartesia.ai/tts/bytes";

export class CartesiaSonicStrategy implements TtsStrategy {
  readonly provider: TtsProvider = "cartesia-sonic";
  private readonly apiKey: string;

  constructor() {
    this.apiKey = getRequiredEnv("CARTESIA_API_KEY");
  }

  async synthesize(options: TtsOptions): Promise<TtsResult> {
    const start = performance.now();

    try {
      const response = await fetch(CARTESIA_API_URL, {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          "Cartesia-Version": "2024-06-10",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: "sonic-2",
          transcript: options.text,
          voice: {
            mode: "id",
            id: options.voiceId ?? DEFAULT_VOICE_ID,
          },
          output_format: {
            container: "mp3",
            bit_rate: 128000,
            sample_rate: 44100,
          },
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
      throw new Error(`Cartesia TTS変換に失敗しました: ${message}`);
    }
  }
}
