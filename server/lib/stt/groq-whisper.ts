import Groq from "groq-sdk";
import { getRequiredEnv } from "@server/lib/config/env";
import type { SttResult, SttStrategy } from "./stt-strategy";

export class GroqWhisperStrategy implements SttStrategy {
  readonly provider = "groq-whisper" as const;
  private readonly client: Groq;

  constructor() {
    const apiKey = getRequiredEnv("GROQ_API_KEY");
    this.client = new Groq({ apiKey });
  }

  async transcribe(audio: Buffer, mimeType: string): Promise<SttResult> {
    const startTime = performance.now();

    try {
      const file = new File([new Uint8Array(audio)], `audio.${extensionFromMime(mimeType)}`, {
        type: mimeType,
      });

      const response = await this.client.audio.transcriptions.create({
        file,
        model: "whisper-large-v3",
        language: "ja",
      });

      const durationMs = Math.round(performance.now() - startTime);

      return {
        text: response.text,
        language: "ja",
        durationMs,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "不明なエラー";
      throw new Error(`Groq Whisper STT変換に失敗しました: ${message}`);
    }
  }
}

function extensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/wav": "wav",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
  };
  return map[mimeType] ?? "webm";
}
