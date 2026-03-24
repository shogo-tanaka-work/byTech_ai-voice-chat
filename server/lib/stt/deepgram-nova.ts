import { createClient } from "@deepgram/sdk";
import { getRequiredEnv } from "@server/lib/config/env";
import type { SttResult, SttStrategy } from "./stt-strategy";

interface DeepgramAlternative {
  transcript: string;
}

interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

interface DeepgramTranscriptionResponse {
  result: {
    results: {
      channels: DeepgramChannel[];
    };
  };
}

export class DeepgramNovaStrategy implements SttStrategy {
  readonly provider = "deepgram-nova" as const;
  private readonly client: ReturnType<typeof createClient>;

  constructor() {
    const apiKey = getRequiredEnv("DEEPGRAM_API_KEY");
    this.client = createClient(apiKey);
  }

  async transcribe(audio: Buffer, _mimeType: string): Promise<SttResult> {
    const startTime = performance.now();

    try {
      const response = (await this.client.listen.prerecorded.transcribeFile(
        audio,
        {
          model: "nova-3",
          language: "ja",
        },
      )) as DeepgramTranscriptionResponse;

      const transcript =
        response.result.results.channels[0]?.alternatives[0]?.transcript ?? "";

      const durationMs = Math.round(performance.now() - startTime);

      return {
        text: transcript,
        language: "ja",
        durationMs,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "不明なエラー";
      throw new Error(`Deepgram Nova STT変換に失敗しました: ${message}`);
    }
  }
}
