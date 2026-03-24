import { getRequiredEnv } from "@server/lib/config/env";
import type { SttResult, SttStrategy } from "./stt-strategy";

const GOOGLE_STT_ENDPOINT =
  "https://speech.googleapis.com/v1/speech:recognize";

interface GoogleSttAlternative {
  transcript: string;
}

interface GoogleSttResult {
  alternatives: GoogleSttAlternative[];
}

interface GoogleSttResponse {
  results?: GoogleSttResult[];
}

export class GoogleCloudSttStrategy implements SttStrategy {
  readonly provider = "google-cloud-stt" as const;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = getRequiredEnv("GOOGLE_CLOUD_API_KEY");
  }

  async transcribe(audio: Buffer, _mimeType: string): Promise<SttResult> {
    const startTime = performance.now();

    try {
      const base64Audio = audio.toString("base64");

      const response = await fetch(
        `${GOOGLE_STT_ENDPOINT}?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              encoding: "WEBM_OPUS",
              sampleRateHertz: 48000,
              languageCode: "ja-JP",
            },
            audio: {
              content: base64Audio,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `APIレスポンスエラー: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as GoogleSttResponse;
      const transcript =
        data.results?.[0]?.alternatives[0]?.transcript ?? "";

      const durationMs = Math.round(performance.now() - startTime);

      return {
        text: transcript,
        language: "ja",
        durationMs,
      };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.startsWith("Google Cloud STT")
      ) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : "不明なエラー";
      throw new Error(`Google Cloud STT変換に失敗しました: ${message}`);
    }
  }
}
