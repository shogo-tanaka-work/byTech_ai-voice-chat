import OpenAI from "openai";
import { getRequiredEnv } from "@server/lib/config/env";
import type { SttResult, SttStrategy } from "./stt-strategy";

export class OpenAIWhisperStrategy implements SttStrategy {
  readonly provider = "openai-whisper" as const;
  private readonly client: OpenAI;

  constructor() {
    const apiKey = getRequiredEnv("OPENAI_API_KEY");
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audio: Buffer, mimeType: string): Promise<SttResult> {
    const startTime = performance.now();

    try {
      const file = new File([new Uint8Array(audio)], `audio.${extensionFromMime(mimeType)}`, {
        type: mimeType,
      });

      const response = await this.client.audio.transcriptions.create({
        file,
        model: "whisper-1",
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
      throw new Error(`OpenAI Whisper STT変換に失敗しました: ${message}`);
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
